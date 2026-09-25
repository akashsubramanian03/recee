'use client'

import { useEffect } from 'react'
import { usePointerStore } from '@/stores/usePointerStore'

/**
 * Feeds pointer position into the zustand store in NDC space.
 *
 * Deliberately writes straight to the store (not React state) — this fires on
 * every mousemove and is read inside useFrame.
 */
export function PointerProvider() {
  useEffect(() => {
    const set = usePointerStore.getState().set

    const onMove = (e: PointerEvent) => {
      set({
        ndcX: (e.clientX / window.innerWidth) * 2 - 1,
        ndcY: -((e.clientY / window.innerHeight) * 2 - 1),
        clientX: e.clientX,
        clientY: e.clientY,
        hasMoved: true,
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => window.removeEventListener('pointermove', onMove)
  }, [])

  return null
}
