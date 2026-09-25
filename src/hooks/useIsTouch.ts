'use client'

import { useEffect, useState } from 'react'

/**
 * Touch/coarse-pointer detection.
 *
 * The shaders branch on this: touch devices get a much weaker barrel distortion
 * (25 vs 100 on the mosaic, 1.5 vs 6 on the hero) and skip the fluid mouse trail
 * entirely, matching the original.
 */
export function useIsTouch() {
  const [isTouch, setIsTouch] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(hover: none), (pointer: coarse)')
    const update = () => setIsTouch(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  return isTouch
}

/** Non-reactive read, for use inside useFrame where a re-render is not wanted. */
export function isTouchDevice() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(hover: none), (pointer: coarse)').matches
}
