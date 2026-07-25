function getYear(t) {
  const m = String(t.date || '').match(/\d{3,4}/)
  return m ? parseInt(m[0]) : null
}

function sameMatGroup(a, b) {
  if (!a.material || !b.material) return false
  const am = a.material.toLowerCase(), bm = b.material.toLowerCase()
  const groups = [
    ['metal','brass','copper','silver','gold','iron','bronze','steel','tin'],
    ['wood','wooden','teak','walnut','rosewood','timber','carved wood'],
    ['terracotta','ceramic','clay','tile','earthen','porcelain','fired'],
    ['fabric','cloth','textile','silk','cotton','wool','thread','woven','felt'],
    ['glass','crystal'],['paper','cardboard'],['stone','marble','granite','rock'],['leather','hide'],
  ]
  return groups.some(g => g.some(k=>am.includes(k)) && g.some(k=>bm.includes(k)))
}

function hasKw(t, kws) {
  const text = ((t.name||'')+' '+(t.note||'')).toLowerCase()
  return kws.some(k=>text.includes(k))
}

export function findKnownConnections(trinkets) {
  const results = [], seen = new Set()
  const rules = [
    { test:(a,b)=>a.material&&b.material&&a.material.trim().toLowerCase()===b.material.trim().toLowerCase()&&a.material.trim().length>1, type:'material', label:'same material' },
    { test:(a,b)=>sameMatGroup(a,b)&&!(a.material&&b.material&&a.material.toLowerCase()===b.material.toLowerCase()), type:'material', label:'related materials' },
    { test:(a,b)=>a.material_type==='craft'&&b.material_type==='craft', type:'material', label:'both handmade' },
    { test:(a,b)=>a.emotion&&b.emotion&&a.emotion===b.emotion, type:'emotional', label:'same emotional register' },
    { test:(a,b)=>{ if(!a.place||!b.place) return false; const ap=a.place.trim().toLowerCase(),bp=b.place.trim().toLowerCase(); return ap===bp&&ap!=='unknown'&&ap.length>1 }, type:'geographic', label:'same place' },
    { test:(a,b)=>{ if(!a.country||!b.country) return false; const ac=a.country.trim().toLowerCase(),bc=b.country.trim().toLowerCase(); return ac===bc&&ac!=='unknown'&&ac.length>1 }, type:'geographic', label:'same country' },
    { test:(a,b)=>a.region&&b.region&&a.region!=='Unknown'&&a.region!==''&&a.region===b.region, type:'geographic', label:'same region' },
    { test:(a,b)=>a.acquisition==='inherited'&&b.acquisition==='inherited', type:'personal', label:'both inherited' },
    { test:(a,b)=>a.acquisition==='found'&&b.acquisition==='found', type:'personal', label:'both found' },
    { test:(a,b)=>a.acquisition==='gifted'&&b.acquisition==='gifted', type:'personal', label:'both gifted' },
    { test:(a,b)=>{ const ay=getYear(a),by=getYear(b); if(!ay||!by) return false; const sc=a.country&&b.country&&a.country.toLowerCase()===b.country.toLowerCase(); return Math.abs(ay-by)<=30&&ay!==by&&sc }, type:'historical', label:'same time and place' },
    { test:(a,b)=>hasKw(a,['coin','coins','anna','rupee','paisa','currency'])&&hasKw(b,['coin','coins','anna','rupee','paisa','currency']), type:'historical', label:'both currency objects' },
    { test:(a,b)=>hasKw(a,['pencil','pen','ink','quill','brush','chalk','writing'])&&hasKw(b,['pencil','pen','ink','quill','brush','chalk','writing']), type:'functional', label:'both writing instruments' },
    { test:(a,b)=>hasKw(a,['pot','jar','bottle','vase','bowl','box','chest','flask','urn','pouch','purse','bag'])&&hasKw(b,['pot','jar','bottle','vase','bowl','box','chest','flask','urn','pouch','purse','bag']), type:'functional', label:'both vessels or containers' },
    { test:(a,b)=>hasKw(a,['buddha','ganesh','shiva','temple','idol','deity','sacred','milagro','cross','prayer','shrine'])&&hasKw(b,['buddha','ganesh','shiva','temple','idol','deity','sacred','milagro','cross','prayer','shrine']), type:'cultural', label:'both devotional objects' },
    { test:(a,b)=>hasKw(a,['book','manuscript','letter','diary','grammar','scripture','text'])&&hasKw(b,['book','manuscript','letter','diary','grammar','scripture','text']), type:'cultural', label:'both written objects' },
    { test:(a,b)=>hasKw(a,['elephant','tiger','lion','horse','cow','bird','snake','peacock','deer','monkey','bull','fish'])&&hasKw(b,['elephant','tiger','lion','horse','cow','bird','snake','peacock','deer','monkey','bull','fish']), type:'cultural', label:'both animal motifs' },
    { test:(a,b)=>hasKw(a,['grandfather','grandpa','dada','nana'])&&hasKw(b,['grandfather','grandpa','dada','nana']), type:'personal', label:'both from grandfather' },
    { test:(a,b)=>hasKw(a,['grade','childhood','age 4','age 5','age 6','age 7','pocket money','as a kid','young'])&&hasKw(b,['grade','childhood','age 4','age 5','age 6','age 7','pocket money','as a kid','young']), type:'personal', label:'both chosen as a child' },
  ]
  for(let i=0;i<trinkets.length;i++) for(let j=i+1;j<trinkets.length;j++) {
    const a=trinkets[i],b=trinkets[j]
    const key=`${Math.min(a.id,b.id)}-${Math.max(a.id,b.id)}`
    if(seen.has(key)) continue
    for(const rule of rules) {
      try { if(rule.test(a,b)||rule.test(b,a)) { seen.add(key); results.push({ids:[a.id,b.id],type:rule.type,label:rule.label,inferred:false}); break } } catch(e){}
    }
  }
  return results
}

