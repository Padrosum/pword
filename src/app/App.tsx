import { useCallback, useEffect, useMemo, useState } from 'react'
import { EditorView } from '../components/EditorView'
import { HomeView } from '../components/HomeView'
import { Toaster } from '../components/Toaster'
import { BrandMark } from '../components/BrandMark'
import { ThemeProvider } from '../hooks/useTheme'
import { toast } from '../lib/toast'
import { createDocument, DocumentRepository } from '../storage/documents'
import { Database } from '../storage/db'
import { SettingsRepository } from '../storage/settings'
import { importDocx } from '../import/docx'
import { DEFAULT_SETTINGS, type AppSettings, type PadDocument } from '../types/document'

export default function App() {
  const database = useMemo(() => new Database(), [])
  const docsRepository = useMemo(() => new DocumentRepository(database), [database])
  const settingsRepository = useMemo(() => new SettingsRepository(database), [database])

  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [docs, setDocs] = useState<PadDocument[] | null>(null)
  const [openDoc, setOpenDoc] = useState<PadDocument | null>(null)
  const [importing, setImporting] = useState(false)

  const persistSettings = useCallback(
    (patch: Partial<AppSettings> | ((prev: AppSettings) => AppSettings)) => {
      setSettings((prev) => {
        const next = typeof patch === 'function' ? patch(prev) : { ...prev, ...patch }
        void settingsRepository.save(next).catch((error) => {
          console.error('[pword] could not persist settings', error)
        })
        return next
      })
    },
    [settingsRepository],
  )

  // Bootstrap: load settings and documents; reopen the last document
  // so returning users continue where they left off.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const [loadedSettings, list] = await Promise.all([
          settingsRepository.load(),
          docsRepository.list(),
        ])
        if (cancelled) return
        setSettings(loadedSettings)
        setDocs(list)
        const last = loadedSettings.lastOpenedId
          ? list.find((d) => d.id === loadedSettings.lastOpenedId)
          : undefined
        if (last) setOpenDoc(last)
      } catch (error) {
        console.error('[pword] failed to load local data', error)
        if (!cancelled) {
          setDocs([])
          toast('error', "Couldn't read local storage. Documents may not persist.")
        }
      }
    })()
    return () => {
      cancelled = true
    }
  }, [docsRepository, settingsRepository])

  const openDocument = useCallback(
    (doc: PadDocument) => {
      setOpenDoc(doc)
      persistSettings({ lastOpenedId: doc.id })
    },
    [persistSettings],
  )

  const goHome = useCallback(() => {
    setOpenDoc(null)
    persistSettings({ lastOpenedId: null })
    void docsRepository
      .list()
      .then(setDocs)
      .catch((error) => console.error('[pword] could not refresh documents', error))
  }, [docsRepository, persistSettings])

  const createAndOpen = useCallback(async () => {
    try {
      const doc = createDocument()
      await docsRepository.insert(doc)
      setDocs((prev) => (prev ? [doc, ...prev] : prev))
      openDocument(doc)
    } catch (error) {
      console.error('[pword] could not create document', error)
      toast('error', "Couldn't create a new document.")
    }
  }, [docsRepository, openDocument])

  const duplicateDocument = useCallback(
    async (doc: PadDocument) => {
      try {
        const copy = createDocument(`${doc.title || 'Untitled document'} (copy)`, doc.content)
        await docsRepository.insert(copy)
        setDocs((prev) => (prev ? [copy, ...prev] : prev))
        openDocument(copy)
      } catch (error) {
        console.error('[pword] could not duplicate document', error)
        toast('error', "Couldn't duplicate this document.")
      }
    },
    [docsRepository, openDocument],
  )

  const deleteDocument = useCallback(
    async (doc: PadDocument) => {
      try {
        await docsRepository.remove(doc.id)
        setDocs((prev) => (prev ? prev.filter((d) => d.id !== doc.id) : prev))
        if (openDoc?.id === doc.id) setOpenDoc(null)
        persistSettings((prev) =>
          prev.lastOpenedId === doc.id ? { ...prev, lastOpenedId: null } : prev,
        )
      } catch (error) {
        console.error('[pword] could not delete document', error)
        toast('error', "Couldn't delete this document.")
      }
    },
    [docsRepository, openDoc, persistSettings],
  )

  const importDocument = useCallback(
    async (file: File) => {
      setImporting(true)
      try {
        const result = await importDocx(file)
        const imported = createDocument(result.title, result.content)
        await docsRepository.insert(imported)
        setDocs((prev) => (prev ? [imported, ...prev] : prev))
        openDocument(imported)
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
      } finally {
        setImporting(false)
      }
    },
    [docsRepository, openDocument],
  )

  if (!docs) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-3 text-muted">
        <BrandMark className="size-10" />
        <p className="text-sm" role="status">Loading…</p>
      </div>
    )
  }

  return (
    <ThemeProvider initialMode={settings.theme} onModeChange={(mode) => persistSettings({ theme: mode })}>
      {openDoc ? (
        <EditorView
          key={openDoc.id}
          doc={openDoc}
          repository={docsRepository}
          onBack={goHome}
          onOpenDoc={openDocument}
          onCreateDocument={createAndOpen}
        />
      ) : (
        <HomeView
          docs={docs}
          onCreate={() => void createAndOpen()}
          onOpen={openDocument}
          onDuplicate={(doc) => void duplicateDocument(doc)}
          onDelete={(doc) => void deleteDocument(doc)}
          onImport={(file) => void importDocument(file)}
          importing={importing}
        />
      )}
      <Toaster />
    </ThemeProvider>
  )
}
