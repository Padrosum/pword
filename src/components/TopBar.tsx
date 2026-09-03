import { ArrowLeft, MoreHorizontal } from 'lucide-react'
import { useI18n } from '../i18n'
import { BrandMark } from './BrandMark'
import { ThemeToggle } from './ThemeToggle'
import { LanguageToggle } from './LanguageToggle'
import { IconButton } from './ui/IconButton'
import { Menu } from './ui/Menu'
import type { SaveState } from '../types/document'
import { cn } from '../lib/cn'

interface TopBarProps {
  title: string
  onTitleChange: (title: string) => void
  saveState: SaveState
  onBack: () => void
  menu: (close: () => void) => React.ReactNode
}

export function TopBar({ title, onTitleChange, saveState, onBack, menu }: TopBarProps) {
  const { t } = useI18n()
  return (
    <header className="galley-rail no-print border-b border-line bg-surface">
      <div className="mx-auto flex h-11 max-w-6xl items-center gap-1.5 px-2 sm:px-4">
        <IconButton label={t.backToDocuments} onClick={onBack}>
          <ArrowLeft className="size-4" />
        </IconButton>
        <div className="hidden items-center gap-2 sm:flex">
          <BrandMark className="size-5" />
          <span className="text-sm font-semibold tracking-tight text-ink">Pword</span>
        </div>

        <div className="mx-1 flex min-w-0 flex-1 justify-center">
          <input
            type="text"
            value={title}
            onChange={(event) => onTitleChange(event.target.value)}
            aria-label={t.documentTitle}
            placeholder={t.untitledDocument}
            className="h-8 w-full max-w-sm border border-transparent bg-transparent px-2 text-center text-sm font-medium text-ink outline-none transition-colors hover:border-line focus:border-line focus:bg-canvas"
          />
        </div>

        <span
          className={cn(
            'font-mono text-[11px] uppercase tracking-[0.08em]',
            saveState === 'error' ? 'inline text-danger' : 'hidden text-muted sm:inline',
          )}
          role="status"
        >
          {({ saved: t.proofSaved, saving: t.saving, unsaved: t.unsavedMarks, error: t.saveFailed } as const)[saveState]}
        </span>

        <LanguageToggle />
        <ThemeToggle />

        <Menu
          label={t.documentMenu}
          align="end"
          trigger={({ toggle, open }) => (
            <IconButton label={t.documentMenu} onClick={toggle} aria-haspopup="menu" aria-expanded={open}>
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
