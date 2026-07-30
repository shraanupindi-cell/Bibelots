import { useEffect, useState, useMemo, useRef } from 'react'
import { findKnownConnections, findInferredConnections, connCountMap } from '../connections'
import { getAxisScores } from '../archetypes'

function parseYear(d) { const m=String(d||'').match(/\d{3,4}/); return m?parseInt(m[0]):null }

function getNodeFill(index) {
  const fills=['#E8E0D0','#E8E0D0','rgba(232,224,208,0.4)','none','none','rgba(232,224,208,0.15)']
  return fills[index%fills.length]
}
function getTextFill(fill) { return fill==='#E8E0D0'?'#1A1A1A':'#E8E0D0' }

// Line style varies by connection type — no colour, use stroke variation
const LINE_STYLES = {
  historical:  { strokeWidth:2.5,   dasharray:undefined,      opacity:0.9 },
  geographic:  { strokeWidth:1,     dasharray:'6 3',          opacity:0.85 },
  material:    { strokeWidth:1.5,   dasharray:'2 2',          opacity:0.8 },
  personal:    { strokeWidth:3,     dasharray:undefined,      opacity:0.7 },
  emotional:   { strokeWidth:1,     dasharray:'8 2 2 2',      opacity:0.75 },
  acquisition: { strokeWidth:2,     dasharray:'4 4',          opacity:0.8 },
  cultural:    { strokeWidth:1.5,   dasharray:'1 3',          opacity:0.85 },
  functional:  { strokeWidth:2,     dasharray:'6 2 1 2',      opacity:0.8 },
  inferred:    { strokeWidth:1,     dasharray:'3 5',          opacity:0.6 },
}

