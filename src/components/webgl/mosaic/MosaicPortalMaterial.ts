import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import { barrelPincushion, passthroughVertex } from '../shaders/glsl'
import { config } from '@/config/animation'

/**
 * Material for the floating images and videos.
 *
 * `uScrollVelocity` is a lerped per-frame delta of the mosaic's scroll progress, and
 * it is multiplied by 100 (25 on touch) before feeding the barrel warp — which is why
 * a fast flick visibly bulges the planes and a slow scroll barely touches them.
 *
 * Fragment shader transcribed verbatim from the production bundle.
 */
const fragment = /* glsl */ `
uniform sampler2D uTexture;
uniform float uScrollVelocity;
uniform float uScroll;
uniform float uBarrelMultiplier;
uniform vec2 uPointerOffset;
uniform bool uIsMobile;
varying vec2 vUv;

${barrelPincushion}

void main() {
  vec2 uv = clamp(vUv + uPointerOffset, vec2(0.0), vec2(1.0));
  vec2 uvBarrel = barrelPincushion(uv, uScrollVelocity * uBarrelMultiplier);

  vec4 textureColor = texture2D(uTexture, uvBarrel);

  if (uIsMobile) {
    gl_FragColor = vec4(textureColor.rgb, uScroll);
  } else {
    gl_FragColor = vec4(textureColor.rgb, textureColor.a * uScroll);
  }

  #include <colorspace_fragment>
}
`

export const MosaicPortalMaterial = shaderMaterial(
  {
    uIsMobile: false,
    uTexture: new THREE.Texture(),
    uScrollVelocity: 0,
    uScroll: 1,
    uBarrelMultiplier: config.mosaic.shader.barrelMultiplier,
    uPointerOffset: new THREE.Vector2(0, 0),
  },
  passthroughVertex,
  fragment,
)

extend({ MosaicPortalMaterial })

export type MosaicPortalMaterialImpl = THREE.ShaderMaterial & {
  uniforms: Record<string, THREE.IUniform>
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    mosaicPortalMaterial: React.JSX.IntrinsicElements['shaderMaterial'] & {
      ref?: React.Ref<MosaicPortalMaterialImpl>
      uTexture?: THREE.Texture
      transparent?: boolean
    }
  }
}
