import { useEffect, useState, useRef } from 'react'
import { scoreArchetype } from '../archetypes'

export default function Reveal({ trinkets, onBack }) {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const revealRef = useRef(null)
  const result = scoreArchetype(trinkets)

  useEffect(()=>{ setTimeout(()=>setVisible(true),80) },[])

  if(!result) return null
  const winner=result.ranked[0], second=result.ranked[1]

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(()=>{
      setCopied(true); setTimeout(()=>setCopied(false),2000)
    })
  }

  const handleScreenshot = () => {
    // Use browser print as screenshot fallback (works without external library)
    window.print()
  }

  const handleSave = () => {
    setSaving(true)
    try {
      const data = {
        collection: trinkets,
        archetype: winner.name,
        savedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bibelots-collection-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      setSaved(true)
      setTimeout(()=>setSaved(false), 2000)
    } catch(e) {}
    setSaving(false)
  }

  const sub = { fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#888880',letterSpacing:'0.14em',textTransform:'uppercase',marginBottom:'8px',fontWeight:700,display:'block' }

  return (
    <div ref={revealRef} style={{ position:'fixed',inset:0,background:'#1A1A1A',display:'flex',alignItems:'center',justifyContent:'center',overflowY:'auto',padding:'2rem 1rem' }}>
      <div style={{ maxWidth:'600px',width:'100%',textAlign:'center',padding:'2rem',opacity:visible?1:0,transform:visible?'translateY(0)':'translateY(20px)',transition:'opacity 1s ease,transform 1s ease' }}>

        <span style={sub}>your collector archetype</span>

        <h1 style={{ fontFamily:'JacquardaBastarda9,cursive',fontSize:'clamp(40px,7vw,72px)',color:'#E8E0D0',marginBottom:'1rem',lineHeight:1.05 }}>
          {winner.name}
        </h1>

        <p style={{ fontFamily:'Inconsolata,monospace',fontSize:'13px',color:'#A89880',fontStyle:'italic',marginBottom:'1.8rem',lineHeight:1.8 }}>
          {winner.tagline}
        </p>

        <p style={{ fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#C8C0B0',lineHeight:1.9,marginBottom:'2rem',maxWidth:'480px',margin:'0 auto 2rem' }}>
          {winner.description}
        </p>

        <div style={{ borderTop:'0.5px solid #333',paddingTop:'1.4rem',marginBottom:'1.4rem' }}>
          <span style={sub}>the tension</span>
          <p style={{ fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#A89880',fontStyle:'italic',lineHeight:1.8 }}>{winner.tension}</p>
        </div>

        <div style={{ borderTop:'0.5px solid #333',paddingTop:'1.4rem',marginBottom:'2rem' }}>
          <span style={sub}>what drives you</span>
          <p style={{ fontFamily:'Inconsolata,monospace',fontSize:'12px',color:'#C8C0B0',lineHeight:1.8 }}>{winner.motivation}</p>
        </div>

        {/* Second archetype */}
        <div style={{ border:'0.5px solid #333',borderRadius:'4px',padding:'16px 20px',marginBottom:'2rem',textAlign:'left' }}>
          <span style={{...sub,marginBottom:'6px'}}>second archetype — {second.score}/100</span>
          <p style={{ fontFamily:'Inconsolata,monospace',fontSize:'14px',fontWeight:600,color:'#E8E0D0',marginBottom:'4px' }}>{second.name}</p>
          <p style={{ fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#A89880',fontStyle:'italic',lineHeight:1.7,marginBottom:'8px' }}>{second.tagline}</p>
          <p style={{ fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#888880',lineHeight:1.7 }}>
            Most collectors sit between two types. The tension between <strong style={{color:'#E8E0D0'}}>{winner.name}</strong> and <strong style={{color:'#E8E0D0'}}>{second.name}</strong> is often more honest than either alone.
          </p>
        </div>

        {/* Actions */}
        <div style={{ display:'flex',gap:'8px',justifyContent:'center',flexWrap:'wrap' }}>
          <button onClick={onBack} style={{ padding:'9px 20px',borderRadius:'99px',border:'0.5px solid #555',background:'none',color:'#A89880',fontFamily:'Inconsolata,monospace',fontSize:'11px',letterSpacing:'0.06em',cursor:'pointer' }}>
            ← map
          </button>
          <button onClick={handleShare} style={{ padding:'9px 20px',borderRadius:'99px',border:'0.5px solid #E8E0D0',background:'none',color:'#E8E0D0',fontFamily:'Inconsolata,monospace',fontSize:'11px',letterSpacing:'0.06em',cursor:'pointer' }}>
            {copied?'copied!':'share link'}
          </button>
          <button onClick={handleScreenshot} style={{ padding:'9px 20px',borderRadius:'99px',border:'0.5px solid #E8E0D0',background:'none',color:'#E8E0D0',fontFamily:'Inconsolata,monospace',fontSize:'11px',letterSpacing:'0.06em',cursor:'pointer' }}>
            screenshot
          </button>
          <button onClick={handleSave} style={{ padding:'9px 20px',borderRadius:'99px',border:'0.5px solid #E8E0D0',background:'#E8E0D0',color:'#1A1A1A',fontFamily:'Inconsolata,monospace',fontSize:'11px',letterSpacing:'0.06em',cursor:'pointer',fontWeight:600 }}>
            {saved?'saved!':'save collection'}
          </button>
        </div>

        <p style={{ fontFamily:'Inconsolata,monospace',fontSize:'9px',color:'#555',marginTop:'12px',letterSpacing:'0.06em' }}>
          save collection downloads your objects as a JSON file — re-upload anytime to continue building
        </p>
      </div>
    </div>
  )
}
