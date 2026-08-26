/**
 * The line icons, as inline SVG.
 *
 * Inline rather than a sprite sheet or an icon font for one reason: these sit
 * inside `.gel-badge`, whose blue comes from the badge's own `color`. Inline
 * paths inherit `currentColor`, so a badge and its icon can never disagree
 * about the accent — and recolouring one badge is a colour change on the
 * badge, with nothing to plumb through to the icon.
 *
 * All of them are drawn on the same 24-unit grid with the same 2-unit stroke,
 * round caps and round joins, so they read as one family at badge size. None
 * carries a title or role: every icon on this page sits beside a text label
 * that already names it, so they are decorative and stay out of the
 * accessibility tree via aria-hidden on the badge wrapper.
 */

const base = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

/* Four-point sparkle — the "discussion / insight" mark. */
export function IconSparkle(props) {
  return (
    <svg {...base} {...props}>
      <path d="M12 3v18M3 12h18" />
      <path d="M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" opacity="0.55" />
    </svg>
  )
}

/* Two figures — "different perspectives". */
export function IconPeople(props) {
  return (
    <svg {...base} {...props}>
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3.5 19.5a5.5 5.5 0 0 1 11 0" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15 19.5a5 5 0 0 1 5.5-4.9" />
    </svg>
  )
}

/* Clapperboard — "make films". The slate's diagonal stripes are what make it
   read as a clapper rather than as a folder, so the top bar is a plain
   rectangle carrying three strong diagonals: a slanted, hinged bar is more
   accurate but collapses into mush at 20px. */
export function IconClapper(props) {
  return (
    <svg {...base} {...props}>
      <path d="M3 9.8h18v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 4.2h18v5.6H3z" />
      <path d="M8 4.2L6 9.8M13.2 4.2l-2 5.6M18.4 4.2l-2 5.6" />
    </svg>
  )
}

/* Calendar — "events & workshops". */
export function IconCalendar(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3" y="5.5" width="18" height="15.5" rx="2" />
      <path d="M3 10.5h18M8 3.2v4.6M16 3.2v4.6" />
    </svg>
  )
}

/* Arrow in the hero button's trailing badge. */
export function IconArrow(props) {
  return (
    <svg {...base} {...props}>
      <path d="M5 12h13M12.5 6l6 6-6 6" />
    </svg>
  )
}

/* Movie camera — the hero panel's meta row. */
export function IconCamera(props) {
  return (
    <svg {...base} {...props}>
      <rect x="2.5" y="8.5" width="13" height="10" rx="2" />
      <path d="M15.5 12.4l6-3.1v9.4l-6-3.1z" />
      <circle cx="6.2" cy="5.4" r="2.4" />
      <circle cx="11.8" cy="5.4" r="2.4" />
    </svg>
  )
}

/* ---- social marks ---- */

export function IconInstagram(props) {
  return (
    <svg {...base} {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="4.6" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function IconTwitter(props) {
  return (
    <svg {...base} {...props}>
      <path d="M21 5.6a7.4 7.4 0 0 1-2.2.7 3.7 3.7 0 0 0 1.7-2 7.6 7.6 0 0 1-2.4.95 3.75 3.75 0 0 0-6.4 3.4A10.7 10.7 0 0 1 4 4.8a3.75 3.75 0 0 0 1.16 5 3.7 3.7 0 0 1-1.7-.47v.05a3.75 3.75 0 0 0 3 3.68 3.8 3.8 0 0 1-1.7.06 3.75 3.75 0 0 0 3.5 2.6A7.5 7.5 0 0 1 3 17.3a10.6 10.6 0 0 0 5.7 1.67c6.9 0 10.65-5.7 10.65-10.65v-.5A7.5 7.5 0 0 0 21 5.6z" />
    </svg>
  )
}

/* Google's G, drawn as a stroked arc with the crossbar rather than the
   four-colour logotype — a flat brand mark would be the only thing on the page
   not made of the same line weight as everything else. */
export function IconGoogle(props) {
  return (
    <svg {...base} {...props}>
      <path d="M20.4 12.2a8.4 8.4 0 1 1-2.5-6" />
      <path d="M20.6 12.2h-7.4" />
    </svg>
  )
}
