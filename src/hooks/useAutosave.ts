import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { debounce } from '../lib/debounce'
import type { PadDocument, SaveState } from '../types/document'

/**
 * Debounced autosave for a document.
 *
 * - `schedule` marks the document dirty and schedules a write (900 ms).
 * - `flush` writes immediately (used by manual save and page hide).
 * - A pending write is flushed when the tab is hidden or closed so the
 *   document survives refreshes and navigation.
 */
export function useAutosave(
  persist: (doc: PadDocument) => Promise<void>,
  waitMs = 900,
): {
  state: SaveState
  schedule: (doc: PadDocument) => void
  flush: () => void
} {
  const [state, setState] = useState<SaveState>('saved')
  const persistRef = useRef(persist)
  useEffect(() => {
    persistRef.current = persist
  })

  const debouncedWrite = useMemo(
    () =>
      debounce(async (doc: PadDocument) => {
        setState('saving')
        try {
          await persistRef.current(doc)
          setState('saved')
        } catch (error) {
          console.error('[pword] autosave failed', error)
          setState('error')
        }
      }, waitMs),
    [waitMs],
  )

  const schedule = useCallback(
    (doc: PadDocument) => {
      setState('unsaved')
      debouncedWrite(doc)
    },
    [debouncedWrite],
  )

  const flush = useCallback(() => {
    debouncedWrite.flush()
  }, [debouncedWrite])

  useEffect(() => {
    const flushNow = () => {
      // Flush only if there are pending changes; flush() is a no-op otherwise.
      debouncedWrite.flush()
    }
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flushNow()
    }
    window.addEventListener('pagehide', flushNow)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pagehide', flushNow)
      document.removeEventListener('visibilitychange', onVisibility)
      flushNow()
    }
  }, [debouncedWrite])

  return { state, schedule, flush }
}
