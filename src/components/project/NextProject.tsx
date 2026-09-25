'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { gsap } from '@/lib/gsap'
import { isVideo, videoSrc, type Project } from '@/data'
import { LazyVideo } from '@/components/media/LazyVideo'

/**
 * White closing panel that slides up from behind the last content block — the
 * original's `project-footer-reveal` keyframe (translateY -100% -> 0).
 */
export function NextProject({ project }: { project: Project }) {
  const rootRef = useRef<HTMLElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        innerRef.current,
        { yPercent: -100 },
        {
          yPercent: 0,
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top bottom',
            end: 'top top',
            scrub: true,
          },
        },
      )
    }, rootRef)
    return () => ctx.revert()
  }, [])

  const cover = project.projectPoster ?? project.projectCover

  return (
    <section ref={rootRef} className="relative overflow-hidden bg-white">
      <div ref={innerRef} className="pt-section pb-section">
        <Link href={`/projects/${project.projectSlug}`} className="block">
          <h2 className="text-heading-xl px-grid-margin text-center text-black">
            Next project
            <br />
            <span className="underline">{project.projectTitle}</span>
          </h2>

          <div className="grid-layout mt-section">
            <div className="relative col-span-5 md:col-span-8 md:col-start-3">
              {isVideo(cover) ? (
                <LazyVideo
                  className="h-full w-full object-cover"
                  src={videoSrc(cover)}
                  poster={cover.video?.thumbnailUrl}
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="none"
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  className="h-full w-full object-cover"
                  src={cover.url}
                  alt={cover.alt ?? project.projectTitle}
                />
              )}
            </div>
          </div>
        </Link>
      </div>
    </section>
  )
}
