import { BloomFieldGradient } from './bloom-field-gradient.jsx'

// Reference usage from the component's docs. Not mounted anywhere — this is a
// single-page app with no routing — but kept as the canonical example of how
// to scope the gradient to a container rather than the whole viewport. The
// parent must be positioned; the component fills it absolutely.
export default function BloomFieldGradientDemo() {
  return (
    <div style={{ position: 'relative', height: 440, overflow: 'hidden', borderRadius: 12 }}>
      <BloomFieldGradient />
    </div>
  )
}
