'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { config } from '@/config/animation'
import { useHomeScenesStore } from '@/stores/useHomeScenesStore'
import { useUIStore } from '@/stores/useUIStore'
import { homepage, navigation } from '@/data'
import { BlueprintGrid } from '@/components/BlueprintGrid'

/**
 * Closing panel. The rock is WebGL (see FooterRock) and renders through the canvas
 * behind this markup, so everything here is transparent over the #343434 backdrop.
 */
export function HomeFooter() {
  const sectionRef = useRef<HTMLElement>(null)
  const openContact = useUIStore((s) => s.openContact)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const setScene = useHomeScenesStore.getState().setScene
    let last = 0
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: config.scrollTriggers.footer.start,
        end: config.scrollTriggers.footer.end,
        scrub: true,
        onUpdate: (self) => {
          setScene('footer', { progress: self.progress, velocity: self.progress - last })
          last = self.progress
        },
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  const email = navigation.contactEmails[2]?.url ?? navigation.contactEmails[0]?.url ?? ''

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } catch {
      /* clipboard may be blocked */
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 1600)
  }

  return (
    <section
      id="contact"
      ref={sectionRef}
      className="relative z-20 h-lvh"
      style={{ backgroundColor: 'transparent' }}
    >
      <BlueprintGrid color="rgba(0,0,0,0.5)" />

      <div className="grid-layout pointer-events-none absolute inset-0 h-full items-center">
        <p className="text-footer-side pointer-events-auto col-span-2 hidden h-full items-center text-white md:flex">
          {homepage.homeFooterTextLeft}
        </p>

        <div
          className="text-footer-tagline pointer-events-auto absolute top-[67%] left-1/2 inline-flex w-[60%] -translate-x-1/2 flex-col items-center text-center text-white md:w-auto [&_a]:cursor-pointer [&_a]:whitespace-nowrap [&_a]:underline [&_p]:m-0"
          onClick={(e) => {
            const target = e.target as HTMLElement
            if (target.tagName === 'A') {
              e.preventDefault()
              openContact()
            }
          }}
          dangerouslySetInnerHTML={{ __html: homepage.homeFooterTagline }}
        />

        <p className="text-footer-side pointer-events-auto col-span-2 col-start-11 hidden h-full items-center justify-end text-right text-white md:flex">
          {homepage.homeFooterTextRight}
        </p>
      </div>

      <div className="pointer-events-auto absolute inset-x-0 bottom-0">
        <footer className="relative px-grid-margin text-white">
          <div className="relative flex h-full w-full items-center justify-between py-gap-lg">
            {/* 3px-on / 3px-off hairline rule */}
            <div className="absolute top-0 left-0 h-[0.5px] w-full bg-bottom bg-no-repeat [background-image:repeating-linear-gradient(90deg,rgb(255_255_255_/_0.5)_0px,rgb(255_255_255_/_0.5)_3px,transparent_3px,transparent_6px)] [background-size:100%_0.5px]" />

            <div className="flex flex-col items-start justify-between">
              <p className="text-label">{navigation.footerCopyright}</p>
            </div>

            <button
              type="button"
              onClick={copyEmail}
              className="text-label relative cursor-pointer md:!absolute md:top-1/2 md:left-1/2 md:block md:-translate-x-1/2 md:-translate-y-1/2 md:[&_span]:!text-center"
            >
              <span className="transition-opacity duration-200" style={{ opacity: copied ? 0 : 1 }}>
                {email}
              </span>
              <span
                className="absolute inset-0 text-left transition-opacity duration-200"
                style={{ opacity: copied ? 1 : 0 }}
              >
                Copied
              </span>
            </button>

            <p className="text-label text-right">
              Website by{' '}
              <a href="https://sanrita.ca" target="_blank" rel="noreferrer" className="underline">
                San Rita
              </a>
            </p>
          </div>
        </footer>
      </div>
    </section>
  )
}
