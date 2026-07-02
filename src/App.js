import { useState, useEffect, useCallback } from 'react'
import './index.css'
import { supabase } from './supabase'
import Splash from './components/Splash'
import Overview from './components/Overview'
import Entry from './components/Entry'
import Loading from './components/Loading'
import Constellation from './components/Constellation'
import Reveal from './components/Reveal'

const SCREENS = { SPLASH: 'splash', OVERVIEW: 'overview', ENTRY: 'entry', LOADING: 'loading', CONSTELLATION: 'constellation', REVEAL: 'reveal' }

// Session ID — persists per browser session
function getSessionId() {
  let id = sessionStorage.getItem('bibelots_session')
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('bibelots_session', id) }
  return id
}

export default function App() {
  const [screen, setScreen] = useState(SCREENS.SPLASH)
  const [trinkets, setTrinkets] = useState([])
  const [loading, setLoading] = useState(false)
  const sessionId = getSessionId()

  // Load existing trinkets on mount
  useEffect(() => {
    loadTrinkets()
  }, [])

  async function loadTrinkets() {
    const { data, error } = await supabase
      .from('trinkets')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    if (data && !error) setTrinkets(data)
  }

  async function addTrinket(obj) {
    const newTrinket = { ...obj, session_id: sessionId }
    const { data, error } = await supabase.from('trinkets').insert([newTrinket]).select()
    if (data && !error) setTrinkets(prev => [...prev, data[0]])
    else {
      // fallback — local only if Supabase fails
      setTrinkets(prev => [...prev, { ...newTrinket, id: Date.now() }])
    }
  }

  async function removeTrinket(id) {
    await supabase.from('trinkets').delete().eq('id', id)
    setTrinkets(prev => prev.filter(t => t.id !== id))
  }

  function goMap() {
    if (trinkets.length < 3) return
    setScreen(SCREENS.LOADING)
    setTimeout(() => setScreen(SCREENS.CONSTELLATION), 2800)
  }

  return (
    <div>
      {screen === SCREENS.SPLASH && <Splash onEnter={() => setScreen(SCREENS.OVERVIEW)} />}
      {screen === SCREENS.OVERVIEW && <Overview onStart={() => setScreen(SCREENS.ENTRY)} />}
      {screen === SCREENS.ENTRY && (
        <Entry
          trinkets={trinkets}
          onAdd={addTrinket}
          onRemove={removeTrinket}
          onMap={goMap}
        />
      )}
      {screen === SCREENS.LOADING && <Loading />}
      {screen === SCREENS.CONSTELLATION && (
        <Constellation
          trinkets={trinkets}
          onReveal={() => setScreen(SCREENS.REVEAL)}
        />
      )}
      {screen === SCREENS.REVEAL && (
        <Reveal
          trinkets={trinkets}
          onBack={() => setScreen(SCREENS.CONSTELLATION)}
        />
      )}
    </div>
  )
}
