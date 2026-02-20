'use client'

import { useEffect } from 'react'
import { motion, useMotionValue, useSpring } from 'framer-motion'
import dynamic from 'next/dynamic'

const Background = dynamic(
  () => import('@/components/Visuals/Background'),
  { ssr: false },
)

export default function Home() {
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
    <main className="relative h-screen w-screen overflow-hidden bg-black">
      <Background />
      <div className="pointer-events-none relative z-10 flex h-full items-center justify-center">
        <motion.h1
          className="select-none text-xl font-medium tracking-normal text-white"
          style={{ x: springX, y: springY }}
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
