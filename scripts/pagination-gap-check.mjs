/** Quick visual gap analysis for scenario 2 */
import { chromium } from 'playwright'

const paragraph =
  'Lorem ipsum dolor sit amet. Consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam quis nostrud exercitation ullamco laboris. '

async function main() {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /start writing/i }).click()
  await page.getByLabel('Document content').waitFor()
  await page.locator('[role="toolbar"][aria-label="Formatting"] select').first().selectOption('h1')
  await page.getByLabel('Document content').click()
  await page.keyboard.insertText('An Essay About Pagination\n')
  await page.locator('[role="toolbar"][aria-label="Formatting"] select').first().selectOption('normal')
  await page.keyboard.insertText(`${paragraph}\n\n`.repeat(40))
  await page.waitForTimeout(1500)

  const report = await page.evaluate(() => {
    const pagesEl = document.querySelector('.pages')
    const prose = document.querySelector('.ProseMirror')
    if (!pagesEl || !prose) return null

    const probe = document.createElement('div')
    probe.style.cssText = 'position:absolute;visibility:hidden;'
    document.body.appendChild(probe)
    probe.style.height = 'var(--sheet-h)'
    const sheetH = probe.offsetHeight
    probe.style.height = 'var(--sheet-gap)'
    const gap = probe.offsetHeight
    probe.style.height = 'var(--page-margin-v)'
    const marginV = probe.offsetHeight
    probe.remove()

    const stride = sheetH + gap
    const capacity = sheetH - 2 * marginV
    const pagesTop = pagesEl.getBoundingClientRect().top

    const blocks = [...prose.children].filter(
      (el) => el instanceof HTMLElement && !el.hasAttribute('data-page-spacer'),
    )
    const spacers = [...prose.querySelectorAll('[data-page-spacer]')]

    const items = [...prose.children].map((el) => {
      const r = el.getBoundingClientRect()
      const top = r.top - pagesTop
      const bottom = r.bottom - pagesTop
      const page = Math.floor(top / stride)
      const isSpacer = el.hasAttribute('data-page-spacer')
      return {
        kind: isSpacer ? 'spacer' : el.tagName.toLowerCase(),
        top: Math.round(top),
        bottom: Math.round(bottom),
        height: Math.round(r.height),
        page,
        text: isSpacer ? `[spacer ${r.height}px]` : (el.textContent ?? '').slice(0, 40),
      }
    })

    // Gap at end of page 0: from last block bottom on page 0 to page 1 content start
    const page0Blocks = items.filter((i) => i.kind !== 'spacer' && i.page === 0)
    const page1Blocks = items.filter((i) => i.kind !== 'spacer' && i.page === 1)
    const page0End = page0Blocks.length ? Math.max(...page0Blocks.map((b) => b.bottom)) : 0
    const page1Start = page1Blocks.length ? Math.min(...page1Blocks.map((b) => b.top)) : stride
    const page0Unused = stride - page0End
    const page1LeadingGap = page1Start - stride

    return {
      sheetH,
      stride,
      capacity,
      page0End,
      page1Start,
      page0Unused,
      page1LeadingGap,
      spacerHeights: spacers.map((s) => s.offsetHeight),
      firstItems: items.slice(0, 12),
      aroundBreak: items.filter((i) => i.top > page0End - 100 && i.top < page1Start + 200),
    }
  })

  console.log(JSON.stringify(report, null, 2))
  await browser.close()
}

main()
