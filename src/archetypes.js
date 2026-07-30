export const ARCHETYPES = [
  {
    name: "The Custodian",
    tagline: "You collect to preserve what time might otherwise erase.",
    description: "Your collection is less a personal choice than a responsibility. Objects arrive through family, circumstance, or inheritance — rarely hunted, often bestowed. You hold things because someone trusted you to. The dominant feeling is wonder at survival: how did this make it this far? Your collection is a form of custody, not ownership.",
    tension: "Custodians rarely seek objects out — but the ones who do find the most interesting things. If you have objects you actively went looking for, they reveal the collector underneath the keeper.",
    motivation: "The fear that things will be forgotten if you don't hold them.",
    axes: { temporal:0.7, geographic:0.2, craft:0.5, acquisition:0.3, rarity:0.7, emotional:"wonder" },
  },
  {
    name: "The Field Researcher",
    tagline: "You collect through encounter. The story of finding matters more than the thing found.",
    description: "Your objects are acquired through direct experience — picked up, stumbled on, pulled from places. You are less interested in what something is worth than in the fact that you were there when you found it. The collection is a log of encounters. Curiosity is the dominant register.",
    tension: "Field Researchers often undervalue what they inherit, because inherited objects lack the acquisition story. But the objects you didn't choose sometimes know you better than the ones you did.",
    motivation: "Being present. The collection is evidence of a life in motion.",
    axes: { temporal:0.6, geographic:0.8, craft:0.4, acquisition:0.6, rarity:0.6, emotional:"curiosity" },
  },
  {
    name: "The Cultural Cartographer",
    tagline: "Your collection is a map of how different worlds make different things.",
    description: "You collect across cultures and regions with intention. Objects represent somewhere specific — a place, a tradition, a way of making. You are drawn to difference: how does this object reflect the world it came from? The collection is a comparative study.",
    tension: "Cartographers sometimes collect the surface of a culture without going deep. The most interesting collections are ones where one region gets fully excavated rather than seven regions get skimmed.",
    motivation: "Understanding how place shapes making.",
    axes: { temporal:0.5, geographic:0.9, craft:0.6, acquisition:0.5, rarity:0.5, emotional:"curiosity" },
  },
  {
    name: "The Craft Witness",
    tagline: "You collect the evidence of skilled hands. The human mark in the object is everything.",
    description: "You are drawn specifically to handmade objects — things that carry the trace of the person who made them. Manufactured objects hold little interest. You notice material, process, technique before anything else. The collection is a record of what human hands can do across time and culture.",
    tension: "Craft Witnesses often know more about the makers than the objects. The risk is collecting as documentation rather than desire.",
    motivation: "The human hand in the object. Evidence of labour that history rarely records.",
    axes: { temporal:0.6, geographic:0.5, craft:0.95, acquisition:0.5, rarity:0.6, emotional:"curiosity" },
  },
  {
    name: "The Memory Keeper",
    tagline: "You collect the people you love, through the objects they touched.",
    description: "Objects matter because of who gave them or when they were acquired. The collection is a relational map — each object is tethered to a person, a moment, a version of yourself. You are less interested in historical depth than in personal resonance.",
    tension: "Memory Keepers sometimes hold objects that have outlived the feeling they were meant to anchor. The most honest version knows which objects still carry weight.",
    motivation: "Holding onto people through things.",
    axes: { temporal:0.3, geographic:0.3, craft:0.4, acquisition:0.2, rarity:0.4, emotional:"nostalgia" },
  },
  {
    name: "The Ruin Hunter",
    tagline: "You are drawn to things that shouldn't still exist. The older the better.",
    description: "Age is the primary criterion. You are drawn to objects that survived the collapse of the civilisation that made them — coins from dead economies, tiles from demolished buildings, tools from discontinued crafts. The dominant feeling is wonder at survival.",
    tension: "Ruin Hunters can fetishise age at the expense of meaning. The most interesting collections are ones where the collector can say exactly why a specific object from a specific moment matters.",
    motivation: "Proximity to collapsed worlds. Mourning civilisations through their objects.",
    axes: { temporal:0.95, geographic:0.5, craft:0.6, acquisition:0.6, rarity:0.9, emotional:"wonder" },
  },
  {
    name: "The Instinct Collector",
    tagline: "You don't have a system. Your collection has one anyway.",
    description: "No theme, no era preference, no deliberate strategy. Objects are chosen because something about them demanded to be owned before you could explain why. The collection is a self-portrait you didn't plan to make.",
    tension: "Instinct Collectors often underestimate their own coherence. The collection looks random from the outside but is deeply consistent.",
    motivation: "Desire before understanding. The object chose you as much as you chose it.",
    axes: { temporal:0.4, geographic:0.4, craft:0.5, acquisition:0.4, rarity:0.4, emotional:"pride" },
  },
  {
    name: "The Grief Keeper",
    tagline: "Your collection is a record of what you couldn't let go of.",
    description: "Objects arrive at moments of loss — inherited after a death, kept after a relationship ends, salvaged from places that no longer exist. The collection is not about beauty or history but about the impossibility of letting certain things disappear. Each object is a stay against forgetting.",
    tension: "Grief Keepers sometimes confuse the object with the feeling. The most honest version of this archetype knows that the object is not the person — but keeps it anyway.",
    motivation: "Objects as proof that something real happened.",
    axes: { temporal:0.5, geographic:0.2, craft:0.3, acquisition:0.15, rarity:0.5, emotional:"grief" },
  },
  {
    name: "The Wonder Seeker",
    tagline: "You collect the things that made you stop mid-sentence.",
    description: "The primary criterion is a feeling — the slight catch in the chest when something is inexplicably right. You don't collect categories or eras or materials. You collect moments of recognition. The object matters because of the encounter, not the object itself.",
    tension: "Wonder Seekers often have beautiful but incoherent collections. The meaning lives in the encounter, which nobody else can access. The challenge is making the collection legible to anyone but yourself.",
    motivation: "The pursuit of the feeling. Everything else is secondary.",
    axes: { temporal:0.5, geographic:0.5, craft:0.5, acquisition:0.5, rarity:0.6, emotional:"awe" },
  },
  {
    name: "The Maker's Collector",
    tagline: "You collect to understand how things are made, so you can make things yourself.",
    description: "Your collection is research. You pick up objects to study their construction — how the joint was made, what the glaze conceals, how the thread count changes at the selvage. The collection is a library of technique. You are less interested in owning than in understanding.",
    tension: "Maker's Collectors sometimes value process over presence. The object is most interesting before it's fully understood. After that, it risks becoming merely instructive.",
    motivation: "Understanding the gap between intention and execution in other people's making.",
    axes: { temporal:0.4, geographic:0.5, craft:0.9, acquisition:0.5, rarity:0.4, emotional:"curiosity" },
  },
  {
    name: "The Exile's Archive",
    tagline: "Your collection is a portable homeland.",
    description: "The objects you keep are the ones that carry where you come from — regional craft, inherited food vessels, devotional objects from a place you no longer live. The collection is not nostalgic so much as territorial: a claim on an identity that geography has complicated. You collect to remember who you were before you became who you are.",
    tension: "The Exile's Archive can calcify into a museum of the self. The most interesting version of this collection is the one that also includes objects from the places the collector has moved through — evidence of becoming, not just origin.",
    motivation: "Carrying a place that can't be carried any other way.",
    axes: { temporal:0.6, geographic:0.3, craft:0.6, acquisition:0.25, rarity:0.5, emotional:"longing" },
  },
  {
    name: "The Accidental Archivist",
    tagline: "You never meant to have a collection. You just couldn't throw things away.",
    description: "The collection accumulated without intention — objects kept because disposing of them felt wrong, gifts that arrived and stayed, things picked up because they were there. Looking back, a pattern emerges that surprises even you. The collection is more honest than any deliberate one because it was never curated.",
    tension: "Accidental Archivists often undervalue their own collections because they didn't choose them consciously. But the objects that survive the cuts you didn't make are often the most revealing.",
    motivation: "A quiet resistance to disposal. The sense that things deserve to continue existing.",
    axes: { temporal:0.4, geographic:0.35, craft:0.4, acquisition:0.3, rarity:0.3, emotional:"comfort" },
  },
]

