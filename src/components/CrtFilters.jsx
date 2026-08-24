/**
 * CRT filter for the photographic arms — brief §12.
 *
 * These run as SVG filter primitives rather than CSS overlays because
 * `feComposite operator="in"` against SourceAlpha confines grain to the
 * subject's own silhouette. The cutouts have soft alpha edges from the
 * rim-light, and a CSS overlay would square that off against the white page.
 *
 * Rendered into a zero-size svg so the defs exist in the document without
 * taking any layout space; the arms reference it via `filter: url(#crt-photo)`.
 */
export default function CrtFilters() {
  return (
    <svg className="crt-defs" aria-hidden="true" focusable="false">
      <defs>
        <filter
          id="crt-photo"
          x="-8%"
          y="-8%"
          width="116%"
          height="116%"
          colorInterpolationFilters="sRGB"
        >
          {/* RGB channel fringe — the red and cyan copies sit beneath the
              original so the arm stays crisp and only its edges split. */}
          <feOffset in="SourceGraphic" dx="-2" dy="0" result="oL" />
          <feColorMatrix
            in="oL"
            type="matrix"
            values="1 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0 0
                    0 0 0 0.5 0"
            result="chR"
          />
          <feOffset in="SourceGraphic" dx="2" dy="0" result="oR" />
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

          {/* soft bloom so the warm rim-light bleeds like screen phosphor */}
          <feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" />
          <feColorMatrix
            in="blur"
            type="matrix"
            values="1.15 0 0 0 0
                    0 1 0 0 0
                    0 0 0.85 0 0
                    0 0 0 0.34 0"
            result="bloom"
          />

          <feMerge result="based">
            <feMergeNode in="bloom" />
            <feMergeNode in="fringe" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>

          {/* film grain, clipped to the subject */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.8"
            numOctaves="3"
            stitchTiles="stitch"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="matrix"
            values="0 0 0 0 0.5
                    0 0 0 0 0.5
                    0 0 0 0 0.5
                    0.6 0.4 0 0 -0.32"
            result="grainGray"
          />
          <feComposite
            in="grainGray"
            in2="SourceAlpha"
            operator="in"
            result="grainClipped"
          />
          <feComponentTransfer in="grainClipped" result="grainSoft">
            <feFuncA type="linear" slope="0.45" intercept="0" />
          </feComponentTransfer>
          <feBlend in="grainSoft" in2="based" mode="overlay" />
        </filter>
      </defs>
    </svg>
  )
}
