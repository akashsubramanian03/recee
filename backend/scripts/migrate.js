/**
 * Applies every .sql file in migrations/ in filename order.
 *
 * Each file is wrapped in a transaction, so a syntax error halfway through
 * leaves the database untouched rather than half-migrated. The statements are
 * all `if not exists`, so re-running is safe — this is deliberately not a
 * versioned migration tracker, because at this size a tracker table is more
 * moving parts than the thing it tracks.
 *
 *   node scripts/migrate.js           apply
 *   node scripts/migrate.js --reset   drop the tables first
 */
import { readdir, readFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { pool } from '../src/db.js'

const dir = join(dirname(fileURLToPath(import.meta.url)), '..', 'migrations')

const client = await pool.connect()
try {
  if (process.argv.includes('--reset')) {
    await client.query('drop table if exists panels, sections, members cascade')
    console.log('[migrate] dropped existing tables')
  }
  for (const file of (await readdir(dir)).filter((f) => f.endsWith('.sql')).sort()) {
    const sql = await readFile(join(dir, file), 'utf8')
    await client.query('begin')
    try {
      await client.query(sql)
      await client.query('commit')
      console.log(`[migrate] applied ${file}`)
    } catch (err) {
      await client.query('rollback')
      throw new Error(`${file}: ${err.message}`)
    }
  }
} finally {
  client.release()
  await pool.end()
}
