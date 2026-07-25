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
  if(!id) { id = crypto.randomUUID(); sessionStorage.setItem('bibelots_session',id) }
  return id
}

export default function App() {
  const [screen, setScreen] = useState('splash')
  const [trinkets, setTrinkets] = useState([])
  const sessionId = getSessionId()

  useEffect(()=>{ loadTrinkets() },[])

  async function loadTrinkets() {
    const { data, error } = await supabase.from('trinkets').select('*').eq('session_id',sessionId).order('created_at',{ascending:true})
    if(data&&!error) setTrinkets(data)
  }

  async function addTrinket(obj) {
    const newT = { ...obj, session_id:sessionId }
    const { data, error } = await supabase.from('trinkets').insert([newT]).select()
    if(data&&!error) setTrinkets(prev=>[...prev,data[0]])
    else setTrinkets(prev=>[...prev,{...newT,id:Date.now()}])
  }

  async function removeTrinket(id) {
    await supabase.from('trinkets').delete().eq('id',id)
    setTrinkets(prev=>prev.filter(t=>t.id!==id))
  }

  function goMap() {
    if(trinkets.length<3) return
    setScreen('loading')
    setTimeout(()=>setScreen('constellation'),2800)
  }

  return (
    <div>
      {screen==='splash'&&<Splash onEnter={()=>setScreen('overview')}/>}
      {screen==='overview'&&<Overview onStart={()=>setScreen('entry')}/>}
      {screen==='entry'&&<Entry trinkets={trinkets} onAdd={addTrinket} onRemove={removeTrinket} onMap={goMap}/>}
      {screen==='loading'&&<Loading/>}
      {screen==='constellation'&&<Constellation trinkets={trinkets} onReveal={()=>setScreen('reveal')}/>}
      {screen==='reveal'&&<Reveal trinkets={trinkets} onBack={()=>setScreen('constellation')}/>}
    </div>
  )
}
