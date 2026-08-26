/**
 * Seeds the four bento sets the nav switches between.
 *
 * Idempotent: sections upsert on slug, and each section's panels are deleted
 * and rewritten, so running this twice leaves the same eight rows per section
 * rather than thirty-two. Members are never touched — seeding content must not
 * be able to wipe signups.
 *
 * Within a section the layout alternates: photo LEFT on rows 1 and 3, photo
 * RIGHT on rows 2 and 4. Written out per panel rather than generated, because
 * the copy differs per slot and a clever loop would hide that.
 *
 * Every section is seeded in the SAME orientation. The mirroring between them
 * is not stored: it flips on each move, so it depends on where you came from
 * rather than on which section you arrived at. Baked in here it would have
 * made About and Meetups permanently mirrored, and moving between those two
 * would have changed nothing. See `flipped` in App.jsx.
 */
import { pool } from '../src/db.js'

const PHOTO = {
  screen: 'A cinema auditorium, rows of empty seats facing a lit screen.',
  audience: 'A cinema audience seen from behind, faces lit by the screen.',
  reels: 'Film reels and projection equipment crowded on a workbench.',
  night: 'A cinema front lit up at night, seen from across the street.',
}

const p = (photoKey) => ({ kind: 'photo', photoKey, alt: PHOTO[photoKey] })
const t = (iconKey, title, lines) => ({ kind: 'text', iconKey, title, lines })

const SECTIONS = [
  {
    slug: 'home', label: 'Home', inNav: false,
    rows: [
      [p('screen'),   t('sparkle',  'Film Discussions', ['Deep dives into stories,', 'techniques, and meaning.'])],
      [t('people',    'Debates',    ['Different perspectives.', 'Better conversations.']), p('audience')],
      [p('reels'),    t('clapper',  'Collaborate',      ['Find your crew.', 'Work on projects.', 'Make films.'])],
      [t('calendar',  'Meetups',    ['Offline screenings,', 'events & workshops', 'coming soon.']), p('night')],
    ],
  },
  {
    slug: 'about', label: 'About', inNav: true,
    rows: [
      [p('night'),    t('sparkle',  'Our Story',        ['Started in one back row.', 'Now a few hundred seats.'])],
      [t('people',    'The Members',['Directors and first-timers.', 'Everyone argues equally.']), p('audience')],
      [p('screen'),   t('clapper',  'What We Believe',  ['Films are worth', 'talking about properly.'])],
      [t('calendar',  'Where We Meet', ['Cinemas, rooftops,', 'and living rooms.']), p('reels')],
    ],
  },
  {
    slug: 'what-we-do', label: 'What We Do', inNav: true,
    rows: [
      [p('screen'),   t('sparkle',  'Weekly Screenings',['One film a week,', 'chosen together.'])],
      [t('people',    'Watch Parties', ['Same film, same night,', 'wherever you are.']), p('audience')],
      [p('reels'),    t('clapper',  'Film Essays',      ['Members write.', 'We publish the best.'])],
      [t('calendar',  'Workshops',  ['Craft sessions with', 'people who make films.']), p('night')],
    ],
  },
  {
    slug: 'meetups', label: 'Meetups', inNav: true,
    rows: [
      [p('night'),    t('calendar', 'City Chapters',    ['Twelve cities so far.', 'Yours might be next.'])],
      [t('people',    'Monthly Socials', ['Drinks, arguments,', 'and a short film.']), p('audience')],
      [p('screen'),   t('sparkle',  'Festival Trips',   ['We go together,', 'and we queue together.'])],
      [t('clapper',   'Open Screenings', ['Bring something you made.', 'Ten minutes, any cut.']), p('reels')],
    ],
  },
]

const client = await pool.connect()
try {
  await client.query('begin')
  for (const [i, s] of SECTIONS.entries()) {
    const { rows: [section] } = await client.query(
      `insert into sections (slug, label, position, in_nav)
       values ($1, $2, $3, $4)
       on conflict (slug) do update
         set label = excluded.label, position = excluded.position, in_nav = excluded.in_nav
       returning id`,
      [s.slug, s.label, i, s.inNav],
    )
    await client.query('delete from panels where section_id = $1', [section.id])

    for (const [r, cells] of s.rows.entries()) {
      for (const [c, cell] of cells.entries()) {
        await client.query(
          `insert into panels
             (section_id, row_index, side, kind, icon_key, title, body_lines, photo_key, alt)
           values ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            section.id, r + 1, c === 0 ? 'left' : 'right', cell.kind,
            cell.iconKey ?? null, cell.title ?? null, cell.lines ?? null,
            cell.photoKey ?? null, cell.alt ?? null,
          ],
        )
      }
    }
    console.log(`[seed] ${s.slug}: 8 panels`)
  }
  await client.query('commit')
} catch (err) {
  await client.query('rollback')
  throw err
} finally {
  client.release()
  await pool.end()
}
