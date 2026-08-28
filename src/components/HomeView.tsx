import { useRef, useState } from 'react'
import { BookOpen, Copy, FileUp, Image, MoreVertical, Music, Plus, Trash2 } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { Typewriter } from './Typewriter'
import { ThemeToggle } from './ThemeToggle'
import { Dialog } from './ui/Dialog'
import { IconButton } from './ui/IconButton'
import { Menu, MenuItem } from './ui/Menu'
import { formatDate } from '../lib/format'
import type { PadDocument } from '../types/document'

function FooterAppLink({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 rounded-sm text-muted underline-offset-2 transition-colors hover:text-accent hover:underline"
    >
      {icon}
      {label}
    </a>
  )
}

interface HomeViewProps {
  docs: PadDocument[]
  onCreate: () => void
  onOpen: (doc: PadDocument) => void
  onDuplicate: (doc: PadDocument) => void
  onDelete: (doc: PadDocument) => void
  onImport: (file: File) => void
  importing: boolean
}

export function HomeView({ docs, onCreate, onOpen, onDuplicate, onDelete, onImport, importing }: HomeViewProps) {
  const [pendingDelete, setPendingDelete] = useState<PadDocument | null>(null)
  const importInputRef = useRef<HTMLInputElement>(null)
  void importInputRef

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="no-print border-b border-line bg-surface">
        <div className="mx-auto flex h-12 max-w-2xl items-center gap-2 px-4">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight text-ink">Pword</span>
          <span className="ml-auto">
            <ThemeToggle />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-14">
        <section aria-labelledby="start-writing">
          <p className="font-mono text-sm font-medium text-accent">
            <Typewriter text="Pword" />
            <span className="sr-only">Pword — </span>
          </p>
          <h1 id="start-writing" className="mt-1 text-2xl font-bold tracking-tight text-ink">
            Simple documents. Private by design.
          </h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted">
            Write without the cloud. Your documents stay on this device — no account,
            no tracking, no uploads.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-accent px-5 text-sm font-semibold text-accent-contrast transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden="true" />
              Start writing
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              className="inline-flex h-10 items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium text-ink transition-colors hover:bg-accent-soft disabled:opacity-50"
            >
              <FileUp className="size-4" aria-hidden="true" />
              {importing ? 'Importing…' : 'Import .docx'}
            </button>
          </div>
        </section>

        <section aria-labelledby="recent-documents" className="mt-12">
          <h2 id="recent-documents" className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">
            Recent documents
          </h2>
          {docs.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              No documents yet. Everything you write is stored privately in this browser.
            </p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
              {docs.map((doc) => (
                <li key={doc.id}>
                  <div className="flex items-center gap-2 px-3 py-3 transition-colors hover:bg-accent-soft sm:px-4">
                    <button
                      type="button"
                      onClick={() => onOpen(doc)}
                      className="min-w-0 flex-1 text-left"
                      aria-label={`Open ${doc.title || 'Untitled document'}`}
                    >
                      <span className="block truncate text-sm font-medium text-ink">
                        {doc.title || 'Untitled document'}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        {formatDate(doc.updatedAt)}
                        <span aria-hidden="true"> · </span>
                        {doc.wordCount.toLocaleString()} {doc.wordCount === 1 ? 'word' : 'words'}
                      </span>
                    </button>
                    <Menu
                      label={`Actions for ${doc.title || 'Untitled document'}`}
                      align="end"
                      trigger={({ toggle, open }) => (
                        <IconButton
                          label={`Actions for ${doc.title || 'Untitled document'}`}
                          onClick={toggle}
                          aria-haspopup="menu"
                          aria-expanded={open}
                        >
                          <MoreVertical />
                        </IconButton>
                      )}
                    >
                      {(close) => (
                        <>
                          <MenuItem icon={<Copy className="size-4" />} onSelect={() => { close(); onDuplicate(doc) }}>
                            Duplicate
                          </MenuItem>
                          <MenuItem icon={<Trash2 className="size-4" />} danger onSelect={() => { close(); setPendingDelete(doc) }}>
                            Delete
                          </MenuItem>
                        </>
                      )}
                    </Menu>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <footer className="no-print border-t border-line bg-surface">
        <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-1.5">
            <span>Part of the Padros family:</span>
            <FooterAppLink
              href="https://pmusic.alihankarakus.com"
              label="Pmusic"
              icon={<Music className="size-3.5" aria-hidden="true" />}
            />
            <span aria-hidden="true">·</span>
            <FooterAppLink
              href="https://pixora.alihankarakus.com"
              label="Pixora"
              icon={<Image className="size-3.5" aria-hidden="true" />}
            />
            <span aria-hidden="true">·</span>
            <FooterAppLink
              href="https://alihankarakus.com"
              label="Ptree"
              icon={<BookOpen className="size-3.5" aria-hidden="true" />}
            />
          </p>
          <p>Stored locally · AGPL-3.0</p>
        </div>
      </footer>

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title="Delete this document?"
        description={`"${pendingDelete?.title || 'Untitled document'}" will be permanently removed from this device. This cannot be undone.`}
      >
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="h-9 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-accent-soft"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              if (pendingDelete) onDelete(pendingDelete)
              setPendingDelete(null)
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
          if (file) onImport(file)
          event.target.value = ''
        }}
      />
    </div>
  )
}

