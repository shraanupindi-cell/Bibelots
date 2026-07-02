export default function Overview({ onStart }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#1E1E1E',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{ maxWidth: '480px', textAlign: 'center', padding: '2rem', animation: 'fadeUp 0.6s ease forwards' }}>
        <h1 style={{
          fontFamily: 'UnifrakturMaguntia, cursive',
          fontSize: '42px', color: '#F0EDE8',
          marginBottom: '2.5rem', letterSpacing: '0.02em',
        }}>
          Bibelots
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '2.5rem' }}>
          {[
            ['What you collect', 'reveals who you are.'],
            ['Log your objects.', 'We find the connections.'],
            ['Discover your', 'collector archetype.'],
          ].map(([dim, bright], i) => (
            <p key={i} style={{ fontFamily: 'Inconsolata, monospace', fontSize: '13px', color: '#888880', lineHeight: 1.8 }}>
              {dim} <span style={{ color: '#F0EDE8' }}>{bright}</span>
            </p>
          ))}
        </div>

        <button onClick={onStart} style={{
          padding: '10px 32px',
          border: '0.5px solid #F0EDE8',
          borderRadius: '99px',
          background: 'none',
          color: '#F0EDE8',
          fontFamily: 'Inconsolata, monospace',
          fontSize: '12px',
          letterSpacing: '0.1em',
          cursor: 'pointer',
          transition: 'background 0.2s, color 0.2s',
        }}
          onMouseEnter={e => { e.target.style.background = '#F0EDE8'; e.target.style.color = '#1E1E1E' }}
          onMouseLeave={e => { e.target.style.background = 'none'; e.target.style.color = '#F0EDE8' }}
        >
          begin mapping
        </button>
      </div>
    </div>
  )
}
