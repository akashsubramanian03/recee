'use client'

import { useEffect, useRef, useState } from 'react'
import { isVideo, videoSrc, type Media } from '@/data'
import { setScrollLocked } from '@/lib/lenis'
import { LazyVideo } from '@/components/media/LazyVideo'

/**
 * A media tile in a project's grid, with a click-to-expand lightbox.
 *
 * Videos autoplay muted inline; opening the lightbox unmutes and exposes a scrub bar
 * so the tile stays a silent loop until someone actually asks for the film.
 */
export function MediaItem({ media, className = '' }: { media: Media; className?: string }) {
  const [open, setOpen] = useState(false)
  const lightboxVideoRef = useRef<HTMLVideoElement>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    setScrollLocked(open)
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const scrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = lightboxVideoRef.current
    if (!v || !v.duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration
  }

  return (
    <div className={`media-item ${className}`}>
      <div className="relative w-full cursor-pointer md:aspect-[3/2]" onClick={() => setOpen(true)}>
        <div className="bg-black md:absolute md:inset-0">
          {isVideo(media) ? (
            <LazyVideo
              className="h-auto w-full cursor-pointer object-cover md:h-full"
              src={videoSrc(media)}
              poster={media.video?.thumbnailUrl}
              autoPlay
              muted
              loop
              playsInline
              preload="none"
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              className="h-auto w-full object-cover md:h-full"
              src={media.url}
              alt={media.alt ?? ''}
              loading="lazy"
            />
          )}
        </div>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center bg-black/90"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <div className="relative w-full focus:outline-none md:aspect-[3/2]">
            {isVideo(media) ? (
              <>
                <video
                  ref={lightboxVideoRef}
                  className="h-auto w-full object-contain md:h-full"
                  src={videoSrc(media)}
                  poster={media.video?.thumbnailUrl}
                  autoPlay
                  loop
                  playsInline
                  controls={false}
                  onTimeUpdate={(e) => {
                    const v = e.currentTarget
                    setProgress(v.duration ? v.currentTime / v.duration : 0)
                  }}
                  onClick={(e) => {
                    const v = e.currentTarget
                    if (v.paused) v.play()
                    else v.pause()
                  }}
                />
                <div className="pointer-events-none absolute inset-0 flex flex-col justify-end transition-opacity duration-300">
                  <div className="pointer-events-auto mx-auto flex w-full max-w-controls-max-w items-center justify-between gap-gap-md px-controls-px pb-[2%]">
                    <div className="relative flex-1 cursor-pointer py-2" onClick={scrub}>
                      <div className="h-[2px] w-full bg-white/30" />
                      <div
                        className="absolute top-1/2 left-0 h-[2px] -translate-y-1/2 bg-white"
                        style={{ width: `${progress * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                className="h-auto max-h-[90vh] w-full object-contain"
                src={media.url}
                alt={media.alt ?? ''}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
