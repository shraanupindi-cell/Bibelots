export default function Overview({ onStart }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'#1E1E1E', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ maxWidth:'460px', textAlign:'center', padding:'2rem', animation:'fadeUp 0.6s ease forwards' }}>
        <h1 style={{ fontFamily:'JacquardaBastarda9,cursive', fontSize:'clamp(42px,7vw,72px)', color:'#E8E0D0', marginBottom:'2rem', letterSpacing:'0.02em', lineHeight:1 }}>
          Bibelots
        </h1>
        <p style={{ fontFamily:'Inconsolata,monospace', fontSize:'12px', color:'#A89880', lineHeight:2.1, marginBottom:'2.5rem', letterSpacing:'0.04em' }}>
          <span style={{color:'#C8C4BC'}}>bibelot</span> /ˈbɪb.lə.lɒ/ — a small object of curiosity.<br/>
          What you collect is not random.<br/>
          Log your objects. Map the connections.<br/>
          <span style={{color:'#E8E0D0'}}>Find out who you are as a collector.</span>
        </p>
        <div style={{ display:'flex', justifyContent:'center', gap:'10px', marginBottom:'2.5rem', alignItems:'center' }}>
          {[{r:14,fill:'#E8E0D0'},{r:9,fill:'none'},{r:16,fill:'none'},{r:8,fill:'rgba(232,224,208,0.3)'},{r:12,fill:'none'}].map((c,i)=>(
            <div key={i} style={{ width:c.r*2, height:c.r*2, borderRadius:'50%', border:'0.5px solid #6A6058', background:c.fill, flexShrink:0 }} />
          ))}
        </div>
        <button onClick={onStart} style={{ padding:'12px 40px', border:'1px solid #E8E0D0', borderRadius:'99px', background:'none', color:'#E8E0D0', fontFamily:'Inconsolata,monospace', fontSize:'13px', letterSpacing:'0.1em', cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e=>{e.currentTarget.style.background='#E8E0D0';e.currentTarget.style.color='#1E1E1E'}}
          onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='#E8E0D0'}}>
          begin mapping
        </button>
      </div>
    </div>
  )
}
