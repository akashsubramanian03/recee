'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Lenis from 'lenis'
import { gsap } from '@/lib/gsap'
import { useUIStore } from '@/stores/useUIStore'
import { projects, projectYear, videoSrc, isVideo } from '@/data'
import { projectListLenisOptions } from '@/config/animation'

/**
 * Full-screen list view of the work, toggled from the grid.
 *
 * The inner scroller carries `data-lenis-prevent` so Lenis leaves it alone and the
 * list scrolls natively while the page behind stays put. Hovering a row cross-fades
 * a poster behind the list (714:509 frame, 0.52s ease-out-expo).
 */
export function ProjectList() {
  const view = useUIStore((s) => s.projectView)
  const open = view === 'list'
  const rootRef = useRef<HTMLDivElement>(null)
  const posterRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLUListElement>(null)
  const [hovered, setHovered] = useState<number | null>(null)

  /**
   * The list gets its own Lenis rather than scrolling natively. `data-lenis-prevent`
   * keeps the page scroller off it, and this nested instance is tuned heavier than the
   * page (lerp 0.08 against 0.1, wheel damped to 0.8) so the panel feels distinct from
   * the document behind it — the same options the original passes.
   */
  useEffect(() => {
    const wrapper = scrollRef.current
    const content = contentRef.current
    if (!wrapper || !content) return
    const lenis = new Lenis({ ...projectListLenisOptions, wrapper, content })
    return () => lenis.destroy()
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return
    gsap.killTweensOf(root)
    gsap.to(root, {
      autoAlpha: open ? 1 : 0,
      duration: 0.5,
      ease: 'power2.out',
    })
  }, [open])

  useEffect(() => {
    if (!posterRef.current) return
    gsap.to(posterRef.current, {
      opacity: hovered === null ? 0 : 1,
      duration: 0.52,
      ease: 'power2.out',
    })
  }, [hovered])

  const active = hovered === null ? null : projects[hovered]

  return (
    <div
      ref={rootRef}
      className="pointer-events-none fixed inset-0 z-[60]"
      style={{ opacity: 0, visibility: 'hidden' }}
      aria-hidden={!open}
    >
      {/* Hover poster, desktop */}
      <div
        ref={posterRef}
        className="project-list-hover-poster grid-layout pointer-events-none fixed inset-x-0 z-0 hidden md:grid"
        style={{ opacity: 0 }}
      >
        <div className="project-list-hover-poster-frame relative col-span-6 col-start-4 overflow-hidden">
          {active &&
            (isVideo(active.projectCover) ? (
              <video
                key={active.id}
                className="project-list-hover-poster-media h-full w-full object-cover"
                src={videoSrc(active.projectCover)}
                poster={active.projectCover.video?.thumbnailUrl}
                autoPlay
                muted
                loop
                playsInline
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={active.id}
                className="project-list-hover-poster-media h-full w-full object-cover"
                src={active.projectCover.url}
                alt=""
              />
            ))}
        </div>
      </div>

      <div className="grid-layout project-list-panel relative z-10 h-full min-h-0 overflow-hidden">
        <div
          ref={scrollRef}
          className="project-list-scroll pointer-events-auto relative col-span-5 min-h-0 md:col-span-8 md:col-start-3"
          data-lenis-prevent="true"
        >
          <ul ref={contentRef} className="project-list-scroll-content">
            {projects.map((project, i) => (
              <li
                key={project.id}
                className="project-list-row project-list-text-mask relative"
                onMouseEnter={() => setHovered(i)}
                onMouseLeave={() => setHovered((h) => (h === i ? null : h))}
              >
                <Link
                  href={`/projects/${project.projectSlug}`}
                  className="project-list-row-content project-list-hover-fade grid grid-cols-5 md:grid-cols-8"
                  style={{ opacity: hovered === null || hovered === i ? 1 : 0.35 }}
                >
                  <span className="text-heading-xl col-span-3 text-white md:col-span-5">
                    {project.projectTitle}
                  </span>
                  <span className="text-label col-span-1 self-center text-white md:col-span-2">
                    {project.projectClient}
                  </span>
                  <span className="text-label col-span-1 self-center text-right text-white">
                    {projectYear(project)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="project-list-gradient-h pointer-events-none fixed inset-x-0 bottom-0 z-20" />
    </div>
  )
}
