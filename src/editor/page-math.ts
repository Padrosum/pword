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

export function computePageBreaks(
  blocks: BlockMetrics[],
  stride: number,
  capacity: number,
): PaginationResult {
  const breaks: PageBreakSpec[] = []
  if (blocks.length === 0 || stride <= 0 || capacity <= 0) {
    return { breaks, pageCount: 1 }
  }

  let page = 0
  // actual top = natural top + delta (delta accumulates inserted spacers)
  let delta = 0

  const actualTop = (i: number) => blocks[i]!.top + delta

  const breakBefore = (i: number) => {
    // A spacer between two blocks prevents their margins from collapsing;
    // compensate with the smaller of the two margins so the pushed block
    // lands exactly on the next sheet's content top.
    const comp = i > 0 ? Math.min(blocks[i - 1]!.marginBottom, blocks[i]!.marginTop) : 0
    const target = (page + 1) * stride
    const height = Math.max(0, target - blocks[i]!.top - delta - comp)
    breaks.push({ index: i, height })
    delta += height + comp
    page += 1
  }

  let i = 0
  while (i < blocks.length) {
    const block = blocks[i]!
    const top = actualTop(i)
    const winStart = page * stride
    const winEnd = winStart + capacity

    if (block.height > capacity + EPS) {
      // A block taller than a whole sheet (huge table/image): start it on
      // a fresh sheet if needed, then let it overflow — there is no clean
      // way to split an atomic block.
      if (top > winStart + EPS) breakBefore(i)
      page += 1
      i += 1
      continue
    }

    if (top + block.height > winEnd + EPS) {
      // Doesn't fit: move to the next sheet, pulling along any
      // keep-with-next headings that share this sheet with it.
      let j = i
      while (
        j > 0 &&
        blocks[j - 1]!.keepNext &&
        !breaks.some((b) => b.index === j - 1) &&
        actualTop(j - 1) >= winStart - EPS &&
        actualTop(j - 1) < winEnd
      ) {
        j -= 1
      }
      breakBefore(j)
      i = j
      continue
    }

    i += 1
  }

  return { breaks, pageCount: page + 1 }
}
