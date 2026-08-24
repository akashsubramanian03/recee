import armCamera from '../assets/arm-camera.webp'
import handReach from '../assets/hand-reach.webp'

/**
 * The two reaching arms — photographic cutouts, subject-masked out of the
 * source frames so the rim-light survives onto the page.
 *
 * The left arm already holds the Super 8, so the camera is part of that
 * cutout rather than a separate element: one hand offers the camera, the
 * other reaches for it, and the gap between the lens and the reaching
 * fingertip is the focal point of the composition.
 *
 * The CRT pass — channel fringe, warm bloom, grain and scanlines — is gone.
 * The reference renders the arms clean, and the warm treatment fought the
 * cool blue field it now sits on.
 */
function Hand({ src, className, alt }) {
  return (
    <div className={`hand ${className}`}>
      <img className="hand__img" src={src} alt={alt} draggable="false" />
    </div>
  )
}

export default function Hands() {
  return (
    <>
      <Hand
        className="hand--left"
        src={armCamera}
        alt="An arm reaching in from the left, offering a vintage Super 8 camera."
      />
      <Hand
        className="hand--right"
        src={handReach}
        alt="A hand reaching in from the right, index finger extended toward the camera."
      />
    </>
  )
}
