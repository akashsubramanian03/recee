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

      {/* Same Aqua gel as the primary button, one size down. It reads as a
          utility affordance rather than a third CTA because it is small and
          sits outside the composition — the two buttons in the centre column
          are the actual decision. Reuses .gloss rather than restating the
          gradient, so the two pills cannot drift apart. */}
      <a className="nav__cta gloss gloss--sm" href="#join">
        Join Now
      </a>
    </header>
  )
}
