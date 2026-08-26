import { Router } from 'express'
import { query } from '../db.js'

export const members = Router()

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
/* Digits with the punctuation people actually type. Deliberately permissive:
   a strict national format here would reject valid numbers from most of the
   world, and the point of this check is to catch a mistyped field, not to
   validate a phone network. */
const MOBILE = /^\+?[\d\s\-().]{7,24}$/

/* POST /api/members — the join form.
 *
 * Every field is required — there are no optional ones.
 *
 * Validation returns ALL the problems at once rather than the first one: a
 * form that rejects you five times in a row for five different fields is a
 * worse experience than one that tells you everything up front. */
members.post('/', async (req, res, next) => {
  const str = (k) => String(req.body?.[k] ?? '').trim()
  const name = str('name')
  const email = str('email')
  const mobile = str('mobile')
  const ageRaw = str('age')
  const firstLoveFilm = str('firstLoveFilm')

  const errors = {}

  if (!name) errors.name = 'Please tell us your name.'
  else if (name.length > 120) errors.name = 'That name is too long.'

  if (!email) errors.email = 'Please enter an email address.'
  else if (!EMAIL.test(email)) errors.email = "That doesn't look like an email address."
  else if (email.length > 200) errors.email = 'That email is too long.'

  if (!mobile) errors.mobile = 'Please enter a mobile number.'
  else if (!MOBILE.test(mobile)) errors.mobile = "That doesn't look like a phone number."

  /* Number(), not parseInt(): parseInt('19 years') is 19, and quietly
     accepting that stores a number the member never typed. */
  const age = Number(ageRaw)
  if (!ageRaw) errors.age = 'Please enter your age.'
  else if (!Number.isInteger(age)) errors.age = 'Age should be a whole number.'
  else if (age < 13) errors.age = 'You need to be 13 or over to join.'
  else if (age > 120) errors.age = 'Please check that age.'

  if (!firstLoveFilm) errors.firstLoveFilm = 'Please name one — any film counts.'
  else if (firstLoveFilm.length > 200) errors.firstLoveFilm = 'Keep it under 200 characters.'

  if (Object.keys(errors).length) return res.status(422).json({ errors })

  try {
    const { rows } = await query(
      `insert into members (name, email, mobile, age, first_love_film)
       values ($1, $2, $3, $4, $5)
       returning id, name, email, created_at`,
      [name, email, mobile, age, firstLoveFilm],
    )
    res.status(201).json({ member: rows[0] })
  } catch (err) {
    /* 23505 is unique_violation. The lower(email) index is what actually
       enforces this — checking with a SELECT first would still race. */
    if (err.code === '23505') {
      return res.status(409).json({
        errors: { email: "You're already on the list — see you at the next screening." },
      })
    }
    next(err)
  }
})

/* GET /api/members/count — the only thing the public page is allowed to know
   about the list. Returning the rows themselves would expose every member's
   email to anyone who found the URL. */
members.get('/count', async (_req, res, next) => {
  try {
    const { rows } = await query('select count(*)::int as count from members')
    res.json(rows[0])
  } catch (err) { next(err) }
})
