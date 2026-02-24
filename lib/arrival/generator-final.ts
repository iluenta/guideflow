import { geocodeAddress, GeocodingResult } from '../geocoding';
import { discoverNearbyAirports } from '../discovery/airports';
import { discoverNearbyAirportsFallback } from '../discovery/airports-fallback';
import { discoverMainTrainStations, discoverNearbyMetroStations } from '../discovery/stations';
import { findNearbyParking } from '../maps/overpass';
import { searchAirportTransportOptions, searchHighwayInformation } from '../discovery/transit-search';
import { geminiREST } from '../ai/gemini-rest';
import { createClient } from '../supabase/server';

/**
 * Main orchestrator for generating arrival instructions (Fase 13)
 * 
 * OPTIMIZATION: When a specific section is requested (plane/train/road),
 * we skip expensive external API chains and use a single Gemini call instead.
 * This reduces latency from ~30s to ~5s in corporate proxy environments.
 */
export async function generateArrivalInstructions(address: string, section?: 'plane' | 'train' | 'road', manualGeo?: GeocodingResult) {
    console.log('[ARRIVAL] Starting generation for:', address, section ? `(Section: ${section})` : '');

    // 1. Geocode (always needed — fast, uses Mapbox, now supports manual override)
    const geo = manualGeo || await geocodeAddress(address);
    if (!geo) {
        console.error('[ARRIVAL] Geocoding failed for:', address);
        throw new Error('No se pudo geocodificar la dirección');
    }

    const coordinates: [number, number] = [geo.lng, geo.lat];
    const city = geo.city || '';
    const countryCode = geo.countryCode || 'ES';
    console.log(`[ARRIVAL] Logic start: Coords=${coordinates} City=${city} Country=${countryCode}`);

    // ─── FAST PATH: Section-specific request ─────────────────────────────────
    // When a specific section is requested, skip all external API discovery
    // (Wikidata/Overpass/transit-search) and use a single Gemini call.
    // This is both faster and more resilient to corporate proxy blocks.
    if (section) {
        console.log(`[ARRIVAL] Fast path: single Gemini call for section="${section}"`);

        // Check cache first
        const nearbyAirports = await discoverNearbyAirportsFallback(coordinates, 150);
        const mainAirport = nearbyAirports[0];
        const cached = await getCachedTransport(city, countryCode, mainAirport?.code);

        if (cached) {
            const hasRelevantCache =
                (section === 'plane' && cached.transport_info) ||
                (section === 'road' && cached.highway_info) ||
                (section === 'train' && cached.transport_info);

            if (hasRelevantCache) {
                console.log('[CACHE HIT] Using cached transport info');
                return buildResponseFromCache(cached, section);
            }
        }

        // Single Gemini call — fast, no external dependencies
        const result = await generateSectionFast(address, city, mainAirport, section);

        // Save to cache in background (don't await)
        if (mainAirport) {
            saveToCache(city, countryCode, mainAirport.code,
                section !== 'road' ? result : null,
                section === 'road' ? result : null
            ).catch(err => console.warn('[CACHE] Save failed:', err.message));
        }

        return result;
    }

    // ─── FULL PATH: No section specified (full generation) ───────────────────
    console.log('[ARRIVAL] Full path: discovering all nodes...');

    let nearbyAirports: any[] = [];
    let nearbyMetro: any[] = [];
    let parkingInfo = { has_regulated_parking: false, parking_zones: [] as any[] };

    // Run all discovery in parallel with individual timeouts
    const [airports, metro, parking] = await Promise.allSettled([
        discoverNearbyAirports(coordinates, 150).catch(() =>
            discoverNearbyAirportsFallback(coordinates, 150)
        ),
        discoverNearbyMetroStations(coordinates, 1000).catch(() => []),
        findNearbyParking(geo.lat, geo.lng, 500, address).catch(() =>
            ({ has_regulated_parking: false, parking_zones: [] })
        )
    ]);

    nearbyAirports = airports.status === 'fulfilled' ? airports.value : [];
    nearbyMetro = metro.status === 'fulfilled' ? metro.value : [];
    parkingInfo = parking.status === 'fulfilled' ? parking.value as any : { has_regulated_parking: false, parking_zones: [] };

    const mainStations = await discoverMainTrainStations(city, coordinates).catch(() => []);
    const mainAirport = nearbyAirports[0];

    // Grounding Intelligence with Cache
    console.log('[ARRIVAL] Researching transit logistics...');

    let airportsWithTransit: any[] = [];
    let highwayInfo = null;

    const cached = await getCachedTransport(city, countryCode, mainAirport?.code);

    if (cached?.transport_info) {
        console.log('[CACHE HIT] Using cached airport transport info');
        airportsWithTransit = cached.transport_info;
    } else {
        // GROUNDING OPTIMIZATION:
        // We no longer call Gemini for each airport here.
        // Instead, we pass the raw airport/station/parking data to the final 
        // generateArrivalJSON call, which uses a single grounded Gemini request.
        // This reduces latency by 10-15 seconds.
        airportsWithTransit = nearbyAirports.slice(0, 3);
    }

    if (cached?.highway_info) {
        console.log('[CACHE HIT] Using cached highway info');
        highwayInfo = cached.highway_info;
    } else {
        highwayInfo = await searchHighwayInformation(city, 'España');
        if (mainAirport) {
            await saveToCache(city, countryCode, mainAirport.code, null, highwayInfo);
        }
    }

    console.log('[ARRIVAL] Generating final structured JSON...');
    const finalResult = await generateArrivalJSON({
        address: geo.formattedAddress,
        city,
        airports: airportsWithTransit,
        mainStations,
        nearbyMetro,
        parkingInfo,
        highwayInfo: highwayInfo || { main_highways: [], notes: '' },
        section: undefined
    });

    console.log(`[ARRIVAL] Full path generated: ${JSON.stringify(finalResult).substring(0, 100)}...`);
    return finalResult;
}

