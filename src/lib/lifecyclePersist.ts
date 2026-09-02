import type { PadDocument } from '../types/document'

export const PENDING_SAVE_PREFIX = 'pword:pending-save:'

/** Synchronous emergency stash for lifecycle events (pagehide / tab close). */
export function stashPendingSave(doc: PadDocument): void {
  try {
    sessionStorage.setItem(`${PENDING_SAVE_PREFIX}${doc.id}`, JSON.stringify(doc))
  } catch (error) {
    console.warn('[pword] could not stash pending save', error)
  }
}

export function clearPendingSave(id: string): void {
  try {
    sessionStorage.removeItem(`${PENDING_SAVE_PREFIX}${id}`)
  } catch {
    // sessionStorage may be unavailable in some contexts.
  }
}

export function consumePendingSave(id: string): PadDocument | null {
  try {
    const key = `${PENDING_SAVE_PREFIX}${id}`
    const raw = sessionStorage.getItem(key)
    if (!raw) return null
    sessionStorage.removeItem(key)
    return JSON.parse(raw) as PadDocument
  } catch {
    return null
  }
}

/** Await flush during page lifecycle; errors are logged, not rethrown. */
export async function lifecycleFlush(flush: () => Promise<boolean>): Promise<void> {
  try {
    await flush()
  } catch (error) {
    console.error('[pword] lifecycle flush failed', error)
  }
}
