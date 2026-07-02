import { useEffect } from 'react'

const DATES = ['1600', '1945', '1800', '1947', '1500s', '2006', '1940', '1999', '1200', '2018', '1350', '1620', '1750', '2001', '1480', '1857', '1707', '1526']

export default function Splash({ onEnter }) {
  useEffect(() => {
    const handler = () => onEnter()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onEnter])

  return (
    <div onClick={onEnter} style={{
      position: 'fixed', inset: 0, background: '#1E1E1E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', overflow: 'hidden',
    }}>
      {/* Floating dates */}
      {DATES.map((date, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${8 + (i * 37 + i * i * 3) % 84}%`,
          top: `${5 + (i * 29 + i * 7) % 85}%`,
          fontFamily: 'Inconsolata, monospace',
          fontSize: '11px',
          color: '#888880',
          animation: `floatUpDown ${3 + (i % 3)}s ease-in-out infinite`,
          animationDelay: `${(i * 0.4) % 3}s`,
          pointerEvents: 'none',
          userSelect: 'none',
        }}>
          {date}
        </span>
      ))}

      {/* Title */}
      <h1 style={{
        fontFamily: 'UnifrakturMaguntia, cursive',
        fontSize: 'clamp(52px, 9vw, 96px)',
        color: '#F0EDE8',
        letterSpacing: '0.02em',
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
      }}>
        Bibelots
      </h1>

      {/* Three dots */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '20px', position: 'relative', zIndex: 2 }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#888880',
            animation: `pulse 1.4s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }} />
        ))}
      </div>

      {/* Enter hint */}
      <p style={{
        position: 'absolute', bottom: '40px',
        fontFamily: 'Inconsolata, monospace',
        fontSize: '11px', color: '#888880',
        letterSpacing: '0.12em',
        animation: 'blink 2s ease-in-out infinite',
        zIndex: 2,
      }}>
        click or press any key to begin
      </p>
    </div>
  )
}
