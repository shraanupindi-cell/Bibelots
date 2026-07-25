import { useEffect, useRef, useState } from 'react'

// 10 years, each with position, speed, direction
const YEAR_CONFIG = [
  { year: 1947, left: 6,  speed: 13, size: 28 },
  { year: 1800, left: 18, speed: 17, size: 22 },
  { year: 1526, left: 32, speed: 11, size: 32 },
  { year: 2006, left: 44, speed: 19, size: 18 },
  { year: 1350, left: 56, speed: 15, size: 26 },
  { year: 1945, left: 68, speed: 21, size: 20 },
  { year: 1707, left: 78, speed: 12, size: 24 },
  { year: 2001, left: 88, speed: 18, size: 16 },
  { year: 1600, left: 25, speed: 14, size: 30 },
  { year: 1999, left: 92, speed: 16, size: 22 },
]

export default function Splash({ onEnter }) {
  const refs = useRef([])
  const animRef = useRef(null)
  const countRefs = useRef([])
  const countIntervals = useRef([])
  const [showCTA, setShowCTA] = useState(false)

  // Each traverses full height linearly
  const state = useRef(YEAR_CONFIG.map((c, i) => ({
    y: Math.random() * 100,
    dir: Math.random() > 0.5 ? 1 : -1,
  })))

  // Counting numbers — tick indefinitely at their own interval
  const counts = useRef(YEAR_CONFIG.map(c => c.year))

  useEffect(() => {
    const handler = () => onEnter()
    window.addEventListener('keydown', handler)

    // CTA appears after 3s
    const ctaTimer = setTimeout(() => setShowCTA(true), 3000)

    // Linear traversal animation
    let last = performance.now()
    const animate = (now) => {
      const dt = (now - last) / 1000
      last = now
      state.current = state.current.map((s, i) => {
        const pixelsPerSec = 100 / YEAR_CONFIG[i].speed
        let newY = s.y + pixelsPerSec * s.dir * dt
        let newDir = s.dir
        if (newY >= 100) { newY = 100; newDir = -1 }
        if (newY <= 0) { newY = 0; newDir = 1 }
        return { y: newY, dir: newDir }
      })
      refs.current.forEach((el, i) => {
        if (el) el.style.top = `${state.current[i].y}%`
      })
      animRef.current = requestAnimationFrame(animate)
    }
    animRef.current = requestAnimationFrame(animate)

    // Counting — each ticks at its own interval (68–135ms)
    YEAR_CONFIG.forEach((c, i) => {
      const interval = 68 + i * 7
      countIntervals.current[i] = setInterval(() => {
        counts.current[i] += 1
        if (countRefs.current[i]) {
          countRefs.current[i].textContent = counts.current[i]
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
      position:'fixed', inset:0, background:'#C41A1A',
      display:'flex', flexDirection:'column',
      alignItems:'center', justifyContent:'center',
      cursor:'pointer', overflow:'hidden',
    }}>
      {YEAR_CONFIG.map((c, i) => (
        <span key={i} ref={el => refs.current[i] = el} style={{
          position:'absolute',
          left:`${c.left}%`,
          top:`${state.current[i].y}%`,
          fontFamily:'JacquardaBastarda9, cursive',
          fontSize:`${c.size}px`,
          color:'rgba(0,0,0,0.25)',
          pointerEvents:'none',
          userSelect:'none',
          lineHeight:1,
        }}>
          <span ref={el => countRefs.current[i] = el}>{c.year}</span>
        </span>
      ))}

      <h1 style={{
        fontFamily:'JacquardaBastarda9, cursive',
        fontSize:'clamp(56px,10vw,96px)',
        color:'#F2EDE4',
        letterSpacing:'0.01em',
        position:'relative', zIndex:2,
        textAlign:'center', lineHeight:1,
        textShadow:'0 2px 20px rgba(0,0,0,0.3)',
      }}>
        Bibelots
      </h1>

      {showCTA && (
        <p style={{
          position:'absolute', bottom:'48px',
          fontFamily:'Inconsolata, monospace',
          fontSize:'14px', color:'#F2EDE4',
          letterSpacing:'0.18em',
          textTransform:'uppercase',
          fontWeight:600,
          animation:'fadeIn 0.8s ease forwards',
          zIndex:2,
          border:'1px solid rgba(242,237,228,0.6)',
          padding:'10px 24px',
          borderRadius:'99px',
        }}>
          click anywhere to begin
        </p>
      )}
    </div>
  )
}
