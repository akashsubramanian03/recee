'use client'

import { useEffect, useRef } from 'react'
import { config } from '@/config/animation'
import { usePointerStore } from '@/stores/usePointerStore'

/**
 * The dashed topographic field behind the lower half of the page.
 *
 * Geometry comes from /images/shapes.svg — the same 12 organic paths the original
 * ships. They are sampled into point lists once, then redrawn with each point pushed
 * away from the cursor, so the contours bulge as you move across them.
 *
 * Drawn to a 2D canvas rather than live SVG: ~1700 points move per frame and rewriting
 * that many DOM attributes drops frames.
 *
 * Three things keep this cheap, because it used to be the single most expensive thing
 * on the page:
 *
 *  - The canvas is **viewport-sized and sticky**, not stretched over the whole section.
 *    Sized to the section it was 2800x4312 (12 MP) on a retina display — more than
 *    twice the WebGL canvas — and every one of those pixels was cleared and recomposited
 *    each frame. This also matches the original, whose contours live inside its single
 *    fixed WebGL canvas and are therefore viewport-anchored too.
 *  - It renders at **dpr 1**. These are 1px dashed hairlines; retina buys nothing.
 *  - It only runs **while on screen**, and only redraws when something actually moved.
 *    The field is at rest most of the time.
 */

const SAMPLES_PER_PATH = 140
const DASH: [number, number] = [5, 5]
const STROKE = 'rgba(0, 0, 0, 0.42)'
/** Radius of the cursor's influence, in px. */
const INFLUENCE = 380
/** Below this total movement (in normalised units) the field counts as settled. */
const REST_EPSILON = 1e-5

type Pt = { x: number; y: number; ox: number; oy: number }

export function ContourField({ className = '' }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pathsRef = useRef<Pt[][]>([])
  const rafRef = useRef(0)
  const pointer = useRef({ x: -9999, y: -9999 })
  const lastPointer = useRef({ x: -9999, y: -9999 })
  /** Forces a repaint after a resize or when the canvas re-enters the viewport. */
  const dirty = useRef(true)
  /** True once the contours have eased back to their rest positions. */
  const settled = useRef(false)

  useEffect(() => {
    let cancelled = false
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    /** Sample the SVG's paths into point lists, normalised to 0..1 in the viewBox. */
    async function loadShapes() {
      const text = await fetch('/images/shapes.svg').then((r) => r.text())
      if (cancelled) return
      const doc = new DOMParser().parseFromString(text, 'image/svg+xml')
      const svg = doc.querySelector('svg')
      const vb = (svg?.getAttribute('viewBox') ?? '0 0 918 1740').split(/\s+/).map(Number)
      const [, , vbW, vbH] = vb

      // getTotalLength/getPointAtLength need the path to be in a live document.
      const scratch = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      scratch.setAttribute('width', '0')
      scratch.setAttribute('height', '0')
      scratch.style.position = 'absolute'
      scratch.style.opacity = '0'
      scratch.style.pointerEvents = 'none'
      document.body.appendChild(scratch)

      const out: Pt[][] = []
      for (const source of Array.from(doc.querySelectorAll('path'))) {
        const d = source.getAttribute('d')
        if (!d) continue
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', d)
        scratch.appendChild(path)
        const length = path.getTotalLength()
        if (!length) continue
        const points: Pt[] = []
        for (let i = 0; i <= SAMPLES_PER_PATH; i++) {
          const p = path.getPointAtLength((i / SAMPLES_PER_PATH) * length)
          const nx = p.x / vbW
          const ny = p.y / vbH
          points.push({ x: nx, y: ny, ox: nx, oy: ny })
        }
        out.push(points)
      }
      scratch.remove()
      pathsRef.current = out
      dirty.current = true
    }

    const resize = () => {
      const rect = canvas.getBoundingClientRect()
      // dpr 1 on purpose — see the note at the top of the file.
      canvas.width = Math.max(1, Math.round(rect.width))
      canvas.height = Math.max(1, Math.round(rect.height))
      dirty.current = true
    }

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw)

      const { clientX, clientY, hasMoved } = usePointerStore.getState()
      const pointerMoved =
        clientX !== lastPointer.current.x || clientY !== lastPointer.current.y
      lastPointer.current.x = clientX
      lastPointer.current.y = clientY

      // Nothing to do: no cursor movement since the last frame and the contours have
      // already settled back to their rest positions.
      if (!dirty.current && !pointerMoved && settled.current) return

      const rect = canvas.getBoundingClientRect()
      const w = rect.width
      const h = rect.height
      if (!w || !h) return

      pointer.current.x = hasMoved ? clientX - rect.left : -9999
      pointer.current.y = hasMoved ? clientY - rect.top : -9999

      const { divisorBase, divisorFactor, pointerMultiplier, targetMultiplier, lerpFactor } =
        config.worldwide.repulsion

      ctx.clearRect(0, 0, w, h)
      ctx.save()
      ctx.setLineDash(DASH)
      ctx.strokeStyle = STROKE
      ctx.lineWidth = 1

      let movement = 0

      for (const points of pathsRef.current) {
        ctx.beginPath()
        for (let i = 0; i < points.length; i++) {
          const pt = points[i]
          const baseX = pt.ox * w
          const baseY = pt.oy * h

          const dx = baseX - pointer.current.x
          const dy = baseY - pointer.current.y
          const dist = Math.hypot(dx, dy)

          let tx = pt.ox
          let ty = pt.oy
          if (dist < INFLUENCE && dist > 0.0001) {
            const n = dist / INFLUENCE
            const force =
              targetMultiplier / (divisorBase + divisorFactor * n * n) - targetMultiplier / 5
            const push = Math.max(0, force) * INFLUENCE * pointerMultiplier
            tx = pt.ox + (dx / dist) * (push / w)
            ty = pt.oy + (dy / dist) * (push / h)
          }

          const nx = pt.x + (tx - pt.x) * lerpFactor
          const ny = pt.y + (ty - pt.y) * lerpFactor
          movement += Math.abs(nx - pt.x) + Math.abs(ny - pt.y)
          pt.x = nx
          pt.y = ny

          const px = pt.x * w
          const py = pt.y * h
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.stroke()
      }
      ctx.restore()

      dirty.current = false
      settled.current = movement < REST_EPSILON
    }

    const start = () => {
      if (rafRef.current) return
      dirty.current = true
      rafRef.current = requestAnimationFrame(draw)
    }
    const stop = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = 0
    }

    // Only animate while the panel is actually on screen.
    const observer = new IntersectionObserver(
      ([entry]) => (entry.isIntersecting ? start() : stop()),
      { rootMargin: '10% 0px' },
    )
    observer.observe(canvas)

    loadShapes()
    resize()
    window.addEventListener('resize', resize)

    return () => {
      cancelled = true
      stop()
      observer.disconnect()
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none sticky top-0 block h-svh w-full ${className}`}
    />
  )
}
