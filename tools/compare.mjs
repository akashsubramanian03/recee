/**
 * Pixel-diffs the captured clone against the captured live site.
 *
 *   node tools/capture.mjs                                   -> reference/live
 *   node tools/capture.mjs --base http://localhost:3001      -> reference/local
 *   node tools/compare.mjs
 *
 * Writes diff images to reference/diff/** and prints a per-frame mismatch table.
 *
 * Read the numbers with care: the two sites play the same videos but never on the
 * same frame, and the hero/mosaic are shader-driven, so a "mismatch" here is not
 * necessarily a defect. Use it to catch layout and typography drift on the static
 * sections; judge the animated ones from the screenshots themselves.
 */
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import pixelmatch from 'pixelmatch'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const LIVE = join(ROOT, 'reference', 'live')
const LOCAL = join(ROOT, 'reference', 'local')
const DIFF = join(ROOT, 'reference', 'diff')

async function listDirs(path) {
  try {
    const entries = await readdir(path, { withFileTypes: true })
    return entries.filter((e) => e.isDirectory()).map((e) => e.name)
  } catch {
    return []
  }
}

async function loadPng(path) {
  try {
    return PNG.sync.read(await readFile(path))
  } catch {
    return null
  }
}

const rows = []

for (const route of await listDirs(LIVE)) {
  for (const viewport of await listDirs(join(LIVE, route))) {
    const liveScroll = join(LIVE, route, viewport, 'scroll')
    const localScroll = join(LOCAL, route, viewport, 'scroll')
    let frames = []
    try {
      frames = (await readdir(liveScroll)).filter((f) => f.endsWith('.png')).sort()
    } catch {
      continue
    }

    const outDir = join(DIFF, route, viewport)
    await mkdir(outDir, { recursive: true })

    for (const frame of frames) {
      const a = await loadPng(join(liveScroll, frame))
      const b = await loadPng(join(localScroll, frame))
      if (!a || !b) {
        rows.push({ route, viewport, frame, pct: null, note: b ? 'live missing' : 'clone missing' })
        continue
      }
      if (a.width !== b.width || a.height !== b.height) {
        rows.push({ route, viewport, frame, pct: null, note: 'size mismatch' })
        continue
      }
      const diff = new PNG({ width: a.width, height: a.height })
      const changed = pixelmatch(a.data, b.data, diff.data, a.width, a.height, {
        threshold: 0.12,
        includeAA: false,
      })
      const pct = (changed / (a.width * a.height)) * 100
      await writeFile(join(outDir, frame), PNG.sync.write(diff))
      rows.push({ route, viewport, frame, pct, note: '' })
    }
  }
}

if (!rows.length) {
  console.log('Nothing to compare. Capture both sides first:')
  console.log('  node tools/capture.mjs')
  console.log('  node tools/capture.mjs --base http://localhost:3001')
  process.exit(0)
}

console.log('route                     viewport  frame      mismatch')
for (const r of rows) {
  const value = r.pct === null ? r.note : `${r.pct.toFixed(1)}%`
  console.log(
    `${r.route.padEnd(24)}  ${r.viewport.padEnd(8)}  ${r.frame.padEnd(9)}  ${value.padStart(8)}`,
  )
}

const scored = rows.filter((r) => r.pct !== null)
if (scored.length) {
  const mean = scored.reduce((s, r) => s + r.pct, 0) / scored.length
  console.log(`\n${scored.length} frames compared, mean mismatch ${mean.toFixed(1)}%`)
  console.log('diff images -> reference/diff/')
}
