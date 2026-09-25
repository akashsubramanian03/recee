'use client'

import { useMemo, useRef, Suspense } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useAspect, useGLTF, useTexture, useVideoTexture } from '@react-three/drei'
import { config } from '@/config/animation'
import { useHomeScenesStore, getMosaicReveal } from '@/stores/useHomeScenesStore'
import { usePointerStore } from '@/stores/usePointerStore'
import { isTouchDevice } from '@/hooks/useIsTouch'
import { homepage, isVideo, videoSrc, type Media } from '@/data'
import { MosaicPortalMaterial, type MosaicPortalMaterialImpl } from './MosaicPortalMaterial'

void MosaicPortalMaterial

/**
 * How large a mosaic plane is in world units, as a multiple of drei's viewport-cover
 * size. Tuned against reference/live/home/desktop/scroll/0002-0004.png â€” this is the
 * one mosaic number that is NOT recoverable from the bundle (the original reads a
 * per-asset scale off the CMS record, which is not in the payload).
 */
const PLANE_SCALE = 1.0

/**
 * Whether the mosaic is currently on screen.
 *
 * There is exactly one mosaic scene, and this is read inside per-plane frame loops, so
 * it lives here rather than in context — a provider would add a subscription to
 * something that changes every frame and is never rendered from.
 */
const visibility = { current: true }

/** Shared per-frame uniform update for every mosaic plane. */
function useMosaicUniforms(materialRef: React.RefObject<MosaicPortalMaterialImpl | null>) {
  const prevProgress = useRef(0)
  const offset = useRef(new THREE.Vector2(0, 0))
  const isTouch = isTouchDevice()

  useFrame(() => {
    const material = materialRef.current
    if (!material || !visibility.current) return
    const u = material.uniforms

    const { progress } = useHomeScenesStore.getState().mosaic
    const delta = progress - prevProgress.current
    prevProgress.current = progress

    u.uScrollVelocity.value = THREE.MathUtils.lerp(
      u.uScrollVelocity.value as number,
      delta,
      config.mosaic.shader.velocityLerp,
    )
    u.uBarrelMultiplier.value = isTouch
      ? config.mosaic.shader.barrelMultiplierMobile
      : config.mosaic.shader.barrelMultiplier

    const fade = Math.max(
      0,
      Math.min(1, (1 - progress) / config.mosaic.shader.fadeDivisor),
    )
    u.uScroll.value = fade * getMosaicReveal()
    u.uIsMobile.value = false

    // Pointer parallax, faded out almost immediately once scrolling starts.
    const s = isTouch ? 0 : 1 - THREE.MathUtils.smoothstep(progress, 0, 0.04)
    const { ndcX, ndcY } = usePointerStore.getState()
    offset.current.x = THREE.MathUtils.lerp(offset.current.x, 0.0025 * ndcX * s, 0.055)
    offset.current.y = THREE.MathUtils.lerp(offset.current.y, 0.0018 * ndcY * s, 0.055)
    ;(u.uPointerOffset.value as THREE.Vector2).copy(offset.current)
  })
}

function MosaicPlane({
  texture,
  media,
  position,
}: {
  texture: THREE.Texture
  media: Media
  position: readonly [number, number, number]
}) {
  const materialRef = useRef<MosaicPortalMaterialImpl>(null)
  useMosaicUniforms(materialRef)

  const scale = useAspect(media.width, media.height, PLANE_SCALE)

  return (
    <mesh position={position as unknown as THREE.Vector3Tuple} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <mosaicPortalMaterial
        ref={materialRef}
        key={MosaicPortalMaterial.key}
        transparent
        depthWrite={false}
        toneMapped={false}
        uTexture={texture}
      />
    </mesh>
  )
}

function MosaicImage({ media, position }: { media: Media; position: readonly [number, number, number] }) {
  const texture = useTexture(media.url)
  texture.colorSpace = THREE.SRGBColorSpace
  return <MosaicPlane texture={texture} media={media} position={position} />
}

function MosaicVideo({ media, position }: { media: Media; position: readonly [number, number, number] }) {
  const texture = useVideoTexture(videoSrc(media), {
    muted: true,
    loop: true,
    start: true,
    playsInline: true,
    crossOrigin: 'anonymous',
  })
  texture.colorSpace = THREE.SRGBColorSpace

  // Stop decoding once the mosaic is off screen. Nothing samples the texture then, but
  // the browser keeps decoding frames regardless until the element is paused.
  useFrame(() => {
    const el = texture.image as HTMLVideoElement | undefined
    if (!el) return
    if (!visibility.current && !el.paused) el.pause()
    else if (visibility.current && el.paused) void el.play().catch(() => {})
  })

  return <MosaicPlane texture={texture} media={media} position={position} />
}

