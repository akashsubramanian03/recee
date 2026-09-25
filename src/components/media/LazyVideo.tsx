'use client'

import { useEffect, useRef, useState } from 'react'

type Props = Omit<React.VideoHTMLAttributes<HTMLVideoElement>, 'src'> & {
  src: string
  /** Skip the gating for a video that is the page — a full-bleed project hero. */
  alwaysPlay?: boolean
}

/**
 * A `<video>` that only fetches and decodes while it is near the viewport.
 *
 * The homepage holds 17 video elements. Left to themselves the browser decodes eight of
 * them at once — every project cover, every carousel clip — including the ones several
 * screens away. The reference site keeps three going. Since these are the mirrored Mux
 * masters (1080p+) being drawn into tiles a few hundred pixels wide, that is real GPU
 * work spent on nothing.
 *
 * `src` is withheld until first intersection so nothing is even fetched, then playback
 * follows visibility. `poster` should always be set by the caller — the Mux thumbnails
 * are mirrored — so a tile scrolled into view fast shows a still, never a black box.
 */
export function LazyVideo({ src, alwaysPlay = false, ...rest }: Props) {
  const ref = useRef<HTMLVideoElement>(null)
  const [source, setSource] = useState<string | undefined>(alwaysPlay ? src : undefined)
  const isVisible = useRef(alwaysPlay)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (alwaysPlay) {
      setSource(src)
      return
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisible.current = entry.isIntersecting
        if (entry.isIntersecting) {
          setSource(src)
          // Call play() unconditionally: with preload="none" the element never
          // reaches readyState 2 on its own, and autoplay won't start a load either.
          // play() is what actually kicks off fetching. Rejections are expected here
          // (no source attached yet on the very first pass) and harmless — the effect
          // below picks it up once React has set src.
          void el.play().catch(() => {})
        } else if (!el.paused) {
          el.pause()
        }
      },
      { rootMargin: '200px 0px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [src, alwaysPlay])

  // Start playback once the source is attached, if we are still in view.
  useEffect(() => {
    const el = ref.current
    if (!el || !source) return
    if (alwaysPlay || isVisible.current) void el.play().catch(() => {})
  }, [source, alwaysPlay])

  return <video ref={ref} src={source} {...rest} />
}
