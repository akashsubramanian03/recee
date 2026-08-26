/**
 * Deletes every member except the most recently added one.
 *
 *   npm run db:prune            delete them
 *   npm run db:prune -- --dry   show what would go, delete nothing
 *
 * Only touches `members`. `sections` and `panels` are seeded content, not data
 * anyone entered, and `npm run db:reset` is what rebuilds those.
 *
 * Afterwards it tries to VALIDATE the three constraints that 003 added as NOT
 * VALID. They were left unvalidated because rows predating mobile/age/
 * first_love_film held NULLs and would have blocked them; once those rows are
 * gone the constraints can cover the whole table, and Postgres will refuse if
 * anything still violates them — so this can never mask bad data.
 */
import { pool } from '../src/db.js'

const dry = process.argv.includes('--dry')
const CONSTRAINTS = [
  'members_mobile_required',
  'members_age_required',
  'members_first_love_required',
]

const client = await pool.connect()
try {
  /* max(id) rather than a date sort: id is the serial primary key, so it is
     unique and monotonic, where two rows can share a created_at timestamp and
     "the last one" would then be ambiguous. */
  const { rows: doomed } = await client.query(
    `select id, name, email from members
      where id <> (select max(id) from members)
      order by id`,
  )
  const { rows: [keep] } = await client.query(
    `select id, name, email from members where id = (select max(id) from members)`,
  )

  if (!keep) {
    console.log('[prune] members is empty — nothing to do')
  } else if (doomed.length === 0) {
    console.log(`[prune] only one member (#${keep.id} ${keep.email}) — nothing to delete`)
  } else {
    console.log(`[prune] keeping  #${keep.id}  ${keep.name} <${keep.email}>`)
    for (const m of doomed) console.log(`[prune] ${dry ? 'would delete' : 'deleting'} #${m.id}  ${m.name} <${m.email}>`)

    if (dry) {
      console.log(`[prune] --dry: nothing was deleted (${doomed.length} rows matched)`)
    } else {
      const { rowCount } = await client.query(
        'delete from members where id <> (select max(id) from members)')
      console.log(`[prune] deleted ${rowCount} row(s)`)
    }
  }

  if (!dry) {
    for (const name of CONSTRAINTS) {
      try {
        await client.query(`alter table members validate constraint ${name}`)
        console.log(`[prune] validated ${name}`)
      } catch (err) {
        console.log(`[prune] could not validate ${name}: ${err.message}`)
      }
    }
  }
} finally {
  client.release()
  await pool.end()
}
