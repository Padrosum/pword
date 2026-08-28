import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
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
import { countCharacters, countWords } from '../lib/textStats'
import { downloadBlob, sanitizeFilename } from '../lib/download'
import { toast } from '../lib/toast'
import { jsonToPlainText, createDocument } from '../storage/documents'
import { exportDocx } from '../export/docx'
import { printDocument } from '../export/print'
import { importDocx } from '../import/docx'
import type { DocumentRepository } from '../storage/documents'
import type { PadDocument } from '../types/document'

interface EditorViewProps {
  doc: PadDocument
  repository: DocumentRepository
  onBack: () => void
  onOpenDoc: (doc: PadDocument) => void
}

export function EditorView({ doc, repository, onBack, onOpenDoc }: EditorViewProps) {
  const [title, setTitle] = useState(doc.title)
  const [stats, setStats] = useState({ words: doc.wordCount, chars: doc.charCount, pages: 1 })
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const importInputRef = useRef<HTMLInputElement>(null)

  // Latest document snapshot, used by autosave and exports without re-rendering.
  const latestDocRef = useRef<PadDocument>(doc)
  const titleRef = useRef(title)

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

  const { state: saveState, schedule, flush } = useAutosave(
    useCallback(
      async (updated: PadDocument) => {
        await repository.save(updated)
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

  const editor = useEditor({
    extensions,
    content: doc.content,
    editorProps: {
      attributes: {
        'aria-label': 'Document content',
        spellcheck: 'true',
      },
    },
    onUpdate: ({ editor: current }) => {
      const content = current.getJSON()
      const text = jsonToPlainText(content)
      const updated: PadDocument = {
        ...latestDocRef.current,
        title: titleRef.current,
        content,
        wordCount: countWords(text),
        charCount: countCharacters(text),
        updatedAt: Date.now(),
      }
      latestDocRef.current = updated
      setStats((prev) => ({ ...prev, words: updated.wordCount, chars: updated.charCount }))
      schedule(updated)
    },
  })

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
        flush()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [flush])

  const exportToDocx = async () => {
    try {
      flush()
      const blob = await exportDocx(latestDocRef.current)
      downloadBlob(blob, `${sanitizeFilename(latestDocRef.current.title, 'document')}.docx`)
    } catch (error) {
      console.error('[pword] docx export failed', error)
      toast('error', "Couldn't export this document. Your work is saved locally.")
    }
  }

  const duplicate = async () => {
    try {
      flush()
      const copy = createDocument(
        `${latestDocRef.current.title || 'Untitled document'} (copy)`,
        latestDocRef.current.content,
      )
      await repository.save(copy)
      onOpenDoc(copy)
    } catch (error) {
      console.error('[pword] duplicate failed', error)
      toast('error', "Couldn't duplicate this document.")
    }
  }

  const remove = async () => {
    try {
      await repository.remove(latestDocRef.current.id)
      onBack()
    } catch (error) {
      console.error('[pword] delete failed', error)
      toast('error', "Couldn't delete this document.")
    }
  }

  const importIntoNewDoc = async (file: File) => {
    try {
      const result = await importDocx(file)
      const imported = createDocument(result.title, result.content)
      await repository.save(imported)
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
    <div className="flex h-dvh flex-col">
      <TopBar
        title={title}
        onTitleChange={handleTitleChange}
        saveState={saveState}
        onBack={() => {
          flush()
          onBack()
        }}
        menu={(close) => (
          <>
            <MenuItem icon={<FilePlus2 className="size-4" />} onSelect={() => { close(); flush(); onOpenDoc(createDocument()) }}>
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
            className="h-9 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-accent-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              setDeleteDialogOpen(false)
              void remove()
            }}
            className="h-9 rounded-lg bg-danger px-4 text-sm font-medium text-white hover:opacity-90 dark:text-black"
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
