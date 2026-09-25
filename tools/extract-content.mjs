/**
 * Reassembles the RSC flight payload from a page and dumps the CMS objects inside it,
 * so project data / mosaic asset lists can be transcribed rather than guessed.
 *
 *   node tools/extract-content.mjs                 -> reference/payload/home.json
 *   node tools/extract-content.mjs /projects/deviate
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const route = process.argv[2] || '/'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0'

const html = await fetch('https://podium.global' + route, {
  headers: { 'user-agent': UA },
}).then((r) => r.text())

/** Each push carries one chunk of the flight stream as a JS string literal. */
const chunks = [...html.matchAll(/self\.__next_f\.push\(\[1,\s*("(?:[^"\\]|\\.)*")\]\)/g)].map((m) =>
  JSON.parse(m[1]),
)
const stream = chunks.join('')

/** Scan for balanced JSON objects starting at each `{`, keep the ones that parse. */
function harvestObjects(src, minLength = 120) {
  const found = []
  for (let i = 0; i < src.length; i++) {
    if (src[i] !== '{') continue
    let depth = 0
    let inStr = false
    let esc = false
    for (let j = i; j < src.length && j < i + 400_000; j++) {
      const c = src[j]
      if (esc) { esc = false; continue }
      if (c === '\\') { esc = true; continue }
      if (c === '"') { inStr = !inStr; continue }
      if (inStr) continue
      if (c === '{') depth++
      else if (c === '}') {
        depth--
        if (depth === 0) {
          const slice = src.slice(i, j + 1)
          if (slice.length >= minLength) {
            try {
              found.push(JSON.parse(slice))
              i = j // don't re-scan nested objects of a successful parse
            } catch {
              /* not JSON — keep scanning */
            }
          }
          break
        }
      }
    }
  }
  return found
}

const objects = harvestObjects(stream)

/** Keep the objects that look like CMS records rather than React internals. */
const INTERESTING = [
  'slug', 'projects', 'mosaic', 'title', 'client', 'year', 'services',
  'url', 'video', 'image', 'media', 'heroText', 'services', 'clients', 'athletes',
]
const scored = objects
  .map((o) => {
    const keys = JSON.stringify(o).match(/"([a-zA-Z_]+)":/g) || []
    const names = new Set(keys.map((k) => k.slice(1, -2)))
    const score = INTERESTING.filter((k) => names.has(k)).length
    return { score, size: JSON.stringify(o).length, o }
  })
  .filter((x) => x.score >= 2)
  .sort((a, b) => b.size - a.size)

const outDir = join(ROOT, 'reference', 'payload')
await mkdir(outDir, { recursive: true })
const name = route === '/' ? 'home' : route.replace(/^\//, '').replace(/\//g, '_')

await writeFile(join(outDir, `${name}.stream.txt`), stream)
await writeFile(
  join(outDir, `${name}.json`),
  JSON.stringify(scored.slice(0, 40).map((s) => s.o), null, 2),
)

console.log(`route ${route}`)
console.log(`  flight chunks : ${chunks.length}`)
console.log(`  stream length : ${stream.length.toLocaleString()}`)
console.log(`  objects parsed: ${objects.length}  (kept ${scored.length})`)
console.log(`  -> reference/payload/${name}.json`)
console.log(`  -> reference/payload/${name}.stream.txt`)
console.log('\n  top-level key sets of the 12 largest:')
for (const s of scored.slice(0, 12)) {
  console.log(`   ${String(s.size).padStart(7)}B  ${Object.keys(s.o).slice(0, 14).join(', ')}`)
}
