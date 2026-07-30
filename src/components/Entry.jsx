import { useState } from 'react'

const EMOTIONS = [
  'nostalgia','curiosity','pride','wonder','comfort','unease',
  'grief','joy','reverence','longing','awe','affection','guilt','delight'
]

const ACQUISITIONS = [
  'bought','gifted','found','inherited','made by me','handmade / commissioned','traded','stolen (joking)'
]

const pill = {
  width:'100%', background:'none',
  border:'0.5px solid #3A3020', borderRadius:'99px',
  padding:'9px 18px',
  fontFamily:'Inconsolata,monospace', fontSize:'12px',
  color:'#2A2010', outline:'none', textAlign:'center', letterSpacing:'0.03em',
}

const pillSel = {
  ...pill,
  cursor:'pointer',
  appearance:'none',
  WebkitAppearance:'none',
  MozAppearance:'none',
  backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='8' height='5'%3E%3Cpath d='M0 0l4 5 4-5z' fill='%233A3020'/%3E%3C/svg%3E")`,
  backgroundRepeat:'no-repeat',
  backgroundPosition:'right 14px center',
  backgroundSize:'8px 5px',
  paddingRight:'34px',
  textAlign:'left',
}

const EMPTY = {
  name:'', place:'', date:'', emotion:'',
  acquisition:'', material:'', note:'', material_type:''
}

function EditableItem({ trinket, onSave, onRemove, onCancel }) {
  const [form, setForm] = useState({ ...trinket })
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  return (
    <div style={{ background:'rgba(42,32,16,0.06)', borderRadius:'8px', padding:'12px', marginBottom:'8px' }}>
      <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
        <input style={{...pill, textAlign:'left', fontSize:'11px'}} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Object" />
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          <input style={{...pill, textAlign:'left', fontSize:'11px'}} value={form.place||''} onChange={e=>set('place',e.target.value)} placeholder="Place" />
          <input style={{...pill, textAlign:'left', fontSize:'11px'}} value={form.date||''} onChange={e=>set('date',e.target.value)} placeholder="Date" />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px' }}>
          <select style={{...pillSel, fontSize:'11px'}} value={form.emotion||''} onChange={e=>set('emotion',e.target.value)}>
            <option value="">Emotion</option>
            {EMOTIONS.map(e=><option key={e}>{e}</option>)}
          </select>
          <select style={{...pillSel, fontSize:'11px'}} value={form.acquisition||''} onChange={e=>set('acquisition',e.target.value)}>
            <option value="">How got it</option>
            {ACQUISITIONS.map(a=><option key={a}>{a}</option>)}
          </select>
        </div>
        <input style={{...pill, textAlign:'left', fontSize:'11px'}} value={form.material||''} onChange={e=>set('material',e.target.value)} placeholder="Material" />
        <input style={{...pill, textAlign:'left', fontSize:'11px'}} value={form.note||''} onChange={e=>set('note',e.target.value)} placeholder="Note" />
        <div style={{ display:'flex', gap:'8px', justifyContent:'flex-end', marginTop:'4px' }}>
          <button onClick={onCancel} style={{ padding:'5px 14px', borderRadius:'99px', border:'0.5px solid #8A8070', background:'none', color:'#8A8070', fontFamily:'Inconsolata,monospace', fontSize:'10px', cursor:'pointer' }}>cancel</button>
          <button onClick={()=>onRemove(trinket.id)} style={{ padding:'5px 14px', borderRadius:'99px', border:'0.5px solid #C04040', background:'none', color:'#C04040', fontFamily:'Inconsolata,monospace', fontSize:'10px', cursor:'pointer' }}>remove</button>
          <button onClick={()=>onSave(form)} style={{ padding:'5px 14px', borderRadius:'99px', border:'0.5px solid #2A2010', background:'#2A2010', color:'#E8E0D0', fontFamily:'Inconsolata,monospace', fontSize:'10px', cursor:'pointer' }}>save</button>
        </div>
      </div>
    </div>
  )
}

