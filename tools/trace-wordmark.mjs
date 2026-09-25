import fs from 'node:fs'
import { PNG } from 'pngjs'
import potrace from 'potrace'

const png = PNG.sync.read(fs.readFileSync('reference/brand/kaset-wordmark-source.png'))
const X1 = 225, Y1 = 168, X2 = 1944, Y2 = 507
const W = X2 - X1 + 1, H = Y2 - Y1 + 1
const out = new PNG({ width: W, height: H })
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const s = ((y + Y1) * png.width + (x + X1)) * 4, d = (y * W + x) * 4
  const v = png.data[s] < 128 ? 0 : 255          // hard threshold, kill the off-white ground
  out.data[d] = out.data[d + 1] = out.data[d + 2] = v
  out.data[d + 3] = 255
}
fs.writeFileSync('cropped.png', PNG.sync.write(out))
console.log('cropped', W + 'x' + H)

potrace.trace('cropped.png', { threshold: 128, turdSize: 2, alphaMax: 1, optCurve: true, optTolerance: 0.2 },
  (err, svg) => {
    if (err) throw err
    fs.writeFileSync('traced.svg', svg)
    const d = svg.match(/ d="([^"]+)"/g).map(s => s.slice(4, -1))
    console.log('subpaths:', d.length, ' total path chars:', d.join('').length)
    fs.writeFileSync('kaset-logo-path.txt', d.join(' '))
  })
