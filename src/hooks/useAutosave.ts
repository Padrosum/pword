import { useCallback, useEffect, useRef, useState } from 'react'
import { lifecycleFlush, stashPendingSave } from '../lib/lifecyclePersist'
import type { PadDocument, SaveState } from '../types/document'

export { lifecycleFlush } from '../lib/lifecyclePersist'

/** Snapshot ready to persist, or a getter resolved only when a write runs. */
export type AutosaveInput = PadDocument | (() => PadDocument)

/**
 * Debounced, serialized autosave for a document.
 *
 * The latest snapshot is retained until persistence succeeds. This makes a
 * failed save retryable and prevents an unmount from racing a destructive
 * operation such as document deletion.
 *
 * Pass a getter from the editor hot path so `getJSON()` only runs when the
 * debounce timer fires (or on flush / pagehide), not on every keystroke.
 */
export function useAutosave(
  persist: (doc: PadDocument) => Promise<void>,
  waitMs = 900,
): {
  state: SaveState
  schedule: (input: AutosaveInput) => void
  flush: () => Promise<boolean>
  pauseAndDiscard: () => Promise<void>
  resume: () => void
} {
  const [state, setState] = useState<SaveState>('saved')
  const stateRef = useRef<SaveState>('saved')
  const persistRef = useRef(persist)
  const pendingRef = useRef<PadDocument | null>(null)
  const pendingGetterRef = useRef<(() => PadDocument) | null>(null)
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

  const takePending = useCallback((): PadDocument | null => {
    const getter = pendingGetterRef.current
    if (getter) {
      pendingGetterRef.current = null
      try {
        const doc = getter()
        pendingRef.current = null
        return doc
      } catch (error) {
        console.error('[pword] autosave snapshot failed', error)
        return pendingRef.current
      }
    }
    const doc = pendingRef.current
    pendingRef.current = null
    return doc
  }, [])

  const peekPending = useCallback((): PadDocument | null => {
    if (pendingGetterRef.current) {
      try {
        return pendingGetterRef.current()
      } catch (error) {
        console.error('[pword] autosave snapshot failed', error)
        return pendingRef.current
      }
    }
    return pendingRef.current
  }, [])

  const drain = useCallback(async function drainWork(): Promise<void> {
    if (runningRef.current) {
      await runningRef.current
      if (pendingRef.current || pendingGetterRef.current) await drainWork()
      return
    }

    const work = (async () => {
      while (pendingRef.current || pendingGetterRef.current) {
        const doc = takePending()
        if (!doc) break
        setStateIfAlive('saving')
        try {
          await persistRef.current(doc)
          setStateIfAlive(
            pendingRef.current || pendingGetterRef.current ? 'unsaved' : 'saved',
          )
        } catch (error) {
          // Keep the failed snapshot so a later edit or explicit flush can retry it.
          pendingRef.current = pendingRef.current ?? doc
          pendingGetterRef.current = null
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
  }, [setStateIfAlive, takePending])

  const schedule = useCallback(
    (input: AutosaveInput) => {
      if (typeof input === 'function') {
        pendingGetterRef.current = input
        pendingRef.current = null
      } else {
        pendingRef.current = input
        pendingGetterRef.current = null
      }
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
    return finished.then(
      () =>
        pendingRef.current === null &&
        pendingGetterRef.current === null &&
        runningRef.current === null,
    )
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
    pendingGetterRef.current = null
    if (runningRef.current) await runningRef.current
    pendingRef.current = null
    pendingGetterRef.current = null
  }, [])

  const resume = useCallback(() => {
    flushOnCleanupRef.current = true
  }, [])

  useEffect(() => {
    const hasPendingSave = () =>
      pendingRef.current !== null ||
      pendingGetterRef.current !== null ||
      timerRef.current !== null ||
      stateRef.current === 'unsaved' ||
      stateRef.current === 'saving' ||
      stateRef.current === 'error'

    const runLifecycleSave = () => {
      const snapshot = peekPending()
      if (snapshot) stashPendingSave(snapshot)
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
  }, [flush, peekPending])

  return { state, schedule, flush, pauseAndDiscard, resume }
}
