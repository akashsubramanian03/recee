/** Ad-hoc DOM probe against the live site: canvas layering + scroll-driven state. */
import { chromium } from 'playwright'

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } })
await page.goto('https://podium.global/', { waitUntil: 'load' })
await page.waitForTimeout(6000)

const report = async (label) => {
  const data = await page.evaluate(() => {
    const canvases = [...document.querySelectorAll('canvas')].map((c) => {
      const cs = getComputedStyle(c)
      const p = c.parentElement
      const ps = p ? getComputedStyle(p) : null
      return {
        size: `${c.width}x${c.height}`,
        canvas: { position: cs.position, zIndex: cs.zIndex, opacity: cs.opacity },
        parentCls: p?.className || '',
        parent: ps
          ? { position: ps.position, zIndex: ps.zIndex, opacity: ps.opacity, inset: ps.inset }
          : null,
      }
    })
    const blackSheet = document.querySelector('.z-\\[45\\]')
    const overlay60 = document.querySelector('.z-\\[60\\]')
    const heroText = document.querySelector('.c-hero_text')
    const scrollDriver = document.querySelector('.h-\\[200svh\\]')
    const g = (el) => {
      if (!el) return null
      const cs = getComputedStyle(el)
      return { opacity: cs.opacity, visibility: cs.visibility, zIndex: cs.zIndex, transform: cs.transform }
    }
    return {
      scrollY: Math.round(window.scrollY),
      canvases,
      blackSheet: g(blackSheet),
      overlay60: g(overlay60),
      heroText: g(heroText),
      heroTextTransform: heroText ? getComputedStyle(heroText).transform : null,
      scrollDriverHeight: scrollDriver ? getComputedStyle(scrollDriver).height : null,
      bodyBg: getComputedStyle(document.body).backgroundColor,
      htmlBg: getComputedStyle(document.documentElement).backgroundColor,
      docHeight: document.documentElement.scrollHeight,
    }
  })
  console.log(`\n===== ${label} =====`)
  console.log(JSON.stringify(data, null, 1))
}

await report('scroll 0')
await page.evaluate(() => window.scrollTo({ top: 800, behavior: 'instant' }))
await page.waitForTimeout(1200)
await report('scroll 800')
await page.evaluate(() => window.scrollTo({ top: 2200, behavior: 'instant' }))
await page.waitForTimeout(1200)
await report('scroll 2200')

await browser.close()
