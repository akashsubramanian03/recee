import bentoScreen from './assets/bento-screen.webp'
import bentoAudience from './assets/bento-audience.webp'
import bentoReels from './assets/bento-reels.webp'
import bentoNight from './assets/bento-night.webp'
import {
  IconSparkle, IconPeople, IconClapper, IconCalendar, IconCamera,
} from './components/Icons.jsx'

/**
 * Resolves the KEYS the API returns into the actual bundled asset and
 * component.
 *
 * The database stores `photo_key: 'screen'`, not a URL, because Vite
 * content-hashes these files at build time — there is no stable path the
 * server could know. The same goes for icons, which are React components.
 * This module is the single seam where content meets bundle.
 */
export const PHOTOS = {
  screen: bentoScreen,
  audience: bentoAudience,
  reels: bentoReels,
  night: bentoNight,
}

export const ICONS = {
  sparkle: IconSparkle,
  people: IconPeople,
  clapper: IconClapper,
  calendar: IconCalendar,
  camera: IconCamera,
}

/* Row geometry stays on the client: it is layout, not content.
 *
 * Stored as [wide, narrow] rather than [left, right], because which SIDE is
 * wide depends on where the photograph landed — and that flips per section, as
 * every other one is mirrored. The photo always takes the wider column; a
 * mirrored row swaps the pair rather than leaving a wide text panel next to a
 * squeezed picture.
 *
 * The two magnitudes still differ per row (54.8/43.2 against 56.7/40.9), which
 * is what keeps the mosaic from reading as a checkerboard. */
const ROW_SPLITS = [
  [54.8, 43.2],
  [56.7, 40.9],
]

export const ROW_HEIGHTS = [1.12, 1, 0.95, 1.08]

/** grid-template-columns for one row, given which side its photo is on. */
export function rowColumns(rowIndex, photoOnLeft) {
  const [wide, narrow] = ROW_SPLITS[rowIndex % 2]
  return photoOnLeft ? `${wide}fr ${narrow}fr` : `${narrow}fr ${wide}fr`
}
