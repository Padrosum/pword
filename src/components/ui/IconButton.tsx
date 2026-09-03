import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /** Required accessible name — icon-only buttons must be labelled. */
  label: string
  active?: boolean
  children: ReactNode
}

export function IconButton({ label, active, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active === undefined ? undefined : active}
      className={cn(
        'inline-flex size-8 shrink-0 items-center justify-center text-muted transition-colors',
        'hover:bg-accent-soft hover:text-ink',
        'disabled:pointer-events-none disabled:opacity-40',
        active && 'bg-accent-soft text-accent',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
