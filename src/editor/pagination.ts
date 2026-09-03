import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { Node as PMNode } from '@tiptap/pm/model'
import type { EditorView as PMEditorView } from '@tiptap/pm/view'
import {
  computePageBreaks,
  findChangedBlockRange,
  isEmptyBlockElement,
  measureNaturalBlocksIncremental,
  type BlockMetrics,
} from './page-math'

/**
 * Real vertical pagination, the way a word processor does it: pages break
 * by height, not by character count. The plugin measures the natural flow
 * of top-level blocks and inserts invisible spacer widgets at page
 * boundaries, pushing content to the top of the next sheet. The paper
 * rectangles behind the flow are painted by CSS (.pages), so the content
 * lands exactly on the sheet grid.
 *
 * Natural geometry is derived from block heights (not offsetTop while
 * spacers are mounted) so repeated recomputes stay stable and cheap.
 * Long documents remeasure from the first dirty block only; off-screen
 * blocks keep content-visibility:auto with cached intrinsic sizes.
 */

const key = new PluginKey('pagePagination')

const KEEP_NEXT_TYPES = new Set(['heading', 'docTitle', 'docSubtitle'])
const EPS = 1
const MAX_PASSES = 4

interface SpacerRecord {
  pos: number
  height: number
  comp: number
}

interface PaginationState {
  spacers: SpacerRecord[]
  decorations: DecorationSet
  pageCount: number
}

interface PaginationMeta {
  spacers: SpacerRecord[]
  decorations: DecorationSet
  pageCount: number
}

interface DirtyRange {
  from: number
  structural: boolean
}

/** Reads a length CSS custom property as px via a scratch element. */
function createVarMeasurer() {
  let el: HTMLDivElement | null = null
  return (name: string): number => {
    if (!el) {
      el = document.createElement('div')
      el.style.cssText =
        'position:absolute;visibility:hidden;pointer-events:none;height:0;line-height:0;'
      document.body.appendChild(el)
    }
    el.style.height = `var(${name})`
    return el.offsetHeight
  }
}

function collectBlockElements(dom: HTMLElement): HTMLElement[] {
  return Array.from(dom.children).filter(
    (child): child is HTMLElement =>
      child instanceof HTMLElement && !child.hasAttribute('data-page-spacer'),
  )
}

/** Sync empty-para CSS class from `fromIndex`; return full emptiness flags. */
function prepareBlockElements(
  elements: HTMLElement[],
  fromIndex: number,
  cache: BlockMetrics[] | null,
): boolean[] {
  const emptyFlags: boolean[] = new Array(elements.length)
  for (let i = 0; i < elements.length; i += 1) {
    if (i < fromIndex) {
      emptyFlags[i] = (cache?.[i]?.height ?? 0) <= EPS
      continue
    }
    const el = elements[i]!
    const empty = isEmptyBlockElement(el)
    emptyFlags[i] = empty
    const has = el.classList.contains('page-empty-para')
    if (empty && !has) el.classList.add('page-empty-para')
    else if (!empty && has) el.classList.remove('page-empty-para')
  }
  return emptyFlags
}

/** Keep content-visibility intrinsic sizes in sync so scroll jump stays small. */
function syncIntrinsicSizes(
  elements: HTMLElement[],
  metrics: BlockMetrics[],
  fromIndex: number,
): void {
  for (let i = fromIndex; i < elements.length; i += 1) {
    const el = elements[i]!
    const height = Math.max(1, Math.ceil(metrics[i]?.height ?? 0))
    const next = `${height}px`
    if (el.style.containIntrinsicSize !== next) {
      el.style.containIntrinsicSize = next
    }
  }
}

/**
 * Split a paragraph that has grown taller than one sheet. Returns true when a
 * split transaction was dispatched.
 */
