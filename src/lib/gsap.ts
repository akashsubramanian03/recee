'use client'

import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { Draggable } from 'gsap/Draggable'
import { InertiaPlugin } from 'gsap/InertiaPlugin'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger, SplitText, Draggable, InertiaPlugin)
  // Lenis drives the ticker; lag smoothing would fight it.
  gsap.ticker.lagSmoothing(0)
}

export { gsap, ScrollTrigger, SplitText, Draggable, InertiaPlugin }