// ─── Fast path: single Gemini call for one section ────────────────────────────
async function generateSectionFast(
    address: string,
    city: string,
    mainAirport: any,
    section: 'plane' | 'train' | 'road'
): Promise<any> {
    const sectionPrompts: Record<string, string> = {
        plane: `Eres un experto en transporte de ${city}, España.
DESTINO: ${address}
AEROPUERTO MÁS CERCANO: ${mainAirport ? `${mainAirport.name} (${mainAirport.code}), a ${mainAirport.distance_km} km` : `aeropuerto principal de ${city}`}

Genera instrucciones REALES y DETALLADAS de cómo llegar desde el aeropuerto al destino.
Incluye: metro/tren, autobús exprés, taxi/VTC con precios reales en €, duración.
Usa emojis temáticos (✈️, 🚇, 🚌, 🚕, 💰, ⏱️) y estructura con OPCIÓN A, OPCIÓN B, OPCIÓN C.

RESPONDE SOLO CON ESTE JSON:
{
  "access_info": {
    "from_airport": {
      "instructions": "Instrucciones detalladas con emojis y opciones A/B/C",
      "duration": "Tiempo estimado más frecuente",
      "price_range": "Rango de precio €"
    },
    "by_road": null,
    "from_train": null,
    "nearby_transport": [],
    "parking": null
  }
}`,

        train: `Eres un experto en transporte de ${city}, España.
DESTINO: ${address}

Genera instrucciones REALES de cómo llegar desde las principales estaciones de tren/AVE a este destino.
Incluye: metro desde la estación, taxi, autobús. Usa emojis (🚄, 🚇, 🚕, ⏱️, 💰).

RESPONDE SOLO CON ESTE JSON:
{
  "access_info": {
    "from_train": {
      "instructions": "Instrucciones detalladas con emojis desde estación principal",
      "duration": "Tiempo estimado",
      "price_range": "Precio/Tipo"
    },
    "from_airport": null,
    "by_road": null,
    "nearby_transport": [],
    "parking": null
  }
}`,

        road: `Eres un experto en acceso por carretera a ${city}, España.
DESTINO: ${address}

Genera información REAL sobre:
- Principales autopistas/autovías de acceso a ${city}
- Si hay peajes en la zona
- Zona de Bajas Emisiones (ZBE) o restricciones de tráfico
- Consejo de aparcamiento cerca del destino
Usa emojis (📍, 🚗, 🅿️, ⚠️).

RESPONDE SOLO CON ESTE JSON:
{
  "access_info": {
    "by_road": {
      "title": "📍 UBICACIÓN Y ACCESO EN COCHE",
      "instructions": "Instrucciones con autopistas, ZBE y parking"
    },
    "parking": {
      "info": "Info sobre zona regulada SER/ORA o parking libre cercano",
      "price": "Precio estimado o Gratis",
      "distance": "Distancia aproximada al destino"
    },
    "from_airport": null,
    "from_train": null,
    "nearby_transport": []
  }
}`
    };

    try {
        const { data } = await geminiREST('gemini-2.0-flash', sectionPrompts[section], {
            responseMimeType: 'application/json',
            temperature: 0.2
            // No useGrounding — faster without web search when we have good training data for Spain
        });
        console.log(`[ARRIVAL] Fast section "${section}" generated successfully`);
        return data || { access_info: null };
    } catch (error: any) {
        console.error('[ARRIVAL] Fast section generation failed:', error.message);
        return { access_info: null };
    }
}

