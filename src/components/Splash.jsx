import { useEffect, useRef, useState } from 'react'

const YEAR_CONFIG = [
  { year: 1860, left: 6,  speed: 13, size: 22 },
  { year: 2020, left: 18, speed: 17, size: 20 },
  { year: 1492, left: 32, speed: 11, size: 25 },
  { year: 1970, left: 44, speed: 19, size: 20 },
  { year: 1750, left: 56, speed: 15, size: 23 },
  { year: 1945, left: 68, speed: 21, size: 21 },
  { year: 1600, left: 78, speed: 12, size: 24 },
  { year: 2001, left: 88, speed: 18, size: 20 },
  { year: 1320, left: 25, speed: 14, size: 22 },
  { year: 1888, left: 92, speed: 16, size: 21 },
]

const MAX_COUNT = 22

export default function Splash({ onEnter, active }) {
  const refs = useRef([])
  const animRef = useRef(null)
  const countRefs = useRef([])
  const countIntervals = useRef([])
  const [showCTA, setShowCTA] = useState(false)

  const state = useRef(YEAR_CONFIG.map(() => ({
    y: Math.random() * 100,
    dir: Math.random() > 0.5 ? 1 : -1,
  })))

  const offsets = useRef(YEAR_CONFIG.map(() => 0))

  useEffect(() => {
    if (!active) return
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      onEnter()
    }
    window.addEventListener('keydown', handler)
    const ctaTimer = setTimeout(() => setShowCTA(true), 3000)

    let last = performance.now()
    const animate = (now) => {
      const dt = (now - last) / 1000
      last = now
      state.current = state.current.map((s, i) => {
        const pixelsPerSec = 100 / YEAR_CONFIG[i].speed
        let newY = s.y + pixelsPerSec * s.dir * dt
        let newDir = s.dir
        if (newY >= 100) { newY = 100; newDir = -1 }
        if (newY <= 0)   { newY = 0;   newDir =  1 }
        return { y: newY, dir: newDir }
      })
      refs.current.forEach((el, i) => {
        if (el) el.style.top = `${state.current[i].y}%`
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)

    YEAR_CONFIG.forEach((c, i) => {
      const interval = 68 + i * 7
      countIntervals.current[i] = setInterval(() => {
        offsets.current[i] += 1
        if (offsets.current[i] > MAX_COUNT) offsets.current[i] = 0
        if (countRefs.current[i]) {
          countRefs.current[i].textContent = c.year + offsets.current[i]
        }
      }, interval)
    })

    return () => {
      window.removeEventListener('keydown', handler)
      cancelAnimationFrame(animRef.current)
      clearTimeout(ctaTimer)
      countIntervals.current.forEach(id => clearInterval(id))
    }
  }, [onEnter])

  return (
    <div onClick={onEnter} style={{
      position: 'fixed', inset: 0, background: '#1E1E1E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', overflow: 'hidden',
    }}>
      {YEAR_CONFIG.map((c, i) => (
        <span key={i} ref={el => refs.current[i] = el} style={{
          position: 'absolute',
          left: `${c.left}%`,
          top: `${state.current[i].y}%`,
          fontFamily: 'JacquardaBastarda9, cursive',
          fontSize: `${c.size}px`,
          color: 'rgba(242,237,228,0.5)',
          pointerEvents: 'none',
          userSelect: 'none',
          lineHeight: 1,
        }}>
          <span ref={el => countRefs.current[i] = el}>{c.year}</span>
        </span>
      ))}

      <h1 style={{
        fontFamily: 'JacquardaBastarda9, cursive',
        fontSize: 'clamp(56px,10vw,96px)',
        color: '#FFFFFF',
        letterSpacing: '0.01em',
        position: 'relative', zIndex: 2,
        textAlign: 'center', lineHeight: 1,
      }}>
        Bibelots
      </h1>

      {showCTA && (
        <p style={{
          position: 'absolute', bottom: '48px',
          fontFamily: 'Inconsolata, monospace',
          fontSize: '11px', color: '#F2EDE4',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 600,
          animation: 'fadeIn 0.8s ease forwards',
          zIndex: 2,
          border: '1px solid rgba(242,237,228,0.5)',
          padding: '9px 22px',
          borderRadius: '99px',
          opacity: 0.85,
        }}>
          click anywhere to begin
        </p>
      )}
    </div>
  )
}
