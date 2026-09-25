'use client'

import { useEffect } from 'react'
import { useUIStore } from '@/stores/useUIStore'
import { setScrollLocked, scrollToElement } from '@/lib/lenis'
import { navigation } from '@/data'

/**
 * Full-screen black menu, right-aligned. Type is sized in vh rather than the usual
 * tokens (7.5vh / 2.35vh) so it fills the sheet on any phone.
 */
export function MobileMenu() {
  const open = useUIStore((s) => s.mobileMenuOpen)
  const setMobileMenu = useUIStore((s) => s.setMobileMenu)
  const openContact = useUIStore((s) => s.openContact)

  useEffect(() => {
    setScrollLocked(open)
  }, [open])

  const onItem = (url: string) => {
    setMobileMenu(false)
    if (url === '#contact') {
      openContact()
      return
    }
    const target = document.querySelector(url)
    if (target) scrollToElement(target)
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-end justify-center bg-black px-grid-margin text-white transition-opacity duration-300 ease-out md:hidden ${
        open ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'
      }`}
      aria-hidden={!open}
    >
      <ul className="text-right">
        {navigation.headerNavigation.map((item) => (
          <li key={item.title}>
            <button
              type="button"
              className="text-display cursor-pointer"
              style={{ fontSize: '7.5vh' }}
              onClick={() => onItem(item.url)}
            >
              {item.title}
            </button>
          </li>
        ))}
      </ul>

      <ul className="absolute right-grid-margin bottom-[12px] text-right">
        {[navigation.contactSocialInstagram, navigation.contactSocialVimeo]
          .filter((s) => s?.url)
          .map((social) => (
            <li key={social.title}>
              <a
                href={social.url}
                target="_blank"
                rel="noreferrer"
                className="text-menu"
                style={{ fontSize: '2.35vh' }}
              >
                {social.title}
              </a>
            </li>
          ))}
      </ul>
    </div>
  )
}
