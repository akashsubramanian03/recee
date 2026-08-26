import { useEffect, useState } from 'react'
import { getSections } from '../api.js'

/**
 * The Unified toolbar — an inset floating bar rather than a full-bleed band,
 * so the brushed metal reads as a physical object lying ON the desktop with
 * the aluminium visible around all four of its edges.
 *
 * `.chrome` (aqua.css) supplies the material; `.nav` (global.css) owns only
 * where things sit on it.
 *
 * ONE segmented control serves both layouts. It used to be hidden below 900px
 * with the three destinations moved into a hamburger sheet; the bar now carries
 * them directly at every width, and the burger — along with its outside-click
 * and Escape handling — is gone rather than left rendering nothing.
 */

/* Rendered until the API answers, so the toolbar never starts as an empty
   frame and then pops three tabs into place. The labels match the seed, and
   the fetch replaces them with whatever the database actually holds. */
const FALLBACK = [
  { slug: 'about', label: 'About' },
  { slug: 'what-we-do', label: 'What We Do' },
  { slug: 'meetups', label: 'Meetups' },
]

export default function Navbar({ section, onSelectSection, onJoin }) {
  const [links, setLinks] = useState(FALLBACK)

  useEffect(() => {
    let cancelled = false
    getSections()
      .then((d) => { if (!cancelled && d.sections?.length) setLinks(d.sections) })
      .catch(() => { /* keep FALLBACK — a dead API should not empty the nav */ })
    return () => { cancelled = true }
  }, [])

  return (
    <header className="nav chrome">
      {/* Engraved: an Aqua toolbar label is cut into the metal, and flat
          black type on a brushed surface reads as a sticker laid on top.
          It is also the way back to the landing view — on mobile, where a
          section fills the whole page, it is the ONLY way back. */}
      <a
        className="nav__logo engrave"
        href="#top"
        onClick={() => onSelectSection('home')}
      >
        recce
      </a>

      <nav className="nav__nav" aria-label="Primary">
        {/* One segmented control, not three links. The <ul> carries the outer
            radius and the border; each item draws only its own fill, so the
            seams between them read as grooves in a single object. */}
        <ul className="nav__links segmented">
          {links.map(({ slug, label }) => (
            <li key={slug}>
              {/* A button, not a link: it swaps content in place rather than
                  navigating. aria-current is what tells a screen reader which
                  set is showing — the blue fill only says it visually. */}
              <button
                type="button"
                className="segmented__item"
                aria-current={section === slug ? 'true' : undefined}
                onClick={() => onSelectSection(slug)}
              >
                {label}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Desktop only. On mobile the bar gives its width to the three tabs
          instead, and the hero's own button is the way in. */}
      <button type="button" className="nav__cta gloss gloss--sm" onClick={onJoin}>
        Join Recce
      </button>
    </header>
  )
}
