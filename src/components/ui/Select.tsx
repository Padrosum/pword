import { ChevronDown } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
  className?: string
}

/**
 * Styled native <select>. Native controls are keyboard- and
 * screen-reader-friendly by default and work well on touch devices.
 * The dropdown itself follows `color-scheme`, so it renders correctly
 * in light and dark mode (option colors are pinned in global.css).
 */
export function Select({ label, value, onChange, children, className }: SelectProps) {
  return (
    <span
      className={cn(
        'relative inline-flex h-7 items-center border border-line bg-surface',
        'transition-colors focus-within:border-accent hover:border-line-strong',
        className,
      )}
    >
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-full max-w-[10rem] cursor-pointer appearance-none truncate bg-transparent ps-2 pe-6 text-[13px] text-ink outline-none"
      >
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute end-1.5 size-3.5 shrink-0 text-muted"
        aria-hidden="true"
      />
    </span>
  )
}
