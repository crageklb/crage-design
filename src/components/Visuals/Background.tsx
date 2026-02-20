'use client'

import { useRef, useEffect, useMemo } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { DotGridMaterial, TRAIL_LEN } from './DotMaterial'

const MAX_WAVES = 16
const TRAIL_INTERVAL = 0.03
const TRAIL_MIN_DIST = 0.015
const MOBILE_BREAKPOINT = 768

function DotGrid({ theme }: { theme: number }) {
  const { viewport, size } = useThree()
  const mouse = useRef(new THREE.Vector2(0.5, 0.5))
  const waveIndex = useRef(0)
  const trailIndex = useRef(0)
  const lastTrailTime = useRef(0)
  const lastTrailPos = useRef(new THREE.Vector2(-1, -1))
  const smoothSpeed = useRef(0)
  const material = useMemo(() => new DotGridMaterial(), [])
  const hasInit = useRef(false)
  const touchCount = useRef(0)
  const touchActive = useRef(false)
  const isMobile = size.width < MOBILE_BREAKPOINT

  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        touchCount.current++
        touchActive.current = true
      }
    }
    const onPointerUp = (e: PointerEvent) => {
      if (e.pointerType === 'touch') {
        touchCount.current = Math.max(0, touchCount.current - 1)
        touchActive.current = touchCount.current > 0
      }
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', onPointerUp)
    window.addEventListener('pointercancel', onPointerUp)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      window.removeEventListener('pointercancel', onPointerUp)
    }
  }, [])

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
    const fade = 1.0 - Math.min(1, Math.max(0, (t - 1.0) / 0.5))
    const initialFade = t < 1.5 ? fade : 0
    u.uTouchActive.value = isMobile ? Math.max(touchActive.current ? 1 : 0, initialFade) : 1
    u.uResolution.value.set(size.width, size.height)
    u.uMouse.value.copy(mouse.current)

    if (!hasInit.current && t > 0.3) {
      const i = waveIndex.current % MAX_WAVES
      u.uShockOrigins.value[i].set(0.5, 0.5)
      u.uShockTimes.value[i] = t
      waveIndex.current++
      hasInit.current = true
    }

    const dist = mouse.current.distanceTo(lastTrailPos.current)
    const moved = dist > 0.003
    const dt = Math.max(t - lastTrailTime.current, 0.001)
    const rawSpeed = moved ? dist / dt : 0
    smoothSpeed.current += (rawSpeed - smoothSpeed.current) * 0.05
    smoothSpeed.current *= 0.90
    u.uSpeed.value = smoothSpeed.current

    const timeOk = t - lastTrailTime.current > TRAIL_INTERVAL
    const distOk = dist > TRAIL_MIN_DIST
    if (moved && (timeOk || distOk)) {
      const i = trailIndex.current % TRAIL_LEN
      u.uTrail.value[i].copy(mouse.current)
      u.uTrailTimes.value[i] = t
      u.uTrailHead.value = i
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
