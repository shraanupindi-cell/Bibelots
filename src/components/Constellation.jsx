import { useEffect, useState, useMemo, useRef } from 'react'
import { findKnownConnections, findInferredConnections, connCountMap } from '../connections'
import { getAxisScores } from '../archetypes'

function parseYear(d) { const m=String(d||'').match(/\d{3,4}/); return m?parseInt(m[0]):null }

function getNodeFill(index) {
  const fills=['#F0EDE8','#F0EDE8','rgba(240,237,232,0.45)','none','none','rgba(240,237,232,0.18)']
  return fills[index%fills.length]
}
function getTextFill(fill) { return fill==='#F0EDE8'?'#1E1E1E':'#F0EDE8' }

const CONN_COLORS = { historical:'#C8B89A',geographic:'#9ABCA8',material:'#C4A882',personal:'#D4BEB0',emotional:'#B8A8C4',acquisition:'#A8B4C4',cultural:'#C4A0A0',functional:'#A8C4A8',inferred:'#686860' }

// Enforce minimum distance between nodes
function spreadNodes(rawPos, minDist, iterations=50) {
  const pos = {...rawPos}
  const ids = Object.keys(pos)
  for(let iter=0; iter<iterations; iter++) {
    let moved = false
    for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++) {
      const a=pos[ids[i]], b=pos[ids[j]]
      const dx=b.x-a.x, dy=b.y-a.y
      const dist=Math.sqrt(dx*dx+dy*dy)
      if(dist<minDist && dist>0) {
        const push=(minDist-dist)/2
        const nx=dx/dist, ny=dy/dist
        pos[ids[i]]={x:Math.round(a.x-nx*push),y:Math.round(a.y-ny*push)}
        pos[ids[j]]={x:Math.round(b.x+nx*push),y:Math.round(b.y+ny*push)}
        moved=true
      }
    }
    if(!moved) break
  }
  return pos
}

