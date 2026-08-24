/**
 * Aqua glossy pill. One component, two sizes.
 *   size="lg"  → primary CTA below the fold
 *   size="sm" + glow → the hero trigger sitting in the fingertip gap
 */
export default function GlossyButton({
  children,
  size = 'lg',
  glow = false,
  icon = null,
  className = '',
  ...rest
}) {
  const classes = [
    'gloss',
    `gloss--${size}`,
    glow ? 'gloss--glow' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button type="button" className={classes} {...rest}>
      {icon}
      <span>{children}</span>
    </button>
  )
}
