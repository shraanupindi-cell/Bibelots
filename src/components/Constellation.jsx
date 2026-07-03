import { useEffect, useState } from 'react'
import { findKnownConnections, findInferredConnections, connCountMap } from '../connections'
import { getAxisScores } from '../archetypes'

const EMOTION_RING = {
  nostalgia: 0.42,
  comfort: 0.42,
  pride: 0.58,
  curiosity: 0.72,
  wonder: 0.88,
  unease: 0.97,
}

// Stroke color based on connection count
function strokeColor(count) {
  if (count >= 6) return '#D4C4BF'
  if (count >= 4) return '#C0B0A8'
  if (count >= 2) return '#909088'
  return '#686860'
}

// Era determines fill vs no fill
// ancient (0), medieval (1), early modern (2) → solid fill
// colonial (3), mid-century (4), contemporary (5) → no fill (outline only)
function nodeFill(eraRank, stroke) {
  const rank = eraRank ?? 5
  if (rank <= 2) return stroke // solid — older objects
  if (rank === 3) return 'rgba(212,196,191,0.25)' // colonial — semi
  return 'none' // contemporary / mid-century — outline only
}

function nodeStrokeWidth(eraRank) {
  const rank = eraRank ?? 5
  if (rank <= 2) return 1.5
  if (rank === 3) return 1
  return 0.7
}

function textColor(eraRank, stroke) {
  const rank = eraRank ?? 5
  if (rank <= 2) return '#1E1E1E' // dark text on solid fill
  return stroke // light text on no fill
}

