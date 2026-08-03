export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { trinkets } = req.body || {}
  if (!trinkets || trinkets.length < 2) return res.status(400).json({ error: 'Need at least 2 trinkets' })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set' })

  const list = trinkets.map((t, i) => {
    const parts = [`${i+1}. "${t.name}"`]
    if (t.date) parts.push(`date: ${t.date}`)
    if (t.place) parts.push(`place: ${t.place}`)
    if (t.material) parts.push(`material: ${t.material}`)
    if (t.note) parts.push(`note: "${t.note}"`)
    return parts.join(', ')
  }).join('\n')

  const prompt = `You are an expert in material culture, history, and the psychology of collecting.

Here is someone's personal collection of objects:
${list}

Find 4-6 interesting connections between pairs of these objects. Connections can be historical, geographic, material, cultural, personal, conceptual, or economic — anything meaningful and non-obvious.

Return ONLY valid JSON with no markdown:
{"connections":[{"object1":"name","object2":"name","type":"historical","label":"short label","detail":"2 sentences explaining the connection"}]}`

  try {
    const resp = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 1200 }
        })
      }
    )

    const data = await resp.json()

    if (!resp.ok) {
      console.error('Gemini error:', resp.status, JSON.stringify(data))
      return res.status(500).json({ error: `Gemini ${resp.status}`, detail: data?.error?.message })
    }

    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
    if (!text) return res.status(500).json({ error: 'No text in response', raw: JSON.stringify(data) })

    const clean = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(clean)
    return res.status(200).json(parsed)

  } catch (err) {
    console.error('Error:', err.message)
    return res.status(500).json({ error: err.message })
  }
}
