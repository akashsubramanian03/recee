'use client'

import { useMemo, useRef, useEffect } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { config } from '@/config/animation'
import { useHomeScenesStore } from '@/stores/useHomeScenesStore'

/**
 * The draggable rock in the footer.
 *
 * Spin is momentum-based: dragging adds angular velocity, which decays at
 * `dampActive` while held and the slower `dampRelease` once let go, so it keeps
 * turning after the pointer leaves.
 */
export function FooterRock() {
  const groupRef = useRef<THREE.Group>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const ambientRef = useRef<THREE.AmbientLight>(null)
  const { scene } = useGLTF('/models/rockPodium-lite.glb')
  const { viewport, gl } = useThree()

  const model = useMemo(() => {
    const clone = scene.clone(true)
    clone.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        o.material = (o.material as THREE.Material).clone()
        ;(o.material as THREE.Material).transparent = true
      }
    })
    return clone
  }, [scene])

  const drag = useRef({ active: false, lastX: 0, lastY: 0, vx: 0, vy: 0 })
  const opacity = useRef(0)

  // Pointer drag is bound to the canvas element rather than the mesh so the whole
  // footer area grabs, matching the original's `cursor-grab` affordance.
  useEffect(() => {
    const el = gl.domElement
    const d = drag.current

    const down = (e: PointerEvent) => {
      const { footer } = useHomeScenesStore.getState()
      if (footer.progress <= 0.01) return
      d.active = true
      d.lastX = e.clientX
      d.lastY = e.clientY
      el.style.cursor = 'grabbing'
    }
    const move = (e: PointerEvent) => {
      if (!d.active) return
      const dx = e.clientX - d.lastX
      const dy = e.clientY - d.lastY
      d.lastX = e.clientX
      d.lastY = e.clientY
      if (Math.abs(dx) + Math.abs(dy) < config.footer.drag.threshold * 0.1) return
      d.vy += dx * 0.0016 * config.footer.drag.sensitivity
      d.vx += dy * 0.0016 * config.footer.drag.sensitivity
    }
    const up = () => {
      d.active = false
      el.style.cursor = ''
    }

    el.addEventListener('pointerdown', down)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      el.removeEventListener('pointerdown', down)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [gl])

  useFrame(({ clock }) => {
    const { footer } = useHomeScenesStore.getState()
    const g = groupRef.current
    if (!g) return

    // Fully faded and nowhere near the footer: skip the spin, the orbiting light and
    // the material traversal entirely. This runs for most of the page otherwise.
    if (footer.progress <= 0 && opacity.current <= 0.002) {
      if (g.visible) g.visible = false
      return
    }

    const d = drag.current
    const damp = d.active ? config.footer.drag.dampActive : config.footer.drag.dampRelease
    d.vx *= damp
    d.vy *= damp

    // Idle spin so the rock is never completely static.
    g.rotation.y += d.vy + 0.0016 * config.footer.model.spinFactor
    g.rotation.x += d.vx

    const t = clock.getElapsedTime() * config.footer.lighting.orbitalSpeed
    const A = config.footer.lighting.orbitalAmplitude
    lightRef.current?.position.set(
      (Math.cos(t) + 0.3 * Math.sin(2.37 * t)) * A,
      (Math.sin(0.73 * t) + 0.25 * Math.cos(1.93 * t)) * A,
      config.footer.lighting.lightZ + 0.4 * Math.sin(0.51 * t),
    )

    // Fade in over the first third of the footer's scroll range.
    opacity.current = THREE.MathUtils.lerp(
      opacity.current,
      THREE.MathUtils.clamp(footer.progress * 3, 0, 1),
      config.footer.model.opacityLerp,
    )
    g.visible = opacity.current > 0.002
    model.traverse((o) => {
      if (o instanceof THREE.Mesh) (o.material as THREE.Material).opacity = opacity.current
    })
  })

  const scale =
    (viewport.height / config.footer.model.viewportHeightRef) * config.footer.model.baseScale

  return (
    <group ref={groupRef} position={[0, config.footer.model.positionY, 0]} visible={false}>
      <primitive object={model} scale={scale} rotation={[0, 0, Math.PI]} />
      <ambientLight ref={ambientRef} intensity={config.footer.lighting.ambientIntensity} />
      <pointLight
        ref={lightRef}
        intensity={config.footer.lighting.pointIntensity}
        decay={config.footer.lighting.pointDecay}
        color="white"
        position={[
          config.footer.lighting.orbitalAmplitude,
          0,
          config.footer.lighting.lightZ,
        ]}
      />
    </group>
  )
}