export default function Constellation({ trinkets, onReveal }) {
  const [showKnown, setShowKnown] = useState(true)
  const [showInferred, setShowInferred] = useState(true)
  const [selectedConn, setSelectedConn] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
  const [axesAnimated, setAxesAnimated] = useState(false)
  const [view, setView] = useState('map')
  const [animated, setAnimated] = useState(false)

  const knownConns = findKnownConnections(trinkets)
  const inferredConns = findInferredConnections(trinkets)
  const activeConns = useMemo(()=>[
    ...(showKnown?knownConns:[]),
    ...(showInferred?inferredConns:[]),
  ],[showKnown,showInferred,trinkets])
  const counts = connCountMap(trinkets)
  const axes = getAxisScores(trinkets)

  useEffect(()=>{ setTimeout(()=>setAxesAnimated(true),300) },[])
  useEffect(()=>{ if(view==='map') { setAnimated(false); setTimeout(()=>setAnimated(true),100) } },[view])

  // Responsive sizing
  const isMobile = window.innerWidth < 600
  const W=isMobile?360:620, H=isMobile?380:520, cx=W/2, cy=H/2
  const MAX_R=isMobile?140:230, MIN_R=isMobile?55:75

  const trinketYears = useMemo(()=>trinkets.map(t=>parseYear(t.date)||2000),[trinkets])
  const minYear = useMemo(()=>Math.min(...trinketYears),[trinketYears])
  const maxYear = useMemo(()=>Math.max(...trinketYears),[trinketYears])

  const rawPos = useMemo(()=>{
    const p={}
    const n=trinkets.length
    const range=maxYear-minYear||1
    trinkets.forEach((t,i)=>{
      const year=trinketYears[i]
      const yearT=(year-minYear)/range
      const r=MAX_R-yearT*(MAX_R-MIN_R)
      const goldenAngle=2.399963
      const angle=i*goldenAngle-Math.PI/2
      p[t.id]={x:Math.round(cx+r*Math.cos(angle)),y:Math.round(cy+r*Math.sin(angle))}
    })
    return p
  },[trinkets,trinketYears,minYear,maxYear,cx,cy,MAX_R,MIN_R])

  const nodeRadius = (id,name)=>{
    const words=(name||'').split(' ')
    const maxLen=Math.max(...words.map(w=>w.length))
    return Math.max(isMobile?14:16, Math.min(maxLen*(isMobile?4:5)+8, isMobile?34:40))
  }

  const minDist = useMemo(()=>{
    const maxR=Math.max(...trinkets.map(t=>nodeRadius(t.id,t.name)))
    return maxR*2+8
  },[trinkets])

  const pos = useMemo(()=>spreadNodes(rawPos,minDist),[rawPos,minDist])

  const sortedYears=useMemo(()=>[...new Set(trinketYears)].sort((a,b)=>a-b),[trinketYears])
  const usedTypes=[...new Set(activeConns.map(c=>c.inferred?'inferred':c.type))]

  // Connections involving hovered node
  const hoveredConnIds = useMemo(()=>{
    if(!hoveredNode) return new Set()
    return new Set(activeConns.filter(c=>c.ids.includes(hoveredNode)).flatMap(c=>c.ids))
  },[hoveredNode,activeConns])

  return (
    <div style={{ position:'fixed',inset:0,background:'#1E1E1E' }}>
      {view==='map' ? (
        <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0.5rem' }}>
          {/* Toggles */}
          <div style={{ display:'flex',gap:'8px',marginBottom:'8px',flexWrap:'wrap',justifyContent:'center' }}>
            {[{key:'known',val:showKnown,set:setShowKnown},{key:'inferred',val:showInferred,set:setShowInferred}].map(t=>(
              <button key={t.key} onClick={()=>t.set(v=>!v)} style={{ padding:'4px 14px',borderRadius:'99px',border:`0.5px solid ${t.val?'#F0EDE8':'#3A3A3A'}`,background:'none',color:t.val?'#F0EDE8':'#787870',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer' }}>{t.key}</button>
            ))}
            <button onClick={()=>{setView('analysis');setTimeout(()=>setAxesAnimated(true),200)}} style={{ padding:'4px 14px',borderRadius:'99px',border:'0.5px solid #3A3A3A',background:'none',color:'#909088',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer' }}>analysis →</button>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%',maxWidth:`${W}px`,maxHeight:'65vh' }}>
            {/* Rings */}
            {sortedYears.map((year,yi)=>{
              const range=maxYear-minYear||1
              const t=(year-minYear)/range
              const r=MAX_R-t*(MAX_R-MIN_R)
              return (
                <g key={year}>
                  <circle cx={cx} cy={cy} r={Math.round(r)} fill="none" stroke="#252520" strokeWidth="0.8" strokeDasharray="3 6" />
                  {(yi===0||yi===sortedYears.length-1) && (
                    <text x={Math.min(cx+Math.round(r)+5,W-40)} y={cy} fontSize="8" fill="#404038" fontFamily="Inconsolata,monospace" dominantBaseline="central" fontStyle="italic">
                      {yi===0?'oldest':'newest'}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Spokes */}
            {trinkets.map(t=>{
              const p=pos[t.id]; if(!p) return null
              const dx=p.x-cx,dy=p.y-cy,d=Math.sqrt(dx*dx+dy*dy)
              const nr=nodeRadius(t.id,t.name)
              return <line key={t.id} x1={Math.round(cx+(dx/d)*34)} y1={Math.round(cy+(dy/d)*34)} x2={Math.round(p.x-(dx/d)*nr)} y2={Math.round(p.y-(dy/d)*nr)} stroke="#282820" strokeWidth="0.8" />
            })}

            {/* Connections */}
            {activeConns.map((c,i)=>{
              const p1=pos[c.ids[0]],p2=pos[c.ids[1]]
              if(!p1||!p2) return null
              const color=c.inferred?CONN_COLORS.inferred:(CONN_COLORS[c.type]||'#C8B89A')
              const isSelected=selectedConn===c
              const isHovered=hoveredNode&&c.ids.includes(hoveredNode)
              const dimmed=hoveredNode&&!isHovered
              return (
                <g key={i} onClick={()=>setSelectedConn(isSelected?null:c)} style={{cursor:'pointer'}}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={12} />
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                    stroke={isSelected?'#FFFFFF':color}
                    strokeWidth={isSelected?2:isHovered?1.8:1.2}
                    strokeDasharray={c.inferred?'5 3':undefined}
                    opacity={dimmed?0.15:1}
                    style={animated?{strokeDashoffset:0,transition:'opacity 0.2s'}:{}}
                  />
                </g>
              )
            })}

            {/* You node */}
            <circle cx={cx} cy={cy} r={isMobile?26:32} fill="#D4C4BF" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?10:13} fill="#1E1E1E" fontFamily="Inconsolata,monospace" fontWeight="600">You</text>

            {/* Trinket nodes */}
            {trinkets.map((t,idx)=>{
              const p=pos[t.id]; if(!p) return null
              const nr=nodeRadius(t.id,t.name)
              const fill=getNodeFill(idx)
              const tc=getTextFill(fill)
              const sw=fill==='#F0EDE8'?1.5:1
              const dimmed=hoveredNode&&hoveredNode!==t.id&&!hoveredConnIds.has(t.id)
              const words=t.name.split(' ')
              let lines=[],line=''
              words.forEach(w=>{ if((line+' '+w).trim().length<=10){line=(line+' '+w).trim()}else{if(line)lines.push(line);line=w} })
              if(line) lines.push(line)
              lines=lines.slice(0,2)
              const lh=10,startY=p.y-((lines.length-1)*lh)/2
              const angle=Math.atan2(p.y-cy,p.x-cx)
              const lx=Math.round(p.x+Math.cos(angle)*(nr+16))
              const ly=Math.round(p.y+Math.sin(angle)*(nr+11))
              return (
                <g key={t.id} onMouseEnter={()=>setHoveredNode(t.id)} onMouseLeave={()=>setHoveredNode(null)} style={{cursor:'default'}}>
                  <circle cx={p.x} cy={p.y} r={nr} fill={fill} stroke="#C8C4BC" strokeWidth={sw} opacity={dimmed?0.25:1} />
                  {lines.map((ln,li)=>(
                    <text key={li} x={p.x} y={startY+li*lh} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?7:8.5} fill={tc} fontFamily="Inconsolata,monospace" fontWeight="500" opacity={dimmed?0.25:1}>{ln}</text>
                  ))}
                  {t.date && <text x={lx} y={ly} textAnchor="middle" fontSize={isMobile?8:9} fill="#909088" fontFamily="Inconsolata,monospace" opacity={dimmed?0.15:1}>{t.date}</text>}
                </g>
              )
            })}
          </svg>

          {/* Legend */}
          <div style={{ display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center',marginTop:'6px' }}>
            {usedTypes.map(type=>(
              <div key={type} style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                <svg width="20" height="10"><line x1="0" y1="5" x2="20" y2="5" stroke={CONN_COLORS[type]||'#C8B89A'} strokeWidth="1.5" strokeDasharray={type==='inferred'?'4 3':undefined} /></svg>
                <span style={{ fontFamily:'Inconsolata,monospace',fontSize:'9px',color:'#787870' }}>{type}</span>
              </div>
            ))}
            <span style={{ fontFamily:'Inconsolata,monospace',fontSize:'9px',color:'#505048' }}>outer = oldest · inner = newest</span>
          </div>

          {/* Connection tooltip */}
          {selectedConn&&(()=>{
            const a=trinkets.find(t=>t.id===selectedConn.ids[0])
            const b=trinkets.find(t=>t.id===selectedConn.ids[1])
            return (
              <div style={{ position:'absolute',bottom:'72px',background:'#141414',border:'0.5px solid #404040',borderRadius:'6px',padding:'12px 16px',maxWidth:'360px',textAlign:'center',animation:'fadeUp 0.2s ease forwards',zIndex:10 }}>
                <div style={{ fontSize:'12px',color:'#F0EDE8',fontFamily:'Inconsolata,monospace',marginBottom:'5px',fontWeight:500 }}>{a?.name} × {b?.name}</div>
                <div style={{ fontSize:'10px',color:'#D4C4BF',fontFamily:'Inconsolata,monospace',marginBottom:'5px',fontStyle:'italic' }}>{selectedConn.label}</div>
                {selectedConn.detail&&<div style={{ fontSize:'10px',color:'#909088',fontFamily:'Inconsolata,monospace',lineHeight:1.75 }}>{selectedConn.detail}</div>}
                <button onClick={()=>setSelectedConn(null)} style={{ marginTop:'8px',background:'none',border:'none',color:'#606058',fontSize:'10px',cursor:'pointer',fontFamily:'Inconsolata,monospace' }}>dismiss</button>
              </div>
            )
          })()}

          <button onClick={onReveal} style={{ marginTop:'10px',padding:'10px 36px',borderRadius:'12px',border:'1px solid #F0EDE8',background:'none',color:'#F0EDE8',fontFamily:'JacquardaBastarda9,cursive',fontSize:'20px',cursor:'pointer',transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#F0EDE8';e.currentTarget.style.color='#1E1E1E'}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#F0EDE8'}}>
            Reveal Archetype
          </button>
        </div>

      ) : (
        <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem' }}>
          <button onClick={()=>setView('map')} style={{ position:'absolute',top:'24px',left:'24px',background:'none',border:'none',color:'#909088',fontFamily:'Inconsolata,monospace',fontSize:'12px',cursor:'pointer',letterSpacing:'0.06em' }}>← map</button>
          <h2 style={{ fontFamily:'Inconsolata,monospace',fontSize:'clamp(28px,4vw,44px)',fontWeight:400,color:'#F0EDE8',marginBottom:'3rem',letterSpacing:'0.04em' }}>Analysis</h2>
          <div style={{ width:'100%',maxWidth:'560px' }}>
            {axes.map(a=>(
              <div key={a.label} style={{ display:'flex',alignItems:'center',gap:'20px',marginBottom:'22px' }}>
                <div style={{ fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#F0EDE8',width:'180px',flexShrink:0,letterSpacing:'0.04em' }}>{a.label}</div>
                <div style={{ flex:1,height:'2px',background:'#3A3A3A' }}>
                  <div style={{ height:'100%',background:'#F0EDE8',width:axesAnimated?`${a.value}%`:'0%',transition:'width 1.4s cubic-bezier(.4,0,.2,1)' }} />
                </div>
                <div style={{ fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#F0EDE8',width:'36px',textAlign:'right',flexShrink:0 }}>{a.value}</div>
              </div>
            ))}
          </div>
          <button onClick={onReveal} style={{ marginTop:'2rem',padding:'10px 36px',borderRadius:'12px',border:'1px solid #F0EDE8',background:'none',color:'#F0EDE8',fontFamily:'JacquardaBastarda9,cursive',fontSize:'20px',cursor:'pointer' }}>Reveal Archetype</button>
        </div>
      )}
    </div>
  )
}
