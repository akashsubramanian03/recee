# Recee

Landing page for Recee, a cinema club. Single non-scrolling viewport: two arms
reach toward each other across a RECEE wordmark, a vintage Super 8 camera in one
hand, the negative space between lens and fingertip as the focal point.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build
npm run preview
```

Vite + React, no TypeScript or Tailwind. No test suite — this is a static visual
page, verified by measurement in the browser.

## How the hero is built

The arms are photographic cutouts (subject-masked via macOS Vision, shipped as
WebP). Their placement is **solved, not hand-tuned**: `src/styles/hero.css`
derives each offset from where the composition wants the element, using geometry
sampled from each image's alpha channel —

```css
left: calc(30vw - 0.68 * var(--arm-w));   /* camera-x target */
```

Two constraints the arithmetic has to respect: each arm's cut edge must fall
outside the viewport on at least one axis, or the arm appears to end in mid-air;
and neither arm may reach into the wordmark or the corner-text bands. Changing an
arm's width means recomputing its offsets — the comments in `hero.css` carry the
coefficients.

Copy and wordmark sit on one 12-column grid shared by nav, stage and footer, so
alignment and separation are structural rather than tuned.

`RECEE` is constructed from rects on a 30-unit module rather than typeset
(`src/components/Wordmark.jsx`), with a CRT treatment of soft bloom plus a faint
red/cyan edge fringe.

## Layout invariants

The page must never scroll, at any viewport. Vertical rhythm comes from the
`--space-*` scale in `src/styles/tokens.css`. Text colours are darkened from
Apple's neutrals because the gradient backdrop is lighter than a white page —
every text element measures at or above WCAG AA against it.
