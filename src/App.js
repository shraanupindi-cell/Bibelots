import { useState, useEffect } from 'react'
import './index.css'
import { supabase } from './supabase'
import Splash from './components/Splash'
import Overview from './components/Overview'
import Entry from './components/Entry'
import Loading from './components/Loading'
import Constellation from './components/Constellation'
import Reveal from './components/Reveal'

const LOCAL_KEY = 'bibelots_trinkets'

function getSessionId() {
  let id = sessionStorage.getItem('bibelots_session')
  if (!id) { id = crypto.randomUUID(); sessionStorage.setItem('bibelots_session', id) }
  return id
}

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
  const [trinkets, setTrinkets] = useState([])
  const sessionId = getSessionId()

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]')
      if (local.length > 0) {
        setTrinkets(local)
        return
      }
    } catch(e) {}
    loadFromSupabase()
  }, [])

  // Persist to localStorage whenever trinkets change
  useEffect(() => {
    if (trinkets.length > 0) {
      localStorage.setItem(LOCAL_KEY, JSON.stringify(trinkets))
    }
  }, [trinkets])

  async function loadFromSupabase() {
    const { data, error } = await supabase
      .from('trinkets').select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    if (data && !error && data.length > 0) {
      setTrinkets(data)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(data))
    }
  }

  function go(next) { setScreen(next) }

  async function addTrinket(obj) {
    const newT = { ...obj, session_id: sessionId, id: Date.now() }
    setTrinkets(prev => {
      const updated = [...prev, newT]
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated))
      return updated
    })
    // Also save to Supabase (fire and forget)
    supabase.from('trinkets').insert([{ ...obj, session_id: sessionId }]).select().then(({ data }) => {
      if (data && data[0]) {
        setTrinkets(prev => {
          const updated = prev.map(t => t.id === newT.id ? data[0] : t)
          localStorage.setItem(LOCAL_KEY, JSON.stringify(updated))
          return updated
        })
      }
    })
  }

  async function removeTrinket(id) {
    setTrinkets(prev => {
      const updated = prev.filter(t => t.id !== id)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated))
      return updated
    })
    supabase.from('trinkets').delete().eq('id', id)
  }

  async function updateTrinket(updated) {
    setTrinkets(prev => {
      const list = prev.map(t => t.id === updated.id ? { ...t, ...updated } : t)
      localStorage.setItem(LOCAL_KEY, JSON.stringify(list))
      return list
    })
    supabase.from('trinkets').update(updated).eq('id', updated.id)
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
        <Entry trinkets={trinkets} onAdd={addTrinket} onRemove={removeTrinket} onUpdate={updateTrinket} onMap={goMap} />
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
