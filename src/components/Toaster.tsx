import { useSyncExternalStore } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/cn'
import * as toastStore from '../lib/toast'

export function Toaster() {
  const toasts = useSyncExternalStore(toastStore.subscribe, toastStore.getToasts, toastStore.getToasts)

  if (toasts.length === 0) return null

  return (
    <div aria-live="polite" role="status" className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            'pointer-events-auto flex max-w-md items-center gap-3 border px-4 py-2.5 text-sm shadow-[0_8px_24px_rgba(26,26,24,0.14)]',
            t.kind === 'error'
              ? 'border-danger/30 bg-surface text-danger'
              : 'border-line bg-surface text-ink',
          )}
        >
          <span>{t.message}</span>
          <button
            type="button"
            onClick={() => toastStore.dismiss(t.id)}
            className="ml-auto text-muted hover:text-ink"
            aria-label="Dismiss notification"
          >
            <X className="size-4" />
          </button>
        </div>
      ))}
    </div>
  )
}
