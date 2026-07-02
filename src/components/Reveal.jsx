import { useEffect, useState } from 'react'
import { scoreArchetype } from '../archetypes'

export default function Reveal({ trinkets, onBack }) {
  const [visible, setVisible] = useState(false)
  const result = scoreArchetype(trinkets)

  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  if (!result) return null
  const winner = result.ranked[0]
  const second = result.ranked[1]

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#D4C4BF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflowY: 'auto', padding: '2rem',
    }}>
      <div style={{
        maxWidth: '600px', width: '100%', textAlign: 'center',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'opacity 1s ease, transform 1s ease',
      }}>
        <p style={{
          fontFamily: 'Inconsolata, monospace',
          fontSize: '9px', color: '#8A7A77',
          letterSpacing: '0.16em', textTransform: 'uppercase',
          marginBottom: '2rem',
        }}>
          your collector archetype
        </p>

        <h1 style={{
          fontFamily: 'JacquardaBastarda9, cursive',
          fontSize: 'clamp(40px, 7vw, 72px)',
          color: '#1E1E1E',
          marginBottom: '1.5rem', lineHeight: 1.05,
        }}>
          {winner.name}
        </h1>

        <p style={{
          fontFamily: 'Inconsolata, monospace',
          fontSize: '12px', color: '#3A2A27',
          lineHeight: 1.9, marginBottom: '0',
          maxWidth: '480px', margin: '0 auto',
        }}>
          {winner.description}
        </p>

        <div style={{ marginTop: '2.5rem', display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={onBack} style={{
            padding: '8px 24px', borderRadius: '99px',
            border: '0.5px solid #1E1E1E', background: 'none', color: '#1E1E1E',
            fontFamily: 'Inconsolata, monospace', fontSize: '11px',
            letterSpacing: '0.08em', cursor: 'pointer',
          }}>
            ← back to map
          </button>
        </div>

        {/* Second archetype — subtle */}
        <div style={{
          marginTop: '2.5rem', paddingTop: '1.5rem',
          borderTop: '0.5px solid #B8A8A4',
        }}>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '9px', color: '#8A7A77', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px' }}>
            second archetype — {second.score}/100
          </p>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '13px', color: '#2A1A17', marginBottom: '4px', fontWeight: 600 }}>
            {second.name}
          </p>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '11px', color: '#6A5A57', fontStyle: 'italic', lineHeight: 1.7 }}>
            {second.tagline}
          </p>
        </div>
      </div>
    </div>
  )
}
