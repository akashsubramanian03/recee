'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { config } from '@/config/animation'
import { useHomeScenesStore } from '@/stores/useHomeScenesStore'
import { useUIStore } from '@/stores/useUIStore'
import { projects, projectYear, videoSrc, isVideo, type Project } from '@/data'
import { ViewToggle } from '@/components/icons'
import { LazyVideo } from '@/components/media/LazyVideo'
import { ProjectList } from './ProjectList'

function ProjectCard({ project }: { project: Project }) {
  const cover = project.projectCover
  const poster = project.projectPoster?.video?.thumbnailUrl ?? project.projectCover?.video?.thumbnailUrl

  return (
    <Link href={`/projects/${project.projectSlug}`} className="group block">
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16 / 11' }}>
        {isVideo(cover) ? (
          <LazyVideo
            className="h-full w-full object-cover"
            src={videoSrc(cover)}
            poster={poster}
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
      <div className="mt-gap-sm flex items-start justify-between gap-gap-md">
        <h3 className="text-heading-lg text-white">{project.projectTitle}</h3>
        <p className="text-label shrink-0 text-right text-white">
          {projectYear(project)}
          <br />
          {project.projectClient}
        </p>
      </div>
    </Link>
  )
}

/**
 * The work grid, and the source of the mosaic's fade-out.
 *
 * Two things are wired to this section:
 *  - column drift: each column scrubs to a different y offset (-250/200/-150/130 px
 *    at four columns, -200/250/-150 at three), which is why the columns arrive
 *    staggered rather than as one block.
 *  - the mosaic ScrollTrigger. Its `top bottom -> top center` range sits on THIS
 *    element, so the floating images hold full opacity until the grid is one
 *    viewport away and are gone by the time it reaches centre.
 */
export function ProjectGrid() {
  const sectionRef = useRef<HTMLElement>(null)
  const columnRefs = useRef<(HTMLDivElement | null)[]>([])
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [columnCount, setColumnCount] = useState(4)
  const view = useUIStore((s) => s.projectView)
  const toggleView = useUIStore((s) => s.toggleProjectView)

  useEffect(() => {
    const read = () => {
      const w = window.innerWidth
      setColumnCount(w >= 1280 ? 4 : w >= 768 ? 3 : 1)
    }
    read()
    window.addEventListener('resize', read)
    return () => window.removeEventListener('resize', read)
  }, [])

  const columns = useMemo(() => {
    const cols: Project[][] = Array.from({ length: columnCount }, () => [])
    projects.forEach((p, i) => cols[i % columnCount].push(p))
    return cols
  }, [columnCount])

  useEffect(() => {
    const setScene = useHomeScenesStore.getState().setScene
    let last = 0

    const ctx = gsap.context(() => {
      const drifts =
        columnCount >= 4
          ? config.projectGrid.parallax.drifts4
          : config.projectGrid.parallax.drifts3

      if (columnCount > 1) {
        columnRefs.current.slice(0, columnCount).forEach((col, i) => {
          if (!col) return
          gsap.fromTo(
            col,
            { y: 0 },
            {
              y: drifts[i % drifts.length],
              ease: 'none',
              scrollTrigger: {
                trigger: sectionRef.current,
                start: config.scrollTriggers.projectGrid.parallax.start,
                end: config.scrollTriggers.projectGrid.parallax.end,
                scrub: config.projectGrid.parallax.scrub,
              },
            },
          )
        })
      }

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: config.scrollTriggers.mosaic.start,
        end: config.scrollTriggers.mosaic.end,
        scrub: true,
        onUpdate: (self) => {
          setScene('mosaic', { progress: self.progress, velocity: self.progress - last })
          last = self.progress
        },
      })

      // The view toggle only exists while the grid is on screen.
      gsap.set(toggleRef.current, { autoAlpha: 0 })
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: config.scrollTriggers.projectGrid.viewButton.start,
        end: config.scrollTriggers.projectGrid.viewButton.end,
        onToggle: (self) =>
          gsap.to(toggleRef.current, {
            autoAlpha: self.isActive ? 1 : 0,
            duration: 0.35,
            ease: 'power2.out',
          }),
      })
    }, sectionRef)

    return () => ctx.revert()
  }, [columnCount])

  return (
    <>
      <section
        id="work"
        ref={sectionRef}
        className="relative z-20 grid grid-cols-1 gap-gap-xl px-grid-margin pt-section pb-[calc(var(--spacing-section)+var(--spacing-grid-drift))] min-[768px]:grid-cols-3 min-[768px]:gap-x-grid-gutter min-[1280px]:grid-cols-4"
      >
        {columns.map((column, i) => (
          <div
            key={i}
            ref={(el) => {
              columnRefs.current[i] = el
            }}
            className="flex flex-col gap-gap-xl will-change-transform"
          >
            {column.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ))}
      </section>

      <button
        ref={toggleRef}
        type="button"
        onClick={toggleView}
        aria-label={view === 'grid' ? 'Switch to list view' : 'Switch to grid view'}
        className="fixed bottom-[24px] left-1/2 z-[70] h-[54px] w-[102px] -translate-x-1/2 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
      >
        <ViewToggle className="block h-full w-full" />
      </button>

      <ProjectList />
    </>
  )
}
