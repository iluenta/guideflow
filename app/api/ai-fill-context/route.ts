import { createEdgeAdminClient } from '@/lib/supabase/edge';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateArrivalInstructions } from '../../../lib/arrival/generator-final';

export const runtime = 'edge';

const getGenAI = () => {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('Google AI API Key no configurada');
  return new GoogleGenerativeAI(key);
};

export async function POST(req: Request) {
  try {
    const { propertyId, section, existingData } = await req.json();
    console.log(`[AI-API] Request received. Property: ${propertyId}, Section: ${section}`);

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

    const supabase = createEdgeAdminClient();

    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('name, city, country, neighborhood, latitude, longitude, full_address')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      console.error('[AI-FILL] Property not found. ID:', propertyId, 'Error:', propError);
      return new Response(JSON.stringify({
        error: 'Propiedad no encontrada en la base de datos',
        debug: 'PROPERTY_NOT_FOUND',
        propertyId,
        supabaseError: propError
      }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const fallbackAddress = `${property.city}${property.neighborhood ? `, ${property.neighborhood}` : ''}${property.country ? `, ${property.country}` : ''}`;
    const fullAddress = existingData?.address || property.full_address || fallbackAddress;

    let finalCity = property.city || 'Desconocida';

    const SUBCATEGORY_MAP: Record<string, { placeType: string; keyword?: string }> = {
      restaurantes: { placeType: 'restaurant', keyword: 'restaurante' },
      compras: { placeType: 'supermarket', keyword: 'supermercado' },
      cultura: { placeType: 'museum', keyword: 'museo' },
      naturaleza: { placeType: 'park', keyword: 'naturaleza' },
      ocio: { placeType: 'tourist_attraction', keyword: 'turismo' },
      relax: { placeType: 'spa', keyword: 'spa' },
    };
    const selectedCat = existingData?.category || 'restaurantes';

    // ── 1. Arrivals Logic ────────────────────────────────────────────────────
    if (section === 'arrival') {
      try {
        const result = await generateArrivalInstructions(property.full_address || fallbackAddress);
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (err) {
        console.error('[AI-API] Arrival Error:', err);
        return new Response(JSON.stringify({ error: 'Error generando instrucciones de llegada' }), {
          status: 500
        });
      }
    }

    // ── 2. Dining / Recommendations Logic ──────────────────────────────────
    if (section === 'dining' || section === 'recommendations') {
      const placesKey = process.env.GOOGLE_PLACES_API_KEY;
      let placesResults: any[] = [];
      let debugLog: any[] = [];

      if (placesKey) {
        try {
          let lat = property.latitude;
          let lng = property.longitude;
          let useGeocoding = !lat || !lng;

          // Si el usuario proporciona una dirección manual diferente a la guardada,
          // forzamos geocodificación para obtener nuevas coordenadas.
          if (existingData?.address && existingData.address !== property.full_address) {
            console.log(`[PLACES] User provided manual address override: "${existingData.address}"`);
            useGeocoding = true;
          }

          if (useGeocoding) {
            const addressToGeo = existingData?.address || fullAddress;
            console.log(`[PLACES] Geocoding address: "${addressToGeo}"`);
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(addressToGeo)}&key=${placesKey}`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if (geoData.status !== 'OK') {
              console.error(`[PLACES] Geocoding failed: ${geoData.status}`);
            } else {
              const loc = geoData.results?.[0]?.geometry?.location;
              lat = loc?.lat;
              lng = loc?.lng;
              console.log(`[PLACES] Geocoded to: ${lat}, ${lng}`);
            }
          } else {
            console.log(`[PLACES] Using stored coordinates: ${lat}, ${lng}`);
          }

          if (lat && lng) {
            const categoriesToIterate = selectedCat === 'todos'
              ? ['restaurantes', 'compras', 'cultura', 'naturaleza', 'ocio']
              : [selectedCat];

            console.log(`[PLACES] Searching for categories:`, categoriesToIterate);

            for (const cat of categoriesToIterate) {
              const config = SUBCATEGORY_MAP[cat] || SUBCATEGORY_MAP['restaurantes'];

              let searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${config.placeType}&language=es&key=${placesKey}`;
              if (config.keyword) {
                searchUrl += `&keyword=${encodeURIComponent(config.keyword)}`;
              }

              console.log(`[PLACES] Fetching nearby for ${cat}: ${searchUrl.replace(placesKey, 'KEY_MASKED')}`);
              let searchRes = await fetch(searchUrl);
              let searchData = await searchRes.json();
              console.log(`[PLACES] Nearby status: ${searchData.status}, results: ${searchData.results?.length || 0}`);

              debugLog.push({ cat, status: searchData.status, results: searchData.results?.length || 0, type: 'nearby' });

              // Fallback a textsearch si nearby no devuelve nada
              if ((searchData.results || []).length === 0) {
                const query = `${config.keyword || config.placeType} cerca de ${existingData?.address || fullAddress}`;
                const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&location=${lat},${lng}&radius=20000&language=es&key=${placesKey}`;

                console.log(`[PLACES] Fallback textsearch for ${cat}: ${textSearchUrl.replace(placesKey, 'KEY_MASKED')}`);
                searchRes = await fetch(textSearchUrl);
                searchData = await searchRes.json();
                console.log(`[PLACES] Textsearch status: ${searchData.status}, results: ${searchData.results?.length || 0}`);

                debugLog.push({ cat, status: searchData.status, results: searchData.results?.length || 0, type: 'textsearch', query });
              }

              if (searchData.results) {
                placesResults = [...placesResults, ...searchData.results.map((r: any) => ({ ...r, gfCategory: cat }))];
              }
            }
          }
        } catch (err) {
          console.error('[PLACES] API Error:', err);
        }
      }

      // ── Process with Gemini ───────────────────────────────────────────────
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const placesContext = placesResults.slice(0, 15).map(r =>
        `- ${r.name} (${r.gfCategory}): ${r.vicinity || r.formatted_address}. Calificación: ${r.rating || 'N/A'}`
      ).join('\n');

      const prompt = `Actúa como un experto anfitrión local. Tu tarea es generar una lista de recomendaciones de ${selectedCat} para una guía turística.
PROPIEDAD: "${property.name}" en ${property.city}.

RESULTADOS DE GOOGLE PLACES (Contexto):
${placesContext || 'No se encontraron resultados específicos de Google Places. Usa tu conocimiento general de la zona.'}

INSTRUCCIONES:
1. Genera exactamente 4-6 recomendaciones.
2. Devuelve un objeto JSON con un array llamado "recommendations".
3. Cada objeto debe tener: "name", "description" (máx 150 caracteres), "distance" (estimada desde la propiedad), "type" (slug de categoría: restaurant, shopping, culture, nature, leisure, relax).
4. El tono debe ser hospitalario y personal.
5. NO incluyas texto fuera del JSON.

JSON:`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const jsonClean = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(jsonClean);
      // Gemini can return { recommendations: [...] } or just [...]. We want the array.
      const recommendations = Array.isArray(parsed.recommendations)
        ? parsed.recommendations
        : (Array.isArray(parsed) ? parsed : []);

      return new Response(JSON.stringify({ recommendations, debugLog }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ── 3. Tech / FAQs Logic ─────────────────────────────────────────────────
    if (section === 'tech' || section === 'faqs') {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      let prompt = '';
      if (section === 'tech') {
        prompt = `Eres un experto anfitrión. Genera detalles técnicos para un alojamiento turístico llamado "${property.name}" en ${property.city}. 
Genera una respuesta JSON con campos para: "wifi_name", "wifi_password", "parking_info", "trash_info".
JSON:`;
      } else if (section === 'faqs') {
        const { checkin_time, quiet_hours } = existingData || {};
        prompt = `Eres un experto anfitrión de un alojamiento turístico llamado "${property.name}" en ${property.city}. 
DESCRIPCIÓN: Alojamiento vacacional en ${property.city}.
DATOS ESPECÍFICOS: 
- Check-in: ${checkin_time || 'A convenir'}
- Horas de silencio: ${quiet_hours || '22:00 - 08:00'}

Genera una lista de 5 FAQs comunes para este alojamiento. 
Devuelve un JSON con un array "faqs", donde cada objeto tiene: "question", "answer", "category", "priority" (1-5).
JSON:`;
      }

      const result = await model.generateContent(prompt);
      const parts = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return new Response(parts, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ── 4. Contact Logic ─────────────────────────────────────────────────────
    if (section === 'contact') {
      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `Eres un experto anfitrión. Genera contactos de emergencia sugeridos para un alojamiento en ${property.city}, ${property.country}.
Incluye: Policía local, Emergencias médicas, Bomberos y quizás un Cerrajero local.
Devuelve un JSON con un array "contacts", donde cada objeto tiene: "name", "phone", "category" (Emergency, Service).
JSON:`;

      const result = await model.generateContent(prompt);
      const parts = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return new Response(parts, {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Sección no soportada' }), { status: 400 });

  } catch (error: any) {
    console.error('[AI-API] Global Error:', error);
    return new Response(JSON.stringify({
      error: 'Error interno en el servidor de IA',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}