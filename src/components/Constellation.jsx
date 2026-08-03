// v46 rebuild
import { useEffect, useState, useMemo, useRef } from 'react'
import { findKnownConnections, findInferredConnections, connCountMap } from '../connections'
import { getAxisScores } from '../archetypes'

function parseYear(d) { const m = String(d||'').match(/\d{3,4}/); return m ? parseInt(m[0]) : null }

function getNodeFill(i) {
  return ['#E8E0D0','#E8E0D0','rgba(232,224,208,0.45)','none','none','rgba(232,224,208,0.18)'][i%6]
}
function getTextFill(fill) { return fill==='#E8E0D0'?'#1A1A1A':'#E8E0D0' }

const LS = {
  historical:  {w:2.5, dash:undefined,    op:0.9},
  geographic:  {w:1,   dash:'6 3',        op:0.85},
  material:    {w:1.5, dash:'2 2',        op:0.8},
  personal:    {w:3,   dash:undefined,    op:0.7},
  emotional:   {w:1,   dash:'8 2 2 2',   op:0.75},
  acquisition: {w:2,   dash:'4 4',        op:0.8},
  cultural:    {w:1.5, dash:'1 3',        op:0.85},
  functional:  {w:2,   dash:'6 2 1 2',   op:0.8},
  conceptual:  {w:1.5, dash:'3 2 1 2',   op:0.8},
  economic:    {w:2,   dash:'5 2',        op:0.8},
  inferred:    {w:1,   dash:'3 5',        op:0.6},
}

