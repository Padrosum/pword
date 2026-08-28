import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'
import { IconButton } from './ui/IconButton'
import { Menu } from './ui/Menu'
import type { SaveState } from '../types/document'
import { cn } from '../lib/cn'
import { SAVE_STATE_LABEL } from '../lib/saveState'

interface TopBarProps {
  title: string
  onTitleChange: (title: string) => void
  saveState: SaveState
  onBack: () => void
  menu: (close: () => void) => React.ReactNode
}

export function TopBar({ title, onTitleChange, saveState, onBack, menu }: TopBarProps) {
  return (
    <header className="no-print border-b border-line bg-surface">
      <div className="mx-auto flex h-12 max-w-6xl items-center gap-2 px-2 sm:px-4">
        <IconButton label="Back to documents" onClick={onBack}>
          <ArrowLeft className="size-4" />
        </IconButton>
        <div className="hidden items-center gap-2 sm:flex">
          <BrandMark />
          <span className="text-sm font-semibold tracking-tight text-ink">Pword</span>
        </div>

        <div className="mx-1 flex min-w-0 flex-1 justify-center">
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label="Document title"
            placeholder="Untitled document"
            className="h-8 w-full max-w-sm rounded-md border border-transparent bg-transparent px-2 text-center text-sm font-medium text-ink outline-none transition-colors hover:border-line focus:border-line focus:bg-canvas"
          />
        </div>

        <span
          className={cn(
            'hidden text-xs sm:inline',
            saveState === 'error' ? 'text-danger' : 'text-muted',
          )}
          role="status"
        >
          {SAVE_STATE_LABEL[saveState]}
        </span>

        <ThemeToggle />

        <Menu
          label="Document menu"
          align="end"
          trigger={({ toggle, open }) => (
            <IconButton label="Document menu" onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
              <MoreHorizontal className="size-4" />
            </IconButton>
          )}
        >
          {menu}
        </Menu>
      </div>
    </header>
  )
}
