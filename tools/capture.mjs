/**
 * Screenshots + computed-style dumps for visual comparison.
 *
 *   node tools/capture.mjs                          -> reference/live/
 *   node tools/capture.mjs --base http://localhost:3000 --out local
 *
 * Per route, per viewport it produces:
 *   fullpage.png              whole document
 *   scroll/0000.png ...       one frame every STEP_VH of viewport height
 *   computed.json             getComputedStyle for every classed element
 * Plus, for "/", an 8s video of the preloader -> logo-morph sequence.
 */
import { chromium } from 'playwright'
import { mkdir, writeFile, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

const args = process.argv.slice(2)
const argOf = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}

const BASE = argOf('base', 'https://podium.global')
const OUT_NAME = argOf('out', BASE.includes('localhost') ? 'local' : 'live')
const OUT = join(ROOT, 'reference', OUT_NAME)
const ONLY = argOf('only', null)

const ROUTES = ONLY
  ? [ONLY]
  : [
      '/',
      '/projects/deviate',
      '/projects/life-edition',
      '/projects/80-winters',
      '/projects/jay-du-temple',
      '/projects/not-quite-gone',
      '/projects/milimani',
      '/projects/summer-nights',
      '/projects/western-states',
    ]

const VIEWPORTS = [
  { name: 'desktop', width: 1920, height: 1080 },
  { name: 'mobile', width: 390, height: 844 },
]

/** Scroll step as a fraction of viewport height. 0.5 => a frame every half-screen. */
const STEP_VH = 0.5
/** Give shader/scroll-driven scenes time to settle before each frame. */
const SETTLE_MS = 450

const slug = (route) => (route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_'))

/** Freeze anything that would make two runs differ for reasons we don't care about. */
const DETERMINISM_CSS = `
  *, *::before, *::after {
    caret-color: transparent !important;
  }
`

async function dumpComputed(page) {
  return page.evaluate(() => {
    const PROPS = [
      'display', 'position', 'color', 'backgroundColor', 'fontFamily', 'fontSize',
      'fontWeight', 'lineHeight', 'letterSpacing', 'textTransform', 'textAlign',
      'width', 'height', 'marginTop', 'marginBottom', 'paddingTop', 'paddingBottom',
      'paddingLeft', 'paddingRight', 'gridTemplateColumns', 'columnGap', 'rowGap',
      'opacity', 'zIndex', 'borderRadius', 'aspectRatio', 'transform',
    ]
    const out = []
    for (const el of document.querySelectorAll('[class]')) {
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      const style = {}
      for (const p of PROPS) style[p] = cs[p]
      out.push({
        tag: el.tagName.toLowerCase(),
        cls: typeof el.className === 'string' ? el.className : el.className.baseVal,
        text: (el.childElementCount === 0 ? el.textContent || '' : '').trim().slice(0, 80),
        rect: {
          x: Math.round(rect.x), y: Math.round(rect.y),
          w: Math.round(rect.width), h: Math.round(rect.height),
        },
        style,
      })
    }
    return out
  })
}

async function captureScrollSequence(page, dir, viewport) {
  await mkdir(dir, { recursive: true })
  const total = await page.evaluate(() => document.documentElement.scrollHeight)
  const step = Math.round(viewport.height * STEP_VH)
  const frames = Math.max(1, Math.ceil((total - viewport.height) / step) + 1)

  /*
   * Scroll with real wheel events. Lenis only smooths gestures, and the hero's
   * velocity-driven pulse — which is what softens the mark's edge — never fires on a
   * programmatic scrollTo. Capturing with jumps measures a state the site never
   * actually shows a user.
   */
  await page.mouse.move(viewport.width / 2, viewport.height / 2)
  let current = 0

  for (let i = 0; i < frames; i++) {
    const y = Math.min(i * step, Math.max(0, total - viewport.height))
    const delta = y - current
    const chunks = Math.max(1, Math.ceil(Math.abs(delta) / 120))
    for (let c = 0; c < chunks; c++) {
      await page.mouse.wheel(0, delta / chunks)
      await page.waitForTimeout(16)
    }
    current = y
    await page.waitForTimeout(SETTLE_MS)
    await page.screenshot({ path: join(dir, `${String(i).padStart(4, '0')}.png`) })
  }
  return frames
}

async function run() {
  const browser = await chromium.launch()
  console.log(`\ncapturing ${BASE} -> reference/${OUT_NAME}\n`)

  for (const route of ROUTES) {
    for (const viewport of VIEWPORTS) {
      const dir = join(OUT, slug(route), viewport.name)
      await rm(dir, { recursive: true, force: true })
      await mkdir(dir, { recursive: true })

      const context = await browser.newContext({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: viewport.name === 'mobile',
        hasTouch: viewport.name === 'mobile',
        reducedMotion: 'no-preference',
      })
      const page = await context.newPage()
      await page.addStyleTag({ content: DETERMINISM_CSS }).catch(() => {})

      try {
        await page.goto(BASE + route, { waitUntil: 'networkidle', timeout: 90_000 })
      } catch {
        // networkidle never settles on pages with looping video; load is enough.
        await page.goto(BASE + route, { waitUntil: 'load', timeout: 90_000 })
      }
      // Let the preloader finish and the first shader frames render. The live site
      // holds its intro until every mosaic video has loaded — around 12s — and
      // sampling earlier captures the preloader rather than the hero.
      await page.waitForTimeout(13000)

      await page.screenshot({ path: join(dir, 'fullpage.png'), fullPage: true })
      const frames = await captureScrollSequence(page, join(dir, 'scroll'), viewport)

      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
      await page.waitForTimeout(600)
      await writeFile(
        join(dir, 'computed.json'),
        JSON.stringify(await dumpComputed(page), null, 1) + '\n',
      )

      console.log(`  ✓ ${route.padEnd(28)} ${viewport.name.padEnd(8)} ${frames} scroll frames`)
      await context.close()
    }
  }

  // The intro sequence only exists in time — capture it as video.
  const introDir = join(OUT, 'home', 'intro-video')
  await rm(introDir, { recursive: true, force: true })
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: { dir: introDir, size: { width: 1920, height: 1080 } },
  })
  const page = await ctx.newPage()
  await page.goto(BASE + '/', { waitUntil: 'commit' })
  await page.waitForTimeout(8000)
  await ctx.close()
  console.log(`  ✓ intro video -> reference/${OUT_NAME}/home/intro-video/`)

  await browser.close()
  console.log('\ndone\n')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
