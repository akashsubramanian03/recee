import { HomeScenes } from '@/components/webgl/HomeScenes'
import { Preloader } from '@/components/layout/Preloader'
import { Hero } from '@/components/sections/Hero'
import { ProjectGrid } from '@/components/sections/ProjectGrid'
import { Worldwide } from '@/components/sections/Worldwide'
import { BehindTheScenes } from '@/components/sections/BehindTheScenes'
import { WhatWeDo } from '@/components/sections/WhatWeDo'
import { HomeFooter } from '@/components/sections/HomeFooter'
import { ContourField } from '@/components/sections/ContourField'
import { BlueprintGrid } from '@/components/BlueprintGrid'

/**
 * Stacking, deliberately:
 *   - section backgrounds paint at the default level (no z-index, so no stacking
 *     context of their own)
 *   - the WebGL canvas is fixed at z-10, transparent except where a scene draws
 *   - section content sits at z-20
 *
 * That ordering is what lets the footer rock render over the grey backdrop while the
 * footer type stays on top of the rock, from a single canvas.
 */
export default function HomePage() {
  return (
    <>
      <Preloader />
      <HomeScenes />

      <main className="relative">
        {/* Hero + work grid read against the black body. */}
        <Hero />
        <ProjectGrid />

        {/* White panel: worldwide statement, behind-the-scenes, what we do. */}
        <section className="relative bg-white">
          {/*
            No `overflow-hidden` here: it would make this element the scrollport for
            the contour canvas's `position: sticky`, pinning it in place instead of
            letting it track the viewport.
          */}
          <div className="pointer-events-none absolute inset-0">
            <ContourField />
            <BlueprintGrid color="rgba(0,0,0,0.5)" />
          </div>
          <div className="relative z-20">
            <Worldwide />
            <BehindTheScenes />
            <WhatWeDo />
          </div>
        </section>

        <section className="relative" style={{ backgroundColor: '#343434' }}>
          <HomeFooter />
        </section>
      </main>
    </>
  )
}
