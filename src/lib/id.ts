export function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Fallback for non-secure contexts.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`
}
