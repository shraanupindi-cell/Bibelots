import { useEffect } from 'react'

const DATES = ['2000','1947','2016','1969','1800','2006','1999','1986','1350','1526','1707','1857','1600','1480','1200','1940','1945','2001']

export default function Splash({ onEnter }) {
  useEffect(() => {
    const handler = () => onEnter()
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onEnter])

  return (
    <div onClick={onEnter} style={{
      position: 'fixed', inset: 0, background: '#2C2C2C',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      cursor: 'pointer', overflow: 'hidden',
    }}>
      {DATES.map((date, i) => (
        <span key={i} style={{
          position: 'absolute',
          left: `${(i * 43 + i * i * 5 + 7) % 86 + 4}%`,
          top: `${(i * 31 + i * 9 + 5) % 82 + 5}%`,
          fontFamily: 'Inconsolata, monospace',
          fontSize: '11px',
          color: '#787870',
          animation: `floatUpDown ${2.8 + (i % 4) * 0.6}s ease-in-out infinite`,
          animationDelay: `${(i * 0.35) % 2.8}s`,
          pointerEvents: 'none',
          userSelect: 'none',
          letterSpacing: '0.04em',
        }}>
          {date}
        </span>
      ))}

      <h1 style={{
        fontFamily: 'JacquardaBastarda9, cursive',
        fontSize: 'clamp(48px, 8vw, 82px)',
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
