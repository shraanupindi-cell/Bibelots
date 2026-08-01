export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { trinkets } = req.body
  if (!trinkets || trinkets.length < 2) return res.status(400).json({ error: 'Need at least 2 trinkets' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' })

  const list = trinkets.map((t, i) => {
    const parts = [`${i+1}. "${t.name}"`]
    if (t.date) parts.push(`date: ${t.date}`)
    if (t.place) parts.push(`place: ${t.place}`)
    if (t.material) parts.push(`material: ${t.material}`)
    if (t.emotion) parts.push(`feeling: ${t.emotion}`)
    if (t.acquisition) parts.push(`acquired by: ${t.acquisition}`)
    if (t.note) parts.push(`note: "${t.note}"`)
    return parts.join(', ')
  }).join('\n')

  const prompt = `You are an expert in material culture, history, anthropology, semiotics, and the psychology of collecting. 

Here is someone's personal collection of objects:
${list}

Find the most interesting, non-obvious connections between pairs of these objects. Connections can be anything meaningful:
- Historical or political (same era, same empire, same event)
- Geographic (same region, same trade route, same city)
- Material (same substance, same craft tradition, same production method)
- Cultural (same religious context, same ritual use, same symbolic meaning)
- Personal (both inherited, both from childhood, both gifted by same person)
- Conceptual (both about preservation, both about travel, both about loss)
- Semiotic (both carry the same symbolic weight, both represent the same idea)
- Economic (same market, same colonial economy, same trade network)
- Sensory (same texture, same weight, same smell category)

Return ONLY valid JSON, no markdown, no explanation outside the JSON:
{
  "connections": [
    {
      "object1": "exact name of first object",
      "object2": "exact name of second object",
      "type": "one of: historical / geographic / material / cultural / personal / conceptual / economic",
      "label": "4-7 word description of the connection",
      "detail": "2-3 sentences explaining the connection with specificity. Make it feel like a discovery."
    }
  ]
}

Find 4-8 genuinely interesting connections. Every connection must feel non-obvious and worth knowing. Prioritise surprise over safety.`

  try {
    const resp = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.8, maxOutputTokens: 1500 }
        })
      }
    )
    const data = await resp.json()
    if (!resp.ok) return res.status(500).json({ error: 'Gemini error', detail: data })
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return res.status(200).json(parsed)
  } catch (err) {
    return res.status(500).json({ error: err.message })
  }
}
