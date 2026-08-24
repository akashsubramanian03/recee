import Wordmark from './Wordmark.jsx'
import Hands from './Hands.jsx'
import GlossyButton from './GlossyButton.jsx'

const PeopleIcon = () => (
  <svg width="17" height="17" viewBox="0 0 20 20" fill="none" aria-hidden="true">
    <circle cx="7.5" cy="6" r="2.6" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M2.6 15.4c0-2.5 2.2-4.2 4.9-4.2s4.9 1.7 4.9 4.2"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M13.6 4.1a2.6 2.6 0 0 1 0 5M14.6 11.5c2.1.3 3.6 1.9 3.6 3.9"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
)

/**
 * One non-scrolling viewport. The artwork is an absolutely-positioned layer;
 * the copy sits on a 12-column grid over it.
 *
 * The viewport divides into four bands that cannot overlap: the reaching
 * action, the wordmark, the centre column, and the footer. The wordmark and
 * all three text blocks are items on one 12-column grid, so their alignment
 * and separation are structural rather than tuned.
 *
 * The gap between the lens and the reaching fingertip is the focal point and
 * is deliberately left empty — nothing is placed in it.
 *
 * There is exactly one primary call to action. The nav keeps a persistent
 * "Join Now" link, which is a conventional utility affordance rather than a
 * competing CTA; the mid-hero pill is gone, which also clears the letterforms
 * it used to sit on top of.
 */
export default function Hero() {
  return (
    <section className="stage" id="top">
      {/* Arms only. This layer is fixed to the VIEWPORT, not to the stage
          row — scoped to the stage it clipped at the nav boundary, which is
          why the arms appeared to end in mid-air no matter how they were
          offset. */}
      <div className="stage__art" aria-hidden="true">
        <Hands />
      </div>

      <div className="stage__grid">
        {/* The wordmark is a grid item, not an absolutely-positioned layer:
            that is what centres it on the same columns as everything else
            and puts a real row-gap between it and the headline. Overlap
            becomes impossible rather than merely tuned away. */}
        <Wordmark />

        <aside className="aside aside--left">
          <p className="aside__lead">
            Discover films
            <br />
            that stay with you.
          </p>
          <p className="aside__tags">curated . conversations . connections</p>
        </aside>

        <div className="flow">
          <h1 className="flow__headline">Celebrate Cinema</h1>
          <p className="flow__sub">
            Recee is where film lovers discover, discuss and create together.
            Be part of the story.
          </p>

          <GlossyButton size="lg" className="flow__cta">
            Join the Club
          </GlossyButton>

          <p className="flow__note">
            <PeopleIcon />
            <span>A community for film lovers, by film lovers.</span>
          </p>
        </div>

        <aside className="aside aside--right">
          <p className="aside__lead">
            Create moments
            <br />
            that last forever.
          </p>
          <p className="aside__tags">screen . shoot . share . celebrate</p>
        </aside>
      </div>
    </section>
  )
}
