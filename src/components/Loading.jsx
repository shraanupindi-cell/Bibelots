import { useEffect, useState } from 'react'

const TRINKETS = [
  '/trinkets/t1.png',
  '/trinkets/t2.png',
  '/trinkets/t3.png',
  '/trinkets/t4.png',
  '/trinkets/t5.png',
]

export default function Loading() {
  const [frame, setFrame] = useState([0, 1, 2])

  useEffect(() => {
    const interval = setInterval(() => {
      const count = 3 + Math.floor(Math.random() * 3)
      const shuffled = [...TRINKETS].sort(() => Math.random() - 0.5)
      setFrame(shuffled.slice(0, count).map((_, i) => i))
    }, 120)
    return () => clearInterval(interval)
  }, [])

  const shuffled = [...TRINKETS].sort(() => 0.5 - Math.random())

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#2C2C2C',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: '32px',
    }}>
      <div style={{
        display: 'flex', gap: '20px', alignItems: 'center',
        justifyContent: 'center', minHeight: '120px',
      }}>
        {frame.map((idx, i) => (
          <img
            key={`${idx}-${i}-${Date.now()}`}
            src={TRINKETS[idx % TRINKETS.length]}
            alt=""
            style={{
              width: '90px', height: '90px',
              objectFit: 'contain',
              animation: 'flashIn 0.08s ease forwards',
              opacity: 0,
            }}
          />
        ))}
      </div>

      {/* Pixel dots */}
      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '5px', height: '5px',
            background: '#787870',
            imageRendering: 'pixelated',
            animation: `pulse 1.4s ease-in-out infinite`,
            animationDelay: `${i * 0.2}s`,
          }} />
        ))}
      </div>
    </div>
  )
}
