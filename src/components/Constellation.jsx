import { useEffect, useRef, useState } from 'react'
import { findKnownConnections, findInferredConnections, connCountMap } from '../connections'
import { getAxisScores } from '../archetypes'

export default function Constellation({ trinkets, onReveal }) {
  const [showKnown, setShowKnown] = useState(true)
  const [showInferred, setShowInferred] = useState(true)
  const [selectedConn, setSelectedConn] = useState(null)
  const [axesAnimated, setAxesAnimated] = useState(false)
  const svgRef = useRef(null)

  const knownConns = findKnownConnections(trinkets)
  const inferredConns = findInferredConnections(trinkets)
  const activeConns = [
    ...(showKnown ? knownConns : []),
    ...(showInferred ? inferredConns : []),
  ]
  const counts = connCountMap(trinkets)
  const axes = getAxisScores(trinkets)

  useEffect(() => {
    setTimeout(() => setAxesAnimated(true), 200)
  }, [])

  const W = 460, H = 420, cx = 230, cy = 210
  const r = Math.min(W, H) * 0.36
  const n = trinkets.length

  const pos = {}
  trinkets.forEach((t, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2
    pos[t.id] = { x: Math.round(cx + r * Math.cos(angle)), y: Math.round(cy + r * Math.sin(angle)) }
  })

  const nodeRadius = (id) => 13 + (counts[id] || 0) * 2.5

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1E1E1E', display: 'flex' }}>

      {/* Left — map */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '1.5rem', borderRight: '0.5px solid #3A3A3A',
      }}>
        {/* Toggles */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          {[
            { key: 'known', label: 'known', val: showKnown, set: setShowKnown },
            { key: 'inferred', label: 'inferred', val: showInferred, set: setShowInferred },
          ].map(t => (
            <button key={t.key} onClick={() => t.set(v => !v)} style={{
              padding: '4px 14px',
              border: `0.5px solid ${t.val ? '#F0EDE8' : '#3A3A3A'}`,
              borderRadius: '99px',
              background: 'none',
              color: t.val ? '#F0EDE8' : '#888880',
              fontFamily: 'Inconsolata, monospace',
              fontSize: '10px', letterSpacing: '0.06em',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* SVG */}
        <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '480px' }}>
          {/* Ring guides */}
          {[r * 0.38, r * 0.68, r].map((rv, i) => (
            <circle key={i} cx={cx} cy={cy} r={Math.round(rv)} fill="none" stroke="#2A2A2A" strokeWidth="0.5" strokeDasharray="3 5" />
          ))}

          {/* Spokes */}
          {trinkets.map(t => {
            const p = pos[t.id]
            const dx = p.x - cx, dy = p.y - cy, d = Math.sqrt(dx * dx + dy * dy)
            const nr = nodeRadius(t.id)
            return <line key={t.id}
              x1={Math.round(cx + (dx / d) * 28)} y1={Math.round(cy + (dy / d) * 28)}
              x2={Math.round(p.x - (dx / d) * nr)} y2={Math.round(p.y - (dy / d) * nr)}
              stroke="#2A2A2A" strokeWidth="0.5"
            />
          })}

          {/* Connections */}
          {activeConns.map((c, i) => {
            const p1 = pos[c.ids[0]], p2 = pos[c.ids[1]]
            if (!p1 || !p2) return null
            const mx = Math.round((p1.x + p2.x) / 2), my = Math.round((p1.y + p2.y) / 2) - 7
            return (
              <g key={i} onClick={() => setSelectedConn(c)} style={{ cursor: 'pointer' }}>
                <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                  stroke={selectedConn === c ? '#F0EDE8' : '#686860'}
                  strokeWidth={selectedConn === c ? 1.2 : 0.8}
                  opacity={0.75}
                  strokeDasharray={c.inferred ? '4 3' : undefined}
                />
                <text x={mx} y={my} textAnchor="middle"
                  fontSize="7" fill="#585850"
                  fontFamily="Inconsolata, monospace" fontStyle="italic"
                >
                  {c.label.length > 24 ? c.label.substring(0, 22) + '…' : c.label}
                </text>
              </g>
            )
          })}

          {/* You node */}
          <circle cx={cx} cy={cy} r={26} fill="#1E1E1E" stroke="#686060" strokeWidth="0.5" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            fontSize="10" fill="#D9C9C4" fontFamily="Inconsolata, monospace">You</text>

          {/* Trinket nodes */}
          {trinkets.map(t => {
            const p = pos[t.id]
            const nr = nodeRadius(t.id)
            const words = t.name.split(' ')
            const l1 = words.slice(0, 2).join(' ')
            const l2 = words.length > 2 ? words.slice(2).join(' ') : null
            const angle = Math.atan2(p.y - cy, p.x - cx)
            const lx = Math.round(p.x + Math.cos(angle) * (nr + 16))
            const ly = Math.round(p.y + Math.sin(angle) * (nr + 10))
            return (
              <g key={t.id}>
                <circle cx={p.x} cy={p.y} r={nr} fill="#1E1E1E" stroke="#D9C9C4" strokeWidth="0.8" />
                <text x={p.x} y={p.y + (l2 ? -4 : 0)} textAnchor="middle" dominantBaseline="central"
                  fontSize="7" fill="#D9C9C4" fontFamily="Inconsolata, monospace" fontWeight="500">
                  {l1}
                </text>
                {l2 && <text x={p.x} y={p.y + 7} textAnchor="middle" dominantBaseline="central"
                  fontSize="7" fill="#888880" fontFamily="Inconsolata, monospace">
                  {l2}
                </text>}
                {t.date && <text x={lx} y={ly} textAnchor="middle"
                  fontSize="8" fill="#585850" fontFamily="Inconsolata, monospace">
                  {t.date}
                </text>}
              </g>
            )
          })}
        </svg>

        {/* Legend */}
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#888880', fontFamily: 'Inconsolata, monospace' }}>
            <div style={{ width: '20px', height: '1px', background: '#686860' }} />known
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: '#888880', fontFamily: 'Inconsolata, monospace' }}>
            <div style={{ width: '20px', height: '0', borderTop: '1px dashed #686860' }} />inferred
          </div>
        </div>
      </div>

      {/* Right — analysis */}
      <div style={{
        width: '300px', display: 'flex', flexDirection: 'column',
        padding: '2rem 1.5rem', overflowY: 'auto',
      }}>
        <h2 style={{
          fontFamily: 'Inconsolata, monospace', fontSize: '20px',
          fontWeight: 500, color: '#F0EDE8',
          marginBottom: '1.8rem', letterSpacing: '0.04em',
        }}>
          Analysis
        </h2>

        {/* Axes */}
        {axes.map(a => (
          <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <div style={{ fontSize: '9px', color: '#888880', width: '110px', flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.04em', lineHeight: 1.4, fontFamily: 'Inconsolata, monospace' }}>
              {a.label}
            </div>
            <div style={{ flex: 1, height: '2px', background: '#3A3A3A' }}>
              <div style={{
                height: '100%', background: '#F0EDE8',
                width: axesAnimated ? `${a.value}%` : '0%',
                transition: 'width 1.2s cubic-bezier(.4,0,.2,1)',
              }} />
            </div>
            <div style={{ fontSize: '11px', color: '#F0EDE8', width: '28px', textAlign: 'right', fontFamily: 'Inconsolata, monospace' }}>
              {a.value}
            </div>
          </div>
        ))}

        {/* Selected connection detail */}
        {selectedConn && (
          <div style={{
            marginTop: '1.5rem', padding: '12px 14px',
            border: '0.5px solid #3A3A3A', borderRadius: '4px',
            animation: 'fadeUp 0.3s ease forwards',
          }}>
            <div style={{ fontSize: '10px', color: '#888880', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px', fontFamily: 'Inconsolata, monospace' }}>
              {selectedConn.inferred ? 'inferred connection' : 'known connection'}
            </div>
            <div style={{ fontSize: '12px', color: '#F0EDE8', marginBottom: '6px', fontFamily: 'Inconsolata, monospace', fontWeight: 500 }}>
              {selectedConn.label}
            </div>
            {selectedConn.detail && (
              <div style={{ fontSize: '11px', color: '#888880', lineHeight: 1.7, fontFamily: 'Inconsolata, monospace' }}>
                {selectedConn.detail}
              </div>
            )}
            <button onClick={() => setSelectedConn(null)} style={{
              marginTop: '8px', background: 'none', border: 'none',
              color: '#585850', fontSize: '10px', cursor: 'pointer',
              fontFamily: 'Inconsolata, monospace',
            }}>
              dismiss
            </button>
          </div>
        )}

        {/* Reveal button */}
        <div style={{ marginTop: 'auto', paddingTop: '2rem' }}>
          <button onClick={onReveal} style={{
            display: 'block', width: '100%', padding: '12px 0',
            border: '0.5px solid #F0EDE8', borderRadius: '99px',
            background: 'none', color: '#F0EDE8',
            fontFamily: 'UnifrakturMaguntia, cursive',
            fontSize: '20px', letterSpacing: '0.04em',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.target.style.background = '#F0EDE8'; e.target.style.color = '#1E1E1E' }}
            onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#F0EDE8' }}
          >
            Reveal Archetype
          </button>
        </div>
      </div>
    </div>
  )
}
