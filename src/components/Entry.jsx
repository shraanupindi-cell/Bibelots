import { useState } from 'react'

const ERAS = [
  { label: 'Ancient (pre 500 CE)', rank: 0 },
  { label: 'Medieval (500–1500)', rank: 1 },
  { label: 'Early Modern (1500–1800)', rank: 2 },
  { label: 'Colonial (1800–1947)', rank: 3 },
  { label: 'Mid-century (1947–1980)', rank: 4 },
  { label: 'Contemporary (1980–now)', rank: 5 },
]

const pill = {
  width: '100%',
  background: 'none',
  border: '0.5px solid #2A1A17',
  borderRadius: '99px',
  padding: '9px 18px',
  fontFamily: 'Inconsolata, monospace',
  fontSize: '12px',
  color: '#2A1A17',
  outline: 'none',
  textAlign: 'center',
  letterSpacing: '0.03em',
}

const pillSelect = {
  ...pill,
  cursor: 'pointer',
  appearance: 'none',
  WebkitAppearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%232A1A17'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 14px center',
  paddingRight: '32px',
}

export default function Entry({ trinkets, onAdd, onRemove, onMap }) {
  const [form, setForm] = useState({
    name: '', place: '', date: '', emotion: '',
    acquisition: '', material: '', note: '',
    material_type: 'craft', rarity: 'uncommon',
    era: '', era_rank: 5, region: 'Unknown', country: '',
  })
  const [collOpen, setCollOpen] = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleAdd = () => {
    if (!form.name.trim()) { alert('add an object name'); return }
    onAdd({ ...form, name: form.name.trim(), inferred_links: 1 })
    setForm({ name: '', place: '', date: '', emotion: '', acquisition: '', material: '', note: '', material_type: 'craft', rarity: 'uncommon', era: '', era_rank: 5, region: 'Unknown', country: '' })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#D4C4BF',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflowY: 'auto', padding: '2rem 1rem',
    }}>
      <div style={{
        width: '100%', maxWidth: '460px',
        animation: 'fadeUp 0.5s ease forwards',
      }}>
        <h2 style={{
          fontFamily: 'Inconsolata, monospace',
          fontSize: '22px', fontWeight: 400,
          color: '#2A1A17', textAlign: 'center',
          marginBottom: '2rem', letterSpacing: '0.04em',
        }}>
          Create Collection
        </h2>

        {/* Dashed border box */}
        <div style={{
          border: '0.5px dashed #9A8A87',
          borderRadius: '8px', padding: '1.5rem',
          marginBottom: '1.2rem',
          display: 'flex', flexDirection: 'column', gap: '10px',
        }}>
          {/* Object — full width */}
          <input
            style={pill}
            placeholder="Object"
            value={form.name}
            onChange={e => set('name', e.target.value)}
          />

          {/* Row: Place + Emotional tag */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input style={pill} placeholder="Place" value={form.place} onChange={e => set('place', e.target.value)} />
            <select style={{ ...pillSelect, background: 'none', backgroundImage: pillSelect.backgroundImage, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }} value={form.emotion} onChange={e => set('emotion', e.target.value)}>
              <option value="">Emotional tag ▾</option>
              {['nostalgia','curiosity','pride','wonder','comfort','unease'].map(e => <option key={e}>{e}</option>)}
            </select>
          </div>

          {/* Row: Date + How did you get it */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input style={pill} placeholder="Date/Year" value={form.date} onChange={e => set('date', e.target.value)} />
            <select style={{ ...pillSelect, background: 'none', backgroundImage: pillSelect.backgroundImage, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }} value={form.acquisition} onChange={e => set('acquisition', e.target.value)}>
              <option value="">How did you get it? ▾</option>
              {['bought','gifted','found','inherited'].map(a => <option key={a}>{a}</option>)}
            </select>
          </div>

          {/* Row: Material + Note */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input style={pill} placeholder="Material" value={form.material} onChange={e => set('material', e.target.value)} />
            <input style={pill} placeholder="Note" value={form.note} onChange={e => set('note', e.target.value)} />
          </div>
        </div>

        {/* Add + Clear */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '12px' }}>
          <button onClick={handleAdd} style={{
            padding: '9px 28px', borderRadius: '99px',
            border: '0.5px solid #2A1A17',
            background: '#2A1A17', color: '#D4C4BF',
            fontFamily: 'Inconsolata, monospace',
            fontSize: '12px', letterSpacing: '0.06em',
          }}>
            Add Object
          </button>
          <button onClick={() => setForm(f => ({ ...f, name: '', place: '', date: '', emotion: '', acquisition: '', material: '', note: '' }))} style={{
            padding: '9px 28px', borderRadius: '99px',
            border: '0.5px solid #2A1A17',
            background: 'none', color: '#2A1A17',
            fontFamily: 'Inconsolata, monospace',
            fontSize: '12px', letterSpacing: '0.06em',
          }}>
            Clear
          </button>
        </div>

        {/* Your Collection dropdown */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
          <button onClick={() => setCollOpen(o => !o)} style={{
            padding: '8px 24px', borderRadius: '99px',
            border: '0.5px solid #2A1A17',
            background: 'none', color: '#2A1A17',
            fontFamily: 'Inconsolata, monospace',
            fontSize: '12px', letterSpacing: '0.04em',
          }}>
            Your Collection ({trinkets.length}) {collOpen ? '▴' : '▾'}
          </button>
        </div>

        {collOpen && (
          <div style={{
            background: 'rgba(42,26,23,0.06)', borderRadius: '8px',
            padding: '10px 14px', marginBottom: '1rem',
            maxHeight: '140px', overflowY: 'auto',
          }}>
            {trinkets.length === 0 && (
              <p style={{ fontSize: '11px', color: '#8A7A77', textAlign: 'center', fontStyle: 'italic' }}>no objects yet</p>
            )}
            {trinkets.map(t => (
              <div key={t.id} style={{
                display: 'flex', justifyContent: 'space-between',
                padding: '5px 0', borderBottom: '0.5px solid rgba(42,26,23,0.15)',
                fontSize: '11px', color: '#2A1A17',
              }}>
                <span>{t.name}{t.place ? ` — ${t.place}` : ''}</span>
                <button onClick={() => onRemove(t.id)} style={{
                  background: 'none', border: 'none', color: '#9A8A87',
                  fontSize: '14px', cursor: 'pointer', lineHeight: 1,
                }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Start Mapping */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <button onClick={onMap} disabled={trinkets.length < 3} style={{
            padding: '11px 48px', borderRadius: '99px',
            border: '0.5px solid #2A1A17',
            background: trinkets.length >= 3 ? '#2A1A17' : 'transparent',
            color: trinkets.length >= 3 ? '#D4C4BF' : '#9A8A87',
            fontFamily: 'Inconsolata, monospace',
            fontSize: '13px', letterSpacing: '0.06em',
            cursor: trinkets.length >= 3 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}>
            Start Mapping
          </button>
          {trinkets.length < 3 && (
            <p style={{ fontSize: '10px', color: '#8A7A77', fontFamily: 'Inconsolata, monospace' }}>
              add {3 - trinkets.length} more object{3 - trinkets.length !== 1 ? 's' : ''} to begin
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
