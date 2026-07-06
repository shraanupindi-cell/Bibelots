import { useEffect, useRef } from 'react'

const DATES = [
  { text: '2000', size: 13, speed: 0.4, startY: 15 },
  { text: '1947', size: 16, speed: 0.25, startY: 70 },
  { text: '2016', size: 11, speed: 0.55, startY: 40 },
  { text: '1969', size: 15, speed: 0.35, startY: 85 },
  { text: '1800', size: 13, speed: 0.45, startY: 25 },
  { text: '2006', size: 11, speed: 0.3, startY: 60 },
  { text: '1999', size: 17, speed: 0.2, startY: 10 },
  { text: '1986', size: 12, speed: 0.5, startY: 75 },
  { text: '1350', size: 14, speed: 0.38, startY: 50 },
  { text: '1526', size: 16, speed: 0.28, startY: 30 },
  { text: '1707', size: 12, speed: 0.42, startY: 90 },
  { text: '1857', size: 14, speed: 0.33, startY: 20 },
  { text: '1600', size: 11, speed: 0.48, startY: 65 },
  { text: '1480', size: 15, speed: 0.22, startY: 45 },
  { text: '1200', size: 13, speed: 0.52, startY: 80 },
  { text: '1940', size: 12, speed: 0.36, startY: 55 },
  { text: '1945', size: 16, speed: 0.27, startY: 35 },
  { text: '2001', size: 11, speed: 0.44, startY: 8 },
]

// X positions spread across screen, avoiding centre
const X_POSITIONS = [4, 8, 14, 20, 74, 80, 86, 91, 96, 6, 11, 17, 77, 83, 89, 93, 3, 95]

export default function Splash({ onEnter }) {
  const refs = useRef([])
  const animRef = useRef(null)
  const positions = useRef(DATES.map((d, i) => d.startY))

  useEffect(() => {
    const handler = () => onEnter()
    window.addEventListener('keydown', handler)

    // Animate each date independently — slow continuous vertical travel
    let frame = 0
    const animate = () => {
      frame++
      positions.current = positions.current.map((y, i) => {
        const d = DATES[i]
        // Each date moves at its own constant speed, looping 0→100
        let newY = y - d.speed * 0.3
        if (newY < -5) newY = 105 // reset to bottom when off top
        return newY
      })

      refs.current.forEach((el, i) => {
        if (el) el.style.top = `${positions.current[i]}%`
      })

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)
    return () => {
      window.removeEventListener('keydown', handler)
      cancelAnimationFrame(animRef.current)
    }
  }, [onEnter])

  return (
    <div onClick={onEnter} style={{
      position: 'fixed', inset: 0, background: '#1E1E1E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', overflow: 'hidden',
    }}>
      {DATES.map((date, i) => (
        <span
          key={i}
          ref={el => refs.current[i] = el}
          style={{
            position: 'absolute',
            left: `${X_POSITIONS[i % X_POSITIONS.length]}%`,
            top: `${date.startY}%`,
            fontFamily: 'Inconsolata, monospace',
            fontSize: `${date.size}px`,
            color: '#787870',
            pointerEvents: 'none',
            userSelect: 'none',
            letterSpacing: '0.04em',
            transition: 'none',
          }}>
          {date.text}
        </span>
      ))}

      <h1 style={{
        fontFamily: 'JacquardaBastarda9, cursive',
        fontSize: 'clamp(52px, 9vw, 90px)',
        color: '#F0EDE8',
        letterSpacing: '0.01em',
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
        lineHeight: 1,
      }}>
        Bibelots
      </h1>

      <p style={{
        position: 'absolute', bottom: '36px',
        fontFamily: 'Inconsolata, monospace',
        fontSize: '10px', color: '#787870',
        letterSpacing: '0.14em',
        animation: 'blink 2.2s ease-in-out infinite',
        zIndex: 2, textTransform: 'uppercase',
      }}>
        click to begin
      </p>
    </div>
  )
}
