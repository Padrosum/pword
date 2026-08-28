import { useEffect, useState } from 'react'

/**
 * Typewriter effect for the home hero: types the brand name letter by
 * letter (the "P" striking first), holds, deletes, and retypes — like
 * someone trying the P on a typewriter. Honors prefers-reduced-motion
 * by rendering the full text statically, and is silent to screen
 * readers (the surrounding markup provides a static equivalent).
 */
export function Typewriter({ text }: { text: string }) {
  const [count, setCount] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCount(text.length)
      return
    }

    let timer: number

    if (!deleting && count === text.length) {
      // Full word typed: hold before deleting.
      timer = window.setTimeout(() => setDeleting(true), 2400)
    } else if (deleting && count === 0) {
      // All deleted: hold before striking the first letter again.
      timer = window.setTimeout(() => setDeleting(false), 1400)
    } else {
      const speed = deleting ? 90 : 160
      timer = window.setTimeout(
        () => setCount((c) => c + (deleting ? -1 : 1)),
        speed,
      )
    }

    return () => clearTimeout(timer)
  }, [count, deleting, text])

  return (
    <span aria-hidden="true" className="inline-block">
      {text.slice(0, count)}
      <span className="type-caret" />
    </span>
  )
}
