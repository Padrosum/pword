import { describe, expect, it, vi } from 'vitest'
import { computePageBreaks, measureNaturalBlocks, type BlockMetrics } from './page-math'

// Convenience block factory: heights in "px" of a test grid where a sheet
// has stride 1000 and capacity 800 (i.e. 200px of inter-sheet flow gap).
function b(
  top: number,
  height: number,
  opts: Partial<Pick<BlockMetrics, 'marginTop' | 'marginBottom' | 'keepNext'>> = {},
): BlockMetrics {
  return {
    top,
    height,
    marginTop: opts.marginTop ?? 0,
    marginBottom: opts.marginBottom ?? 0,
    keepNext: opts.keepNext ?? false,
  }
}

const STRIDE = 1000
const CAPACITY = 800

describe('computePageBreaks', () => {
  it('returns no breaks when everything fits on one sheet', () => {
    const result = computePageBreaks([b(0, 300), b(320, 400)], STRIDE, CAPACITY)
    expect(result.breaks).toEqual([])
    expect(result.pageCount).toBe(1)
  })

  it('pushes a block that crosses the boundary to the next sheet', () => {
    // Block 2 spans 350..950 — crosses the 800 limit.
    const blocks = [b(0, 300, { marginBottom: 10 }), b(310, 600, { marginTop: 10 })]
    const result = computePageBreaks(blocks, STRIDE, CAPACITY)

    expect(result.breaks).toHaveLength(1)
    expect(result.breaks[0]!.index).toBe(1)
    // Spacer height: target (1000) − natural top (310) − margin comp (min(10,10)=10)
    expect(result.breaks[0]!.height).toBe(1000 - 310 - 10)
    expect(result.pageCount).toBe(2)

    // Verify the pushed block lands exactly on the next sheet's content top:
    const comp = Math.min(blocks[0]!.marginBottom, blocks[1]!.marginTop)
    const actualTop = blocks[1]!.top + result.breaks[0]!.height + comp
    expect(actualTop).toBe(STRIDE)
  })

  it('creates multiple sheets for long flows', () => {
    const blocks = [b(0, 700), b(700, 700), b(1400, 700)]
    const result = computePageBreaks(blocks, STRIDE, CAPACITY)
    expect(result.breaks).toHaveLength(2)
    expect(result.pageCount).toBe(3)
    expect(result.breaks[0]!.index).toBe(1)
    expect(result.breaks[1]!.index).toBe(2)
  })

  it('pulls a keep-with-next heading along with the block after it', () => {
    // A heading ends near the sheet bottom (648..748) and the paragraph
    // after it (756..1436) crosses the boundary: both move to sheet 2,
    // where they fit together (1000..1788 within 1000..1800).
    const blocks = [
      b(0, 640, { marginBottom: 8 }),
      b(648, 100, { marginBottom: 8, keepNext: true }),
      b(756, 680, { marginTop: 8 }),
    ]
    const result = computePageBreaks(blocks, STRIDE, CAPACITY)

    expect(result.breaks).toHaveLength(1)
    expect(result.breaks[0]!.index).toBe(1) // break before the heading
    expect(result.pageCount).toBe(2)

    // Heading lands exactly on the next sheet's content top.
    const headingTop = blocks[1]!.top + result.breaks[0]!.height + 0
    expect(headingTop).toBe(STRIDE)
    // The paragraph fits below the heading on the same sheet.
    const paragraphTop = blocks[2]!.top + result.breaks[0]!.height + 0
    expect(paragraphTop + blocks[2]!.height).toBeLessThanOrEqual(STRIDE + CAPACITY)
  })

  it('starts an oversized block on a fresh sheet without looping', () => {
    const blocks = [b(0, 700), b(700, 1200), b(1900, 100)]
    const result = computePageBreaks(blocks, STRIDE, CAPACITY)

    // Block 1 (h=1200 > capacity) is pushed to sheet 2 and overflows;
    // block 2 then starts on sheet 3.
    expect(result.pageCount).toBe(3)
    const indices = result.breaks.map((br) => br.index)
    expect(indices).toContain(1)
  })

  it('handles an empty flow', () => {
    expect(computePageBreaks([], STRIDE, CAPACITY)).toEqual({ breaks: [], pageCount: 1 })
  })

  it('does not break before the very first block', () => {
    const result = computePageBreaks([b(0, 900)], STRIDE, CAPACITY)
    expect(result.breaks).toEqual([])
  })

  it('aligns page 2 content to the sheet edge when contentStartOffset is set', () => {
    const offset = 100
    const blocks = [b(0, 700), b(700, 700)]
    const result = computePageBreaks(blocks, STRIDE, CAPACITY, offset)

    expect(result.breaks).toHaveLength(1)
    const pushedTop = blocks[1]!.top + result.breaks[0]!.height
    expect(pushedTop).toBe(STRIDE - offset)
  })

  it('ignores empty blocks when packing pages', () => {
    const blocks = [b(0, 700), b(700, 0), b(700, 700)]
    const result = computePageBreaks(blocks, STRIDE, CAPACITY)
    expect(result.breaks).toHaveLength(1)
    expect(result.breaks[0]!.index).toBe(2)
  })
})

describe('measureNaturalBlocks', () => {
  it('builds cumulative tops from block heights and margins', () => {
    const first = document.createElement('p')
    const second = document.createElement('p')
    first.textContent = 'First block'
    second.textContent = 'Second block'
    Object.defineProperty(first, 'offsetHeight', { value: 100 })
    Object.defineProperty(second, 'offsetHeight', { value: 200 })
    vi.spyOn(window, 'getComputedStyle').mockImplementation((el) => {
      const style = { marginTop: '0px', marginBottom: '0px' } as CSSStyleDeclaration
      if (el === second) style.marginTop = '12px'
      return style
    })

    const metrics = measureNaturalBlocks([first, second], [false, false])
    expect(metrics).toHaveLength(2)
    expect(metrics[0]!.top).toBe(0)
    expect(metrics[0]!.height).toBe(100)
    expect(metrics[1]!.top).toBe(112)
    expect(metrics[1]!.height).toBe(200)
  })
})
