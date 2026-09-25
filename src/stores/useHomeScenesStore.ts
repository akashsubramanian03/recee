import { create } from 'zustand'

/**
 * Scroll progress per WebGL scene.
 *
 * ScrollTriggers write into this; the r3f render loop reads it with
 * `useHomeScenesStore.getState()` inside useFrame so scroll updates never
 * trigger a React re-render.
 */
export type SceneProgress = {
  /** 0..1 across the scene's ScrollTrigger range. */
  progress: number
  /** Signed per-frame delta of `progress`. Drives the barrel-distortion spikes. */
  velocity: number
}

type HomeScenesState = {
  hero: SceneProgress
  mosaic: SceneProgress
  worldwide: SceneProgress
  footer: SceneProgress
  /** True once the preloader has handed off to the shader. */
  isReady: boolean
  setScene: (key: SceneKey, value: Partial<SceneProgress>) => void
  setReady: (v: boolean) => void
}

export type SceneKey = 'hero' | 'mosaic' | 'worldwide' | 'footer'

const zero = (): SceneProgress => ({ progress: 0, velocity: 0 })

export const useHomeScenesStore = create<HomeScenesState>((set) => ({
  hero: zero(),
  mosaic: zero(),
  worldwide: zero(),
  footer: zero(),
  isReady: false,
  setScene: (key, value) =>
    set((s) => ({ [key]: { ...s[key], ...value } }) as Pick<HomeScenesState, SceneKey>),
  setReady: (isReady) => set({ isReady }),
}))

/**
 * Mosaic reveal gate. The original multiplies the mosaic's shader alpha by this
 * so the floating images cannot pop in before the hero logo has resolved.
 */
let mosaicReveal = 0
export const getMosaicReveal = () => mosaicReveal
export const setMosaicReveal = (v: number) => {
  mosaicReveal = v
}
