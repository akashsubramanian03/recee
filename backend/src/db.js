import 'dotenv/config'
import pg from 'pg'

/**
 * One pool for the process. Creating a client per request is the usual first
 * mistake with node-postgres — each one costs a TCP connection and a Postgres
 * backend process, and under any load at all you hit max_connections.
 */
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
  idleTimeoutMillis: 30_000,
})

/* An idle client can be killed by the server or the network; without this the
   error is unhandled and takes the process down. */
pool.on('error', (err) => {
  console.error('[db] idle client error:', err.message)
})

export const query = (text, params) => pool.query(text, params)
