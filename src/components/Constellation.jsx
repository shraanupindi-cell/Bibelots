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
  AI:          {w:2,   dash:'8 3',        op:0.95},
}

// Confidence-based visual weight for AI connections
function aiLineStyle(confidence) {
  if (confidence === 3) return { w: 2.5, dash: undefined,  op: 1.0 }   // strong — solid thick
  if (confidence === 2) return { w: 1.5, dash: '6 3',      op: 0.85 }  // medium — long dash
  return                        { w: 1,   dash: '3 5',      op: 0.6 }   // weak — sparse dot
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
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({x:0,y:0})
  const isDragging = useRef(false)
  const dragStart = useRef({x:0,y:0,px:0,py:0})
  const orbitRef = useRef(null)
  const rippleRef = useRef(null)

  const knownConns = useMemo(()=>findKnownConnections(trinkets),[trinkets])
  const inferredConns = useMemo(()=>findInferredConnections(trinkets),[trinkets])

  // activeConns: AI connections take priority over hardcoded inferred
  const activeConns = useMemo(()=>{
    const result = []
    if(showKnown) result.push(...knownConns)
    if(showInferred){
      // Add AI connections first
      result.push(...aiConns)
      const aiSeen = new Set(aiConns.map(c=>`${Math.min(...c.ids)}-${Math.max(...c.ids)}`))
      const knownSeen = new Set(knownConns.map(c=>`${Math.min(...c.ids)}-${Math.max(...c.ids)}`))
      // Only add hardcoded inferred if AI hasn't covered that pair
      inferredConns.forEach(c=>{
        const k=`${Math.min(...c.ids)}-${Math.max(...c.ids)}`
        if(!aiSeen.has(k) && !knownSeen.has(k)) result.push(c)
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

    const prompt=`You are an ontologist and cultural historian specialising in material culture. Map semantic relationships between objects using formal ontological reasoning.

OBJECTS:
${list}

RELATIONSHIP TYPES:
- is-a: both belong to same category (numismatic objects, devotional objects, craft objects)
- has-a: compositional — share the same material process or component
- made-in: same city, region, or production centre
- made-by: same maker tradition, guild, or craft lineage
- traded-via: connected through same trade route, market, or colonial economy
- coexisted-with: both circulated in same time and place
- preceded-by: one tradition directly gave rise to the other
- influenced-by: one tradition demonstrably shaped the other

RULES:
1. Only assert relationships that are historically or materially verifiable. No symbolism. No metaphor.
2. If no verifiable link exists between two objects, do not include that pair.
3. Confidence: 3=direct verifiable (same dynasty/kiln/route), 2=strong circumstantial (same region/period), 1=skip.
4. Max 6 connections. Only confidence 2 or 3.

Return ONLY valid JSON:
{"connections":[{"object1":"exact name","object2":"exact name","relation":"is-a","confidence":3,"label":"4-6 word label","detail":"1-2 sentences naming the dynasty, trade route, craft tradition, or geographic centre."}]}`

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
  const n=trinkets.length||3
  const W=isMobile?360:Math.min(460+n*18,800)
  const H=isMobile?340:Math.min(380+n*16,660)
  const cx=W/2,cy=H/2
  const MAX_R=isMobile?130:Math.min(160+n*10,300)
  const MIN_R=isMobile?42:Math.min(50+n*4,80)
  const margin=isMobile?44:62
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

  // Precompute ring radii for size calculation (no circular dep)
  const ringRadii = useMemo(()=>{
    const range=maxYear-minYear||1
    const m={}
    trinkets.forEach((t,i)=>{
      const yearT=(trinketYears[i]-minYear)/range
      m[t.id]=MAX_R-yearT*(MAX_R-MIN_R) // bigger r = older = further out = bigger node
    })
    return m
  },[trinkets,trinketYears,minYear,maxYear])

  const nodeR=(name, id)=>{
    const maxLen=Math.max(...(name||'').split(' ').map(w=>w.length))
    // Shrink base size as node count grows
    const countScale=Math.max(0.5, 1-(n-3)*0.05)
    const textBase=Math.max(isMobile?11:13,Math.min(maxLen*(isMobile?3:3.8)*countScale+5,isMobile?24:32))
    // Subtle distance bonus — older nodes slightly bigger
    const r=ringRadii[id]||MIN_R
    const distT=Math.min((r-MIN_R)/(MAX_R-MIN_R),1)
    const distBonus=distT*(isMobile?4:6)*countScale
    return Math.round(textBase+distBonus)
  }
  const minDist=useMemo(()=>(trinkets.length?Math.max(...trinkets.map(t=>nodeR(t.name,t.id)))*2+20:50),[trinkets,ringRadii])
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
    // Each node drifts in a tiny circle around its own settled position
    // Phase offset by golden angle per node — they never sync
    const phase=idx*2.399963
    const driftR=5
    return{
      x:ap.x+Math.cos(orbitAngle+phase)*driftR,
      y:ap.y+Math.sin(orbitAngle+phase)*driftR,
    }
  }

  const hoveredConnIds=useMemo(()=>hoveredNode?new Set(activeConns.filter(c=>c.ids.includes(hoveredNode)).flatMap(c=>c.ids)):new Set(),[hoveredNode,activeConns])
  const sortedYears=useMemo(()=>[...new Set(trinketYears)].sort((a,b)=>a-b),[trinketYears])
  const usedTypes=[...new Set(activeConns.map(c=>c.ai?'AI':c.inferred?'inferred':c.type))]

  return (
    <div style={{position:'fixed',inset:0,background:'#1E1E1E'}}>
      {view==='map'?(
        <div style={{position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'0.5rem'}}>

          {/* Toggles */}
          <div style={{display:'flex',gap:'8px',marginBottom:'4px',flexWrap:'wrap',justifyContent:'center',alignItems:'center'}}>
            <span style={{fontFamily:'Inconsolata,monospace',fontSize:'10px',color:'#686860',letterSpacing:'0.04em'}}>show:</span>
            <button onClick={()=>setShowKnown(v=>!v)} style={{padding:'5px 14px',borderRadius:'99px',border:`1px solid ${showKnown?'#E8E0D0':'#444'}`,background:showKnown?'rgba(232,224,208,0.15)':'none',color:showKnown?'#E8E0D0':'#686860',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer',transition:'all 0.2s'}}>
              {showKnown?' ':''}known
            </button>
            <button onClick={()=>setShowInferred(v=>!v)} style={{padding:'5px 14px',borderRadius:'99px',border:`1px solid ${showInferred?'#E8E0D0':'#444'}`,background:showInferred?'rgba(232,224,208,0.15)':'none',color:showInferred?'#E8E0D0':'#686860',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer',transition:'all 0.2s'}}>
              {showInferred?' ':''}inferred + AI
            </button>
            <button onClick={()=>{setView('analysis');setAxesAnimated(false);setTimeout(()=>setAxesAnimated(true),200)}} style={{padding:'5px 14px',borderRadius:'99px',border:'0.5px solid #3A3A3A',background:'none',color:'#686860',fontFamily:'Inconsolata,monospace',fontSize:'10px',letterSpacing:'0.06em',cursor:'pointer'}}>Analysis -></button>
          </div>

          {/* AI status */}
          {aiLoading&&<p style={{fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#888870',fontStyle:'italic',marginBottom:'3px'}}>finding connections...</p>}
          {!aiLoading&&aiConns.length>0&&<p style={{fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#6A9060',marginBottom:'3px'}}>{aiConns.length} AI connections found</p>}

          {/* Empty state */}
          {trinkets.length<3?(
            <div style={{textAlign:'center',padding:'3rem 1rem'}}>
              <p style={{fontFamily:'JacquardaBastarda9,cursive',fontSize:'28px',color:'#E8E0D0',marginBottom:'12px'}}>not enough objects</p>
              <p style={{fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#808078',lineHeight:1.8,marginBottom:'20px'}}>add at least 3 objects to generate your constellation</p>
              <button onClick={onBack} style={{padding:'10px 28px',borderRadius:'99px',border:'0.5px solid #E8E0D0',background:'none',color:'#E8E0D0',fontFamily:'Inconsolata,monospace',fontSize:'12px',letterSpacing:'0.06em',cursor:'pointer'}}>Add More Objects</button>
            </div>
          ):(
            <div
              style={{width:'100%',maxHeight:'62vh',overflow:'hidden',cursor:isDragging.current?'grabbing':'grab',touchAction:'none',overscrollBehavior:'none'}}
              onWheel={e=>{setZoom(z=>Math.max(0.5,Math.min(4,z*(e.deltaY<0?1.12:0.9))))}}
              onMouseDown={e=>{isDragging.current=true;dragStart.current={x:e.clientX,y:e.clientY,px:pan.x,py:pan.y}}}
              onMouseMove={e=>{if(!isDragging.current)return;setPan({x:dragStart.current.px+(e.clientX-dragStart.current.x),y:dragStart.current.py+(e.clientY-dragStart.current.y)})}}
              onMouseUp={()=>{isDragging.current=false}}
              onMouseLeave={()=>{isDragging.current=false}}
              onTouchStart={e=>{isDragging.current=true;const t=e.touches[0];dragStart.current={x:t.clientX,y:t.clientY,px:pan.x,py:pan.y}}}
              onTouchMove={e=>{if(!isDragging.current)return;const t=e.touches[0];setPan({x:dragStart.current.px+(t.clientX-dragStart.current.x),y:dragStart.current.py+(t.clientY-dragStart.current.y)})}}
              onTouchEnd={()=>{isDragging.current=false}}
            >
              <div style={{transform:`translate(${pan.x}px,${pan.y}px) scale(${zoom})`,transformOrigin:'center center',transition:isDragging.current?'none':'transform 0.05s'}}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',height:'auto',display:'block'}}>

              {/* Rings */}
              {sortedYears.map((year,yi)=>{
                const r=MAX_R-((year-minYear)/(maxYear-minYear||1))*(MAX_R-MIN_R)
                return(
                  <g key={year}>
                    <circle cx={cx} cy={cy} r={Math.round(r)} fill="none" stroke="#585850" strokeWidth="1.5" strokeDasharray="2 5"/>
                    {(yi===0||yi===sortedYears.length-1)&&(
                      <text x={Math.min(cx+Math.round(r)+8,W-50)} y={cy} fontSize="13" fill="#A0A090" fontFamily="Inconsolata,monospace" dominantBaseline="central" fontStyle="italic" fontWeight="600">
                        {yi===0?`oldest . ${year}`:`newest . ${year}`}
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
                const nr=nodeR(t.name,t.id)
                const youR2=isMobile?26:32
                return <line key={t.id} x1={cx+(dx/d)*youR2} y1={cy+(dy/d)*youR2} x2={p.x-(dx/d)*nr} y2={p.y-(dy/d)*nr} stroke="#4A4A42" strokeWidth="1.2"/>
              })}

              {/* Connections */}
              {activeConns.map((c,i)=>{
                if(!visibleConns.includes(i)) return null
                const fp1=finalPos[c.ids[0]],fp2=finalPos[c.ids[1]]
                if(!fp1||!fp2) return null
                const idx1=trinkets.findIndex(t=>t.id===c.ids[0]),idx2=trinkets.findIndex(t=>t.id===c.ids[1])
                const p1raw=getDriftPos(c.ids[0],getAnimPos(c.ids[0],fp1),idx1)
                const p2raw=getDriftPos(c.ids[1],getAnimPos(c.ids[1],fp2),idx2)
                const ldx=p2raw.x-p1raw.x, ldy=p2raw.y-p1raw.y
                const llen=Math.sqrt(ldx*ldx+ldy*ldy)||1
                const nr1=nodeR(trinkets.find(t=>t.id===c.ids[0])?.name||'',c.ids[0])
                const nr2=nodeR(trinkets.find(t=>t.id===c.ids[1])?.name||'',c.ids[1])
                const p1={x:p1raw.x+(ldx/llen)*nr1, y:p1raw.y+(ldy/llen)*nr1}
                const p2={x:p2raw.x-(ldx/llen)*nr2, y:p2raw.y-(ldy/llen)*nr2}
                const s=c.ai ? aiLineStyle(c.confidence||2) : (LS[c.inferred?'inferred':c.type]||LS.historical)
                const isSel=selectedConn===c
                const isHov=hoveredNode&&c.ids.includes(hoveredNode)
                const dimmed=hoveredNode&&!isHov
                return(
                  <g key={i} onClick={()=>{setSelectedConn(isSel?null:c);if(showTip){setShowTip(false);localStorage.setItem('bib_tip','1')}}} style={{cursor:'pointer'}}>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="transparent" strokeWidth={12}/>
                    <line x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
                      stroke={isSel?'#FFFFFF':c.ai?'#C8D8C0':'#E8E0D0'}
                      strokeWidth={isSel?s.w+1:c.ai?2:s.w}
                      strokeDasharray={c.ai?'8 3':c.inferred?'5 3':s.dash}
                      strokeDashoffset={c.inferred||c.ai?-orbitAngle*18:0}
                      opacity={dimmed?0.1:isSel?1:c.ai?0.95:s.op}
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
                const nr=nodeR(t.name,t.id)
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
              </div>
            </div>
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
              <span style={{fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#686860'}}>outer = oldest . inner = newest</span>
            </div>
          )}

          {/* Zoom controls */}
          {trinkets.length>=3&&(
            <div style={{display:'flex',gap:'6px',alignItems:'center',marginTop:'4px'}}>
              <button onClick={()=>setZoom(z=>Math.min(4,z*1.2))} style={{padding:'3px 10px',borderRadius:'99px',border:'0.5px solid #444',background:'none',color:'#A0A090',fontFamily:'Inconsolata,monospace',fontSize:'11px',cursor:'pointer'}}>+</button>
              <button onClick={()=>{setZoom(1);setPan({x:0,y:0})}} style={{padding:'3px 10px',borderRadius:'99px',border:'0.5px solid #444',background:'none',color:'#686860',fontFamily:'Inconsolata,monospace',fontSize:'10px',cursor:'pointer'}}>Reset</button>
              <button onClick={()=>setZoom(z=>Math.max(0.5,z*0.8))} style={{padding:'3px 10px',borderRadius:'99px',border:'0.5px solid #444',background:'none',color:'#A0A090',fontFamily:'Inconsolata,monospace',fontSize:'11px',cursor:'pointer'}}>-</button>
              <span style={{fontFamily:'Inconsolata,monospace',fontSize:'10px',color:'#484840',marginLeft:'4px'}}>scroll to zoom, drag to pan</span>
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
                <div style={{fontSize:'13px',color:'#E8E0D0',fontFamily:'Inconsolata,monospace',marginBottom:'5px',fontWeight:500}}>{a?.name} x {b?.name}</div>
                <div style={{fontSize:'11px',color:'#A89880',fontFamily:'Inconsolata,monospace',marginBottom:'3px',fontStyle:'italic'}}>{selectedConn.label}</div>
                {selectedConn.ai&&<div style={{fontSize:'10px',color:'#6A8860',fontFamily:'Inconsolata,monospace',marginBottom:'5px',letterSpacing:'0.06em'}}>
                  {selectedConn.type} . confidence {selectedConn.confidence===3?'high':selectedConn.confidence===2?'medium':'low'}
                </div>}
                {selectedConn.detail&&<div style={{fontSize:'11px',color:'#909088',fontFamily:'Inconsolata,monospace',lineHeight:1.75}}>{selectedConn.detail}</div>}
                <button onClick={()=>setSelectedConn(null)} style={{marginTop:'10px',background:'none',border:'0.5px solid #555',borderRadius:'99px',padding:'5px 16px',color:'#A0A090',fontSize:'11px',cursor:'pointer',fontFamily:'Inconsolata,monospace'}}>Dismiss</button>
              </div>
            )
          })()}

          {/* Bottom buttons */}
          {trinkets.length>=3&&(
            <div style={{display:'flex',gap:'10px',alignItems:'center',marginTop:'10px',flexWrap:'wrap',justifyContent:'center'}}>
              <button onClick={onBack} style={{padding:'10px 24px',borderRadius:'99px',border:'1px solid #A0A090',background:'rgba(232,224,208,0.08)',color:'#C8C4BC',fontFamily:'Inconsolata,monospace',fontSize:'12px',cursor:'pointer',letterSpacing:'0.06em',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.color='#E8E0D0';e.currentTarget.style.borderColor='#E8E0D0'}}
                onMouseLeave={e=>{e.currentTarget.style.color='#A0A090';e.currentTarget.style.borderColor='#686858'}}>
                add more objects
              </button>
              <button onClick={onReveal} style={{padding:'10px 36px',borderRadius:'99px',border:'1px solid #E8E0D0',background:'none',color:'#E8E0D0',fontFamily:'JacquardaBastarda9,cursive',fontSize:'20px',cursor:'pointer',transition:'all 0.2s'}}
                onMouseEnter={e=>{e.currentTarget.style.background='#E8E0D0';e.currentTarget.style.color='#1E1E1E'}}
                onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#E8E0D0'}}>
                Reveal Archetype
              </button>
            </div>
          )}
        </div>
      ):(
        <div style={{position:'fixed',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'3rem',background:'#1E1E1E'}}>
          <button onClick={()=>setView('map')} style={{position:'absolute',top:'24px',left:'24px',background:'none',border:'none',color:'#888',fontFamily:'Inconsolata,monospace',fontSize:'12px',cursor:'pointer',letterSpacing:'0.06em'}}>map</button>
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
