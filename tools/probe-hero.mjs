/**
 * Measurements for the hero portal's opening.
 *
 *   node tools/probe-hero.mjs [url] [waitMs]
 *       Coverage sweep: white/black viewport fraction every 100px of scroll. Shows how
 *       the mark opens and where the sheet finally clears.
 *
 *   node tools/probe-hero.mjs --curve
 *       Fine-resolution opening curve for BOTH sites, normalised so the shapes can be
 *       compared directly. This is the one that matters: the curve must ease IN, i.e.
 *       stay near 0 through the first ~75px. An ease-out has an infinite derivative at
 *       p = 0 and makes slow scrolling visibly step.
 *
 *   node tools/probe-hero.mjs --steps [url]
 *       Worst single-frame jump in uUvScale while scrolling SLOWLY. Reads the dev-only
 *       `window.__hero` hook, so it only works against the dev server. Target < 0.01.
 *
 *   node tools/probe-hero.mjs --notch [--ours]
 *       Realistic mouse wheel: 100px notches at 150ms. Catches the mark REBOUNDING —
 *       growing, springing back, growing again once per notch. Neither --steps (a
 *       continuous crawl) nor a continuous drag exercises this; the chatter lives in
 *       the gap between notches, so this is the mode that matters for wheel users.
 *       Reports backward steps in the effective scale, plus a rebound test that also
 *       runs against the live site for comparison.
 *
 *   node tools/probe-hero.mjs --softness [--ours]
 *       Is the mark a soft blob or a hard stencil? Reports pure-black fraction, gradient
 *       fraction and edge-run length against the live site, in both orientations. Every
 *       other probe here is blind to this — a stencil and a blob can have identical mean
 *       luminance and identical per-frame deltas — and it is the most visible way for the
 *       hero to be wrong.
 *
 *   node tools/probe-hero.mjs --render [--ours]
 *       THE ONE THAT COUNTS. Captures every composited frame (CDP screencast) over a
 *       real wheel gesture and looks for a freeze or a jump. The modes above read
 *       uniforms; all of them passed while the hero visibly stalled and popped, because
 *       what you see depends on several uniforms interacting through the shader. When
 *       this disagrees with the others, believe this one.
 *
 * The live site holds its intro until every mosaic video has loaded — ~12s. Sampling
 * earlier measures the preloader, not the hero.
 */
import { chromium } from 'playwright'

const args = process.argv.slice(2)
const mode = args.find((a) => a.startsWith('--'))
const positional = args.filter((a) => !a.startsWith('--'))

const LIVE = 'https://podium.global'
const LIVE_WAIT = 17_000
const CLONE_WAIT = 9_000

/** Fraction of the viewport that is white / mid / black, from a downsampled screenshot. */
async function coverage(page) {
  const shot = await page.screenshot({ type: 'png' })
  return page.evaluate(async (b64) => {
    const img = new Image()
    img.src = 'data:image/png;base64,' + b64
    await img.decode()
    const c = document.createElement('canvas')
    c.width = 192
    c.height = 108
    const x = c.getContext('2d')
    x.drawImage(img, 0, 0, c.width, c.height)
    const d = x.getImageData(0, 0, c.width, c.height).data
    let white = 0
    let mid = 0
    let black = 0
    for (let i = 0; i < d.length; i += 4) {
      const v = (d[i] + d[i + 1] + d[i + 2]) / 3
      if (v > 235) white++
      else if (v < 20) black++
      else if (v > 60 && v < 220) mid++
    }
    const total = c.width * c.height
    const px = (px2, py) => {
      const i = (py * c.width + px2) * 4
      return `${d[i]},${d[i + 1]},${d[i + 2]}`
    }
    let sum = 0
    for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3
    return {
      // Prefer `lum` for anything quantitative. The white/mid/black counts are threshold
      // based and flip category on a knife edge as the sheet fades — 255 * 0.92 reads as
      // white, 255 * 0.905 does not — which has produced phantom jumps twice now.
      lum: +(sum / total / 255).toFixed(4),
      white: +(white / total).toFixed(3),
      mid: +(mid / total).toFixed(3),
      black: +(black / total).toFixed(3),
      bl: px(2, 105),
      br: px(189, 105),
    }
  }, shot.toString('base64'))
}

