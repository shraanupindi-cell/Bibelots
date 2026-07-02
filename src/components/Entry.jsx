import { useState } from 'react'

const ERAS = [
  { label: 'Ancient (pre 500 CE)', rank: 0 },
  { label: 'Medieval (500–1500)', rank: 1 },
  { label: 'Early Modern (1500–1800)', rank: 2 },
  { label: 'Colonial (1800–1947)', rank: 3 },
  { label: 'Mid-century (1947–1980)', rank: 4 },
  { label: 'Contemporary (1980–now)', rank: 5 },
]

const REGIONS = ['South India', 'North India', 'Central India', 'East India', 'West India', 'Deccan', 'Northeast India', 'South Asia', 'East Asia', 'Southeast Asia', 'Middle East', 'Europe', 'Africa', 'Americas', 'Unknown']

const inputStyle = {
  width: '100%',
  background: 'none',
  border: 'none',
  borderBottom: '0.5px solid #A09090',
  padding: '8px 4px',
  fontFamily: 'Inconsolata, monospace',
  fontSize: '12px',
  color: '#2A1A17',
  outline: 'none',
  marginBottom: '10px',
}

const selectStyle = { ...inputStyle, cursor: 'pointer' }

export default function Entry({ trinkets, onAdd, onRemove, onMap }) {
  const [form, setForm] = useState({
    name: '', place: '', country: '', date: '',
    emotion: '', acquisition: '', material: '',
    material_type: '', rarity: '', era: '', era_rank: 5,
    region: '', note: '',
  })

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  const handleAdd = () => {
    if (!form.name.trim()) { alert('add an object name'); return }
    onAdd({
      ...form,
      name: form.name.trim(),
      place: form.place || 'Unknown',
      country: form.country || 'Unknown',
      region: form.region || 'Unknown',
      inferred_links: 1,
    })
    setForm({ name: '', place: '', country: '', date: '', emotion: '', acquisition: '', material: '', material_type: '', rarity: '', era: '', era_rank: 5, region: '', note: '' })
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#1E1E1E',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      overflowY: 'auto', padding: '2rem 1rem',
    }}>
      <div style={{
        background: '#D9C9C4', width: '100%', maxWidth: '500px',
        borderRadius: '4px', padding: '2rem',
        animation: 'fadeUp 0.5s ease forwards',
      }}>
        <h2 style={{
          fontFamily: 'Inconsolata, monospace', fontSize: '14px',
          fontWeight: 600, color: '#2A1A17', textAlign: 'center',
          marginBottom: '1.5rem', letterSpacing: '0.08em',
        }}>
          Create Collection
        </h2>

        <input style={inputStyle} placeholder="Object" value={form.name} onChange={e => set('name', e.target.value)} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input style={inputStyle} placeholder="Place" value={form.place} onChange={e => set('place', e.target.value)} />
          <input style={inputStyle} placeholder="Country" value={form.country} onChange={e => set('country', e.target.value)} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input style={inputStyle} placeholder="Date / Year" value={form.date} onChange={e => set('date', e.target.value)} />
          <select style={{ ...selectStyle, background: 'none' }} value={form.region} onChange={e => set('region', e.target.value)}>
            <option value="">Region</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <select style={{ ...selectStyle, background: 'none' }} value={form.emotion} onChange={e => set('emotion', e.target.value)}>
            <option value="">Emotional tag</option>
            {['nostalgia', 'curiosity', 'pride', 'wonder', 'comfort', 'unease'].map(e => <option key={e}>{e}</option>)}
          </select>
          <select style={{ ...selectStyle, background: 'none' }} value={form.acquisition} onChange={e => set('acquisition', e.target.value)}>
            <option value="">How did you get it?</option>
            {['bought', 'gifted', 'found', 'inherited'].map(a => <option key={a}>{a}</option>)}
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <input style={inputStyle} placeholder="Material" value={form.material} onChange={e => set('material', e.target.value)} />
          <select style={{ ...selectStyle, background: 'none' }} value={form.material_type} onChange={e => set('material_type', e.target.value)}>
            <option value="">Handmade or industrial?</option>
            <option value="craft">handmade / craft</option>
            <option value="industrial">industrial / manufactured</option>
          </select>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <select style={{ ...selectStyle, background: 'none' }} value={form.era} onChange={e => {
            const found = ERAS.find(er => er.label === e.target.value)
            set('era', e.target.value)
            if (found) set('era_rank', found.rank)
          }}>
            <option value="">Era</option>
            {ERAS.map(er => <option key={er.label} value={er.label}>{er.label}</option>)}
          </select>
          <select style={{ ...selectStyle, background: 'none' }} value={form.rarity} onChange={e => set('rarity', e.target.value)}>
            <option value="">Rarity</option>
            {['common', 'uncommon', 'rare', 'one-of-a-kind'].map(r => <option key={r}>{r}</option>)}
          </select>
        </div>

        <input style={inputStyle} placeholder="Note — why does this object matter?" value={form.note} onChange={e => set('note', e.target.value)} />

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '1rem' }}>
          <button onClick={handleAdd} style={{
            padding: '8px 24px', border: '0.5px solid #2A1A17', borderRadius: '99px',
            background: '#2A1A17', color: '#D9C9C4',
            fontFamily: 'Inconsolata, monospace', fontSize: '12px', letterSpacing: '0.06em',
          }}>
            Add Object
          </button>
          <button onClick={() => setForm({ name: '', place: '', country: '', date: '', emotion: '', acquisition: '', material: '', material_type: '', rarity: '', era: '', era_rank: 5, region: '', note: '' })} style={{
            padding: '8px 24px', border: '0.5px solid #2A1A17', borderRadius: '99px',
            background: 'none', color: '#2A1A17',
            fontFamily: 'Inconsolata, monospace', fontSize: '12px', letterSpacing: '0.06em',
          }}>
            Clear
          </button>
        </div>

        {/* Collection list */}
        <div style={{ marginTop: '1.5rem' }}>
          <p style={{ fontSize: '10px', color: '#8A7A77', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
            Your Collection ({trinkets.length})
          </p>
          <div style={{ maxHeight: '140px', overflowY: 'auto' }}>
            {trinkets.length === 0 && (
              <p style={{ fontSize: '11px', color: '#9A8A87', fontStyle: 'italic' }}>no objects yet</p>
            )}
            {trinkets.map(t => (
              <div key={t.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 4px', borderBottom: '0.5px solid #C0B0AC',
                fontSize: '11px', color: '#2A1A17',
              }}>
                <span>{t.name} {t.place ? `— ${t.place}` : ''}</span>
                <button onClick={() => onRemove(t.id)} style={{
                  background: 'none', border: 'none', color: '#9A8A87',
                  fontSize: '14px', cursor: 'pointer', lineHeight: 1,
                }}>×</button>
              </div>
            ))}
          </div>
        </div>

        {/* Start mapping */}
        <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
          <button onClick={onMap} disabled={trinkets.length < 3} style={{
            padding: '10px 36px', border: '0.5px solid #2A1A17', borderRadius: '99px',
            background: trinkets.length >= 3 ? '#2A1A17' : 'none',
            color: trinkets.length >= 3 ? '#D9C9C4' : '#9A8A87',
            fontFamily: 'Inconsolata, monospace', fontSize: '12px', letterSpacing: '0.08em',
            cursor: trinkets.length >= 3 ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
          }}>
            Start Mapping
          </button>
          <p style={{ fontSize: '10px', color: '#8A7A77', marginTop: '8px' }}>
            {trinkets.length < 3 ? `add ${3 - trinkets.length} more object${3 - trinkets.length === 1 ? '' : 's'} to begin` : `${trinkets.length} objects ready`}
          </p>
        </div>
      </div>
    </div>
  )
}
