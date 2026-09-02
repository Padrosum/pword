/**
 * User-like pagination smoke test via Playwright.
 * Run: node scripts/pagination-user-test.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.PWORD_URL ?? 'http://localhost:5173'
const OUT_DIR = 'scripts/pagination-screenshots'

function paragraph(seed = '') {
  return `Lorem ipsum dolor sit amet ${seed}. Consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris. `
}

async function waitForPagination(page) {
  await page.waitForTimeout(1200)
}

async function getPaginationMetrics(page) {
  return page.evaluate(() => {
    const pagesEl = document.querySelector('.pages')
    const prose = document.querySelector('.ProseMirror')
    if (!pagesEl || !prose) return null

    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;visibility:hidden;'
    document.body.appendChild(probe)

    probe.style.height = 'var(--sheet-h)'
    const sheetHPx = probe.offsetHeight
    probe.style.height = 'var(--sheet-gap)'
    const sheetGapPx = probe.offsetHeight
    probe.style.height = 'var(--page-margin-v)'
    const marginVPx = probe.offsetHeight
    probe.remove()

    const stride = sheetHPx + sheetGapPx
    const capacity = sheetHPx - 2 * marginVPx
    const pagesRect = pagesEl.getBoundingClientRect()

    const blocks = [...prose.children].filter(
      (el) => el instanceof HTMLElement && !el.hasAttribute('data-page-spacer'),
    )

    const blockRects = blocks.map((el) => {
      const r = el.getBoundingClientRect()
      const topInPages = r.top - pagesRect.top
      const bottomInPages = r.bottom - pagesRect.top
      const startPage = Math.floor(topInPages / stride)
      const endPage = Math.floor(Math.max(topInPages, bottomInPages - 1) / stride)
      return {
        tag: el.tagName.toLowerCase(),
        text: (el.textContent ?? '').trim().slice(0, 50),
        top: topInPages,
        bottom: bottomInPages,
        height: r.height,
        startPage,
        endPage,
        crossesBoundary: startPage !== endPage,
        tallerThanPage: r.height > capacity + 2,
      }
    })

    const spacers = [...prose.querySelectorAll('[data-page-spacer]')]

    const statusText = document.body.textContent ?? ''
    const pageMatch = statusText.match(/~(\d+)\s+pages?/i)
    const pageCount = pageMatch ? Number(pageMatch[1]) : 1

    const firstPageBlocks = blockRects.filter((b) => b.startPage === 0)
    const secondPageBlocks = blockRects.filter((b) => b.startPage === 1)

    return {
      stride,
      capacity,
      pageCount,
      blockCount: blockRects.length,
      spacerCount: spacers.length,
      firstPageBlockCount: firstPageBlocks.length,
      secondPageBlockCount: secondPageBlocks.length,
      crossingBlocks: blockRects.filter((b) => b.crossesBoundary),
      oversizedBlocks: blockRects.filter((b) => b.tallerThanPage),
      firstPageHasContent: firstPageBlocks.some((b) => b.height > 8 && b.text.length > 0),
      firstPageEmptyWhenMultiPage:
        pageCount > 1 &&
        !firstPageBlocks.some((b) => b.height > 8 && b.text.length > 0),
      blockRects,
    }
  })
}

async function openFreshDocument(page) {
  await page.goto(BASE, { waitUntil: 'networkidle' })

  const backBtn = page.getByRole('button', { name: /back to documents/i })
  if (await backBtn.isVisible().catch(() => false)) {
    await backBtn.click()
    await page.getByRole('button', { name: /start writing/i }).waitFor({ state: 'visible' })
  }

  await page.getByRole('button', { name: /start writing/i }).click()
  await page.getByLabel('Document content').waitFor({ state: 'visible' })
  await waitForPagination(page)
}

async function focusEditor(page) {
  await page.getByLabel('Document content').click()
}

async function insertText(page, text) {
  await focusEditor(page)
  await page.keyboard.insertText(text)
  await waitForPagination(page)
}

async function selectParagraphStyle(page, styleId) {
  const styleSelect = page.locator('[role="toolbar"][aria-label="Formatting"] select').first()
  await styleSelect.waitFor({ state: 'visible' })
  await styleSelect.selectOption(styleId)
  await waitForPagination(page)
}

async function pastePlainText(page, text) {
  await focusEditor(page)
  await page.evaluate(async (value) => {
    await navigator.clipboard.writeText(value)
  }, text)
  await page.keyboard.press('Control+v')
  await waitForPagination(page)
}

async function duplicateViaClipboard(page) {
  await focusEditor(page)
  await page.keyboard.press('Control+a')
  await page.keyboard.press('Control+c')
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await page.keyboard.press('Control+v')
  await waitForPagination(page)
}

function assessScenario(name, metrics) {
  const issues = []
  if (!metrics) {
    return { name, ok: false, issues: ['Could not read pagination metrics'] }
  }
  if (metrics.firstPageEmptyWhenMultiPage) {
    issues.push('First page is empty while document spans multiple pages')
  }
  for (const block of metrics.crossingBlocks) {
    issues.push(
      `Block crosses page boundary (${block.tag}): "${block.text}" — top ${Math.round(block.top)}px, height ${Math.round(block.height)}px`,
    )
  }
  for (const block of metrics.oversizedBlocks) {
    if (block.tag === 'p') {
      issues.push(`Paragraph taller than one page was not split: "${block.text.slice(0, 40)}…"`)
    }
  }
  if (metrics.pageCount > 1 && metrics.spacerCount < metrics.pageCount - 1) {
    issues.push(`Expected ≥ ${metrics.pageCount - 1} spacer(s), found ${metrics.spacerCount}`)
  }
  return { name, ok: issues.length === 0, issues, metrics }
}

async function runScenario(page, index, name, fn) {
  try {
    await fn()
    const metrics = await getPaginationMetrics(page)
    const result = assessScenario(name, metrics)
    await page.screenshot({
      path: `${OUT_DIR}/scenario-${index}-${result.ok ? 'pass' : 'fail'}.png`,
      fullPage: true,
    })
    return result
  } catch (error) {
    await page.screenshot({ path: `${OUT_DIR}/scenario-${index}-error.png`, fullPage: true })
    return {
      name,
      ok: false,
      issues: [error instanceof Error ? error.message : String(error)],
    }
  }
}

async function main() {
  mkdirSync(OUT_DIR, { recursive: true })

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write'],
  })
  const page = await context.newPage()
  const results = []

  // 1. Plain typed text filling multiple pages
  results.push(
    await runScenario(page, 1, 'Plain text — continuous typing', async () => {
      await openFreshDocument(page)
      await insertText(page, `${paragraph('one')}\n\n`.repeat(45))
    }),
  )

  // 2. Heading + body
  results.push(
    await runScenario(page, 2, 'Heading 1 + normal paragraphs', async () => {
      await openFreshDocument(page)
      await selectParagraphStyle(page, 'h1')
      await insertText(page, 'An Essay About Pagination\n')
      await selectParagraphStyle(page, 'normal')
      await insertText(page, `${paragraph('two')}\n\n`.repeat(40))
    }),
  )

  // 3. Paste large pasted block
  results.push(
    await runScenario(page, 3, 'Paste — many paragraphs at once', async () => {
      await openFreshDocument(page)
      await pastePlainText(page, `${paragraph('paste')}\n\n`.repeat(55))
    }),
  )

  // 4. Copy duplicate then continue
  results.push(
    await runScenario(page, 4, 'Copy/paste duplicate + continue writing', async () => {
      await openFreshDocument(page)
      await insertText(page, paragraph('seed').repeat(4))
      await duplicateViaClipboard(page)
      await insertText(page, `\n\n${paragraph('more')}\n\n`.repeat(35))
    }),
  )

  // 5. Title + H2 + bullets
  results.push(
    await runScenario(page, 5, 'Title, Heading 2, body, bullet list', async () => {
      await openFreshDocument(page)
      await selectParagraphStyle(page, 'title')
      await insertText(page, 'My Document Title\n')
      await selectParagraphStyle(page, 'h2')
      await insertText(page, 'Introduction\n')
      await selectParagraphStyle(page, 'normal')
      await insertText(page, `${paragraph('intro')}\n\n`.repeat(30))
      await page.getByRole('button', { name: 'Bullet list' }).click()
      await insertText(page, 'First bullet with enough words to wrap across the line\n')
      await insertText(page, 'Second bullet item continues here\n')
      await insertText(page, 'Third bullet item continues here\n')
    }),
  )

  await browser.close()

  console.log('\n=== Pword pagination — user-like test ===\n')
  let failed = 0
  for (const result of results) {
    const status = result.ok ? 'PASS' : 'FAIL'
    if (!result.ok) failed += 1
    console.log(`[${status}] ${result.name}`)
    if (result.metrics) {
      console.log(
        `       pages=${result.metrics.pageCount}, blocks=${result.metrics.blockCount}, spacers=${result.metrics.spacerCount}, page1=${result.metrics.firstPageBlockCount}, page2=${result.metrics.secondPageBlockCount}`,
      )
    }
    for (const issue of result.issues) console.log(`       ⚠ ${issue}`)
    console.log('')
  }

  console.log(`Summary: ${results.length - failed}/${results.length} scenarios passed`)
  console.log(`Screenshots: ${OUT_DIR}/`)
  process.exit(failed > 0 ? 1 : 0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
