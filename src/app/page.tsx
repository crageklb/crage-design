'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  motion,
  useMotionValue,
  useMotionTemplate,
  useSpring,
  useAnimationFrame,
} from 'framer-motion'
import dynamic from 'next/dynamic'

const Background = dynamic(
  () => import('@/components/Visuals/Background'),
  { ssr: false },
)

interface Wave {
  x: number
  y: number
  time: number
}

export default function Home() {
  const [light, setLight] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const blur = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 25 })
  const springY = useSpring(y, { stiffness: 200, damping: 25 })
  const springBlur = useSpring(blur, { stiffness: 300, damping: 20 })
  const filterStyle = useMotionTemplate`blur(${springBlur}px)`

  const waves = useCallback(() => [] as Wave[], [])()
  const startTime = useCallback(() => performance.now(), [])()

  const onClickWave = useCallback((e: MouseEvent) => {
    waves.push({
      x: e.clientX,
      y: e.clientY,
      time: (performance.now() - startTime) / 1000,
    })
    if (waves.length > 16) waves.shift()
  }, [waves, startTime])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = cx - e.clientX
      const dy = cy - e.clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const influence = 500
      const strength = 5
      const falloff = dist < influence ? 1 - dist / influence : 0
      const len = dist || 1
      x.set((dx / len) * strength * falloff)
      y.set((dy / len) * strength * falloff)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('click', onClickWave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('click', onClickWave)
    }
  }, [x, y, onClickWave])

  useAnimationFrame(() => {
    const now = (performance.now() - startTime) / 1000
    let maxBlur = 0
    for (const w of waves) {
      const age = now - w.time
      if (age > 3.5) continue
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = cx - w.x
      const dy = cy - w.y
      const distNorm = Math.sqrt(dx * dx + dy * dy) / Math.max(window.innerWidth, window.innerHeight)
      const waveRadius = age * 0.5
      const waveWidth = 0.06 + age * 0.025
      const proximity = Math.exp(-Math.pow((distNorm - waveRadius) / waveWidth, 2))
      const decay = Math.exp(-age * 1.2)
      maxBlur = Math.max(maxBlur, proximity * decay)
    }
    blur.set(maxBlur * 6)
  })

  return (
    <main
      className="relative h-screen w-screen overflow-hidden transition-colors duration-500"
      style={{ background: light ? '#fff' : '#000' }}
    >
      <Background theme={light ? 1 : 0} />

      <button
        onClick={(e) => {
          e.stopPropagation()
          setLight(prev => !prev)
        }}
        className="fixed top-5 right-5 z-20 flex h-8 w-8 items-center justify-center rounded-full border transition-colors duration-300"
        style={{
          borderColor: light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.15)',
          color: light ? '#000' : '#fff',
        }}
        aria-label="Toggle theme"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {light ? (
            <path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" />
          ) : (
            <>
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
            </>
          )}
        </svg>
      </button>

      <div className="pointer-events-none relative z-10 flex h-full items-center justify-center">
        <motion.h1
          className="select-none text-xl font-medium tracking-normal transition-colors duration-500"
          style={{
            x: springX,
            y: springY,
            filter: filterStyle,
            color: light ? '#000' : '#fff',
          }}
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={{ opacity: 1, filter: 'blur(0px)' }}
          transition={{ type: 'spring', duration: 1.8, bounce: 0 }}
        >
          Craig Betts &nbsp; • &nbsp; Design @ Shopify
        </motion.h1>
      </div>
    </main>
  )
}