// Enforce minimum distance
function spreadNodes(rawPos, minDist, iterations=80) {
  const pos = Object.fromEntries(Object.entries(rawPos).map(([k,v])=>[k,{...v}]))
  const ids = Object.keys(pos)
  for(let iter=0;iter<iterations;iter++) {
    let moved=false
    for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++) {
      const a=pos[ids[i]],b=pos[ids[j]]
      const dx=b.x-a.x,dy=b.y-a.y,dist=Math.sqrt(dx*dx+dy*dy)
      if(dist<minDist&&dist>0) {
        const push=(minDist-dist)/2,nx=dx/dist,ny=dy/dist
        pos[ids[i]]={x:Math.round(a.x-nx*push),y:Math.round(a.y-ny*push)}
        pos[ids[j]]={x:Math.round(b.x+nx*push),y:Math.round(b.y+ny*push)}
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
  const [showTip, setShowTip] = useState(() => !localStorage.getItem('bibelots_tip_seen'))
  const [rippleNode, setRippleNode] = useState(null)
  const [rippleRadius, setRippleRadius] = useState(0)
  const rippleAnim = useRef(null)
  const [axesAnimated, setAxesAnimated] = useState(false)
  const [view, setView] = useState('map')
  const [visibleNodes, setVisibleNodes] = useState([])
  const [visibleConns, setVisibleConns] = useState([])
  const jaggedRef = useRef({})

  const knownConns = findKnownConnections(trinkets)
  const inferredConns = findInferredConnections(trinkets)
  const activeConns = useMemo(()=>[
    ...(showKnown?knownConns:[]),
    ...(showInferred?inferredConns:[]),
  ],[showKnown,showInferred,trinkets])
  const counts = connCountMap(trinkets)
  const axes = getAxisScores(trinkets)

  useEffect(()=>{ setTimeout(()=>setAxesAnimated(true),300) },[])

  // Planetary orbit animation state
  // Each node starts far out and spirals to final position
  const [nodeProgress, setNodeProgress] = useState({}) // 0→1 per node id
  const orbitRef = useRef(null)

  useEffect(()=>{
    if(view!=='map') return
    setVisibleNodes([])
    setVisibleConns([])
    setNodeProgress({})

    const timers = []
    // Stagger node entry — each starts orbiting then settles
    trinkets.forEach((t, i) => {
      timers.push(setTimeout(() => {
        setVisibleNodes(v => [...v, i])
        // Animate progress 0→1 over 2800ms using rAF
        const start = performance.now()
        const duration = 2800
        const animate = (now) => {
          const elapsed = now - start
          const p = Math.min(elapsed / duration, 1)
          // Ease out cubic
          const eased = 1 - Math.pow(1 - p, 3)
          setNodeProgress(prev => ({ ...prev, [t.id]: eased }))
          if (p < 1) requestAnimationFrame(animate)
        }
        requestAnimationFrame(animate)
      }, i * 400))
    })

    // Connections appear after all nodes settled
    const connDelay = trinkets.length * 400 + 3200
    activeConns.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleConns(v => [...v, i]), connDelay + i * 160))
    })
    return () => timers.forEach(clearTimeout)
  }, [view, trinkets, showKnown, showInferred])

  // Get animated position for a node — orbits from outer ring to final pos
  const getAnimatedPos = (id, finalPos) => {
    const p = nodeProgress[id] ?? 0
    if (p >= 1) return finalPos
    // Start position — orbiting at MAX_R distance, angle shifts as it spirals in
    const angle = Math.atan2(finalPos.y - cy, finalPos.x - cx)
    const orbitAngle = angle + (1 - p) * Math.PI * 2 // full orbit when p=0, no extra when p=1
    const startR = MAX_R * 1.1
    const currentR = startR + (Math.sqrt((finalPos.x-cx)**2 + (finalPos.y-cy)**2) - startR) * p
    return {
      x: Math.round(cx + currentR * Math.cos(orbitAngle)),
      y: Math.round(cy + currentR * Math.sin(orbitAngle)),
    }
  }

  const isMobile = window.innerWidth<600
  const W=isMobile?380:720,H=isMobile?420:600,cx=W/2,cy=H/2
  const MAX_R=isMobile?160:290,MIN_R=isMobile?55:85

  const trinketYears=useMemo(()=>trinkets.map(t=>parseYear(t.date)||2000),[trinkets])
  const minYear=useMemo(()=>Math.min(...trinketYears),[trinketYears])
  const maxYear=useMemo(()=>Math.max(...trinketYears),[trinketYears])

  const rawPos=useMemo(()=>{
    const p={},n=trinkets.length,range=maxYear-minYear||1
    trinkets.forEach((t,i)=>{
      const year=trinketYears[i],yearT=(year-minYear)/range
      const r=MAX_R-yearT*(MAX_R-MIN_R)
      const goldenAngle=2.399963
      const angle=i*goldenAngle-Math.PI/2
      const rawX=cx+r*Math.cos(angle), rawY=cy+r*Math.sin(angle)
      // Clamp so nodes never go too close to SVG edges
      const margin=52
      p[t.id]={
        x:Math.round(Math.max(margin, Math.min(W-margin, rawX))),
        y:Math.round(Math.max(margin, Math.min(H-margin, rawY)))
      }
    })
    return p
  },[trinkets,trinketYears,minYear,maxYear,cx,cy,MAX_R,MIN_R])

  const nodeRadius=(id,name)=>{
    const words=(name||'').split(' '),maxLen=Math.max(...words.map(w=>w.length))
    return Math.max(isMobile?14:18,Math.min(maxLen*(isMobile?4:5.2)+8,isMobile?36:44))
  }

  const minDist=useMemo(()=>{
    const maxR=Math.max(...trinkets.map(t=>nodeRadius(t.id,t.name)))
    return maxR*2+14
  },[trinkets])

  const pos=useMemo(()=>spreadNodes(rawPos,minDist),[rawPos,minDist])

  const sortedYears=useMemo(()=>[...new Set(trinketYears)].sort((a,b)=>a-b),[trinketYears])
  const usedTypes=[...new Set(activeConns.map(c=>c.inferred?'inferred':c.type))]

  const hoveredConnIds=useMemo(()=>{
    if(!hoveredNode) return new Set()
    return new Set(activeConns.filter(c=>c.ids.includes(hoveredNode)).flatMap(c=>c.ids))
  },[hoveredNode,activeConns])



  const lineColor='#E8E0D0'

  return (
    <div style={{ position:'fixed',inset:0,background:'#1E1E1E' }}>
      {view==='map' ? (
        <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0.5rem' }}>
          {/* Toggles */}
          <div style={{ display:'flex',gap:'8px',marginBottom:'8px',flexWrap:'wrap',justifyContent:'center' }}>
            {[{key:'known',val:showKnown,set:setShowKnown},{key:'inferred',val:showInferred,set:setShowInferred}].map(t=>(
              <button key={t.key} onClick={()=>{t.set(v=>!v)}} style={{ padding:'4px 14px',borderRadius:'99px',border:`0.5px solid ${t.val?'#E8E0D0':'#444'}`,background:'none',color:t.val?'#E8E0D0':'#666',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer' }}>{t.key}</button>
            ))}
            <button onClick={()=>{setView('analysis');setTimeout(()=>setAxesAnimated(true),200)}} style={{ padding:'4px 14px',borderRadius:'99px',border:'0.5px solid #444',background:'none',color:'#888',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer' }}>analysis →</button>
          </div>

          {trinkets.length < 3 && (
            <div style={{ textAlign:'center', padding:'3rem 1rem', animation:'fadeUp 0.4s ease forwards' }}>
              <p style={{ fontFamily:'JacquardaBastarda9,cursive', fontSize:'28px', color:'#E8E0D0', marginBottom:'12px' }}>not enough objects</p>
              <p style={{ fontFamily:'Inconsolata,monospace', fontSize:'12px', color:'#808078', lineHeight:1.8, marginBottom:'20px' }}>
                add at least 3 objects to generate your constellation
              </p>
              <button onClick={onBack} style={{ padding:'10px 28px', borderRadius:'99px', border:'0.5px solid #E8E0D0', background:'none', color:'#E8E0D0', fontFamily:'Inconsolata,monospace', fontSize:'12px', letterSpacing:'0.06em', cursor:'pointer' }}>
                ← add more objects
              </button>
            </div>
          )}
          {trinkets.length >= 3 && (<svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%',maxWidth:`${W}px`,maxHeight:'58vh' }}>
            {/* Rings — more visible */}
            {sortedYears.map((year,yi)=>{
              const range=maxYear-minYear||1,t=(year-minYear)/range
              const r=MAX_R-t*(MAX_R-MIN_R)
              return (
                <g key={year}>
                  <circle cx={cx} cy={cy} r={Math.round(r)} fill="none" stroke="#585850" strokeWidth="1.2" strokeDasharray="2 5" />
                  {(yi===0||yi===sortedYears.length-1)&&(
                    <text x={Math.min(cx+Math.round(r)+8,W-48)} y={cy} fontSize="12" fill="#B0B0A0" fontFamily="Inconsolata,monospace" dominantBaseline="central" fontStyle="italic" fontWeight="500">
                      {yi===0?`oldest · ${year}`:`newest · ${year}`}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Spokes */}
            {trinkets.map((t,i)=>{
              if(!visibleNodes.includes(i)) return null
              const finalP=pos[t.id]; if(!finalP) return null
              const p=getAnimatedPos(t.id, finalP)
              const dx=p.x-cx,dy=p.y-cy,d=Math.sqrt(dx*dx+dy*dy)||1
              const nr=nodeRadius(t.id,t.name)
              return <line key={t.id} x1={Math.round(cx+(dx/d)*36)} y1={Math.round(cy+(dy/d)*36)} x2={Math.round(p.x-(dx/d)*nr)} y2={Math.round(p.y-(dy/d)*nr)} stroke="#2A2A28" strokeWidth="0.8" />
            })}

            {/* Connections — varied line styles, all beige */}
            {activeConns.map((c,i)=>{
              if(!visibleConns.includes(i)) return null
              const p1=pos[c.ids[0]],p2=pos[c.ids[1]]
              if(!p1||!p2) return null
              const style=LINE_STYLES[c.inferred?'inferred':c.type]||LINE_STYLES.historical
              const isSelected=selectedConn===c
              const isHovered=hoveredNode&&c.ids.includes(hoveredNode)
              const dimmed=hoveredNode&&!isHovered
              return (
                <g key={i} onClick={()=>{ setSelectedConn(isSelected?null:c); if(showTip){ setShowTip(false); localStorage.setItem('bibelots_tip_seen','1') } }} style={{cursor:'pointer'}}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={14} />
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={lineColor}
                    strokeWidth={isSelected?style.strokeWidth+1:style.strokeWidth}
                    strokeDasharray={style.dasharray}
                    opacity={dimmed?0.1:isSelected?1:style.opacity} style={{ transition: 'opacity 0.4s ease' }} />
                </g>
              )
            })}

            {/* You node */}
            <circle cx={cx} cy={cy} r={isMobile?26:34} fill="#E8E0D0" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?10:13} fill="#1A1A1A" fontFamily="Inconsolata,monospace" fontWeight="600">You</text>

            {/* Trinket nodes — planetary orbit into position */}
            {trinkets.map((t,idx)=>{
              if(!visibleNodes.includes(idx)) return null
              const finalP=pos[t.id]; if(!finalP) return null
              const p=getAnimatedPos(t.id, finalP)
              const nr=nodeRadius(t.id,t.name)
              const fill=getNodeFill(idx)
              const tc=getTextFill(fill)
              const sw=fill==='#E8E0D0'?1.5:0.8
              const dimmed=hoveredNode&&hoveredNode!==t.id&&!hoveredConnIds.has(t.id)
              const words=t.name.split(' ')
              let lines=[],line=''
              words.forEach(w=>{ if((line+' '+w).trim().length<=11){line=(line+' '+w).trim()}else{if(line)lines.push(line);line=w} })
              if(line) lines.push(line)
              lines=lines.slice(0,2)
              const lh=10,startY=p.y-((lines.length-1)*lh)/2
              const angle=Math.atan2(p.y-cy,p.x-cx)
              const lx=Math.round(p.x+Math.cos(angle)*(nr+18))
              const ly=Math.round(p.y+Math.sin(angle)*(nr+12))
              return (
                <g key={t.id} onMouseEnter={()=>setHoveredNode(t.id)} onMouseLeave={()=>setHoveredNode(null)} style={{cursor:'default',animation:'nodeAppear 0.3s ease forwards'}}>
                  {rippleNode===t.id && rippleRadius > 0 && (
                    <circle cx={p.x} cy={p.y} r={Math.round(rippleRadius)}
                      fill="none" stroke="#E8E0D0"
                      strokeWidth="0.5"
                      opacity={Math.max(0, 0.4 - (rippleRadius - nr) / 40 * 0.4)} />
                  )}
                  <circle cx={p.x} cy={p.y} r={nr} fill={fill} stroke="#E8E0D0" strokeWidth={sw} opacity={dimmed?0.2:1}
                    style={{ transition: 'opacity 0.3s ease' }} />
                  {lines.map((ln,li)=>(
                    <text key={li} x={p.x} y={startY+li*lh} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?8:10} fill={tc} fontFamily="Inconsolata,monospace" fontWeight="500" opacity={dimmed?0.2:1}>{ln}</text>
                  ))}
                  {t.date&&<text x={lx} y={ly} textAnchor="middle" fontSize={isMobile?9:11} fill="#888880" fontFamily="Inconsolata,monospace" opacity={dimmed?0.1:1}>{t.date}</text>}
                </g>
              )
            })}
          </svg>)}

          {/* Legend */}
          <div style={{ display:'flex',gap:'14px',flexWrap:'wrap',justifyContent:'center',marginTop:'6px' }}>
            {usedTypes.map(type=>{
              const s=LINE_STYLES[type]||LINE_STYLES.historical
              return (
                <div key={type} style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                  <svg width="24" height="12">
                    <line x1="0" y1="6" x2="24" y2="6" stroke="#E8E0D0" strokeWidth={s.strokeWidth} strokeDasharray={s.dasharray} opacity={s.opacity} />
                  </svg>
                  <span style={{ fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#B0B0A0' }}>{type}</span>
                </div>
              )
            })}
            <span style={{ fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#909088' }}>outer = oldest · inner = newest</span>
          </div>

          {/* Connection tooltip */}
          {selectedConn&&(()=>{
            const a=trinkets.find(t=>t.id===selectedConn.ids[0])
            const b=trinkets.find(t=>t.id===selectedConn.ids[1])
            return (
              <div style={{ position:'absolute',bottom:'72px',background:'#141414',border:'0.5px solid #3A3A3A',borderRadius:'6px',padding:'12px 16px',maxWidth:'400px',textAlign:'center',maxHeight:'220px',overflowY:'auto',animation:'fadeUp 0.2s ease forwards',zIndex:10 }}>
                <div style={{ fontSize:'12px',color:'#E8E0D0',fontFamily:'Inconsolata,monospace',marginBottom:'5px',fontWeight:500 }}>{a?.name} × {b?.name}</div>
                <div style={{ fontSize:'10px',color:'#A89880',fontFamily:'Inconsolata,monospace',marginBottom:'5px',fontStyle:'italic' }}>{selectedConn.label}</div>
                {selectedConn.detail&&<div style={{ fontSize:'10px',color:'#888880',fontFamily:'Inconsolata,monospace',lineHeight:1.75 }}>{selectedConn.detail}</div>}
                <button onClick={()=>setSelectedConn(null)} style={{ marginTop:'8px',background:'none',border:'none',color:'#555',fontSize:'10px',cursor:'pointer',fontFamily:'Inconsolata,monospace' }}>dismiss</button>
              </div>
            )
          })()}

          {/* First-use tooltip */}
          {showTip && activeConns.length > 0 && (
            <p style={{ fontSize:'11px', color:'#808078', fontFamily:'Inconsolata,monospace', letterSpacing:'0.04em', marginTop:'6px', fontStyle:'italic' }}>
              tap any connection line to see what links these objects
            </p>
          )}

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
        </div>

      ) : (
        <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem',background:'#1E1E1E' }}>
          <button onClick={()=>setView('map')} style={{ position:'absolute',top:'24px',left:'24px',background:'none',border:'none',color:'#888',fontFamily:'Inconsolata,monospace',fontSize:'12px',cursor:'pointer',letterSpacing:'0.06em' }}>← map</button>
          <h2 style={{ fontFamily:'Inconsolata,monospace',fontSize:'clamp(28px,4vw,44px)',fontWeight:400,color:'#E8E0D0',marginBottom:'3rem',letterSpacing:'0.04em' }}>Analysis</h2>
          <div style={{ width:'100%',maxWidth:'560px' }}>
            {axes.map(a=>(
              <div key={a.label} style={{ display:'flex',alignItems:'center',gap:'20px',marginBottom:'22px' }}>
                <div style={{ fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#E8E0D0',width:'180px',flexShrink:0,letterSpacing:'0.04em' }}>{a.label}</div>
                <div style={{ flex:1,height:'2px',background:'#444' }}>
                  <div style={{ height:'100%',background:'#E8E0D0',width:axesAnimated?`${a.value}%`:'0%',transition:'width 1.4s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <div style={{ fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#E8E0D0',width:'36px',textAlign:'right',flexShrink:0 }}>{a.value}</div>
              </div>
            ))}
          </div>
          <button onClick={onReveal} style={{ marginTop:'2rem',padding:'10px 36px',borderRadius:'12px',border:'1px solid #E8E0D0',background:'none',color:'#E8E0D0',fontFamily:'JacquardaBastarda9,cursive',fontSize:'20px',cursor:'pointer' }}>Reveal Archetype</button>
        </div>
      )}
    </div>
  )
}
