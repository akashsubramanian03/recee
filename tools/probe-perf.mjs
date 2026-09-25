/**
 * Scroll-performance probe. Reports the three numbers that matter for judder:
 *
 *   1. idle FPS at several scroll depths — if this is FLAT down the page, scenes are
 *      still rendering after they have scrolled away, which is the main cost
 *   2. total canvas megapixels per frame at dpr 2 — the live site pushes ~5.0
 *   3. how many <video> elements are actually decoding
 *
 *   node tools/probe-perf.mjs                          # clone, then live
 *   node tools/probe-perf.mjs http://localhost:3001    # just one target
 *
 * Headless Chromium renders WebGL in software, so absolute FPS is far below what a
 * real GPU gives. Compare targets and before/after runs, never the raw number.
 */
import { chromium } from 'playwright'

const targets = process.argv[2]
  ? [[process.argv[2], 'TARGET', 9000]]
  : [
      ['http://localhost:3001/', 'CLONE', 9000],
      ['https://podium.global/', 'LIVE', 15000],
    ]

const DEPTHS = [
  [0, 'hero'],
  [3400, 'project grid'],
  [5600, 'worldwide'],
  [8000, 'footer'],
]

async function idleFps(page, y) {
  await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y)
  await page.waitForTimeout(1200)
  await page.evaluate(() => {
    window.__f = []
    let last = performance.now()
    const tick = (t) => {
      window.__f.push(t - last)
      last = t
      requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  await page.waitForTimeout(2000)
  return page.evaluate(() => {
    const f = window.__f.slice(3)
    const mean = f.reduce((s, x) => s + x, 0) / f.length
    return { fps: +(1000 / mean).toFixed(1), worstMs: +Math.max(...f).toFixed(1) }
  })
}

const browser = await chromium.launch()

for (const [url, name, wait] of targets) {
  // dpr 2 so the canvas-megapixel figure reflects a retina display.
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 },
    deviceScaleFactor: 2,
  })
  const page = await context.newPage()
  await page.goto(url, { waitUntil: 'load', timeout: 90_000 })
  await page.waitForTimeout(wait)

  console.log(`\n===== ${name} =====`)

  const canvases = await page.evaluate(() => {
    const list = [...document.querySelectorAll('canvas')].map((c) => {
      const r = c.getBoundingClientRect()
      return {
        backing: `${c.width}x${c.height}`,
        css: `${Math.round(r.width)}x${Math.round(r.height)}`,
        mp: +((c.width * c.height) / 1e6).toFixed(2),
      }
    })
    return { list, totalMp: +(list.reduce((s, c) => s + c.mp, 0)).toFixed(2) }
  })
  console.log(`  canvases (viewport 1400x900 @ dpr 2):`)
  for (const c of canvases.list) {
    console.log(`    ${c.backing.padEnd(12)} css ${c.css.padEnd(12)} ${String(c.mp).padStart(6)} MP`)
  }
  console.log(`    TOTAL ${String(canvases.totalMp).padStart(28)} MP / frame`)

  console.log(`  idle FPS by depth:`)
  for (const [y, label] of DEPTHS) {
    const r = await idleFps(page, y)
    console.log(
      `    scrollY ${String(y).padStart(5)}  ${label.padEnd(14)} ${String(r.fps).padStart(6)} fps` +
        `   worst frame ${r.worstMs} ms`,
    )
  }

  const videos = await page.evaluate(() => {
    const v = [...document.querySelectorAll('video')]
    return {
      total: v.length,
      playing: v.filter((x) => !x.paused && !x.ended).length,
      withSrc: v.filter((x) => !!x.currentSrc).length,
    }
  })
  console.log(
    `  videos: ${videos.total} elements, ${videos.withSrc} with a source, ${videos.playing} decoding`,
  )

  await context.close()
}

await browser.close()
console.log('')
