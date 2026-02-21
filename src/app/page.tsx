'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useTheme } from '@/components/ThemeProvider'
import { validatePassword } from './actions'

const Background = dynamic(
  () => import('@/components/Visuals/Background'),
  { ssr: false },
)

const PASSWORD_ANIMATION_END = 3.5

export default function Home() {
  const { light, setLight } = useTheme()
  const [passwordHoverReady, setPasswordHoverReady] = useState(false)
  const [pillHovered, setPillHovered] = useState(false)
  const [inputActive, setInputActive] = useState(false)
  const [password, setPassword] = useState('')
  const [shake, setShake] = useState(false)
  const [authenticated, setAuthenticated] = useState(false)
  const [pillReturning, setPillReturning] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 25 })
  const springY = useSpring(y, { stiffness: 200, damping: 25 })

  useEffect(() => {
    const t = setTimeout(() => setPasswordHoverReady(true), PASSWORD_ANIMATION_END * 1000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (inputActive) {
      const t = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true })
      }, 160)
      return () => clearTimeout(t)
    }
  }, [inputActive])

  useEffect(() => {
    if (!inputActive) return
    const onClickOutside = (e: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setPillReturning(true)
        setInputActive(false)
        setPassword('')
      }
    }
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPillReturning(true)
        setInputActive(false)
        setPassword('')
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEsc)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEsc)
    }
  }, [inputActive])

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

  const handleSubmit = async () => {
    const valid = await validatePassword(password)
    if (valid) {
      setAuthenticated(true)
    } else {
      setShake(true)
      setPassword('')
      setTimeout(() => setShake(false), 500)
    }
  }

  if (authenticated) {
    return (
      <main
        className="relative h-screen w-screen overflow-hidden transition-colors duration-500"
        style={{ background: light ? '#fff' : '#000' }}
      >
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
      </main>
    )
  }

  return (
    <main
      className="relative h-screen w-screen overflow-hidden transition-colors duration-500"
      style={{ background: light ? '#fff' : '#000' }}
    >
      <Background theme={light ? 1 : 0} pillHovered={pillHovered} springX={springX} springY={springY} />

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

      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center gap-8">
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

        <AnimatePresence mode="wait">
          {inputActive ? (
            <motion.div
              key="input"
              data-no-shockwave
              className="pointer-events-auto flex items-center gap-2 rounded-full border px-4 py-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                x: springX,
                y: springY,
                background: light ? '#fff' : '#000',
                borderWidth: 1,
                borderColor: light ? 'rgba(0,0,0,0.10)' : 'rgba(255,255,255,0.10)',
              }}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke={light ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)'}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <motion.input
                ref={inputRef}
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                animate={shake ? { x: [0, -6, 6, -4, 4, 0] } : {}}
                transition={{ duration: 0.4 }}
                className="bg-transparent text-base font-normal outline-none"
                style={{
                  color: light ? '#000' : '#fff',
                  width: '110px',
                  caretColor: light ? '#000' : '#fff',
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="pill"
              data-no-shockwave
              className={`flex cursor-pointer items-center justify-center gap-2 rounded-full border border-transparent px-4 py-2 transition-none ${passwordHoverReady ? 'pointer-events-auto' : 'pointer-events-none'} ${light ? 'hover:bg-black/10' : 'hover:bg-white/10'}`}
              onMouseEnter={() => setPillHovered(true)}
              onMouseLeave={() => setPillHovered(false)}
              onClick={() => setInputActive(true)}
              initial={pillReturning ? false : { opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              style={{
                x: springX,
                y: springY,
                color: light ? '#000' : '#fff',
              }}
            >
              <motion.span
                className="flex shrink-0"
                initial={pillReturning ? false : { opacity: 0, filter: 'blur(10px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ type: 'spring', duration: 1.2, bounce: 0, delay: pillReturning ? 0 : 2.75 }}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </motion.span>
              <span className="flex text-base font-normal whitespace-pre">
                {'Enter password'.split('').map((char, i) => (
                  <motion.span
                    key={`pwd-${i}`}
                    initial={pillReturning ? false : { opacity: 0, filter: 'blur(10px)' }}
                    animate={{ opacity: 1, filter: 'blur(0px)' }}
                    transition={{ type: 'spring', duration: 1.2, bounce: 0, delay: pillReturning ? 0 : 2.75 + (i + 1) * 0.04 }}
                  >
                    {char === ' ' ? '\u00A0' : char}
                  </motion.span>
                ))}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
