export const ARCHETYPES = [
  {
    name: "The Custodian",
    tagline: "You collect to preserve what time might otherwise erase.",
    description: "Your collection is less a personal choice than a responsibility. Objects arrive through family, circumstance, or inheritance — rarely hunted, often bestowed. You hold things because someone trusted you to. The dominant feeling is wonder at survival: how did this make it this far? Your collection is a form of custody, not ownership.",
    tension: "Custodians rarely seek objects out — but the ones who do find the most interesting things. If you have any objects you actively went looking for, they reveal the collector underneath the keeper.",
    motivation: "The fear that things will be forgotten if you don't hold them.",
    axes: { temporal: 0.7, geographic: 0.2, craft: 0.5, acquisition: 0.3, rarity: 0.7, emotional: "wonder" },
    color: "#7F77DD"
  },
  {
    name: "The Field Researcher",
    tagline: "You collect through encounter. The story of finding matters more than the thing found.",
    description: "Your objects are acquired through direct experience — picked up, stumbled on, pulled from places. You are less interested in what something is worth than in the fact that you were there when you found it. The collection is a log of encounters. Curiosity is the dominant register.",
    tension: "Field Researchers often undervalue what they inherit, because inherited objects lack the acquisition story. But the objects you didn't choose sometimes know you better than the ones you did.",
    motivation: "Being present. The collection is evidence of a life in motion.",
    axes: { temporal: 0.6, geographic: 0.8, craft: 0.4, acquisition: 0.6, rarity: 0.6, emotional: "curiosity" },
    color: "#1D9E75"
  },
  {
    name: "The Cultural Cartographer",
    tagline: "Your collection is a map of how different worlds make different things.",
    description: "You collect across cultures and regions with intention. Objects represent somewhere specific — a place, a tradition, a way of making. You are drawn to difference: how does this object reflect the world it came from? The collection is a comparative study.",
    tension: "Cartographers sometimes collect the surface of a culture without going deep. The most interesting collections are ones where one region gets fully excavated rather than seven regions get skimmed.",
    motivation: "Understanding how place shapes making.",
    axes: { temporal: 0.5, geographic: 0.9, craft: 0.6, acquisition: 0.5, rarity: 0.5, emotional: "curiosity" },
    color: "#3B8BD4"
  },
  {
    name: "The Craft Witness",
    tagline: "You collect the evidence of skilled hands. The human mark in the object is everything.",
    description: "You are drawn specifically to handmade objects — things that carry the trace of the person who made them. Manufactured objects hold little interest. You notice material, process, technique before anything else. The collection is a record of what human hands can do across time and culture.",
    tension: "Craft Witnesses often know more about the makers than the objects. The risk is collecting as documentation rather than desire.",
    motivation: "The human hand in the object. Evidence of labour that history rarely records.",
    axes: { temporal: 0.6, geographic: 0.5, craft: 0.95, acquisition: 0.5, rarity: 0.6, emotional: "curiosity" },
    color: "#D85A30"
  },
  {
    name: "The Memory Keeper",
    tagline: "You collect the people you love, through the objects they touched.",
    description: "Objects matter because of who gave them or when they were acquired. The collection is a relational map — each object is tethered to a person, a moment, a version of yourself. You are less interested in historical depth or craft tradition than in personal resonance.",
    tension: "Memory Keepers sometimes hold objects that have outlived the feeling they were meant to anchor. The most honest version knows which objects still carry weight and which are kept out of guilt.",
    motivation: "Holding onto people through things.",
    axes: { temporal: 0.3, geographic: 0.3, craft: 0.4, acquisition: 0.2, rarity: 0.4, emotional: "nostalgia" },
    color: "#EF9F27"
  },
  {
    name: "The Ruin Hunter",
    tagline: "You are drawn to things that shouldn't still exist. The older the better.",
    description: "Age is the primary criterion. You are drawn to objects that survived the collapse of the civilisation that made them — coins from dead economies, tiles from demolished buildings, tools from discontinued crafts. The dominant feeling is wonder at survival.",
    tension: "Ruin Hunters can fetishise age at the expense of meaning. The most interesting collections are ones where the collector can say exactly why a specific object from a specific moment matters.",
    motivation: "Proximity to collapsed worlds. Mourning civilisations through their objects.",
    axes: { temporal: 0.95, geographic: 0.5, craft: 0.6, acquisition: 0.6, rarity: 0.9, emotional: "wonder" },
    color: "#D4537E"
  },
  {
    name: "The Instinct Collector",
    tagline: "You don't have a system. Your collection has one anyway.",
    description: "No theme, no era preference, no deliberate strategy. Objects are chosen because something about them demanded to be owned before you could explain why. The collection is a self-portrait you didn't plan to make. When you look back at everything you've chosen, a pattern emerges that surprises even you.",
    tension: "Instinct Collectors often underestimate their own coherence. The collection looks random from the outside but is deeply consistent. The interesting project is reverse-engineering what your instinct was optimising for.",
    motivation: "Desire before understanding. The object chose you as much as you chose it.",
    axes: { temporal: 0.4, geographic: 0.4, craft: 0.5, acquisition: 0.4, rarity: 0.4, emotional: "pride" },
    color: "#6B8F71"
  },
]