async function open(browser, url, wait, viewport = { width: 1400, height: 900 }) {
  const page = await browser.newPage({ viewport })
  await page.goto(url + '/', { waitUntil: 'load', timeout: 90_000 })
  await page.waitForTimeout(wait)
  return page
}

/** Default mode: coverage every 100px, with the hero progress alongside. */
async function sweep() {
  const target = positional[0] || LIVE
  const wait = Number(positional[1] ?? (target.includes('localhost') ? CLONE_WAIT : LIVE_WAIT))
  const browser = await chromium.launch()
  const page = await open(browser, target, wait, { width: 1920, height: 1080 })

  console.log(`${target}\n`)
  console.log('scrollY   btmLeft      btmRight     whiteFrac  midFrac  blackFrac')
  for (let y = 0; y <= 1600; y += 100) {
    await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y)
    await page.waitForTimeout(500)
    const s = await coverage(page)
    const p = await page.evaluate(() => {
      const v = window.__heroProgress
      return typeof v === 'number' ? Number(v.toFixed(3)) : null
    })
    console.log(
      `${String(y).padStart(6)}    ${s.bl.padEnd(12)} ${s.br.padEnd(12)} ` +
        `${String(s.white).padStart(8)}  ${String(s.mid).padStart(7)}  ${String(s.black).padStart(8)}` +
        (p === null ? '' : `   p=${p}`),
    )
  }
  await browser.close()
}

/**
 * Opening curve at fine resolution, both sites, normalised against each site's own
 * rest state and fully-open state so the SHAPES are comparable.
 */
async function curveMode() {
  const POINTS = [0, 25, 50, 75, 100, 150, 200, 300, 450, 600, 750, 900]
  /**
   * Live curve measured at 1400x900. Baked in so `--ours` can iterate on our own curve
   * without re-measuring the reference every time (which costs ~17s of intro wait plus
   * a screenshot per point). Re-measure with a plain `--curve` if the site changes.
   */
  const LIVE_REFERENCE = [0, 0, 0.015, 0.032, 0.051, 0.078, 0.101, 0.222, 0.37, 0.399, 0.613, 1]
  const skipLive = args.includes('--ours')
  const clone = positional[0] || 'http://localhost:3001'
  const browser = await chromium.launch()

  const run = async (url, wait) => {
    const page = await open(browser, url, wait)
    const out = []
    for (const y of POINTS) {
      await page.evaluate((to) => window.scrollTo({ top: to, behavior: 'instant' }), y)
      await page.waitForTimeout(750)
      out.push((await coverage(page)).lum)
    }
    await page.close()
    return out
  }

  const live = skipLive ? null : await run(LIVE, LIVE_WAIT)
  const ours = await run(clone, CLONE_WAIT)

  // 0 = at rest, 1 = fully open at the last sample point.
  const norm = (r) => r.map((v) => +((r[0] - v) / (r[0] - r[r.length - 1] || 1)).toFixed(3))
  const liveNorm = live ? norm(live) : LIVE_REFERENCE
  const oursNorm = norm(ours)

  const row = (label, vals) => `  ${label.padEnd(7)}${vals.map((v) => String(v).padStart(6)).join('')}`
  console.log('\nOpening curve — fraction of the total opening reached at each scroll offset.')
  console.log('The curve must EASE IN: near 0 through the first ~75px. A front-loaded')
  console.log('(ease-out) curve makes slow scrolling step.\n')
  console.log(row('scrollY', POINTS))
  console.log(row(live ? 'live' : 'live*', liveNorm))
  console.log(row('ours', oursNorm))
  if (!live) console.log('  * baked-in reference, measured at 1400x900')

  const err = oursNorm.reduce((s, v, i) => s + Math.abs(v - liveNorm[i]), 0) / oursNorm.length
  console.log(`\n  mean absolute error vs live: ${err.toFixed(4)}`)

  if (live) {
    console.log('\nraw white fraction')
    console.log(row('live', live))
    console.log(row('ours', ours))
  }

  await browser.close()
}

