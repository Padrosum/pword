import { useCallback, useEffect, useRef, useState } from 'react'
import { lifecycleFlush, stashPendingSave } from '../lib/lifecyclePersist'
import type { PadDocument, SaveState } from '../types/document'

export { lifecycleFlush } from '../lib/lifecyclePersist'

/**
 * Debounced, serialized autosave for a document.
 *
 * The latest snapshot is retained until persistence succeeds. This makes a
 * failed save retryable and prevents an unmount from racing a destructive
 * operation such as document deletion.
 */
export function useAutosave(
  persist: (doc: PadDocument) => Promise<void>,
  waitMs = 900,
): {
  state: SaveState
  schedule: (doc: PadDocument) => void
  flush: () => Promise<boolean>
  pauseAndDiscard: () => Promise<void>
  resume: () => void
} {
  const [state, setState] = useState<SaveState>('saved')
  const stateRef = useRef<SaveState>('saved')
  const persistRef = useRef(persist)
  const pendingRef = useRef<PadDocument | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const runningRef = useRef<Promise<void> | null>(null)
  const aliveRef = useRef(true)
  const flushOnCleanupRef = useRef(true)

  useEffect(() => {
    stateRef.current = state
  }, [state])

  useEffect(() => {
    persistRef.current = persist
  }, [persist])

  const setStateIfAlive = useCallback((next: SaveState) => {
    if (aliveRef.current) setState(next)
  }, [])

  const drain = useCallback(async function drainWork(): Promise<void> {
    if (runningRef.current) {
      await runningRef.current
      if (pendingRef.current) await drainWork()
      return
    }

    const work = (async () => {
      while (pendingRef.current) {
        const doc = pendingRef.current
        pendingRef.current = null
        setStateIfAlive('saving')
        try {
          await persistRef.current(doc)
          setStateIfAlive(pendingRef.current ? 'unsaved' : 'saved')
        } catch (error) {
          // Keep the failed snapshot so a later edit or explicit flush can retry it.
          pendingRef.current = pendingRef.current ?? doc
          console.error('[pword] autosave failed', error)
          setStateIfAlive('error')
          break
        }
      }
    })()

    runningRef.current = work
    try {
      await work
    } finally {
      runningRef.current = null
    }
  }, [setStateIfAlive])

  const schedule = useCallback(
    (doc: PadDocument) => {
      pendingRef.current = doc
      setStateIfAlive('unsaved')
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        timerRef.current = null
        void drain()
      }, waitMs)
    },
    [drain, setStateIfAlive, waitMs],
  )

  const flush = useCallback((): Promise<boolean> => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    const finished = drain()
    return finished.then(() => pendingRef.current === null && runningRef.current === null)
  }, [drain])

  // Stop scheduling new writes, wait for an already-running write, and discard
  // the pending snapshot. Used immediately before a document is deleted.
  const pauseAndDiscard = useCallback(async (): Promise<void> => {
    flushOnCleanupRef.current = false
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
    pendingRef.current = null
    if (runningRef.current) await runningRef.current
    pendingRef.current = null
  }, [])

  const resume = useCallback(() => {
    flushOnCleanupRef.current = true
  }, [])

  useEffect(() => {
    const hasPendingSave = () =>
      pendingRef.current !== null ||
      timerRef.current !== null ||
      stateRef.current === 'unsaved' ||
      stateRef.current === 'saving' ||
      stateRef.current === 'error'

    const runLifecycleSave = () => {
      if (pendingRef.current) stashPendingSave(pendingRef.current)
      void lifecycleFlush(flush)
    }

    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasPendingSave()) return
      event.preventDefault()
      event.returnValue = ''
    }

    const onPageHide = () => {
      runLifecycleSave()
    }

    const onVisibility = () => {
      if (document.visibilityState === 'hidden') runLifecycleSave()
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    window.addEventListener('pagehide', onPageHide)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      window.removeEventListener('pagehide', onPageHide)
      document.removeEventListener('visibilitychange', onVisibility)
      aliveRef.current = false
      if (timerRef.current !== null) clearTimeout(timerRef.current)
      timerRef.current = null
      if (flushOnCleanupRef.current) void flush()
    }
  }, [flush])

  return { state, schedule, flush, pauseAndDiscard, resume }
}
