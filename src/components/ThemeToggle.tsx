import { Monitor, Moon, Sun } from 'lucide-react'
import { Menu, MenuItem, MenuSeparator } from './ui/Menu'
import { useTheme } from '../hooks/useTheme'
import { useI18n } from '../i18n'
import type { ThemeMode } from '../types/document'

const THEME_OPTIONS: { id: ThemeMode; icon: typeof Sun }[] = [
  { id: 'light', icon: Sun },
  { id: 'dark', icon: Moon },
  { id: 'system', icon: Monitor },
]

export function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const { t } = useI18n()

  const labelMap: Record<ThemeMode, string> = {
    light: t.themeLight,
    dark: t.themeDark,
    system: t.themeSystem,
  }

  const current = THEME_OPTIONS.find((o) => o.id === mode) ?? THEME_OPTIONS[2]!
  const currentLabel = labelMap[current.id]

  return (
    <Menu
      label="Theme"
      align="end"
      trigger={({ toggle, open }) => (
        <button
          type="button"
          onClick={toggle}
          aria-haspopup="menu"
          aria-expanded={open}
          aria-label={`Theme: ${currentLabel}`}
          title={`Theme: ${currentLabel}`}
          className="inline-flex size-8 items-center justify-center text-muted transition-colors hover:bg-accent-soft hover:text-ink"
        >
          <current.icon className="size-4" />
        </button>
      )}
    >
      {(close) => (
        <>
          {THEME_OPTIONS.map((option) => (
            <MenuItem
              key={option.id}
              icon={<option.icon className="size-4" />}
              onSelect={() => { setMode(option.id); close() }}
            >
              {labelMap[option.id]}
              {mode === option.id && <span aria-hidden="true" className="ml-auto text-accent">✓</span>}
            </MenuItem>
          ))}
          <MenuSeparator />
          <p className="px-3 py-1.5 text-xs text-muted">{t.storedLocally}</p>
        </>
      )}
    </Menu>
  )
}
