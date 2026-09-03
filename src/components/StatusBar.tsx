import { CloudOff } from 'lucide-react'
import { useI18n } from '../i18n'
import type { SaveState } from '../types/document'
import { cn } from '../lib/cn'

interface StatusBarProps {
  words: number
  characters: number
  pages: number
  saveState: SaveState
}

export function StatusBar({ words, characters, pages, saveState }: StatusBarProps) {
  const { t } = useI18n()
  return (
    <footer className="galley-rail no-print border-t border-line bg-surface">
      <div className="mx-auto flex h-8 max-w-6xl items-center justify-between px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted sm:px-4">
        <p aria-label="Document statistics" className="tabular-nums normal-case tracking-normal">
          {words.toLocaleString()} {words === 1 ? t.wordSingular : t.wordPlural}
          <span aria-hidden="true" className="mx-1.5">·</span>
          {characters.toLocaleString()} {characters === 1 ? t.charSingular : t.charPlural}
          <span aria-hidden="true" className="mx-1.5">·</span>
          ~{pages} {pages === 1 ? t.pageSingular : t.pagePlural}
        </p>
        <p className="flex items-center gap-3">
          <span
            className={cn(
              saveState === 'error' ? 'inline text-danger' : 'hidden sm:inline',
            )}
            role="status"
            aria-live="polite"
          >
            {({ saved: t.proofSaved, saving: t.saving, unsaved: t.unsavedMarks, error: t.saveFailed } as const)[saveState]}
          </span>
          <span className="flex items-center gap-1.5" title="Documents are stored only in this browser">
            <CloudOff className="size-3" aria-hidden="true" />
            {t.local}
          </span>
        </p>
      </div>
    </footer>
  )
}
