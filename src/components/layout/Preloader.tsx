'use client'

import { useEffect, useRef, useState } from 'react'
import { useProgress } from '@react-three/drei'
import { gsap } from '@/lib/gsap'
import { useHomeScenesStore } from '@/stores/useHomeScenesStore'

/**
 * White sheet, a black dot, and a percentage counter.
 *
 * The dot is deliberately the same size and colour as the hole the hero shader opens
 * at uShapeReveal = 0 (`sdCircle(circleUv, 0.01)`), so when this sheet fades the dot
 * appears to keep going — there is no cut between the DOM loader and the shader.
 */
export function Preloader() {
  const { progress, total, loaded } = useProgress()
  const rootRef = useRef<HTMLDivElement>(null)
  const [display, setDisplay] = useState(0)
  const setReady = useHomeScenesStore((s) => s.setReady)

  // Smooth the raw loader progress — drei reports it in jumps.
  useEffect(() => {
    const target = total === 0 ? 0 : progress
    const proxy = { v: display }
    const tween = gsap.to(proxy, {
      v: target,
      duration: 0.6,
      ease: 'power2.out',
      onUpdate: () => setDisplay(proxy.v),
    })
    return () => {
      tween.kill()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, total])

  const done = total > 0 && loaded >= total

  useEffect(() => {
    if (!done) return
    const tl = gsap.timeline()
    tl.to({}, { duration: 0.35 })
      .call(() => setReady(true))
      .to(rootRef.current, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: () => {
          if (rootRef.current) rootRef.current.style.visibility = 'hidden'
        },
      })
    return () => {
      tl.kill()
    }
  }, [done, setReady])

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-[10000] flex h-lvh w-full items-center justify-center bg-white"
    >
      <div className="h-[2.38vh] w-[2.38vh] rounded-full bg-black" />
      <span className="text-heading-md absolute top-grid-margin right-grid-margin text-black">
        {Math.round(display)}%
      </span>
    </div>
  )
}
