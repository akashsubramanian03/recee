export default function Navbar() {
  return (
    <header className="nav">
      <a className="nav__logo" href="#top">
        recee
      </a>

      <nav className="nav__nav" aria-label="Primary">
        <ul className="nav__links">
          <li><a href="#shows">Shows</a></li>
          <li><a href="#podcast">Podcast</a></li>
          <li><a href="#community">Community</a></li>
        </ul>
      </nav>

      {/* Text link rather than a third glossy pill — the gloss belongs to
          the two buttons inside the composition. */}
      <a className="nav__cta" href="#join">
        Join Now
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true">
          <path d="M1 1l5 5-5 5" stroke="currentColor" strokeWidth="1.6"
                strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </a>
    </header>
  )
}
