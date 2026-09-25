'use client'

import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useKTX2 } from '@react-three/drei'
import { config } from '@/config/animation'
import { useHomeScenesStore, setMosaicReveal } from '@/stores/useHomeScenesStore'
import { isTouchDevice } from '@/hooks/useIsTouch'
import { useMouseTrail } from './useMouseTrail'
import { PodiumShapeMaterial, type PodiumShapeMaterialImpl } from './PodiumShapeMaterial'

/** Keep the drei/extend registration alive through tree-shaking. */
void PodiumShapeMaterial

/**
 * Reconstruction constants for how the mark opens. See the comments in the frame loop
 * — these are fitted to the live site's measured coverage curve, not recovered.
 */
/**
 * Temporal smoothing on uScrollZposition.
 *
 * Absorbs integer-pixel scroll quantisation at a crawl: `window.scrollY` arrives as a
 * staircase, and easing toward it turns that into a continuous ramp.
 *
 * Do not lower this hoping to spread the final sweep: a lerp's rate is proportional to
 * its distance from target, so more lag means it falls behind and then catches up
 * *faster* through the steep part.
 */
const Z_LERP = 0.2
/**
 * Ease-out exponent for the approach. Must stay at or above 1 so the derivative at p = 0
 * is bounded — that, not the ease-out shape itself, is what made sqrt step.
 *
 * Nearly linear, because the magnification curve below already supplies the shaping. Fitted
 * to two anchors against live at 1854x2023, and it hits both:
 *
 *              mean    black    mid
 *   mid   live .678      0     49.1     (ten wheel notches)
 *         ours .673     0.6    46.5
 *   end   live .098     73     26.8     (scroll/0002.png)
 *         ours .123    69.5    30.5
 *
 * Not recovered.
 */
const EASE_OUT_POWER = 1.15
/**
 * uScrollZposition at full hero progress — the barrel strength that magnifies the mark
 * to fill the viewport. Reaches the shader as `-uScrollZposition * uBarrelIntensity`
 * with uBarrelIntensity 6, so this is a small number.
 *
 * Must stay under the barrel's fold-back point of ~0.17 (see the frame loop), so this is
 * only ever a light lens flavour on top of the magnification — never the magnification
 * itself.
 */
const Z_BARREL = 0.15
/**
 * Total magnification of the mark across the hero, as a multiple — the factor at p = 1.
 * Overridable in dev as `window.__zmag`.
 *
 * It has to be large enough to carry the ENTIRE transition, because nothing else does any
 * more: the mark keeps growing until its edge is off screen and the viewport is inside it.
 * The reference never fades — its frames are pure white or pure black, never grey — so
 * anything left for alpha to finish reads as the logo dissolving rather than the camera
 * flying into it.
 */
const Z_MAGNIFY_MAX = 15
/**
 * Hero progress at which the sheet's last trace is cleared. Deliberately LATE and short.
 *
 * This is cleanup, not the transition. Flying into the mark bottoms the mask out at
 * `pow(mix(0.0, 0.456, PULSE_BASE), 4.0)` — roughly 8/255 of white haze that no amount of
 * further magnification removes, where the reference is a true 0. This window takes that
 * near-invisible veil to nothing, and makes the existing `hero.progress >= 1` mesh toggle
 * imperceptible (the original dismisses its sheet on a zero-length ScrollTrigger,
 * `scrollTriggers.mosaic.hero` being `top top` to `top top` — a toggle, not a scrub).
 *
 * Do not walk this back down the scroll to "smooth" the ending. An alpha ramp long enough
 * to matter turns the white sheet grey across the whole frame, and grey is precisely what
 * makes the logo look like it is dissolving in place instead of being flown into. The
 * reference has no grey frames at all.
 */
const SHEET_CLEANUP_START = 0.92
/**
 * Resting level of uPulseReveal — i.e. how soft the mark is. Velocity modulates only the
 * remaining headroom above this. Not recovered.
 *
 * This uniform is the softness control, not a velocity flare: it crossfades the mask onto
 * `length(circleUv) + smoothstep(-1.0, 1.0, sdf_final) + 0.3`, and that smoothstep — a
 * falloff two full SDF units wide — is the entire source of the mark's soft edge. Gating
 * it on scroll speed left the mark a hard stencil for most of the hero, which is what made
 * its edge leave the viewport as a cliff rather than a fade.
 *
 * It cannot simply be pinned at 1 either. `length(circleUv)` is a radial ramp in *screen*
 * space that the barrel does not touch, so near 1 it lifts the whole frame toward white
 * and the mark washes out into a haze — measured at 1854x2023, ten notches in:
 *
 * Dropping it far enough to darken the frame instead reintroduces hard edges, because the
 * crossfade brings back the razor-edged base mask: at 0.7 the scan across the mark went
 * 4 4 4 4 194 255 — a stencil again. So softness fixes this near 0.9 and the frame's
 * overall darkness is set by the plane's travel (Z_MAGNIFY), not here.
 */
