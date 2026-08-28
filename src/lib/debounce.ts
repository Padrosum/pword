export function debounce<A extends unknown[]>(
  fn: (...args: A) => void,
  waitMs: number,
): ((...args: A) => void) & { flush: () => void; cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: A | null = null

  const wrapped = (...args: A) => {
    lastArgs = args
    if (timer !== null) clearTimeout(timer)
    timer = setTimeout(() => {
      timer = null
      if (lastArgs) fn(...lastArgs)
      lastArgs = null
    }, waitMs)
  }

  wrapped.flush = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    if (lastArgs) {
      fn(...lastArgs)
      lastArgs = null
    }
  }

  wrapped.cancel = () => {
    if (timer !== null) {
      clearTimeout(timer)
      timer = null
    }
    lastArgs = null
  }

  return wrapped
}

export function throttle<A extends unknown[]>(fn: (...args: A) => void, waitMs: number) {
  let lastRun = 0
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastArgs: A | null = null

  return (...args: A) => {
    lastArgs = args
    const now = Date.now()
    if (now - lastRun >= waitMs) {
      lastRun = now
      if (lastArgs) fn(...lastArgs)
      lastArgs = null
    } else if (timer === null) {
      timer = setTimeout(() => {
        timer = null
        lastRun = Date.now()
        if (lastArgs) fn(...lastArgs)
        lastArgs = null
      }, waitMs - (now - lastRun))
    }
  }
}
