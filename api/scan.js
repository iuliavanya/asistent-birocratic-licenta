export const config = { runtime: 'edge' };

const PROMPTS = {
  ci: {
    sistem: `You are an OCR assistant that reads text from document images and returns structured data in JSON format.`,
    sarcina: `Read all visible text fields from this document image and extract the following information into JSON:
{
  "nume": "the full name text (Last name + First name)",
  "cnp": "the 13-digit numeric code labeled CNP",
  "serie_ci": "the series and number (2 letters + 6 digits)",
  "adresa": "the full address text from the domiciliu/address field"
}
If a field is not visible or unreadable, use null.
Return ONLY the JSON object. No explanation. No markdown. Start with { end with }.`,
  },

  talon: {
    sistem: `You are an OCR assistant that reads text from vehicle document images and returns structured data in JSON format.`,
    sarcina: `Read all visible text fields from this vehicle document image and extract into JSON:
{
  "marca": "vehicle brand/make",
  "tip": "vehicle model/type",
  "vin": "chassis number / VIN (17 characters)",
  "serie_motor": "engine serial number or null",
  "cilindree": "engine displacement in cc, numbers only",
  "putere_kw": "power in kW, numbers only",
  "an_fabricatie": "year of manufacture, 4 digits",
  "nr_inmatriculare": "license plate number or null",
  "culoare": "color or null",
  "tip_combustibil": "fuel type or null"
}
If a field is not visible or unreadable, use null.
Return ONLY the JSON object. No explanation. No markdown. Start with { end with }.`,
  },
};

export default async function handler(req) {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const { imageBase64, mediaType, tip = 'ci' } = await req.json();

    if (!imageBase64) {
      return new Response(JSON.stringify({ error: 'No image provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const prompt = PROMPTS[tip] || PROMPTS.ci;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: prompt.sistem,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType || 'image/jpeg',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: prompt.sarcina,
            },
          ],
        }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      return new Response(JSON.stringify({ error: 'Claude API error', details: error }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const data = await response.json();
    const text = data.content[0].text;

    let extracted;
    try {
      let clean = text.replace(/```json|```/g, '').trim();
      const start = clean.indexOf('{');
      const end = clean.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        clean = clean.substring(start, end + 1);
      }
      extracted = JSON.parse(clean);
    } catch (e) {
      return new Response(JSON.stringify({ 
        error: 'Could not parse response', 
        raw: text 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}