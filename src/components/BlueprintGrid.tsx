/**
 * Decorative dashed guides that run behind the lower half of the page — long dashed
 * rules plus small registration squares, like a print layout sheet.
 *
 * Positions are read off reference/live/home/desktop/scroll/0011.png and 0014.png.
 * They are proportional so they hold at any width.
 */
const V_LINES = [0.138, 0.318, 0.5, 0.682, 0.862, 0.98]
const H_LINES = [0.09, 0.435, 0.8]
const MARKS = [
  { x: 0.1, y: 0.965 },
  { x: 0.218, y: 0.84 },
  { x: 0.918, y: 0.27 },
  { x: 0.977, y: 0.61 },
  { x: 0.977, y: 0.865 },
]

export function BlueprintGrid({
  color = 'rgba(0,0,0,0.55)',
  className = '',
}: {
  color?: string
  className?: string
}) {
  return (
    <svg
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
      preserveAspectRatio="none"
      viewBox="0 0 100 100"
    >
      <g stroke={color} strokeWidth="0.08" strokeDasharray="0.55 0.45" vectorEffect="non-scaling-stroke">
        {V_LINES.map((x) => (
          <line key={`v${x}`} x1={x * 100} y1="0" x2={x * 100} y2="100" />
        ))}
        {H_LINES.map((y) => (
          <line key={`h${y}`} x1="0" y1={y * 100} x2="100" y2={y * 100} />
        ))}
      </g>
      <g stroke={color} strokeWidth="0.1" strokeDasharray="0.5 0.4" fill="none">
        {MARKS.map((m, i) => (
          <rect key={i} x={m.x * 100 - 0.7} y={m.y * 100 - 1.2} width="1.4" height="2.4" />
        ))}
      </g>
    </svg>
  )
}
