import { useRef, useState } from 'react'
import { useI18n } from '../i18n'
import { BookOpen, Copy, FileUp, Image, MoreVertical, Music, Plus, Trash2 } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
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
      className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-[0.08em] text-muted underline-offset-2 transition-colors hover:text-accent hover:underline"
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
  const { t } = useI18n()

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="no-print border-b border-line bg-surface">
        <div className="mx-auto flex h-11 max-w-2xl items-center gap-2.5 px-4">
          <BrandMark />
          <span className="text-[15px] font-semibold tracking-tight text-ink">Pword</span>
          <span className="ml-auto flex items-center gap-1">
            <LanguageToggle />
            <ThemeToggle />
          </span>
        </div>
      </header>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 pb-16 pt-10">
        <section aria-labelledby="start-writing">
          <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
            {t.onThisDevice}
          </p>
          <h1 id="start-writing" className="mt-2 text-[1.75rem] font-semibold leading-tight tracking-tight text-ink">
            {t.proofDesk}
          </h1>
          <p className="mt-2 max-w-md text-[15px] leading-relaxed text-muted">
            {t.writePrivately}
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onCreate}
              className="inline-flex h-10 items-center gap-2 bg-accent px-5 text-sm font-semibold tracking-wide text-accent-contrast transition-opacity hover:opacity-90"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t.startWriting}
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              disabled={importing}
              className="inline-flex h-10 items-center gap-2 border border-line bg-transparent px-4 text-sm font-medium text-ink transition-colors hover:bg-accent-soft disabled:opacity-50"
            >
              <FileUp className="size-4" aria-hidden="true" />
              {importing ? t.importing : t.importDocx}
            </button>
          </div>
        </section>

        <section aria-labelledby="recent-documents" className="mt-12">
          <div className="mb-0 flex items-baseline justify-between border-b border-line pb-2">
            <h2 id="recent-documents" className="font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
              {t.recentGalleys}
            </h2>
            <span className="font-mono text-[11px] tabular-nums text-muted">
              {docs.length}
            </span>
          </div>
          {docs.length === 0 ? (
            <p className="border-b border-line px-0 py-8 text-[15px] text-muted">
              {t.noGalleysYet}
            </p>
          ) : (
            <ul className="border-b border-line">
              {docs.map((doc) => (
                <li key={doc.id} className="border-b border-line last:border-b-0">
                  <div className="flex items-center gap-2 py-3 transition-colors hover:bg-accent-soft">
                    <button
                      type="button"
                      onClick={() => onOpen(doc)}
                      className="min-w-0 flex-1 text-left"
                      aria-label={`Open ${doc.title || t.untitledDocument}`}
                    >
                      <span className="block truncate text-[15px] font-medium text-ink">
                        {doc.title || t.untitledDocument}
                      </span>
                      <span className="mt-0.5 block font-mono text-[11px] tabular-nums tracking-wide text-muted">
                        {formatDate(doc.updatedAt, t)}
                        <span aria-hidden="true"> · </span>
                        {doc.wordCount.toLocaleString()} {doc.wordCount === 1 ? t.wordSingular : t.wordPlural}
                      </span>
                    </button>
                    <Menu
                      label={`Actions for ${doc.title || t.untitledDocument}`}
                      align="end"
                      trigger={({ toggle, open }) => (
                        <IconButton
                          label={`Actions for ${doc.title || t.untitledDocument}`}
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
                            {t.duplicate}
                          </MenuItem>
                          <MenuItem icon={<Trash2 className="size-4" />} danger onSelect={() => { close(); setPendingDelete(doc) }}>
                            {t.delete}
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
        <div className="mx-auto flex max-w-2xl flex-col gap-2 px-4 py-4 text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="flex flex-wrap items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.08em]">
            <span className="normal-case tracking-normal text-muted">{t.padros}</span>
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
          <p className="font-mono text-[11px] uppercase tracking-[0.08em]">{t.storedLocally} · {t.agpl}</p>
        </div>
      </footer>

      <Dialog
        open={pendingDelete !== null}
        onClose={() => setPendingDelete(null)}
        title={t.deleteTitle}
        description={t.deleteDescription(pendingDelete?.title || t.untitledDocument)}
      >
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setPendingDelete(null)}
            className="h-9 border border-line px-4 text-sm font-medium text-ink hover:bg-accent-soft"
          >
            {t.cancel}
          </button>
          <button
            type="button"
            onClick={() => {
              if (pendingDelete) onDelete(pendingDelete)
              setPendingDelete(null)
            }}
            className="h-9 bg-danger px-4 text-sm font-medium text-white hover:opacity-90 dark:text-black"
          >
            {t.delete}
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
