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

// Jagged line path between two points
function jaggedPath(x1,y1,x2,y2,amplitude=6,segments=8) {
  const dx=(x2-x1)/segments,dy=(y2-y1)/segments
  let d=`M${x1} ${y1}`
  for(let i=1;i<segments;i++) {
    const px=x1+dx*i+((i%2===0?1:-1)*amplitude*(Math.random()*0.5+0.5))
    const py=y1+dy*i+((i%2===0?-1:1)*amplitude*(Math.random()*0.5+0.5))
    d+=` L${Math.round(px)} ${Math.round(py)}`
  }
  d+=` L${x2} ${y2}`
  return d
}

export default function Constellation({ trinkets, onReveal }) {
  const [showKnown, setShowKnown] = useState(true)
  const [showInferred, setShowInferred] = useState(true)
  const [selectedConn, setSelectedConn] = useState(null)
  const [hoveredNode, setHoveredNode] = useState(null)
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

  // Build animation — nodes appear one by one, then connections draw
  useEffect(()=>{
    if(view!=='map') return
    setVisibleNodes([])
    setVisibleConns([])
    const timers=[]
    trinkets.forEach((_,i)=>{
      timers.push(setTimeout(()=>setVisibleNodes(v=>[...v,i]),200+i*120))
    })
    const connDelay=200+trinkets.length*120+200
    activeConns.forEach((_,i)=>{
      timers.push(setTimeout(()=>setVisibleConns(v=>[...v,i]),connDelay+i*80))
    })
    return ()=>timers.forEach(clearTimeout)
  },[view,trinkets,showKnown,showInferred])

  const isMobile = window.innerWidth<600
  const W=isMobile?360:640,H=isMobile?380:540,cx=W/2,cy=H/2
  const MAX_R=isMobile?145:245,MIN_R=isMobile?55:80

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
      p[t.id]={x:Math.round(cx+r*Math.cos(angle)),y:Math.round(cy+r*Math.sin(angle))}
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

  // Pre-generate jagged paths (stable across renders)
  const jaggedPaths = useMemo(()=>{
    const paths={}
    activeConns.forEach((c,i)=>{
      const p1=pos[c.ids[0]],p2=pos[c.ids[1]]
      if(p1&&p2) paths[i]=jaggedPath(p1.x,p1.y,p2.x,p2.y)
    })
    return paths
  },[activeConns,pos])

  const lineColor='#E8E0D0'

  return (
    <div style={{ position:'fixed',inset:0,background:'#2A2A2A' }}>
      {view==='map' ? (
        <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0.5rem' }}>
          {/* Toggles */}
          <div style={{ display:'flex',gap:'8px',marginBottom:'8px',flexWrap:'wrap',justifyContent:'center' }}>
            {[{key:'known',val:showKnown,set:setShowKnown},{key:'inferred',val:showInferred,set:setShowInferred}].map(t=>(
              <button key={t.key} onClick={()=>{t.set(v=>!v)}} style={{ padding:'4px 14px',borderRadius:'99px',border:`0.5px solid ${t.val?'#E8E0D0':'#444'}`,background:'none',color:t.val?'#E8E0D0':'#666',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer' }}>{t.key}</button>
            ))}
            <button onClick={()=>{setView('analysis');setTimeout(()=>setAxesAnimated(true),200)}} style={{ padding:'4px 14px',borderRadius:'99px',border:'0.5px solid #444',background:'none',color:'#888',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer' }}>analysis →</button>
          </div>

          <svg viewBox={`0 0 ${W} ${H}`} style={{ width:'100%',maxWidth:`${W}px`,maxHeight:'65vh' }}>
            {/* Rings — more visible */}
            {sortedYears.map((year,yi)=>{
              const range=maxYear-minYear||1,t=(year-minYear)/range
              const r=MAX_R-t*(MAX_R-MIN_R)
              return (
                <g key={year}>
                  <circle cx={cx} cy={cy} r={Math.round(r)} fill="none" stroke="#444440" strokeWidth="1" strokeDasharray="2 6" />
                  {(yi===0||yi===sortedYears.length-1)&&(
                    <text x={Math.min(cx+Math.round(r)+6,W-44)} y={cy} fontSize="9" fill="#666658" fontFamily="Inconsolata,monospace" dominantBaseline="central" fontStyle="italic">
                      {yi===0?`oldest (${year})`:`newest (${year})`}
                    </text>
                  )}
                </g>
              )
            })}

            {/* Spokes */}
            {trinkets.map((t,i)=>{
              if(!visibleNodes.includes(i)) return null
              const p=pos[t.id]; if(!p) return null
              const dx=p.x-cx,dy=p.y-cy,d=Math.sqrt(dx*dx+dy*dy)
              const nr=nodeRadius(t.id,t.name)
              return <line key={t.id} x1={Math.round(cx+(dx/d)*36)} y1={Math.round(cy+(dy/d)*36)} x2={Math.round(p.x-(dx/d)*nr)} y2={Math.round(p.y-(dy/d)*nr)} stroke="#3A3A38" strokeWidth="0.8" />
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
              const useJagged=c.type==='historical'||c.type==='personal'
              return (
                <g key={i} onClick={()=>setSelectedConn(isSelected?null:c)} style={{cursor:'pointer'}}>
                  <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={14} />
                  {useJagged&&jaggedPaths[i] ? (
                    <path d={jaggedPaths[i]}
                      fill="none"
                      stroke={lineColor}
                      strokeWidth={isSelected?style.strokeWidth+1:style.strokeWidth}
                      opacity={dimmed?0.1:isSelected?1:style.opacity} />
                  ) : (
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke={lineColor}
                      strokeWidth={isSelected?style.strokeWidth+1:style.strokeWidth}
                      strokeDasharray={style.dasharray}
                      opacity={dimmed?0.1:isSelected?1:style.opacity} />
                  )}
                </g>
              )
            })}

            {/* You node */}
            <circle cx={cx} cy={cy} r={isMobile?26:34} fill="#E8E0D0" />
            <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?10:13} fill="#1A1A1A" fontFamily="Inconsolata,monospace" fontWeight="600">You</text>

            {/* Trinket nodes — animated appearance */}
            {trinkets.map((t,idx)=>{
              if(!visibleNodes.includes(idx)) return null
              const p=pos[t.id]; if(!p) return null
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
                  <circle cx={p.x} cy={p.y} r={nr} fill={fill} stroke="#E8E0D0" strokeWidth={sw} opacity={dimmed?0.2:1} />
                  {lines.map((ln,li)=>(
                    <text key={li} x={p.x} y={startY+li*lh} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?7:8.5} fill={tc} fontFamily="Inconsolata,monospace" fontWeight="500" opacity={dimmed?0.2:1}>{ln}</text>
                  ))}
                  {t.date&&<text x={lx} y={ly} textAnchor="middle" fontSize={isMobile?8:9.5} fill="#888880" fontFamily="Inconsolata,monospace" opacity={dimmed?0.1:1}>{t.date}</text>}
                </g>
              )
            })}
          </svg>

          {/* Legend — line styles */}
          <div style={{ display:'flex',gap:'14px',flexWrap:'wrap',justifyContent:'center',marginTop:'6px' }}>
            {usedTypes.map(type=>{
              const s=LINE_STYLES[type]||LINE_STYLES.historical
              return (
                <div key={type} style={{ display:'flex',alignItems:'center',gap:'5px' }}>
                  <svg width="24" height="12">
                    <line x1="0" y1="6" x2="24" y2="6" stroke="#E8E0D0" strokeWidth={s.strokeWidth} strokeDasharray={s.dasharray} opacity={s.opacity} />
                  </svg>
                  <span style={{ fontFamily:'Inconsolata,monospace',fontSize:'9px',color:'#888880' }}>{type}</span>
                </div>
              )
            })}
            <span style={{ fontFamily:'Inconsolata,monospace',fontSize:'9px',color:'#555548' }}>outer = oldest · inner = newest</span>
          </div>

          {/* Connection tooltip */}
          {selectedConn&&(()=>{
            const a=trinkets.find(t=>t.id===selectedConn.ids[0])
            const b=trinkets.find(t=>t.id===selectedConn.ids[1])
            return (
              <div style={{ position:'absolute',bottom:'72px',background:'#1A1A1A',border:'0.5px solid #444',borderRadius:'6px',padding:'12px 16px',maxWidth:'360px',textAlign:'center',animation:'fadeUp 0.2s ease forwards',zIndex:10 }}>
                <div style={{ fontSize:'12px',color:'#E8E0D0',fontFamily:'Inconsolata,monospace',marginBottom:'5px',fontWeight:500 }}>{a?.name} × {b?.name}</div>
                <div style={{ fontSize:'10px',color:'#A89880',fontFamily:'Inconsolata,monospace',marginBottom:'5px',fontStyle:'italic' }}>{selectedConn.label}</div>
                {selectedConn.detail&&<div style={{ fontSize:'10px',color:'#888880',fontFamily:'Inconsolata,monospace',lineHeight:1.75 }}>{selectedConn.detail}</div>}
                <button onClick={()=>setSelectedConn(null)} style={{ marginTop:'8px',background:'none',border:'none',color:'#555',fontSize:'10px',cursor:'pointer',fontFamily:'Inconsolata,monospace' }}>dismiss</button>
              </div>
            )
          })()}

          <button onClick={onReveal} style={{ marginTop:'10px',padding:'10px 36px',borderRadius:'12px',border:'1px solid #E8E0D0',background:'none',color:'#E8E0D0',fontFamily:'JacquardaBastarda9,cursive',fontSize:'20px',cursor:'pointer',transition:'all 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#E8E0D0';e.currentTarget.style.color='#2A2A2A'}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#E8E0D0'}}>
            Reveal Archetype
          </button>
        </div>

      ) : (
        <div style={{ position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem',background:'#2A2A2A' }}>
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
