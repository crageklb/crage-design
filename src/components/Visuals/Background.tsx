'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DotGridMaterial, TRAIL_LEN } from './DotMaterial'

const MAX_WAVES = 16
const TRAIL_INTERVAL = 0.03

function DotGrid({ theme }: { theme: number }) {
  const { viewport, size } = useThree()
  const mouse = useRef(new THREE.Vector2(0.5, 0.5))
  const waveIndex = useRef(0)
  const trailIndex = useRef(0)
  const lastTrailTime = useRef(0)
  const lastTrailPos = useRef(new THREE.Vector2(-1, -1))
  const material = useMemo(() => new DotGridMaterial(), [])
  const hasInit = useRef(false)

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
    const t = clock.elapsedTime

    u.uTime.value = t
    u.uTheme.value = theme
    u.uResolution.value.set(size.width, size.height)
    u.uMouse.value.copy(mouse.current)

    if (!hasInit.current && t > 0.3) {
      const i = waveIndex.current % MAX_WAVES
      u.uShockOrigins.value[i].set(0.5, 0.5)
      u.uShockTimes.value[i] = t
      waveIndex.current++
      hasInit.current = true
    }

    const moved = mouse.current.distanceTo(lastTrailPos.current) > 0.003
    if (moved && t - lastTrailTime.current > TRAIL_INTERVAL) {
      const i = trailIndex.current % TRAIL_LEN
      u.uTrail.value[i].copy(mouse.current)
      u.uTrailTimes.value[i] = t
      trailIndex.current++
      lastTrailTime.current = t
      lastTrailPos.current.copy(mouse.current)
    }
  })

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}

export default function Background({ theme = 0 }: { theme?: number }) {
  return (
    <div className="fixed inset-0 z-0" aria-hidden="true">
      <Canvas
        gl={{ antialias: false, alpha: false }}
        dpr={[1, 1.5]}
        camera={{ position: [0, 0, 1] }}
      >
        <DotGrid theme={theme} />
      </Canvas>
    </div>
  )
}
