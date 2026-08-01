import { useEffect, useState, useMemo, useRef } from 'react'
import { findKnownConnections, findInferredConnections, connCountMap } from '../connections'
import { getAxisScores } from '../archetypes'

function parseYear(d) { const m = String(d||'').match(/\d{3,4}/); return m ? parseInt(m[0]) : null }

function getNodeFill(index) {
  const fills = ['#E8E0D0','#E8E0D0','rgba(232,224,208,0.45)','none','none','rgba(232,224,208,0.18)']
  return fills[index % fills.length]
}
function getTextFill(fill) { return fill === '#E8E0D0' ? '#1A1A1A' : '#E8E0D0' }

const LINE_STYLES = {
  historical:  { w:2.5, dash:undefined,    op:0.9 },
  geographic:  { w:1,   dash:'6 3',        op:0.85 },
  material:    { w:1.5, dash:'2 2',        op:0.8 },
  personal:    { w:3,   dash:undefined,    op:0.7 },
  emotional:   { w:1,   dash:'8 2 2 2',   op:0.75 },
  acquisition: { w:2,   dash:'4 4',        op:0.8 },
  cultural:    { w:1.5, dash:'1 3',        op:0.85 },
  functional:  { w:2,   dash:'6 2 1 2',   op:0.8 },
  conceptual:  { w:1.5, dash:'3 2 1 2',   op:0.8 },
  economic:    { w:2,   dash:'5 2',        op:0.8 },
  inferred:    { w:1,   dash:'3 5',        op:0.6 },
}

function spreadNodes(rawPos, minDist, iters=80) {
  const pos = Object.fromEntries(Object.entries(rawPos).map(([k,v])=>[k,{x:v.x,y:v.y}]))
  const ids = Object.keys(pos)
  for(let it=0;it<iters;it++) {
    let moved = false
    for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++) {
      const a=pos[ids[i]],b=pos[ids[j]]
      const dx=b.x-a.x,dy=b.y-a.y,dist=Math.sqrt(dx*dx+dy*dy)
      if(dist<minDist&&dist>0){
        const push=(minDist-dist)/2,nx=dx/dist,ny=dy/dist
        pos[ids[i]]={x:a.x-nx*push,y:a.y-ny*push}
        pos[ids[j]]={x:b.x+nx*push,y:b.y+ny*push}
        moved=true
      }
    }
    if(!moved) break
  }
  return pos
}

