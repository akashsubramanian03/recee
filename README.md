# podium.global — replica

A from-scratch rebuild of [podium.global](https://podium.global) in Next.js: same layout,
type, colour, copy and motion, including the intro logo animation and the floating-image
scene that flies past on scroll.

```bash
npm install
npm run dev        # http://localhost:3000
```

Assets are already mirrored into `public/`. To re-pull them from the live site:

```bash
npm run mirror     # fonts, .ktx2 texture, .glb models, 161 media files (~556 MB)
node tools/build-data.mjs   # regenerate src/data/*.json from the live RSC payloads
```

---

## How the hero actually works

This is the part worth reading before changing anything.

The page body is **black**. The white you see at the top of the site is not the page — it
is a full-viewport quad rendered by WebGL with the PODIUM mark **punched out of it as a
transparent hole**. Everything visible "inside" the mark is the mosaic scene rendering
behind that sheet. It is a portal, not a logo.

The hole's outline is an SDF blend, straight from the original's fragment shader:

```glsl
float sdf_circle  = length(circleUv) - 0.01;   // the preloader's dot
float sdf_texture = 0.5 - textureMap.g;        // the PODIUM mark
float sdf_final   = mix(sdf_texture, sdf_circle, 1.0 - uShapeReveal);
```

At `uShapeReveal = 0` the hole is a 0.01-radius circle — pixel-identical to the black dot
the DOM preloader shows. At `1` it is the mark. Driving that uniform from 0 to 1 is the
logo animation, and it is why the handoff from preloader to shader has no visible seam.

`background-podium-shape.ktx2` is a 512×512 texture: bright where the mark is, dark
everywhere else. The shader only reads its green channel.

Scrolling then opens the hole until it engulfs the viewport, at which point the sheet is
gone and you are looking at the mosaic against the black body. It opens by **flying the
sheet at the camera** — see the reconstruction notes below, because the two more obvious
mechanisms both leave visible artefacts.

### Layering

One canvas does the whole homepage:

| z | what |
|---|---|
| — | `body`, black |
| 0 | DOM section backgrounds (white worldwide panel, `#343434` footer) |
| 10 | the WebGL canvas — transparent except where a scene draws |
| 20 | DOM content |

Section backgrounds deliberately carry **no** `z-index`, so they never form a stacking
context and the canvas paints over them. That is what lets the footer rock render on top
of the grey backdrop while the footer type stays on top of the rock.

---

## What is verbatim and what is reconstructed

**Verbatim, recovered from the production bundle:**

- Both fragment shaders (hero portal, mosaic) and the `barrelPincushion` helper.
- The entire animation config — every lerp, fog value, light orbit, drag damping,
  parallax drift and ScrollTrigger start/end string. See `src/config/animation.ts`.
- All design tokens, the type scale with its `vw` overrides above 1512px, the keyframes,
  and the component classes. See `src/app/globals.css`.
- Copy, project records and media lists, pulled from the live RSC payloads.

**Reconstructed, fitted to measurements of the live site:**

- How the hero uniforms are *driven*. The config gives the shader's constants but not the
  per-frame values fed to `uShapeReveal` / `uScrollZposition` / `uUvScale`. These were
  fitted with `tools/probe-hero.mjs`, which samples white/black viewport coverage across
  scroll. The constants and the measured curve they match are documented inline in
  `HeroPortal.tsx`.

  **The mark magnifies geometrically — the sheet flies at the camera.** Nothing else.
  `HeroPortal`'s plane is sized to fill the frustum at `distance`, so scaling it by k makes
  it cover k times the frustum and the mark grows by exactly k with its texture sampling
  untouched — no added blur, no UV leaving the texture, no artefacts. The uniform name
  `uScrollZposition` is the clue, and it took a long detour to read it properly.

  It is applied as `mesh.scale`, not `mesh.position.z`. The two look identical for a flat
  `depthTest: false` overlay, but translation runs out of room: the plane sits 1.2 in front
  of a camera at z 5, so it hits the near plane around 12× and the fly-through needs to go
  well past that. Scaling has no ceiling. `uMeshSize` is deliberately not updated — the
  shader only uses it as the ratio `uMeshSize.x / uMeshSize.y`, which uniform scaling
  leaves alone.

  The ramp is `1 / (1 - t·(1 - 1/Z_MAGNIFY_MAX))` — the reciprocal of a linear approach,
  which is what moving toward something at a steady speed does to its apparent size: gentle
  at first, accelerating as you arrive. Scaling the factor linearly instead reads as
  decelerating the whole way in, and a geometric ramp (`MAX^t`) cannot hold both ends at
  once — matching live at half-scroll while still engulfing the viewport by the end forces
  an exponent below 1, which puts a cliff at the finish. The late acceleration costs
  nothing: once the mark's edge is off screen the frame is already the mosaic on black, and
  further magnification changes nothing visible.

  `Z_MAGNIFY_MAX` 15 with `EASE_OUT_POWER` 1.15 is fitted to two anchors and hits both:

  |  | mean | pure black | gradient |
  |---|---|---|---|
  | mid, live (ten notches) | .678 | 0% | 49.1% |
  | mid, ours | .673 | 0.6% | 46.5% |
  | end, live (`scroll/0002.png`) | .098 | 73% | 26.8% |
  | end, ours | .123 | 69.5% | 30.5% |

  Two mechanisms were tried first and both are wrong:

  - **Sweeping `uUvScale` down.** It does magnify the mark, but `sdf_texture` is sampled
    at `(vUv - 0.5) * uvScale`, so shrinking it zooms the SDF and flattens its gradient
    *in screen space* — which widens `smoothstep(-1.0, 1.0, sdf_final)`, the blur term, in
    lockstep with the magnification. The mark could be open or crisp, never both: at
    `uvScale` 0.45 it was a featureless cloud while live at the same offset was wider
    *and* still had clean lobes and counters. The config agrees — `uvScale` sits in the
    static `hero.shader` block with `barrelIntensity` and `pulseMult`, while only
    `shapeLerp` / `pulseLerp` / `pulseThreshold` live in the animated `hero.reveal` block.
    It is held at 1.4 throughout.
  - **Driving the barrel hard.** `barrelPincushion` computes
    `radius = 1.0 + strength * dot(st, st)` with `strength = -uScrollZposition * 6`, and
    `st` is `(vUv - 0.5) * 1.4`, so `dot` reaches 0.98 at the plane's corners. Radius goes
    **negative** past `z ≈ 1/(6 × 0.98) ≈ 0.17`, folding the mapping back on itself — the
    grey ring that showed up at z 0.45. The barrel stays what it looks like in the
    original: a light lens flavour, held below the fold at `Z_BARREL` 0.15.

  **`uPulseReveal` is the softness control, not a velocity flare, and it is always on.**
  It crossfades the mask onto `length(circleUv) + smoothstep(-1.0, 1.0, sdf_final) + 0.3`,
  and that smoothstep — a falloff two full SDF units wide — is the *entire* source of the
  mark's soft edge. Live is soft at rest as well as in motion: 0% pure black, ~47% of the
  screen in gradient, interior around 61/255. Gating it on scroll speed (which the config
  names invite) leaves the mark a hard stencil, and a hard edge sweeping off screen is a
  cliff rather than a fade.

  It cannot be pinned at 1 either: `length(circleUv)` is a radial ramp in *screen* space
  that the barrel does not touch, so near 1 it lifts the whole frame toward white and the
  mark washes out into a haze. Held at `PULSE_BASE` 0.92. Dropping it far enough to darken
  the frame instead brings the razor-edged base mask back — at 0.7 a scan across the mark
  read `4 4 4 4 194 255`, a stencil again. Softness is set here; overall darkness is set
  by `Z_MAGNIFY`.

  **Velocity must not modulate it.** Raising the pulse brightens the frame (mean .699 at
  0.7, .795 at 0.95), so wiring it to scroll speed means every wheel notch washes the mark
  lighter — which reads as the mark shrinking back. Measured with 0.3 of headroom, the
  opening's first frames ran 0.862 → 0.865 → 0.874 → 0.878, brightening for four frames
  while the page scrolled *down*, plus a 24-frame stall. That is exactly the reported
  "logo goes backwards and comes again, feels stuck". Held constant, the same scroll
  measures zero backward frames at every speed tested.

  **Alpha must not carry any of the transition.** This is the difference between flying
  into the logo and watching it dissolve, and it is easy to get wrong because a long
  opacity ramp *measures* beautifully — perfectly smooth, no cliffs, no rebound.

  The sheet is white over a black body, so turning its alpha down turns the whole frame
  **grey**. The reference has no grey frames at any point: `scroll/0001.png` is a dark mark
  on pure 255 white, `0002.png` is pure black with the mosaic, and there is nothing in
  between where the white greys out. Its last white is pure white being pushed off the edge
  of the screen. An earlier build ramped `uSheetOpacity` from p 0.3 to 1.0 — 70% of the
  hero spent dissolving in place — and that read exactly as the logo fading away rather
  than being flown into.

  The config agrees: `scrollTriggers.mosaic.hero` is `{ start: 'top top', end: 'top top' }`,
  a **zero-length** trigger, which is a binary toggle, not a scrub.

  So `uSheetOpacity` now runs only from `SHEET_CLEANUP_START` 0.92 to 1. Flying in bottoms
  the mask out at `pow(mix(0.0, 0.456, PULSE_BASE), 4.0)` ≈ 8/255 of haze that no further
  magnification removes; this clears that last trace and makes the existing
  `hero.progress >= 1` mesh toggle imperceptible. Do not walk it back down the scroll to
  "smooth" the ending — that is the dissolve.

  Verify with `node tools/probe-hero.mjs --render` **and** `--render --portrait`, not
  `--curve`. For the dissolve specifically neither is enough: mean luminance cannot
  distinguish a fading sheet from a receding one. Sample the **95th-percentile** luminance
  across the scroll instead — the background should read a flat 255 until the mark engulfs
  the frame. Ours holds 255 for 19 of 21 samples, and scroll-up mirrors it exactly.
- `uSheetOpacity` — one uniform added to the otherwise-verbatim shader, used only for the
  final cleanup described above. The original dismisses the sheet on a ScrollTrigger toggle
  at the scroll driver's `top top`.
- `PLANE_SCALE` in the mosaic (the original reads a per-asset scale off a CMS field that
  is not in the payload).
- The fluid mouse-trail FBO. The shader samples `uMouseTexture` as a UV displacement;
  how the original fills that target is not recoverable, so it is a brush-sprite trail.
- The blueprint dashed guides — positions read off reference screenshots.

Scroll tuning is *not* guesswork — it came out of the bundle. The page scroller is
literally `<ReactLenis root options={{ autoRaf: false }} />`, i.e. every Lenis default
(`lerp: 0.1`) driven externally off the GSAP ticker. The project-list overlay runs a
second, tuned instance: `{ lerp: 0.08, wheelMultiplier: 0.8, touchMultiplier: 1.15,
overscroll: false }`. Both are reproduced exactly in `src/config/animation.ts`. Matching
the reference means matching those values, so don't "improve" them by feel.

Anything reconstructed says so in a comment where it lives.

---

## Performance — read before adding to the render loop

Scroll smoothness on this page is entirely a function of two things: how many canvas
pixels get pushed per frame, and whether work stops when it leaves the screen. Both were
wrong in the first build and both are easy to break again.

**Nothing may render continuously.** Every WebGL scene gates itself on visibility:

| scene | gate |
|---|---|
| `HeroPortal` | hidden once `hero.progress >= 1` |
| `MosaicScene` | hidden once the shader alpha `fade * mosaicReveal` reaches 0 |
| `FooterRock` | hidden while faded out and the footer trigger is inactive |
| `ContourField` | `IntersectionObserver`, plus frame-skipping once the field settles |

This matters more than it sounds. The hero quad covers the whole viewport and its
fragment shader runs 2D simplex noise **per pixel**; left ungated it costs the same on
every frame of every section. Before gating, idle FPS was flat down the entire page —
21.7 at the hero, 18.6 at the footer. After, the footer runs at 47.

**Watch the canvas budget.** The reference site pushes ~5.0 MP/frame from a single
canvas. Our second canvas (`ContourField`) is deliberately viewport-sized, sticky, and
pinned to dpr 1; when it was stretched over its whole section at full dpr it was 12.07 MP
on its own — more than twice the WebGL canvas — cleared and recomposited every frame.

The WebGL canvas keeps `dpr={[1, maxDpr]}` with `maxDpr` adapted by drei's
`PerformanceMonitor`. It stays a **range** on purpose: a fixed number would supersample
on a non-retina display, which the original never does.

**Videos are gated too.** Use `LazyVideo`, not a bare `<video>`. It withholds `src` until
the element is near the viewport and pauses it on the way out. The homepage holds 17 video
elements; ungated, eight of the mirrored Mux masters decode at once for tiles a few
hundred pixels wide. Always pass `poster` — the Mux thumbnails are mirrored, so a tile
scrolled past quickly shows a still rather than a black box.

**Known gap, deliberately left.** Live's mark interior reads as dark *grey* (46-88) where
ours reads black in places — mid-scroll, ours measures ~3% pure black against live's 0%.
The edges themselves are soft in both (a scan across ours runs `247 → 123 → 31 … 196 →
240`); the black is the mosaic scene's empty background showing through a fully-open
region, where live evidently lifts it slightly. Opening our mosaic reveal gate earlier
does reproduce it, but renders the whole mosaic at the top of the page and costs 38 → 21
fps right where the hero is. Not worth it for a tint.

Note this is also why `--softness` can report "black TOO MUCH (hard stencil)" on a build
whose edges are demonstrably soft: its `edge run` metric is a single horizontal scan, and
content behind the hole breaks the run just as a hard edge would. Read the printed scan
before believing the verdict.

Measure with `tools/probe-perf.mjs` before and after any change to the frame loop. The
signal to watch is not the absolute framerate — headless Chromium renders WebGL in
software — but whether **FPS by scroll depth is flat**. Flat means something is still
drawing after it left the screen.

**Measure the rendered frame, not the uniforms.** Three separate hero bugs — a stall, a
pop, and a rebound — were each missed by probes that read uniform values, all of which
reported PASS while the page was visibly wrong. What you see depends on several uniforms
interacting through the shader, so a uniform can be perfectly monotonic while the mark
freezes. `--render` captures every composited frame over a real wheel gesture and is the
authority; when it disagrees with the others, it wins.

Related trap: don't measure coverage with a brightness *threshold*. `white > 235` sits on
a knife edge — while the sheet was fading, `255 × 0.92 = 234.6` counted as white and
`255 × 0.905 = 230.8` did not, so the background flipped category between two visually
identical frames and the tool reported a 0.53 "jump" that did not exist. Every probe now
uses mean luminance, which degrades smoothly.

**Test both orientations.** The hero shader branches on viewport aspect —
`if (meshRatio > textureShapeRatio)` picks a different axis, and
`if (resolutionRatio < 1.0)` adds a scroll-dependent Y shift that exists *only* in
portrait. Constants fitted in landscape do not transfer. A portrait-only fault survived
four rounds of "fixes" because every probe ran at 900×600, 1400×900 or 1920×1080. Run
`--render` and `--render --portrait`; a pass in one says nothing about the other.

**Never define a measurement window in terms of the signal you are judging.** `--render`
once took its active window as the 5–95% band of the luminance range, which silently
excluded the first few percent of the transition — exactly where the fault was — and
reported PASS. The window now starts at the first actual scroll movement, and the
plateau threshold is relative to each site's own average per-frame change, because our
build renders roughly twice as many frames as the reference and a fixed threshold
punishes the higher framerate for nothing.

---

## Tooling

| script | what it does |
|---|---|
| `tools/mirror-assets.mjs` | mirrors fonts, texture, models and all media into `public/` |
| `tools/build-data.mjs` | rebuilds `src/data/*.json` from the live RSC payloads |
| `tools/extract-svgs.mjs` | regenerates `src/components/icons/*` (~100 KB of dithered `<rect>`s) |
| `tools/capture.mjs` | screenshots + computed-style dumps, live or local |
| `tools/probe-hero.mjs` | `--render` is the one that counts; also `--curve`, `--steps`, `--notch` |
| `tools/probe-perf.mjs` | idle FPS by scroll depth, canvas megapixels, videos decoding |
| `tools/compare.mjs` | pixel-diffs `reference/local` against `reference/live` |
| `tools/check.mjs` | quick render + console check against the dev server |

`tools/capture.mjs` and `tools/check.mjs` scroll with **real wheel events**, not
`window.scrollTo` — Lenis only smooths gestures, and the hero's velocity-driven pulse
never fires on a programmatic jump, so a scripted scroll measures the wrong thing.

---

## Stack

Next.js 15 (App Router, Turbopack) · Tailwind CSS v4 · GSAP 3.15 with ScrollTrigger,
SplitText and Draggable · Lenis · three.js with react-three-fiber and drei · zustand ·
Embla. Same set the original ships.

`html { font-size: 62.5% }`, so `1rem = 10px` throughout — every token in `globals.css`
is on that scale.

---

## A note on the content

This is a replica of someone else's site. Futura and Univers Condensed are commercially
licensed typefaces, and the imagery, 3D model, client list and copy belong to Podium.
Fine as a local build or a study; swap the fonts and the content before putting it
anywhere public.
