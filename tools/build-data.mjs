/**
 * Builds src/data/*.json from the live RSC payloads, with every media URL rewritten
 * to its mirrored local path.
 *
 * Run after tools/mirror-assets.mjs.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchStream, harvestObjects, localiseUrls } from './lib/flight.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATA = join(ROOT, 'src', 'data')

const SLUGS = [
  'deviate',
  'life-edition',
  '80-winters',
  'jay-du-temple',
  'not-quite-gone',
  'milimani',
  'summer-nights',
  'western-states',
]

const mediaMap = JSON.parse(await readFile(join(DATA, 'media-map.json'), 'utf8'))

// ── homepage ──────────────────────────────────────────────────────────────
const homeStream = await fetchStream('/')
const homeObjects = harvestObjects(homeStream)
const homeRecord = homeObjects.find((o) => o.homepage && o.navigation)
if (!homeRecord) throw new Error('homepage record not found in flight payload')

const homepage = localiseUrls(homeRecord.homepage, mediaMap)
const navigation = localiseUrls(homeRecord.navigation, mediaMap)

// ── projects ──────────────────────────────────────────────────────────────
const projects = []
for (const slug of SLUGS) {
  const stream = await fetchStream(`/projects/${slug}`)
  const objects = harvestObjects(stream)
  const record = objects.find((o) => o.project?.projectSlug)
  if (!record) {
    console.log(`  ✗ ${slug}: project record not found`)
    continue
  }
  projects.push(localiseUrls(record.project, mediaMap))
  console.log(
    `  ✓ ${slug.padEnd(16)} ${record.project.projectTitle} — ${record.project.projectClient} ` +
      `(${record.project.pageContent?.length ?? 0} content blocks)`,
  )
}

// Homepage grid order is given as a list of record ids.
const order = (homepage.homeProjectItems ?? []).map((p) => p.id)
projects.sort((a, b) => {
  const ia = order.indexOf(a.id)
  const ib = order.indexOf(b.id)
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib)
})

await mkdir(DATA, { recursive: true })
await writeFile(join(DATA, 'homepage.json'), JSON.stringify(homepage, null, 2) + '\n')
await writeFile(join(DATA, 'navigation.json'), JSON.stringify(navigation, null, 2) + '\n')
await writeFile(join(DATA, 'projects.json'), JSON.stringify(projects, null, 2) + '\n')

// Report any URL that failed to localise, so nothing silently hotlinks.
const remaining = new Set()
const scan = (v) => {
  if (typeof v === 'string' && v.startsWith('http') && !v.includes('podium.global')) {
    if (v.includes('datocms') || v.includes('mux.com')) remaining.add(v.split('?')[0])
  } else if (Array.isArray(v)) v.forEach(scan)
  else if (v && typeof v === 'object') Object.values(v).forEach(scan)
}
scan(homepage)
scan(projects)

console.log(`\n  homepage.json    ${Object.keys(homepage).length} fields`)
console.log(`  navigation.json  ${Object.keys(navigation).length} fields`)
console.log(`  projects.json    ${projects.length} projects`)
if (remaining.size) {
  console.log(`\n  ⚠ ${remaining.size} media URLs still remote:`)
  for (const u of [...remaining].slice(0, 20)) console.log(`    ${u}`)
} else {
  console.log('\n  ✓ all media URLs localised')
}
