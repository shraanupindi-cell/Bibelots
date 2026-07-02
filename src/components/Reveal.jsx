import { useEffect, useState } from 'react'
import { scoreArchetype } from '../archetypes'

export default function Reveal({ trinkets, onBack }) {
  const [visible, setVisible] = useState(false)
  const result = scoreArchetype(trinkets)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
  }, [])

  if (!result) return null
  const winner = result.ranked[0]
  const second = result.ranked[1]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#D9C9C4',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflowY: 'auto', padding: '2rem 1rem',
    }}>
      <div style={{
        maxWidth: '640px', width: '100%', textAlign: 'center', padding: '2rem',
        opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.8s ease, transform 0.8s ease',
      }}>

        <p style={{
          fontFamily: 'Inconsolata, monospace',
          fontSize: '10px', color: '#8A7A77',
          letterSpacing: '0.14em', textTransform: 'uppercase',
          marginBottom: '1.5rem',
        }}>
          your collector archetype
        </p>

        <h1 style={{
          fontFamily: 'UnifrakturMaguntia, cursive',
          fontSize: 'clamp(36px, 6vw, 68px)',
          color: '#1E1E1E',
          marginBottom: '1rem', lineHeight: 1.1,
        }}>
          {winner.name}
        </h1>

        <p style={{
          fontFamily: 'Inconsolata, monospace',
          fontSize: '13px', color: '#5A4A47',
          fontStyle: 'italic', marginBottom: '1.5rem', lineHeight: 1.8,
        }}>
          {winner.tagline}
        </p>

        <p style={{
          fontFamily: 'Inconsolata, monospace',
          fontSize: '12px', color: '#3A2A27',
          lineHeight: 1.9, marginBottom: '1.5rem',
        }}>
          {winner.description}
        </p>

        <div style={{
          borderTop: '0.5px solid #B0A0A0', paddingTop: '1.2rem', marginBottom: '1.2rem',
        }}>
          <p style={{ fontSize: '10px', color: '#8A7A77', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Inconsolata, monospace' }}>
            the tension
          </p>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '12px', color: '#5A4A47', fontStyle: 'italic', lineHeight: 1.8 }}>
            {winner.tension}
          </p>
        </div>

        <div style={{
          borderTop: '0.5px solid #B0A0A0', paddingTop: '1.2rem', marginBottom: '1.5rem',
        }}>
          <p style={{ fontSize: '10px', color: '#8A7A77', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Inconsolata, monospace' }}>
            what drives you
          </p>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '12px', color: '#3A2A27', lineHeight: 1.8 }}>
            {winner.motivation}
          </p>
        </div>

        {/* Second archetype */}
        <div style={{
          border: '0.5px dashed #B0A0A0', borderRadius: '4px',
          padding: '14px 18px', marginBottom: '2rem', textAlign: 'left',
        }}>
          <p style={{ fontSize: '10px', color: '#8A7A77', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Inconsolata, monospace' }}>
            your second archetype — {second.score}/100
          </p>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '13px', fontWeight: 600, color: '#1E1E1E', marginBottom: '4px' }}>
            {second.name}
          </p>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '11px', color: '#5A4A47', fontStyle: 'italic', lineHeight: 1.7 }}>
            {second.tagline}
          </p>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '11px', color: '#8A7A77', marginTop: '8px', lineHeight: 1.7 }}>
            Most collectors sit between two types. The tension between <strong style={{ color: '#1E1E1E', fontWeight: 600 }}>{winner.name}</strong> and <strong style={{ color: '#1E1E1E', fontWeight: 600 }}>{second.name}</strong> is often more revealing than either archetype alone.
          </p>
        </div>

        <button onClick={onBack} style={{
          padding: '9px 28px',
          border: '0.5px solid #1E1E1E', borderRadius: '99px',
          background: 'none', color: '#1E1E1E',
          fontFamily: 'Inconsolata, monospace',
          fontSize: '11px', letterSpacing: '0.08em',
          cursor: 'pointer', transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.target.style.background = '#1E1E1E'; e.target.style.color = '#D9C9C4' }}
          onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#1E1E1E' }}
        >
          ← back to map
        </button>
      </div>
    </div>
  )
}
