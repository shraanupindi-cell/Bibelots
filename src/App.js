import { useState, useEffect } from 'react'
import './index.css'
import { supabase } from './supabase'
import Splash from './components/Splash'
import Overview from './components/Overview'
import Entry from './components/Entry'
import Loading from './components/Loading'
import Constellation from './components/Constellation'
import Reveal from './components/Reveal'

function getSessionId() {
  let id = sessionStorage.getItem('bibelots_session')
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('bibelots_session', id) }
  return id
}

// Screen wrapper — keeps DOM mounted to preserve input state
function Screen({ children, active }) {
  return (
    <div style={{
      position: 'fixed', inset: 0,
      opacity: active ? 1 : 0,
      transition: 'opacity 0.45s ease',
      pointerEvents: active ? 'auto' : 'none',
      zIndex: active ? 1 : 0,
      visibility: active ? 'visible' : 'hidden',
    }}>
      {children}
    </div>
  )
}

export default function App() {
  const [screen, setScreen] = useState('splash')
  const [prev, setPrev] = useState(null)
  const [trinkets, setTrinkets] = useState([])
  const sessionId = getSessionId()

  useEffect(() => { loadTrinkets() }, [])

  async function loadTrinkets() {
    const { data, error } = await supabase
      .from('trinkets').select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    if (data && !error) setTrinkets(data)
  }

  function go(next) {
    setPrev(screen)
    setScreen(next)
  }

  async function addTrinket(obj) {
    const newT = { ...obj, session_id: sessionId }
    const { data, error } = await supabase.from('trinkets').insert([newT]).select()
    if (data && !error) setTrinkets(prev => [...prev, data[0]])
    else setTrinkets(prev => [...prev, { ...newT, id: Date.now() }])
  }

  async function removeTrinket(id) {
    await supabase.from('trinkets').delete().eq('id', id)
    setTrinkets(prev => prev.filter(t => t.id !== id))
  }

  function goMap() {
    if (trinkets.length < 3) return
    go('loading')
    setTimeout(() => go('constellation'), 2800)
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Screen active={screen === 'splash'}>
        <Splash onEnter={() => go('overview')} active={screen === 'splash'} />
      </Screen>
      <Screen active={screen === 'overview'}>
        <Overview onStart={() => go('entry')} />
      </Screen>
      <Screen active={screen === 'entry'}>
        <Entry trinkets={trinkets} onAdd={addTrinket} onRemove={removeTrinket} onMap={goMap} />
      </Screen>
      <Screen active={screen === 'loading'}>
        <Loading />
      </Screen>
      <Screen active={screen === 'constellation'}>
        <Constellation trinkets={trinkets} onReveal={() => go('reveal')} onBack={() => go('entry')} />
      </Screen>
      <Screen active={screen === 'reveal'}>
        <Reveal trinkets={trinkets} onBack={() => go('constellation')} sessionId={sessionId} />
      </Screen>
    </div>
  )
}
