export function formatDate(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = 60_000
  const hours = 60 * minutes
  const days = 24 * hours

  if (diff < minutes) return 'Just now'
  if (diff < hours) {
    const m = Math.floor(diff / minutes)
    return `${m} minute${m === 1 ? '' : 's'} ago`
  }
  if (diff < days) {
    const h = Math.floor(diff / hours)
    return `${h} hour${h === 1 ? '' : 's'} ago`
  }
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