function spreadNodes(rawPos, minDist, cx, cy, youR, iters=120) {
  const pos = Object.fromEntries(Object.entries(rawPos).map(([k,v])=>[k,{x:v.x,y:v.y}]))
  const ids = Object.keys(pos)
  const minFromCentre = youR + minDist * 0.7
  for(let it=0;it<iters;it++) {
    let moved = false
    for(const id of ids) {
      const p=pos[id], dx=p.x-cx, dy=p.y-cy, d=Math.sqrt(dx*dx+dy*dy)||1
      if(d<minFromCentre){pos[id]={x:p.x+(dx/d)*(minFromCentre-d),y:p.y+(dy/d)*(minFromCentre-d)};moved=true}
    }
    for(let i=0;i<ids.length;i++) for(let j=i+1;j<ids.length;j++){
      const a=pos[ids[i]],b=pos[ids[j]],dx=b.x-a.x,dy=b.y-a.y,d=Math.sqrt(dx*dx+dy*dy)
      if(d<minDist&&d>0){const push=(minDist-d)/2,nx=dx/d,ny=dy/d;pos[ids[i]]={x:a.x-nx*push,y:a.y-ny*push};pos[ids[j]]={x:b.x+nx*push,y:b.y+ny*push};moved=true}
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
  const [visibleNodes, setVisibleNodes] = useState([])
  const [visibleConns, setVisibleConns] = useState([])
  const [nodeProgress, setNodeProgress] = useState({})
  const [orbitAngle, setOrbitAngle] = useState(0)
  const [aiConns, setAiConns] = useState([])
  const [aiLoading, setAiLoading] = useState(false)
  const [showTip, setShowTip] = useState(()=>!localStorage.getItem('bib_tip'))
  const [ripple, setRipple] = useState({id:null,r:0})
  const orbitRef = useRef(null)
  const rippleRef = useRef(null)

  const knownConns = useMemo(()=>findKnownConnections(trinkets),[trinkets])
  const inferredConns = useMemo(()=>findInferredConnections(trinkets),[trinkets])

  // activeConns: known = solid data connections, inferred = inferred + AI
  const activeConns = useMemo(()=>{
    const result = []
    if(showKnown) result.push(...knownConns)
    if(showInferred){
      result.push(...inferredConns)
      const seen = new Set(result.map(c=>`${Math.min(...c.ids)}-${Math.max(...c.ids)}`))
      aiConns.forEach(c=>{
        const k=`${Math.min(...c.ids)}-${Math.max(...c.ids)}`
        if(!seen.has(k)) result.push(c)
      })
    }
    return result
  },[showKnown,showInferred,knownConns,inferredConns,aiConns])

  const axes = getAxisScores(trinkets)

  // Axes animation
  useEffect(()=>{setTimeout(()=>setAxesAnimated(true),300)},[view])

  // Groq AI connections — free, no billing required
  useEffect(()=>{
    if(trinkets.length<2) return
    const cacheKey='bib_ai_'+[...trinkets.map(t=>String(t.id))].sort().join('_')
    const cached=sessionStorage.getItem(cacheKey)
    if(cached){try{setAiConns(JSON.parse(cached));return}catch(e){}}

    const apiKey=process.env.REACT_APP_GROQ_KEY
    if(!apiKey){console.warn('REACT_APP_GROQ_KEY not set');return}

    setAiLoading(true)

    const list=trinkets.map((t,i)=>{
      const parts=[`${i+1}. "${t.name}"`]
      if(t.date) parts.push(`date: ${t.date}`)
      if(t.place) parts.push(`place: ${t.place}`)
      if(t.material) parts.push(`material: ${t.material}`)
      if(t.note) parts.push(`note: "${t.note}"`)
      return parts.join(', ')
    }).join('\n')

    const prompt=`You are an expert in material culture, history, and the psychology of collecting.

Here is someone's personal collection of objects:
${list}

Find 4-6 interesting connections between pairs. Connections can be historical, geographic, material, cultural, personal, conceptual, or economic.

Return ONLY valid JSON, no markdown, no extra text:
{"connections":[{"object1":"exact name","object2":"exact name","type":"cultural","label":"4-6 word label","detail":"2 sentences with specific facts."}]}`

    fetch('https://api.groq.com/openai/v1/chat/completions',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${apiKey}`},
      body:JSON.stringify({
        model:'llama-3.3-70b-versatile',
        messages:[
          {role:'system',content:'You are an expert in material culture and history. Always respond with valid JSON only, no markdown.'},
          {role:'user',content:prompt}
        ],
        temperature:0.7,
        max_tokens:1200,
      })
    })
    .then(r=>r.json())
    .then(data=>{
      if(data.error){console.warn('Groq error:',data.error.message);setAiLoading(false);return}
      const text=data?.choices?.[0]?.message?.content||''
      const match=text.match(/\{[\s\S]*\}/)
      if(!match){console.warn('No JSON found');setAiLoading(false);return}
      const parsed=JSON.parse(match[0])
      if(!parsed.connections){setAiLoading(false);return}
      const mapped=parsed.connections.map(c=>{
        const n1=(c.object1||'').toLowerCase()
        const n2=(c.object2||'').toLowerCase()
        const a=trinkets.find(t=>t.name.toLowerCase()===n1||n1.includes(t.name.toLowerCase().split(' ')[0]))
        const b=trinkets.find(t=>t.name.toLowerCase()===n2||n2.includes(t.name.toLowerCase().split(' ')[0]))
        if(!a||!b||a.id===b.id) return null
        return{ids:[a.id,b.id],type:c.type||'cultural',label:c.label,detail:c.detail,inferred:true,ai:true}
      }).filter(Boolean)
      setAiConns(mapped)
      sessionStorage.setItem(cacheKey,JSON.stringify(mapped))
      setAiLoading(false)
    })
    .catch(err=>{console.warn('Groq error:',err.message);setAiLoading(false)})
  },[trinkets.length])

  // Orbital drift
  useEffect(()=>{
    const start=performance.now()
    const tick=(now)=>{
      setOrbitAngle((now-start)/1000*(2*Math.PI/25))
      orbitRef.current=requestAnimationFrame(tick)
    }
    orbitRef.current=requestAnimationFrame(tick)
    return()=>cancelAnimationFrame(orbitRef.current)
  },[])

  // Node entry animation — fires on mount automatically
  useEffect(()=>{
    setVisibleNodes([])
    setVisibleConns([])
    setNodeProgress({})
    const timers=[]
    trinkets.forEach((t,i)=>{
      timers.push(setTimeout(()=>{
        setVisibleNodes(v=>[...v,i])
        const start=performance.now(),dur=1800
        const anim=(now)=>{
          const p=Math.min((now-start)/dur,1)
          setNodeProgress(prev=>({...prev,[t.id]:1-Math.pow(1-p,3)}))
          if(p<1) requestAnimationFrame(anim)
        }
        requestAnimationFrame(anim)
      },i*250))
    })
    // Schedule enough connection slots
    const connDelay=trinkets.length*250+1800
    for(let i=0;i<60;i++) timers.push(setTimeout(()=>setVisibleConns(v=>[...v,i]),connDelay+i*100))
    return()=>timers.forEach(clearTimeout)
  },[trinkets.length])

  const isMobile=window.innerWidth<600
  const W=isMobile?380:700,H=isMobile?400:580,cx=W/2,cy=H/2
  const MAX_R=isMobile?155:275,MIN_R=isMobile?55:80,margin=55
  const youR=isMobile?26:32

  const trinketYears=useMemo(()=>trinkets.map(t=>parseYear(t.date)||2000),[trinkets])
  const minYear=useMemo(()=>Math.min(...trinketYears),[trinketYears])
  const maxYear=useMemo(()=>Math.max(...trinketYears),[trinketYears])

  const rawPos=useMemo(()=>{
    const p={},range=maxYear-minYear||1
    trinkets.forEach((t,i)=>{
      const r=MAX_R-((trinketYears[i]-minYear)/range)*(MAX_R-MIN_R)
      const angle=i*2.399963-Math.PI/2
      p[t.id]={x:Math.max(margin,Math.min(W-margin,cx+r*Math.cos(angle))),y:Math.max(margin,Math.min(H-margin,cy+r*Math.sin(angle)))}
    })
    return p
  },[trinkets,trinketYears,minYear,maxYear])

  const nodeR=(name)=>{
    const maxLen=Math.max(...(name||'').split(' ').map(w=>w.length))
    return Math.max(isMobile?16:22,Math.min(maxLen*(isMobile?4.5:5.8)+10,isMobile?40:50))
  }
  const minDist=useMemo(()=>(trinkets.length?Math.max(...trinkets.map(t=>nodeR(t.name)))*2+16:50),[trinkets])
  const finalPos=useMemo(()=>spreadNodes(rawPos,minDist,cx,cy,youR),[rawPos,minDist,cx,cy,youR])

  const getAnimPos=(id,fp)=>{
    const p=nodeProgress[id]??0
    if(p>=1) return fp
    const angle=Math.atan2(fp.y-cy,fp.x-cx)
    const r=MAX_R*1.1+(Math.sqrt((fp.x-cx)**2+(fp.y-cy)**2)-MAX_R*1.1)*p
    return{x:cx+r*Math.cos(angle+(1-p)*Math.PI*2),y:cy+r*Math.sin(angle+(1-p)*Math.PI*2)}
  }
  const getDriftPos=(id,ap,idx)=>{
    if(!ap||(nodeProgress[id]??0)<1) return ap
    const phase=(idx/Math.max(trinkets.length,1))*2*Math.PI
    return{x:ap.x+Math.cos(orbitAngle+phase)*10,y:ap.y+Math.sin(orbitAngle+phase)*10}
  }

  const hoveredConnIds=useMemo(()=>hoveredNode?new Set(activeConns.filter(c=>c.ids.includes(hoveredNode)).flatMap(c=>c.ids)):new Set(),[hoveredNode,activeConns])
  const sortedYears=useMemo(()=>[...new Set(trinketYears)].sort((a,b)=>a-b),[trinketYears])
  const usedTypes=[...new Set(activeConns.map(c=>c.inferred?'inferred':c.type))]

  return (
    <div style={{position:'fixed',inset:0,background:'#1E1E1E'}}>
      {view==='map'?(
        <div style={{position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0.5rem'}}>

          {/* Toggles */}
          <div style={{display:'flex',gap:'8px',marginBottom:'4px',flexWrap:'wrap',justifyContent:'center',alignItems:'center'}}>
            <span style={{fontFamily:'Inconsolata,monospace',fontSize:'10px',color:'#686860',letterSpacing:'0.04em'}}>show:</span>
            <button onClick={()=>setShowKnown(v=>!v)} style={{padding:'5px 14px',borderRadius:'99px',border:`1px solid ${showKnown?'#E8E0D0':'#444'}`,background:showKnown?'rgba(232,224,208,0.15)':'none',color:showKnown?'#E8E0D0':'#686860',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer',transition:'all 0.2s'}}>
              {showKnown?'✓ ':''}known
            </button>
            <button onClick={()=>setShowInferred(v=>!v)} style={{padding:'5px 14px',borderRadius:'99px',border:`1px solid ${showInferred?'#E8E0D0':'#444'}`,background:showInferred?'rgba(232,224,208,0.15)':'none',color:showInferred?'#E8E0D0':'#686860',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer',transition:'all 0.2s'}}>
              {showInferred?'✓ ':''}inferred + AI
            </button>
            <button onClick={()=>{setView('analysis');setAxesAnimated(false);setTimeout(()=>setAxesAnimated(true),200)}} style={{padding:'5px 14px',borderRadius:'99px',border:'0.5px solid #3A3A3A',background:'none',color:'#686860',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer'}}>analysis →</button>
          </div>

          {/* AI status */}
          {aiLoading&&<p style={{fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#888870',fontStyle:'italic',marginBottom:'3px'}}>finding connections…</p>}
          {!aiLoading&&aiConns.length>0&&<p style={{fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#6A9060',marginBottom:'3px'}}>{aiConns.length} AI connections found</p>}

          {/* Empty state */}
          {trinkets.length<3?(
            <div style={{textAlign:'center',padding:'3rem 1rem'}}>
              <p style={{fontFamily:'JacquardaBastarda9,cursive',fontSize:'28px',color:'#E8E0D0',marginBottom:'12px'}}>not enough objects</p>
              <p style={{fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#808078',lineHeight:1.8,marginBottom:'20px'}}>add at least 3 objects to generate your constellation</p>
              <button onClick={onBack} style={{padding:'10px 28px',borderRadius:'99px',border:'0.5px solid #E8E0D0',background:'none',color:'#E8E0D0',fontFamily:'Inconsolata,monospace',fontSize:'12px',letterSpacing:'0.06em',cursor:'pointer'}}>← add more objects</button>
            </div>
          ):(
            <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',maxWidth:`${W}px`,maxHeight:'60vh'}}>

              {/* Rings */}
              {sortedYears.map((year,yi)=>{
                const r=MAX_R-((year-minYear)/(maxYear-minYear||1))*(MAX_R-MIN_R)
                return(
                  <g key={year}>
                    <circle cx={cx} cy={cy} r={Math.round(r)} fill="none" stroke="#585850" strokeWidth="1.5" strokeDasharray="2 5"/>
                    {(yi===0||yi===sortedYears.length-1)&&(
                      <text x={Math.min(cx+Math.round(r)+8,W-50)} y={cy} fontSize="13" fill="#A0A090" fontFamily="Inconsolata,monospace" dominantBaseline="central" fontStyle="italic" fontWeight="600">
                        {yi===0?`oldest · ${year}`:`newest · ${year}`}
                      </text>
                    )}
                  </g>
                )
              })}

              {/* Spokes */}
              {trinkets.map((t,i)=>{
                if(!visibleNodes.includes(i)) return null
                const fp=finalPos[t.id];if(!fp) return null
                const p=getDriftPos(t.id,getAnimPos(t.id,fp),i)
                const dx=p.x-cx,dy=p.y-cy,d=Math.sqrt(dx*dx+dy*dy)||1
                const nr=nodeR(t.name)
                return <line key={t.id} x1={cx+(dx/d)*34} y1={cy+(dy/d)*34} x2={p.x-(dx/d)*nr} y2={p.y-(dy/d)*nr} stroke="#2A2A28" strokeWidth="0.8"/>
              })}

              {/* Connections */}
              {activeConns.map((c,i)=>{
                if(!visibleConns.includes(i)) return null
                const fp1=finalPos[c.ids[0]],fp2=finalPos[c.ids[1]]
                if(!fp1||!fp2) return null
                const idx1=trinkets.findIndex(t=>t.id===c.ids[0]),idx2=trinkets.findIndex(t=>t.id===c.ids[1])
                const p1=getDriftPos(c.ids[0],getAnimPos(c.ids[0],fp1),idx1)
                const p2=getDriftPos(c.ids[1],getAnimPos(c.ids[1],fp2),idx2)
                const s=LS[c.inferred?'inferred':c.type]||LS.historical
                const isSel=selectedConn===c
                const isHov=hoveredNode&&c.ids.includes(hoveredNode)
                const dimmed=hoveredNode&&!isHov
                return(
                  <g key={i} onClick={()=>{setSelectedConn(isSel?null:c);if(showTip){setShowTip(false);localStorage.setItem('bib_tip','1')}}} style={{cursor:'pointer'}}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={12}/>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke={isSel?'#FFFFFF':'#E8E0D0'}
                      strokeWidth={isSel?s.w+1:s.w}
                      strokeDasharray={c.inferred?'5 3':s.dash}
                      strokeDashoffset={c.inferred?-orbitAngle*18:0}
                      opacity={dimmed?0.1:isSel?1:s.op}
                      style={{transition:'opacity 0.3s ease'}}/>
                  </g>
                )
              })}

              {/* You node */}
              <circle cx={cx} cy={cy} r={youR} fill="#E8E0D0"/>
              <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?11:15} fill="#1A1A1A" fontFamily="Inconsolata,monospace" fontWeight="700">You</text>

              {/* Trinket nodes */}
              {trinkets.map((t,idx)=>{
                if(!visibleNodes.includes(idx)) return null
                const fp=finalPos[t.id];if(!fp) return null
                const p=getDriftPos(t.id,getAnimPos(t.id,fp),idx)
                const nr=nodeR(t.name)
                const fill=getNodeFill(idx)
                const tc=getTextFill(fill)
                const dimmed=hoveredNode&&hoveredNode!==t.id&&!hoveredConnIds.has(t.id)
                const words=t.name.split(' ')
                let lines=[],line=''
                words.forEach(w=>{if((line+' '+w).trim().length<=11){line=(line+' '+w).trim()}else{if(line)lines.push(line);line=w}})
                if(line) lines.push(line)
                lines=lines.slice(0,2)
                const lh=11,startY=p.y-((lines.length-1)*lh)/2
                const angle=Math.atan2(p.y-cy,p.x-cx)
                return(
                  <g key={t.id}
                    onMouseEnter={()=>{
                      setHoveredNode(t.id)
                      cancelAnimationFrame(rippleRef.current)
                      const s=performance.now()
                      const pulse=(now)=>{
                        const r=nr+((now-s)/500)*36
                        setRipple({id:t.id,r})
                        if((now-s)<500) rippleRef.current=requestAnimationFrame(pulse)
                        else setRipple({id:null,r:0})
                      }
                      rippleRef.current=requestAnimationFrame(pulse)
                    }}
                    onMouseLeave={()=>setHoveredNode(null)}
                    style={{cursor:'default'}}>
                    {ripple.id===t.id&&<circle cx={p.x} cy={p.y} r={ripple.r} fill="none" stroke="#E8E0D0" strokeWidth="0.5" opacity={Math.max(0,0.4-(ripple.r-nr)/36*0.4)}/>}
                    <circle cx={p.x} cy={p.y} r={nr} fill={fill} stroke="#C8C4BC" strokeWidth={fill==='#E8E0D0'?1.5:0.8} opacity={dimmed?0.2:1} style={{transition:'opacity 0.3s ease'}}/>
                    {lines.map((ln,li)=>(
                      <text key={li} x={p.x} y={startY+li*lh} textAnchor="middle" dominantBaseline="central" fontSize={isMobile?9:12} fill={tc} fontFamily="Inconsolata,monospace" fontWeight="600" opacity={dimmed?0.2:1}>{ln}</text>
                    ))}
                    {t.date&&<text x={p.x+Math.cos(angle)*(nr+18)} y={p.y+Math.sin(angle)*(nr+12)} textAnchor="middle" fontSize={isMobile?9:11} fill="#A0A090" fontFamily="Inconsolata,monospace" opacity={dimmed?0.1:1}>{t.date}</text>}
                  </g>
                )
              })}
            </svg>
          )}

          {/* Legend */}
          {trinkets.length>=3&&(
            <div style={{display:'flex',gap:'12px',flexWrap:'wrap',justifyContent:'center',marginTop:'6px'}}>
              {usedTypes.map(type=>{
                const s=LS[type]||LS.historical
                return(
                  <div key={type} style={{display:'flex',alignItems:'center',gap:'5px'}}>
                    <svg width="22" height="10"><line x1="0" y1="5" x2="22" y2="5" stroke="#E8E0D0" strokeWidth={s.w} strokeDasharray={s.dash} opacity={s.op}/></svg>
                    <span style={{fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#B0B0A0'}}>{type}</span>
                  </div>
                )
              })}
              <span style={{fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#686860'}}>outer = oldest · inner = newest</span>
            </div>
          )}

          {/* First-use tip */}
          {showTip&&activeConns.length>0&&(
            <p style={{fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#686860',fontStyle:'italic',marginTop:'4px'}}>
              tap a connection line to see what links these objects
            </p>
          )}

          {/* Connection detail */}
          {selectedConn&&(()=>{
            const a=trinkets.find(t=>t.id===selectedConn.ids[0])
            const b=trinkets.find(t=>t.id===selectedConn.ids[1])
            return(
              <div style={{position:'absolute',bottom:'72px',background:'#141414',border:'0.5px solid #3A3A3A',borderRadius:'6px',padding:'12px 16px',maxWidth:'400px',textAlign:'center',maxHeight:'200px',overflowY:'auto',animation:'fadeUp 0.2s ease forwards',zIndex:10}}>
                <div style={{fontSize:'13px',color:'#E8E0D0',fontFamily:'Inconsolata,monospace',marginBottom:'5px',fontWeight:500}}>{a?.name} × {b?.name}</div>
                <div style={{fontSize:'11px',color:'#A89880',fontFamily:'Inconsolata,monospace',marginBottom:'5px',fontStyle:'italic'}}>{selectedConn.label}</div>
                {selectedConn.detail&&<div style={{fontSize:'11px',color:'#909088',fontFamily:'Inconsolata,monospace',lineHeight:1.75}}>{selectedConn.detail}</div>}
                <button onClick={()=>setSelectedConn(null)} style={{marginTop:'8px',background:'none',border:'none',color:'#555',fontSize:'11px',cursor:'pointer',fontFamily:'Inconsolata,monospace'}}>dismiss</button>
              </div>
            )
          })()}

          {/* Bottom buttons */}
          {trinkets.length>=3&&(
            <div style={{display:'flex',gap:'10px',alignItems:'center',marginTop:'10px',flexWrap:'wrap',justifyContent:'center'}}>
              <button onClick={onBack} style={{padding:'9px 20px',borderRadius:'99px',border:'0.5px solid #686858',background:'none',color:'#A0A090',fontFamily:'Inconsolata,monospace',fontSize:'11px',cursor:'pointer',letterSpacing:'0.06em',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.color='#E8E0D0';e.currentTarget.style.borderColor='#E8E0D0'}}
                onMouseLeave={e=>{e.currentTarget.style.color='#A0A090';e.currentTarget.style.borderColor='#686858'}}>
                ← add more objects
              </button>
              <button onClick={onReveal} style={{padding:'10px 36px',borderRadius:'12px',border:'1px solid #E8E0D0',background:'none',color:'#E8E0D0',fontFamily:'JacquardaBastarda9,cursive',fontSize:'20px',cursor:'pointer',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#E8E0D0';e.currentTarget.style.color='#1E1E1E'}}
                onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#E8E0D0'}}>
                Reveal Archetype
              </button>
            </div>
          )}
        </div>
      ):(
        <div style={{position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem',background:'#1E1E1E'}}>
          <button onClick={()=>setView('map')} style={{position:'absolute',top:'24px',left:'24px',background:'none',border:'none',color:'#888',fontFamily:'Inconsolata,monospace',fontSize:'12px',cursor:'pointer',letterSpacing:'0.06em'}}>← map</button>
          <h2 style={{fontFamily:'Inconsolata,monospace',fontSize:'clamp(28px,4vw,44px)',fontWeight:400,color:'#E8E0D0',marginBottom:'3rem',letterSpacing:'0.04em'}}>Analysis</h2>
          <div style={{width:'100%',maxWidth:'560px'}}>
            {axes.map(a=>(
              <div key={a.label} style={{display:'flex',alignItems:'center',gap:'20px',marginBottom:'22px'}}>
                <div style={{fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#E8E0D0',width:'180px',flexShrink:0,letterSpacing:'0.04em'}}>{a.label}</div>
                <div style={{flex:1,height:'2px',background:'#3A3A3A'}}>
                  <div style={{height:'100%',background:'#E8E0D0',width:axesAnimated?`${a.value}%`:'0%',transition:'width 1.4s cubic-bezier(.4,0,.2,1)'}}/>
                </div>
                <div style={{fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#E8E0D0',width:'36px',textAlign:'right',flexShrink:0}}>{a.value}</div>
              </div>
            ))}
          </div>
          <button onClick={onReveal} style={{marginTop:'2rem',padding:'10px 36px',borderRadius:'12px',border:'1px solid #E8E0D0',background:'none',color:'#E8E0D0',fontFamily:'JacquardaBastarda9,cursive',fontSize:'20px',cursor:'pointer'}}>Reveal Archetype</button>
        </div>
      )}
    </div>
  )
}
