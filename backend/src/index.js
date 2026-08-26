import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { sections } from './routes/sections.js'
import { members } from './routes/members.js'
import { pool } from './db.js'

const app = express()
const PORT = Number(process.env.PORT ?? 3001)

app.use(cors())
/* A hard cap on body size. The default is 100kb, which is far more than a
   three-field form needs and is free surface area. */
app.use(express.json({ limit: '8kb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('select 1')
    res.json({ ok: true, db: 'up' })
  } catch (err) {
    res.status(503).json({ ok: false, db: 'down', error: err.message })
  }
})

app.use('/api/sections', sections)
app.use('/api/members', members)

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

/* Four arguments, or Express does not recognise it as an error handler. The
   message is logged but never returned — a driver error can carry the query
   and the connection string with it. */
app.use((err, _req, res, _next) => {
  console.error('[api]', err)
  res.status(500).json({ error: 'Something went wrong.' })
})

const server = app.listen(PORT, () => console.log(`[api] http://localhost:${PORT}`))

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => pool.end().then(() => process.exit(0)))
  })
}
