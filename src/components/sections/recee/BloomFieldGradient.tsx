'use client'

import { useEffect, useRef } from 'react'

/**
 * Bloom Field — an animated mesh gradient.
 *
 * Recipe from the 21st.dev Gradient Builder (community/gradients), mode
 * "mesh": one radial blob per colour anchored at its own point, all of them
 * blended over a solid backdrop. The builder exports a STATIC snapshot of
 * this; the motion below is the live version of the same recipe, so the
 * frame at t = 0 is byte-for-byte the exported CSS.
 *
 * Why a rAF loop instead of a CSS @keyframes animation: the blobs each drift
 * on their own two-frequency Lissajous path, which is not a keyframe-able
 * interpolation between two background-image values — the browser cannot
 * tween a radial-gradient's `at x% y%` through an arbitrary curve. So the
 * whole background-image string is re-derived once per frame.
 */

/* ---------- The recipe ---------- */

const BACKDROP = '#E2E2E2'

/* Anchor points and radii are the builder's export, verbatim. `rgb` is the
   colour pre-split so the per-frame string build is pure concatenation with
   no colour maths in the hot path. */
const BLOBS = [
  { rgb: '226, 226, 226', x: 67.04, y: 45.93, r: 76.1 }, // Mauve
  { rgb: '27, 159, 254', x: 35.47, y: 65.92, r: 51.6 }, // Glazed azure
  { rgb: '27, 159, 254', x: 48.33, y: 20.11, r: 67.0 }, // Glazed azure
  { rgb: '74, 201, 255', x: 80.81, y: 88.03, r: 41.1 }, // Sky
]

/* The five-stop falloff every blob shares: alpha 1 at the centre down to 0
   at the blob's own radius. The builder's `softness` is already folded into
   these fractions. */
const STOPS = [
  [0.0, '1'],
  [0.25, '0.844'],
  [0.5, '0.5'],
  [0.75, '0.156'],
  [1.0, '0'],
]

const SEED = 174074637
const SPEED = 1.0 // builder `speed` 100
const AMOUNT = 1.0 // builder `motionAmount` 100
const WAVE = 14 // builder `wave`
const DIR = 1 // builder `motionReverse` false

/* Each blob gets two STATIC phase offsets, hashed off the seed once at module
   load. They must never be re-hashed per frame: fract(sin(x) * 43758) is a
   chaotic function, so walking `x` through it frame by frame produces white
   noise rather than a continuous path. Hash once, then animate smoothly
   *around* the constant it returns. */
function hash(n: number) {
  const s = Math.sin(n) * 43758.5453123
  return s - Math.floor(s)
}

const PHASED = BLOBS.map((b, i) => ({
  ...b,
  p: hash(SEED * 1e-4 + i * 12.9898) * Math.PI * 2,
  p2: hash(SEED * 1e-4 + i * 78.233 + 4.1) * Math.PI * 2,
}))

/**
 * The background-image for one instant.
 *
 * Every modulation is written as `sin(ph * f + p) - sin(p)` so it is exactly
 * zero at ph = 0. Written the naive way — `sin(ph * f) * WAVE` — each blob
 * would start at a non-zero offset and the whole field would visibly jump the
 * moment the loop started.
 *
 * Nothing here is rounded. Quantising the centres to whole percentages saves
 * a few bytes of string and costs you the motion: at 14% of travel the blobs
 * would sit on one value for several frames and then step to the next.
 */
function frame(ph: number) {
  let out = ''
  for (let i = 0; i < PHASED.length; i++) {
    const b = PHASED[i]
    const x = b.x + (Math.sin(ph * 0.55 + b.p) - Math.sin(b.p)) * WAVE * AMOUNT
    const y = b.y + (Math.sin(ph * 0.43 + b.p2) - Math.sin(b.p2)) * WAVE * AMOUNT

    let ramp = ''
    for (let s = 0; s < STOPS.length; s++) {
      const [at, a] = STOPS[s]
      ramp += `${s ? ', ' : ''}rgba(${b.rgb}, ${a}) ${b.r * at}%`
    }
    out += `${i ? ', ' : ''}radial-gradient(circle at ${x}% ${y}%, ${ramp})`
  }
  return out
}

/* Grain. Two passes, as the builder ships it: a tiled turbulence tile blended
   `overlay` into the field, then a second full-bleed pass at half opacity.
   Both are static — animating the noise would read as television static, and
   the point of the grain is to break up the banding in the blend, not to
   move. */
const GRAIN_TILE =
  "url(\"data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.500'/></svg>\")"

export function BloomFieldGradient({ className }: { className?: string }) {
  const fieldRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = fieldRef.current
    if (!el) return

    /* Reduced motion gets the t = 0 frame — which is exactly the builder's
       static export, so the page still looks finished, it just holds still. */
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let start = 0

    const draw = (now: number) => {
      if (!start) start = now
      const t = (now - start) / 1000 // elapsed seconds
      el.style.backgroundImage = frame(t * SPEED * DIR)
      raf = requestAnimationFrame(draw)
    }

    const stop = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    const run = () => {
      stop()
      if (reduce.matches) {
        el.style.backgroundImage = frame(0)
        return
      }
      /* Re-baselining `start` on every resume is what keeps the clock
         continuous across a tab switch: without it the field would leap
         forward by however long the tab was hidden. */
      start = 0
      raf = requestAnimationFrame(draw)
    }

    const onVisibility = () => (document.hidden ? stop() : run())

    run()
    reduce.addEventListener('change', run)
    document.addEventListener('visibilitychange', onVisibility)

    return () => {
      stop()
      reduce.removeEventListener('change', run)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className={className}
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      {/* The mesh. Its background-image is owned by the loop above — do not
          set one here, or React would fight the rAF write on every render. */}
      <div
        ref={fieldRef}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: BACKDROP,
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: GRAIN_TILE,
          backgroundSize: '120px 120px',
          mixBlendMode: 'overlay',
        }}
      />
      <svg
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          opacity: 0.5,
          mixBlendMode: 'overlay',
        }}
      >
        <filter id="bloom-field-grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="2"
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#bloom-field-grain)" />
      </svg>
    </div>
  )
}
