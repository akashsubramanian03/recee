import { useEffect, useRef, useState } from 'react'
import { getPanels } from '../api.js'
import { PHOTOS, ICONS, rowColumns, ROW_HEIGHTS } from '../registry.js'

/**
 * The bento mosaic — now driven by whichever section the nav has selected.
 *
 * Four rows, two panels each, fetched from the API. The row is a real element
 * rather than a band of one tall grid because the reference uses TWO different
 * column splits (54.8/43.2 and 40.9/56.7), and a shared track set cannot
 * express both: every internal gutter inside a spanning panel counts toward
 * its width, which drags the measured split toward square.
 *
 * The mosaic reads as irregular because the split alternates AND swaps side
 * between rows, and because the row heights are unequal. Both live in
 * registry.js — they are layout, so they stay on the client while the copy
 * comes from Postgres.
 *
 * `flipped` mirrors every row end for end. It is owned by App and toggles on
 * each move, so the arrangement is relative to where you came from rather than
 * fixed per section — the page visibly rearranges on every tab change instead
 * of only when you happen to land on an odd-numbered one.
 *
 * The column widths follow the content rather than the flag: `rowColumns` is
 * told which side the photo ended up on, so the picture keeps the wider column
 * in either orientation instead of leaving a wide text panel beside a squeezed
 * image.
 */

function PhotoPanel({ photoKey, alt }) {
  return (
    <figure className="panel panel--photo bento__cell">
      <img className="bento__img" src={PHOTOS[photoKey]} alt={alt} draggable="false" />
    </figure>
  )
}

function TextPanel({ iconKey, title, lines }) {
  const Icon = ICONS[iconKey] ?? ICONS.sparkle
  return (
    <article className="panel bento__cell bento__text">
      {/* The badge is the accessible boundary, not the svg: the icon repeats
          what the heading beside it already says. */}
      <span className="gel-badge gel-badge--pale bento__badge" aria-hidden="true">
        <Icon width="20" height="20" />
      </span>
      <h2 className="bento__title">{title}</h2>
      <p className="bento__body">
        {lines.map((line, i) => (
          <span key={line}>
            {line}
            {i < lines.length - 1 && <br />}
          </span>
        ))}
      </p>
    </article>
  )
}

export default function BentoGrid({ section, flipped = false }) {
  const [rows, setRows] = useState(null)
  const [error, setError] = useState(null)
  /* Keeps the OLD rows on screen while the new ones load. Emptying the grid
     between tabs would collapse four panels to nothing and back on a page that
     is not allowed to scroll — the layout would jump every click. */
  const shown = useRef(null)

  useEffect(() => {
    let cancelled = false
    setError(null)
    getPanels(section)
      .then((data) => { if (!cancelled) setRows(data.rows) })
      .catch((err) => { if (!cancelled) setError(err.message) })
    return () => { cancelled = true }
  }, [section])

  if (rows) shown.current = rows
  const visible = rows ?? shown.current

  if (!visible) {
    return (
      <div className="bento bento--placeholder" aria-busy={!error}>
        {/* Four empty rows so the grid occupies its real height from the first
            paint. Without them the hero column would resize once the fetch
            lands. */}
        {ROW_HEIGHTS.map((_, i) => (
          <div key={i} className="bento__row" style={{ gridTemplateColumns: rowColumns(i, true) }}>
            <div className="panel bento__cell" />
            <div className="panel bento__cell" />
          </div>
        ))}
        {error && <p className="bento__error" role="alert">{error}</p>}
      </div>
    )
  }

  return (
    <div
      className="bento"
      style={{ gridTemplateRows: ROW_HEIGHTS.map((h) => `${h}fr`).join(' ') }}
    >
      {visible.map(({ row, cells }, i) => {
        const ordered = flipped ? [...cells].reverse() : cells
        return (
          <div
            key={row}
            className="bento__row"
            style={{ gridTemplateColumns: rowColumns(i, ordered[0]?.kind === 'photo') }}
          >
            {ordered.map((c) =>
              c.kind === 'photo'
                ? <PhotoPanel key={c.side} {...c} />
                : <TextPanel key={c.side} {...c} />,
            )}
          </div>
        )
      })}
    </div>
  )
}