export function scoreArchetype(trinkets) {
  const n = trinkets.length
  if (n === 0) return null
  const years = trinkets.map(t => { const m = String(t.date||'').match(/\d{3,4}/); return m ? parseInt(m[0]) : null }).filter(Boolean)
  const yearSpan = years.length >= 2 ? Math.max(...years) - Math.min(...years) : 0
  const temporal = Math.min(yearSpan / 800, 1)
  const regions = new Set(trinkets.map(t => t.region).filter(r => r && r !== 'Unknown')).size
  const geographic = Math.min(regions / 5, 1)
  const craft = trinkets.filter(t => t.material_type === 'craft' || t.material_type === 'self-made').length / n
  const acqC = {}; trinkets.forEach(t => { acqC[t.acquisition] = (acqC[t.acquisition]||0)+1 })
  const acquisition = Math.min(Object.values(acqC).reduce((s,v) => { const p=v/n; return s-p*Math.log2(p) }, 0)/2, 1)
  const rarityMap = { common:0.25, uncommon:0.5, rare:0.75, 'one-of-a-kind':1 }
  const rarity = trinkets.reduce((s,t) => s+(rarityMap[t.rarity]||0.5), 0)/n
  const emoC = {}; trinkets.forEach(t => { emoC[t.emotion] = (emoC[t.emotion]||0)+1 })
  const topEmotion = Object.entries(emoC).sort((a,b) => b[1]-a[1])[0]?.[0] || 'curiosity'
  const axes = { temporal, geographic, craft, acquisition, rarity, topEmotion }
  const ranked = ARCHETYPES.map(arch => {
    let score = 0
    score += (1-Math.abs(axes.temporal - arch.axes.temporal)) * 0.20
    score += (1-Math.abs(axes.geographic - arch.axes.geographic)) * 0.18
    score += (1-Math.abs(axes.craft - arch.axes.craft)) * 0.20
    score += (1-Math.abs(axes.acquisition - arch.axes.acquisition)) * 0.14
    score += (1-Math.abs(axes.rarity - arch.axes.rarity)) * 0.14
    score += (axes.topEmotion === arch.axes.emotional ? 1 : 0.2) * 0.14
    return { ...arch, score: Math.round(score*100) }
  }).sort((a,b) => b.score - a.score)
  return { ranked, axes }
}

