'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import useEmblaCarousel from 'embla-carousel-react'
import { ScrollBar } from '@/components/icons'
import { LazyVideo } from '@/components/media/LazyVideo'
import { homepage } from '@/data'

/**
 * Behind-the-scenes strip.
 *
 * The card flip is pure CSS (see .ww-card rules in globals.css): activating a card
 * runs a skew and a rotateY together with `animation-composition: replace, add`, so
 * the card shears into the turn instead of rotating flat. `data-has-flipped` gates
 * the animation until a card has been activated once, otherwise every card would
 * flip on mount.
 */
export function BehindTheScenes() {
  const items = homepage.homeWorldwideCarousel ?? []
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    dragFree: true,
  })
  const [progress, setProgress] = useState(0)
  const [active, setActive] = useState(0)
  const flipped = useRef<Set<number>>(new Set())

  const onScroll = useCallback(() => {
    if (!emblaApi) return
    setProgress(Math.max(0, Math.min(1, emblaApi.scrollProgress())))
    const selected = emblaApi.selectedScrollSnap()
    setActive(selected)
    flipped.current.add(selected)
  }, [emblaApi])

  useEffect(() => {
    if (!emblaApi) return
    onScroll()
    emblaApi.on('scroll', onScroll)
    emblaApi.on('select', onScroll)
    emblaApi.on('reInit', onScroll)
    return () => {
      emblaApi.off('scroll', onScroll)
      emblaApi.off('select', onScroll)
      emblaApi.off('reInit', onScroll)
    }
  }, [emblaApi, onScroll])

  if (!items.length) return null

  return (
    <div className="relative z-20 pt-ww-carousel-top pb-ww-carousel-bottom">
      <div className="flex items-center gap-gap-lg px-grid-margin">
        <h3 className="text-heading-md tracking-[-0.01em] text-black">
          {homepage.homeWorldwideCarouselTitle}
        </h3>
        {/* Dotted rail with a solid black bar masked over it. */}
        <div className="relative overflow-hidden">
          <ScrollBar className="c-icon-scroll-bar text-black" />
          <div
            className="absolute top-0 left-0 h-full w-full bg-black will-change-transform"
            style={{ transform: `scaleX(${0.18 + progress * 0.82})`, transformOrigin: 'left' }}
          />
        </div>
      </div>

      <div className="mt-gap-lg overflow-x-clip overflow-y-visible" ref={emblaRef}>
        <div className="flex touch-pan-y">
          {items.map((item, i) => {
            // Most of these slides are silent looping clips, not stills.
            const image = item.media?.responsiveImage
            const video = item.media?.video
            const videoUrl = video?.mp4Url || video?.mp4MediumUrl
            return (
              <div
                key={item.id}
                className="shrink-0 grow-0 basis-[77.6vw] pl-grid-margin md:basis-[26.4vw]"
              >
                <div
                  className="ww-card"
                  data-active={i === active ? '' : undefined}
                  data-has-flipped={flipped.current.has(i) ? '' : undefined}
                >
                  <div className="aspect-[305/402] w-full perspective-[var(--spacing-perspective)] md:aspect-[400/527]">
                    <div className="ww-card-flip relative h-full w-full">
                      <div className="ww-card-front absolute inset-0 backface-hidden [-webkit-backface-visibility:hidden] [transform:translateZ(1px)]">
                        <div className="absolute inset-0 overflow-hidden">
                          <div className="relative h-full w-full scale-[1.2]">
                            {videoUrl ? (
                              <LazyVideo
                                className="h-full w-full object-cover"
                                src={videoUrl}
                                poster={video?.thumbnailUrl}
                                autoPlay
                                muted
                                loop
                                playsInline
                                preload="none"
                              />
                            ) : image ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img
                                className="h-full w-full object-cover"
                                src={image.src}
                                alt={image.alt ?? ''}
                                loading="lazy"
                              />
                            ) : null}
                          </div>
                        </div>
                        {item.text && (
                          <span className="text-label pointer-events-none absolute right-card-label-right bottom-card-label-bottom text-left tracking-[-0.01em] text-white md:w-[8.2vw] md:max-w-[8.2vw]">
                            {item.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
