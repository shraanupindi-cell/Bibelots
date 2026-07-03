// ── KNOWN CONNECTIONS ──
// These fire on exact or near-exact data matches from what the user entered

export function findKnownConnections(trinkets) {
  const results = []
  const seen = new Set()

  const rules = [
    // Same acquisition mode
    { test: (a,b) => a.acquisition && b.acquisition && a.acquisition === b.acquisition,
      type: 'acquisition', label: `both ${(a,b) => a.acquisition}` },
    // Same emotion
    { test: (a,b) => a.emotion && b.emotion && a.emotion === b.emotion,
      type: 'emotional', label: 'same feeling' },
    // Same era rank
    { test: (a,b) => a.era_rank !== undefined && a.era_rank === b.era_rank,
      type: 'historical', label: 'same era' },
    // Same region
    { test: (a,b) => a.region && b.region && a.region !== 'Unknown' && a.region === b.region,
      type: 'geographic', label: 'same region' },
    // Same country
    { test: (a,b) => a.country && b.country && a.country !== 'Unknown' && a.country !== '' && a.country === b.country,
      type: 'geographic', label: 'same country' },
    // Same material
    { test: (a,b) => a.material && b.material && a.material.toLowerCase() === b.material.toLowerCase(),
      type: 'material', label: 'same material' },
    // Both craft
    { test: (a,b) => a.material_type === 'craft' && b.material_type === 'craft',
      type: 'material', label: 'both handmade' },
    // Both inherited
    { test: (a,b) => a.acquisition === 'inherited' && b.acquisition === 'inherited',
      type: 'personal', label: 'both inherited' },
    // Both found
    { test: (a,b) => a.acquisition === 'found' && b.acquisition === 'found',
      type: 'personal', label: 'both found' },
    // Both gifted
    { test: (a,b) => a.acquisition === 'gifted' && b.acquisition === 'gifted',
      type: 'personal', label: 'both gifted' },
    // Adjacent eras (within 1)
    { test: (a,b) => a.era_rank !== undefined && b.era_rank !== undefined && Math.abs(a.era_rank - b.era_rank) === 1,
      type: 'historical', label: 'adjacent eras' },
    // Both rare or one-of-a-kind
    { test: (a,b) => ['rare','one-of-a-kind'].includes(a.rarity) && ['rare','one-of-a-kind'].includes(b.rarity),
      type: 'material', label: 'both rare objects' },
    // Same place (city)
    { test: (a,b) => a.place && b.place && a.place !== 'Unknown' && a.place !== '' && a.place.toLowerCase() === b.place.toLowerCase(),
      type: 'geographic', label: 'same place' },
    // Material keyword overlap
    { test: (a,b) => {
        if (!a.material || !b.material) return false
        const metals = ['metal','brass','copper','silver','gold','iron','bronze','coin','coins']
        const woods = ['wood','wooden','teak','walnut','rosewood','timber','carved']
        const clays = ['clay','terracotta','ceramic','pottery','earthen','fired','porcelain']
        const textiles = ['fabric','cloth','textile','silk','cotton','wool','thread','woven']
        const groups = [metals, woods, clays, textiles]
        const am = a.material.toLowerCase(), bm = b.material.toLowerCase()
        return groups.some(g => g.some(k => am.includes(k)) && g.some(k => bm.includes(k)))
      },
      type: 'material', label: 'related materials' },
    // Note keyword overlap — both mention same person/place
    { test: (a,b) => {
        if (!a.note || !b.note) return false
        const an = a.note.toLowerCase(), bn = b.note.toLowerCase()
        const keywords = ['grandfather','grandmother','mother','father','parent','family','heirloom','childhood','school','trip','travel','market','bought','found','gifted']
        return keywords.some(k => an.includes(k) && bn.includes(k))
      },
      type: 'personal', label: 'shared personal history' },
    // Name keyword overlap — both religious/spiritual
    { test: (a,b) => {
        const spiritual = ['buddha','ganesh','shiva','temple','shrine','idol','deity','prayer','ritual','sacred','milagro','cross','icon']
        const an = (a.name + ' ' + (a.note||'')).toLowerCase()
        const bn = (b.name + ' ' + (b.note||'')).toLowerCase()
        return spiritual.some(k => an.includes(k)) && spiritual.some(k => bn.includes(k))
      },
      type: 'cultural', label: 'both devotional objects' },
    // Both writing/drawing tools
    { test: (a,b) => {
        const writing = ['pencil','pen','ink','quill','brush','chalk','charcoal','writing','drawing','sketch']
        const an = (a.name + ' ' + (a.note||'')).toLowerCase()
        const bn = (b.name + ' ' + (b.note||'')).toLowerCase()
        return writing.some(k => an.includes(k)) && writing.some(k => bn.includes(k))
      },
      type: 'functional', label: 'both writing instruments' },
    // Both currency/coins
    { test: (a,b) => {
        const currency = ['coin','coins','anna','rupee','paisa','currency','money','monetary','numismatic']
        const an = (a.name + ' ' + (a.note||'')).toLowerCase()
        const bn = (b.name + ' ' + (b.note||'')).toLowerCase()
        return currency.some(k => an.includes(k)) && currency.some(k => bn.includes(k))
      },
      type: 'historical', label: 'both currency objects' },
    // Both vessels/containers
    { test: (a,b) => {
        const vessel = ['pot','jar','bottle','vase','bowl','container','box','chest','tin','flask','urn']
        const an = (a.name + ' ' + (a.note||'')).toLowerCase()
        const bn = (b.name + ' ' + (b.note||'')).toLowerCase()
        return vessel.some(k => an.includes(k)) && vessel.some(k => bn.includes(k))
      },
      type: 'functional', label: 'both vessels or containers' },
    // Both books/documents
    { test: (a,b) => {
        const books = ['book','manuscript','text','document','letter','diary','journal','grammar','bible','quran','scripture','pamphlet']
        const an = (a.name + ' ' + (a.note||'')).toLowerCase()
        const bn = (b.name + ' ' + (b.note||'')).toLowerCase()
        return books.some(k => an.includes(k)) && books.some(k => bn.includes(k))
      },
      type: 'cultural', label: 'both written objects' },
    // Both animal figures
    { test: (a,b) => {
        const animals = ['elephant','tiger','lion','horse','cow','bird','snake','fish','peacock','deer','monkey','bull','cat','dog','bear']
        const an = (a.name + ' ' + (a.note||'')).toLowerCase()
        const bn = (b.name + ' ' + (b.note||'')).toLowerCase()
        return animals.some(k => an.includes(k)) && animals.some(k => bn.includes(k))
      },
      type: 'cultural', label: 'both animal motifs' },
  ]

  for (let i = 0; i < trinkets.length; i++) {
    for (let j = i + 1; j < trinkets.length; j++) {
      const a = trinkets[i], b = trinkets[j]
      const key = `${Math.min(a.id,b.id)}-${Math.max(a.id,b.id)}`
      if (seen.has(key)) continue
      for (const rule of rules) {
        try {
          if (rule.test(a,b) || rule.test(b,a)) {
            seen.add(key)
            const label = typeof rule.label === 'function' ? rule.label(a,b) : rule.label
            results.push({ ids:[a.id,b.id], type:rule.type, label, inferred:false })
            break
          }
        } catch(e) {}
      }
    }
  }
  return results
}

