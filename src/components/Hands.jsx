import armCamera from '../assets/arm-camera.webp'
import handReach from '../assets/hand-reach.webp'

/**
 * The two reaching arms — photographic cutouts, subject-masked out of the
 * source frames so the warm rim-light survives onto the white page.
 *
 * The left arm already holds the Super 8, so the camera is part of that
 * cutout rather than a separate element: one hand offers the camera, the
 * other reaches for it, and the gap between the lens and the reaching
 * fingertip is where the spark — and the join-now button — belongs.
 *
 * CRT treatment is per-element: the SVG filter carries fringe, grain and
 * bloom, while scanlines ride a mask cut from the image's own alpha so
 * they cannot bleed onto the white behind it.
 */
function Hand({ src, className, alt }) {
  return (
    <div className={`hand ${className}`}>
      <img className="hand__img" src={src} alt={alt} draggable="false" />
      <span
        className="hand__scan scanlayer"
        style={{ maskImage: `url(${src})`, WebkitMaskImage: `url(${src})` }}
        aria-hidden="true"
      />
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
