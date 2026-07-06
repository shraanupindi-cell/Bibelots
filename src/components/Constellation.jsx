import { useEffect, useState, useMemo } from 'react'
import { findKnownConnections, findInferredConnections, connCountMap } from '../connections'
import { getAxisScores } from '../archetypes'

// Parse year from date string
function parseYear(dateStr) {
  if (!dateStr) return null
  const match = String(dateStr).match(/\d{3,4}/)
  return match ? parseInt(match[0]) : null
}

// Random but stable fill per index
function getNodeFill(index) {
  const fills = ['#F0EDE8', '#F0EDE8', 'rgba(240,237,232,0.5)', 'none', 'none', 'rgba(240,237,232,0.2)']
  return fills[index % fills.length]
}

function getTextFill(fill) {
  return fill === '#F0EDE8' ? '#1E1E1E' : '#F0EDE8'
}

const CONN_COLORS = {
  historical: '#D4D0CC', geographic: '#B8D4C8', material: '#D4C8B8',
  personal: '#E0D4CF', emotional: '#C8B8D4', acquisition: '#B8C8D4',
  cultural: '#D4B8B8', functional: '#C8D4B8', inferred: '#888880',
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
  const MAX_R = 230, MIN_R = 65

  // Get year from each trinket — try date field first, fallback to era_rank
  const ERA_YEAR = { 0: 300, 1: 1000, 2: 1650, 3: 1900, 4: 1960, 5: 2010 }

  const trinketYears = useMemo(() => {
    return trinkets.map(t => {
      const y = parseYear(t.date)
      return y || ERA_YEAR[t.era_rank ?? 5] || 2000
    })
  }, [trinkets])

  const minYear = useMemo(() => Math.min(...trinketYears), [trinketYears])
  const maxYear = useMemo(() => Math.max(...trinketYears), [trinketYears])

  // Position: oldest = outermost, newest = innermost
  // Group same-year trinkets on same ring
  const yearGroups = useMemo(() => {
    const groups = {}
    trinkets.forEach((t, i) => {
      const y = trinketYears[i]
      if (!groups[y]) groups[y] = []
      groups[y].push(t)
    })
    return groups
  }, [trinkets, trinketYears])

  const pos = useMemo(() => {
    const p = {}
    const range = maxYear - minYear || 1
    Object.entries(yearGroups).forEach(([year, group], gi) => {
      // Map year to radius: oldest → MAX_R, newest → MIN_R
      const t = (parseInt(year) - minYear) / range
      const r = MAX_R - t * (MAX_R - MIN_R)
      group.forEach((t, i) => {
        const offset = gi * 0.8
        const angle = offset + (i / group.length) * 2 * Math.PI - Math.PI / 2
        p[t.id] = {
          x: Math.round(cx + r * Math.cos(angle)),
          y: Math.round(cy + r * Math.sin(angle)),
        }
      })
    })
    return p
  }, [yearGroups, minYear, maxYear])

  const nodeRadius = id => 15 + (counts[id] || 0) * 3

  // Unique years sorted for ring labels
  const sortedYears = useMemo(() =>
    [...new Set(trinketYears)].sort((a,b) => a-b), [trinketYears])

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
              border: '0.5px solid #3A3A3A', background: 'none', color: '#909088',
              fontFamily: 'Inconsolata, monospace', fontSize: '11px',
              letterSpacing: '0.06em', cursor: 'pointer',
            }}>analysis →</button>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: '620px', maxHeight: '66vh' }}>

            {/* Rings — one per unique year in collection */}
            {sortedYears.map((year, yi) => {
              const range = maxYear - minYear || 1
              const t = (year - minYear) / range
              const r = MAX_R - t * (MAX_R - MIN_R)
              const isOldest = yi === 0
              const isNewest = yi === sortedYears.length - 1
              return (
                <g key={year}>
                  <circle cx={cx} cy={cy} r={Math.round(r)}
                    fill="none" stroke="#303030" strokeWidth="0.8" strokeDasharray="3 6" />
                  {(isOldest || isNewest) && (
                    <text x={cx + Math.round(r) + 6} y={cy}
                      fontSize="9" fill="#505048"
                      fontFamily="Inconsolata, monospace"
                      dominantBaseline="central" fontStyle="italic">
                      {isOldest ? `oldest` : `newest`}
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
                stroke="#404040" strokeWidth="0.8" />
            })}

            {/* Connections */}
            {activeConns.map((c, i) => {
              const p1 = pos[c.ids[0]], p2 = pos[c.ids[1]]
              if (!p1 || !p2) return null
              const color = c.inferred ? CONN_COLORS.inferred : (CONN_COLORS[c.type] || '#D4D0CC')
              const dash = c.inferred ? '5 3' : undefined
              const mx = Math.round((p1.x+p2.x)/2)
              const my = Math.round((p1.y+p2.y)/2)
              const angle = Math.atan2(p2.y-p1.y, p2.x-p1.x) * 180 / Math.PI
              const adj = Math.abs(angle) > 90 ? angle + 180 : angle
              const label = c.label.length > 22 ? c.label.substring(0,20)+'…' : c.label
              return (
                <g key={i} onClick={() => setSelectedConn(selectedConn===c ? null : c)} style={{ cursor: 'pointer' }}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={selectedConn===c ? '#FFFFFF' : color}
                    strokeWidth={selectedConn===c ? 2 : 1.2}
                    strokeDasharray={dash}
                    opacity={1} />
                  <text x={mx} y={my} textAnchor="middle"
                    fontSize="9" fill={selectedConn===c ? '#FFFFFF' : color}
                    fontFamily="Inconsolata, monospace" fontStyle="italic"
                    transform={`rotate(${adj}, ${mx}, ${my})`} dy="-5">
                    {label}
                  </text>
                </g>
              )
            })}

            {/* You node */}
            <circle cx={cx} cy={cy} r={34} fill="#D4C4BF" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
              fontSize="13" fill="#1E1E1E"
              fontFamily="Inconsolata, monospace" fontWeight="600">You</text>

            {/* Trinket nodes */}
            {trinkets.map((t, idx) => {
              const p = pos[t.id]
              if (!p) return null
              const nr = nodeRadius(t.id)
              const fill = getNodeFill(idx)
              const tc = getTextFill(fill)
              const stroke = '#D4D0CC'
              const sw = fill === '#F0EDE8' ? 1.5 : 1
              const words = t.name.split(' ')
              const l1 = words.slice(0,2).join(' ')
              const l2 = words.length > 2 ? words.slice(2).join(' ') : null
              const angle = Math.atan2(p.y-cy, p.x-cx)
              const lx = Math.round(p.x + Math.cos(angle)*(nr+18))
              const ly = Math.round(p.y + Math.sin(angle)*(nr+12))
              return (
                <g key={t.id}>
                  <circle cx={p.x} cy={p.y} r={nr}
                    fill={fill} stroke={stroke} strokeWidth={sw} />
                  <text x={p.x} y={p.y+(l2?-4:0)} textAnchor="middle"
                    dominantBaseline="central" fontSize="9" fill={tc}
                    fontFamily="Inconsolata, monospace" fontWeight="500">{l1}</text>
                  {l2 && <text x={p.x} y={p.y+9} textAnchor="middle"
                    dominantBaseline="central" fontSize="9" fill={tc}
                    fontFamily="Inconsolata, monospace">{l2}</text>}
                  {t.date && <text x={lx} y={ly} textAnchor="middle"
                    fontSize="10" fill="#A0A098"
                    fontFamily="Inconsolata, monospace">{t.date}</text>}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center', marginTop: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="28" height="12"><line x1="0" y1="6" x2="28" y2="6" stroke="#D4D0CC" strokeWidth="1.2" /></svg>
              <span style={{ fontFamily: 'Inconsolata, monospace', fontSize: '10px', color: '#787870' }}>known</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="28" height="12"><line x1="0" y1="6" x2="28" y2="6" stroke="#888880" strokeWidth="1.2" strokeDasharray="5 3" /></svg>
              <span style={{ fontFamily: 'Inconsolata, monospace', fontSize: '10px', color: '#787870' }}>inferred</span>
            </div>
            <span style={{ fontFamily: 'Inconsolata, monospace', fontSize: '10px', color: '#606058' }}>outer = oldest · inner = newest</span>
          </div>

          {/* Connection tooltip */}
          {selectedConn && (() => {
            const a = trinkets.find(t => t.id === selectedConn.ids[0])
            const b = trinkets.find(t => t.id === selectedConn.ids[1])
            return (
              <div style={{
                position: 'absolute', bottom: '72px',
                background: '#141414', border: '0.5px solid #404040',
                borderRadius: '6px', padding: '12px 16px',
                maxWidth: '380px', textAlign: 'center',
                animation: 'fadeUp 0.2s ease forwards', zIndex: 10,
              }}>
                <div style={{ fontSize: '12px', color: '#F0EDE8', fontFamily: 'Inconsolata, monospace', marginBottom: '5px', fontWeight: 500 }}>
                  {a?.name} × {b?.name}
                </div>
                <div style={{ fontSize: '11px', color: '#D4C4BF', fontFamily: 'Inconsolata, monospace', marginBottom: '5px', fontStyle: 'italic' }}>
                  {selectedConn.label}
                </div>
                {selectedConn.detail && (
                  <div style={{ fontSize: '10px', color: '#909088', fontFamily: 'Inconsolata, monospace', lineHeight: 1.75 }}>
                    {selectedConn.detail}
                  </div>
                )}
                <button onClick={() => setSelectedConn(null)} style={{
                  marginTop: '8px', background: 'none', border: 'none',
                  color: '#606058', fontSize: '10px', cursor: 'pointer',
                  fontFamily: 'Inconsolata, monospace',
                }}>dismiss</button>
              </div>
            )
          })()}

          <button onClick={onReveal} style={{
            marginTop: '10px', padding: '10px 36px',
            borderRadius: '12px', border: '1px solid #F0EDE8',
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
            fontFamily: 'Inconsolata, monospace', fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 400, color: '#F0EDE8', marginBottom: '3rem', letterSpacing: '0.04em',
          }}>Analysis</h2>

          <div style={{ width: '100%', maxWidth: '560px' }}>
            {axes.map(a => (
              <div key={a.label} style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '22px' }}>
                <div style={{ fontFamily: 'Inconsolata, monospace', fontSize: '12px', color: '#F0EDE8', width: '180px', flexShrink: 0, letterSpacing: '0.04em' }}>{a.label}</div>
                <div style={{ flex: 1, height: '2px', background: '#3A3A3A' }}>
                  <div style={{ height: '100%', background: '#F0EDE8', width: axesAnimated ? `${a.value}%` : '0%', transition: 'width 1.4s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <div style={{ fontFamily: 'Inconsolata, monospace', fontSize: '12px', color: '#F0EDE8', width: '36px', textAlign: 'right', flexShrink: 0 }}>{a.value}</div>
              </div>
            ))}
          </div>

          <button onClick={onReveal} style={{
            marginTop: '2rem', padding: '10px 36px', borderRadius: '12px',
            border: '1px solid #F0EDE8', background: 'none', color: '#F0EDE8',
            fontFamily: 'JacquardaBastarda9, cursive', fontSize: '20px', cursor: 'pointer',
          }}>Reveal Archetype</button>
        </div>
      )}
    </div>
  )
}
