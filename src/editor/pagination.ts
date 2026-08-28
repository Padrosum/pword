import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'
import type { EditorView as PMEditorView } from '@tiptap/pm/view'
import { computePageBreaks, type BlockMetrics } from './page-math'

/**
 * Real vertical pagination, the way a word processor does it: pages break
 * by height, not by character count. The plugin measures the natural flow
 * of top-level blocks and inserts invisible spacer widgets at page
 * boundaries, pushing content to the top of the next sheet. The paper
 * rectangles behind the flow are painted by CSS (.pages), so the content
 * lands exactly on the sheet grid.
 *
 * The algorithm is deterministic: re-measuring after the spacers are
 * applied reproduces the same natural geometry (spacer heights plus their
 * margin compensation are subtracted back out), so the computation
 * converges and never loops.
 */

const key = new PluginKey('pagePagination')

const KEEP_NEXT_TYPES = new Set(['heading', 'docTitle', 'docSubtitle'])

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

export interface PaginationOptions {
  onPageCount?: (count: number) => void
}

export function createPaginationPlugin(options: PaginationOptions = {}) {
  const measureVar = createVarMeasurer()
  let timer: ReturnType<typeof setTimeout> | null = null
  let lastMinHeight = ''
  let pagesEl: HTMLElement | null | undefined

  const recompute = (view: PMEditorView) => {
    const state = key.getState(view.state) as PaginationState | undefined
    if (!state) return

    const sheetH = measureVar('--sheet-h')
    const gap = measureVar('--sheet-gap')
    const marginV = measureVar('--page-margin-v')
    const stride = sheetH + gap
    const capacity = sheetH - 2 * marginV
    if (!(stride > 0 && capacity > 0)) return

    // Natural positions of the top-level blocks in the document.
    const docPositions: number[] = []
    const keepNext: boolean[] = []
    let pos = 0
    view.state.doc.forEach((child) => {
      docPositions.push(pos)
      pos += child.nodeSize
      keepNext.push(KEEP_NEXT_TYPES.has(child.type.name))
    })

    // Walk the DOM: content blocks and spacer widgets interleave in order.
    // Subtracting each spacer's height plus its margin compensation from
    // the measured offsets restores the natural, spacer-free geometry.
    const dom = view.dom as HTMLElement
    const domChildren = Array.from(dom.children) as HTMLElement[]
    const metrics: BlockMetrics[] = []
    let acc = 0
    let spacerIdx = 0
    let blockIdx = 0

    for (const child of domChildren) {
      if (child.hasAttribute('data-page-spacer')) {
        const record = state.spacers[spacerIdx]
        acc += child.offsetHeight + (record?.comp ?? 0)
        spacerIdx += 1
        continue
      }
      const cs = getComputedStyle(child)
      metrics.push({
        top: child.offsetTop - acc,
        height: child.offsetHeight,
        marginTop: Number.parseFloat(cs.marginTop) || 0,
        marginBottom: Number.parseFloat(cs.marginBottom) || 0,
        keepNext: keepNext[blockIdx] ?? false,
      })
      blockIdx += 1
    }

    if (metrics.length !== docPositions.length) return // out of sync; retry later

    const { breaks, pageCount } = computePageBreaks(metrics, stride, capacity)

    // The flow ends wherever the text ends, so the LAST sheet's paper would
    // otherwise be painted only down to the content end ("half page").
    // Stretch the painted area to full sheets: the paper gradient lives on
    // .pages, so its box must cover every sheet completely.
    if (pagesEl === undefined) pagesEl = dom.closest<HTMLElement>('.pages')
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
    if (unchanged) return

    const spacers: SpacerRecord[] = breaks.map((b) => ({
      pos: docPositions[b.index]!,
      height: Math.max(0, Math.round(b.height)),
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

    view.dispatch(
      view.state.tr.setMeta(key, { spacers, decorations, pageCount } satisfies PaginationMeta),
    )
    options.onPageCount?.(pageCount)
  }

  const schedule = (view: PMEditorView) => {
    if (timer !== null) return
    timer = setTimeout(() => {
      timer = null
      try {
        recompute(view)
      } catch (error) {
        console.error('[pword] pagination failed', error)
      }
    }, 250)
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
            const onResize = () => schedule(view)
            schedule(view)
            if (typeof document !== 'undefined' && document.fonts?.ready) {
              document.fonts.ready.then(() => schedule(view)).catch(() => {})
            }
            window.addEventListener('resize', onResize)
            return {
              update: (nextView) => {
                if (!nextView.composing) schedule(nextView)
              },
              destroy: () => {
                window.removeEventListener('resize', onResize)
                if (timer !== null) clearTimeout(timer)
                timer = null
              },
            }
          },
        }),
      ]
    },
  })
}
