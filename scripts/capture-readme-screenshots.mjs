/**
 * Capture README screenshots from a running dev server.
 * Run: node scripts/capture-readme-screenshots.mjs
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const BASE = process.env.PWORD_URL ?? 'http://127.0.0.1:5173'
const OUT_DIR = 'docs/screenshots'

const SAMPLE = `A document that never leaves this desk.

Write here the way you would on paper: slowly, then all at once. Pword keeps the draft in this browser — no account, no upload, no one else's server.

When the page is full, the next sheet appears underneath, like a galley waiting for marks.`

async function setTheme(page, label) {
  await page.getByRole('button', { name: /theme:/i }).click()
  await page.getByRole('menuitem', { name: new RegExp(`^${label}$`, 'i') }).click()
  await page.waitForTimeout(250)
}

async function ensureEnglish(page) {
  const toEn = page.getByRole('button', { name: /switch to en/i })
  if (await toEn.isVisible().catch(() => false)) await toEn.click()
}

;(async () => {
  mkdirSync(OUT_DIR, { recursive: true })
  const browser = await chromium.launch({
    headless: true,
    executablePath: process.env.PWORD_CHROME || undefined,
  })
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  })

  await page.goto(BASE, { waitUntil: 'networkidle' })
  await page.getByRole('button', { name: /start writing|yazmaya başla/i }).waitFor({ timeout: 15_000 })
  await ensureEnglish(page)
  await setTheme(page, 'Light')

  await page.screenshot({ path: `${OUT_DIR}/home.png`, fullPage: false })

  await page.getByRole('button', { name: /start writing/i }).click()
  await page.getByRole('toolbar', { name: /formatting/i }).waitFor()

  const title = page.getByLabel('Document title')
  await title.fill('Proof notes')

  const editor = page.locator('.ProseMirror')
  await editor.click()
  await page.keyboard.press('Control+A')
  await page.keyboard.type(SAMPLE, { delay: 8 })
  await page.waitForTimeout(600)

  await page.screenshot({ path: `${OUT_DIR}/editor.png`, fullPage: false })

  await setTheme(page, 'Dark')
  await page.screenshot({ path: `${OUT_DIR}/editor-dark.png`, fullPage: false })

  await page.getByRole('button', { name: /back to documents/i }).click()
  await page.getByRole('heading', { name: /proof desk/i }).waitFor()
  await page.waitForTimeout(400)
  await page.screenshot({ path: `${OUT_DIR}/home-dark.png`, fullPage: false })

  await browser.close()
  console.log(`Wrote screenshots to ${OUT_DIR}`)
})().catch((error) => {
  console.error(error)
  process.exit(1)
})
