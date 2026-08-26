import { Router } from 'express'
import { query } from '../db.js'

export const sections = Router()

/* GET /api/sections — the nav's tabs, in order. `home` is excluded because it
   is the set the page opens on rather than a destination you can click to. */
sections.get('/', async (_req, res, next) => {
  try {
    const { rows } = await query(
      `select slug, label from sections where in_nav order by position`,
    )
    res.json({ sections: rows })
  } catch (err) { next(err) }
})

/* GET /api/sections/:slug/panels — the eight cells of one set, already grouped
   into the four rows the grid draws.
 *
 * The grouping happens HERE rather than in the client because the row/side
 * shape is a property of the data, and every consumer would otherwise have to
 * rebuild it. What stays on the client is the column ratio per row, which is
 * layout, not content.
 */
sections.get('/:slug/panels', async (req, res, next) => {
  try {
    const { rows } = await query(
      `select p.row_index, p.side, p.kind, p.icon_key, p.title,
              p.body_lines, p.photo_key, p.alt
         from panels p
         join sections s on s.id = p.section_id
        where s.slug = $1
        order by p.row_index, (p.side = 'right')`,
      [req.params.slug],
    )
    if (rows.length === 0) {
      return res.status(404).json({ error: `No section "${req.params.slug}"` })
    }

    const byRow = new Map()
    for (const r of rows) {
      const cell = r.kind === 'photo'
        ? { kind: 'photo', side: r.side, photoKey: r.photo_key, alt: r.alt }
        : { kind: 'text', side: r.side, iconKey: r.icon_key, title: r.title, lines: r.body_lines }
      if (!byRow.has(r.row_index)) byRow.set(r.row_index, [])
      byRow.get(r.row_index).push(cell)
    }

    res.json({
      slug: req.params.slug,
      rows: [...byRow.entries()]
        .sort((a, b) => a[0] - b[0])
        .map(([row, cells]) => ({ row, cells })),
    })
  } catch (err) { next(err) }
})
