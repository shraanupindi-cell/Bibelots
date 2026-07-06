import { useEffect, useRef } from 'react'

const DATES = [
  { text: '2000', size: 13, speed: 0.3,  startY: 15,  left: 6  },
  { text: '1947', size: 16, speed: 0.18, startY: 70,  left: 12 },
  { text: '2016', size: 11, speed: 0.42, startY: 40,  left: 19 },
  { text: '1969', size: 15, speed: 0.22, startY: 85,  left: 75 },
  { text: '1800', size: 13, speed: 0.35, startY: 25,  left: 82 },
  { text: '2006', size: 11, speed: 0.25, startY: 60,  left: 88 },
  { text: '1999', size: 17, speed: 0.15, startY: 10,  left: 93 },
  { text: '1986', size: 12, speed: 0.38, startY: 75,  left: 5  },
  { text: '1350', size: 14, speed: 0.28, startY: 50,  left: 96 },
  { text: '1526', size: 16, speed: 0.2,  startY: 30,  left: 9  },
  { text: '1707', size: 12, speed: 0.32, startY: 90,  left: 78 },
  { text: '1857', size: 14, speed: 0.24, startY: 20,  left: 85 },
  { text: '1600', size: 11, speed: 0.36, startY: 65,  left: 15 },
  { text: '1480', size: 15, speed: 0.17, startY: 45,  left: 91 },
  { text: '1200', size: 13, speed: 0.4,  startY: 80,  left: 3  },
  { text: '1940', size: 12, speed: 0.27, startY: 55,  left: 72 },
  { text: '1945', size: 16, speed: 0.21, startY: 35,  left: 97 },
  { text: '2001', size: 11, speed: 0.33, startY: 8,   left: 23 },
]

export default function Splash({ onEnter }) {
  const refs = useRef([])
  const animRef = useRef(null)
  // Each date has position and direction (1 = down, -1 = up)
  const state = useRef(DATES.map(d => ({ y: d.startY, dir: Math.random() > 0.5 ? 1 : -1 })))

  useEffect(() => {
    const handler = () => onEnter()
    window.addEventListener('keydown', handler)

    const animate = () => {
      state.current = state.current.map((s, i) => {
        const d = DATES[i]
        let newY = s.y + d.speed * s.dir * 0.25
        let newDir = s.dir
        // Bounce — reverse direction at bounds
        if (newY > 92) { newDir = -1 }
        if (newY < 4)  { newDir =  1 }
        return { y: newY, dir: newDir }
      })

      refs.current.forEach((el, i) => {
        if (el) el.style.top = `${state.current[i].y}%`
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
            left: `${date.left}%`,
            top: `${date.startY}%`,
            fontFamily: 'Inconsolata, monospace',
            fontSize: `${date.size}px`,
            color: '#787870',
            pointerEvents: 'none',
            userSelect: 'none',
            letterSpacing: '0.04em',
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
