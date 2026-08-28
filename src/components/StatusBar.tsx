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
    <footer className="no-print border-t border-line bg-surface">
      <div className="mx-auto flex h-9 max-w-6xl items-center justify-between px-3 text-xs text-muted sm:px-4">
        <p aria-label="Document statistics">
          {words.toLocaleString()} {words === 1 ? 'word' : 'words'}
          <span aria-hidden="true" className="mx-1.5">·</span>
          {characters.toLocaleString()} {characters === 1 ? 'character' : 'characters'}
          <span aria-hidden="true" className="mx-1.5">·</span>
          ~{pages} {pages === 1 ? 'page' : 'pages'}
        </p>
        <p className="flex items-center gap-3">
          <span
            className={cn('hidden sm:inline', saveState === 'error' && 'text-danger')}
            role="status"
            aria-live="polite"
          >
            {SAVE_STATE_LABEL[saveState]}
          </span>
          <span className="flex items-center gap-1.5" title="Documents are stored only in this browser">
            <CloudOff className="size-3.5" aria-hidden="true" />
            Stored locally
          </span>
        </p>
      </div>
    </footer>
  )
}
