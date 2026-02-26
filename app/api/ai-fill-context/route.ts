import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateArrivalInstructions } from '@/lib/arrival/generator-final';

const getSupabase = () => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('Credenciales de Supabase no configuradas');
    return createClient(url, key);
};

const getGenAI = () => {
    const key = process.env.GOOGLE_AI_API_KEY;
    if (!key) throw new Error('Google AI API Key no configurada');
    return new GoogleGenerativeAI(key);
};

export async function POST(req: Request) {
  try {
    const { propertyId, section, existingData } = await req.json();
    console.log(`[AI-API] Request received. Property: ${propertyId}, Section: ${section}`);

    // Validación básica de propertyId (evitar strings no-UUID que rompen Supabase)
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(propertyId);
    
    if (!isUuid || propertyId === 'address-only') {
      return new Response(JSON.stringify({ 
        error: 'ID de propiedad inválido o no guardado',
        debug: 'ROUTE_UUID_CHECK_FAIL',
        receivedId: propertyId 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const supabase = getSupabase();
    
    // Obtener detalles de la propiedad para el contexto geográfico
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('name, city, country, neighborhood, description')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      console.error('[AI-FILL] Property not found:', propertyId, propError);
      return new Response(JSON.stringify({ error: 'Propiedad no encontrada en la base de datos' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fullAddress = existingData?.address || `${property.city}${property.neighborhood ? `, ${property.neighborhood}` : ''}${property.country ? `, ${property.country}` : ''}`;

    // Extracción de ciudad mejorada (derecha a izquierda)
    let finalCity = property.city || 'Desconocida';

    if (existingData?.address) {
      const parts = (existingData.address as string).split(',').map((p: string) => p.trim());
      // Buscamos la primera parte desde el final que sea una ciudad probable (más de 2 letras y no solo números)
      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i].replace(/^\d{5}\s+/, '').trim(); // Eliminar código postal si existe
        if (p.length > 2 && !/^\d+$/.test(p)) {
          finalCity = p;
          break;
        }
      }
    }

    if (finalCity === 'Desconocida' && property.country) {
      const countryLower = property.country.toLowerCase();
      if (countryLower.includes('espa')) finalCity = 'Madrid';
      else if (countryLower.includes('franc')) finalCity = 'París';
      else if (countryLower.includes('ital')) finalCity = 'Roma';
      else if (countryLower.includes('portugal')) finalCity = 'Lisboa';
    }

    console.log(`[AI-FILL] Section: ${section} | City: ${finalCity}`);

    // ─── TRANSPORT: early return, no Gemini ───────────────────────────────────
    const isTransport = ['transport', 'plane', 'train', 'road'].includes(section);
    if (isTransport) {
      try {
        const subSection = section === 'transport' ? undefined : section as any;
        const coordinates = existingData?.coordinates;
        console.log(`[AI-API] Calling generator. Section: ${section}, Coords:`, coordinates);
        const result = await generateArrivalInstructions(fullAddress, subSection, coordinates);
        console.log(`[AI-API] Generator result success`);
        return new Response(JSON.stringify(result), {
            headers: { 'Content-Type': 'application/json' }
        });
      } catch (error: any) {
        console.error('[TRANSPORT-FILL] Error:', error.message);
        return new Response(JSON.stringify({ 
            error: error.message,
            debug: 'ROUTE_TRANSPORT_CATCH'
        }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
      }
    }


    // ─── PROMPTS para Gemini ──────────────────────────────────────────────────
    let prompt = '';

    if (section === 'dining' || section === 'recommendations') {
      const selectedCat = existingData?.category || 'todos';
      const existingNames: string[] = existingData?.existingNames || [];

      // ── 1. Deduplication set ─────────────────────────────────────────────────
      const seen = new Set(existingNames.map((n: string) => n.toLowerCase()));

      // ── 2. Subcategory → Google Places type + keyword mapping ────────────────
      const SUBCATEGORY_MAP: Record<string, { placeType: string; keyword?: string }> = {
        todos:         { placeType: 'restaurant' },
        restaurantes:  { placeType: 'restaurant' },
        italiano:      { placeType: 'restaurant', keyword: 'italiano pizza pasta' },
        mediterraneo:  { placeType: 'restaurant', keyword: 'mediterráneo tapas mariscos' },
        hamburguesas:  { placeType: 'restaurant', keyword: 'hamburguesa burger' },
        asiatico:      { placeType: 'restaurant', keyword: 'sushi japonés chino thai asiático' },
        alta_cocina:   { placeType: 'restaurant', keyword: 'alta cocina gourmet' },
        internacional: { placeType: 'restaurant', keyword: 'internacional fusión' },
        desayuno:      { placeType: 'cafe',        keyword: 'desayuno brunch cafetería' },
        compras:       { placeType: 'shopping_mall', keyword: 'centro comercial moda fashion ropa tiendas típicas souvenirs' },
        supermercados: { placeType: 'supermarket',   keyword: 'mercadona dia carrefour lidl aldi mercado abastos alimentación' },
        cultura:       { placeType: 'museum',      keyword: 'museo monumento cultura' },
        naturaleza:    { placeType: 'park' },
        ocio:          { placeType: 'bar',         keyword: 'ocio entretenimiento' },
        relax:         { placeType: 'spa',         keyword: 'spa relax bienestar' },
      };
      const catConfig = SUBCATEGORY_MAP[selectedCat] || SUBCATEGORY_MAP['restaurantes'];

      // ── 3. Try Google Places Nearby Search ───────────────────────────────────
      const placesKey = process.env.GOOGLE_PLACES_API_KEY;
      let placesResults: any[] = [];

      if (placesKey) {
        try {
          const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${placesKey}`;
          const geoRes = await fetch(geoUrl);
          const geoData = await geoRes.json();
          const loc = geoData.results?.[0]?.geometry?.location;

          if (loc) {
            const { lat, lng } = loc;
            const radius = 2500; 
            let nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&type=${catConfig.placeType}&language=es&key=${placesKey}`;
            if (catConfig.keyword) nearbyUrl += `&keyword=${encodeURIComponent(catConfig.keyword)}`;

            const nearbyRes = await fetch(nearbyUrl);
            const nearbyData = await nearbyRes.json();

            placesResults = (nearbyData.results || [])
              .filter((p: any) => !seen.has((p.name || '').toLowerCase()) && (p.rating || 0) >= 3.5)
              .slice(0, 10) // Get up to 10
              .map((p: any) => ({
                google_place_id: p.place_id,
                name: p.name,
                address: p.vicinity,
                rating: p.rating,
                price_level: p.price_level, 
                map_url: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
                is_ai_generated: false
              }));
          }
        } catch (err) {
          console.warn('[PLACES] Nearby search failed:', err);
        }
      }

      // ── 4. Fallback Selection & Hybrid Logic ─────────────────────────────────
      // Logic defined by user: 
      // - 0 results: Omit category (return empty)
      // - 1-2 results: Keep them + generate 2 more with Gemini (AI completion)
      // - 3+ results: Just use real ones + enrichment
      
      let finalPlacesToEnrich = [];
      let needsAiCompletion = false;

      if (placesResults.length === 0) {
        return new Response(JSON.stringify({ recommendations: [] }), { headers: { 'Content-Type': 'application/json' } });
      } else if (placesResults.length < 3) {
        finalPlacesToEnrich = [...placesResults];
        needsAiCompletion = true;
      } else {
        finalPlacesToEnrich = placesResults.slice(0, 8);
      }

      // ── 5. Gemini Enrichment & Completion ────────────────────────────────────
      const priceMap: Record<number, string> = { 0: '€', 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' };
      const completionCount = needsAiCompletion ? 2 : 0;
      
      const enrichPrompt = `Eres un guía local experto de ${finalCity} con conocimiento profundo de la zona (${fullAddress}).
      
${needsAiCompletion ? `Solo he encontrado ${placesResults.length} puntos oficiales. TU TAREA:
1. Enriquece los resultados REALES que te paso.
2. INVENTA ${completionCount} lugares adicionales VEROSÍMILES (RESTAURANTES/SITIOS de la categoría "${selectedCat}") que podrían existir en esta zona pero que no aparecen en el mapa oficial. Márcalos como AI-generated.
` : `Enriquece estos resultados REALES de Google Maps:`}

Para cada lugar, proporciona:
- description: 2-3 frases auténticas y apetecibles.
- personal_note: Un consejo práctico (ej. "reserva con antelación", "pide el postre X").

Lugares actuales:
${finalPlacesToEnrich.map((p, i) => `${i + 1}. "${p.name}" (@ ${p.address})`).join('\n')}

Responde SOLO con JSON:
{
  "enriched": [
    { "index": 0, "description": "...", "personal_note": "..." }
  ]
  ${needsAiCompletion ? `, "completed": [
    { "name": "...", "description": "...", "personal_note": "...", "price_range": "€€" }
  ]` : ''}
}`;

      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json', temperature: 0.3 }
      });
      
      const enrichRes = await model.generateContent(enrichPrompt);
      let parsedEnrichment: any = {};
      try {
        parsedEnrichment = JSON.parse(enrichRes.response.text());
      } catch (e) {
        console.error('[AI-FILL] Failed to parse enrichment:', e);
      }

      // Build recommendations array
      const recommendations: any[] = [];
      
      // Add real enriched ones
      finalPlacesToEnrich.forEach((p, i) => {
        const e = parsedEnrichment.enriched?.find((x: any) => x.index === i) || { description: '', personal_note: '' };
        recommendations.push({
          id: `places_${p.google_place_id}`,
          name: p.name,
          category: selectedCat === 'todos' ? 'restaurantes' : selectedCat,
          type: selectedCat === 'todos' ? 'restaurantes' : selectedCat,
          description: e.description,
          personal_note: e.personal_note,
          distance: '',
          time: '',
          price_range: priceMap[p.price_level] ?? '€€',
          map_url: p.map_url,
          google_place_id: p.google_place_id,
        });
      });

      // Add AI completed ones if needed
      if (needsAiCompletion && parsedEnrichment.completed) {
        parsedEnrichment.completed.forEach((ai: any, i: number) => {
          recommendations.push({
            id: `ai_comp_${Date.now()}_${i}`,
            name: ai.name,
            category: selectedCat === 'todos' ? 'restaurantes' : selectedCat,
            type: selectedCat === 'todos' ? 'restaurantes' : selectedCat,
            description: ai.description,
            personal_note: `[AI] ${ai.personal_note}`,
            distance: '',
            time: '',
            price_range: ai.price_range || '€€',
            map_url: '',
            google_place_id: null,
          });
        });
      }

      return new Response(JSON.stringify({ recommendations }), {
        headers: { 'Content-Type': 'application/json' }
      });

      // ── 6. Fallback Catch-all (Should rarely be reached if Places is active) ───
      console.warn('[PLACES] Complete fallback required');


    } else if (section === 'tech') {
      prompt = `Asistente técnico para alojamiento turístico. Genera consejos básicos para Smart TV y WiFi. JSON con clave "tech_info".`;

    } else if (section === 'inventory') {
      prompt = `Genera inventario básico para un apartamento turístico. JSON con clave "inventory".`;

    } else if (section === 'faqs') {
      const { checkin_time, quiet_hours } = existingData || {};
      prompt = `Eres un experto anfitrión de un alojamiento turístico llamado "${property.name}" en ${property.city}. 
DESCRIPCIÓN: ${property.description || 'Alojamiento vacacional'}.
DATOS ESPECÍFICOS: 
- Check-in: ${checkin_time || 'A convenir'}
- Horas de silencio: ${quiet_hours || '22:00 - 08:00'}

TAREA: Genera 10-12 FAQs REALES y útiles para un huésped que se queda en este alojamiento.
Incluye temas como: llegada, wifi, normas, basura, transporte cercano y uso de electrodomésticos.

REGLA DE ORO: NO inventes detalles físicos específicos si no están en la descripción. Sé útil pero factual.

RESPONDE SOLO EL JSON con la clave "faqs" y una lista de objetos { question, answer }.`;

    } else if (section === 'contacts') {
      prompt = `Eres un experto en servicios de emergencia y recursos sanitarios de ${finalCity}, España.

UBICACIÓN EXACTA: ${fullAddress}

TAREA: Generar una lista COMPLETA y REAL de contactos de emergencia y servicios esenciales 
para un huésped que no conoce la zona. Prioriza los más cercanos a la ubicación indicada.

SERVICIOS A INCLUIR (en este orden de prioridad):

1. EMERGENCIAS GENERALES (siempre incluir):
   - 112 Emergencias General
   - 091 Policía Nacional (con dirección de la comisaría más cercana)
   - 062 Guardia Civil (con dirección del puesto más cercano)
   - 080 Bomberos locales (con dirección del parque más cercano)

2. URGENCIAS MÉDICAS:
   - Hospital general más cercano con urgencias 24h (nombre real, dirección, teléfono)
   - Centro de salud más cercano (nombre real, dirección, teléfono, horario)
   - PAC o Punto de Atención Continuada más cercano si existe (24h preferente)
   - Cruz Roja local si tiene servicio de urgencias en la zona

3. FARMACIAS:
   - Farmacia de guardia 24h más cercana (si existe permanente en la zona)
   - Al menos 1-2 farmacias cercanas a la dirección con horario habitual
   - Teléfono del turno de guardia de farmacias de la provincia

4. VETERINARIA (para huéspedes con mascotas):
   - Clínica veterinaria de urgencias 24h más cercana (nombre real, dirección, teléfono)
   - Al menos 1 clínica veterinaria cercana con horario normal como alternativa

5. OTROS SERVICIOS ÚTILES:
   - Taxi local o radiotaxi de la zona (teléfono real)
   - Grúa o asistencia en carretera (si zona turística)

REGLAS CRÍTICAS:
- Usa SOLO nombres, direcciones y teléfonos REALES y verificables
- Si no tienes certeza de un dato concreto, usa el número genérico nacional (ej: 112) en lugar de inventar
- Prioriza servicios 24h
- La distancia debe ser realista desde ${fullAddress}

ESTRUCTURA JSON EXIGIDA:
{
  "emergency_contacts": [
    { "id": "emergencias_112", "name": "Emergencias General", "phone": "112", "address": "Servicio de cobertura nacional", "distance": "Inmediato", "type": "emergency" },
    { "id": "policia_nacional", "name": "Policía Nacional", "phone": "091", "address": "[Dirección real comisaría más cercana]", "distance": "[X min]", "type": "policia" },
    { "id": "guardia_civil", "name": "Guardia Civil", "phone": "062", "address": "[Dirección real puesto más cercano]", "distance": "[X min]", "type": "policia" },
    { "id": "bomberos", "name": "Bomberos", "phone": "080", "address": "[Dirección real parque más cercano]", "distance": "[X min]", "type": "emergency" },
    { "id": "hospital_urgencias", "name": "[Nombre real hospital]", "phone": "[Teléfono real]", "address": "[Dirección real] — Urgencias 24h", "distance": "[X min en coche]", "type": "salud" },
    { "id": "centro_salud", "name": "[Nombre real centro salud o PAC]", "phone": "[Teléfono real]", "address": "[Dirección real] — [Horario]", "distance": "[X min]", "type": "salud" },
    { "id": "farmacia_guardia", "name": "Farmacia de Guardia", "phone": "[Teléfono guardia provincial]", "address": "[Dirección o 'rotativa por la zona']", "distance": "[X min]", "type": "farmacia" },
    { "id": "farmacia_cercana", "name": "[Nombre real farmacia]", "phone": "[Teléfono real]", "address": "[Dirección real] — [Horario]", "distance": "[X min]", "type": "farmacia" },
    { "id": "veterinaria_urgencias", "name": "[Nombre real clínica veterinaria]", "phone": "[Teléfono real]", "address": "[Dirección real] — [24h / Horario]", "distance": "[X min]", "type": "veterinaria" },
    { "id": "taxi_local", "name": "Radio Taxi ${finalCity}", "phone": "[Teléfono real radiotaxi local]", "address": "Servicio zona", "distance": "Bajo demanda", "type": "transporte" }
  ]
}

RESPONDE ÚNICAMENTE CON EL JSON VÁLIDO, sin texto adicional.`;
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: `Sección no soportada: ${section}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const genAI = getGenAI();
    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return new Response(responseText, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[AI-FILL] Error:', error);
    const errorMessage = error?.message || (typeof error === 'string' ? error : JSON.stringify(error)) || 'Unknown Error';
    return new Response(JSON.stringify({ 
        error: errorMessage,
        debug: 'ROUTE_GLOBAL_CATCH',
        errorRaw: String(error)
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}