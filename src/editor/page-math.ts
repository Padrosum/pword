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

/** Flow end position after a block (top + height for non-empty blocks). */
export function blockFlowEnd(block: BlockMetrics): number {
  return block.height > EPS ? block.top + block.height : block.top
}

function measureOneBlock(
  el: HTMLElement,
  keepNext: boolean,
  empty: boolean,
  prev: BlockMetrics | null,
  cursor: number,
): { metric: BlockMetrics; cursor: number } {
  if (empty) {
    return {
      metric: {
        top: cursor,
        height: 0,
        marginTop: 0,
        marginBottom: 0,
        keepNext,
      },
      cursor,
    }
  }

  const cs = getComputedStyle(el)
  const marginTop = Number.parseFloat(cs.marginTop) || 0
  const marginBottom = Number.parseFloat(cs.marginBottom) || 0
  let top = cursor
  if (prev && prev.height > 0) {
    top = cursor + Math.max(prev.marginBottom, marginTop)
  }
  const height = el.offsetHeight
  return {
    metric: {
      top,
      height,
      marginTop,
      marginBottom,
      keepNext,
    },
    cursor: top + height,
  }
}

/**
 * Reconstruct spacer-free block positions from heights and margins alone.
 * Reading offsetTop while spacers are in the DOM drifts after each recompute
 * and can push entire documents to the next sheet (empty first page).
 *
 * Prefer this over `measureBlocksFromDom` on the typing path: it avoids
 * per-block getBoundingClientRect and does not depend on live spacer geometry.
 */
export function measureNaturalBlocks(
  elements: HTMLElement[],
  keepNext: boolean[],
  emptyFlags?: readonly boolean[],
): BlockMetrics[] {
  const metrics: BlockMetrics[] = []
  let cursor = 0
  let prev: BlockMetrics | null = null

  for (let i = 0; i < elements.length; i++) {
    const empty = emptyFlags?.[i] ?? isEmptyBlockElement(elements[i]!)
    const { metric, cursor: nextCursor } = measureOneBlock(
      elements[i]!,
      keepNext[i] ?? false,
      empty,
      prev,
      cursor,
    )
    metrics.push(metric)
    cursor = nextCursor
    prev = metric
  }

  return metrics
}

/**
 * Remeasure from `fromIndex` only, keeping a cached prefix. Used so typing
 * near the end of a long document does not touch off-screen block layout.
 *
 * When `structural` is false and only one block changed, subsequent tops are
 * shifted by the flow delta instead of re-reading the DOM.
 */
export function measureNaturalBlocksIncremental(
  elements: HTMLElement[],
  keepNext: boolean[],
  emptyFlags: readonly boolean[],
  cache: BlockMetrics[] | null,
  fromIndex: number,
  structural: boolean,
): BlockMetrics[] {
  if (
    !cache ||
    fromIndex <= 0 ||
    fromIndex > cache.length ||
    fromIndex > elements.length
  ) {
    return measureNaturalBlocks(elements, keepNext, emptyFlags)
  }

  const prefix = cache.slice(0, fromIndex)
  const prev = prefix[fromIndex - 1] ?? null
  const cursor = prev ? blockFlowEnd(prev) : 0

  // Single-block content edit: remeasure that block, shift the rest.
  if (
    !structural &&
    cache.length === elements.length &&
    fromIndex < cache.length
  ) {
    const { metric } = measureOneBlock(
      elements[fromIndex]!,
      keepNext[fromIndex] ?? false,
      emptyFlags[fromIndex] ?? isEmptyBlockElement(elements[fromIndex]!),
      prev,
      cursor,
    )
    const old = cache[fromIndex]!
    const delta = blockFlowEnd(metric) - blockFlowEnd(old)
    const metrics = prefix.concat(metric)
    for (let i = fromIndex + 1; i < cache.length; i += 1) {
      const block = cache[i]!
      metrics.push(
        Math.abs(delta) < EPS
          ? block
          : { ...block, top: block.top + delta },
      )
    }
    return metrics
  }

  // Structural insert/delete (or dirty range at end): remeasure from index.
  const suffix = measureNaturalBlocks(
    elements.slice(fromIndex),
    keepNext.slice(fromIndex),
    emptyFlags.slice(fromIndex),
  )
  if (!prev || suffix.length === 0) return prefix.concat(suffix)

  // measureNaturalBlocks starts suffix tops at 0; place them after the prefix.
  const placed: BlockMetrics[] = []
  let flow = cursor
  let last: BlockMetrics | null = prev
  for (const raw of suffix) {
    if (raw.height <= EPS) {
      const metric = { ...raw, top: flow }
      placed.push(metric)
      last = metric
      continue
    }
    let top = flow
    if (last && last.height > 0) {
      top = flow + Math.max(last.marginBottom, raw.marginTop)
    }
    const metric = { ...raw, top }
    placed.push(metric)
    flow = top + raw.height
    last = metric
  }
  return prefix.concat(placed)
}

/**
 * First top-level block index that differs between two docs.
 * Returns structural:true when child count changes (insert/delete/split).
 */
export function findChangedBlockRange(
  prevChildCount: number,
  nextChildCount: number,
  sameChildAt: (index: number) => boolean,
): { from: number; structural: boolean } {
  const shared = Math.min(prevChildCount, nextChildCount)
  let from = shared
  for (let i = 0; i < shared; i += 1) {
    if (!sameChildAt(i)) {
      from = i
      break
    }
  }
  return {
    from,
    structural: prevChildCount !== nextChildCount,
  }
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
