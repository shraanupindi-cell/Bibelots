export const KNOWN_RULES = [
  { test: (a, b) => a.acquisition === 'inherited' && b.acquisition === 'inherited', type: 'personal', label: 'both inherited' },
  { test: (a, b) => a.material === b.material && a.material, type: 'material', label: 'same material' },
  { test: (a, b) => a.emotion === b.emotion && a.emotion, type: 'emotional', label: 'same feeling' },
  { test: (a, b) => a.region === b.region && a.region && a.region !== 'Unknown', type: 'geographic', label: 'same region' },
  { test: (a, b) => a.era_rank === b.era_rank, type: 'historical', label: 'same era' },
  { test: (a, b) => a.acquisition === b.acquisition && a.acquisition, type: 'acquisition', label: 'acquired the same way' },
  { test: (a, b) => a.material_type === 'craft' && b.material_type === 'craft', type: 'material', label: 'both handmade' },
  { test: (a, b) => a.country === b.country && a.country && a.country !== 'Unknown', type: 'geographic', label: 'same country' },
]

export function findKnownConnections(trinkets) {
  const results = []
  const seen = new Set()
  for (let i = 0; i < trinkets.length; i++) {
    for (let j = i + 1; j < trinkets.length; j++) {
      const a = trinkets[i], b = trinkets[j]
      const key = `${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`
      if (seen.has(key)) continue
      for (const rule of KNOWN_RULES) {
        if (rule.test(a, b)) {
          seen.add(key)
          results.push({ ids: [a.id, b.id], type: rule.type, label: rule.label, inferred: false })
          break
        }
      }
    }
  }
  return results
}

// Inferred connections based on known historical/cultural relationships
const INFERRED_PAIRS = [
  {
    match: (a, b) => a.material_type === 'craft' && b.material_type === 'craft' && a.material !== b.material,
    type: 'material',
    label: 'shared craft lineage',
    detail: 'Both objects carry the mark of skilled artisanal labour. Different materials, same tradition of making by hand — a thread that connects craft economies across regions and centuries.'
  },
  {
    match: (a, b) => a.era_rank <= 2 && b.era_rank <= 2,
    type: 'historical',
    label: 'both pre-modern objects',
    detail: 'Both objects predate modernity as we know it. They survived the collapse of the worlds that made them — a rare form of material persistence.'
  },
  {
    match: (a, b) => a.material === 'metal' && b.material === 'metal' && (a.era_rank !== b.era_rank),
    type: 'historical',
    label: 'metalwork across eras',
    detail: 'Metal objects from different eras often trace the same economic lineages — the same ore deposits, trade routes, and craft traditions running across centuries of political change.'
  },
  {
    match: (a, b) => a.era_rank <= 3 && b.era_rank >= 4 && a.region === b.region,
    type: 'historical',
    label: 'same place, different centuries',
    detail: 'Two objects from the same region but different eras — one carries the history that the other was born into. The place is the connection; time is the distance between them.'
  },
  {
    match: (a, b) => a.acquisition === 'inherited' && b.acquisition === 'found',
    type: 'personal',
    label: 'received vs discovered',
    detail: 'One object came to you; the other you went looking for. Together they reveal a collector who both preserves what is given and actively seeks what is lost.'
  },
  {
    match: (a, b) => a.material === 'wood' && b.material === 'wood' && a.region !== b.region,
    type: 'historical',
    label: 'north-south wood traditions',
    detail: 'Wood carving traditions across India share a pre-industrial craft lineage despite regional differences in style, motif, and technique. Both objects are products of the same artisanal economy.'
  },
  {
    match: (a, b) => (a.material === 'terracotta' || a.material === 'ceramic') && (b.material === 'terracotta' || b.material === 'ceramic'),
    type: 'material',
    label: 'fired earth',
    detail: 'Terracotta and ceramic tile are the same base material — fired clay — at different scales of production. Folk craft meets imperial architecture through the same elemental process.'
  },
  {
    match: (a, b) => a.era_rank === 1 && b.era_rank === 3,
    type: 'historical',
    label: 'imperial to colonial transition',
    detail: 'Medieval imperial objects and colonial-era objects often map the same rupture — the displacement of one economic and political order by another. The second object was made in the world the first helped shape.'
  },
]

export function findInferredConnections(trinkets) {
  const results = []
  const seen = new Set()
  for (let i = 0; i < trinkets.length; i++) {
    for (let j = i + 1; j < trinkets.length; j++) {
      const a = trinkets[i], b = trinkets[j]
      const key = `i${Math.min(a.id, b.id)}-${Math.max(a.id, b.id)}`
      if (seen.has(key)) continue
      for (const pair of INFERRED_PAIRS) {
        if (pair.match(a, b) || pair.match(b, a)) {
          seen.add(key)
          results.push({ ids: [a.id, b.id], type: pair.type, label: pair.label, detail: pair.detail, inferred: true })
          break
        }
      }
    }
  }
  return results
}

export function connCountMap(trinkets) {
  const allConns = [...findKnownConnections(trinkets), ...findInferredConnections(trinkets)]
  const counts = {}
  trinkets.forEach(t => { counts[t.id] = 0 })
  allConns.forEach(c => { c.ids.forEach(id => { counts[id] = (counts[id] || 0) + 1 }) })
  return counts
}
