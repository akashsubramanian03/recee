'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { config } from '@/config/animation'
import { useHomeScenesStore } from '@/stores/useHomeScenesStore'
import { homepage } from '@/data'

/**
 * Hero text overlay plus the scroll driver for the logo morph.
 *
 * The visible hero is entirely WebGL (see HeroPortal); what lives here is the fixed
 * text layer and an empty 200svh block whose scroll range feeds
 * `useHomeScenesStore().hero`.
 */
export function Hero() {
  const pinRef = useRef<HTMLElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const hintRef = useRef<HTMLDivElement>(null)
  const isReady = useHomeScenesStore((s) => s.isReady)

  useEffect(() => {
    const setScene = useHomeScenesStore.getState().setScene
    let last = 0

    const ctx = gsap.context(() => {
      // Hero progress: 0 at the top, 1 after one viewport of scroll. This is what
      // pushes the mark back in Z and opens the barrel warp.
      ScrollTrigger.create({
        trigger: pinRef.current,
        start: config.scrollTriggers.hero.start,
        end: 'bottom top',
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress
          setScene('hero', { progress, velocity: progress - last })
          last = progress
          if (process.env.NODE_ENV !== 'production') {
            // Read by tools/probe-hero.mjs when fitting the hero curve.
            ;(window as unknown as { __heroProgress?: number }).__heroProgress = progress
          }
        },
      })

      // The tagline is only up while the page is at rest at the very top.
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: config.scrollTriggers.heroText.start,
        onEnter: () => gsap.to([textRef.current, hintRef.current], { opacity: 0, duration: 0.35 }),
        onLeaveBack: () =>
          gsap.to([textRef.current, hintRef.current], { opacity: 1, duration: 0.45 }),
      })
    })

    return () => ctx.revert()
  }, [])

  // Fade the tagline in once the portal has taken over from the preloader.
  useEffect(() => {
    if (!isReady) return
    gsap.to([textRef.current, hintRef.current], {
      opacity: 1,
      duration: 0.8,
      delay: 0.35,
      ease: 'power2.out',
    })
  }, [isReady])

  return (
    <>
      <section className="grid-layout pointer-events-none fixed inset-0 z-20 items-end pb-grid-margin">
        <div
          ref={textRef}
          className="c-hero_text text-heading-lg col-span-4 leading-[0.9] tracking-[-0.01em] text-black opacity-0 md:col-span-6"
          style={{
            fontKerning: 'none',
            fontVariantLigatures: 'none',
            textRendering: 'optimizeSpeed',
          }}
          dangerouslySetInnerHTML={{ __html: homepage.homeHeroTagline }}
        />
        <div
          ref={hintRef}
          className="text-label col-span-1 col-start-[-2] text-right text-black opacity-0"
          style={{
            fontKerning: 'none',
            fontVariantLigatures: 'none',
            textRendering: 'optimizeSpeed',
          }}
          dangerouslySetInnerHTML={{ __html: homepage.homeHeroHint }}
        />
      </section>

      {/* Scroll driver. Nothing renders here — the hero image is the canvas behind it. */}
      <section ref={pinRef} className="h-svh" aria-hidden="true" />
      <div className="relative z-10 h-[200svh]" aria-hidden="true" />
    </>
  )
}