function trySplitOverflowingParagraph(
  view: PMEditorView,
  blockIdx: number,
  docPositions: number[],
  capacity: number,
  stride: number,
  contentStartOffset: number,
  pagesTop: number,
  element: HTMLElement,
): boolean {
  const node = view.state.doc.child(blockIdx)
  if (node.type.name !== 'paragraph') return false

  const rect = element.getBoundingClientRect()
  if (element.offsetHeight <= capacity + EPS) return false

  const topInPages = rect.top - pagesTop
  const page = Math.max(0, Math.floor(topInPages / stride))
  const contentBottomPages = (page === 0 ? contentStartOffset : page * stride) + capacity
  const boundaryY = pagesTop + contentBottomPages
  if (!(rect.top < boundaryY && rect.bottom > boundaryY)) return false

  const start = docPositions[blockIdx]! + 1
  const end = docPositions[blockIdx]! + node.nodeSize - 1
  const lefts = [
    rect.left + 4,
    rect.left + Math.min(40, rect.width * 0.25),
    rect.left + rect.width * 0.5,
  ]

  for (const left of lefts) {
    const coords = view.posAtCoords({ left, top: boundaryY })
    if (!coords || coords.pos <= start || coords.pos >= end) continue
    if (view.state.doc.resolve(coords.pos).parent.type.name !== 'paragraph') continue
    view.dispatch(view.state.tr.split(coords.pos))
    return true
  }

  return false
}

function mergeDirty(current: DirtyRange | null, next: DirtyRange): DirtyRange {
  if (!current) return next
  return {
    from: Math.min(current.from, next.from),
    structural: current.structural || next.structural,
  }
}

export interface PaginationOptions {
  onPageCount?: (count: number) => void
}

