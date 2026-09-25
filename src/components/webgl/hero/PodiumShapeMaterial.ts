import * as THREE from 'three'
import { shaderMaterial } from '@react-three/drei'
import { extend } from '@react-three/fiber'
import { barrelPincushion, noise2d, passthroughVertex } from '../shaders/glsl'
import { config } from '@/config/animation'

/**
 * The hero portal.
 *
 * This is a full-viewport white sheet with the PODIUM mark punched out of it as a
 * transparent hole. Everything you see "inside" the mark is the mosaic scene
 * rendering behind this quad.
 *
 * The hole's outline is an SDF blend:
 *
 *   sdf_final = mix(sdf_texture, sdf_circle, 1.0 - uShapeReveal)
 *
 * At uShapeReveal = 0 the hole is a 0.01-radius circle — visually identical to the
 * preloader's black dot. At 1 it is the mark itself. Driving that uniform from 0 to 1
 * IS the logo animation.
 *
 * Fragment shader transcribed verbatim from the production bundle.
 */
const fragment = /* glsl */ `
uniform bool uIsMobile;
uniform float uTime;
uniform float uShapeReveal;
uniform float uScrollProgress;
uniform float uPulseReveal;
uniform float uScrollZposition;
uniform sampler2D uBackgroundPodiumShapeTexture;
uniform vec2 uTextureShapeSize;
uniform sampler2D uMouseTexture;
uniform vec2 uResolution;
uniform vec3 uColorBeige;
uniform vec2 uMeshSize;
uniform float uScrollVelocity;
uniform float uFluidIntensity;
uniform float uNoiseIntensity;
uniform float uBarrelIntensity;
uniform float uUvScale;
uniform float uPulseMult;
// Not in the original's uniform list. The original hides the whole sheet on a
// ScrollTrigger toggle at the scroll driver's top/top point; this reproduces that as
// a fade so the last of the white clears where it does on the live site.
// See HeroPortal for the measurements behind it.
uniform float uSheetOpacity;
varying vec2 vUv;

${noise2d}
${barrelPincushion}

float sdCircle(in vec2 p, in float r) {
  return length(p) - r;
}

void main() {
  float FLUID_INTENSITY = uFluidIntensity;
  float NOISE_INTENSITY = uNoiseIntensity;
  float BARREL_PINCH_INTENSITY = uBarrelIntensity;

  /** Ratio */
  float textureShapeRatio = uTextureShapeSize.x / uTextureShapeSize.y;
  float meshRatio = uMeshSize.x / uMeshSize.y;
  float resolutionRatio = uResolution.x / uResolution.y;

  /** Pulse */
  float pulse = uPulseReveal * uPulseMult;

  /** UV */
  float uvScale = uUvScale - pulse;
  vec2 uv = (vUv - 0.5) * uvScale + 0.5;
  vec2 uvBarrel = barrelPincushion(uv, -uScrollZposition * BARREL_PINCH_INTENSITY);

  if (meshRatio > textureShapeRatio) {
    uvBarrel.x = (uvBarrel.x - 0.5) * (meshRatio / textureShapeRatio) + 0.5;
  } else {
    uvBarrel.y = (uvBarrel.y - 0.5) * (textureShapeRatio / meshRatio) + 0.5;
  }

  vec2 uvMouseTrail;
  vec3 mouseColor = vec3(0.0);

  if (uIsMobile) {
    uvMouseTrail = uvBarrel;
  } else {
    /** Noise */
    float fnoise = pow((1.0 - uScrollProgress), 4.0) * noise(uvBarrel * 1000.0) * NOISE_INTENSITY;

    /** Mouse Texture + Trail effect */
    mouseColor = texture2D(uMouseTexture, vUv).rgb * fnoise;
    uvMouseTrail = uvBarrel - vec2(mouseColor) * FLUID_INTENSITY;
  }

  vec2 podiumUv = uvMouseTrail;
  podiumUv.y = 1.0 - podiumUv.y;

  if (resolutionRatio < 1.0) {
    podiumUv.y += (1.0 - uScrollProgress) * (1.0 - resolutionRatio) * 0.3;
  }

  /** Texture Map */
  vec3 textureMap = texture2D(uBackgroundPodiumShapeTexture, podiumUv).rgb;

  /** Circle SDF */
  vec2 circleUv = vUv - 0.5;
  circleUv.x *= uMeshSize.x / uMeshSize.y;
  float sdf_circle = sdCircle(circleUv, 0.01);

  /** Texture shape SDF */
  float sdf_texture = 0.5 - textureMap.g;

  /** Blend SDFs */
  float sdf_final = mix(sdf_texture, sdf_circle, 1.0 - uShapeReveal);

  /** Attenuate trail near edges — blend off during circle phase */
  float edgeDist = abs(sdf_final);
  float edgeGuard = smoothstep(0.0, 0.05, edgeDist);
  float sdf_clean = mix(sdf_texture, sdf_final, edgeGuard);
  float sdf_guarded = mix(sdf_clean, sdf_final, edgeGuard);
  sdf_final = mix(sdf_final, sdf_guarded, uShapeReveal);

  /** Smooth mask */
  float mask = mix(
    smoothstep(0.001, 0.003, sdf_final),
    smoothstep(0.0, 0.003, sdf_final),
    pow(uShapeReveal, 4.0)
  );

  if (!uIsMobile) {
    float mask_scale_and_blur = length(circleUv) + smoothstep(-1.0, 1.0, sdf_final) + 0.3;
    mask = mix(mask, mask_scale_and_blur, uPulseReveal);
    mask = pow(mask, 4.0);
  }

  /** Output */
  vec3 color = vec3(uColorBeige);
  gl_FragColor = vec4(color, mask * uSheetOpacity);
}
`

export const PodiumShapeMaterial = shaderMaterial(
  {
    uIsMobile: false,
    uTime: 0,
    uShapeReveal: 0,
    uScrollProgress: 0,
    uPulseReveal: 0,
    uScrollZposition: 0,
    uScrollVelocity: 0,
    uFluidIntensity: config.hero.shader.fluidIntensity,
    uNoiseIntensity: config.hero.shader.noiseIntensity,
    uBarrelIntensity: config.hero.shader.barrelIntensity,
    uUvScale: config.hero.shader.uvScale,
    uPulseMult: config.hero.shader.pulseMult,
    uSheetOpacity: 1,
    uBackgroundPodiumShapeTexture: new THREE.Texture(),
    uTextureShapeSize: new THREE.Vector2(0, 0),
    uMouseTexture: new THREE.Texture(),
    uResolution: new THREE.Vector2(0, 0),
    // Named "beige" in the original; it is the page sheet colour, i.e. white.
    uColorBeige: new THREE.Color('#ffffff'),
    uMeshSize: new THREE.Vector2(0, 0),
  },
  passthroughVertex,
  fragment,
)

extend({ PodiumShapeMaterial })

export type PodiumShapeMaterialImpl = THREE.ShaderMaterial & {
  uniforms: Record<string, THREE.IUniform>
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    podiumShapeMaterial: React.JSX.IntrinsicElements['shaderMaterial'] & {
      ref?: React.Ref<PodiumShapeMaterialImpl>
      uBackgroundPodiumShapeTexture?: THREE.Texture
      uMouseTexture?: THREE.Texture
      uTextureShapeSize?: [number, number]
      uResolution?: [number, number]
      uMeshSize?: [number, number]
      transparent?: boolean
    }
  }
}
