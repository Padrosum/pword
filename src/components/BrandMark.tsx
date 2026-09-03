import { cn } from '../lib/cn'

/** Registration-mark tile — Galley Proof Desk brand. */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={cn('size-6', className)}>
      <rect width="512" height="512" fill="#3f5244" />
      <g fill="none" stroke="#f2f0e9" strokeWidth="14">
        <path d="M48 48 H120 M48 48 V120" />
        <path d="M464 48 H392 M464 48 V120" />
        <path d="M48 464 H120 M48 464 V392" />
        <path d="M464 464 H392 M464 464 V392" />
      </g>
      <g transform="translate(-6 -2)">
        <path
          d="M176 124 H240 C318 124 368 170 368 236 C368 302 318 348 240 348 V396 H176 Z M240 284 C282 284 304 266 304 236 C304 206 282 188 240 188 Z"
          fill="#f2f0e9"
          fillRule="evenodd"
        />
        <rect x="398" y="204" width="44" height="44" fill="#f2f0e9" />
        <rect
          x="403"
          y="269"
          width="34"
          height="34"
          fill="none"
          stroke="#f2f0e9"
          strokeWidth="10"
        />
      </g>
    </svg>
  )
}