export default function Constellation({ trinkets, onReveal, onBack }) {
  const [showKnown, setShowKnown] = useState(true)
  const [showInferred, setShowInferred] = useState(true)
  const [selectedConn, setSelectedConn] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [axesAnimated, setAxesAnimated] = useState(false)
  const [view, setView] = useState('map')

  // Node entry animation
  const [visibleNodes, setVisibleNodes] = useState([])
  const [visibleConns, setVisibleConns] = useState([])
  const [nodeProgress, setNodeProgress] = useState({})

  // Orbital drift
  const [orbitAngle, setOrbitAngle] = useState(0)
  const orbitRef = useRef(null)

  // AI connections
  const [aiConns, setAiConns] = useState([])
  const [aiLoading, setAiLoading] = useState(false)

  // First-use tip
  const [showTip, setShowTip] = useState(() => !localStorage.getItem('bib_tip'))

  // Ripple
  const [ripple, setRipple] = useState({ id:null, r:0 })
  const rippleRef = useRef(null)

  const knownConns = findKnownConnections(trinkets)
  const inferredConns = findInferredConnections(trinkets)

  const activeConns = useMemo(() => {
    const base = [
      ...(showKnown ? knownConns : []),
      ...(showInferred ? inferredConns : []),
    ]
    if (!showInferred) return base
    const seen = new Set(base.map(c=>`${Math.min(...c.ids)}-${Math.max(...c.ids)}`))
    const aiFiltered = aiConns.filter(c => {
      const k = `${Math.min(...c.ids)}-${Math.max(...c.ids)}`
      return !seen.has(k)
    })
    return [...base, ...aiFiltered]
  }, [showKnown, showInferred, trinkets, aiConns])

  const counts = connCountMap(trinkets)
  const axes = getAxisScores(trinkets)

  // Axes animation
  useEffect(() => { setTimeout(() => setAxesAnimated(true), 300) }, [view])

  // AI fetch
  useEffect(() => {
    if (trinkets.length < 2) return
    const key = 'bib_ai_' + [...trinkets.map(t=>String(t.id))].sort().join('_')
    const cached = sessionStorage.getItem(key)
    if (cached) { try { setAiConns(JSON.parse(cached)); return } catch(e){} }
    setAiLoading(true)
    fetch('/api/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ trinkets })
    })
    .then(r => r.json())
    .then(data => {
      if (!data.connections) return
      const mapped = data.connections.map(c => {
        const needle1 = (c.object1||'').toLowerCase()
        const needle2 = (c.object2||'').toLowerCase()
        const a = trinkets.find(t => t.name.toLowerCase() === needle1 || needle1.includes(t.name.toLowerCase().split(' ')[0]))
        const b = trinkets.find(t => t.name.toLowerCase() === needle2 || needle2.includes(t.name.toLowerCase().split(' ')[0]))
        if (!a || !b || a.id === b.id) return null
        return { ids:[a.id,b.id], type:c.type||'cultural', label:c.label, detail:c.detail, inferred:true, ai:true }
      }).filter(Boolean)
      setAiConns(mapped)
      sessionStorage.setItem(key, JSON.stringify(mapped))
    })
    .catch(() => {})
    .finally(() => setAiLoading(false))
  }, [trinkets.length])

  // Orbital drift — runs continuously
  useEffect(() => {
    const start = performance.now()
    const tick = (now) => {
      const elapsed = (now - start) / 1000
      setOrbitAngle(elapsed * (2 * Math.PI / 40)) // 40s per orbit
      orbitRef.current = requestAnimationFrame(tick)
    }
    orbitRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(orbitRef.current)
  }, [])

  // Node entry animation
  useEffect(() => {
    if (view !== 'map') return
    setVisibleNodes([])
    setVisibleConns([])
    setNodeProgress({})
    const timers = []
    trinkets.forEach((t, i) => {
      timers.push(setTimeout(() => {
        setVisibleNodes(v => [...v, i])
        const start = performance.now()
        const dur = 2400
        const anim = (now) => {
          const p = Math.min((now - start) / dur, 1)
          const eased = 1 - Math.pow(1-p, 3)
          setNodeProgress(prev => ({ ...prev, [t.id]: eased }))
          if (p < 1) requestAnimationFrame(anim)
        }
        requestAnimationFrame(anim)
      }, i * 350))
    })
    const connDelay = trinkets.length * 350 + 2800
    activeConns.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleConns(v => [...v, i]), connDelay + i * 120))
    })
    return () => timers.forEach(clearTimeout)
  }, [view, showKnown, showInferred])

  const isMobile = window.innerWidth < 600
  const W = isMobile ? 380 : 700
  const H = isMobile ? 400 : 580
  const cx = W/2, cy = H/2
  const MAX_R = isMobile ? 155 : 275
  const MIN_R = isMobile ? 55 : 80
  const margin = 55

  const trinketYears = useMemo(() => trinkets.map(t => parseYear(t.date) || 2000), [trinkets])
  const minYear = useMemo(() => Math.min(...trinketYears), [trinketYears])
  const maxYear = useMemo(() => Math.max(...trinketYears), [trinketYears])

  const rawPos = useMemo(() => {
    const p = {}
    const range = maxYear - minYear || 1
    trinkets.forEach((t, i) => {
      const year = trinketYears[i]
      const yearT = (year - minYear) / range
      const r = MAX_R - yearT * (MAX_R - MIN_R)
      const angle = i * 2.399963 - Math.PI/2
      const rawX = cx + r * Math.cos(angle)
      const rawY = cy + r * Math.sin(angle)
      p[t.id] = {
        x: Math.max(margin, Math.min(W-margin, rawX)),
        y: Math.max(margin, Math.min(H-margin, rawY)),
      }
    })
    return p
  }, [trinkets, trinketYears, minYear, maxYear])

  const nodeRadius = (id, name) => {
    const words = (name||'').split(' ')
    const maxLen = Math.max(...words.map(w=>w.length))
    return Math.max(isMobile?14:18, Math.min(maxLen*(isMobile?4:5.2)+8, isMobile?36:44))
  }

  const minDist = useMemo(() => {
    if (!trinkets.length) return 50
    const maxR = Math.max(...trinkets.map(t => nodeRadius(t.id, t.name)))
    return maxR * 2 + 16
  }, [trinkets])

  const finalPos = useMemo(() => spreadNodes(rawPos, minDist), [rawPos, minDist])

  // Get position during entry animation
  const getAnimPos = (id, fp) => {
    const p = nodeProgress[id] ?? 0
    if (p >= 1) return fp
    const angle = Math.atan2(fp.y - cy, fp.x - cx)
    const orbitAngle = angle + (1-p) * Math.PI * 2
    const startR = MAX_R * 1.1
    const currentR = startR + (Math.sqrt((fp.x-cx)**2+(fp.y-cy)**2) - startR) * p
    return { x: cx + currentR * Math.cos(orbitAngle), y: cy + currentR * Math.sin(orbitAngle) }
  }

  // Add slow orbital drift to settled nodes
  const getDriftPos = (id, animP, idx) => {
    const progress = nodeProgress[id] ?? 0
    if (!animP || progress < 1) return animP
    const phase = (idx / Math.max(trinkets.length, 1)) * 2 * Math.PI
    return {
      x: animP.x + Math.cos(orbitAngle + phase) * 10,
      y: animP.y + Math.sin(orbitAngle + phase) * 10,
    }
  }

  // Hovering highlights connections
  const hoveredConnIds = useMemo(() => {
    if (!hoveredNode) return new Set()
    return new Set(activeConns.filter(c=>c.ids.includes(hoveredNode)).flatMap(c=>c.ids))
  }, [hoveredNode, activeConns])

  const sortedYears = useMemo(() => [...new Set(trinketYears)].sort((a,b)=>a-b), [trinketYears])
  const usedTypes = [...new Set(activeConns.map(c => c.inferred ? 'inferred' : c.type))]

  const lineColor = '#E8E0D0'

  return (
    <div style={{ position:'fixed', inset:0, background:'#1E1E1E' }}>

      {view === 'map' ? (
        <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'0.5rem' }}>

          {/* Toggles */}
          <div style={{ display:'flex', gap:'8px', marginBottom:'4px', flexWrap:'wrap', justifyContent:'center' }}>
            {[{k:'known',v:showKnown,s:setShowKnown},{k:'inferred',v:showInferred,s:setShowInferred}].map(t=>(
              <button key={t.k} onClick={()=>t.s(v=>!v)} style={{ padding:'4px 14px', borderRadius:'99px', border:`0.5px solid ${t.v?'#E8E0D0':'#3A3A3A'}`, background:'none', color:t.v?'#E8E0D0':'#686860', fontFamily:'Inconsolata,monospace', fontSize:'10px', letterSpacing:'0.06em', cursor:'pointer' }}>{t.k}</button>
            ))}
            <button onClick={()=>{ setView('analysis'); setAxesAnimated(false); setTimeout(()=>setAxesAnimated(true),200) }} style={{ padding:'4px 14px', borderRadius:'99px', border:'0.5px solid #3A3A3A', background:'none', color:'#686860', fontFamily:'Inconsolata,monospace', fontSize:'10px', letterSpacing:'0.06em', cursor:'pointer' }}>analysis →</button>
          </div>

          {/* AI status */}
          {aiLoading && <p style={{ fontFamily:'Inconsolata,monospace', fontSize:'10px', color:'#686858', fontStyle:'italic', marginBottom:'3px' }}>finding connections…</p>}
          {!aiLoading && aiConns.length > 0 && <p style={{ fontFamily:'Inconsolata,monospace', fontSize:'10px', color:'#5A8050', marginBottom:'3px' }}>{aiConns.length} AI connections found</p>}

          {/* Map SVG */}
          {trinkets.length >= 3 ? (
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%', maxWidth:`${W}px`, maxHeight:'60vh' }}>

              {/* Year rings */}
              {sortedYears.map((year, yi) => {
                const range = maxYear - minYear || 1
                const t = (year - minYear) / range
                const r = MAX_R - t * (MAX_R - MIN_R)
                return (
                  <g key={year}>
                    <circle cx={cx} cy={cy} r={Math.round(r)} fill="none" stroke="#383830" strokeWidth="1" strokeDasharray="2 6" />
                    {(yi===0||yi===sortedYears.length-1) && (
                      <text x={Math.min(cx+Math.round(r)+8, W-50)} y={cy} fontSize="11" fill="#686860" fontFamily="Inconsolata,monospace" dominantBaseline="central" fontStyle="italic" fontWeight="500">
                        {yi===0?`oldest · ${year}`:`newest · ${year}`}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Spokes */}
              {trinkets.map((t, i) => {
                if (!visibleNodes.includes(i)) return null
                const fp = finalPos[t.id]; if (!fp) return null
                const ap = getAnimPos(t.id, fp)
                const p = getDriftPos(t.id, ap, i)
                const dx = p.x-cx, dy = p.y-cy, d = Math.sqrt(dx*dx+dy*dy)||1
                const nr = nodeRadius(t.id, t.name)
                return <line key={t.id} x1={cx+(dx/d)*34} y1={cy+(dy/d)*34} x2={p.x-(dx/d)*nr} y2={p.y-(dy/d)*nr} stroke="#2A2A28" strokeWidth="0.8" />
              })}

              {/* Connection lines */}
              {activeConns.map((c, i) => {
                if (!visibleConns.includes(i)) return null
                const fp1 = finalPos[c.ids[0]], fp2 = finalPos[c.ids[1]]
                if (!fp1||!fp2) return null
                const idx1 = trinkets.findIndex(t=>t.id===c.ids[0])
                const idx2 = trinkets.findIndex(t=>t.id===c.ids[1])
                const ap1 = getAnimPos(c.ids[0], fp1), ap2 = getAnimPos(c.ids[1], fp2)
                const p1 = getDriftPos(c.ids[0], ap1, idx1)
                const p2 = getDriftPos(c.ids[1], ap2, idx2)
                const style = LINE_STYLES[c.inferred?'inferred':c.type] || LINE_STYLES.historical
                const isSel = selectedConn === c
                const isHov = hoveredNode && c.ids.includes(hoveredNode)
                const dimmed = hoveredNode && !isHov
                return (
                  <g key={i} onClick={()=>{ setSelectedConn(isSel?null:c); if(showTip){setShowTip(false);localStorage.setItem('bib_tip','1')} }} style={{cursor:'pointer'}}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={12} />
                    <line
                      x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke={isSel?'#FFFFFF':lineColor}
                      strokeWidth={isSel?style.w+1:style.w}
                      strokeDasharray={c.inferred?'5 3':style.dash}
                      strokeDashoffset={c.inferred ? -orbitAngle*18 : 0}
                      opacity={dimmed?0.1:isSel?1:style.op}
                      style={{ transition:'opacity 0.3s ease' }}
                    />
                  </g>
                )
              })}

              {/* You node */}
              <circle cx={cx} cy={cy} r={isMobile?26:32} fill="#E8E0D0" />
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?10:13} fill="#1A1A1A" fontFamily="Inconsolata,monospace" fontWeight="600">You</text>

              {/* Trinket nodes */}
              {trinkets.map((t, idx) => {
                if (!visibleNodes.includes(idx)) return null
                const fp = finalPos[t.id]; if (!fp) return null
                const ap = getAnimPos(t.id, fp)
                const p = getDriftPos(t.id, ap, idx)
                const nr = nodeRadius(t.id, t.name)
                const fill = getNodeFill(idx)
                const tc = getTextFill(fill)
                const sw = fill === '#E8E0D0' ? 1.5 : 0.8
                const dimmed = hoveredNode && hoveredNode !== t.id && !hoveredConnIds.has(t.id)
                const words = t.name.split(' ')
                let lines = [], line = ''
                words.forEach(w => {
                  if ((line+' '+w).trim().length <= 11) { line = (line+' '+w).trim() }
                  else { if(line) lines.push(line); line=w }
                })
                if (line) lines.push(line)
                lines = lines.slice(0,2)
                const lh = 10, startY = p.y - ((lines.length-1)*lh)/2
                const angle = Math.atan2(p.y-cy, p.x-cx)
                const lx = p.x + Math.cos(angle)*(nr+18)
                const ly = p.y + Math.sin(angle)*(nr+12)

                return (
                  <g key={t.id}
                    onMouseEnter={() => {
                      setHoveredNode(t.id)
                      cancelAnimationFrame(rippleRef.current)
                      const start = performance.now()
                      const pulse = (now) => {
                        const r = nr + ((now-start)/500)*36
                        setRipple({ id:t.id, r })
                        if ((now-start) < 500) rippleRef.current = requestAnimationFrame(pulse)
                        else setRipple({ id:null, r:0 })
                      }
                      rippleRef.current = requestAnimationFrame(pulse)
                    }}
                    onMouseLeave={() => setHoveredNode(null)}
                    style={{ cursor:'default' }}
                  >
                    {ripple.id === t.id && (
                      <circle cx={p.x} cy={p.y} r={ripple.r} fill="none" stroke="#E8E0D0" strokeWidth="0.5" opacity={Math.max(0, 0.4-(ripple.r-nr)/36*0.4)} />
                    )}
                    <circle cx={p.x} cy={p.y} r={nr} fill={fill} stroke="#C8C4BC" strokeWidth={sw} opacity={dimmed?0.2:1} style={{ transition:'opacity 0.3s ease' }} />
                    {lines.map((ln,li) => (
                      <text key={li} x={p.x} y={startY+li*lh} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?8:10} fill={tc} fontFamily="Inconsolata,monospace" fontWeight="500" opacity={dimmed?0.2:1}>{ln}</text>
                    ))}
                    {t.date && <text x={lx} y={ly} textAnchor="middle" fontSize={isMobile?8:10} fill="#909088" fontFamily="Inconsolata,monospace" opacity={dimmed?0.1:1}>{t.date}</text>}
                  </g>
                )
              })}
            </svg>
          ) : (
            <div style={{ textAlign:'center', padding:'3rem 1rem', animation:'fadeUp 0.4s ease forwards' }}>
              <p style={{ fontFamily:'JacquardaBastarda9,cursive', fontSize:'28px', color:'#E8E0D0', marginBottom:'12px' }}>not enough objects</p>
              <p style={{ fontFamily:'Inconsolata,monospace', fontSize:'12px', color:'#808078', lineHeight:1.8, marginBottom:'20px' }}>add at least 3 objects to generate your constellation</p>
              <button onClick={onBack} style={{ padding:'10px 28px', borderRadius:'99px', border:'0.5px solid #E8E0D0', background:'none', color:'#E8E0D0', fontFamily:'Inconsolata,monospace', fontSize:'12px', letterSpacing:'0.06em', cursor:'pointer' }}>← add more objects</button>
            </div>
          )}

          {/* Legend */}
          {trinkets.length >= 3 && (
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap', justifyContent:'center', marginTop:'6px' }}>
              {usedTypes.map(type => {
                const s = LINE_STYLES[type] || LINE_STYLES.historical
                return (
                  <div key={type} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                    <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke="#E8E0D0" strokeWidth={s.w} strokeDasharray={s.dash} opacity={s.op} /></svg>
                    <span style={{ fontFamily:'Inconsolata,monospace', fontSize:'10px', color:'#A0A090' }}>{type}</span>
                  </div>
                )
              })}
              <span style={{ fontFamily:'Inconsolata,monospace', fontSize:'10px', color:'#686860' }}>outer = oldest · inner = newest</span>
            </div>
          )}

          {/* First-use tip */}
          {showTip && activeConns.length > 0 && (
            <p style={{ fontFamily:'Inconsolata,monospace', fontSize:'10px', color:'#686860', fontStyle:'italic', marginTop:'4px' }}>
              tap a connection line to see what links these objects
            </p>
          )}

          {/* Selected connection detail */}
          {selectedConn && (() => {
            const a = trinkets.find(t=>t.id===selectedConn.ids[0])
            const b = trinkets.find(t=>t.id===selectedConn.ids[1])
            return (
              <div style={{ position:'absolute', bottom:'72px', background:'#141414', border:'0.5px solid #3A3A3A', borderRadius:'6px', padding:'12px 16px', maxWidth:'400px', textAlign:'center', maxHeight:'200px', overflowY:'auto', animation:'fadeUp 0.2s ease forwards', zIndex:10 }}>
                <div style={{ fontSize:'12px', color:'#E8E0D0', fontFamily:'Inconsolata,monospace', marginBottom:'5px', fontWeight:500 }}>{a?.name} × {b?.name}</div>
                <div style={{ fontSize:'10px', color:'#A89880', fontFamily:'Inconsolata,monospace', marginBottom:'5px', fontStyle:'italic' }}>{selectedConn.label}</div>
                {selectedConn.detail && <div style={{ fontSize:'10px', color:'#909088', fontFamily:'Inconsolata,monospace', lineHeight:1.75 }}>{selectedConn.detail}</div>}
                <button onClick={()=>setSelectedConn(null)} style={{ marginTop:'8px', background:'none', border:'none', color:'#555', fontSize:'10px', cursor:'pointer', fontFamily:'Inconsolata,monospace' }}>dismiss</button>
              </div>
            )
          })()}

          {/* Bottom buttons */}
          {trinkets.length >= 3 && (
            <div style={{ display:'flex', gap:'10px', alignItems:'center', marginTop:'10px', flexWrap:'wrap', justifyContent:'center' }}>
              <button onClick={onBack} style={{ padding:'9px 20px', borderRadius:'99px', border:'0.5px solid #686858', background:'none', color:'#A0A090', fontFamily:'Inconsolata,monospace', fontSize:'11px', cursor:'pointer', letterSpacing:'0.06em', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.color='#E8E0D0';e.currentTarget.style.borderColor='#E8E0D0'}}
                onMouseLeave={e=>{e.currentTarget.style.color='#A0A090';e.currentTarget.style.borderColor='#686858'}}>
                ← add more objects
              </button>
              <button onClick={onReveal} style={{ padding:'10px 36px', borderRadius:'12px', border:'1px solid #E8E0D0', background:'none', color:'#E8E0D0', fontFamily:'JacquardaBastarda9,cursive', fontSize:'20px', cursor:'pointer', transition:'all 0.2s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='#E8E0D0';e.currentTarget.style.color='#1E1E1E'}}
                onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#E8E0D0'}}>
                Reveal Archetype
              </button>
            </div>
          )}
        </div>

      ) : (
        /* Analysis view */
        <div style={{ position:'fixed', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'3rem', background:'#1E1E1E' }}>
          <button onClick={()=>setView('map')} style={{ position:'absolute', top:'24px', left:'24px', background:'none', border:'none', color:'#888', fontFamily:'Inconsolata,monospace', fontSize:'12px', cursor:'pointer', letterSpacing:'0.06em' }}>← map</button>
          <h2 style={{ fontFamily:'Inconsolata,monospace', fontSize:'clamp(28px,4vw,44px)', fontWeight:400, color:'#E8E0D0', marginBottom:'3rem', letterSpacing:'0.04em' }}>Analysis</h2>
          <div style={{ width:'100%', maxWidth:'560px' }}>
            {axes.map(a => (
              <div key={a.label} style={{ display:'flex', alignItems:'center', gap:'20px', marginBottom:'22px' }}>
                <div style={{ fontFamily:'Inconsolata,monospace', fontSize:'12px', color:'#E8E0D0', width:'180px', flexShrink:0, letterSpacing:'0.04em' }}>{a.label}</div>
                <div style={{ flex:1, height:'2px', background:'#3A3A3A' }}>
                  <div style={{ height:'100%', background:'#E8E0D0', width:axesAnimated?`${a.value}%`:'0%', transition:'width 1.4s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <div style={{ fontFamily:'Inconsolata,monospace', fontSize:'12px', color:'#E8E0D0', width:'36px', textAlign:'right', flexShrink:0 }}>{a.value}</div>
              </div>
            ))}
          </div>
          <button onClick={onReveal} style={{ marginTop:'2rem', padding:'10px 36px', borderRadius:'12px', border:'1px solid #E8E0D0', background:'none', color:'#E8E0D0', fontFamily:'JacquardaBastarda9,cursive', fontSize:'20px', cursor:'pointer' }}>Reveal Archetype</button>
        </div>
      )}
    </div>
  )
}
