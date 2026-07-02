import { useEffect, useState } from 'react'

const TRINKET_EMOJIS = ['🐘', '🪙', '👜', '🔑', '🏺', '✏️', '📿', '🪬', '🗝️', '🏵️', '🪆', '🧿', '🪩', '🎴', '🏮']

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default function Loading() {
  const [frame, setFrame] = useState([])

  useEffect(() => {
    const interval = setInterval(() => {
      const count = 3 + Math.floor(Math.random() * 3)
      setFrame(shuffle(TRINKET_EMOJIS).slice(0, count))
    }, 130)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#1E1E1E',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ display: 'flex', gap: '14px', alignItems: 'center', marginBottom: '28px', minHeight: '80px' }}>
        {frame.map((emoji, i) => (
          <div key={i} style={{
            width: '68px', height: '68px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '38px',
            border: '0.5px solid #3A3A3A',
            borderRadius: '2px',
            animation: 'flashIn 0.08s ease forwards',
          }}>
            {emoji}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[0, 0.2, 0.4].map((delay, i) => (
          <div key={i} style={{
            width: '5px', height: '5px', borderRadius: '50%',
            background: '#888880',
            animation: `pulse 1.4s ease-in-out infinite`,
            animationDelay: `${delay}s`,
          }} />
        ))}
      </div>
    </div>
  )
}
