/**
 * The primary pill. Flat electric blue — the aqua wet-glass finish it was
 * named for is gone, along with the `glow` prop and the `sm` size that went
 * with the mid-hero trigger. The name is kept so the class hook stays put.
 */
export default function GlossyButton({
  children,
  size = 'lg',
  icon = null,
  className = '',
  ...rest
}) {
  const classes = ['gloss', `gloss--${size}`, className].filter(Boolean).join(' ')

  return (
    <button type="button" className={classes} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  )
}
