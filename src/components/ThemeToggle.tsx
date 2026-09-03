import { Monitor, Moon, Sun } from 'lucide-react'
import { Menu, MenuItem, MenuSeparator } from './ui/Menu'
import { useTheme } from '../hooks/useTheme'
import type { ThemeMode } from '../types/document'

const OPTIONS: { id: ThemeMode; label: string; icon: typeof Sun }[] = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
]

export function ThemeToggle() {
  const { mode, setMode } = useTheme()
  const current = OPTIONS.find((o) => o.id === mode) ?? OPTIONS[2]!

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
          aria-label={`Theme: ${current.label}`}
          title={`Theme: ${current.label}`}
          className="inline-flex size-8 items-center justify-center text-muted transition-colors hover:bg-accent-soft hover:text-ink"
        >
          <current.icon className="size-4" />
        </button>
      )}
    >
      {(close) => (
        <>
          {OPTIONS.map((option) => (
            <MenuItem
              key={option.id}
              icon={<option.icon className="size-4" />}
              onSelect={() => { setMode(option.id); close() }}
            >
              {option.label}
              {mode === option.id && <span aria-hidden="true" className="ml-auto text-accent">✓</span>}
            </MenuItem>
          ))}
          <MenuSeparator />
          <p className="px-3 py-1.5 text-xs text-muted">Theme stays on this device.</p>
        </>
      )}
    </Menu>
  )
}
