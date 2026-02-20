'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useTheme } from '@/components/ThemeProvider'

const Background = dynamic(
  () => import('@/components/Visuals/Background'),
  { ssr: false },
)

export default function Home() {
  const { light, setLight } = useTheme()

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 25 })
  const springY = useSpring(y, { stiffness: 200, damping: 25 })

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
    return () => window.removeEventListener('mousemove', onMove)
  }, [x, y])

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
          className="flex select-none flex-col items-center gap-1 text-2xl font-medium tracking-normal transition-colors duration-500 md:flex-row md:gap-3 md:text-xl"
          style={{
            x: springX,
            y: springY,
            color: light ? '#000' : '#fff',
          }}
        >
          <span>
            {'Craig Betts'.split('').map((char, i) => (
              <motion.span
                key={`craig-${i}`}
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ type: 'spring', duration: 1.2, bounce: 0, delay: i * 0.04 }}
              >
                {char}
              </motion.span>
            ))}
          </span>
          <span>
            {'Design @ Shopify'.split('').map((char, i) => (
              <motion.span
                key={`design-${i}`}
                initial={{ opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 0.75, filter: 'blur(0px)' }}
                transition={{ type: 'spring', duration: 1.2, bounce: 0, delay: 0.5 + i * 0.04 }}
              >
                {char}
              </motion.span>
            ))}
          </span>
        </motion.h1>
      </div>
    </main>
  )
}
