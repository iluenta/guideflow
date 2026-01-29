// app/api/analyze-appliance/route.ts
import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function POST(req: Request) {
  const { imageUrl, propertyId } = await req.json();
  
  // Prompt específico para extraer info
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 1024,
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "url",
            url: imageUrl,
          },
        },
        {
          type: "text",
          text: `Analiza esta imagen de un electrodoméstico o aparato.
          
Extrae SOLO la siguiente información en formato JSON:
{
  "appliance_type": "tipo de aparato (horno, lavadora, termo, etc)",
  "brand": "marca si es visible",
  "model": "modelo exacto si es visible",
  "has_technical_label": true/false,
  "visible_controls": ["botón 1", "perilla temperatura", etc],
  "confidence": 0-1,
  "needs_web_search": true/false (true si no hay modelo claro)
}

Si NO puedes identificar claramente el aparato, devuelve confidence: 0.`
        }
      ]
    }]
  });
  
  const analysis = JSON.parse(message.content[0].text);
  
  // Guardar en DB
  const { data: image } = await supabase
    .from('appliance_images')
    .insert({
      property_id: propertyId,
      image_url: imageUrl,
      analysis_result: analysis
    })
    .select()
    .single();
    
  return Response.json({ analysis, imageId: image.id });
}