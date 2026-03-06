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

    // Para refinar textsearch en pueblos pequeños (ej: Vera en lugar de Almería entera)
    if (existingData?.address) {
      const parts = (existingData.address as string).split(',').map((p: string) => p.trim());
      // Filtrar países explícitos y números, para coger el pueblo y la provincia
      const countriesToFilter = ['españa', 'espana', 'spain', 'francia', 'france', 'italia', 'italy', 'portugal'];
      const validParts = parts
        .map(p => p.replace(/^\d{5}\s+/, '').trim())
        .filter(p =>
          p.length > 2 &&
          !/^\d+$/.test(p) &&
          !countriesToFilter.includes(p.toLowerCase()) &&
          p.toLowerCase() !== property.country?.toLowerCase()
        );

      if (validParts.length > 0) {
        // Cogemos el pueblo/barrio y la ciudad/provincia principales
        finalCity = validParts.slice(-2).join(', ');
      }
    } else if (property.neighborhood && property.city) {
      finalCity = `${property.neighborhood}, ${property.city}`;
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
      // Flexibilizamos mucho las keywords para que nearbysearch no devuelva 0 resultados.
      const SUBCATEGORY_MAP: Record<string, { placeType: string; keyword?: string }> = {
        todos: { placeType: 'restaurant' },
        restaurantes: { placeType: 'restaurant' },
        italiano: { placeType: 'restaurant', keyword: 'italiano|pizza' },
        mediterraneo: { placeType: 'restaurant', keyword: 'mediterráneo|tapas|marisco' },
        hamburguesas: { placeType: 'restaurant', keyword: 'hamburguesa|burger' },
        asiatico: { placeType: 'restaurant', keyword: 'sushi|asiático|chino' },
        alta_cocina: { placeType: 'restaurant', keyword: 'alta cocina|gourmet' },
        internacional: { placeType: 'restaurant', keyword: 'internacional|fusión' },
        desayuno: { placeType: 'cafe', keyword: 'desayuno|brunch|cafetería' },
        compras: { placeType: 'shopping_mall', keyword: 'centro comercial|ropa' },
        supermercados: { placeType: 'supermarket', keyword: 'supermercado|mercadona|carrefour' },
        cultura: { placeType: 'museum', keyword: 'museo|monumento' },
        naturaleza: { placeType: 'park' },
        ocio: { placeType: 'bar', keyword: 'ocio|pub|coctel' },
        relax: { placeType: 'spa', keyword: 'spa|relax|masaje' },
      };
      const catConfig = SUBCATEGORY_MAP[selectedCat] || SUBCATEGORY_MAP['restaurantes'];

      // ── 3. Google Places Search Logic ───────────────────────────────────────
      const placesKey = process.env.GOOGLE_PLACES_API_KEY;
      let placesResults: any[] = [];

      if (placesKey) {
        try {
          let lat = property.latitude;
          let lng = property.longitude;

          if (!lat || !lng) {
            console.log(`[PLACES] No stored coordinates. Geocoding address: "${fullAddress}"`);
            const geoUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${placesKey}`;
            const geoRes = await fetch(geoUrl);
            const geoData = await geoRes.json();

            if (geoData.status !== 'OK') {
              console.error(`[PLACES] Geocoding failed: ${geoData.status}`, geoData.error_message || '');
            } else {
              const loc = geoData.results?.[0]?.geometry?.location;
              lat = loc?.lat;
              lng = loc?.lng;
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

              // Cuando rankby=distance está activo, NO se puede usar radius.
              // Google devolverá los 20 lugares que coincidan estrictamente desde el más cercano al más lejano.
              let searchUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${config.placeType}&language=es&key=${placesKey}`;
              if (config.keyword) {
                searchUrl += `&keyword=${encodeURIComponent(config.keyword)}`;
              }

              let searchRes = await fetch(searchUrl);
              let searchData = await searchRes.json();

              // Si por algún motivo de la keyword hiper-estricta devuelve 0, probamos un fallback suavizando (quitando keyword)
              // pero manteniendo tipo y cercanía.
              if ((searchData.results || []).length < 2 && config.keyword) {
                console.log(`[PLACES] Fallback to general type for ${cat}`);
                const fallbackUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=${config.placeType}&language=es&key=${placesKey}`;
                searchRes = await fetch(fallbackUrl);
                searchData = await searchRes.json();
              }

              // TEMPORAL - ver qué devuelve Google antes del filtro
              const rawPlacesLog = (searchData.results || []).slice(0, 10).map((r: any) => `${r.name} (rat:${r.rating} rev:${r.user_ratings_total})`);
              console.log(`[PLACES] Raw results for ${cat}:`, searchData.results?.length,
                'status:', searchData.status,
                'top 10 raw:', rawPlacesLog
              );

              const currentResults = (searchData.results || [])
                .filter((p: any) => !seen.has((p.name || '').toLowerCase()) && (p.rating || 0) >= 3.5)
                .slice(0, selectedCat === 'todos' ? 4 : 10)
                // ── OPCIÓN C: extraemos todos los datos factuales disponibles ──
                .map((p: any) => ({
                  google_place_id: p.place_id,
                  name: p.name,
                  address: p.vicinity,
                  rating: p.rating ?? null,
                  user_ratings_total: p.user_ratings_total ?? 0,
                  price_level: p.price_level ?? null,
                  types: (p.types || []).slice(0, 3), // máx 3 para no inflar el prompt
                  category: cat === 'todos' ? 'restaurantes' : cat,
                  map_url: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
                  is_ai_generated: false
                }));

              placesResults = [...placesResults, ...currentResults];

              if (selectedCat === 'todos' && placesResults.length >= 20) break;
            }
          }
        } catch (err) {
          console.warn('[PLACES] Nearby search failed:', err);
        }
      }

      // ── 4. Selección final — Opción C: nunca inventamos lugares ─────────────
      const finalPlacesToEnrich = placesResults.slice(0, 20);

      if (finalPlacesToEnrich.length === 0) {
        return new Response(JSON.stringify({ recommendations: [] }), {
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // ── 5. Gemini Enrichment — solo datos factuales ──────────────────────────
      const priceMap: Record<number, string> = { 0: '€', 1: '€', 2: '€€', 3: '€€€', 4: '€€€€' };

      const isTodos = selectedCat === 'todos';
      const isNonFood = !['restaurantes', 'italiano', 'mediterraneo', 'hamburguesas', 'asiatico', 'alta_cocina', 'internacional', 'desayuno'].includes(selectedCat);

      const role = (isTodos || isNonFood)
        ? `Eres un experto local en turismo y gastronomía de ${finalCity}.`
        : `Eres un crítico gastronómico local de ${finalCity}.`;

      const categoryInstruction = isTodos
        ? `- Evalúa rigurosamente si cada lugar encaja en su [Categoría Asignada] (indicada entre corchetes).`
        : `- Evalúa rigurosamente si el lugar encaja en la Categoría buscada (${selectedCat}).`;

      const matchInstruction = isTodos
        ? `- is_match: booleano. Si la categoría es [ITALIANO] pero el local ofrece evidente comida mexicana, pon false. Si encaja con su categoría asignada o es ambiguo, pon true.`
        : `- is_match: booleano (true/false). Si buscas 'italiano' y el local se llama 'Asador El Cordobés' o 'Cocina Extremeña', pon false. Si encaja o es ambiguo/genérico, pon true.`;

      const enrichPrompt = `${role} Escribe descripciones CORTAS, ESPECÍFICAS y VARIADAS para cada lugar.

REGLAS:
${categoryInstruction}
${matchInstruction}
- Infiere el tipo de lugar a partir de su NOMBRE y CATEGORÍA.
- Si es un restaurante, habla de su comida. Si es un parque o museo, habla de la experiencia y qué ver. Si es una tienda, habla de lo que venden.
- NO uses frases genéricas como "ofrece comida" o "es un lugar para visitar".
- description: 2 frases concretas sobre QUÉ tipo de experiencia, producto o cocina ofrece, inferido del nombre o su categoría. Diferente para cada lugar.
- personal_note: consejo ÚNICO y específico para ese local concreto. Varía según:
    · Rating ≥ 4.5 + muchas reseñas → destaca que es de los mejores de la zona
    · Rating 3.5-4.2 + precio € → "Buena relación calidad-precio para disfrutar sin gastar mucho."
    · Precio €€€+ → "Reserva recomendable con antelación."
    · Parques/Ocio → "Ideal para dar un paseo o desconectar un rato."
    · Tiendas/Supermercados → "Práctico para abastecerte durante tu estancia."

${!isTodos ? `Categoría buscada: ${selectedCat}\n` : ''}Zona: ${fullAddress}

Lugares:
${finalPlacesToEnrich.map((p, i) => {
        const stars = p.rating ? `⭐ ${p.rating}/5` : 'sin valoración';
        const reviews = p.user_ratings_total ? `${p.user_ratings_total} reseñas` : 'sin reseñas';
        const price = p.price_level != null ? priceMap[p.price_level] : '?';
        const categoryLabel = p.category ? `[${p.category.toUpperCase()}] ` : '';
        return `${i + 1}. ${categoryLabel}"${p.name}" | ${stars} (${reviews}) | Precio: ${price} | ${p.address}`;
      }).join('\n')}

Responde SOLO con JSON válido:
{
  "enriched": [
    { "index": 0, "is_match": true, "description": "...", "personal_note": "..." }
  ]
}`;

      const genAI = getGenAI();
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
      });

      const enrichRes = await model.generateContent(enrichPrompt);
      let parsedEnrichment: any = {};
      try {
        parsedEnrichment = JSON.parse(enrichRes.response.text());
      } catch (e) {
        console.error('[AI-FILL] Failed to parse enrichment:', e);
      }

      // ── 6. Construir array final — solo lugares reales ───────────────────────
      const recommendations: any[] = [];

      finalPlacesToEnrich.forEach((p, i) => {
        const e = parsedEnrichment.enriched?.find((x: any) => x.index === i);

        // Si el usuario pidió una categoría específica y Gemini dice explícitamente que no encaja, lo saltamos.
        if (selectedCat !== 'todos' && e && e.is_match === false) {
          console.log(`[AI-FILL] Filtrado por IA (no match): ${p.name}`);
          return;
        }

        const safeE = e || { description: '', personal_note: '' };
        const catToUse = p.category || (selectedCat === 'todos' ? 'restaurantes' : selectedCat);

        recommendations.push({
          id: `places_${p.google_place_id}`,
          name: p.name,
          category: catToUse,
          type: catToUse,
          description: safeE.description,
          personal_note: safeE.personal_note,
          distance: '',
          time: '',
          price_range: p.price_level != null ? priceMap[p.price_level] : '€€',
          map_url: p.map_url,
          google_place_id: p.google_place_id,
        });
      });

      return new Response(JSON.stringify({ recommendations }), {
        headers: { 'Content-Type': 'application/json' }
      });

    } else if (section === 'tech') {
      prompt = `Asistente técnico para alojamiento turístico. Genera consejos básicos para Smart TV y WiFi. JSON con clave "tech_info".`;

    } else if (section === 'inventory') {
      prompt = `Genera inventario básico para un apartamento turístico. JSON con clave "inventory".`;

    } else if (section === 'faqs') {
      const { checkin_time, quiet_hours } = existingData || {};
      prompt = `Eres un experto anfitrión de un alojamiento turístico llamado "${property.name}" en ${property.city}. 
DESCRIPCIÓN: Alojamiento vacacional en ${property.city}.
DATOS ESPECÍFICOS: 
- Check-in: ${checkin_time || 'A convenir'}
- Horas de silencio: ${quiet_hours || '22:00 - 08:00'}

TAREA: Genera 10-12 FAQs REALES y útiles para un huésped que se queda en este alojamiento.
Incluye temas como: llegada, wifi, normas, basura, transporte cercano y uso de electrodomésticos.

REGLA DE ORO: NO inventes detalles físicos específicos si no están en la descripción. Sé útil pero factual.

RESPONDE SOLO EL JSON con la clave "faqs" y una lista de objetos { question, answer }.`;

    } else if (section === 'contacts') {
      const placesKey = process.env.GOOGLE_PLACES_API_KEY;
      const c = existingData?.coordinates;
      let placesContext = '';

      if (placesKey && c?.lat && c?.lng) {
        try {
          const typesToSearch = [
            { type: 'pharmacy', label: 'Farmacias' },
            { type: 'hospital', keyword: 'urgencias', label: 'Hospitales/Urgencias' },
            { type: 'doctor', keyword: 'centro de salud', label: 'Centros de Salud Públicos' },
            { type: 'police', label: 'Comisarías de Policía/Guardia Civil' },
            { type: 'fire_station', label: 'Bomberos' },
            { type: 'veterinary_care', keyword: 'urgencias', label: 'Urgencias Veterinarias' }
          ];

          let allFetched: string[] = [];
          for (const t of typesToSearch) {
            let url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${c.lat},${c.lng}&rankby=distance&type=${t.type}&language=es&key=${placesKey}`;
            if (t.keyword) url += `&keyword=${t.keyword}`;

            const res = await fetch(url);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              const top3 = data.results.slice(0, 3).map((r: any) => `- ${r.name} (${r.vicinity || 'Dirección desconocida'}) [ID_MAPS: ${r.place_id || 'n/a'}]`);
              allFetched.push(`[${t.label} CERCANOS VERIFICADOS VÍA RADAR]`);
              allFetched.push(...top3);
            }
          }
          if (allFetched.length > 0) {
            placesContext = `\n\n--- DATOS DE LOCACIONES REALES OBTENIDAS POR GPS ---\n(Úsalos como base inicial. Nota: si falta el teléfono aquí, usa tu conocimiento interno para rellenarlo)\n` + allFetched.join('\n');
            console.log('[AI-FILL] Injected factual Places DB for contacts:', allFetched.length, 'lines');
          }
        } catch (e) {
          console.warn('[AI-FILL] Failed to fetch external places context for contacts', e);
        }
      }

      const coordsStr = c ? `\nCOORDENADAS GPS (EPICENTRO DE BÚSQUEDA): Latitud ${c.lat}, Longitud ${c.lng}` : '';

      prompt = `Eres un hiper-especialista en geolocalización de servicios de emergencia en España.

UBICACIÓN EXACTA DEL ALOJAMIENTO: ${fullAddress} ${coordsStr}
(IGNORA el nombre genérico de la ciudad si es amplio. USA LAS COORDENADAS GPS como centro absoluto para buscar).
${placesContext}

TAREA: Generar una lista COMPLETA y ÚTIL de contactos de emergencia y servicios esenciales 
para un huésped que se aloja en esta dirección. Aprovecha los DATOS DE LOCACIONES REALES que te he pasado, y complétalos con tu conocimiento.

SERVICIOS A INCLUIR(en este orden de prioridad):

      1. EMERGENCIAS GENERALES(siempre incluir):
      - 112 Emergencias General
        - 091 Policía Nacional(con dirección de la comisaría más cercana o puesto de Guardia Civil)
          - 062 Guardia Civil
            - 080 Bomberos locales

      2. URGENCIAS MÉDICAS:
      - Hospital general más cercano con urgencias 24h(nombre, dirección, teléfono)
        - Centro de salud más cercano(nombre, dirección, teléfono)

      3. FARMACIAS:
      - Farmacia más cercana o farmacia de guardia

      4. VETERINARIA(para huéspedes con mascotas):
      - Clínica veterinaria más cercana (si es posible de urgencias)

      5. OTROS SERVICIOS ÚTILES:
      - Taxi local o radiotaxi de la zona

REGLAS CRÍTICAS:
      - RELLENA los teléfonos usando tu conocimiento interno si los datos GPS no lo incluyen.
      - NUNCA omitas un servicio esencial (como Policía u Hospital) solo porque te falte un dato. Si te falta el teléfono pero sabes que el hospital existe, deja el teléfono en blanco ("") en el JSON, pero MANTÉN el bloque en el array.
      - Para los lugares obtenidos por GPS o por tu base de datos y que estés seguro, DEBES incluir su ID en maps si se te dio [ID_MAPS: ...] en el campo "place_id". Si no tiene ID o es un servicio general (como el 112), pon null.
      - Distancias realistas (ej: "5 min", "10 min en coche").

ESTRUCTURA JSON EXIGIDA (EJEMPLO - DEVUELVE SOLO LOS OBJETOS PARA LOS QUE TENGAS DATOS REALES E IGNORA EL RESTO):
      {
        "emergency_contacts": [
          { "id": "emergencias_112", "name": "Emergencias General", "phone": "112", "address": "Servicio de cobertura nacional", "distance": "Inmediato", "type": "emergency", "place_id": null },
          { "id": "policia_nacional", "name": "Policía Nacional", "phone": "091", "address": "[Dirección real comisaría más cercana]", "distance": "[X min]", "type": "policia", "place_id": "[ID_MAPS string]" },
          { "id": "guardia_civil", "name": "Guardia Civil", "phone": "062", "address": "[Dirección real puesto más cercano]", "distance": "[X min]", "type": "policia", "place_id": "[ID_MAPS string]" },
          { "id": "bomberos", "name": "Bomberos", "phone": "080", "address": "[Dirección real parque más cercano]", "distance": "[X min]", "type": "emergency", "place_id": "[ID_MAPS string]" },
          { "id": "hospital_urgencias", "name": "[Nombre real hospital]", "phone": "[Teléfono real]", "address": "[Dirección real] — Urgencias 24h", "distance": "[X min en coche]", "type": "salud", "place_id": "[ID_MAPS string]" },
          { "id": "centro_salud", "name": "[Nombre real centro salud o PAC]", "phone": "[Teléfono real]", "address": "[Dirección real] — [Horario]", "distance": "[X min]", "type": "salud", "place_id": "[ID_MAPS string]" },
          { "id": "farmacia_guardia", "name": "Farmacia de Guardia", "phone": "[Teléfono guardia provincial]", "address": "[Dirección o 'rotativa por la zona']", "distance": "[X min]", "type": "farmacia", "place_id": "[ID_MAPS string]" },
          { "id": "farmacia_cercana", "name": "[Nombre real farmacia]", "phone": "[Teléfono real]", "address": "[Dirección real] — [Horario]", "distance": "[X min]", "type": "farmacia", "place_id": "[ID_MAPS string]" },
          { "id": "veterinaria_urgencias", "name": "[Nombre real clínica veterinaria]", "phone": "[Teléfono real]", "address": "[Dirección real] — [24h / Horario]", "distance": "[X min]", "type": "veterinaria", "place_id": "[ID_MAPS string]" },
          { "id": "taxi_local", "name": "Radio Taxi ${finalCity}", "phone": "[Teléfono real radiotaxi local]", "address": "Servicio zona", "distance": "Bajo demanda", "type": "transporte", "place_id": null }
        ]
      }

RESPONDE ÚNICAMENTE CON EL JSON VÁLIDO, sin texto adicional.`;
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: `Sección no soportada: ${section} ` }), {
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