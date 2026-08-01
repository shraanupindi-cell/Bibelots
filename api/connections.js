export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { trinkets } = req.body
  if (!trinkets || trinkets.length < 2) {
    return res.status(400).json({ error: 'Need at least 2 trinkets' })
  }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' })
  }

  const trinketList = trinkets.map((t, i) =>
    `${i + 1}. "${t.name}"${t.date ? ` (${t.date})` : ''}${t.place ? ` from ${t.place}` : ''}${t.material ? `, material: ${t.material}` : ''}${t.note ? `. Note: "${t.note}"` : ''}`
  ).join('\n')

  const prompt = `You are a cultural historian and material culture expert with deep knowledge of world history, trade routes, craft traditions, colonial histories, religious contexts, and regional material cultures.

Here is a personal collection of objects:
${trinketList}

Find the most interesting, non-obvious historical, cultural, geographic, and trade-route connections between pairs of these objects. Look for:
- Shared historical periods, dynasties, or political contexts
- Connections via trade routes (Silk Road, spice trade, colonial networks)
- Shared craft traditions or material lineages
- Religious or devotional overlaps across cultures
- Colonial or post-colonial economic connections
- Migration patterns that link distant objects
- Surprising links that the collector would not have known

Return ONLY valid JSON with this exact structure, no markdown, no explanation:
{
  "connections": [
    {
      "object1": "exact name of first object",
      "object2": "exact name of second object",
      "type": "one of: historical / cultural / geographic / trade-route / material / personal",
      "label": "5-8 word description of the connection",
      "detail": "2-3 sentences explaining why these two objects are connected, with specific historical facts"
    }
  ]
}

Find 4-8 of the most genuinely interesting connections. Prioritise depth and specificity over quantity. Every connection must have a real historical or cultural basis.`

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1500,
          }
        })
      }
    )

    const data = await response.json()

    if (!response.ok) {
      console.error('Gemini error:', data)
      return res.status(500).json({ error: 'Gemini API error', detail: data })
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    const cleaned = text.replace(/```json|```/g, '').trim()
    const parsed = JSON.parse(cleaned)

    return res.status(200).json(parsed)
  } catch (err) {
    console.error('Error:', err)
    return res.status(500).json({ error: 'Failed to generate connections', detail: err.message })
  }
}