export function scoreArchetype(trinkets) {
  const n = trinkets.length
  if (n === 0) return null

  const years2 = trinkets.map(t => { const m = String(t.date||'').match(/\d{3,4}/); return m ? parseInt(m[0]) : null }).filter(Boolean)
  const yearSpan2 = years2.length >= 2 ? Math.max(...years2) - Math.min(...years2) : 0
  const eras = Math.ceil(yearSpan2 / 130) // approximate eras from year span
  const regions = new Set(trinkets.map(t => t.region)).size

  const acqC = {}
  trinkets.forEach(t => { acqC[t.acquisition] = (acqC[t.acquisition] || 0) + 1 })
  const acqEntropy = Object.values(acqC).reduce((s, v) => {
    const p = v / n; return s - p * Math.log2(p)
  }, 0)

  const craftRatio = trinkets.filter(t => t.material_type === 'craft').length / n

  const rarityMap = { common: 0.25, uncommon: 0.5, rare: 0.75, 'one-of-a-kind': 1 }
  const rarityScore = trinkets.reduce((s, t) => s + (rarityMap[t.rarity] || 0.5), 0) / n

  const emoC = {}
  trinkets.forEach(t => { emoC[t.emotion] = (emoC[t.emotion] || 0) + 1 })
  const topEmotion = Object.entries(emoC).sort((a, b) => b[1] - a[1])[0][0]

  const axes = {
    temporal: Math.min(eras / 6, 1),
    geographic: Math.min(regions / 6, 1),
    craft: craftRatio,
    acquisition: Math.min(acqEntropy / 2, 1),
    rarity: rarityScore,
    topEmotion,
  }

  const ranked = ARCHETYPES.map(arch => {
    let score = 0
    score += (1 - Math.abs(axes.temporal - arch.axes.temporal)) * 0.20
    score += (1 - Math.abs(axes.geographic - arch.axes.geographic)) * 0.18
    score += (1 - Math.abs(axes.craft - arch.axes.craft)) * 0.20
    score += (1 - Math.abs(axes.acquisition - arch.axes.acquisition)) * 0.14
    score += (1 - Math.abs(axes.rarity - arch.axes.rarity)) * 0.14
    score += (axes.topEmotion === arch.axes.emotional ? 1 : 0.25) * 0.14
    return { ...arch, score: Math.round(score * 100) }
  }).sort((a, b) => b.score - a.score)

  return { ranked, axes }
}

export function getAxisScores(trinkets) {
  const n = trinkets.length
  if (n === 0) return []
  const years2 = trinkets.map(t => { const m = String(t.date||'').match(/\d{3,4}/); return m ? parseInt(m[0]) : null }).filter(Boolean)
  const yearSpan2 = years2.length >= 2 ? Math.max(...years2) - Math.min(...years2) : 0
  const eras = Math.ceil(yearSpan2 / 130) // approximate eras from year span
  const regions = new Set(trinkets.map(t => t.region)).size
  const acqC = {}
  trinkets.forEach(t => { acqC[t.acquisition] = (acqC[t.acquisition] || 0) + 1 })
  const acqEntropy = Object.values(acqC).reduce((s, v) => { const p = v / n; return s - p * Math.log2(p) }, 0)
  const craftRatio = trinkets.filter(t => t.material_type === 'craft').length / n
  const rarityMap = { common: 0.25, uncommon: 0.5, rare: 0.75, 'one-of-a-kind': 1 }
  const rarityScore = trinkets.reduce((s, t) => s + (rarityMap[t.rarity] || 0.5), 0) / n
  const inferredDensity = Math.min(trinkets.reduce((s, t) => s + (t.inferred_links || 1), 0) / (n * 3), 1)

  return [
    { label: "Temporal Range", value: Math.round(Math.min(eras / 6, 1) * 100) },
    { label: "Geographic Range", value: Math.round(Math.min(regions / 6, 1) * 100) },
    { label: "Acquisition Diversity", value: Math.round(Math.min(acqEntropy / 2, 1) * 100) },
    { label: "Craft Ratio", value: Math.round(craftRatio * 100) },
    { label: "Rarity Index", value: Math.round(rarityScore * 100) },
    { label: "Historical Depth", value: Math.round(inferredDensity * 100) },
  ]
}
