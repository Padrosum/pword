import type { Strings } from '../i18n/types'

export function formatDate(timestamp: number, t?: Pick<Strings, 'justNow' | 'minutesAgo' | 'hoursAgo'>): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = 60_000
  const hours = 60 * minutes
  const days = 24 * hours

  if (diff < minutes) return t?.justNow ?? 'Just now'
  if (diff < hours) {
    const m = Math.floor(diff / minutes)
    return t?.minutesAgo?.(m) ?? `${m} minute${m === 1 ? '' : 's'} ago`
  }
  if (diff < days) {
    const h = Math.floor(diff / hours)
    return t?.hoursAgo?.(h) ?? `${h} hour${h === 1 ? '' : 's'} ago`
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
