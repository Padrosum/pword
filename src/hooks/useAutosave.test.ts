import { act, fireEvent, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { lifecycleFlush, useAutosave } from './useAutosave'
import { createDocument } from '../storage/documents'
import { PENDING_SAVE_PREFIX } from '../lib/lifecyclePersist'
import type { PadDocument } from '../types/document'

describe('useAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('does not persist immediately, but after the debounce window', async () => {
    const persist = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosave(persist, 900))

    const doc = createDocument('Doc')
    act(() => result.current.schedule(doc))
    expect(result.current.state).toBe('unsaved')
    expect(persist).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(899)
    })
    expect(persist).not.toHaveBeenCalled()

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1)
    })
    expect(persist).toHaveBeenCalledTimes(1)
    expect(result.current.state).toBe('saved')
  })

  it('collapses rapid changes into a single write', async () => {
    const persist = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosave(persist, 900))

    act(() => {
      result.current.schedule(createDocument('a'))
      vi.advanceTimersByTime(400)
      result.current.schedule(createDocument('b'))
      vi.advanceTimersByTime(400)
      result.current.schedule(createDocument('c'))
    })

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    expect(persist).toHaveBeenCalledTimes(1)
    expect(persist.mock.calls[0]![0].title).toBe('c')
  })

  it('flush() writes pending changes immediately', async () => {
    const persist = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosave(persist, 900))

    const doc: PadDocument = createDocument('Flushing')
    act(() => result.current.schedule(doc))
    await act(async () => {
      await result.current.flush()
    })

    expect(persist).toHaveBeenCalledTimes(1)
    expect(persist.mock.calls[0]![0].id).toBe(doc.id)
    expect(result.current.state).toBe('saved')
  })

  it('flush() is a no-op with no pending changes', async () => {
    const persist = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosave(persist, 900))
    await act(async () => { await result.current.flush() })
    expect(persist).not.toHaveBeenCalled()
  })

  it('retries the failed snapshot when flush is called again', async () => {
    const persist = vi.fn()
      .mockRejectedValueOnce(new Error('quota'))
      .mockResolvedValueOnce(undefined)
    const { result } = renderHook(() => useAutosave(persist, 900))
    const doc = createDocument('retry')

    act(() => result.current.schedule(doc))
    await act(async () => { await vi.advanceTimersByTimeAsync(900) })
    expect(result.current.state).toBe('error')

    await act(async () => { expect(await result.current.flush()).toBe(true) })
    expect(persist).toHaveBeenCalledTimes(2)
    expect(result.current.state).toBe('saved')
  })

  it('flushes pending changes when the page is hidden', async () => {
    const persist = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosave(persist, 900))
    const doc = createDocument('hidden')

    act(() => result.current.schedule(doc))
    await act(async () => {
      fireEvent(window, new Event('pagehide'))
      await Promise.resolve()
    })

    expect(persist).toHaveBeenCalledWith(doc)
    expect(result.current.state).toBe('saved')
  })

  it('lifecycleFlush awaits flush before returning', async () => {
    vi.useRealTimers()

    const order: string[] = []
    const flush = vi.fn(async () => {
      order.push('flush-start')
      await new Promise<void>((resolve) => setTimeout(resolve, 10))
      order.push('flush-end')
      return true
    })

    await lifecycleFlush(flush)
    expect(order).toEqual(['flush-start', 'flush-end'])

    vi.useFakeTimers()
  })

  it('regression: pagehide stashes pending work and completes flush', async () => {
    sessionStorage.clear()

    const persist = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosave(persist, 900))
    const doc = createDocument('tab-close')
    act(() => result.current.schedule(doc))

    await act(async () => {
      fireEvent(window, new Event('pagehide'))
      await Promise.resolve()
    })

    expect(persist).toHaveBeenCalledWith(doc)
    expect(result.current.state).toBe('saved')
    expect(sessionStorage.getItem(`${PENDING_SAVE_PREFIX}${doc.id}`)).toBeTruthy()
  })

  it('regression: visibilitychange(hidden) completes flush', async () => {
    const persist = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosave(persist, 900))
    const doc = createDocument('tab-hidden')
    act(() => result.current.schedule(doc))

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })

    await act(async () => {
      fireEvent(document, new Event('visibilitychange'))
      await Promise.resolve()
    })

    expect(persist).toHaveBeenCalledWith(doc)
    expect(result.current.state).toBe('saved')

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
  })

  it('reports an error state when persisting fails', async () => {
    const persist = vi.fn().mockRejectedValue(new Error('quota'))
    const { result } = renderHook(() => useAutosave(persist, 900))

    act(() => result.current.schedule(createDocument('x')))
    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    expect(result.current.state).toBe('error')
  })

  it('resolves a lazy getter only when the write runs', async () => {
    const persist = vi.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAutosave(persist, 900))
    const getter = vi.fn(() => createDocument('lazy'))

    act(() => result.current.schedule(getter))
    expect(getter).not.toHaveBeenCalled()
    expect(result.current.state).toBe('unsaved')

    await act(async () => {
      await vi.advanceTimersByTimeAsync(900)
    })
    expect(getter).toHaveBeenCalledTimes(1)
    expect(persist).toHaveBeenCalledTimes(1)
    expect(persist.mock.calls[0]![0].title).toBe('lazy')
  })
})
