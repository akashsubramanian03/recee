/** Reads exact pixel colours out of captured reference frames. */
import { PNG } from 'pngjs'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const base = join(ROOT, 'reference', 'live', 'home', 'desktop', 'scroll')

const hex = (r, g, b) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')

function sample(file, points) {
  const png = PNG.sync.read(readFileSync(join(base, file)))
  console.log(`\n${file}  (${png.width}x${png.height})`)
  for (const [label, x, y] of points) {
    const i = (png.width * y + x) << 2
    console.log(
      `  ${label.padEnd(26)} (${String(x).padStart(4)},${String(y).padStart(4)})  ` +
        `${hex(png.data[i], png.data[i + 1], png.data[i + 2])}  ` +
        `rgb(${png.data[i]}, ${png.data[i + 1]}, ${png.data[i + 2]})`,
    )
  }
}

sample('0000.png', [
  ['hero bg top-right', 1800, 300],
  ['hero bg bottom-left', 120, 900],
  ['hero blob centre', 900, 600],
  ['wordmark ink', 150, 42],
])

sample('0004.png', [
  ['mosaic bg top-right', 1800, 200],
  ['mosaic bg bottom-left', 120, 1000],
  ['nav text', 1650, 44],
])

sample('0006.png', [
  ['project grid bg', 1750, 700],
  ['project title ink', 40, 380],
])

sample('0011.png', [
  ['worldwide bg', 100, 150],
  ['services box', 500, 900],
  ['clients box', 1200, 700],
  ['contour line', 700, 500],
])

sample('0014.png', [
  ['footer bg top-left', 60, 120],
  ['footer bg right', 1850, 400],
  ['footer bg bottom', 900, 1010],
])
