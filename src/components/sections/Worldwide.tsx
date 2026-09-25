'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger, SplitText } from '@/lib/gsap'
import { config } from '@/config/animation'
import { useHomeScenesStore } from '@/stores/useHomeScenesStore'
import { homepage } from '@/data'

/**
 * "Available Worldwide" — the justified statement that reads as one solid block.
 *
 * The CMS already delivers the copy pre-split into per-word <span>s; SplitText is
 * used on top of that for the line-by-line reveal so the words rise in groups
 * rather than individually.
 */
export function Worldwide() {
  const sectionRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const setScene = useHomeScenesStore.getState().setScene
    let last = 0

    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: config.scrollTriggers.worldwide.start,
        end: config.scrollTriggers.worldwide.end,
        scrub: true,
        onUpdate: (self) => {
          setScene('worldwide', { progress: self.progress, velocity: self.progress - last })
          last = self.progress
        },
      })

      if (!titleRef.current) return
      const split = new SplitText(titleRef.current, {
        type: 'lines',
        linesClass: 'overflow-hidden',
      })
      gsap.from(split.lines, {
        yPercent: 110,
        opacity: 0,
        duration: 1,
        ease: 'expo.out',
        stagger: 0.06,
        scrollTrigger: {
          trigger: titleRef.current,
          start: 'top bottom-=15%',
          once: true,
        },
      })
      return () => split.revert()
    }, sectionRef)

    return () => ctx.revert()
  }, [])

  return (
    <div id="about" ref={sectionRef} className="relative z-20 pt-section">
      <p className="text-body-sm px-grid-margin text-black">{homepage.homeWorldwideOverline}</p>
      <div className="grid-layout mt-gap-lg">
        <div
          ref={titleRef}
          className="text-heading-xl col-span-5 text-justify text-black md:col-span-10"
          dangerouslySetInnerHTML={{ __html: homepage.homeWorldwideTitle }}
        />
      </div>
    </div>
  )
}
