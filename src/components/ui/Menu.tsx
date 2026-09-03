import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '../../lib/cn'

interface MenuProps {
  trigger: (props: { open: boolean; toggle: () => void; id: string }) => ReactNode
  label: string
  align?: 'start' | 'end'
  children: (close: () => void) => ReactNode
  className?: string
}

/**
 * Lightweight accessible dropdown menu.
 *
 * The panel is rendered in a portal with `position: fixed`, so it is never
 * clipped by scrollable toolbar containers and stays inside the viewport
 * (this also keeps it correct in dark mode and on small screens).
 * Closes on outside click and Escape; restores focus to the trigger.
 */
export function Menu({ trigger, label, align = 'start', children, className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  const focusTrigger = () => {
    const triggerEl = rootRef.current?.firstElementChild as HTMLElement | null
    triggerEl?.focus()
  }

  const closeAndRefocus = () => {
    setOpen(false)
    focusTrigger()
  }

  // Position the fixed panel against the trigger, clamped to the viewport.
  useLayoutEffect(() => {
    if (!open) return
    const panel = panelRef.current
    const anchor = rootRef.current?.firstElementChild as HTMLElement | null
    if (!panel || !anchor) return

    const update = () => {
      const rect = anchor.getBoundingClientRect()
      const margin = 8
      const width = panel.offsetWidth
      const height = panel.offsetHeight
      let left = align === 'start' ? rect.left : rect.right - width
      left = Math.min(Math.max(margin, left), window.innerWidth - width - margin)
      let top = rect.bottom + 6
      if (top + height > window.innerHeight - margin) {
        top = Math.max(margin, rect.top - height - 6)
      }
      panel.style.left = `${Math.round(left)}px`
      panel.style.top = `${Math.round(top)}px`
      panel.style.visibility = 'visible'
    }

    update()
    const observer = new ResizeObserver(update)
    observer.observe(panel)
    window.addEventListener('resize', update)
    document.addEventListener('scroll', update, true)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', update)
      document.removeEventListener('scroll', update, true)
    }
  }, [open, align])

  // Outside click, Escape, and focus + arrow-key navigation for the panel.
  useEffect(() => {
    if (!open) return

    panelRef.current?.focus({ preventScroll: true })

    const isInside = (target: Node) =>
      (rootRef.current?.contains(target) ?? false) ||
      (panelRef.current?.contains(target) ?? false)

    const onPointerDown = (event: PointerEvent) => {
      if (!isInside(event.target as Node)) setOpen(false)
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
        setOpen(false)
        focusTrigger()
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  const onPanelKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()
    const items = Array.from(
      panelRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])') ?? [],
    )
    if (items.length === 0) return
    const index = items.indexOf(document.activeElement as HTMLElement)
    const next =
      event.key === 'ArrowDown'
        ? (index + 1) % items.length
        : (index - 1 + items.length) % items.length
    items[next]!.focus()
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      {trigger({
        open,
        toggle: () => setOpen((o) => !o),
        id: menuId,
      })}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            id={menuId}
            role="menu"
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onPanelKeyDown}
            style={{ visibility: 'hidden' }}
            className={cn(
              'fixed z-50 min-w-44 border border-line bg-surface py-1',
              'shadow-[0_8px_24px_rgba(20,15,5,0.12)] outline-none',
              'dark:shadow-[0_8px_24px_rgba(0,0,0,0.55)]',
            )}
          >
            {children(closeAndRefocus)}
          </div>,
          document.body,
        )}
    </div>
  )
}

interface MenuItemProps {
  onSelect: () => void
  children: ReactNode
  disabled?: boolean
  danger?: boolean
  icon?: ReactNode
}

export function MenuItem({ onSelect, children, disabled, danger, icon }: MenuItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-ink transition-colors',
        'hover:bg-accent-soft focus-visible:bg-accent-soft focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-40',
        danger && 'text-danger',
      )}
    >
      {icon && <span className="text-muted [&_svg]:size-4">{icon}</span>}
      {children}
    </button>
  )
}

export function MenuSeparator() {
  return <hr className="my-1 border-line" role="separator" />
}