export function createPaginationPlugin(options: PaginationOptions = {}) {
  const measureVar = createVarMeasurer()
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastMinHeight = ''
  let pagesEl: HTMLElement | null | undefined
  let followUpPasses = 0
  let sheetH = 0
  let gap = 0
  let marginV = 0
  let metricsCache: BlockMetrics[] | null = null
  let dirty: DirtyRange | null = { from: 0, structural: true }

  const applyPagination = (
    view: PMEditorView,
    spacers: SpacerRecord[],
    decorations: DecorationSet,
    pageCount: number,
  ) => {
    view.dispatch(
      view.state.tr.setMeta(key, { spacers, decorations, pageCount } satisfies PaginationMeta),
    )
    options.onPageCount?.(pageCount)
  }

  const invalidateAll = () => {
    metricsCache = null
    dirty = { from: 0, structural: true }
    sheetH = 0
  }

  const recompute = (view: PMEditorView) => {
    const state = key.getState(view.state) as PaginationState | undefined
    if (!state) return

    if (!(sheetH > 0)) {
      sheetH = measureVar('--sheet-h')
      gap = measureVar('--sheet-gap')
      marginV = measureVar('--page-margin-v')
    }
    const stride = sheetH + gap
    const capacity = sheetH - 2 * marginV
    if (!(stride > 0 && capacity > 0)) return

    const docPositions: number[] = []
    const keepNext: boolean[] = []
    let pos = 0
    view.state.doc.forEach((child) => {
      docPositions.push(pos)
      pos += child.nodeSize
      keepNext.push(KEEP_NEXT_TYPES.has(child.type.name))
    })

    const dom = view.dom as HTMLElement
    if (pagesEl === undefined) pagesEl = dom.closest<HTMLElement>('.pages')

    const blockElements = collectBlockElements(dom)
    const dirtyFrom = dirty?.from ?? 0
    const structural = dirty?.structural ?? true
    const emptyFlags = prepareBlockElements(blockElements, dirtyFrom, metricsCache)
    if (blockElements.length !== docPositions.length) {
      if (followUpPasses < MAX_PASSES) {
        followUpPasses += 1
        schedule(view, true)
      }
      return
    }

    const metrics = measureNaturalBlocksIncremental(
      blockElements,
      keepNext,
      emptyFlags,
      metricsCache,
      dirtyFrom,
      structural,
    )
    metricsCache = metrics
    syncIntrinsicSizes(blockElements, metrics, dirtyFrom)
    dirty = null

    const pagesRect = pagesEl?.getBoundingClientRect()
    const proseRect = dom.getBoundingClientRect()
    const contentStartOffset =
      pagesRect && proseRect.top >= pagesRect.top
        ? proseRect.top - pagesRect.top
        : marginV

    // Only hit-test paragraphs that are taller than one sheet.
    for (let i = dirtyFrom; i < metrics.length; i += 1) {
      if (metrics[i]!.height <= capacity + EPS) continue
      if (
        pagesRect &&
        trySplitOverflowingParagraph(
          view,
          i,
          docPositions,
          capacity,
          stride,
          contentStartOffset,
          pagesRect.top,
          blockElements[i]!,
        )
      ) {
        followUpPasses = 0
        dirty = { from: i, structural: true }
        schedule(view, true)
        return
      }
    }

    const { breaks, pageCount } = computePageBreaks(metrics, stride, capacity, contentStartOffset)

    if (pagesEl) {
      const minHeight = `calc(${pageCount - 1} * var(--sheet-stride) + var(--sheet-h))`
      if (minHeight !== lastMinHeight) {
        pagesEl.style.minHeight = minHeight
        lastMinHeight = minHeight
      }
    }

    const unchanged =
      breaks.length === state.spacers.length &&
      state.pageCount === pageCount &&
      breaks.every((b, i) => {
        const s = state.spacers[i]!
        return s.pos === docPositions[b.index] && Math.abs(s.height - b.height) < 1
      })
    if (unchanged) {
      followUpPasses = 0
      return
    }

    const spacers: SpacerRecord[] = breaks.map((b) => ({
      pos: docPositions[b.index]!,
      height: Math.max(0, Math.ceil(b.height)),
      comp:
        b.index > 0
          ? Math.min(metrics[b.index - 1]!.marginBottom, metrics[b.index]!.marginTop)
          : 0,
    }))

    const decorations = DecorationSet.create(
      view.state.doc,
      spacers.map((s) =>
        Decoration.widget(
          s.pos,
          () => {
            const el = document.createElement('div')
            el.className = 'page-spacer'
            el.setAttribute('data-page-spacer', '')
            el.style.height = `${s.height}px`
            return el
          },
          { side: -1, key: `spacer-${s.pos}-${s.height}` },
        ),
      ),
    )

    applyPagination(view, spacers, decorations, pageCount)
    followUpPasses = 0
  }

  const schedule = (view: PMEditorView, soon = false) => {
    if (timer !== null) {
      if (!soon) return
      clearTimeout(timer)
      timer = null
    }
    timer = setTimeout(() => {
      timer = null
      try {
        recompute(view)
      } catch (error) {
        console.error('[pword] pagination failed', error)
      }
    }, soon ? 16 : 250)
  }

  return Extension.create({
    name: 'pagination',

    addProseMirrorPlugins() {
      return [
        new Plugin<PaginationState>({
          key,
          state: {
            init: () => ({ spacers: [], decorations: DecorationSet.empty, pageCount: 1 }),
            apply(tr, value) {
              const meta = tr.getMeta(key) as PaginationMeta | undefined
              if (meta) {
                return {
                  spacers: meta.spacers,
                  decorations: meta.decorations,
                  pageCount: meta.pageCount,
                }
              }
              if (!tr.docChanged) return value
              return {
                spacers: value.spacers.map((s) => ({ ...s, pos: tr.mapping.map(s.pos) })),
                decorations: value.decorations.map(tr.mapping, tr.doc),
                pageCount: value.pageCount,
              }
            },
          },
          props: {
            decorations: (state) => key.getState(state)?.decorations,
          },
          view: (view) => {
            const onResize = () => {
              invalidateAll()
              schedule(view)
            }
            schedule(view)
            if (typeof document !== 'undefined' && document.fonts?.ready) {
              document.fonts.ready
                .then(() => {
                  invalidateAll()
                  schedule(view)
                })
                .catch(() => {})
            }
            window.addEventListener('resize', onResize)
            return {
              update: (nextView, prevState) => {
                if (nextView.composing) return
                if (nextView.state.doc.eq(prevState.doc)) return

                const prevDoc: PMNode = prevState.doc
                const nextDoc: PMNode = nextView.state.doc
                const range = findChangedBlockRange(
                  prevDoc.childCount,
                  nextDoc.childCount,
                  (i) => prevDoc.child(i).eq(nextDoc.child(i)),
                )
                dirty = mergeDirty(dirty, range)
                followUpPasses = 0
                schedule(nextView)
              },
              destroy: () => {
                window.removeEventListener('resize', onResize)
                if (timer !== null) clearTimeout(timer)
                timer = null
                metricsCache = null
              },
            }
          },
        }),
      ]
    },
  })
}
