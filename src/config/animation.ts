/**
 * Animation constants, transcribed verbatim from podium.global's production bundle.
 *
 * Every shader uniform, lerp factor and ScrollTrigger start/end string in this
 * project reads from here, exactly as the original does. Do not "tidy" these
 * numbers — the feel of the site is in them.
 */
export const config = {
  hero: {
    reveal: { shapeLerp: 0.08, pulseLerp: 0.4, pulseThreshold: 12 },
    shader: {
      fluidIntensity: 0.6,
      noiseIntensity: 0.6,
      barrelIntensity: 6,
      barrelIntensityMobile: 1.5,
      uvScale: 1.4,
      pulseMult: 0.2,
    },
  },

  mosaic: {
    parallax: { delayFactor: 0.1, positionLerp: 0.05 },
    model: { rotationLerp: 0.4, positionYLerp: 0.8, scrollIntensity: 8 },
    fog: { near: 5, far: 85 },
    opacity: { fadeStart: 10, fadeEnd: 0 },
    shader: {
      barrelMultiplier: 100,
      barrelMultiplierMobile: 25,
      fadeDivisor: 0.5,
      velocityLerp: 0.2,
    },
    mobileSpreadFactor: 0.5,
  },

  mosaicAssets: {
    videos: [
      { position: [8, -2, -40] },
      { position: [-8, 1, -55] },
      { position: [0, -2, -65] },
    ],
    images: [
      { position: [-4, -5, -18] },
      { position: [-10, -0.5, -30] },
      { position: [3, 2, -45] },
    ],
    model: { position: [-1, 7, -53], rotation: [-4.3, 0, 3] },
  },

  lighting: {
    orbitalSpeed: 0.77,
    orbitalAmplitude: 1.2,
    lightZ: 0.58,
    emissiveIntensity: 43.5,
    ambientIntensity: 1,
    pointIntensity: 10,
    pointDecay: 0.5,
  },

  worldwide: {
    reveal: { progressNorm: 0.6, bgNorm: 0.6, bgSmoothStart: 0, bgSmoothEnd: 0.3 },
    fog: { divisor: 1.7, powBase: 0.4, expandFactor: 15 },
    repulsion: {
      divisorBase: 1,
      divisorFactor: 4,
      pointerMultiplier: 0.1,
      targetMultiplier: 0.4,
      lerpFactor: 0.1,
    },
  },

  projectGrid: {
    parallax: { drifts4: [-250, 200, -150, 130], drifts3: [-200, 250, -150], scrub: 1 },
    fade: { inDuration: 0.3, outDuration: 0.45, outStart: 0.75 },
  },

  footer: {
    model: {
      baseScale: 1.15,
      viewportHeightRef: 5.5,
      positionY: 0.3,
      rotationLerp: 0.26,
      spinFactor: 1.15,
      opacityLerp: 0.1,
    },
    lighting: {
      ambientIntensity: 1.05,
      pointIntensity: 7,
      pointDecay: 0.6,
      orbitalSpeed: 1.07,
      orbitalAmplitude: 1.05,
      lightZ: 1.94,
    },
    drag: { sensitivity: 0.6, dampActive: 0.9, dampRelease: 0.965, threshold: 6 },
  },

  camera: { fov: 50, position: [0, 0, 5] },

  scrollTriggers: {
    heroText: { start: 'top top-=1' },
    hero: { start: 'top top', end: 'top top', markers: false },
    mosaic: { start: 'top bottom', end: 'top center', markers: false },
    worldwide: { start: 'top bottom-=20%', end: 'bottom top+=20%', markers: false },
    projectGrid: {
      parallax: { start: 'top bottom', end: 'bottom top', markers: false },
      fade: { start: 'top bottom', end: 'bottom top', markers: false },
      viewButton: { start: 'top bottom-=20%', end: 'bottom bottom', markers: false },
    },
    footer: { start: 'top center', end: 'bottom bottom-=10%', markers: false },
    projectHeaderFade: { start: 'bottom bottom+=20%', markers: false },
  },
} as const

/**
 * Root scroller options.
 *
 * Recovered from the bundle, where the page-level instance is literally
 * `<ReactLenis root options={{ autoRaf: false }} />` — i.e. every Lenis default, driven
 * externally off the GSAP ticker. The values below are those defaults written out.
 * Don't "tune" them: matching the reference means matching the defaults.
 */
export const lenisOptions = {
  lerp: 0.1,
  smoothWheel: true,
  syncTouch: false,
  syncTouchLerp: 0.075,
  touchInertiaExponent: 1.7,
  wheelMultiplier: 1,
  touchMultiplier: 1,
  orientation: 'vertical',
  gestureOrientation: 'vertical',
  autoRaf: false,
} as const

/**
 * The project-list overlay runs its own nested Lenis, and unlike the root one it is
 * tuned. Recovered verbatim from the bundle:
 *
 *   <ReactLenis data-lenis-prevent options={{ autoRaf: true, lerp: 0.08,
 *     wheelMultiplier: 0.8, touchMultiplier: 1.15, overscroll: false }} />
 *
 * Slightly heavier and slower than the page, so the list feels weighted separately from
 * the document behind it.
 */
export const projectListLenisOptions = {
  autoRaf: true,
  lerp: 0.08,
  wheelMultiplier: 0.8,
  touchMultiplier: 1.15,
  overscroll: false,
} as const
