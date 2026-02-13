import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Note: environment variables must be configured in Supabase dashboard
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const googleApiKey = Deno.env.get('GOOGLE_AI_API_KEY');

if (!googleApiKey) {
    console.error('GOOGLE_AI_API_KEY is not set in environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async (req: Request) => {
    const { model_id, brand, property_id, tenant_id } = await req.json();

    if (!model_id || !brand) {
        return new Response(JSON.stringify({ error: 'Missing model_id or brand' }), { status: 400 });
    }

    try {
        // 1. Check if we already have this manual
        const { data: existing } = await supabase
            .from('appliance_manuals')
            .select('*')
            .eq('model', model_id)
            .eq('brand', brand)
            .single();

        if (existing && existing.content && Object.keys(existing.content).length > 0) {
            return new Response(JSON.stringify({ status: 'cached', data: existing }));
        }

        // 2. Call Gemini with Google Search Grounding
        const prompt = `INSTRUCCIONES: Busca el manual oficial de ${brand} modelo ${model_id}. 
    Extrae estos puntos técnicos EXACTOS en JSON:
    {
      "quick_start": "Pasos cortos para encenderlo",
      "knob_type": "escamoteable / táctil / botones",
      "safety_unlock": "Cómo quitar el Child Lock",
      "warning": "Aviso crítico de seguridad",
      "manual_url": "URL fuente"
    }
    Respuesta SOLO en JSON.`;

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${googleApiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                tools: [{ googleSearchRetrieval: {} }]
            })
        });

        const result = await response.json();

        if (!result.candidates || !result.candidates[0]) {
            return new Response(JSON.stringify({ status: 'not_found', error: 'No response from Gemini' }));
        }

        const responseText = result.candidates[0].content.parts[0].text;

        // Clean and parse JSON
        let technicalData;
        try {
            const cleanedJson = responseText.replace(/```json|```/g, '').trim();
            technicalData = JSON.parse(cleanedJson);
        } catch (e) {
            console.error('Failed to parse Gemini JSON:', responseText);
            return new Response(JSON.stringify({ status: 'error', error: 'Invalid JSON from AI' }));
        }

        // 3. Store in Supabase
        const { data, error } = await supabase
            .from('appliance_manuals')
            .upsert({
                property_id,
                tenant_id,
                brand,
                model: model_id,
                appliance_name: `${brand} ${model_id}`,
                content: technicalData,
                source_url: technicalData.manual_url
            }, { onConflict: 'brand,model' })
            .select()
            .single();

        if (error) throw error;

        return new Response(JSON.stringify({ status: 'stored', data }));

    } catch (error) {
        console.error('Edge Function Error:', error);
        return new Response(JSON.stringify({ error: (error as any).message }), { status: 500 });
    }
};
