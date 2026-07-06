import { useEffect, useRef } from 'react'

// Fewer dates, bigger, scattered including centre
const DATES = [
  { text: '1947', size: 22, speed: 0.18, startY: 20,  left: 18,  dir: 1  },
  { text: '1800', size: 18, speed: 0.28, startY: 55,  left: 42,  dir: -1 },
  { text: '1526', size: 24, speed: 0.14, startY: 75,  left: 68,  dir: 1  },
  { text: '2006', size: 16, speed: 0.32, startY: 35,  left: 78,  dir: -1 },
  { text: '1350', size: 20, speed: 0.22, startY: 60,  left: 28,  dir: 1  },
  { text: '1945', size: 26, speed: 0.12, startY: 15,  left: 55,  dir: -1 },
  { text: '1707', size: 17, speed: 0.25, startY: 82,  left: 8,   dir: 1  },
  { text: '2001', size: 19, speed: 0.20, startY: 45,  left: 88,  dir: -1 },
  { text: '1600', size: 15, speed: 0.30, startY: 30,  left: 50,  dir: 1  },
  { text: '1999', size: 21, speed: 0.16, startY: 68,  left: 35,  dir: -1 },
]

export default function Splash({ onEnter }) {
  const refs = useRef([])
  const animRef = useRef(null)
  const state = useRef(DATES.map(d => ({ y: d.startY, dir: d.dir })))

  useEffect(() => {
    const handler = () => onEnter()
    window.addEventListener('keydown', handler)

    const animate = () => {
      state.current = state.current.map((s, i) => {
        const d = DATES[i]
        let newY = s.y + d.speed * s.dir * 0.22
        let newDir = s.dir
        if (newY > 90) newDir = -1
        if (newY < 5)  newDir =  1
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
        <span key={i} ref={el => refs.current[i] = el} style={{
          position: 'absolute',
          left: `${date.left}%`,
          top: `${date.startY}%`,
          fontFamily: 'Inconsolata, monospace',
          fontSize: `${date.size}px`,
          color: '#6A6A62',
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
