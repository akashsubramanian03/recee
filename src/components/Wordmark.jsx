/**
 * RECEE — constructed, not typeset.
 *
 * The letterforms sit on a 30-unit module so they read as grid-assembled.
 *
 * The viewBox is cropped tight to the letter band (y 282–638 against
 * letters at 310–610). Padding inside the viewBox scales with the element
 * and reads as vertical gap, so slack here shows up as an accidental-looking
 * space between the wordmark and the headline. The glow is allowed to spill
 * past the box via overflow:visible rather than being given room inside it.
 *
 * CRT treatment is a red/cyan edge fringe plus a soft outer bloom, and
 * nothing else. An earlier version also drew scanlines from a <pattern> and
 * displaced horizontal bands through per-band clipPaths; both were removed
 * because a letterform sliced into offset horizontal strips reads as a
 * broken clipping mask rather than as an analog artifact. Anything that can
 * be mistaken for a rendering fault is worse than no texture at all.
 */
const U = 30
const S = 2 * U
const W = 8 * U
const H = 10 * U
const GAP = 2 * U
const X0 = 80
const Y0 = 310

const letterX = (i) => X0 + i * (W + GAP)

/* The bowl's right wall must run unbroken from the top bar down to the mid
   bar. It previously stopped at y+75 while the mid bar began at y+90, so a
   15-unit gap left the counter open on its right side — the bowl never
   closed and the letter read as a broken, mirrored R. The counter is also
   60 units tall now, matching the counters in E and C so all three letters
   share one rhythm. */
function R({ x, y }) {
  return (
    <>
      {/* stem */}
      <rect x={x} y={y} width={S} height={H} />
      {/* top bar */}
      <rect x={x} y={y} width={W} height={S} />
      {/* bowl's right wall — continuous, top bar through to mid bar */}
      <rect x={x + W - S} y={y} width={S} height={6 * U} />
      {/* mid bar, closing the bowl */}
      <rect x={x} y={y + 4 * U} width={W} height={S} />
      {/* leg */}
      <polygon
        points={`${x + 4 * U},${y + 6 * U} ${x + 6 * U},${y + 6 * U} ${
          x + W
        },${y + H} ${x + W - S},${y + H}`}
      />
    </>
  )
}

function E({ x, y }) {
  return (
    <>
      <rect x={x} y={y} width={S} height={H} />
      <rect x={x} y={y} width={W} height={S} />
      <rect x={x} y={y + 4 * U} width={7 * U} height={S} />
      <rect x={x} y={y + H - S} width={W} height={S} />
    </>
  )
}

function C({ x, y }) {
  return (
    <>
      <rect x={x} y={y} width={S} height={H} />
      <rect x={x} y={y} width={W} height={S} />
      <rect x={x} y={y + H - S} width={W} height={S} />
    </>
  )
}

function Letters() {
  return (
    <>
      <R x={letterX(0)} y={Y0} />
      <E x={letterX(1)} y={Y0} />
      <C x={letterX(2)} y={Y0} />
      <E x={letterX(3)} y={Y0} />
      <E x={letterX(4)} y={Y0} />
    </>
  )
}

export default function Wordmark() {
  return (
    <svg
      className="wordmark"
      viewBox="0 282 1600 356"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="RECEE"
    >
      <defs>
        <filter
          id="crt-word"
          x="-14%"
          y="-26%"
          width="128%"
          height="152%"
          colorInterpolationFilters="sRGB"
        >
          {/* Outer bloom. Two passes: a wide, soft halo for the glow that
              spreads onto the backdrop, and a tighter one that keeps the
              edge luminous rather than muddy. Both alphas are deliberately
              low: at full strength the halo swamps the crisp original and
              the letterforms read as out of focus rather than as lit. */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="14" result="wide" />
          <feColorMatrix
            in="wide"
            type="matrix"
            values="0.30 0 0 0 0
                    0 0.50 0 0 0
                    0 0 1.10 0 0
                    0 0 0 0.4 0"
            result="haze"
          />
          <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="tight" />
          <feColorMatrix
            in="tight"
            type="matrix"
            values="0.40 0 0 0 0
                    0 0.55 0 0 0
                    0 0 1.05 0 0
                    0 0 0 0.34 0"
            result="bloom"
          />

          {/* channel split on the edges only — the fill stays solid */}
          <feOffset in="SourceGraphic" dx="-2.5" result="oL" />
          <feColorMatrix
            in="oL"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0.5 0"
            result="chR"
          />
          <feOffset in="SourceGraphic" dx="2.5" result="oR" />
          <feColorMatrix
            in="oR"
            type="matrix"
            values="0 0 0 0 0
                    0 1 0 0 0
                    0 0 1 0 0
                    0 0 0 0.5 0"
            result="chC"
          />
          <feBlend in="chR" in2="chC" mode="screen" result="fringe" />

          <feMerge>
            <feMergeNode in="haze" />
            <feMergeNode in="bloom" />
            <feMergeNode in="fringe" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        {/* Not a flat fill: a slight vertical lift so the letterforms read as
            lit from within rather than as printed blocks. */}
        {/* userSpaceOnUse, spanning the whole letter band. The default
            objectBoundingBox restarts the ramp inside every <rect>, so each
            stem and bar got its own gradient and the seams between them
            showed — the letters looked assembled from mismatched pieces. */}
        <linearGradient
          id="wm-ink"
          gradientUnits="userSpaceOnUse"
          x1="80"
          y1="310"
          x2="250"
          y2="610"
        >
          <stop offset="0%" stopColor="#26305a" />
          <stop offset="55%" stopColor="#1c2340" />
          <stop offset="100%" stopColor="#141a33" />
        </linearGradient>
      </defs>

      <g fill="url(#wm-ink)" filter="url(#crt-word)">
        <Letters />
      </g>
    </svg>
  )
}
