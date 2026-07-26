import { useEffect, useState, useRef } from 'react'
import { scoreArchetype } from '../archetypes'
import { supabase } from '../supabase'

export default function Reveal({ trinkets, onBack, sessionId }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saved, setSaved] = useState(false)
  const [collections, setCollections] = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const revealRef = useRef(null)
  const result = scoreArchetype(trinkets)

  useEffect(() => { setTimeout(() => setVisible(true), 80) }, [])

  // Load saved collections from localStorage
  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem('bibelots_collections') || '[]')
      setCollections(stored)
    } catch(e) {}
  }, [])

  if (!result) return null
  const winner = result.ranked[0], second = result.ranked[1]

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSave = () => {
    try {
      const stored = JSON.parse(localStorage.getItem('bibelots_collections') || '[]')
      const entry = {
        id: Date.now(),
        savedAt: new Date().toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }),
        archetype: winner.name,
        count: trinkets.length,
        trinkets,
      }
      stored.unshift(entry)
      localStorage.setItem('bibelots_collections', JSON.stringify(stored.slice(0, 10)))
      setCollections(stored.slice(0, 10))
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch(e) {}
  }

  const handleScreenshot = () => {
    const existing = document.getElementById('h2c-script')
    const doCapture = () => {
      if (!window.html2canvas || !revealRef.current) return
      window.html2canvas(revealRef.current, { backgroundColor: '#E8E0D0', scale: 2 }).then(canvas => {
        const link = document.createElement('a')
        link.download = `bibelots-${winner.name.replace(/\s+/g, '-').toLowerCase()}.png`
        link.href = canvas.toDataURL('image/png')
        link.click()
      })
    }
    if (existing) { doCapture() } else {
      const script = document.createElement('script')
      script.id = 'h2c-script'
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js'
      script.onload = doCapture
      document.head.appendChild(script)
    }
  }

  const sub = {
    display: 'block',
    fontFamily: 'Inconsolata, monospace',
    fontSize: '9px', color: '#6A6050',
    letterSpacing: '0.16em', textTransform: 'uppercase',
    marginBottom: '10px', fontWeight: 700,
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#E8E0D0', overflowY: 'auto' }}>
      <div ref={revealRef} style={{
        maxWidth: '580px', width: '100%', margin: '0 auto',
        padding: '4rem 2rem 2rem',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease',
      }}>

        <span style={sub}>your collector archetype</span>

        <h1 style={{
          fontFamily: 'JacquardaBastarda9, cursive',
          fontSize: 'clamp(44px, 8vw, 76px)',
          color: '#1A1A14', marginBottom: '1.2rem', lineHeight: 1.05,
        }}>
          {winner.name}
        </h1>

        <p style={{
          fontFamily: 'Inconsolata, monospace',
          fontSize: '14px', color: '#4A4030',
          fontStyle: 'italic', marginBottom: '2rem', lineHeight: 1.9,
          letterSpacing: '0.02em',
        }}>
          {winner.tagline}
        </p>

        <p style={{
          fontFamily: 'Inconsolata, monospace',
          fontSize: '13px', color: '#3A3020',
          lineHeight: 2, marginBottom: '2.5rem',
          letterSpacing: '0.01em',
        }}>
          {winner.description}
        </p>

        <div style={{ borderTop: '0.5px solid #C8C0A8', paddingTop: '1.6rem', marginBottom: '1.6rem' }}>
          <span style={sub}>the tension</span>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '13px', color: '#5A5040', fontStyle: 'italic', lineHeight: 1.9 }}>
            {winner.tension}
          </p>
        </div>

        <div style={{ borderTop: '0.5px solid #C8C0A8', paddingTop: '1.6rem', marginBottom: '2.5rem' }}>
          <span style={sub}>what drives you</span>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '13px', color: '#3A3020', lineHeight: 1.9 }}>
            {winner.motivation}
          </p>
        </div>

        {/* Second archetype */}
        <div style={{
          border: '0.5px solid #C8C0A8', borderRadius: '6px',
          padding: '20px 24px', marginBottom: '2.5rem',
        }}>
          <span style={{ ...sub, marginBottom: '8px' }}>second archetype — {second.score}/100</span>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '15px', fontWeight: 600, color: '#1A1A14', marginBottom: '6px', letterSpacing: '0.01em' }}>
            {second.name}
          </p>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '12px', color: '#5A5040', fontStyle: 'italic', lineHeight: 1.8, marginBottom: '10px' }}>
            {second.tagline}
          </p>
          <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '11px', color: '#7A7060', lineHeight: 1.8 }}>
            Most collectors sit between two types. The tension between <strong style={{ color: '#1A1A14' }}>{winner.name}</strong> and <strong style={{ color: '#1A1A14' }}>{second.name}</strong> is often the most honest description.
          </p>
        </div>

        {/* Saved collections */}
        {collections.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <span style={sub}>your saved collections</span>
            {collections.map(c => (
              <div key={c.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '10px 0', borderBottom: '0.5px solid #C8C0A8',
                fontFamily: 'Inconsolata, monospace',
              }}>
                <div>
                  <span style={{ fontSize: '12px', color: '#2A2010', fontWeight: 500 }}>{c.archetype}</span>
                  <span style={{ fontSize: '10px', color: '#8A8070', marginLeft: '10px' }}>{c.count} objects</span>
                </div>
                <span style={{ fontSize: '10px', color: '#8A8070' }}>{c.savedAt}</span>
              </div>
            ))}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <button onClick={onBack} style={{ padding: '9px 18px', borderRadius: '99px', border: '0.5px solid #8A8070', background: 'none', color: '#6A6050', fontFamily: 'Inconsolata, monospace', fontSize: '11px', letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s' }}>
            ← map
          </button>
          <button onClick={handleSave} style={{ padding: '9px 18px', borderRadius: '99px', border: '0.5px solid #2A2010', background: '#2A2010', color: '#E8E0D0', fontFamily: 'Inconsolata, monospace', fontSize: '11px', letterSpacing: '0.06em', cursor: 'pointer', fontWeight: 600, transition: 'all 0.2s' }}>
            {saved ? 'saved ✓' : 'save collection'}
          </button>
          <button onClick={handleShare} style={{ padding: '9px 18px', borderRadius: '99px', border: '0.5px solid #2A2010', background: 'none', color: '#2A2010', fontFamily: 'Inconsolata, monospace', fontSize: '11px', letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s' }}>
            {copied ? 'copied ✓' : 'share link'}
          </button>
          <button onClick={handleScreenshot} style={{ padding: '9px 18px', borderRadius: '99px', border: '0.5px solid #2A2010', background: 'none', color: '#2A2010', fontFamily: 'Inconsolata, monospace', fontSize: '11px', letterSpacing: '0.06em', cursor: 'pointer', transition: 'all 0.2s' }}>
            save image
          </button>
        </div>

        <p style={{ fontFamily: 'Inconsolata, monospace', fontSize: '9px', color: '#9A9080', letterSpacing: '0.06em', lineHeight: 1.7 }}>
          save collection stores your archive in this browser — return anytime to pick up where you left off.
        </p>
      </div>
    </div>
  )
}
