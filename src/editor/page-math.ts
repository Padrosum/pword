/**
 * Pure pagination math.
 *
 * A word processor breaks pages by height, not by character count: a page
 * holds `capacity` px of content; the flow then jumps to the next sheet
 * (stride = sheet height + gap). `computePageBreaks` walks top-level
 * blocks (natural, spacer-free geometry) and returns one spacer per page
 * boundary that pushes the following block to the top of the next sheet.
 */

export interface BlockMetrics {
  /** Natural offsetTop in spacer-free layout (px). */
  top: number
  /** offsetHeight (px). */
  height: number
  marginTop: number
  marginBottom: number
  /** Keep on the same sheet as the following block (headings). */
  keepNext: boolean
}

export interface PageBreakSpec {
  /** Block index the spacer is inserted before. */
  index: number
  /** Spacer height in px. */
  height: number
}

export interface PaginationResult {
  breaks: PageBreakSpec[]
  pageCount: number
}

const EPS = 1

/** True when a block contributes no visible content (empty paragraph, etc.). */
export function isEmptyBlockElement(el: HTMLElement): boolean {
  if (el.tagName !== 'P') return false
  if (el.classList.contains('is-editor-empty')) return false
  if (el.querySelector('img, table, hr, ul, ol, pre, blockquote')) return false

  const text = el.textContent?.replace(/\u200B/g, '').trim() ?? ''
  if (text.length > 0) return false

  const children = [...el.childNodes].filter(
    (n) => !(n.nodeType === Node.TEXT_NODE && !n.textContent?.trim()),
  )
  if (children.length === 0) return true
  return children.every((n) => n.nodeName === 'BR')
}

/**
 * Reconstruct spacer-free block positions from heights and margins alone.
 * Reading offsetTop while spacers are in the DOM drifts after each recompute
 * and can push entire documents to the next sheet (empty first page).
 */
export function measureNaturalBlocks(
  elements: HTMLElement[],
  keepNext: boolean[],
): BlockMetrics[] {
  const metrics: BlockMetrics[] = []
  let cursor = 0

  for (let i = 0; i < elements.length; i++) {
    const el = elements[i]!
    const empty = isEmptyBlockElement(el)

    if (empty) {
      metrics.push({
        top: cursor,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        keepNext: keepNext[i] ?? false,
      })
      continue
    }

    const cs = getComputedStyle(el)
    const marginTop = Number.parseFloat(cs.marginTop) || 0
    const marginBottom = Number.parseFloat(cs.marginBottom) || 0

    if (i > 0) {
      const prev = metrics[i - 1]!
      if (prev.height > 0) {
        cursor += Math.max(prev.marginBottom, marginTop)
      }
    }

    metrics.push({
      top: cursor,
      height: el.offsetHeight,
      marginTop,
      marginBottom,
      keepNext: keepNext[i] ?? false,
    })
    cursor += el.offsetHeight
  }

  return metrics
}

/**
 * Read natural block geometry from the live DOM, subtracting inserted page
 * spacers so measurements stay stable across recomputes.
 */
export function measureBlocksFromDom(
  dom: HTMLElement,
  elements: HTMLElement[],
  keepNext: boolean[],
  spacers: { height: number; comp: number }[],
): BlockMetrics[] {
  const proseTop = dom.getBoundingClientRect().top
  const domChildren = [...dom.children] as HTMLElement[]
  const metrics: BlockMetrics[] = []
  let spacerIdx = 0
  let spacerAcc = 0
  let blockIdx = 0

  for (const child of domChildren) {
    if (child.hasAttribute('data-page-spacer')) {
      const record = spacers[spacerIdx]
      spacerAcc += child.offsetHeight + (record?.comp ?? 0)
      spacerIdx += 1
      continue
    }

    if (blockIdx >= elements.length) break
    if (child !== elements[blockIdx]) continue

    if (isEmptyBlockElement(child)) {
      metrics.push({
        top: 0,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        keepNext: keepNext[blockIdx] ?? false,
      })
      blockIdx += 1
      continue
    }

    const cs = getComputedStyle(child)
    const rect = child.getBoundingClientRect()
    metrics.push({
      top: rect.top - proseTop - spacerAcc,
      height: child.offsetHeight,
      marginTop: Number.parseFloat(cs.marginTop) || 0,
      marginBottom: Number.parseFloat(cs.marginBottom) || 0,
      keepNext: keepNext[blockIdx] ?? false,
    })
    blockIdx += 1
  }

  while (blockIdx < elements.length) {
    metrics.push({
      top: 0,
      height: 0,
      marginTop: 0,
      marginBottom: 0,
      keepNext: keepNext[blockIdx] ?? false,
    })
    blockIdx += 1
  }

  return metrics
}

export function computePageBreaks(
  blocks: BlockMetrics[],
  stride: number,
  capacity: number,
  /** .ProseMirror top minus .pages top — the one-time .page padding offset. */
  contentStartOffset = 0,
): PaginationResult {
  const breaks: PageBreakSpec[] = []
  if (blocks.length === 0 || stride <= 0 || capacity <= 0) {
    return { breaks, pageCount: 1 }
  }

  let page = 0
  let delta = 0

  const pageWinStart = (p: number) => (p === 0 ? 0 : p * stride - contentStartOffset)
  const pageWinEnd = (p: number) => pageWinStart(p) + capacity

  const actualTop = (i: number) => blocks[i]!.top + delta

  const breakBefore = (i: number) => {
    const comp = i > 0 ? Math.min(blocks[i - 1]!.marginBottom, blocks[i]!.marginTop) : 0
    // Continuous flow: only the first sheet has .page padding-top. Later sheets
    // start at the paper edge (stride), not stride + margin again.
    const target = (page + 1) * stride - contentStartOffset
    const height = Math.max(0, target - blocks[i]!.top - delta - comp)
    breaks.push({ index: i, height })
    delta += height + comp
    page += 1
  }

  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]!

    // Skip empty blocks — they must not trigger page breaks or consume space.
    if (block.height <= EPS) {
      i += 1
      continue
    }

    const top = actualTop(i)
    const winStart = pageWinStart(page)
    const winEnd = pageWinEnd(page)

    if (block.height > capacity + EPS) {
      if (top > winStart + EPS) breakBefore(i)
      page += 1
      i += 1
      continue
    }

    if (top + block.height + block.marginBottom > winEnd + EPS) {
      let j = i
      while (
        j > 0 &&
        blocks[j - 1]!.keepNext &&
        blocks[j - 1]!.height > EPS &&
        !breaks.some((b) => b.index === j - 1) &&
        actualTop(j - 1) >= winStart - EPS &&
        actualTop(j - 1) < winEnd
      ) {
        j -= 1
      }
      while (j < blocks.length && blocks[j]!.height <= EPS) j += 1
      if (j >= blocks.length) break
      breakBefore(j)
      i = j
      continue
    }

    i += 1
  }

  return { breaks, pageCount: page + 1 }
}
