'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DotGridMaterial } from './DotMaterial'

const MAX_WAVES = 8

function DotGrid() {
  const { viewport, size } = useThree()
  const mouse = useRef(new THREE.Vector2(0.5, 0.5))
  const waveIndex = useRef(0)
  const material = useMemo(() => new DotGridMaterial(), [])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      mouse.current.set(
        e.clientX / window.innerWidth,
        1 - e.clientY / window.innerHeight,
      )
    }

    const onClick = (e: MouseEvent) => {
      const u = material.uniforms as Record<string, THREE.IUniform>
      const i = waveIndex.current % MAX_WAVES
      u.uShockOrigins.value[i].set(
        e.clientX / window.innerWidth,
        1 - e.clientY / window.innerHeight,
      )
      u.uShockTimes.value[i] = u.uTime.value
      waveIndex.current++
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('click', onClick)
    }
  }, [material])

  useFrame(({ clock }) => {
    const u = material.uniforms as Record<string, THREE.IUniform>
    u.uTime.value = clock.elapsedTime
    u.uResolution.value.set(size.width, size.height)
    u.uMouse.value.copy(mouse.current)
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default function Background() {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1] }}
      >
        <DotGrid />
      </Canvas>
    </div>
  )
}
