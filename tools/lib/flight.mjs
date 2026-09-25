/** Shared helpers for reading Next.js RSC flight payloads off the live site. */

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/126.0'

export async function fetchStream(route) {
  const html = await fetch('https://podium.global' + route, {
    headers: { 'user-agent': UA },
  }).then((r) => r.text())
  const chunks = [
    ...html.matchAll(/self\.__next_f\.push\(\[1,\s*("(?:[^"\\]|\\.)*")\]\)/g),
  ].map((m) => JSON.parse(m[1]))
  return chunks.join('')
}

/** Scan for balanced JSON objects and keep the ones that parse. */
export function harvestObjects(src, minLength = 120) {
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
              i = j
            } catch {
              /* not JSON */
            }
          }
          break
        }
      }
    }
  }
  return found
}

/**
 * Rewrites every remote media URL to the mirrored local path.
 * Query strings are dropped — the mirror stores originals and next/image handles resizing.
 */
export function localiseUrls(value, mediaMap) {
  if (typeof value === 'string') {
    if (!value.startsWith('http')) return value
    const bare = value.split('?')[0]
    if (mediaMap[bare]) return mediaMap[bare]
    // Mux qualities collapse to whichever one was mirrored.
    const mux = bare.match(/stream\.mux\.com\/([A-Za-z0-9]+)\//)
    if (mux) {
      const hit = Object.entries(mediaMap).find(([k]) => k.includes(`/${mux[1]}/`))
      if (hit) return hit[1]
    }
    const thumb = bare.match(/image\.mux\.com\/([A-Za-z0-9]+)\//)
    if (thumb) return `/media/mux/${thumb[1]}-thumbnail.jpg`
    return value
  }
  if (Array.isArray(value)) return value.map((v) => localiseUrls(v, mediaMap))
  if (value && typeof value === 'object') {
    const out = {}
    for (const [k, v] of Object.entries(value)) out[k] = localiseUrls(v, mediaMap)
    return out
  }
  return value
}
