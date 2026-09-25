import type Lenis from 'lenis'

/**
 * Module-scoped handle on the running Lenis instance.
 *
 * Kept here rather than on `window` because the lenis package already declares a
 * global of that name for its CDN build, and the two types conflict.
 */
let instance: Lenis | null = null

export const setLenis = (l: Lenis | null) => {
  instance = l
}

export const getLenis = () => instance

/** Stop/start smooth scrolling — used by the contact modal and mobile menu. */
export function setScrollLocked(locked: boolean) {
  if (!instance) return
  if (locked) instance.stop()
  else instance.start()
}

/** Smooth-scroll to an element, falling back to native behaviour before hydration. */
export function scrollToElement(target: Element) {
  if (instance) instance.scrollTo(target as HTMLElement)
  else target.scrollIntoView({ behavior: 'smooth' })
}
