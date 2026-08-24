/**
 * RECCE — set in Big Shoulders Display 900.
 *
 * Sized by CAP HEIGHT, not by box. `font-size` is solved so the caps measure
 * 47.2vh — the reference's figure — and the string is then allowed to run to
 * its natural width (~89vw) rather than being forced into the reference's
 * 40vw block. Hitting that block needs a 0.46 horizontal scale, which halves
 * the vertical stems while leaving the horizontal bars at full thickness; the
 * reference's stems and bars are near-equal (36px against 42px), so the
 * squeeze would read as a distorted font rather than as a condensed one.
 * The width difference is a deliberate, accepted trade.
 *
 * A <div>, not an <h1>: "Celebrate Cinema" holds the page's only h1, so this
 * carries role="img" and an aria-label instead of competing for the outline.
 *
 * Spelling follows the reference, which reads R-E-C-C-E. The nav logo and the
 * footer keep "Recee".
 */
export default function Wordmark() {
  return (
    <div className="wordmark" role="img" aria-label="Recce">
      RECCE
    </div>
  )
}