// ── INFERRED CONNECTIONS ──
// Historical / cultural connections based on object characteristics

export function findInferredConnections(trinkets) {
  const results = []
  const seen = new Set()

  const rules = [
    {
      test: (a,b) => {
        const clays = ['terracotta','ceramic','clay','tile','earthen','porcelain','fired']
        const am = (a.material||'').toLowerCase(), bm = (b.material||'').toLowerCase()
        const an = (a.name||'').toLowerCase(), bn = (b.name||'').toLowerCase()
        return clays.some(k => am.includes(k)||an.includes(k)) && clays.some(k => bm.includes(k)||bn.includes(k)) && a.id !== b.id
      },
      label: 'fired earth — same material tradition',
      detail: 'Both objects share a lineage in fired clay — one of the oldest human crafts. Terracotta and ceramic tile are the same base material at different scales of production, from folk craft to imperial architecture.'
    },
    {
      test: (a,b) => {
        const metals = ['metal','brass','copper','silver','gold','iron','bronze']
        const am = (a.material||'').toLowerCase(), bm = (b.material||'').toLowerCase()
        return metals.some(k=>am.includes(k)) && metals.some(k=>bm.includes(k)) && (a.era_rank||5) !== (b.era_rank||5)
      },
      label: 'metalwork across eras',
      detail: 'Metal objects from different eras often trace the same economic lineages — the same ore deposits, trade routes, and craft traditions running across centuries of political change.'
    },
    {
      test: (a,b) => (a.era_rank||5) <= 2 && (b.era_rank||5) <= 2,
      label: 'both pre-modern objects',
      detail: 'Both objects predate modernity as we know it. They survived the collapse of the worlds that made them — a rare form of material persistence that very few objects achieve.'
    },
    {
      test: (a,b) => (a.era_rank||5) <= 3 && (b.era_rank||5) >= 4 && a.region === b.region && a.region !== 'Unknown',
      label: 'same place, different centuries',
      detail: 'Two objects from the same region but different eras — one carries the history that the other was born into. The place is the thread; time is the distance between them.'
    },
    {
      test: (a,b) => a.acquisition === 'inherited' && b.acquisition === 'found',
      label: 'received vs discovered',
      detail: 'One object came to you through someone else\'s hands. The other you found yourself. Together they reveal a collector who both preserves what is given and actively seeks what is lost.'
    },
    {
      test: (a,b) => {
        const woods = ['wood','wooden','teak','walnut','carved','timber']
        const am = (a.material||'').toLowerCase(), bm = (b.material||'').toLowerCase()
        const ar = a.region||'', br = b.region||''
        return woods.some(k=>am.includes(k)) && woods.some(k=>bm.includes(k)) && ar !== br && ar !== 'Unknown' && br !== 'Unknown'
      },
      label: 'regional wood craft traditions',
      detail: 'Wood carving traditions across different regions share a pre-industrial craft lineage despite differences in style, motif, and technique. Both objects are products of the same artisanal economy, separated by geography but connected by material.'
    },
    {
      test: (a,b) => {
        const devotional = ['buddha','ganesh','shiva','idol','deity','temple','sacred','milagro','cross','icon','shrine','prayer']
        const an = (a.name+' '+(a.note||'')).toLowerCase()
        const bn = (b.name+' '+(b.note||'')).toLowerCase()
        return devotional.some(k=>an.includes(k)) && devotional.some(k=>bn.includes(k))
      },
      label: 'shared devotional function',
      detail: 'Devotional objects across cultures serve the same function — to make the sacred tangible, to give the intangible a place to live. These two objects share that purpose regardless of the tradition they come from.'
    },
    {
      test: (a,b) => {
        const currency = ['coin','anna','rupee','paisa','currency']
        const an = (a.name+' '+(a.note||'')).toLowerCase()
        const bn = (b.name+' '+(b.note||'')).toLowerCase()
        return currency.some(k=>an.includes(k)) && currency.some(k=>bn.includes(k)) && (a.era_rank||5) !== (b.era_rank||5)
      },
      label: 'monetary lineage across regimes',
      detail: 'Currency objects from different eras map the same political ruptures — when one economy replaces another, its coins survive as evidence. These two objects trace the arc of power changing hands.'
    },
    {
      test: (a,b) => {
        const writing = ['book','manuscript','text','grammar','letter','diary','ink','pen','pencil','quill','brush']
        const an = (a.name+' '+(a.note||'')).toLowerCase()
        const bn = (b.name+' '+(b.note||'')).toLowerCase()
        return writing.some(k=>an.includes(k)) && writing.some(k=>bn.includes(k))
      },
      label: 'both carry the written word',
      detail: 'Literacy objects — tools for writing, books, manuscripts — share a lineage in the transmission of knowledge. Both objects are part of the same long human project of recording and passing things on.'
    },
    {
      test: (a,b) => {
        const an = (a.note||'').toLowerCase(), bn = (b.note||'').toLowerCase()
        const grandparent = ['grandfather','grandmother','grandpa','grandma','nana','dadi','nani','tata']
        return grandparent.some(k=>an.includes(k)) && grandparent.some(k=>bn.includes(k))
      },
      label: 'both from the grandparent generation',
      detail: 'Both objects passed through the hands of a grandparent. Together they map a generation — what they kept, what they valued, what they passed down without explanation.'
    },
    {
      test: (a,b) => {
        const an = (a.note||'').toLowerCase(), bn = (b.note||'').toLowerCase()
        const child = ['child','childhood','kid','young','school','grade','age 4','age 5','age 6','age 7','age 8','age 9','pocket money','young']
        return child.some(k=>an.includes(k)) && child.some(k=>bn.includes(k))
      },
      label: 'both chosen in childhood',
      detail: 'Both objects were acquired when you were young — before taste was taught, before collecting was conscious. They represent your earliest instinct about what deserves to be kept.'
    },
    {
      test: (a,b) => {
        const an = (a.name+' '+(a.note||'')).toLowerCase()
        const bn = (b.name+' '+(b.note||'')).toLowerCase()
        const craft = ['handmade','hand-made','artisan','craft','woven','carved','painted','embroidered','made by hand','workshop']
        return (a.material_type==='craft'||craft.some(k=>an.includes(k))) && (b.material_type==='craft'||craft.some(k=>bn.includes(k))) && a.region !== b.region
      },
      label: 'craft across regions',
      detail: 'Two handmade objects from different regions — both evidence of skilled labour that industrial production hasn\'t fully replaced. The tradition of making by hand connects them across geography.'
    },
  ]

  for (let i = 0; i < trinkets.length; i++) {
    for (let j = i + 1; j < trinkets.length; j++) {
      const a = trinkets[i], b = trinkets[j]
      const key = `i${Math.min(a.id,b.id)}-${Math.max(a.id,b.id)}`
      if (seen.has(key)) continue
      for (const rule of rules) {
        try {
          if (rule.test(a,b) || rule.test(b,a)) {
            seen.add(key)
            results.push({ ids:[a.id,b.id], type:'inferred', label:rule.label, detail:rule.detail, inferred:true })
            break
          }
        } catch(e) {}
      }
    }
  }
  return results
}

export function connCountMap(trinkets) {
  const allConns = [...findKnownConnections(trinkets), ...findInferredConnections(trinkets)]
  const counts = {}
  trinkets.forEach(t => { counts[t.id] = 0 })
  allConns.forEach(c => { c.ids.forEach(id => { counts[id] = (counts[id]||0)+1 }) })
  return counts
}
