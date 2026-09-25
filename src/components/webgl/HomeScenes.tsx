'use client'

import { Suspense, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { PerformanceMonitor, Preload } from '@react-three/drei'
import * as THREE from 'three'
import { config } from '@/config/animation'
import { MosaicScene } from './mosaic/MosaicScene'
import { HeroPortal } from './hero/HeroPortal'
import { FooterRock } from './footer/FooterRock'

/**
 * The one full-viewport canvas the homepage renders through.
 *
 * Layering across the page:
 *   z-0   DOM section backgrounds (white worldwide panel, #343434 footer)
 *   z-10  this canvas, transparent — hero sheet, mosaic planes, footer rock
 *   z-20  DOM content
 *
 * Draw order inside the canvas matters: the mosaic renders first, then HeroPortal
 * lays a white sheet over it with the PODIUM mark cut out (renderOrder 100,
 * depthTest off). What you see through the mark is the mosaic behind the sheet.
 * Once the mark has opened past the viewport the sheet is fully transparent, which
 * is what lets the later sections show through the same canvas.
 */
export function HomeScenes() {
  /**
   * Ceiling for the render resolution, adapted at runtime.
   *
   * Kept as a range so r3f still clamps to the display's own ratio — a fixed number
   * would supersample on a non-retina screen, which the original never does. Starts at
   * the original's full quality and steps down only if frames start arriving late.
   */
  const [maxDpr, setMaxDpr] = useState(2)

  return (
    <div className="pointer-events-none fixed inset-0 z-10">
      <Canvas
        camera={{
          fov: config.camera.fov,
          position: [...config.camera.position] as [number, number, number],
          near: 0.1,
          far: 200,
        }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        dpr={[1, maxDpr]}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0)
          gl.toneMapping = THREE.NoToneMapping
        }}
      >
        <fog attach="fog" args={['#000000', config.mosaic.fog.near, config.mosaic.fog.far]} />
        {/*
          `flipflops` gives this hysteresis: after three oscillations it settles on the
          fallback instead of flickering resolution mid-scroll.
        */}
        <PerformanceMonitor
          flipflops={3}
          onIncline={() => setMaxDpr(2)}
          onDecline={() => setMaxDpr(1.25)}
          onFallback={() => setMaxDpr(1)}
        />
        <Suspense fallback={null}>
          <MosaicScene />
          <FooterRock />
          <HeroPortal />
        </Suspense>
        <Preload all />
      </Canvas>
    </div>
  )
}
