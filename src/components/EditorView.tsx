import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import type { Editor } from '@tiptap/core'
import {
  Copy,
  FileDown,
  FilePlus2,
  FileUp,
  Printer,
  Trash2,
} from 'lucide-react'
import { TopBar } from './TopBar'
import { Toolbar } from './Toolbar'
import { StatusBar } from './StatusBar'
import { Dialog } from './ui/Dialog'
import { MenuItem, MenuSeparator } from './ui/Menu'
import { buildExtensions } from '../editor/extensions'
import { createPaginationPlugin } from '../editor/pagination'
import { useAutosave } from '../hooks/useAutosave'
import { clearPendingSave, consumePendingSave } from '../lib/lifecyclePersist'
import { countCharacters, countWords } from '../lib/textStats'
import { downloadBlob, sanitizeFilename } from '../lib/download'
import { throttle } from '../lib/debounce'
import { toast } from '../lib/toast'
import {
  jsonToPlainText,
  createDocument,
  RevisionConflictError,
} from '../storage/documents'
import { isQuotaError } from '../storage/db'
import { exportDocx } from '../export/docx'
import { printDocument } from '../export/print'
import { importDocx } from '../import/docx'
import type { DocumentRepository } from '../storage/documents'
import type { DocumentContent, PadDocument } from '../types/document'

/** Spellcheck across tens of thousands of words stalls typing; disable above this doc size. */
const SPELLCHECK_SIZE_LIMIT = 40_000

function plainTextFromEditor(editor: Editor): string {
  return editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n')
}

interface EditorViewProps {
  doc: PadDocument
  repository: DocumentRepository
  onBack: () => void
  onOpenDoc: (doc: PadDocument) => void
  onCreateDocument: () => Promise<void>
}

