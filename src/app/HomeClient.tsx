'use client'

import { useEffect, useLayoutEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion'
import dynamic from 'next/dynamic'
import { useTheme } from '@/components/ThemeProvider'
import { validatePassword, clearAuthCookie } from './actions'

const Background = dynamic(
  () => import('@/components/Visuals/Background'),
  { ssr: false },
)

const PASSWORD_ANIMATION_END = 3.5

export default function HomeClient({ initialAuthenticated }: { initialAuthenticated: boolean }) {
  const { light, setLight } = useTheme()
  const [passwordHoverReady, setPasswordHoverReady] = useState(false)
  const [pillHovered, setPillHovered] = useState(false)
  const [inputActive, setInputActive] = useState(false)
  const [password, setPassword] = useState('')
  const [shake, setShake] = useState(false)
  const [authenticated, setAuthenticated] = useState(initialAuthenticated)
  const [pillReturning, setPillReturning] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 200, damping: 25 })
  const springY = useSpring(y, { stiffness: 200, damping: 25 })

  useEffect(() => {
    const t = setTimeout(() => setPasswordHoverReady(true), PASSWORD_ANIMATION_END * 1000)
    return () => clearTimeout(t)
  }, [])

  useLayoutEffect(() => {
    if (!inputActive) return
    const tryFocus = () => {
      const el = inputRef.current
      if (el) {
        el.focus({ preventScroll: true })
        document.querySelectorAll('[data-ios-focus-helper]').forEach((n) => n.remove())
        return true
      }
      return false
    }
    if (!tryFocus()) {
      let timeoutId: ReturnType<typeof setTimeout> | undefined
      const rafId = requestAnimationFrame(() => {
        if (!tryFocus()) timeoutId = setTimeout(tryFocus, 180)
      })
      return () => {
        cancelAnimationFrame(rafId)
        if (timeoutId !== undefined) clearTimeout(timeoutId)
      }
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
    const value = (inputRef.current?.value ?? password).trim()
    const valid = await validatePassword(value)
    if (valid) {
      setAuthenticated(true)
    } else {
      setShake(true)
      setPassword('')
      setTimeout(() => setShake(false), 500)
    }
  }

  const handleFaviconClick = async () => {
    await clearAuthCookie()
    setAuthenticated(false)
  }

  if (authenticated) {
    return (
      <main
        className="relative min-h-screen w-screen overflow-auto transition-colors duration-500"
        style={{ background: light ? '#fff' : '#000' }}
      >
        {mounted &&
          createPortal(
            <div
              className="pointer-events-none fixed top-0 left-0 right-0 z-10 isolate h-40 transition-colors duration-500"
              style={{
                background: light
                  ? 'linear-gradient(to bottom, rgba(255, 255, 255, 0.7), transparent)'
                  : 'linear-gradient(to bottom, rgba(0, 0, 0, 0.7), transparent)',
                backdropFilter: 'blur(60px)',
                WebkitBackdropFilter: 'blur(60px)',
                maskImage: 'linear-gradient(to bottom, black, transparent)',
                WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
                transform: 'translateZ(0)',
              }}
              aria-hidden
            />,
            document.body
          )}

        <button
          onClick={handleFaviconClick}
          className="fixed top-5 left-5 z-20 flex h-8 w-8 items-center justify-center rounded-md transition-opacity hover:opacity-80"
          aria-label="Return to auth"
        >
          <img
            src="/favicon.svg"
            alt=""
            className="h-6 w-6"
            style={light ? { filter: 'invert(1)' } : undefined}
          />
        </button>

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

        <div
          className="flex flex-col gap-16 px-6 pt-56 pb-12 min-h-full text-left w-full"
          style={{ color: light ? '#000' : '#fff' }}
        >
          {(['Section one', 'Section two', 'Section three'] as const).map((sectionTitle) => (
            <section
              key={sectionTitle}
              className="flex flex-col sm:flex-row sm:items-start justify-start gap-8 sm:gap-12 w-full"
            >
              <div className="sm:w-1/3 sm:min-w-[280px] shrink-0">
                <h2 className="text-2xl font-medium tracking-normal">
                  {sectionTitle}
                </h2>
              </div>

              <div className="@container flex-1 min-w-0">
                <div className="grid grid-cols-1 gap-3 @[412px]:grid-cols-2 @[624px]:grid-cols-3">
                  {[
                    { title: 'Card One', description: 'A short description for the first card goes here.' },
                    { title: 'Card Two', description: 'Another brief description for the second card.' },
                    { title: 'Card Three', description: 'The third card with its own placeholder text.' },
                    { title: 'Card Four', description: 'A short description for the fourth card.' },
                    { title: 'Card Five', description: 'Another brief description for the fifth card.' },
                    { title: 'Card Six', description: 'The sixth card with its placeholder text.' },
                    { title: 'Card Seven', description: 'A short description for the seventh card.' },
                    { title: 'Card Eight', description: 'Another brief description for the eighth card.' },
                    { title: 'Card Nine', description: 'The ninth card with its placeholder text.' },
                  ].map((card, i) => (
                    <motion.div
                      key={card.title}
                      initial={{ opacity: 0, filter: 'blur(10px)', scale: 0.92 }}
                      animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                      transition={{ type: 'spring', duration: 1.2, bounce: 0, delay: i * 0.1 }}
className={`flex-1 min-w-0 min-h-[300px] rounded-xl p-6 border ${light ? 'border-black/[0.08] hover:border-black/[0.28]' : 'border-white/[0.1] hover:border-white/[0.28]'}`}
                style={{
                  background: light ? 'rgba(255, 255, 255, 1)' : 'rgba(0, 0, 0, 1)',
                }}
                    >
                      <h3 className="text-lg font-medium mb-2">{card.title}</h3>
                      <p
                        className="text-sm opacity-80 leading-relaxed"
                        style={{ color: light ? '#333' : 'rgba(255,255,255,0.85)' }}
                      >
                        {card.description}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>
            </section>
          ))}
        </div>
      </main>
    )
  }

  return (
    <main
      className="relative h-[100dvh] min-h-screen w-screen overflow-hidden transition-colors duration-500"
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
                enterKeyHint="go"
                autoComplete="off"
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
              onPointerDown={(e) => {
                if (inputActive) return
                if (e.pointerType === 'mouse' && e.button !== 0) return
                const fake = document.createElement('input')
                fake.type = 'text'
                fake.setAttribute('data-ios-focus-helper', '')
                Object.assign(fake.style, {
                  position: 'absolute',
                  opacity: '0',
                  height: '0',
                  fontSize: '16px',
                  pointerEvents: 'none',
                })
                document.body.prepend(fake)
                fake.focus()
                setInputActive(true)
              }}
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
