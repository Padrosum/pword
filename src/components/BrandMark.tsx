import { cn } from '../lib/cn'

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 512 512" aria-hidden="true" className={cn('size-6', className)}>
      <defs>
        <linearGradient id="pword-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: '#8b5cf6' }} />
          <stop offset="1" style={{ stopColor: '#6d28d9' }} />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="116" fill="url(#pword-tile)" />
      <g transform="translate(-10 -4)">
        {/* Letter P: 64-unit stroke, optical bowl */}
        <path
          d="M176 124 H240 C318 124 368 170 368 236 C368 302 318 348 240 348 V396 H176 Z M240 284 C282 284 304 266 304 236 C304 206 282 188 240 188 Z"
          fill="#fdfcf9"
          fillRule="evenodd"
        />
        {/* Two squares: page motif */}
        <rect x="398" y="204" width="44" height="44" rx="12" fill="#fdfcf9" />
        <rect
          x="403"
          y="269"
          width="34"
          height="34"
          rx="10"
          fill="none"
          stroke="#fdfcf9"
          strokeWidth="10"
        />
      </g>
    </svg>
  )
}