export function EditorView({ doc, repository, onBack, onOpenDoc, onCreateDocument }: EditorViewProps) {
  const [title, setTitle] = useState(doc.title)
  const [stats, setStats] = useState({ words: doc.wordCount, chars: doc.charCount, pages: 1 })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Latest document snapshot, used by autosave and exports without re-rendering.
  const latestDocRef = useRef<PadDocument>(doc)
  const titleRef = useRef(title)
  const revisionRef = useRef(doc.revision ?? 0)
  const conflictNotifiedRef = useRef(false)
  const recoveredRef = useRef(false)
  const editorRef = useRef<Editor | null>(null)
  const editedAtRef = useRef(doc.updatedAt)

  useEffect(() => {
    conflictNotifiedRef.current = false
    recoveredRef.current = false
  }, [doc.id])

  useEffect(() => {
    titleRef.current = title
  }, [title])

  // Reflect the document title in the browser tab.
  useEffect(() => {
    const previous = document.title
    document.title = title ? `${title} — Pword` : 'Pword'
    return () => {
      document.title = previous
    }
  }, [title])

  const { state: saveState, schedule, flush, pauseAndDiscard, resume } = useAutosave(
    useCallback(
      async (updated: PadDocument) => {
        try {
          const saved = await repository.update(updated, revisionRef.current)
          revisionRef.current = saved.revision ?? revisionRef.current + 1
          clearPendingSave(updated.id)
          if (latestDocRef.current.updatedAt === updated.updatedAt) {
            latestDocRef.current = { ...latestDocRef.current, revision: revisionRef.current }
          }
        } catch (error) {
          if (error instanceof RevisionConflictError) {
            if (!conflictNotifiedRef.current) {
              conflictNotifiedRef.current = true
              toast('error', 'This document changed in another tab. Reload it before continuing.')
            }
          } else if (isQuotaError(error)) {
            toast('error', 'Storage is full on this device. Remove images or free browser storage.')
          }
          throw error
        }
      },
      [repository],
    ),
  )

  // Page count comes from the pagination plugin, which measures the real
  // flow layout (pages break by height, like a word processor).
  const onPageCount = useCallback((count: number) => {
    setStats((prev) => (prev.pages === count ? prev : { ...prev, pages: count }))
  }, [])

  const extensions = useMemo(
    () => [...buildExtensions(), createPaginationPlugin({ onPageCount })],
    [onPageCount],
  )

  const publishStats = useMemo(
    () =>
      throttle((editor: Editor) => {
        const text = plainTextFromEditor(editor)
        const words = countWords(text)
        const chars = countCharacters(text)
        latestDocRef.current = {
          ...latestDocRef.current,
          wordCount: words,
          charCount: chars,
        }
        setStats((prev) =>
          prev.words === words && prev.chars === chars
            ? prev
            : { ...prev, words, chars },
        )
      }, 200),
    [],
  )

  const snapshotFromEditor = useCallback((): PadDocument => {
    const current = editorRef.current
    const content = (current?.getJSON() ?? latestDocRef.current.content) as DocumentContent
    const text = current ? plainTextFromEditor(current) : jsonToPlainText(content)
    const updated: PadDocument = {
      ...latestDocRef.current,
      title: titleRef.current,
      content,
      wordCount: countWords(text),
      charCount: countCharacters(text),
      updatedAt: editedAtRef.current,
    }
    latestDocRef.current = updated
    return updated
  }, [])

  const editor = useEditor({
    extensions,
    content: doc.content,
    shouldRerenderOnTransaction: false,
    editorProps: {
      attributes: {
        'aria-label': 'Document content',
        spellcheck: 'true',
      },
    },
    onCreate: ({ editor: current }) => {
      editorRef.current = current
    },
    onDestroy: () => {
      editorRef.current = null
    },
    onUpdate: ({ editor: current }) => {
      editorRef.current = current
      editedAtRef.current = Date.now()
      latestDocRef.current = {
        ...latestDocRef.current,
        title: titleRef.current,
        updatedAt: editedAtRef.current,
      }
      publishStats(current)

      const dom = current.view.dom
      const spellcheck = current.state.doc.content.size < SPELLCHECK_SIZE_LIMIT ? 'true' : 'false'
      if (dom.getAttribute('spellcheck') !== spellcheck) {
        dom.setAttribute('spellcheck', spellcheck)
      }

      // Serialize JSON only when the autosave debounce fires (or on flush).
      schedule(snapshotFromEditor)
    },
  })

  // Recover a synchronous sessionStorage snapshot written during pagehide.
  useEffect(() => {
    if (!editor || recoveredRef.current) return
    recoveredRef.current = true

    const pending = consumePendingSave(doc.id)
    if (!pending || pending.updatedAt <= doc.updatedAt) return

    editor.commands.setContent(pending.content, false)
    setTitle(pending.title)
    titleRef.current = pending.title
    const text = jsonToPlainText(pending.content)
    const restored: PadDocument = {
      ...pending,
      revision: revisionRef.current,
      wordCount: countWords(text),
      charCount: countCharacters(text),
    }
    latestDocRef.current = restored
    setStats((prev) => ({
      ...prev,
      words: restored.wordCount,
      chars: restored.charCount,
    }))
    schedule(restored)
    toast('info', 'Restored unsaved changes from your last session.')
  }, [doc.id, doc.updatedAt, editor, schedule])

  const handleTitleChange = (nextTitle: string) => {
    setTitle(nextTitle)
    const updated: PadDocument = {
      ...latestDocRef.current,
      title: nextTitle,
      updatedAt: Date.now(),
    }
    latestDocRef.current = updated
    schedule(updated)
  }

  // Manual save with Ctrl/Cmd+S.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
        event.preventDefault()
        void flush().then((saved) => {
          if (!saved) toast('error', 'Save failed. Try again in a moment.')
        })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [flush])

  const exportToDocx = async () => {
    try {
      if (!(await flush())) {
        toast('error', 'Save failed. Export was cancelled so your changes are not hidden.')
        return
      }
      const blob = await exportDocx(latestDocRef.current)
      downloadBlob(blob, `${sanitizeFilename(latestDocRef.current.title, 'document')}.docx`)
    } catch (error) {
      console.error('[pword] docx export failed', error)
      toast('error', "Couldn't export this document. Your work is saved locally.")
    }
  }

  const duplicate = async () => {
    try {
      if (!(await flush())) {
        toast('error', 'Save failed. Duplicate was cancelled to protect your changes.')
        return
      }
      const copy = createDocument(
        `${latestDocRef.current.title || 'Untitled document'} (copy)`,
        latestDocRef.current.content,
      )
      await repository.insert(copy)
      onOpenDoc(copy)
    } catch (error) {
      console.error('[pword] duplicate failed', error)
      toast('error', "Couldn't duplicate this document.")
    }
  }

  const remove = async () => {
    try {
      await pauseAndDiscard()
      await repository.remove(latestDocRef.current.id)
      onBack()
    } catch (error) {
      resume()
      console.error('[pword] delete failed', error)
      toast('error', "Couldn't delete this document.")
    }
  }

  const importIntoNewDoc = async (file: File) => {
    try {
      if (!(await flush())) {
        toast('error', 'Save failed. Import was cancelled to protect your changes.')
        return
      }
      const result = await importDocx(file)
      const imported = createDocument(result.title, result.content)
      await repository.insert(imported)
      onOpenDoc(imported)
      if (result.warnings > 0) {
        toast('info', `Imported with ${result.warnings} unsupported formatting note(s).`)
      }
    } catch (error) {
      console.error('[pword] import failed', error)
      toast(
        'error',
        error instanceof Error && error.name === 'DocxImportError'
          ? error.message
          : "Couldn't open this document. The file may be corrupted or contain unsupported formatting.",
      )
    }
  }

  return (
    <div
      className="flex h-dvh flex-col"
      onFocusCapture={() => {
        document.documentElement.style.setProperty('--chrome-dim', '0.72')
      }}
      onBlurCapture={(event) => {
        const next = event.relatedTarget as Node | null
        if (next && event.currentTarget.contains(next)) return
        document.documentElement.style.setProperty('--chrome-dim', '1')
      }}
    >
      <TopBar
        title={title}
        onTitleChange={handleTitleChange}
        saveState={saveState}
        onBack={() => {
          void (async () => {
            if (await flush()) onBack()
            else toast('error', 'Save failed. Stay on this document and try again.')
          })()
        }}
        menu={(close) => (
          <>
            <MenuItem icon={<FilePlus2 className="size-4" />} onSelect={() => {
              close()
              void (async () => {
                if (await flush()) await onCreateDocument()
                else toast('error', 'Save failed. Stay on this document and try again.')
              })()
            }}>
              New document
            </MenuItem>
            <MenuItem icon={<FileUp className="size-4" />} onSelect={() => { close(); importInputRef.current?.click() }}>
              Import .docx…
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Copy className="size-4" />} onSelect={() => { close(); void duplicate() }}>
              Duplicate
            </MenuItem>
            <MenuItem icon={<FileDown className="size-4" />} onSelect={() => { close(); void exportToDocx() }}>
              Export as .docx
            </MenuItem>
            <MenuItem icon={<Printer className="size-4" />} onSelect={() => { close(); printDocument() }}>
              Print / Save as PDF
            </MenuItem>
            <MenuSeparator />
            <MenuItem icon={<Trash2 className="size-4" />} danger onSelect={() => { close(); setDeleteDialogOpen(true) }}>
              Delete document
            </MenuItem>
          </>
        )}
      />

      {editor && <Toolbar editor={editor} />}

      <main className="print-area flex-1 overflow-auto bg-canvas px-3 py-6 sm:px-6 sm:py-10">
        <div className="pages mx-auto">
          <div className="page">
            <EditorContent editor={editor} />
          </div>
        </div>
      </main>

      <StatusBar words={stats.words} characters={stats.chars} pages={stats.pages} saveState={saveState} />

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        title="Delete this document?"
        description={`"${title || 'Untitled document'}" will be permanently removed from this device. This cannot be undone.`}
      >
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleteDialogOpen(false)}
            className="h-9 border border-line px-4 text-sm font-medium text-ink hover:bg-accent-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteDialogOpen(false)
              void remove()
            }}
            className="h-9 bg-danger px-4 text-sm font-medium text-white hover:opacity-90 dark:text-black"
          >
            Delete
          </button>
        </div>
      </Dialog>

      <input
        ref={importInputRef}
        type="file"
        accept=".docx"
        className="sr-only"
        aria-label="Import DOCX file"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) void importIntoNewDoc(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}