const PULSE_BASE = 0.92

/** World size of a plane that exactly fills the frustum at `distance` from the camera. */
function useFullscreenPlaneSize(distance: number) {
  const { viewport, camera } = useThree()
  return useMemo(() => {
    const fov = (camera as THREE.PerspectiveCamera).fov ?? config.camera.fov
    const height = 2 * Math.tan((fov * Math.PI) / 360) * distance
    return [height * (viewport.width / viewport.height), height] as [number, number]
  }, [camera, viewport.width, viewport.height, distance])
}

/**
 * The white sheet the PODIUM mark is punched out of.
 *
 * Sits in front of the mosaic scene (renderOrder 100, depthTest off), so the mosaic
 * is only visible through the hole. Growing the hole is the entire hero transition:
 * dot -> mark -> full-bleed.
 */
export function HeroPortal({ distance = 1.2 }: { distance?: number }) {
  const materialRef = useRef<PodiumShapeMaterialImpl>(null)
  const meshRef = useRef<THREE.Mesh>(null)
  const { size } = useThree()
  const isTouch = isTouchDevice()

  /**
   * True while the sheet can still be seen. Once the hero has scrolled away this goes
   * false and the mesh is hidden, which matters more than it looks: this quad covers
   * the entire viewport and its fragment shader runs 2D simplex noise per pixel. Left
   * running it costs the same every frame for the whole rest of the page.
   */
  const isActive = useRef(true)

  const texture = useKTX2('/textures/background-podium-shape.ktx2')
  const { texture: mouseTexture } = useMouseTrail(!isTouch, isActive)

  const meshSize = useFullscreenPlaneSize(distance)

  /** Lerped reveal state, kept out of React so it can update every frame. */
  const shapeReveal = useRef(0)
  const zPosition = useRef<number>(0)

  useMemo(() => {
    if (!texture) return
    texture.minFilter = THREE.LinearFilter
    texture.magFilter = THREE.LinearFilter
    texture.wrapS = texture.wrapT = THREE.ClampToEdgeWrapping
    texture.needsUpdate = true
  }, [texture])

  useFrame(({ clock }) => {
    const material = materialRef.current
    const mesh = meshRef.current
    if (!material || !mesh) return

    const { hero, isReady } = useHomeScenesStore.getState()

    // Past the hero the sheet is fully transparent, so stop drawing it. Scrolling back
    // up drops progress below 1 and brings it straight back.
    const active = hero.progress < 1
    if (active !== isActive.current) {
      isActive.current = active
      mesh.visible = active
    }
    if (!active) {
      // Leave the mosaic gate at its final value on the way out, otherwise the
      // floating images would fade when the hero stops updating it.
      setMosaicReveal(1)
      return
    }

    // Dot -> mark. Held at 0 until the preloader hands off, then eased in at the
    // original's 0.08 lerp so it blooms open rather than snapping.
    shapeReveal.current = THREE.MathUtils.lerp(
      shapeReveal.current,
      isReady ? 1 : 0,
      config.hero.reveal.shapeLerp,
    )

    // The mosaic may only show once the mark has opened AND the page has started
    // moving. At rest at the top the mark reads as solid black; the floating images
    // fade up through it over the first third of the hero's scroll range.
    // Known gap, left deliberately: on the live site the mark is never solid black —
    // the mosaic sits faintly behind it even at rest (interior pixels read 18-64, with
    // essentially no pure black, against our hard 0). Opening this gate at rest does
    // reproduce that, but it makes the whole mosaic render at the top of the page and
    // costs 38 -> 21 fps exactly where the hero is. Not worth it for a tint; the
    // remaining difference is mostly the shader's edge softness anyway.
    setMosaicReveal(
      shapeReveal.current * THREE.MathUtils.smoothstep(hero.progress, 0.04, 0.34),
    )

    const u = material.uniforms
    const p = hero.progress

    u.uTime.value = clock.getElapsedTime()
    u.uShapeReveal.value = shapeReveal.current
    /*
     * The pulse is held HIGH AND CONSTANT. This is what makes the mark a soft blob
     * rather than a hard stencil, and it is the single most important line here.
     *
     * The shader's softness comes entirely from this pathway:
     *   mask = pow(mix(mask, length(circleUv) + smoothstep(-1,1,sdf) + 0.3, uPulseReveal), 4)
     * `smoothstep(-1, 1, sdf)` is a very wide falloff — that IS the blur.
     *
     * The config names (pulseThreshold, pulseLerp) read like a velocity-triggered flare
     * and I built it as one. Measurement says otherwise: the reference mark is soft at
     * REST as well as while scrolling — 0% pure black, ~47% of the screen in gradient,
     * interior around 61/255. Working back through the shader, an interior alpha of 0.24
     * means the summed term is ~0.70, which needs uPulseReveal ~1. It is always on.
     *
     * Driving it from velocity was also the source of every artefact chased for several
     * rounds: ramping it 0 -> 1 mid-scroll whitens the mask and the mark appears to move
     * backwards, then stalls. Holding it constant removes that entirely, and a soft edge
     * sweeping across the screen cannot cliff or step in the first place.
     *
     * Velocity does NOT modulate it, and that is the fix for the reported symptom rather
     * than a simplification. Raising the pulse brightens the whole frame (0.7 -> .699
     * mean, 0.95 -> .795), so wiring it to scroll speed means every wheel notch washes the
     * mark lighter — which reads as the mark shrinking back. Measured with a 0.3 headroom:
     * the opening's first frames ran 0.862 -> 0.865 -> 0.874 -> 0.878, brightening for
     * four frames while the page scrolled *down*, plus a 24-frame stall. That is exactly
     * the "logo goes backwards and comes again, feels stuck" report. Held constant, the
     * same scroll measures zero backward frames.
     */
    u.uPulseReveal.value =
      process.env.NODE_ENV !== 'production'
        ? ((window as unknown as { __pulse?: number }).__pulse ?? PULSE_BASE)
        : PULSE_BASE
    u.uScrollProgress.value = p
    u.uScrollVelocity.value = hero.velocity
    u.uFluidIntensity.value = config.hero.shader.fluidIntensity
    u.uNoiseIntensity.value = config.hero.shader.noiseIntensity
    u.uBarrelIntensity.value = isTouch
      ? config.hero.shader.barrelIntensityMobile
      : config.hero.shader.barrelIntensity
    u.uPulseMult.value = config.hero.shader.pulseMult
    u.uIsMobile.value = isTouch

    // How the mark opens. The shader body is the original's; the ramp below is a
    // reconstruction, because the values the original feeds these uniforms are not in
    // its bundle. It is fitted to the live site's measured opening curve.
    //
    // The expansion is driven by uScrollZposition — the barrel warp — and NOT by
    // uUvScale. That split matters and it is what the config says:
    //
    //   hero.shader = { uvScale, barrelIntensity, pulseMult, ... }   <- static material
    //   hero.reveal = { shapeLerp, pulseLerp, pulseThreshold }       <- the animated ones
    //
    // uvScale sits with the static settings, so the original holds it at 1.4 throughout.
    // Earlier builds swept it down instead, and that is what cost the mark its shape:
    // `sdf_texture` is sampled at `(vUv - 0.5) * uvScale`, so shrinking uvScale zooms the
    // SDF and flattens its gradient *in screen space*, which widens
    // `smoothstep(-1.0, 1.0, sdf_final)` — the blur term — in step with the magnification.
    // The mark could open, or it could stay crisp, but not both. Measured against live at
    // the same scroll point: live is wider than uvScale 0.45 gave us and still shows clean
    // lobes and counters, which a zoomed SDF cannot do at any setting.
    //
    // The barrel has no such coupling. `barrelPincushion` displaces the sample point
    // before the texture read, so the mark magnifies outward from the centre while the SDF
    // keeps the gradient — and therefore the edge softness — it had at uvScale 1.4.
    const easePower =
      process.env.NODE_ENV !== 'production'
        ? ((window as unknown as { __pow?: number }).__pow ?? EASE_OUT_POWER)
        : EASE_OUT_POWER
    const eased = 1 - Math.pow(1 - p, easePower)

    const magMax =
      process.env.NODE_ENV !== 'production'
        ? ((window as unknown as { __zmag?: number }).__zmag ?? Z_MAGNIFY_MAX)
        : Z_MAGNIFY_MAX

    // Lerped rather than assigned: `window.scrollY` is integer-quantised, so at a crawl
    // the target arrives as a staircase and easing toward it makes a continuous ramp.
    zPosition.current = THREE.MathUtils.lerp(zPosition.current, eased, Z_LERP)

    // The actual magnification: the sheet travels toward the camera. A plane sized to
    // fill the frustum at `distance` covers 1/k of it once it is k times closer, so the
    // mark grows by exactly that factor with its texture sampling untouched — no extra
    // blur, no UV leaving the texture, no artefacts of any kind.
    //
    // The barrel cannot do this job, which is what the uniform's name was telling me.
    // `barrelPincushion` computes `radius = 1.0 + strength * dot(st, st)` with
    // `strength = -uScrollZposition * 6`, and `st` reaches 0.99 at the plane's corners
    // (it is `(vUv - 0.5) * uvScale`, and uvScale is 1.4). So radius turns NEGATIVE for
    // z beyond ~1/(6 * 0.98) = 0.17, folding the mapping back on itself — the grey ring
    // that appeared at z 0.45. Reaching live's coverage needs far more magnification than
    // that ceiling allows, so the barrel stays what it looks like in the original: a
    // light lens flavour, held below the fold.
    // Scaled rather than moved. For a flat, depth-tested-off overlay the two are visually
    // identical, but translation runs out of room: the plane sits `distance` (1.2) in
    // front of a camera at z 5, so it reaches the near plane at roughly 12x and the
    // fly-through needs to keep going well past that. Scaling has no ceiling. uMeshSize is
    // deliberately left alone — the shader only ever uses it as the ratio
    // uMeshSize.x / uMeshSize.y, which uniform scaling does not change.
    //
    // The ramp is the reciprocal of a linear approach, which is what moving toward
    // something at a steady speed actually does to its apparent size: gentle at first,
    // accelerating as you arrive. Stepping the factor itself linearly reads as
    // decelerating all the way in, and a geometric ramp cannot hold both ends — matching
    // live at half-scroll (2.8x) while still engulfing the viewport by the end forces an
    // exponent below 1, which puts a cliff at the finish.
    //
    // The late acceleration costs nothing visually: past the point where the mark's edge
    // leaves the viewport, the frame is already the mosaic on black and further
    // magnification changes nothing on screen.
    const travel = 1 - zPosition.current * (1 - 1 / magMax)
    mesh.scale.setScalar(1 / travel)
    u.uScrollZposition.value = zPosition.current * Z_BARREL
    u.uUvScale.value = config.hero.shader.uvScale

    // NOT how the transition is carried — see SHEET_CLEANUP_START. Magnification alone
    // takes the sheet to a ~8/255 haze and no further; this only clears that last trace.
    u.uSheetOpacity.value = 1 - THREE.MathUtils.smoothstep(p, SHEET_CLEANUP_START, 1)

    if (process.env.NODE_ENV !== 'production') {
      // Read by tools/probe-hero.mjs when fitting the hero curve.
      ;(window as unknown as { __hero?: Record<string, number> }).__hero = {
        progress: p,
        shapeReveal: shapeReveal.current,
        /** Opening amount, 0 -> 1. The mark's magnification is driven off this. */
        open: zPosition.current,
        z: u.uScrollZposition.value as number,
        uvScale: u.uUvScale.value as number,
        sheetOpacity: u.uSheetOpacity.value as number,
      }
    }
    ;(u.uResolution.value as THREE.Vector2).set(size.width, size.height)
    ;(u.uMeshSize.value as THREE.Vector2).set(meshSize[0], meshSize[1])
  })

  return (
    <mesh
      ref={meshRef}
      position={[0, 0, config.camera.position[2] - distance]}
      renderOrder={100}
      frustumCulled={false}
    >
      <planeGeometry args={[meshSize[0], meshSize[1]]} />
      <podiumShapeMaterial
        ref={materialRef}
        key={PodiumShapeMaterial.key}
        transparent
        depthTest={false}
        depthWrite={false}
        toneMapped={false}
        uBackgroundPodiumShapeTexture={texture}
        uMouseTexture={mouseTexture}
        uTextureShapeSize={[texture?.image?.width ?? 1, texture?.image?.height ?? 1]}
      />
    </mesh>
  )
}
