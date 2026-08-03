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

Find 4-6 interesting connections between pairs of these objects. Connections can be historical, geographic, material, cultural, personal, conceptual, or economic.

IMPORTANT: Return ONLY a JSON object. No markdown. No explanation. No text before or after. Just the JSON.

Example format:
{"connections":[{"object1":"coin","object2":"tile","type":"historical","label":"both pre-colonial","detail":"Both objects originate from periods before British colonisation of India, representing continuity of craft traditions across political upheaval."}]}`

  // Try models in order until one works
  const models = [
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.0-pro',
  ]

  for (const model of models) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
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
        console.error(`Model ${model} failed:`, resp.status, data?.error?.message)
        continue // try next model
      }

      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text
      if (!text) {
        console.error(`Model ${model} returned no text`)
        continue
      }

      // Extract JSON from response — handles markdown fences and extra text
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        console.error(`No JSON found in response:`, text.substring(0, 200))
        continue
      }

      const parsed = JSON.parse(jsonMatch[0])
      console.log(`Success with model ${model}, found ${parsed.connections?.length} connections`)
      return res.status(200).json(parsed)

    } catch (err) {
      console.error(`Model ${model} threw:`, err.message)
      continue
    }
  }

  return res.status(500).json({ error: 'All models failed' })
}
