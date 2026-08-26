import { IconCamera, IconInstagram, IconTwitter, IconGoogle } from './Icons.jsx'

/**
 * The hero panel's meta row.
 *
 * This is the page's footer in the sense that it closes the composition, but
 * it is NOT a page-level element any more: the layout has no full-width footer
 * band, so this sits inside the hero panel and `.page` is two grid rows rather
 * than three.
 *
 * The divider above it is a hairline rather than the pinstriped seam used
 * elsewhere — inside a panel a woven seam reads as the panel being two joined
 * pieces of metal, which is wrong for what is really just a rule.
 */
const SOCIALS = [
  { label: 'Recce on Instagram', href: '#instagram', Icon: IconInstagram },
  { label: 'Recce on Twitter', href: '#twitter', Icon: IconTwitter },
  { label: 'Recce on Google', href: '#google', Icon: IconGoogle },
]

export default function HeroMeta() {
  return (
    <div className="meta">
      <span className="gel-badge gel-badge--pale meta__badge" aria-hidden="true">
        <IconCamera width="20" height="20" />
      </span>

      <p className="meta__tagline">
        One passion. Many stories.
        <br />
        All are welcome.
      </p>

      <span className="meta__follow">Follow us</span>

      <ul className="meta__socials">
        {SOCIALS.map(({ label, href, Icon }) => (
          <li key={href}>
            {/* The badge IS the link, so the whole 34px circle is the target
                rather than just the glyph inside it. */}
            <a className="gel-badge gel-badge--pale meta__social" href={href} aria-label={label}>
              <Icon width="15" height="15" aria-hidden="true" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}
