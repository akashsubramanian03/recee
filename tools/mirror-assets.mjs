/**
 * Mirrors every asset podium.global depends on into ./public.
 *
 * Three groups:
 *   1. Static engine assets  — fonts, the .ktx2 wordmark texture, the .glb rock, SVG icons.
 *                              These drive the shaders; the clone is wrong without them.
 *   2. DatoCMS media         — 86 images/videos referenced from the RSC payloads.
 *   3. Mux masters           — per-quality project videos (thumbnail.jpg + medium/high .mp4).
 *
 * Emits src/data/media-map.json  (original URL -> local /public path) so the content
 * layer can be rewritten mechanically.
 */
import { mkdir, writeFile, stat } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')
const ORIGIN = 'https://podium.global'

const ROUTES = [
  '/',
  '/projects/deviate',
  '/projects/life-edition',
  '/projects/80-winters',
  '/projects/jay-du-temple',
  '/projects/not-quite-gone',
  '/projects/milimani',
  '/projects/summer-nights',
  '/projects/western-states',
]

// Group 1 — served straight off podium.global/public, same paths in the clone.
const STATIC_ASSETS = [
  '/fonts/futura-book.woff2',
  '/fonts/futura-medium.woff2',
  '/fonts/futura-bold.woff2',
  '/fonts/univers-condensed.woff2',
  '/fonts/univers-condensed-bold.woff2',
  '/textures/background-podium-shape.ktx2',
  '/models/rockPodium-lite.glb',
  '/models/rockPodium.glb',
  '/images/shapes.svg',
  '/images/line.svg',
  '/images/circle.svg',
  '/images/square.svg',
  '/images/arrow.png',
  '/images/arrow-white.png',
  '/images/sign.svg',
  '/images/noise.png',
  '/favicon.ico',
  '/icon.png',
  '/apple-icon.png',
]

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36'

const log = (...a) => console.log(...a)

async function exists(p) {
  try {
    await stat(p)
    return true
  } catch {
    return false
  }
}

async function download(url, dest, { force = false } = {}) {
  if (!force && (await exists(dest))) {
    return { skipped: true, dest }
  }
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  await mkdir(dirname(dest), { recursive: true })
  await writeFile(dest, buf)
  return { bytes: buf.length, dest }
}

async function fetchText(url) {
  const res = await fetch(url, { headers: { 'user-agent': UA } })
  if (!res.ok) throw new Error(`${res.status} — ${url}`)
  return res.text()
}