/**
 * Worst single-frame change in uUvScale while scrolling slowly. This is the number that
 * corresponds to visible stepping — the uniform spans 1.4 -> 0.25, so a jump of 0.038 is
 * 3.3% of the whole range in one frame.
 */
async function stepsMode() {
  const target = positional[0] || 'http://localhost:3001'
  const browser = await chromium.launch()
  const page = await open(browser, target, CLONE_WAIT)
  await page.mouse.move(700, 450)

  const sample = async (label, deltaPx, gapMs, n) => {
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(1200)
    await page.evaluate(() => {
      window.__trace = []
      const tick = () => {
        if (window.__hero) {
          window.__trace.push([window.__hero.progress, window.__hero.uvScale])
        }
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    for (let i = 0; i < n; i++) {
      await page.mouse.wheel(0, deltaPx)
      await page.waitForTimeout(gapMs)
    }
    await page.waitForTimeout(200)

    const r = await page.evaluate(() => {
      const t = window.__trace
      let worst = 0
      let worstAt = 0
      for (let i = 1; i < t.length; i++) {
        const d = Math.abs(t[i][1] - t[i - 1][1])
        if (d > worst) {
          worst = d
          worstAt = t[i][0]
        }
      }
      return { frames: t.length, worst: +worst.toFixed(4), worstAt: +worstAt.toFixed(4) }
    })
    console.log(
      `  ${label.padEnd(22)} frames:${String(r.frames).padStart(4)}` +
        `   worst uvScale jump/frame: ${String(r.worst).padStart(7)}  (at progress ${r.worstAt})`,
    )
    return r.worst
  }

  console.log(`\n${target} — worst per-frame uUvScale jump. Target < 0.01.\n`)
  const slow = await sample('slow (12px / 60ms)', 12, 60, 40)
  await sample('fast (100px / 16ms)', 100, 16, 12)
  console.log(`\n  ${slow < 0.01 ? 'PASS' : 'FAIL'} — slow-scroll worst jump ${slow} (was 0.0383 with the sqrt curve)`)

  await browser.close()
}

/**
 * Wheel-notch behaviour. Two independent readings:
 *   - from the dev hook: per-frame reversals in the effective scale the shader uses
 *   - from screenshots: does the mark shrink back during the coast after each notch
 * The second runs on the live site too, which is the only way to know how much rebound
 * is correct rather than merely small.
 */
async function notchMode() {
  const skipLive = args.includes('--ours')
  const target = positional[0] || 'http://localhost:3001'
  const browser = await chromium.launch()

  // 1. Per-frame reversals, clone only (needs window.__hero).
  {
    const page = await open(browser, target, CLONE_WAIT)
    await page.mouse.move(700, 450)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(1200)
    await page.evaluate(() => {
      window.__t = []
      const tick = () => {
        const h = window.__hero
        // The opening amount, which is what drives the mark's magnification.
        if (h) window.__t.push(h.open)
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })
    for (let i = 0; i < 10; i++) {
      await page.mouse.wheel(0, 100)
      await page.waitForTimeout(150)
    }
    await page.waitForTimeout(600)
    const r = await page.evaluate(() => {
      const t = window.__t
      let back = 0
      let worst = 0
      for (let i = 1; i < t.length; i++) {
        const d = t[i] - t[i - 1]
        if (d > 0.0008) {
          back++
          worst = Math.max(worst, d)
        }
      }
      return { frames: t.length, back, worst: +worst.toFixed(4) }
    })
    console.log('\nWheel notches — the mark must only ever grow.\n')
    console.log(
      `  effective-scale reversals: ${r.back} over ${r.frames} frames` +
        `   largest backward step: ${r.worst}`,
    )
    console.log(`  ${r.back < 5 && r.worst < 0.015 ? 'PASS' : 'FAIL'} ` +
      `(target < 5 reversals, < 0.015; was 28 and 0.069)`)
    await page.close()
  }

  // 2. Rebound during the coast after each notch — comparable across sites.
  const rebound = async (url, label, wait) => {
    const page = await open(browser, url, wait)
    await page.mouse.move(700, 450)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(1000)
    let rebounds = 0
    let worst = 0
    for (let i = 0; i < 8; i++) {
      await page.mouse.wheel(0, 100)
      await page.waitForTimeout(40)
      const a = (await coverage(page)).white
      await page.waitForTimeout(200)
      const b = (await coverage(page)).white
      const delta = b - a // positive => the mark shrank back
      if (delta > 0.004) {
        rebounds++
        worst = Math.max(worst, delta)
      }
    }
    console.log(`  ${label.padEnd(6)} rebounds ${rebounds}/8   worst +${worst.toFixed(3)}`)
    await page.close()
    return worst
  }

  console.log('\n  rebound after each notch (mark shrinking back during the coast)')
  if (!skipLive) await rebound(LIVE, 'live', LIVE_WAIT)
  else console.log('  live   rebounds 5/8   worst +0.013   (baked-in reference)')
  await rebound(target, 'ours', CLONE_WAIT)
  console.log('\n  Match live, do not beat it — a near-zero rebound means the flare is gone.')

  await browser.close()
}

/**
 * The one that counts: measures the RENDERED FRAME, not uniforms.
 *
 * `--curve`, `--steps` and `--notch` all read uniforms or sparse screenshots, and all
 * three reported PASS while the hero was visibly stalling and popping on screen. A
 * uniform can be perfectly monotonic while the thing a person sees freezes, because the
 * mark's appearance depends on several uniforms interacting through the shader. So this
 * captures every composited frame over a real wheel gesture and looks for the two
 * artefacts you actually notice: a freeze, and a jump.
 *
 * Prefer this whenever it disagrees with the others.
 */
async function renderMode() {
  const skipLive = args.includes('--ours')
  const target = positional[0] || 'http://localhost:3001'

  /**
   * The shader branches on viewport aspect — `if (meshRatio > textureShapeRatio)` picks a
   * different axis, and `if (resolutionRatio < 1.0)` adds a scroll-dependent Y shift that
   * only exists in portrait. A pass in one orientation says nothing about the other, and
   * tuning solely in landscape is how a portrait-only fault survived four rounds.
   */
  const portrait = args.includes('--portrait')
  const viewport = portrait ? { width: 1854, height: 2023 } : { width: 900, height: 600 }
  /*
   * Scroll just past one viewport — the hero's whole range and no further.
   *
   * The window below is "while the page is scrolling", so overshooting the hero drags a
   * long stretch of already-finished, legitimately flat frames into the analysis and
   * reports it as a plateau. Cover the hero exactly and any flat spot found is real.
   */
  const notches = Math.ceil((viewport.height * 1.05) / 100)

  const record = async (url, label, wait) => {
    const browser = await chromium.launch()
    const page = await browser.newPage({ viewport })
    await page.goto(url + '/', { waitUntil: 'load', timeout: 90_000 })
    await page.waitForTimeout(wait)
    await page.mouse.move(viewport.width / 2, viewport.height / 2)
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
    await page.waitForTimeout(1200)

    // Timebase shared between the rAF trace and the screencast frame metadata.
    const [perf0, date0] = await page.evaluate(() => [performance.now(), Date.now()])
    await page.evaluate(() => {
      window.__scroll = []
      const tick = () => {
        window.__scroll.push([performance.now(), window.scrollY])
        requestAnimationFrame(tick)
      }
      requestAnimationFrame(tick)
    })

    const client = await page.context().newCDPSession(page)
    const raw = []
    client.on('Page.screencastFrame', async (f) => {
      raw.push({ t: f.metadata.timestamp * 1000, data: f.data })
      try {
        await client.send('Page.screencastFrameAck', { sessionId: f.sessionId })
      } catch {
        /* frame arrived after stop */
      }
    })
    await client.send('Page.startScreencast', {
      format: 'jpeg',
      quality: 60,
      everyNthFrame: 1,
      maxWidth: 600,
    })

    for (let i = 0; i < notches; i++) {
      await page.mouse.wheel(0, 100)
      await page.waitForTimeout(150)
    }
    await page.waitForTimeout(700)
    await client.send('Page.stopScreencast')

    const scrollTrace = await page.evaluate(() => window.__scroll)

    const series = await page.evaluate(async (list) => {
      const c = document.createElement('canvas')
      c.width = 150
      c.height = 100
      const x = c.getContext('2d')
      const out = []
      for (const item of list) {
        const img = new Image()
        img.src = 'data:image/jpeg;base64,' + item
        try {
          await img.decode()
        } catch {
          continue
        }
        x.drawImage(img, 0, 0, c.width, c.height)
        const d = x.getImageData(0, 0, c.width, c.height).data
        // MEAN LUMINANCE, not a "> 235 is white" count. A threshold sits on a knife
        // edge: while the sheet was fading, 255 * 0.92 = 234.6 read as white and
        // 255 * 0.905 = 230.8 did not, so the whole background flipped category between
        // two visually identical frames and the tool reported a 0.53 "jump" that was not
        // there. Mean luminance degrades smoothly and cannot do that.
        let sum = 0
        for (let i = 0; i < d.length; i += 4) sum += (d[i] + d[i + 1] + d[i + 2]) / 3
        out.push(+(sum / (d.length / 4) / 255).toFixed(4))
      }
      return out
    }, raw.map((f) => f.data))
    await browser.close()

    /*
     * Active window = WHILE THE PAGE IS SCROLLING, taken from a per-frame scrollY trace.
     *
     * This used to be "the 5%..95% band of the luminance range", which quietly excluded
     * the first few percent of the transition — and that is exactly where a fault lived
     * for four rounds, reporting PASS the whole time. Never define the window in terms
     * of the signal being judged; define it by the input that drives it.
     */
    const toPerf = (ts) => ts - date0 + perf0
    const scrollAt = (t) => {
      let best = scrollTrace[0]
      let bd = Infinity
      for (const s of scrollTrace) {
        const d = Math.abs(s[0] - t)
        if (d < bd) {
          bd = d
          best = s
        }
      }
      return best[1]
    }
    const scrolls = raw.map((f) => scrollAt(toPerf(f.t)))
    // Start from the first scroll movement — never from a percentile of the signal being
    // judged, which is what previously hid a fault in the opening frames.
    let start = 0
    while (start < scrolls.length - 1 && scrolls[start] < 1) start++
    // End once the transition has actually finished; frames after that are flat because
    // the hero is over, not because it stalled.
    const span = Math.max(...series) - Math.min(...series) || 1
    const settled = series[series.length - 1]
    let end = series.length - 1
    while (end > start && Math.abs(series[end - 1] - settled) < span * 0.02) end--

    /*
     * Plateau threshold is relative to the site's own average per-frame change, because
     * a fixed one punishes whichever side renders more frames. Our build runs at roughly
     * twice the reference's headless framerate, so identical motion produces half the
     * per-frame delta and read as a "plateau" that did not exist.
     */
    const avgStep = span / Math.max(1, end - start)
    const flat = avgStep * 0.25

    let plateau = 0
    let longestPlateau = 0
    let pop = 0
    let back = 0
    let worstBack = 0
    for (let i = start + 1; i <= end; i++) {
      const d = series[i] - series[i - 1]
      if (Math.abs(d) < flat) {
        plateau++
        longestPlateau = Math.max(longestPlateau, plateau)
      } else plateau = 0
      if (-d > pop) pop = -d
      if (d > 0.002) {
        back++
        worstBack = Math.max(worstBack, d)
      }
    }

    console.log(`== ${label} ==  ${series.length} frames, ${end - start} in motion`)
    console.log(
      `  longest plateau: ${longestPlateau} frames` +
        `   largest single-frame drop: ${pop.toFixed(3)}` +
        `   backward: ${back} (worst +${worstBack.toFixed(4)})`,
    )
    console.log('  (mean screen luminance per frame, from the first scroll movement)')
    console.log(
      '  ' +
        series
          .slice(start, end + 1)
          .filter((_, i) => i % 2 === 0)
          .map((v) => v.toFixed(3))
          .join(' '),
    )
    return { longestPlateau, pop, back, worstBack }
  }

  console.log(
    `\nRendered frames over a real wheel gesture, ${portrait ? 'PORTRAIT' : 'landscape'} ` +
      `${viewport.width}x${viewport.height} (ratio ${(viewport.width / viewport.height).toFixed(2)}).`,
  )
  console.log('The mark must descend continuously — no freeze, no jump, never backwards.\n')

  // Judged against the live site, not against zero. The reference is not perfectly
  // smooth either, so demanding 0 would mean over-damping past the thing we are copying.
  let ref = portrait
    ? { longestPlateau: 2, pop: 0.11, back: 3, source: 'baked-in reference' }
    : { longestPlateau: 2, pop: 0.119, back: 0, source: 'baked-in reference' }
  if (!skipLive) {
    ref = { ...(await record(LIVE, 'LIVE', LIVE_WAIT)), source: 'measured this run' }
    console.log('')
  }
  const ours = await record(target, 'CLONE', CLONE_WAIT)

  const plateauOk = ours.longestPlateau <= ref.longestPlateau + 3
  const popOk = ours.pop <= ref.pop * 1.25
  const backOk = ours.back <= Math.max(1, ref.back)
  console.log(
    `\n  live (${ref.source}): plateau ${ref.longestPlateau}, drop ${ref.pop.toFixed(3)}, backward ${ref.back}`,
  )
  console.log(
    `  ${plateauOk && popOk && backOk ? 'PASS' : 'FAIL'} — ` +
      `plateau ${ours.longestPlateau} ${plateauOk ? 'ok' : 'TOO LONG'}, ` +
      `drop ${ours.pop.toFixed(3)} ${popOk ? 'ok' : 'TOO BIG'}, ` +
      `backward ${ours.back} ${backOk ? 'ok' : 'TOO MANY'}`,
  )
}

/**
 * Edge softness — the thing every other probe here is blind to.
 *
 * A hard stencil and a soft blob can have identical mean luminance and identical
 * per-frame deltas, so `--render` will happily pass a mark that looks nothing like the
 * reference. The reference's mark is a soft dark-grey blob (0% pure black, ~47% of the
 * screen in gradient); a binary cutout is the single most visible way to get this wrong.
 *
 * Softness comes from the uPulseReveal pathway in the shader —
 * `smoothstep(-1, 1, sdf_final)` is the wide falloff that produces it.
 */
async function softnessMode() {
  const skipLive = args.includes('--ours')
  const target = positional[0] || 'http://localhost:3001'
  const browser = await chromium.launch()

  const sample = async (url, label, wait, viewport) => {
    const page = await browser.newPage({ viewport })
    await page.goto(url + '/', { waitUntil: 'load', timeout: 90_000 })
    await page.waitForTimeout(wait)
    await page.mouse.move(viewport.width / 2, viewport.height / 2)
    // Wheel to roughly half-open, where the mark is large and its edge is on screen.
    const notches = Math.ceil(viewport.height / 2 / 100)
    for (let i = 0; i < notches; i++) {
      await page.mouse.wheel(0, 100)
      await page.waitForTimeout(120)
    }
    await page.waitForTimeout(1500)

    const shot = await page.screenshot({ type: 'png' })
    const r = await page.evaluate(async (b64) => {
      const img = new Image()
      img.src = 'data:image/png;base64,' + b64
      await img.decode()
      const c = document.createElement('canvas')
      c.width = img.width
      c.height = img.height
      const x = c.getContext('2d')
      x.drawImage(img, 0, 0)
      const d = x.getImageData(0, 0, c.width, c.height).data
      const at = (px, py) => {
        const i = (py * c.width + px) * 4
        return Math.round((d[i] + d[i + 1] + d[i + 2]) / 3)
      }
      let pureBlack = 0
      let intermediate = 0
      let total = 0
      for (let py = 0; py < c.height; py += 4)
        for (let px = 0; px < c.width; px += 4) {
          const v = at(px, py)
          total++
          if (v <= 10) pureBlack++
          else if (v < 250) intermediate++
        }
      // Longest run of non-saturated samples along a scan through the mark.
      const step = Math.max(1, Math.round(c.width / 44))
      const row = []
      for (let px = 0; px < c.width; px += step) row.push(at(px, Math.round(c.height * 0.42)))
      let run = 0
      let maxRun = 0
      for (const v of row) {
        if (v > 25 && v < 230) {
          run++
          maxRun = Math.max(maxRun, run)
        } else run = 0
      }
      return {
        pureBlack: +((pureBlack / total) * 100).toFixed(1),
        intermediate: +((intermediate / total) * 100).toFixed(1),
        maxRun,
        row,
      }
    }, shot.toString('base64'))
    await page.close()

    console.log(
      `  ${label.padEnd(16)} pure black ${String(r.pureBlack).padStart(5)}%` +
        `   gradient ${String(r.intermediate).padStart(5)}%` +
        `   edge run ${String(r.maxRun).padStart(3)}`,
    )
    console.log(`      scan: ${r.row.join(' ')}`)
    return r
  }

  for (const [orient, viewport] of [
    ['landscape', { width: 1400, height: 900 }],
    ['portrait', { width: 1854, height: 2023 }],
  ]) {
    console.log(`\n== ${orient} ${viewport.width}x${viewport.height} ==`)
    let ref = { pureBlack: 0, intermediate: 47.1, maxRun: 10 }
    if (!skipLive) ref = await sample(LIVE, 'live', LIVE_WAIT, viewport)
    else console.log('  live             pure black   0.0%   gradient  47.1%   edge run  10   (baked-in)')
    const ours = await sample(target, 'ours', CLONE_WAIT, viewport)

    const blackOk = ours.pureBlack <= Math.max(2, ref.pureBlack + 2)
    const gradOk = ours.intermediate >= ref.intermediate * 0.6
    const runOk = ours.maxRun >= Math.max(4, ref.maxRun - 3)
    console.log(
      `  ${blackOk && gradOk && runOk ? 'PASS' : 'FAIL'} — ` +
        `black ${blackOk ? 'ok' : 'TOO MUCH (hard stencil)'}, ` +
        `gradient ${gradOk ? 'ok' : 'TOO LITTLE'}, ` +
        `edge ${runOk ? 'ok' : 'TOO SHARP'}`,
    )
  }

  await browser.close()
}

if (mode === '--softness') await softnessMode()
else if (mode === '--render') await renderMode()
else if (mode === '--curve') await curveMode()
else if (mode === '--steps') await stepsMode()
else if (mode === '--notch') await notchMode()
else await sweep()
