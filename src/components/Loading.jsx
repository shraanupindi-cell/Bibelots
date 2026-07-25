import { useEffect, useState } from 'react'
const TRINKETS = ['/trinkets/t1.png','/trinkets/t2.png','/trinkets/t3.png','/trinkets/t4.png','/trinkets/t5.png']

export default function Loading() {
  const [current, setCurrent] = useState(0)
  useEffect(() => {
    const interval = setInterval(() => setCurrent(p=>(p+1)%TRINKETS.length), 280)
    return () => clearInterval(interval)
  }, [])
  return (
    <div style={{ position:'fixed',inset:0,background:'#1A1A1A',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'32px' }}>
      <div style={{ width:'220px',height:'220px',display:'flex',alignItems:'center',justifyContent:'center' }}>
        <img key={current} src={TRINKETS[current]} alt="" style={{ width:'100%',height:'100%',objectFit:'contain',animation:'flashIn 0.05s ease forwards' }} />
      </div>
      <div style={{ display:'flex',gap:'7px' }}>
        {[0,1,2].map(i=>(
          <div key={i} style={{ width:'5px',height:'5px',background:'#6A6058',borderRadius:'50%',animation:`pulse 1.4s ease-in-out infinite`,animationDelay:`${i*0.2}s` }} />
        ))}
      </div>
    </div>
  )
}