export default function Constellation({ trinkets, onReveal }) {
  const [showKnown, setShowKnown] = useState(true)
  const [showInferred, setShowInferred] = useState(true)
  const [selectedConn, setSelectedConn] = useState(null)
  const [axesAnimated, setAxesAnimated] = useState(false)
  const [view, setView] = useState('map')

  const knownConns = findKnownConnections(trinkets)
  const inferredConns = findInferredConnections(trinkets)
  const activeConns = [
    ...(showKnown ? knownConns : []),
    ...(showInferred ? inferredConns : []),
  ]
  const counts = connCountMap(trinkets)
  const axes = getAxisScores(trinkets)

  useEffect(() => { setTimeout(() => setAxesAnimated(true), 300) }, [])

  const W = 580, H = 520, cx = 290, cy = 255
  const MAX_R = 210

  const emotionGroups = {}
  trinkets.forEach(t => {
    const ring = EMOTION_RING[t.emotion] || 0.72
    if (!emotionGroups[ring]) emotionGroups[ring] = []
    emotionGroups[ring].push(t)
  })

  const pos = {}
  const ringKeys = Object.keys(emotionGroups).sort()
  ringKeys.forEach((ring, ri) => {
    const group = emotionGroups[ring]
    const r = parseFloat(ring) * MAX_R
    group.forEach((t, i) => {
      const baseAngle = ri * 1.1
      const angle = baseAngle + (i / group.length) * 2 * Math.PI - Math.PI / 2
      pos[t.id] = {
        x: Math.round(cx + r * Math.cos(angle)),
        y: Math.round(cy + r * Math.sin(angle)),
      }
    })
  })

  const nodeRadius = id => 13 + (counts[id] || 0) * 3

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1E1E1E' }}>

      {view === 'map' ? (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        }}>
          {/* Toggles */}
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
            <button onClick={() => { setView('analysis'); setTimeout(() => setAxesAnimated(true), 200) }} style={{
              padding: '3px 14px', borderRadius: '99px',
              border: '0.5px solid #3A3A3A',
              background: 'none', color: '#787870',
              fontFamily: 'Inconsolata, monospace', fontSize: '10px',
              letterSpacing: '0.06em', cursor: 'pointer',
            }}>analysis →</button>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', marginBottom: '8px' }}>
            {[
              { label: 'ancient–early modern', style: { width: 10, height: 10, borderRadius: '50%', background: '#909088', border: '1.5px solid #909088' } },
              { label: 'colonial', style: { width: 10, height: 10, borderRadius: '50%', background: 'rgba(212,196,191,0.25)', border: '1px solid #909088' } },
              { label: 'modern–contemporary', style: { width: 10, height: 10, borderRadius: '50%', background: 'none', border: '0.7px solid #686860' } },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={item.style} />
                <span style={{ fontFamily: 'Inconsolata, monospace', fontSize: '9px', color: '#686860', letterSpacing: '0.04em' }}>{item.label}</span>
              </div>
            ))}
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '600px', maxHeight: '68vh' }}>
            {/* Dashed rings */}
            {[0.42, 0.58, 0.72, 0.88].map((rv, i) => (
              <circle key={i} cx={cx} cy={cy} r={Math.round(rv * MAX_R)}
                fill="none" stroke="#2A2A2A" strokeWidth="0.5" strokeDasharray="3 5" />
            ))}

            {/* Spokes */}
            {trinkets.map(t => {
              const p = pos[t.id]
              if (!p) return null
              const dx = p.x-cx, dy = p.y-cy, d = Math.sqrt(dx*dx+dy*dy)
              const nr = nodeRadius(t.id)
              return <line key={t.id}
                x1={Math.round(cx+(dx/d)*30)} y1={Math.round(cy+(dy/d)*30)}
                x2={Math.round(p.x-(dx/d)*nr)} y2={Math.round(p.y-(dy/d)*nr)}
                stroke="#2A2A2A" strokeWidth="0.5" />
            })}

            {/* Connections */}
            {activeConns.map((c, i) => {
              const p1 = pos[c.ids[0]], p2 = pos[c.ids[1]]
              if (!p1 || !p2) return null
              const mx = Math.round((p1.x+p2.x)/2)
              const my = Math.round((p1.y+p2.y)/2) - 6
              return (
                <g key={i} onClick={() => setSelectedConn(selectedConn===c ? null : c)} style={{ cursor: 'pointer' }}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={selectedConn===c ? '#D4C4BF' : '#686860'}
                    strokeWidth={selectedConn===c ? 1.2 : 0.7}
                    strokeDasharray={c.inferred ? '4 3' : undefined}
                    opacity={0.8} />
                  <text x={mx} y={my} textAnchor="middle"
                    fontSize="7" fill="#484840"
                    fontFamily="Inconsolata, monospace" fontStyle="italic">
                    connection
                  </text>
                </g>
              )
            })}

            {/* You node */}
            <circle cx={cx} cy={cy} r={30} fill="#D4C4BF" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
              fontSize="11" fill="#1E1E1E"
              fontFamily="Inconsolata, monospace" fontWeight="500">You</text>

            {/* Trinket nodes */}
            {trinkets.map(t => {
              const p = pos[t.id]
              if (!p) return null
              const nr = nodeRadius(t.id)
              const cc = counts[t.id] || 0
              const stroke = strokeColor(cc)
              const fill = nodeFill(t.era_rank, stroke)
              const sw = nodeStrokeWidth(t.era_rank)
              const tc = textColor(t.era_rank, stroke)
              const words = t.name.split(' ')
              const l1 = words.slice(0,2).join(' ')
              const l2 = words.length > 2 ? words.slice(2).join(' ') : null
              const angle = Math.atan2(p.y-cy, p.x-cx)
              const lx = Math.round(p.x + Math.cos(angle)*(nr+16))
              const ly = Math.round(p.y + Math.sin(angle)*(nr+11))
              return (
                <g key={t.id}>
                  <circle cx={p.x} cy={p.y} r={nr}
                    fill={fill} stroke={stroke} strokeWidth={sw} />
                  <text x={p.x} y={p.y+(l2?-4:0)} textAnchor="middle"
                    dominantBaseline="central" fontSize="7" fill={tc}
                    fontFamily="Inconsolata, monospace" fontWeight="500">{l1}</text>
                  {l2 && <text x={p.x} y={p.y+7} textAnchor="middle"
                    dominantBaseline="central" fontSize="7" fill={tc}
                    fontFamily="Inconsolata, monospace">{l2}</text>}
                  {t.date && <text x={lx} y={ly} textAnchor="middle"
                    fontSize="9" fill="#686860"
                    fontFamily="Inconsolata, monospace">{t.date}</text>}
                </g>
              )
            })}
          </svg>

          {/* Connection tooltip */}
          {selectedConn && (() => {
            const a = trinkets.find(t => t.id === selectedConn.ids[0])
            const b = trinkets.find(t => t.id === selectedConn.ids[1])
            return (
              <div style={{
                position: 'absolute', bottom: '76px',
                background: '#141414', border: '0.5px solid #3A3A3A',
                borderRadius: '6px', padding: '12px 16px',
                maxWidth: '360px', textAlign: 'center',
                animation: 'fadeUp 0.2s ease forwards',
              }}>
                <div style={{ fontSize: '11px', color: '#F0EDE8', fontFamily: 'Inconsolata, monospace', marginBottom: '5px', fontWeight: 500 }}>
                  {a?.name} × {b?.name}
                </div>
                <div style={{ fontSize: '10px', color: '#D4C4BF', fontFamily: 'Inconsolata, monospace', marginBottom: '4px', fontStyle: 'italic' }}>
                  {selectedConn.label}
                </div>
                {selectedConn.detail && (
                  <div style={{ fontSize: '10px', color: '#787070', fontFamily: 'Inconsolata, monospace', lineHeight: 1.7 }}>
                    {selectedConn.detail}
                  </div>
                )}
                <button onClick={() => setSelectedConn(null)} style={{
                  marginTop: '8px', background: 'none', border: 'none',
                  color: '#585850', fontSize: '10px', cursor: 'pointer',
                  fontFamily: 'Inconsolata, monospace',
                }}>dismiss</button>
              </div>
            )
          })()}

          <button onClick={onReveal} style={{
            marginTop: '14px', padding: '10px 36px',
            borderRadius: '12px', border: '0.5px solid #F0EDE8',
            background: 'none', color: '#F0EDE8',
            fontFamily: 'JacquardaBastarda9, cursive',
            fontSize: '20px', cursor: 'pointer', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='#F0EDE8'; e.currentTarget.style.color='#1E1E1E' }}
            onMouseLeave={e => { e.currentTarget.style.background='none'; e.currentTarget.style.color='#F0EDE8' }}
          >
            Reveal Archetype
          </button>
        </div>

      ) : (
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
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 400, color: '#F0EDE8',
            marginBottom: '3rem', letterSpacing: '0.04em',
          }}>Analysis</h2>

          <div style={{ width: '100%', maxWidth: '560px' }}>
            {axes.map(a => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '22px' }}>
                <div style={{
                  fontFamily: 'Inconsolata, monospace', fontSize: '11px',
                  color: '#F0EDE8', width: '180px', flexShrink: 0, letterSpacing: '0.04em',
                }}>{a.label}</div>
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
                }}>{a.value}</div>
              </div>
            ))}
          </div>

          <button onClick={onReveal} style={{
            marginTop: '2rem', padding: '10px 36px',
            borderRadius: '12px', border: '0.5px solid #F0EDE8',
            background: 'none', color: '#F0EDE8',
            fontFamily: 'JacquardaBastarda9, cursive',
            fontSize: '20px', cursor: 'pointer',
          }}>Reveal Archetype</button>
        </div>
      )}
    </div>
  )
}