function buildResponseFromCache(cached: any, section: string): any {
    if (section === 'plane' && cached.transport_info) {
        return {
            access_info: {
                from_airport: cached.transport_info?.from_airport || cached.transport_info,
                by_road: null, from_train: null, nearby_transport: [], parking: null
            }
        };
    }
    if (section === 'road' && cached.highway_info) {
        return {
            access_info: {
                by_road: cached.highway_info?.by_road || cached.highway_info,
                parking: cached.highway_info?.parking || null,
                from_airport: null, from_train: null, nearby_transport: []
            }
        };
    }
    if (section === 'train' && cached.transport_info) {
        return {
            access_info: {
                from_train: cached.transport_info?.from_train || cached.transport_info,
                from_airport: null, by_road: null, nearby_transport: [], parking: null
            }
        };
    }
    return { access_info: null };
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
async function getCachedTransport(city: string, countryCode: string, airportCode?: string) {
    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from('city_transport_cache')
            .select('*')
            .eq('city_name', city)
            .eq('country_code', countryCode)
            .eq('airport_code', airportCode || '')
            .gt('expires_at', new Date().toISOString())
            .maybeSingle();
        return data;
    } catch {
        return null;
    }
}

async function saveToCache(city: string, countryCode: string, airportCode: string, transport: any, highway: any) {
    try {
        const supabase = await createClient();
        const update: any = {
            city_name: city,
            country_code: countryCode,
            airport_code: airportCode,
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        };
        if (transport) update.transport_info = transport;
        if (highway) update.highway_info = highway;
        await supabase.from('city_transport_cache').upsert(update, {
            onConflict: 'city_name,country_code,airport_code'
        });
    } catch (err: any) {
        console.warn('[CACHE] Save error:', err.message);
    }
}

// ─── Full path: multi-source JSON generation ──────────────────────────────────
async function generateArrivalJSON(context: any) {
    const prompt = `Actúa como un Recepcionista TOP de Apartamentos de Lujo. Genera la "Guía de Acceso Maestra" en formato JSON.
    
📍 **UBICACIÓN DESTINO:** ${context.address}

---
### DATOS FÍSICOS:

**AEROPUERTOS:**
${context.airports.map((a: any) => `- ${a.name} (${a.code}) a ${a.distance_km} km. Logística: ${JSON.stringify(a.transport)}`).join('\n') || 'No disponible'}

**ESTACIONES DE TREN:**
${context.mainStations.map((s: any) => `- ${s.name} (${s.distance_km} km)`).join('\n') || 'No disponible'}

**METRO/BUS CERCANO:**
${context.nearbyMetro.map((m: any) => `- ${m.name} (${m.distance_m}m) - Líneas: ${m.lines?.join(', ') || 'N/A'}`).join('\n') || 'No disponible'}

**CARRETERAS:**
- Autopistas: ${context.highwayInfo?.main_highways?.join(', ') || 'N/A'}
- Peajes: ${context.highwayInfo?.tolls ? 'Sí' : 'No'}
- Zonas Bajas Emisiones: ${context.highwayInfo?.congestion_zones ? 'Sí' : 'No'}

**PARKING:**
- Regulado: ${context.parkingInfo.has_regulated_parking ? 'Sí' : 'No'}
- Cercanos: ${context.parkingInfo.parking_zones.slice(0, 2).map((p: any) => p.name).join(', ') || 'N/A'}

---
🎨 **FORMATO:** Usa emojis (✈️, 🚇, 🚌, 🚕, 📍, 💰, ⏱️). Estructura rutas como "OPCIÓN A / B / C".

🎯 **JSON OBLIGATORIO:**
{
  "access_info": {
    "by_road": { "title": "📍 UBICACIÓN Y ACCESO", "instructions": "..." },
    "from_airport": { "instructions": "...", "duration": "...", "price_range": "..." },
    "from_train": { "instructions": "...", "duration": "...", "price_range": "..." },
    "nearby_transport": [{ "type": "Bus/Metro/Tren", "name": "...", "distance": "X min andando" }],
    "parking": { "info": "...", "price": "...", "distance": "..." }
  }
}

RESPONDE ÚNICAMENTE CON EL JSON VÁLIDO.`;

    const { data } = await geminiREST('gemini-2.0-flash', prompt, {
        responseMimeType: 'application/json',
        temperature: 0.1,
        useGrounding: true // Unified grounding for all discovered nodes
    });


    return data || { access_info: null };
}