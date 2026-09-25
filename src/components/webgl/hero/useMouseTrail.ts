import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFBO } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { usePointerStore } from '@/stores/usePointerStore'

const TRAIL_LENGTH = 24
const FBO_SIZE = 512
/** Movement below this (in the trail's unit-square space) counts as holding still. */
const MOVE_EPSILON = 0.0015

/** Soft radial brush, generated once on a 2D canvas. */
function makeBrushTexture() {
  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = size
  const ctx = canvas.getContext('2d')!
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,255,255,1)')
  g.addColorStop(0.4, 'rgba(255,255,255,0.45)')
  g.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const tex = new THREE.CanvasTexture(canvas)
  tex.needsUpdate = true
  return tex
}

/**
 * Renders a comet trail of the pointer into an offscreen target.
 *
 * The hero shader samples this as `uMouseTexture` and uses its rgb as a UV
 * displacement, so the mark's edge ripples where the cursor has just been. Black
 * (no trail) means zero displacement, which is why the target is cleared to black.
 */
export function useMouseTrail(
  enabled: boolean,
  /** Skip the pass when the hero is off screen — the trail feeds nothing then. */
  activeRef?: React.RefObject<boolean>,
) {
  const { gl } = useThree()
  const target = useFBO(FBO_SIZE, FBO_SIZE, { depthBuffer: false, stencilBuffer: false })

  const { scene, camera, meshes, brush } = useMemo(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x000000)
    // Unit-square space so pointer NDC maps straight onto it.
    const camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, 0.1, 10)
    camera.position.z = 1

    const brush = makeBrushTexture()
    const geometry = new THREE.PlaneGeometry(1, 1)
    const meshes: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>[] = []

    for (let i = 0; i < TRAIL_LENGTH; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: brush,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthTest: false,
        depthWrite: false,
        opacity: 0,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.visible = false
      scene.add(mesh)
      meshes.push(mesh)
    }
    return { scene, camera, meshes, brush }
  }, [])

  /** Ring buffer of recent pointer positions, newest last. */
  const history = useRef<{ x: number; y: number }[]>([])
  const cursor = useRef(new THREE.Vector2(0, 0))
  /** Last position committed to the trail, for deciding whether the cursor moved. */
  const lastSample = useRef(new THREE.Vector2(0, 0))

  useFrame(() => {
    if (!enabled || activeRef?.current === false) return

    const { ndcX, ndcY, hasMoved } = usePointerStore.getState()
    if (hasMoved) {
      // Ease toward the pointer so the trail keeps a little inertia.
      cursor.current.x = THREE.MathUtils.lerp(cursor.current.x, ndcX * 0.5, 0.28)
      cursor.current.y = THREE.MathUtils.lerp(cursor.current.y, ndcY * 0.5, 0.28)
    }

    // Only extend the trail while the cursor is actually travelling. Stamping the same
    // point every frame would leave a permanent blob under a resting cursor, and since
    // the hero shader uses this texture as a UV displacement that blob shows up as the
    // mark's interior dissolving into noise. Holding still drains the history instead,
    // so the trail fades out the way it should.
    const moved =
      Math.abs(cursor.current.x - lastSample.current.x) > MOVE_EPSILON ||
      Math.abs(cursor.current.y - lastSample.current.y) > MOVE_EPSILON

    if (moved) {
      lastSample.current.copy(cursor.current)
      history.current.push({ x: cursor.current.x, y: cursor.current.y })
      if (history.current.length > TRAIL_LENGTH) history.current.shift()
    } else if (history.current.length) {
      history.current.shift()
    }

    for (let i = 0; i < meshes.length; i++) {
      const point = history.current[history.current.length - 1 - i]
      const mesh = meshes[i]
      if (!point || !hasMoved) {
        mesh.visible = false
        continue
      }
      // Newest sample is largest and brightest; the tail fades out.
      const t = 1 - i / TRAIL_LENGTH
      mesh.visible = true
      mesh.position.set(point.x, point.y, 0)
      const scale = 0.34 * t + 0.05
      mesh.scale.set(scale, scale, 1)
      mesh.material.opacity = 0.22 * t * t
    }

    const prevTarget = gl.getRenderTarget()
    gl.setRenderTarget(target)
    gl.clear()
    gl.render(scene, camera)
    gl.setRenderTarget(prevTarget)
  })

  return { texture: target.texture, brush }
}
