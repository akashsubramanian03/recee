'use client'

import { useEffect } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { lenisOptions } from '@/config/animation'
import { setLenis } from '@/lib/lenis'

/**
 * Lenis is the scroller; ScrollTrigger reads from it.
 *
 * Lenis' own rAF is disabled (`autoRaf: false`) and driven off gsap.ticker instead,
 * so scroll position, ScrollTriggers and the r3f render loop all advance in the same
 * frame. Without this the shader uniforms lag the DOM by a frame and the logo morph
 * visibly tears against the header.
 */
export function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const lenis = new Lenis({ ...lenisOptions, autoRaf: false })
    setLenis(lenis)

    lenis.on('scroll', ScrollTrigger.update)

    const tick = (time: number) => lenis.raf(time * 1000)
    gsap.ticker.add(tick)

    return () => {
      gsap.ticker.remove(tick)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  return <>{children}</>
}
