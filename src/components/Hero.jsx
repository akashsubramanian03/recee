import Wordmark from './Wordmark.jsx'
import Hands from './Hands.jsx'
import GlossyButton from './GlossyButton.jsx'

/**
 * One non-scrolling viewport. The artwork is an absolutely-positioned layer;
 * the copy sits on a 12-column grid over it.
 *
 * The viewport divides into four bands that cannot overlap: the reaching
 * action, the wordmark, the centre column, and the footer. The wordmark and
 * all three text blocks are items on one 12-column grid, so their alignment
 * and separation are structural rather than tuned.
 *
 * The arms now cross the wordmark rather than sitting above it — the lens
 * overlaps the R, which is what the reference does. That works only because
 * the arms are z-index 2 and the wordmark z-index 1, ordered against each
 * other in the shared ancestor context.
 *
 * Two calls to action, stacked and equal-width: the screening is the primary
 * decision, the podcast the secondary one. The nav keeps a persistent "Join
 * Now" pill, which is a utility affordance rather than a third competing CTA.
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
          <p className="aside__lines">
            watch
            <br />
            together
            <br />
            grow together
          </p>
        </aside>

        <div className="flow">
          <h1 className="flow__headline">Celebrate Cinema</h1>
          <p className="flow__sub">Discover together. Discuss forever.</p>

          {/* Equal-width and stacked, so the pair reads as one decision with
              a default rather than as two competing buttons side by side. */}
          <div className="flow__ctas">
            <GlossyButton size="lg">join the next screening</GlossyButton>
            <button type="button" className="ghost">
              listen to the podcast
            </button>
          </div>

          <p className="flow__note">
            free to join <span className="flow__dot">·</span> new screening
            every week
          </p>
        </div>

        <aside className="aside aside--right">
          <p className="aside__lines">
            good films
            <br />
            great people
            <br />
            real conversations
          </p>
        </aside>
      </div>
    </section>
  )
}
