/**
 * Pulls the five inline SVGs out of the live pages and writes them as React
 * components. They total ~100KB of markup (the dithered icons are thousands of
 * 1px <rect>s), so they are generated rather than hand-transcribed.
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'src', 'components', 'icons')
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0'

/** SVG/HTML attributes that need camelCasing for JSX. Everything else passes through. */
const ATTR_MAP = {
  class: 'className',
  'clip-path': 'clipPath',
  'clip-rule': 'clipRule',
  'fill-rule': 'fillRule',
  'fill-opacity': 'fillOpacity',
  'stroke-width': 'strokeWidth',
  'stroke-dasharray': 'strokeDasharray',
  'stroke-dashoffset': 'strokeDashoffset',
  'stroke-linecap': 'strokeLinecap',
  'stroke-linejoin': 'strokeLinejoin',
  'stroke-opacity': 'strokeOpacity',
  'stroke-miterlimit': 'strokeMiterlimit',
  'text-anchor': 'textAnchor',
  'font-family': 'fontFamily',
  'font-size': 'fontSize',
  'font-weight': 'fontWeight',
  'letter-spacing': 'letterSpacing',
  'clip-rule': 'clipRule',
  'mask-type': 'maskType',
  'stop-color': 'stopColor',
  'stop-opacity': 'stopOpacity',
  'gradientUnits': 'gradientUnits',
  'patternUnits': 'patternUnits',
  'maskUnits': 'maskUnits',
  'clipPathUnits': 'clipPathUnits',
  'color-interpolation-filters': 'colorInterpolationFilters',
  'flood-opacity': 'floodOpacity',
  'flood-color': 'floodColor',
  'lighting-color': 'lightingColor',
  'stroke-dashoffset': 'strokeDashoffset',
  'marker-end': 'markerEnd',
  'marker-start': 'markerStart',
  'marker-mid': 'markerMid',
  'baseline-shift': 'baselineShift',
  'writing-mode': 'writingMode',
  'primitiveUnits': 'primitiveUnits',
  'filterUnits': 'filterUnits',
  'in2': 'in2',
  'xmlns:xlink': 'xmlnsXlink',
  'xlink:href': 'xlinkHref',
  'xml:space': 'xmlSpace',
  'shape-rendering': 'shapeRendering',
  'vector-effect': 'vectorEffect',
  'paint-order': 'paintOrder',
  'dominant-baseline': 'dominantBaseline',
}

function toJsx(svg) {
  return (
    svg
      // Attributes -> JSX names
      .replace(/([a-zA-Z-]+:?[a-zA-Z-]*)=/g, (m, name) => {
        if (name.startsWith('data-') || name.startsWith('aria-')) return m
        return (ATTR_MAP[name] ?? name) + '='
      })
      // Self-close void-ish SVG elements React expects closed
      .replace(/<(rect|path|circle|ellipse|line|polygon|polyline|stop|use|image)([^>]*?)><\/\1>/g,
        '<$1$2 />')
      .replace(/<(rect|path|circle|ellipse|line|polygon|polyline|stop|use|image)([^>]*?)(?<!\/)>/g,
        '<$1$2 />')
      // HTML entities React would double-escape
      .replace(/&amp;/g, '&')
  )
}

/**
 * The site reuses one id namespace across icons. Suffix ids so two icons can be
 * mounted on the same page without colliding.
 */
function namespaceIds(svg, ns) {
  const ids = [...svg.matchAll(/id="([^"]+)"/g)].map((m) => m[1])
  let out = svg
  for (const id of ids) {
    const safe = `${id}-${ns}`
    out = out
      .split(`id="${id}"`)
      .join(`id="${safe}"`)
      .split(`url(#${id})`)
      .join(`url(#${safe})`)
      .split(`href="#${id}"`)
      .join(`href="#${safe}"`)
  }
  return out
}

/** Strip the site's own Tailwind classes — our components set their own. */
function stripClassName(svg) {
  return svg.replace(/^(<svg[^>]*?)\sclassName="[^"]*"/, '$1')
}

const COMPONENTS = [
  {
    name: 'Wordmark',
    route: '/',
    match: (s) => s.includes('viewBox="0 0 220 33"'),
    doc: 'The PODIUM wordmark, 220x33. Inherits colour via currentColor on the header.',
  },
  {
    name: 'MenuIcon',
    route: '/',
    match: (s) => s.includes('viewBox="0 0 27 18"'),
    doc: 'Dithered hamburger, built from 0.75px rects. Rotates 45deg when the menu opens.',
  },
  {
    name: 'CloseIcon',
    route: '/',
    match: (s) => s.includes('aria-label="Close"'),
    doc: 'Dithered CLOSE button, 105x54, used by the contact modal.',
  },
  {
    name: 'ViewToggle',
    route: '/',
    match: (s) => s.includes('View toggle icon'),
    doc: 'GRID VIEW / LIST VIEW toggle, 102x54. The two label lines are clip-masked so they can slide.',
  },
  {
    name: 'ScrollBar',
    route: '/',
    match: (s) => s.includes('c-icon-scroll-bar'),
    doc: 'Dotted 104x16 progress rail for the behind-the-scenes carousel.',
  },
]

async function run() {
  await mkdir(OUT, { recursive: true })
  const cache = new Map()

  for (const c of COMPONENTS) {
    if (!cache.has(c.route)) {
      const res = await fetch('https://podium.global' + c.route, { headers: { 'user-agent': UA } })
      let html = await res.text()
      html = html.replace(/<script[\s\S]*?<\/script>/g, '')
      cache.set(c.route, html)
    }
    const html = cache.get(c.route)
    const all = [...html.matchAll(/<svg[\s\S]*?<\/svg>/g)].map((m) => m[0])
    const found = all.find(c.match)
    if (!found) {
      console.log(`  ✗ ${c.name}: no match`)
      continue
    }

    let jsx = toJsx(found)
    jsx = namespaceIds(jsx, c.name.toLowerCase())
    jsx = stripClassName(jsx)
    // Let callers drive size/colour/aria through props.
    jsx = jsx.replace(/^<svg/, '<svg {...props}')

    const file = `/**\n * ${c.doc}\n *\n * Generated by tools/extract-svgs.mjs — do not edit by hand.\n */\nimport type { SVGProps } from 'react'\n\nexport function ${c.name}(props: SVGProps<SVGSVGElement>) {\n  return (\n    ${jsx}\n  )\n}\n`
    await writeFile(join(OUT, `${c.name}.tsx`), file)
    console.log(`  ✓ ${c.name}.tsx  ${(file.length / 1024).toFixed(1)} KB`)
  }

  await writeFile(
    join(OUT, 'index.ts'),
    COMPONENTS.map((c) => `export { ${c.name} } from './${c.name}'`).join('\n') + '\n',
  )
  console.log('  ✓ index.ts')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
