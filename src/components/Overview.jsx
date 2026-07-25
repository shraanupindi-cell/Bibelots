export default function Overview({ onStart }) {
  return (
    <div style={{ position:'fixed',inset:0,background:'#1E1E1E',display:'flex',alignItems:'center',justifyContent:'center' }}>
      <div style={{ maxWidth:'460px',textAlign:'center',padding:'2rem',animation:'fadeUp 0.6s ease forwards' }}>
        <h1 style={{ fontFamily:'JacquardaBastarda9,cursive',fontSize:'clamp(42px,7vw,72px)',color:'#F0EDE8',marginBottom:'2rem',letterSpacing:'0.02em',lineHeight:1 }}>
          Bibelots
        </h1>
        <p style={{ fontFamily:'Inconsolata,monospace',fontSize:'11px',color:'#888880',lineHeight:2,marginBottom:'2.5rem',letterSpacing:'0.04em' }}>
          <span style={{color:'#C8C4BC'}}>bibelot</span> /ˈbɪb.lə.lɒ/ — a small object of curiosity.<br/>
          What you collect is not random.<br/>
          Log your objects. Map the connections.<br/>
          <span style={{color:'#D4C4BF'}}>Find out who you are as a collector.</span>
        </p>
        <div style={{ display:'flex',justifyContent:'center',gap:'10px',marginBottom:'2.5rem',alignItems:'center' }}>
          {[{r:14,fill:'#D4C4BF',sw:1},{r:9,fill:'none',sw:0.5},{r:16,fill:'none',sw:1},{r:8,fill:'rgba(240,237,232,0.3)',sw:0.5},{r:12,fill:'none',sw:1}].map((c,i)=>(
            <div key={i} style={{ width:c.r*2,height:c.r*2,borderRadius:'50%',border:`${c.sw}px solid #C8C4BC`,background:c.fill,flexShrink:0 }} />
          ))}
        </div>
        <button onClick={onStart} style={{ padding:'11px 36px',border:'0.5px solid #F0EDE8',borderRadius:'99px',background:'none',color:'#F0EDE8',fontFamily:'Inconsolata,monospace',fontSize:'12px',letterSpacing:'0.1em',cursor:'pointer',transition:'all 0.2s' }}
          onMouseEnter={e=>{e.target.style.background='#F0EDE8';e.target.style.color='#1E1E1E'}}
          onMouseLeave={e=>{e.target.style.background='none';e.target.style.color='#F0EDE8'}}>
          begin mapping
        </button>
      </div>
    </div>
  )
}