export function findInferredConnections(trinkets) {
  const results = [], seen = new Set()
  const rules = [
    { test:(a,b)=>{ const clays=['terracotta','ceramic','clay','tile','earthen','porcelain']; const am=(a.material||'').toLowerCase(),bm=(b.material||'').toLowerCase(),an=(a.name||'').toLowerCase(),bn=(b.name||'').toLowerCase(); return clays.some(k=>am.includes(k)||an.includes(k))&&clays.some(k=>bm.includes(k)||bn.includes(k)) }, label:'fired earth — same material tradition', detail:'Terracotta and ceramic tile share a lineage in fired clay — one of the oldest human crafts. Folk craft and imperial architecture made from the same elemental process.' },
    { test:(a,b)=>{ const metals=['metal','brass','copper','silver','gold','iron','bronze','coin','coins','anna','rupee']; const am=((a.material||'')+(a.name||'')).toLowerCase(),bm=((b.material||'')+(b.name||'')).toLowerCase(); const ay=getYear(a),by=getYear(b); return metals.some(k=>am.includes(k))&&metals.some(k=>bm.includes(k))&&ay&&by&&Math.abs(ay-by)>100 }, label:'metalwork across eras', detail:'Metal objects from different eras trace the same economic lineages — trade routes, craft traditions, and monetary systems running across centuries of political change.' },
    { test:(a,b)=>{ const ay=getYear(a),by=getYear(b); return ay&&by&&ay<1800&&by<1800&&Math.abs(ay-by)>50 }, label:'both pre-modern objects', detail:'Both objects predate modernity as we know it. They survived the collapse of the worlds that made them — a rare form of material persistence.' },
    { test:(a,b)=>{ const ay=getYear(a),by=getYear(b); if(!ay||!by) return false; const sp=(a.place&&b.place&&a.place.toLowerCase()===b.place.toLowerCase())||(a.region&&b.region&&a.region===b.region&&a.region!=='Unknown'); return sp&&Math.abs(ay-by)>150 }, label:'same place, different centuries', detail:'Two objects from the same place but different eras — one carries the history that the other was born into. The place is the thread; time is the distance between them.' },
    { test:(a,b)=>(a.acquisition==='inherited'&&b.acquisition==='found')||(a.acquisition==='found'&&b.acquisition==='inherited'), label:'received vs discovered', detail:"One object came to you through someone else's hands. The other you found yourself. Together they reveal a collector who both preserves what is given and actively seeks what is lost." },
    { test:(a,b)=>{ const woods=['wood','wooden','teak','walnut','carved']; const am=(a.material||'').toLowerCase(),bm=(b.material||'').toLowerCase(); return woods.some(k=>am.includes(k))&&woods.some(k=>bm.includes(k))&&a.place&&b.place&&a.place.toLowerCase()!==b.place.toLowerCase() }, label:'wood craft across regions', detail:"Wood carving traditions share a pre-industrial craft lineage despite regional differences. Both objects are products of the same artisanal economy, separated by geography but connected by material." },
    { test:(a,b)=>hasKw(a,['mughal','charminar','saharanpur','deccan'])&&hasKw(b,['mughal','charminar','saharanpur','deccan']), label:'Mughal economic lineage', detail:'Both objects connect to the Mughal economic and cultural sphere — one as currency, one as a craft tradition that grew under Mughal patronage.' },
    { test:(a,b)=>{ const ay=getYear(a),by=getYear(b); return ay&&by&&ay>=1800&&ay<=1947&&by>=1800&&by<=1947&&Math.abs(ay-by)>20 }, label:'both from colonial India', detail:'Both objects were made or circulated during the colonial period — a time when Indian craft, currency, and material culture were being simultaneously documented, commodified, and displaced.' },
    { test:(a,b)=>{ const isGpGen=t=>{ const y=getYear(t); return (y&&y>=1930&&y<=1970)||hasKw(t,['grandfather','grandpa','dada']) }; const ay=getYear(a),by=getYear(b); return isGpGen(a)&&isGpGen(b)&&!(ay&&by&&ay===by) }, label:'same generation — passed down', detail:'Both objects belong to or passed through the same generation — objects that survived long enough to become inheritance rather than just possessions.' },
    { test:(a,b)=>(a.material_type==='craft'&&b.material_type==='industrial')||(a.material_type==='industrial'&&b.material_type==='craft'), label:'handmade meets industrial', detail:"One object made by hand, one manufactured. Together they mark the shift from artisanal to industrial production — a rupture that changed what objects mean and how they're valued." },
  ]
  for(let i=0;i<trinkets.length;i++) for(let j=i+1;j<trinkets.length;j++) {
    const a=trinkets[i],b=trinkets[j]
    const key=`i${Math.min(a.id,b.id)}-${Math.max(a.id,b.id)}`
    if(seen.has(key)) continue
    for(const rule of rules) {
      try { if(rule.test(a,b)||rule.test(b,a)) { seen.add(key); results.push({ids:[a.id,b.id],type:'inferred',label:rule.label,detail:rule.detail,inferred:true}); break } } catch(e){}
    }
  }
  return results
}

export function connCountMap(trinkets) {
  const all=[...findKnownConnections(trinkets),...findInferredConnections(trinkets)]
  const counts={}
  trinkets.forEach(t=>{counts[t.id]=0})
  all.forEach(c=>{c.ids.forEach(id=>{counts[id]=(counts[id]||0)+1})})
  return counts
}
