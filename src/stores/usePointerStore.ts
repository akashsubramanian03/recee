import { create } from 'zustand'

/**
 * Pointer position in normalised device coordinates (-1..1 on both axes),
 * plus the raw client position the hero's fluid mouse-trail FBO needs.
 *
 * Read via getState() inside useFrame — never subscribe, this updates every
 * mousemove.
 */
type PointerState = {
  ndcX: number
  ndcY: number
  clientX: number
  clientY: number
  /** False until the pointer has moved at least once (avoids a trail at 0,0). */
  hasMoved: boolean
  set: (v: Partial<PointerState>) => void
}

export const usePointerStore = create<PointerState>((set) => ({
  ndcX: 0,
  ndcY: 0,
  clientX: 0,
  clientY: 0,
  hasMoved: false,
  set: (v) => set(v),
}))