/**
 * The rock. Lit by a single point light on a Lissajous orbit â€” the wobble in the
 * highlight as you scroll past comes from the two different frequencies here, not
 * from the model moving.
 */
function RockModel() {
  const groupRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const { scene } = useGLTF('/models/rockPodium-lite.glb')

  const cloned = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o) => {
      if (o instanceof THREE.Mesh) o.material = (o.material as THREE.Material).clone()
    })
    return clone
  }, [scene])

  const { position, rotation } = config.mosaicAssets.model

  useFrame(({ clock }) => {
    if (!visibility.current) return
    const t = clock.getElapsedTime() * config.lighting.orbitalSpeed
    const A = config.lighting.orbitalAmplitude
    lightRef.current?.position.set(
      position[0] + Math.cos(t) * A,
      position[1] - 5 + Math.sin(t) * A,
      position[2] + Math.sin(t) * A + 4,
    )

    const { progress } = useHomeScenesStore.getState().mosaic
    if (groupRef.current) {
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        rotation[1] + progress * config.mosaic.model.scrollIntensity * 0.15,
        config.mosaic.model.rotationLerp,
      )
    }
  })

  return (
    <group ref={groupRef}>
      <primitive
        object={cloned}
        position={position as unknown as THREE.Vector3Tuple}
        rotation={rotation as unknown as THREE.EulerTuple}
        scale={4}
      />
      <ambientLight intensity={config.lighting.ambientIntensity} />
      <pointLight
        ref={lightRef}
        intensity={config.lighting.pointIntensity}
        decay={config.lighting.pointDecay}
        color="white"
      />
    </group>
  )
}

useGLTF.preload('/models/rockPodium-lite.glb')

/**
 * Floating images and videos suspended in fogged space between z = -18 and z = -65.
 *
 * Scroll walks the whole group toward the camera, so the planes emerge out of the fog
 * rather than fading in on the spot. Positions are the original's, verbatim.
 */
export function MosaicScene() {
  const groupRef = useRef<THREE.Group>(null)
  const isTouch = isTouchDevice()

  /**
   * The CMS list lines up with the config slots in order: the first three entries are
   * videos and land on the three video positions, the next three on the image
   * positions. Type is taken from each media's own mimeType rather than from which
   * slot it fell into, since the last image slot holds a video.
   */
  const slots = useMemo(() => {
    const all = homepage.homeMosaicMedias ?? []
    const positions = [
      ...config.mosaicAssets.videos.map((v) => v.position),
      ...config.mosaicAssets.images.map((v) => v.position),
    ]
    return positions
      .map((position, i) => ({ position, media: all[i] }))
      .filter((s) => Boolean(s.media))
  }, [])

  const spread = isTouch ? config.mosaic.mobileSpreadFactor : 1

  const place = (p: readonly number[]) =>
    [p[0] * spread, p[1] * spread, p[2]] as const

  /**
   * Fly the whole group toward the camera as the page scrolls, so the planes emerge
   * out of the fog and grow rather than fading in where they sit.
   *
   * Driven by raw scroll rather than the mosaic ScrollTrigger: that trigger sits on
   * the project grid and only starts once the grid is a viewport away, which is where
   * the planes FADE. The approach happens well before it, across the hero.
   */
  useFrame(() => {
    const group = groupRef.current
    if (!group) return

    // The planes' shader alpha is `fade * mosaicReveal`; once that reaches zero there
    // is nothing to draw, so hide the whole group. Six textured planes and a lit GLTF
    // otherwise keep rendering for the rest of the page.
    const { progress } = useHomeScenesStore.getState().mosaic
    const fade = Math.max(0, Math.min(1, (1 - progress) / config.mosaic.shader.fadeDivisor))
    const visible = fade * getMosaicReveal() > 0.001
    if (visible !== visibility.current) {
      visibility.current = visible
      group.visible = visible
    }
    if (!visible) return

    const viewports = window.scrollY / window.innerHeight
    group.position.z = THREE.MathUtils.lerp(
      group.position.z,
      viewports * config.mosaic.model.scrollIntensity,
      config.mosaic.parallax.positionLerp,
    )
  })

  if (!slots.length) return null

  return (
    <group ref={groupRef}>
      <Suspense fallback={null}>
        {slots.map((slot, i) =>
          isVideo(slot.media) ? (
            <MosaicVideo key={i} media={slot.media} position={place(slot.position)} />
          ) : (
            <MosaicImage key={i} media={slot.media} position={place(slot.position)} />
          ),
        )}
        <RockModel />
      </Suspense>
    </group>
  )
}
