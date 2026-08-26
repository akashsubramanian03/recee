import GlossyButton from './GlossyButton.jsx'
import JoinForm from './JoinForm.jsx'
import { IconArrow } from './Icons.jsx'

/**
 * The left column — one tall Aqua panel holding the whole pitch.
 *
 * Made of the same material as every bento cell — on desktop the panel is the
 * wrapper around this and the meta row together, on mobile it is this element
 * itself. See .hero-col in hero.css for why that swap exists.
 *
 * The stack runs chip → headline → body → call to action. Below 900px a
 * photograph joins it, bled against the panel's right edge.
 *
 * When `joining` is set the whole pitch is replaced by the signup form in the
 * SAME panel — not a modal. The page cannot scroll, and a dialog over a locked
 * viewport is a surface that might not fit; the form instead reuses room the
 * layout already reserves.
 *
 * The headline is `.lift`, not `.engrave`. Everything else on this page is cut
 * INTO the metal; the headline stands proud of it, which is what gives the
 * column a focal point on a surface where every other element is flush.
 */
export default function Hero({ joining, onJoin, onCancelJoin }) {
  return (
    <section className="panel hero" id="top">
      {joining ? (
        <JoinForm onCancel={onCancelJoin} />
      ) : (
        <>
      <p className="chip hero__chip">Film Club</p>

      {/* Two deliberate lines, so the break is typographic rather than a
          consequence of the column width. */}
      <h1 className="hero__headline lift">
        For Every
        <br />
        Film Lover.
      </h1>

      <p className="hero__body">
        Recce is a community for anyone
        <br />
        who loves cinema.
        <br />
        Join us. Be part of something real.
      </p>

      {/* A bare arrow beside the label, not a badge around it. It goes through
          the button's `icon` slot — which GlossyButton renders ahead of the
          text — and `.gloss--arrow` orders it to the trailing edge. */}
      <GlossyButton
        size="lg"
        onClick={onJoin}
        className="gloss--arrow hero__cta"
        icon={
          <IconArrow
            className="gloss__arrow"
            width="22"
            height="22"
            aria-hidden="true"
          />
        }
      >
        Join Recce
      </GlossyButton>
        </>
      )}
    </section>
  )
}
