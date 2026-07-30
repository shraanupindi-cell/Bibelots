import { useState, useEffect, useRef } from 'react'

const TRINKETS = ['/trinkets/t1.png','/trinkets/t2.png','/trinkets/t3.png','/trinkets/t4.png','/trinkets/t5.png']

export default function Overview({ onStart }) {
  const [current, setCurrent] = useState(0)
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setCurrent(p => (p+1) % TRINKETS.length)
        setFading(false)
      }, 300)
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{
      position:'fixed', inset:0, background:'#1E1E1E',
      display:'flex', alignItems:'center', justifyContent:'center',
    }}>
      <div style={{ maxWidth:'520px', width:'100%', padding:'2rem', animation:'fadeUp 0.6s ease forwards', display:'flex', gap:'3rem', alignItems:'center' }}>

        {/* Left — trinket image cycling */}
        <div style={{ width:'120px', flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center', gap:'12px' }}>
          <div style={{
            width:'110px', height:'110px',
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>
            <img
              src={TRINKETS[current]}
              alt=""
              style={{
                width:'100%', height:'100%', objectFit:'contain',
                opacity: fading ? 0 : 1,
                transition: 'opacity 0.3s ease',
              }}
            />
          </div>
          {/* Mini constellation sketch */}
          <svg viewBox="0 0 80 60" style={{ width:'80px', opacity:0.4 }}>
            <circle cx="40" cy="30" r="6" fill="#E8E0D0" />
            <circle cx="14" cy="12" r="4" fill="none" stroke="#E8E0D0" strokeWidth="0.8" />
            <circle cx="66" cy="10" r="5" fill="#E8E0D0" />
            <circle cx="70" cy="46" r="3" fill="none" stroke="#E8E0D0" strokeWidth="0.8" />
            <circle cx="18" cy="50" r="4.5" fill="rgba(232,224,208,0.5)" stroke="#E8E0D0" strokeWidth="0.8" />
            <line x1="40" y1="30" x2="14" y2="12" stroke="#E8E0D0" strokeWidth="0.6" opacity="0.6" />
            <line x1="40" y1="30" x2="66" y2="10" stroke="#E8E0D0" strokeWidth="1" opacity="0.8" />
            <line x1="40" y1="30" x2="70" y2="46" stroke="#E8E0D0" strokeWidth="0.6" strokeDasharray="3 2" opacity="0.5" />
            <line x1="40" y1="30" x2="18" y2="50" stroke="#E8E0D0" strokeWidth="0.8" opacity="0.7" />
            <line x1="14" y1="12" x2="66" y2="10" stroke="#E8E0D0" strokeWidth="0.5" strokeDasharray="2 3" opacity="0.4" />
            <text x="40" y="33" textAnchor="middle" fontSize="5" fill="#1E1E1E" fontFamily="Inconsolata,monospace">you</text>
          </svg>
        </div>

        {/* Right — copy */}
        <div style={{ flex:1 }}>
          <h1 style={{
            fontFamily:'JacquardaBastarda9,cursive',
            fontSize:'clamp(36px,5vw,56px)',
            color:'#E8E0D0', marginBottom:'1.2rem',
            letterSpacing:'0.02em', lineHeight:1,
          }}>
            Bibelots
          </h1>
          <p style={{
            fontFamily:'Inconsolata,monospace',
            fontSize:'10px', color:'#6A6050',
            letterSpacing:'0.1em', textTransform:'uppercase',
            marginBottom:'1rem',
          }}>
            /ˈbɪb.lə.lɒ/ — a small object of curiosity
          </p>
          <p style={{
            fontFamily:'Inconsolata,monospace',
            fontSize:'12px', color:'#A09080',
            lineHeight:1.9, marginBottom:'2rem',
          }}>
            What you collect is not random.<br/>
            Log your objects. Map the connections.<br/>
            <span style={{color:'#E8E0D0'}}>Find out who you are as a collector.</span>
          </p>

          <button onClick={onStart} style={{
            padding:'11px 32px', border:'0.5px solid #E8E0D0',
            borderRadius:'99px', background:'none', color:'#E8E0D0',
            fontFamily:'Inconsolata,monospace', fontSize:'12px',
            letterSpacing:'0.1em', cursor:'pointer', transition:'all 0.25s',
          }}
            onMouseEnter={e=>{e.currentTarget.style.background='#E8E0D0';e.currentTarget.style.color='#1E1E1E'}}
            onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#E8E0D0'}}>
            begin mapping
          </button>
        </div>
      </div>
    </div>
  )
}
