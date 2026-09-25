/**
 * Quick visual + console check against the running dev server.
 *   node tools/check.mjs [route] [port]
 */
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const route = process.argv[2] || '/'
const port = process.argv[3] || '3001'
const slug = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_')
const OUT = join(ROOT, 'reference', 'check', slug)
await mkdir(OUT, { recursive: true })

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })

const messages = []
page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning') messages.push(`[${m.type()}] ${m.text()}`)
})
page.on('pageerror', (e) => messages.push(`[pageerror] ${e.message}`))
page.on('requestfailed', (r) =>
  messages.push(`[404?] ${r.url().slice(0, 120)} — ${r.failure()?.errorText}`),
)

await page.goto(`http://localhost:${port}${route}`, { waitUntil: 'load', timeout: 60_000 })
await page.waitForTimeout(7000)

/**
 * Scroll with real wheel events rather than window.scrollTo: Lenis only smooths
 * gestures, and the hero's velocity-driven pulse (which is what softens the mark's
 * edge) never fires on a programmatic jump.
 */
const steps = [0, 540, 1080, 1620, 2160, 2700, 3240, 4320, 5400, 6480, 7560]
await page.mouse.move(960, 540)
let current = 0
for (const y of steps) {
  const delta = y - current
  const chunks = Math.max(1, Math.ceil(Math.abs(delta) / 120))
  for (let i = 0; i < chunks; i++) {
    await page.mouse.wheel(0, delta / chunks)
    await page.waitForTimeout(16)
  }
  current = y
  await page.waitForTimeout(900)
  await page.screenshot({ path: join(OUT, `y${String(y).padStart(5, '0')}.png`) })
}

const info = await page.evaluate(() => ({
  docHeight: document.documentElement.scrollHeight,
  bodyBg: getComputedStyle(document.body).backgroundColor,
  canvases: document.querySelectorAll('canvas').length,
  hasWebGL: (() => {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  })(),
}))

console.log(`route ${route} @ :${port}`)
console.log(JSON.stringify(info, null, 1))
console.log(`\nscreenshots -> reference/check/${slug}/`)
if (messages.length) {
  console.log(`\n${messages.length} console issues:`)
  for (const m of [...new Set(messages)].slice(0, 30)) console.log('  ' + m)
} else {
  console.log('\nno console errors')
}

await browser.close()