export default function Entry({ trinkets, onAdd, onRemove, onUpdate, onMap }) {
  const [form, setForm] = useState(EMPTY)
  const [collOpen, setCollOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))

  const handleAdd = () => {
    if (!form.name.trim()) { alert('add an object name'); return }
    onAdd({ ...form, name:form.name.trim(), inferred_links:1 })
    setForm(EMPTY)
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'#E8E0D0', display:'flex', alignItems:'center', justifyContent:'center', overflowY:'auto', padding:'2rem 1rem' }}>
      <div style={{ width:'100%', maxWidth:'460px', animation:'fadeUp 0.5s ease forwards' }}>

        <h2 style={{ fontFamily:'Inconsolata,monospace', fontSize:'20px', fontWeight:400, color:'#2A2010', textAlign:'center', marginBottom:'2rem', letterSpacing:'0.06em', textTransform:'uppercase' }}>
          Create Collection
        </h2>

        <div style={{ border:'0.5px dashed #8A8070', borderRadius:'12px', padding:'1.5rem', marginBottom:'1.2rem', display:'flex', flexDirection:'column', gap:'10px' }}>

          <input style={pill} placeholder="Object" value={form.name} onChange={e=>set('name',e.target.value)} />

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <input style={pill} placeholder="Place" value={form.place} onChange={e=>set('place',e.target.value)} />
            <input style={pill} placeholder="Date / Year" value={form.date} onChange={e=>set('date',e.target.value)} />
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <select style={pillSel} value={form.emotion} onChange={e=>set('emotion',e.target.value)}>
              <option value="">Emotional tag ▾</option>
              {EMOTIONS.map(e=><option key={e}>{e}</option>)}
            </select>
            <select style={pillSel} value={form.acquisition} onChange={e=>set('acquisition',e.target.value)}>
              <option value="">How did you get it? ▾</option>
              {ACQUISITIONS.map(a=><option key={a}>{a}</option>)}
            </select>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'10px' }}>
            <input style={pill} placeholder="Material" value={form.material} onChange={e=>set('material',e.target.value)} />
            <select style={pillSel} value={form.material_type} onChange={e=>set('material_type',e.target.value)}>
              <option value="">Handmade or industrial? ▾</option>
              <option value="craft">handmade / craft</option>
              <option value="industrial">industrial</option>
              <option value="self-made">made by me</option>
            </select>
          </div>

          <input style={pill} placeholder="Note — why does this object matter?" value={form.note} onChange={e=>set('note',e.target.value)} />
        </div>

        <div style={{ display:'flex', gap:'10px', justifyContent:'center', marginBottom:'14px' }}>
          <button onClick={handleAdd} style={{ padding:'10px 28px', borderRadius:'99px', border:'0.5px solid #2A2010', background:'#2A2010', color:'#E8E0D0', fontFamily:'Inconsolata,monospace', fontSize:'12px', letterSpacing:'0.06em', transition:'opacity 0.2s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#E8E0D0';e.currentTarget.style.color='#2A2010';e.currentTarget.style.border='0.5px solid #2A2010'}}
            onMouseLeave={e=>{e.currentTarget.style.background='#2A2010';e.currentTarget.style.color='#E8E0D0';e.currentTarget.style.border='0.5px solid #2A2010'}}>
            Add Object
          </button>
          <button onClick={()=>setForm(EMPTY)} style={{ padding:'10px 28px', borderRadius:'99px', border:'0.5px solid #2A2010', background:'none', color:'#2A2010', fontFamily:'Inconsolata,monospace', fontSize:'12px', letterSpacing:'0.06em' }}>
            Clear
          </button>
        </div>

        <div style={{ display:'flex', justifyContent:'center', marginBottom:'1.2rem' }}>
          <button onClick={()=>setCollOpen(o=>!o)} style={{ padding:'8px 24px', borderRadius:'99px', border:'0.5px solid #2A2010', background:'none', color:'#2A2010', fontFamily:'Inconsolata,monospace', fontSize:'11px', letterSpacing:'0.06em' }}>
            Your Collection ({trinkets.length}) {collOpen?'▴':'▾'}
          </button>
        </div>

        {collOpen && (
          <div style={{ marginBottom:'1.2rem', maxHeight:'260px', overflowY:'auto' }}>
            {trinkets.length===0 && <p style={{ fontSize:'11px', color:'#8A8070', textAlign:'center', fontStyle:'italic', padding:'12px 0' }}>no objects yet</p>}
            {trinkets.map(t => (
              editingId===t.id ? (
                <EditableItem key={t.id} trinket={t}
                  onSave={updated=>{ onUpdate(updated); setEditingId(null) }}
                  onRemove={id=>{ onRemove(id); setEditingId(null) }}
                  onCancel={()=>setEditingId(null)} />
              ) : (
                <div key={t.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 4px', borderBottom:'0.5px solid rgba(42,32,16,0.12)', cursor:'pointer' }}
                  onClick={()=>setEditingId(t.id)}>
                  <div>
                    <span style={{ fontFamily:'Inconsolata,monospace', fontSize:'12px', color:'#2A2010', fontWeight:500 }}>{t.name}</span>
                    {t.date && <span style={{ fontFamily:'Inconsolata,monospace', fontSize:'10px', color:'#8A8070', marginLeft:'8px' }}>{t.date}</span>}
                    {t.place && <span style={{ fontFamily:'Inconsolata,monospace', fontSize:'10px', color:'#8A8070', marginLeft:'6px' }}>· {t.place}</span>}
                  </div>
                  <span style={{ fontSize:'10px', color:'#8A8070', fontFamily:'Inconsolata,monospace' }}>edit</span>
                </div>
              )
            ))}
          </div>
        )}

        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'10px' }}>
          <button onClick={onMap} disabled={trinkets.length<3} style={{
            padding:'12px 52px', borderRadius:'99px',
            border:'0.5px solid #2A2010',
            background:trinkets.length>=3?'#2A2010':'transparent',
            color:trinkets.length>=3?'#E8E0D0':'#8A8070',
            fontFamily:'Inconsolata,monospace', fontSize:'13px', letterSpacing:'0.08em',
            cursor:trinkets.length>=3?'pointer':'not-allowed',
            transition:'all 0.3s ease',

          }}>
            Begin Mapping
          </button>
          {trinkets.length<3
            ? <p style={{ fontSize:'10px', color:'#8A8070', fontFamily:'Inconsolata,monospace', letterSpacing:'0.06em' }}>{3-trinkets.length} more object{3-trinkets.length!==1?'s':''} to begin</p>
            : <p style={{ fontSize:'10px', color:'#6A8060', fontFamily:'Inconsolata,monospace', letterSpacing:'0.06em' }}>{trinkets.length} objects ready to map</p>
          }
        </div>
      </div>
    </div>
  )
}
