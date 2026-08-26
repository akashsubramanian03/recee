import { useEffect, useRef, useState } from 'react'
import GlossyButton from './GlossyButton.jsx'
import { joinRecce, ApiError } from '../api.js'
import { IconArrow } from './Icons.jsx'

/**
 * The join form — it takes over the hero panel rather than opening a dialog.
 *
 * A modal would be the reflex, but the page cannot scroll and a dialog over a
 * locked viewport traps focus on a surface that may not fit. Replacing the
 * pitch in place uses room the layout already accounts for, and the panel it
 * lands in is exactly the height the copy it replaced occupied.
 *
 * Fields are uncontrolled — read from the form on submit rather than mirrored
 * into state on every keystroke. There is nothing to derive from them while
 * typing, so per-character re-renders would buy nothing, and with six fields
 * that is six state hooks and six handlers avoided.
 *
 * `noValidate` is deliberate: the browser's own bubbles would fire one field at
 * a time, where the server answers with every problem at once and the form
 * renders them all beside their inputs.
 */
export default function JoinForm({ onCancel }) {
  const [status, setStatus] = useState('idle') // idle | sending | done
  const [errors, setErrors] = useState({})
  const [failure, setFailure] = useState(null)
  const firstField = useRef(null)
  const headingRef = useRef(null)

  /* Focus moves into the form when it opens — the button that summoned it is
     gone from the DOM, so focus would otherwise fall back to <body> and a
     keyboard user would have to tab in from the top of the page. */
  useEffect(() => { firstField.current?.focus() }, [])

  /* And on success it moves to the confirmation, which is the only way a
     screen-reader user learns the form is no longer there. */
  useEffect(() => { if (status === 'done') headingRef.current?.focus() }, [status])

  async function handleSubmit(event) {
    event.preventDefault()
    if (status === 'sending') return

    const data = new FormData(event.currentTarget)
    setStatus('sending')
    setErrors({})
    setFailure(null)

    try {
      await joinRecce({
        name: data.get('name'),
        email: data.get('email'),
        mobile: data.get('mobile'),
        age: data.get('age'),
        firstLoveFilm: data.get('firstLoveFilm'),
      })
      setStatus('done')
    } catch (err) {
      setStatus('idle')
      if (err instanceof ApiError && err.errors) setErrors(err.errors)
      else setFailure(err.message)
    }
  }

  if (status === 'done') {
    return (
      <div className="join join--done">
        <p className="chip hero__chip">You're in</p>
        <h2 className="join__title lift" tabIndex={-1} ref={headingRef}>
          See you at the
          <br />
          next screening.
        </h2>
        <p className="hero__body">
          We've saved your seat. Watch your inbox for
          <br />
          the film we're arguing about this week.
        </p>
        <button type="button" className="join__back" onClick={onCancel}>
          ← Back
        </button>
      </div>
    )
  }

  return (
    <form className="join" onSubmit={handleSubmit} noValidate>
      <p className="chip hero__chip">Join the club</p>
      <h2 className="join__title lift">Become a member.</h2>

      {/* Five fields in a panel that cannot scroll, so mobile and age share a
          row — age needs about four characters and a full-width input for it
          would cost a whole line of height for nothing.
          Nothing here is optional; the server rejects any blank. */}
      <div className="join__fields">
        <Field
          inputRef={firstField} name="name" label="Name"
          autoComplete="name" error={errors.name}
        />
        <Field
          name="email" label="Email" type="email"
          autoComplete="email" error={errors.email}
        />
        <div className="join__row">
          <Field
            name="mobile" label="Mobile" type="tel"
            autoComplete="tel" error={errors.mobile}
          />
          <Field
            name="age" label="Age" type="number" inputMode="numeric"
            min="13" max="120" autoComplete="off" error={errors.age}
            className="join__field--age"
          />
        </div>
        <Field
          name="firstLoveFilm" label="The film that made you fall in love with cinema"
          autoComplete="off" error={errors.firstLoveFilm}
        />
      </div>

      {/* aria-live so a failure that belongs to no single field is still
          announced — a visually-obvious red line is invisible to a screen
          reader unless the region is live. */}
      <p className="join__failure" role="status" aria-live="polite">
        {failure}
      </p>

      <div className="join__actions">
        <GlossyButton
          size="lg"
          className="gloss--arrow join__submit"
          type="submit"
          disabled={status === 'sending'}
          icon={<IconArrow className="gloss__arrow" width="22" height="22" aria-hidden="true" />}
        >
          {status === 'sending' ? 'Joining…' : 'Join Recce'}
        </GlossyButton>
        <button type="button" className="join__back" onClick={onCancel}>
          ← Back
        </button>
      </div>
    </form>
  )
}

/* `aria-describedby` is what ties the message to the input for a screen
   reader; the red text alone only works if you can see it.
 *
 * The ref arrives as `inputRef`, not `ref`. On React 19 a plain `ref` prop
 * would work, but this app is on 18, where React strips `ref` from function
 * components unless they are wrapped in forwardRef — so it silently arrived
 * undefined and the autofocus did nothing. Renaming it is less machinery than
 * a forwardRef wrapper for one field. */
function Field({ inputRef, name, label, error, className = '', ...rest }) {
  const id = `join-${name}`
  return (
    <p className={`join__field ${className}`.trim()}>
      {/* No "(optional)" affordance: every field is required, so marking them
          would mean marking all of them, which tells the reader nothing. */}
      <label className="join__label" htmlFor={id}>
        {label}
      </label>
      <input
        ref={inputRef}
        id={id}
        name={name}
        className="field join__input"
        aria-invalid={error ? 'true' : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        {...rest}
      />
      {error && <span className="join__error" id={`${id}-error`}>{error}</span>}
    </p>
  )
}