export function getAxisScores(trinkets) {
  const n = trinkets.length; if (n === 0) return []
  const years = trinkets.map(t => { const m=String(t.date||'').match(/\d{3,4}/); return m?parseInt(m[0]):null }).filter(Boolean)
  const yearSpan = years.length >= 2 ? Math.max(...years)-Math.min(...years) : 0
  const regions = new Set(trinkets.map(t => t.region).filter(r => r&&r!=='Unknown')).size
  const acqC = {}; trinkets.forEach(t => { acqC[t.acquisition]=(acqC[t.acquisition]||0)+1 })
  const acqE = Math.min(Object.values(acqC).reduce((s,v) => { const p=v/n; return s-p*Math.log2(p) },0)/2,1)
  const craft = trinkets.filter(t => t.material_type==='craft'||t.material_type==='self-made').length/n
  const rarityMap = { common:0.25, uncommon:0.5, rare:0.75, 'one-of-a-kind':1 }
  const rarity = trinkets.reduce((s,t) => s+(rarityMap[t.rarity]||0.5),0)/n
  const inferredD = Math.min(trinkets.reduce((s,t) => s+(t.inferred_links||1),0)/(n*3),1)
  return [
    { label:"Temporal Range", value:Math.round(Math.min(yearSpan/800,1)*100) },
    { label:"Geographic Range", value:Math.round(Math.min(regions/5,1)*100) },
    { label:"Acquisition Diversity", value:Math.round(acqE*100) },
    { label:"Craft Ratio", value:Math.round(craft*100) },
    { label:"Rarity Index", value:Math.round(rarity*100) },
    { label:"Historical Depth", value:Math.round(inferredD*100) },
  ]
}
