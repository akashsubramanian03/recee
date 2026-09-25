'use client'

import { useEffect, useRef } from 'react'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { config } from '@/config/animation'
import { isVideo, videoSrc, type Project } from '@/data'
import { LazyVideo } from '@/components/media/LazyVideo'

/** "Nov 2025" — the CMS stores a full ISO date. */
function formatDate(iso: string) {
  const d = new Date(iso)
  return `${d.toLocaleString('en-US', { month: 'short' })} ${d.getFullYear()}`
}

/**
 * Full-bleed project header.
 *
 * The whole section translates down a viewport as you scroll off it (the original's
 * `project-hero-fixed` keyframe), so the content below slides up over a hero that is
 * sinking rather than simply scrolling away.
 */
export function ProjectHero({ project }: { project: Project }) {
  const sectionRef = useRef<HTMLElement>(null)
  const mediaRef = useRef<HTMLDivElement>(null)
  const coverRef = useRef<HTMLDivElement>(null)
  const cover = project.projectPoster ?? project.projectCover

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.to(mediaRef.current, {
        yPercent: 100,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      })
      // Black wash over the hero as the next section arrives.
      gsap.fromTo(
        coverRef.current,
        { opacity: 0 },
        {
          opacity: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'center top',
            end: 'bottom top',
            scrub: true,
          },
        },
      )
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: config.scrollTriggers.projectHeaderFade.start,
      })
    }, sectionRef)
    return () => ctx.revert()
  }, [])

  return (
    <section ref={sectionRef} className="relative h-lvh w-full overflow-hidden bg-black">
      <div ref={mediaRef} className="absolute inset-0">
        {isVideo(cover) ? (
          // The hero is the page — never gate it behind an intersection check.
          <LazyVideo
            alwaysPlay
            className="h-full w-full object-cover"
            src={videoSrc(cover)}
            poster={cover.video?.thumbnailUrl}
            autoPlay
            muted
            loop
            playsInline
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            className="h-full w-full object-cover"
            src={cover.url}
            alt={cover.alt ?? project.projectTitle}
          />
        )}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex h-svh flex-col items-center justify-end pb-hero-bottom text-center">
        <p className="text-label text-white">{project.projectClient}</p>
        <h1 className="text-display text-white">{project.projectTitle}</h1>
        <p className="text-label mt-hero-meta-mt text-white">
          {project.projectInformations} | {formatDate(project.projectDate)}
        </p>
      </div>

      <div
        ref={coverRef}
        className="pointer-events-none absolute inset-0 z-[60] bg-black"
        style={{ opacity: 0 }}
      />
    </section>
  )
}