/** RSC flight payloads escape slashes and quotes; undo that before regexing. */
function unescapePayload(html) {
  return html
    .replace(/\\u002F/g, '/')
    .replace(/\\u0026/g, '&')
    .replace(/\\"/g, '"')
    .replace(/&amp;/g, '&')
}

function collectUrls(html) {
  const src = unescapePayload(html)
  const datocms = new Set(
    [...src.matchAll(/https:\/\/www\.datocms-assets\.com\/\d+\/[0-9]+-[A-Za-z0-9_.\-]+/g)].map(
      (m) => m[0],
    ),
  )
  const muxVideo = new Set(
    [...src.matchAll(/https:\/\/stream\.mux\.com\/([A-Za-z0-9]+)\/(high|medium|low)\.mp4/g)].map(
      (m) => m[0],
    ),
  )
  const muxThumb = new Set(
    [...src.matchAll(/https:\/\/image\.mux\.com\/([A-Za-z0-9]+)\/thumbnail\.jpg/g)].map((m) => m[0]),
  )
  return { datocms, muxVideo, muxThumb }
}

/** Stable local path for a remote asset. */
function localPathFor(url) {
  if (url.includes('datocms-assets.com')) {
    const file = url.split('/').pop()
    return `/media/datocms/${file}`
  }
  if (url.includes('stream.mux.com')) {
    const [, id, quality] = url.match(/stream\.mux\.com\/([A-Za-z0-9]+)\/(\w+)\.mp4/)
    return `/media/mux/${id}-${quality}.mp4`
  }
  if (url.includes('image.mux.com')) {
    const [, id] = url.match(/image\.mux\.com\/([A-Za-z0-9]+)\//)
    return `/media/mux/${id}-thumbnail.jpg`
  }
  throw new Error(`No local path rule for ${url}`)
}

async function run() {
  const failures = []
  let downloaded = 0
  let skipped = 0
  let bytes = 0

  log('\n── 1/3  static engine assets ─────────────────────────────')
  for (const path of STATIC_ASSETS) {
    try {
      const r = await download(ORIGIN + path, join(PUBLIC, path))
      if (r.skipped) {
        skipped++
        log(`  · ${path} (already present)`)
      } else {
        downloaded++
        bytes += r.bytes
        log(`  ✓ ${path}  ${r.bytes.toLocaleString()} B`)
      }
    } catch (e) {
      failures.push([path, e.message])
      log(`  ✗ ${path}  ${e.message}`)
    }
  }

  log('\n── 2/3  scanning routes for media ────────────────────────')
  const all = { datocms: new Set(), muxVideo: new Set(), muxThumb: new Set() }
  for (const route of ROUTES) {
    const html = await fetchText(ORIGIN + route)
    const found = collectUrls(html)
    for (const k of Object.keys(all)) for (const u of found[k]) all[k].add(u)
    log(
      `  ${route.padEnd(28)} datocms:${String(found.datocms.size).padStart(3)}  ` +
        `mux-video:${String(found.muxVideo.size).padStart(3)}  mux-thumb:${String(found.muxThumb.size).padStart(3)}`,
    )
  }

  // Mux serves the same asset at several qualities. Keep the best one per id to
  // avoid mirroring three copies of every project film.
  const bestPerId = new Map()
  const rank = { high: 3, medium: 2, low: 1 }
  for (const url of all.muxVideo) {
    const [, id, q] = url.match(/stream\.mux\.com\/([A-Za-z0-9]+)\/(\w+)\.mp4/)
    const prev = bestPerId.get(id)
    if (!prev || rank[q] > rank[prev.q]) bestPerId.set(id, { q, url })
  }
  const muxToFetch = [...bestPerId.values()].map((v) => v.url)

  const queue = [...all.datocms, ...muxToFetch, ...all.muxThumb]
  log(
    `\n── 3/3  downloading ${queue.length} media files ` +
      `(${all.datocms.size} datocms, ${muxToFetch.length} mux videos, ${all.muxThumb.size} thumbs) ──`,
  )

  const mediaMap = {}
  // Modest concurrency — these include multi-hundred-MB project films.
  const CONCURRENCY = 6
  let cursor = 0
  async function worker(n) {
    while (cursor < queue.length) {
      const i = cursor++
      const url = queue[i]
      const local = localPathFor(url)
      mediaMap[url] = local
      try {
        const r = await download(url, join(PUBLIC, local))
        if (r.skipped) {
          skipped++
          log(`  · [${i + 1}/${queue.length}] ${local}`)
        } else {
          downloaded++
          bytes += r.bytes
          log(`  ✓ [${i + 1}/${queue.length}] ${local}  ${(r.bytes / 1024).toFixed(0)} KB`)
        }
      } catch (e) {
        failures.push([url, e.message])
        log(`  ✗ [${i + 1}/${queue.length}] ${local}  ${e.message}`)
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, (_, n) => worker(n)))

  // Every mux quality maps to the one file we kept, so content referencing
  // low/medium/high all resolves.
  for (const url of all.muxVideo) {
    const [, id] = url.match(/stream\.mux\.com\/([A-Za-z0-9]+)\//)
    const kept = bestPerId.get(id)
    if (kept) mediaMap[url] = localPathFor(kept.url)
  }

  const mapPath = join(ROOT, 'src', 'data', 'media-map.json')
  await mkdir(dirname(mapPath), { recursive: true })
  await writeFile(mapPath, JSON.stringify(mediaMap, null, 2) + '\n')

  log('\n─────────────────────────────────────────────────────────')
  log(`  downloaded ${downloaded} · skipped ${skipped} · ${(bytes / 1024 / 1024).toFixed(1)} MB`)
  log(`  media-map.json: ${Object.keys(mediaMap).length} entries`)
  if (failures.length) {
    log(`\n  ${failures.length} FAILURES:`)
    for (const [u, m] of failures) log(`    ${u} — ${m}`)
    process.exitCode = 1
  }
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
