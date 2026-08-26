/**
 * The Aqua gel pill.
 *
 * Renders the shape only — every visual pass (base ramp, specular streak,
 * floor bounce, inset lip and rim) lives in `.gloss` in buttons.css, and the
 * colour it is pitched to lives in the `--aqua-*` tokens. Pass
 * `className="gloss--plain"` for the white non-default variant.
 */
export default function GlossyButton({
  children,
  size = 'lg',
  icon = null,
  className = '',
  type = 'button',
  ...rest
}) {
  const classes = ['gloss', `gloss--${size}`, className].filter(Boolean).join(' ')

  /* `type` is a prop rather than hardcoded: inside a <form> the default HTML
     button type is "submit", and a button that silently submits is exactly the
     bug this component would otherwise hide. Defaulting to "button" keeps the
     safe behaviour, and the form asks for "submit" explicitly. */
  return (
    <button type={type} className={classes} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  )
}
