import { useState } from 'react'

const pill = {
  width: '100%', background: 'none',
  border: '0.5px solid #3A3020', borderRadius: '99px',
  padding: '10px 20px',
  fontFamily: 'Inconsolata, monospace', fontSize: '12px',
  color: '#2A2010', outline: 'none', textAlign: 'left',
  letterSpacing: '0.02em', resize: 'none',
}

const pillArea = {
  ...pill,
  borderRadius: '16px',
  minHeight: '72px',
  padding: '12px 20px',
  lineHeight: 1.6,
}

const EMPTY = { name: '', note: '', date: '', description: '' }

export default function Entry({ trinkets, onAdd, onRemove, onMap }) {
  const [form, setForm] = useState(EMPTY)
  const [collOpen, setCollOpen] = useState(false)
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = () => {
    if (!form.name.trim()) { alert('add an object name'); return }
    // Parse useful fields from free-text note for connection logic
    onAdd({
      ...form,
      name: form.name.trim(),
      // Store note as place proxy and description as material proxy
      place: '',
      country: '',
      material: form.description,
      emotion: '',
      acquisition: '',
      material_type: '',
      region: '',
      inferred_links: 1,
    })
    setForm(EMPTY)
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#E8E0D0',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflowY: 'auto', padding: '2rem 1rem',
    }}>
      <div style={{ width: '100%', maxWidth: '440px', animation: 'fadeUp 0.5s ease forwards' }}>

        <h2 style={{
          fontFamily: 'Inconsolata, monospace', fontSize: '20px', fontWeight: 400,
          color: '#2A2010', textAlign: 'center', marginBottom: '2.5rem',
          letterSpacing: '0.06em', textTransform: 'uppercase',
        }}>
          Create Collection
        </h2>

        <div style={{
          border: '0.5px dashed #8A8070', borderRadius: '12px',
          padding: '1.5rem', marginBottom: '1.2rem',
          display: 'flex', flexDirection: 'column', gap: '12px',
        }}>
          {/* Object name */}
          <div>
            <label style={{ display: 'block', fontSize: '9px', color: '#8A8070', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Inconsolata, monospace' }}>
              Object
            </label>
            <input style={pill} placeholder="what is it?" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>

          {/* Date */}
          <div>
            <label style={{ display: 'block', fontSize: '9px', color: '#8A8070', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Inconsolata, monospace' }}>
              Date / Year
            </label>
            <input style={pill} placeholder="e.g. 1945, 1600s, mid-century" value={form.date} onChange={e => set('date', e.target.value)} />
          </div>

          {/* Note — where, emotion, how acquired etc */}
          <div>
            <label style={{ display: 'block', fontSize: '9px', color: '#8A8070', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Inconsolata, monospace' }}>
              Note
            </label>
            <textarea style={pillArea} placeholder="where it's from, how you got it, what it means to you..." value={form.note} onChange={e => set('note', e.target.value)} />
          </div>

          {/* Description — material, state, modifications */}
          <div>
            <label style={{ display: 'block', fontSize: '9px', color: '#8A8070', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: '6px', fontFamily: 'Inconsolata, monospace' }}>
              Description
            </label>
            <textarea style={pillArea} placeholder="material, condition, notable details..." value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '14px' }}>
          <button onClick={handleAdd} style={{
            padding: '10px 28px', borderRadius: '99px',
            border: '0.5px solid #2A2010', background: '#2A2010', color: '#E8E0D0',
            fontFamily: 'Inconsolata, monospace', fontSize: '12px', letterSpacing: '0.06em',
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Add Object
          </button>
          <button onClick={() => setForm(EMPTY)} style={{
            padding: '10px 28px', borderRadius: '99px',
            border: '0.5px solid #2A2010', background: 'none', color: '#2A2010',
            fontFamily: 'Inconsolata, monospace', fontSize: '12px', letterSpacing: '0.06em',
          }}>
            Clear
          </button>
        </div>

        {/* Collection */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => setCollOpen(o => !o)} style={{
            padding: '8px 24px', borderRadius: '99px',
            border: '0.5px solid #2A2010', background: 'none', color: '#2A2010',
            fontFamily: 'Inconsolata, monospace', fontSize: '11px', letterSpacing: '0.06em',
          }}>
            Your Collection ({trinkets.length}) {collOpen ? '▴' : '▾'}
          </button>
        </div>

        {collOpen && (
          <div style={{
            background: 'rgba(42,32,16,0.06)', borderRadius: '8px',
            padding: '10px 14px', marginBottom: '1rem', maxHeight: '150px', overflowY: 'auto',
          }}>
            {trinkets.length === 0 && <p style={{ fontSize: '11px', color: '#8A8070', textAlign: 'center', fontStyle: 'italic' }}>no objects yet</p>}
            {trinkets.map(t => (
              <div key={t.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 0', borderBottom: '0.5px solid rgba(42,32,16,0.12)',
                fontSize: '12px', color: '#2A2010',
              }}>
                <span style={{ lineHeight: 1.4 }}>
                  {t.name}
                  {t.date ? <span style={{ color: '#8A8070', marginLeft: '8px', fontSize: '10px' }}>{t.date}</span> : ''}
                </span>
                <button onClick={() => onRemove(t.id)} style={{
                  background: 'none', border: 'none', color: '#8A8070',
                  fontSize: '16px', cursor: 'pointer', lineHeight: 1, marginLeft: '8px',
                }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Begin Mapping */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
          <button onClick={onMap} disabled={trinkets.length < 3} style={{
            padding: '12px 52px', borderRadius: '99px',
            border: '0.5px solid #2A2010',
            background: trinkets.length >= 3 ? '#2A2010' : 'transparent',
            color: trinkets.length >= 3 ? '#E8E0D0' : '#8A8070',
            fontFamily: 'Inconsolata, monospace', fontSize: '13px', letterSpacing: '0.08em',
            cursor: trinkets.length >= 3 ? 'pointer' : 'not-allowed',
            transition: 'all 0.3s ease',
          }}>
            Begin Mapping
          </button>
          {trinkets.length < 3 && (
            <p style={{ fontSize: '10px', color: '#8A8070', fontFamily: 'Inconsolata, monospace', letterSpacing: '0.06em' }}>
              {3 - trinkets.length} more object{3 - trinkets.length !== 1 ? 's' : ''} to begin
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
