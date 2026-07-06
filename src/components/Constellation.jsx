import { useEffect, useState, useMemo } from 'react'
import { findKnownConnections, findInferredConnections, connCountMap } from '../connections'
import { getAxisScores } from '../archetypes'

// Random but stable fill per trinket id
function getNodeFill(id, index) {
  const fills = [
    '#F0EDE8',                       // solid white
    '#F0EDE8',                       // solid white (weighted more)
    'rgba(240,237,232,0.45)',         // semi
    'none',                           // outline
    'none',                           // outline (weighted more)
    'rgba(240,237,232,0.2)',          // ghost
  ]
  // Use index to deterministically assign fill so it doesn't change on re-render
  return fills[index % fills.length]
}

function getTextFill(fill) {
  if (fill === '#F0EDE8') return '#1E1E1E'
  return '#F0EDE8'
}

const CONN_STYLE = {
  historical:  '#C8C4C0',
  geographic:  '#A8C4B8',
  material:    '#C4B8A8',
  personal:    '#D4C4BF',
  emotional:   '#B8A8C4',
  acquisition: '#A8B8C4',
  cultural:    '#C4A8A8',
  functional:  '#B8C4A8',
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

  const W = 600, H = 540, cx = 300, cy = 265
  const MAX_R = 225

  // Sort trinkets by era rank to assign rings relatively
  // oldest (lowest era_rank) = outermost, newest = innermost
  const sorted = useMemo(() => {
    return [...trinkets].sort((a, b) => (a.era_rank ?? 5) - (b.era_rank ?? 5))
  }, [trinkets])

  // Assign ring position based on relative rank in THIS collection
  const eraGroups = useMemo(() => {
    const groups = {}
    sorted.forEach(t => {
      const rank = t.era_rank ?? 5
      if (!groups[rank]) groups[rank] = []
      groups[rank].push(t)
    })
    return groups
  }, [sorted])

  const uniqueRanks = Object.keys(eraGroups).map(Number).sort((a,b) => a - b)
  const numRanks = uniqueRanks.length

  const pos = useMemo(() => {
    const p = {}
    uniqueRanks.forEach((rank, rankIndex) => {
      const group = eraGroups[rank]
      // outermost = oldest (rankIndex 0), innermost = newest (rankIndex n-1)
      // Map rankIndex to ring: 0 → MAX_R, last → MIN_R
      const MIN_R = MAX_R * 0.28
      const r = numRanks === 1
        ? MAX_R * 0.6
        : MAX_R - (rankIndex / (numRanks - 1)) * (MAX_R - MIN_R)

      group.forEach((t, i) => {
        const offset = rankIndex * 0.7
        const angle = offset + (i / group.length) * 2 * Math.PI - Math.PI / 2
        p[t.id] = {
          x: Math.round(cx + r * Math.cos(angle)),
          y: Math.round(cy + r * Math.sin(angle)),
        }
      })
    })
    return p
  }, [eraGroups, uniqueRanks, numRanks])

  const nodeRadius = id => 14 + (counts[id] || 0) * 3

  // Era label for ring — show oldest/newest labels only
  const eraLabels = { 0:'ancient', 1:'medieval', 2:'early modern', 3:'colonial', 4:'mid-century', 5:'contemporary' }

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#1E1E1E' }}>

      {view === 'map' ? (
        <div style={{
          position: 'fixed', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          padding: '0.5rem',
        }}>
          {/* Toggles */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { key: 'known', val: showKnown, set: setShowKnown },
              { key: 'inferred', val: showInferred, set: setShowInferred },
            ].map(t => (
              <button key={t.key} onClick={() => t.set(v => !v)} style={{
                padding: '4px 16px', borderRadius: '99px',
                border: `0.5px solid ${t.val ? '#F0EDE8' : '#3A3A3A'}`,
                background: 'none', color: t.val ? '#F0EDE8' : '#787870',
                fontFamily: 'Inconsolata, monospace', fontSize: '11px',
                letterSpacing: '0.06em', cursor: 'pointer',
              }}>{t.key}</button>
            ))}
            <button onClick={() => { setView('analysis'); setTimeout(() => setAxesAnimated(true), 200) }} style={{
              padding: '4px 16px', borderRadius: '99px',
              border: '0.5px solid #3A3A3A',
              background: 'none', color: '#909088',
              fontFamily: 'Inconsolata, monospace', fontSize: '11px',
              letterSpacing: '0.06em', cursor: 'pointer',
            }}>analysis →</button>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '620px', maxHeight: '66vh' }}>

            {/* Rings — one per unique era in collection */}
            {uniqueRanks.map((rank, rankIndex) => {
              const MIN_R = MAX_R * 0.28
              const r = numRanks === 1
                ? MAX_R * 0.6
                : MAX_R - (rankIndex / (numRanks - 1)) * (MAX_R - MIN_R)
              const isOldest = rankIndex === 0
              const isNewest = rankIndex === numRanks - 1
              return (
                <g key={rank}>
                  <circle cx={cx} cy={cy} r={Math.round(r)}
                    fill="none" stroke="#2A2A2A" strokeWidth="0.5" strokeDasharray="3 6" />
                  {(isOldest || isNewest) && (
                    <text
                      x={cx + Math.round(r) + 5} y={cy}
                      fontSize="8" fill="#404038"
                      fontFamily="Inconsolata, monospace"
                      dominantBaseline="central"
                      fontStyle="italic"
                    >
                      {isOldest ? `oldest — ${eraLabels[rank] || rank}` : `newest — ${eraLabels[rank] || rank}`}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Spokes */}
            {trinkets.map(t => {
              const p = pos[t.id]
              if (!p) return null
              const dx = p.x-cx, dy = p.y-cy, d = Math.sqrt(dx*dx+dy*dy)
              const nr = nodeRadius(t.id)
              return <line key={t.id}
                x1={Math.round(cx+(dx/d)*34)} y1={Math.round(cy+(dy/d)*34)}
                x2={Math.round(p.x-(dx/d)*nr)} y2={Math.round(p.y-(dy/d)*nr)}
                stroke="#2A2A2A" strokeWidth="0.5" />
            })}

            {/* Connections */}
            {activeConns.map((c, i) => {
              const p1 = pos[c.ids[0]], p2 = pos[c.ids[1]]
              if (!p1 || !p2) return null
              const color = c.inferred ? '#686860' : (CONN_STYLE[c.type] || '#C8C4C0')
              const dash = c.inferred ? '4 3' : undefined
              const mx = Math.round((p1.x+p2.x)/2)
              const my = Math.round((p1.y+p2.y)/2)
              const angle = Math.atan2(p2.y-p1.y, p2.x-p1.x) * 180 / Math.PI
              const adj = Math.abs(angle) > 90 ? angle + 180 : angle
              const label = c.label.length > 22 ? c.label.substring(0,20)+'…' : c.label
              return (
                <g key={i} onClick={() => setSelectedConn(selectedConn===c ? null : c)} style={{ cursor: 'pointer' }}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={selectedConn===c ? '#F0EDE8' : color}
                    strokeWidth={selectedConn===c ? 1.5 : 1}
                    strokeDasharray={dash}
                    opacity={0.85} />
                  <text x={mx} y={my} textAnchor="middle"
                    fontSize="8" fill={selectedConn===c ? '#F0EDE8' : color}
                    fontFamily="Inconsolata, monospace" fontStyle="italic"
                    transform={`rotate(${adj}, ${mx}, ${my})`} dy="-4">
                    {label}
                  </text>
                </g>
              )
            })}

            {/* You node */}
            <circle cx={cx} cy={cy} r={32} fill="#D4C4BF" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
              fontSize="12" fill="#1E1E1E"
              fontFamily="Inconsolata, monospace" fontWeight="600">You</text>

            {/* Trinket nodes — random fill */}
            {trinkets.map((t, idx) => {
              const p = pos[t.id]
              if (!p) return null
              const nr = nodeRadius(t.id)
              const fill = getNodeFill(t.id, idx)
              const tc = getTextFill(fill)
              const words = t.name.split(' ')
              const l1 = words.slice(0,2).join(' ')
              const l2 = words.length > 2 ? words.slice(2).join(' ') : null
              const angle = Math.atan2(p.y-cy, p.x-cx)
              const lx = Math.round(p.x + Math.cos(angle)*(nr+18))
              const ly = Math.round(p.y + Math.sin(angle)*(nr+12))
              return (
                <g key={t.id}>
                  <circle cx={p.x} cy={p.y} r={nr}
                    fill={fill} stroke="#F0EDE8" strokeWidth="0.8" />
                  <text x={p.x} y={p.y+(l2?-4:0)} textAnchor="middle"
                    dominantBaseline="central" fontSize="8" fill={tc}
                    fontFamily="Inconsolata, monospace" fontWeight="500">{l1}</text>
                  {l2 && <text x={p.x} y={p.y+8} textAnchor="middle"
                    dominantBaseline="central" fontSize="8" fill={tc}
                    fontFamily="Inconsolata, monospace">{l2}</text>}
                  {t.date && <text x={lx} y={ly} textAnchor="middle"
                    fontSize="9" fill="#909088"
                    fontFamily="Inconsolata, monospace">{t.date}</text>}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="24" height="12"><line x1="0" y1="6" x2="24" y2="6" stroke="#C8C4C0" strokeWidth="1" /></svg>
              <span style={{ fontFamily: 'Inconsolata, monospace', fontSize: '9px', color: '#686860' }}>known connection</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <svg width="24" height="12"><line x1="0" y1="6" x2="24" y2="6" stroke="#686860" strokeWidth="1" strokeDasharray="4 3" /></svg>
              <span style={{ fontFamily: 'Inconsolata, monospace', fontSize: '9px', color: '#686860' }}>inferred connection</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ fontFamily: 'Inconsolata, monospace', fontSize: '9px', color: '#686860' }}>outer ring = oldest · inner ring = newest</span>
            </div>
          </div>

          {/* Selected connection detail */}
          {selectedConn && (() => {
            const a = trinkets.find(t => t.id === selectedConn.ids[0])
            const b = trinkets.find(t => t.id === selectedConn.ids[1])
            return (
              <div style={{
                position: 'absolute', bottom: '68px',
                background: '#141414', border: '0.5px solid #3A3A3A',
                borderRadius: '6px', padding: '12px 16px',
                maxWidth: '380px', textAlign: 'center',
                animation: 'fadeUp 0.2s ease forwards', zIndex: 10,
              }}>
                <div style={{ fontSize: '12px', color: '#F0EDE8', fontFamily: 'Inconsolata, monospace', marginBottom: '5px', fontWeight: 500 }}>
                  {a?.name} × {b?.name}
                </div>
                <div style={{ fontSize: '10px', color: '#D4C4BF', fontFamily: 'Inconsolata, monospace', marginBottom: '5px', fontStyle: 'italic' }}>
                  {selectedConn.label}
                </div>
                {selectedConn.detail && (
                  <div style={{ fontSize: '10px', color: '#909088', fontFamily: 'Inconsolata, monospace', lineHeight: 1.75 }}>
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
            marginTop: '10px', padding: '10px 36px',
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
            background: 'none', border: 'none', color: '#909088',
            fontFamily: 'Inconsolata, monospace', fontSize: '12px',
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
                  fontFamily: 'Inconsolata, monospace', fontSize: '12px',
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
