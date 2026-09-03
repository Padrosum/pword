import { CloudOff } from 'lucide-react'
import { SAVE_STATE_LABEL } from '../lib/saveState'
import type { SaveState } from '../types/document'
import { cn } from '../lib/cn'

interface StatusBarProps {
  words: number
  characters: number
  pages: number
  saveState: SaveState
}

export function StatusBar({ words, characters, pages, saveState }: StatusBarProps) {
  return (
    <footer className="galley-rail no-print border-t border-line bg-surface">
      <div className="mx-auto flex h-8 max-w-6xl items-center justify-between px-3 font-mono text-[11px] uppercase tracking-[0.08em] text-muted sm:px-4">
        <p aria-label="Document statistics" className="tabular-nums normal-case tracking-normal">
          {words.toLocaleString()} {words === 1 ? 'word' : 'words'}
          <span aria-hidden="true" className="mx-1.5">·</span>
          {characters.toLocaleString()} {characters === 1 ? 'char' : 'chars'}
          <span aria-hidden="true" className="mx-1.5">·</span>
          ~{pages} {pages === 1 ? 'page' : 'pages'}
        </p>
        <p className="flex items-center gap-3">
          <span
            className={cn(
              saveState === 'error' ? 'inline text-danger' : 'hidden sm:inline',
            )}
            role="status"
            aria-live="polite"
          >
            {SAVE_STATE_LABEL[saveState]}
          </span>
          <span className="flex items-center gap-1.5" title="Documents are stored only in this browser">
            <CloudOff className="size-3" aria-hidden="true" />
            Local
          </span>
        </p>
      </div>
    </footer>
  )
}
