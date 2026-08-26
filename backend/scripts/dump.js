/**
 * Prints everything in the database.
 *
 *   npm run db:view            everything
 *   npm run db:view members    one table
 *
 * Read-only. It exists because `psql` needs the right host, user and database
 * remembered every time, and because seeing the content and the shape together
 * is usually what you actually want.
 */
import { pool } from '../src/db.js'

const only = process.argv[2]
const TABLES = ['sections', 'panels', 'members']

/* Long values are truncated for the table view — a body_lines array or a
   400-character film title would otherwise wrap and destroy the columns. */
const cell = (v) => {
  if (v === null || v === undefined) return '·'
  if (Array.isArray(v)) return v.join(' / ')
  if (v instanceof Date) return v.toISOString().slice(0, 16).replace('T', ' ')
  const s = String(v)
  return s.length > 34 ? `${s.slice(0, 33)}…` : s
}

function table(rows) {
  if (!rows.length) return '   (empty)'
  const cols = Object.keys(rows[0])
  const cells = rows.map((r) => cols.map((c) => cell(r[c])))
  const width = cols.map((c, i) =>
    Math.max(c.length, ...cells.map((row) => row[i].length)))
  const line = (parts) => '   ' + parts.map((p, i) => p.padEnd(width[i])).join('  ')
  return [
    line(cols),
    '   ' + width.map((w) => '─'.repeat(w)).join('  '),
    ...cells.map(line),
  ].join('\n')
}

try {
  for (const name of TABLES) {
    if (only && only !== name) continue
    const { rows } = await pool.query(`select * from ${name} order by id`)
    console.log(`\n━━ ${name} (${rows.length}) ${'━'.repeat(Math.max(0, 52 - name.length))}`)
    console.log(table(rows))
  }

  if (!only) {
    const { rows } = await pool.query(
      `select s.label, count(p.id)::int as panels
         from sections s left join panels p on p.section_id = s.id
        group by s.id, s.label, s.position order by s.position`)
    console.log(`\n━━ summary ${'━'.repeat(48)}`)
    console.log(table(rows))
  }
} finally {
  await pool.end()
}
