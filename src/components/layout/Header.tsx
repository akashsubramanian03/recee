'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { gsap, ScrollTrigger } from '@/lib/gsap'
import { Wordmark, MenuIcon } from '@/components/icons'
import { navigation } from '@/data'
import { useUIStore } from '@/stores/useUIStore'
import { scrollToElement } from '@/lib/lenis'

/**
 * Fixed header. Its colour is driven by scroll: black over the white hero, white
 * once the portal has opened onto the black mosaic. The original animates the
 * `color` property on the <header> and lets currentColor carry it into the SVGs.
 */
export function Header() {
  const headerRef = useRef<HTMLElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const openContact = useUIStore((s) => s.openContact)
  const setMobileMenu = useUIStore((s) => s.setMobileMenu)
  const isHome = usePathname() === '/'
  const router = useRouter()

  useEffect(() => {
    const header = headerRef.current
    if (!header) return

    // Only the homepage starts on a white ground. Project pages open on a dark
    // full-bleed hero, so the header is white from the first frame.
    if (!isHome) {
      header.style.color = '#ffffff'
      return
    }

    header.style.color = '#000000'
    const ctx = gsap.context(() => {
      // Cross the fold -> invert. Scrubbed so it tracks the portal opening rather
      // than snapping at a threshold.
      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: () => `+=${window.innerHeight * 0.85}`,
        scrub: true,
        onUpdate: (self) => {
          const v = Math.round(255 * self.progress)
          header.style.color = `rgb(${v}, ${v}, ${v})`
        },
      })
    })
    return () => ctx.revert()
  }, [isHome])

  const toggleMenu = () => {
    const next = !menuOpen
    setMenuOpen(next)
    setMobileMenu(next)
  }

  const onNavClick = (url: string) => {
    if (url === '#contact') {
      openContact()
      return
    }
    // The nav anchors only exist on the homepage; from a project page, go there.
    if (!isHome) {
      router.push(`/${url}`)
      return
    }
    const target = document.querySelector(url)
    if (target) scrollToElement(target)
  }

  return (
    <header
      ref={headerRef}
      className="fixed top-0 right-0 left-0 z-50 flex items-center justify-between bg-transparent p-grid-margin pt-header-pad-top"
      style={{ color: '#000000' }}
    >
      <Link href="/" className="block w-header-logo-w transition-opacity duration-500">
        <span className="sr-only">Kaset — Home</span>
        <Wordmark className="block h-auto w-full" />
      </Link>

      <nav className="hidden transition-opacity duration-500 md:block">
        <ul className="flex items-center gap-header-nav-gap">
          {navigation.headerNavigation.map((item) => (
            <li key={item.title}>
              <button
                type="button"
                className="text-nav cursor-pointer"
                onClick={() => onNavClick(item.url)}
              >
                {item.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      <button
        type="button"
        onClick={toggleMenu}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        className="text-menu flex items-center gap-gap-sm transition-opacity duration-500 md:hidden"
      >
        <MenuIcon
          className={`block h-auto w-header-menu-icon transition-transform duration-300 ease-out ${
            menuOpen ? 'rotate-45' : 'rotate-0'
          }`}
        />
      </button>
    </header>
  )
}
