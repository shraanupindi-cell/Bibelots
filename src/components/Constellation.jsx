import { useEffect, useRef, useState } from 'react'
import { findKnownConnections, findInferredConnections, connCountMap } from '../connections'
import { getAxisScores } from '../archetypes'

export default function Constellation({ trinkets, onReveal }) {
  const [showKnown, setShowKnown] = useState(true)
  const [showInferred, setShowInferred] = useState(true)
  const [selectedConn, setSelectedConn] = useState(null)
  const [axesAnimated, setAxesAnimated] = useState(false)
  const [view, setView] = useState('map') // 'map' | 'analysis'

  const knownConns = findKnownConnections(trinkets)
  const inferredConns = findInferredConnections(trinkets)
  const activeConns = [
    ...(showKnown ? knownConns : []),
    ...(showInferred ? inferredConns : []),
  ]
  const counts = connCountMap(trinkets)
  const axes = getAxisScores(trinkets)

  useEffect(() => { setTimeout(() => setAxesAnimated(true), 300) }, [])

  const W = 560, H = 500, cx = 280, cy = 248
  const r = 185
  const n = trinkets.length

  const pos = {}
  trinkets.forEach((t, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    pos[t.id] = { x: Math.round(cx + r * Math.cos(angle)), y: Math.round(cy + r * Math.sin(angle)) }
  })

  const nodeRadius = id => 14 + (counts[id] || 0) * 3

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#2C2C2C' }}>

      {view === 'map' ? (
        <div style={{ position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

          {/* Toggle row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
            {[
              { key: 'known', val: showKnown, set: setShowKnown },
              { key: 'inferred', val: showInferred, set: setShowInferred },
            ].map(t => (
              <button key={t.key} onClick={() => t.set(v => !v)} style={{
                padding: '3px 14px', borderRadius: '99px',
                border: `0.5px solid ${t.val ? '#F0EDE8' : '#3A3A3A'}`,
                background: 'none', color: t.val ? '#F0EDE8' : '#787870',
                fontFamily: 'Inconsolata, monospace', fontSize: '10px',
                letterSpacing: '0.06em', cursor: 'pointer',
              }}>{t.key}</button>
            ))}
            <button onClick={() => setView('analysis')} style={{
              padding: '3px 14px', borderRadius: '99px',
              border: '0.5px solid #3A3A3A',
              background: 'none', color: '#787870',
              fontFamily: 'Inconsolata, monospace', fontSize: '10px',
              letterSpacing: '0.06em', cursor: 'pointer',
            }}>analysis →</button>
          </div>

          {/* Map SVG */}
          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '580px', maxHeight: '72vh' }}>
            {/* Dashed rings */}
            {[r * 0.36, r * 0.65, r].map((rv, i) => (
              <circle key={i} cx={cx} cy={cy} r={Math.round(rv)}
                fill="none" stroke="#3A3A3A" strokeWidth="0.5" strokeDasharray="3 5" />
            ))}

            {/* Spokes */}
            {trinkets.map(t => {
              const p = pos[t.id]
              const dx = p.x - cx, dy = p.y - cy, d = Math.sqrt(dx*dx+dy*dy)
              const nr = nodeRadius(t.id)
              return <line key={t.id}
                x1={Math.round(cx+(dx/d)*28)} y1={Math.round(cy+(dy/d)*28)}
                x2={Math.round(p.x-(dx/d)*nr)} y2={Math.round(p.y-(dy/d)*nr)}
                stroke="#3A3A3A" strokeWidth="0.5" />
            })}

            {/* Connections */}
            {activeConns.map((c, i) => {
              const p1 = pos[c.ids[0]], p2 = pos[c.ids[1]]
              if (!p1 || !p2) return null
              const mx = Math.round((p1.x+p2.x)/2), my = Math.round((p1.y+p2.y)/2) - 8
              const angle = Math.atan2(p2.y-p1.y, p2.x-p1.x) * 180 / Math.PI
              return (
                <g key={i} onClick={() => setSelectedConn(selectedConn===c ? null : c)} style={{ cursor: 'pointer' }}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={selectedConn===c ? '#D4C4BF' : '#686860'}
                    strokeWidth={selectedConn===c ? 1 : 0.7}
                    strokeDasharray={c.inferred ? '4 3' : undefined}
                    opacity={0.8} />
                  <text x={mx} y={my}
                    textAnchor="middle"
                    fontSize="7.5" fill="#585850"
                    fontFamily="Inconsolata, monospace"
                    fontStyle="italic"
                    transform={`rotate(${Math.abs(angle) > 90 ? angle+180 : angle}, ${mx}, ${my})`}>
                    connection
                  </text>
                </g>
              )
            })}

            {/* You node — blush filled */}
            <circle cx={cx} cy={cy} r={28} fill="#D4C4BF" stroke="none" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
              fontSize="11" fill="#2C2C2C" fontFamily="Inconsolata, monospace" fontWeight="500">
              You
            </text>

            {/* Trinket nodes */}
            {trinkets.map(t => {
              const p = pos[t.id]
              const nr = nodeRadius(t.id)
              const words = t.name.split(' ')
              const l1 = words.slice(0,2).join(' ')
              const l2 = words.length > 2 ? words.slice(2).join(' ') : null
              const angle = Math.atan2(p.y-cy, p.x-cx)
              const lx = Math.round(p.x + Math.cos(angle)*(nr+18))
              const ly = Math.round(p.y + Math.sin(angle)*(nr+12))
              return (
                <g key={t.id}>
                  <circle cx={p.x} cy={p.y} r={nr} fill="#1E1E1E" stroke="#F0EDE8" strokeWidth="0.7" />
                  <text x={p.x} y={p.y+(l2?-4:0)} textAnchor="middle" dominantBaseline="central"
                    fontSize="7" fill="#F0EDE8" fontFamily="Inconsolata, monospace" fontWeight="500">
                    {l1}
                  </text>
                  {l2 && <text x={p.x} y={p.y+7} textAnchor="middle" dominantBaseline="central"
                    fontSize="7" fill="#787870" fontFamily="Inconsolata, monospace">
                    {l2}
                  </text>}
                  {t.date && <text x={lx} y={ly} textAnchor="middle"
                    fontSize="9" fill="#686860" fontFamily="Inconsolata, monospace">
                    {t.date}
                  </text>}
                </g>
              )
            })}
          </svg>

          {/* Selected connection tooltip */}
          {selectedConn && (() => {
            const a = trinkets.find(t => t.id === selectedConn.ids[0])
            const b = trinkets.find(t => t.id === selectedConn.ids[1])
            return (
              <div style={{
                position: 'absolute', bottom: '80px',
                background: '#1E1E1E', border: '0.5px solid #3A3A3A',
                borderRadius: '6px', padding: '10px 14px',
                maxWidth: '340px', textAlign: 'center',
                animation: 'fadeUp 0.2s ease forwards',
              }}>
                <div style={{ fontSize: '11px', color: '#F0EDE8', fontFamily: 'Inconsolata, monospace', marginBottom: '4px', fontWeight: 500 }}>
                  {a?.name} × {b?.name}
                </div>
                {selectedConn.detail && (
                  <div style={{ fontSize: '10px', color: '#787870', fontFamily: 'Inconsolata, monospace', lineHeight: 1.7 }}>
                    {selectedConn.detail}
                  </div>
                )}
              </div>
            )
          })()}

          {/* Reveal Archetype button */}
          <button onClick={onReveal} style={{
            marginTop: '16px',
            padding: '10px 32px', borderRadius: '12px',
            border: '0.5px solid #F0EDE8',
            background: 'none', color: '#F0EDE8',
            fontFamily: 'JacquardaBastarda9, cursive',
            fontSize: '20px', letterSpacing: '0.02em',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F0EDE8'; e.currentTarget.style.color = '#2C2C2C' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = '#F0EDE8' }}
          >
            Reveal Archetype
          </button>
        </div>

      ) : (
        /* Analysis view */
        <div style={{
          position: 'fixed', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', padding: '3rem',
        }}>
          <button onClick={() => setView('map')} style={{
            position: 'absolute', top: '24px', left: '24px',
            background: 'none', border: 'none', color: '#787870',
            fontFamily: 'Inconsolata, monospace', fontSize: '11px',
            cursor: 'pointer', letterSpacing: '0.06em',
          }}>← map</button>

          <h2 style={{
            fontFamily: 'Inconsolata, monospace',
            fontSize: 'clamp(28px, 4vw, 42px)',
            fontWeight: 400, color: '#F0EDE8',
            marginBottom: '3rem', letterSpacing: '0.04em',
          }}>
            Analysis
          </h2>

          <div style={{ width: '100%', maxWidth: '560px' }}>
            {axes.map(a => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
                <div style={{
                  fontFamily: 'Inconsolata, monospace', fontSize: '11px',
                  color: '#F0EDE8', width: '180px', flexShrink: 0,
                  letterSpacing: '0.04em',
                }}>
                  {a.label}
                </div>
                <div style={{ flex: 1, height: '2px', background: '#3A3A3A' }}>
                  <div style={{
                    height: '100%', background: '#F0EDE8',
                    width: axesAnimated ? `${a.value}%` : '0%',
                    transition: 'width 1.4s cubic-bezier(.4,0,.2,1)',
                  }} />
                </div>
                <div style={{
                  fontFamily: 'Inconsolata, monospace', fontSize: '12px',
                  color: '#F0EDE8', width: '36px', textAlign: 'right', flexShrink: 0,
                }}>
                  {a.value}
                </div>
              </div>
            ))}
          </div>

          <button onClick={onReveal} style={{
            marginTop: '2rem',
            padding: '10px 32px', borderRadius: '12px',
            border: '0.5px solid #F0EDE8',
            background: 'none', color: '#F0EDE8',
            fontFamily: 'JacquardaBastarda9, cursive',
            fontSize: '20px', letterSpacing: '0.02em',
            cursor: 'pointer',
          }}>
            Reveal Archetype
          </button>
        </div>
      )}
    </div>
  )
}
