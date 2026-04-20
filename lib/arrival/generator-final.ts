import { geocodeAddress, GeocodingResult } from '../geocoding';
import { geminiREST } from '../ai/clients/gemini-rest';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

function getSupabase() {
    return createSupabaseAdmin(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

/**
 * Arrival instructions generator — v4 (fully dynamic, no static lists)
 *
 * ARCHITECTURE:
 * - Airports:  Google Places nearbysearch type=airport (~300ms) — no static list
 * - Stations:  Google Places nearbysearch type=train_station (~300ms)
 * - Parking:   Google Places nearbysearch type=parking (~300ms)
 * - All in parallel + 1 Gemini call with the context
 * - Total: ~4-6s
 */

// ─── Google Places helpers ────────────────────────────────────────────────────

// Keywords that identify a real commercial airport
const AIRPORT_KEYWORDS = [
    'aeropuerto', 'airport', 'aéroport', 'flughafen', 'internacional', 'international'
];
// Keywords that disqualify a result
const AIRPORT_BLACKLIST = [
    'aeroclub', 'aeromodelismo', 'helipuerto', 'helipad', 'heliport',
    'transfer', 'taxi', 'shuttle', 'traslado', 'vliegveld',
    // Private airfields, training centers, military
    'cuatro vientos', 'escuela', 'cae ', 'aeródromo', 'aerodromo',
    'base aérea', 'base aerea', 'military', 'privado', 'ultraligero',
    'paracaidismo', 'skydive', 'gliding', 'vuelo', 'flying club'
];
// Regex to detect IATA code in name e.g. "Aeropuerto de Almería (LEI)"
const IATA_REGEX = /\b([A-Z]{3})\b/;

function isCommercialAirport(name: string): boolean {
    const lower = name.toLowerCase();
    if (AIRPORT_BLACKLIST.some(kw => lower.includes(kw))) return false;
    if (AIRPORT_KEYWORDS.some(kw => lower.includes(kw))) return true;
    if (IATA_REGEX.test(name)) return true;
    return false;
}

async function findNearestAirports(lat: number, lng: number, placesKey: string) {
    try {
        // Use radius (200km) instead of rankby=distance so we can filter properly
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
            `?location=${lat},${lng}&radius=200000&type=airport&language=es&key=${placesKey}`;
        const res = await fetch(url);
        const data = await res.json();

        const commercial = (data.results || [])
            .filter((p: any) => isCommercialAirport(p.name))
            .map((p: any) => {
                const aLat = p.geometry.location.lat;
                const aLng = p.geometry.location.lng;
                return {
                    name: p.name,
                    code: extractIATA(p.name) || '',
                    city: p.vicinity || '',
                    distance_km: Math.round(haversineKm(lat, lng, aLat, aLng)),
                    place_id: p.place_id
                };
            })
            .sort((a: any, b: any) => a.distance_km - b.distance_km)
            .slice(0, 3);

        if (commercial.length > 0) {
            console.log(`[PLACES] Found ${commercial.length} commercial airports: ${commercial.map((a: any) => `${a.name} (${a.distance_km}km)`).join(', ')}`);
            return commercial;
        }

        // Fallback: ask Gemini — it knows commercial airports near any location
        console.log('[PLACES] No commercial airports found via Places — using Gemini fallback');
        return await findAirportsViaGemini(lat, lng);

    } catch (e: any) {
        console.warn('[PLACES] Airport search failed:', e.message);
        return await findAirportsViaGemini(lat, lng);
    }
}

async function findAirportsViaGemini(lat: number, lng: number) {
    try {
        const { data } = await geminiREST('gemini-2.0-flash',
            `Cuáles son los aeropuertos comerciales (con vuelos regulares nacionales o internacionales) más cercanos a las coordenadas ${lat}, ${lng} en España?
Devuelve SOLO JSON con los 3 más cercanos:
{
  "airports": [
    { "name": "Nombre oficial del aeropuerto", "code": "IATA", "city": "Ciudad", "distance_km": 90 }
  ]
}`,
            { responseMimeType: 'application/json', temperature: 0 }
        );
        const airports = data?.airports || [];
        console.log(`[GEMINI] Found ${airports.length} airports: ${airports.map((a: any) => `${a.code} (${a.distance_km}km)`).join(', ')}`);
        return airports;
    } catch (e: any) {
        console.warn('[GEMINI] Airport fallback failed:', e.message);
        return [];
    }
}

// Extract IATA code from airport name e.g. "Aeropuerto de Almería (LEI)" → "LEI"
function extractIATA(name: string): string {
    const match = name.match(/\(([A-Z]{3})\)/);
    return match ? match[1] : '';
}

// Haversine distance in km
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function findNearestTrainStation(lat: number, lng: number, placesKey: string) {
    try {
        // Always fetch both in parallel — bus stations are as important as train stations
        const [trainRes, busRes] = await Promise.all([
            fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=train_station&language=es&key=${placesKey}`),
            fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&rankby=distance&type=bus_station&language=es&key=${placesKey}`)
        ]);
        const [trainData, busData] = await Promise.all([trainRes.json(), busRes.json()]);

        const trainStations = (trainData.results || []).slice(0, 3).map((p: any) => ({
            name: p.name,
            address: p.vicinity,
            type: 'train' as const,
            place_id: p.place_id
        }));

        const busStations = (busData.results || []).slice(0, 3).map((p: any) => ({
            name: p.name,
            address: p.vicinity,
            type: 'bus' as const,
            place_id: p.place_id
        }));

        console.log(`[PLACES] Train stations: ${trainStations.length}, Bus stations: ${busStations.length}`);
        return { trainStations, busStations };
    } catch (e: any) {
        console.warn('[PLACES] Train/bus station search failed:', e.message);
        return { trainStations: [], busStations: [] };
    }
}

async function findNearbyParking(lat: number, lng: number, placesKey: string) {
    try {
        const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
            `?location=${lat},${lng}&rankby=distance&type=parking&language=es&key=${placesKey}`;
        const res = await fetch(url);
        const data = await res.json();

        const PARKING_BLACKLIST = [
            'estación', 'station', 'tren', 'ave', 'renfe', 'aeropuerto', 'airport',
            'hotel', 'unnamed', 'sin nombre', 'restaurante', 'supermercado'
        ];
        const PARKING_KEYWORDS = [
            'parking', 'aparcamiento', 'garaje', 'garage', 'park'
        ];

        const filtered = (data.results || [])
            .filter((p: any) => {
                const lower = (p.name || '').toLowerCase();
                if (PARKING_BLACKLIST.some(kw => lower.includes(kw))) return false;
                if (!p.name || p.name.length < 4) return false;
                return true;
            })
            .map((p: any) => {
                const pLat = p.geometry?.location?.lat;
                const pLng = p.geometry?.location?.lng;
                const distance_m = (pLat && pLng)
                    ? Math.round(haversineKm(lat, lng, pLat, pLng) * 1000)
                    : null;
                const walk_min = distance_m ? Math.round(distance_m / 80) : null; // ~80m/min walking pace
                return {
                    name: p.name,
                    address: p.vicinity,
                    place_id: p.place_id,
                    rating: p.rating || null,
                    distance_m,
                    walk_min
                };
            })
            // Sort by distance ascending (already rankby=distance, but explicit)
            .sort((a: any, b: any) => (a.distance_m ?? 9999) - (b.distance_m ?? 9999))
            // Only keep parkings within 800m — beyond that it's not useful to name them
            .filter((p: any) => p.distance_m === null || p.distance_m <= 800)
            // Prioritize ones with "parking/aparcamiento" in name
            .sort((a: any, b: any) => {
                const aIsParking = PARKING_KEYWORDS.some(kw => (a.name || '').toLowerCase().includes(kw));
                const bIsParking = PARKING_KEYWORDS.some(kw => (b.name || '').toLowerCase().includes(kw));
                if (aIsParking && !bIsParking) return -1;
                if (!aIsParking && bIsParking) return 1;
                return (a.distance_m ?? 9999) - (b.distance_m ?? 9999);
            })
            .slice(0, 4);

        console.log(`[PLACES] Parking: ${filtered.length} results within 800m`);
        return filtered;
    } catch (e: any) {
        console.warn('[PLACES] Parking search failed:', e.message);
        return [];
    }
}

// ─── Parking context builder ──────────────────────────────────────────────────

function buildParkingContext(
    propertyParking: { has_parking: boolean; parking_number?: string } | undefined,
    nearbySpots: any[]
): string {
    const lines: string[] = [];

    // Segment parkings by walkability
    const close = nearbySpots.filter(p => p.distance_m !== null && p.distance_m <= 400);   // <5 min
    const medium = nearbySpots.filter(p => p.distance_m !== null && p.distance_m > 400 && p.distance_m <= 800); // 5-10 min
    const hasAny = nearbySpots.length > 0;

    if (propertyParking?.has_parking) {
        const spot = propertyParking.parking_number?.trim();
        lines.push(`✅ LA PROPIEDAD TIENE PLAZA DE PARKING PROPIA${spot ? ` — ${spot}` : ''}.`);
        lines.push('   1. Menciona primero la plaza propia de forma clara y destacada.');
        lines.push('   2. Indica si la zona permite aparcar libremente en la calle (zona blanca/libre) o si es zona regulada (SER/ORA/zona azul/verde).');
        lines.push('   3. Recomienda los parkings cercanos SOLO para huéspedes con más de un vehículo.');
    } else {
        lines.push('❌ La propiedad NO tiene plaza de parking propia.');
        lines.push('   Informa sobre zona regulada o libre en el barrio. Los parkings cercanos son la opción principal.');
    }

    lines.push('');

    if (close.length > 0) {
        lines.push('Parkings a menos de 5 min andando (recomendar por nombre):');
        close.forEach(p => lines.push(`- ${p.name} (${p.address}) — ${p.walk_min} min andando`));
    }

    if (medium.length > 0) {
        lines.push('Parkings a 5-10 min andando (mencionar con la distancia):');
        medium.forEach(p => lines.push(`- ${p.name} (${p.address}) — ${p.walk_min} min andando`));
    }

    if (!hasAny) {
        lines.push('No se encontraron parkings públicos a menos de 800m — describe si la zona es de estacionamiento libre o regulado y sugiere usar Google Maps para encontrar parking.');
    } else if (close.length === 0 && medium.length === 0) {
        // All were filtered out — shouldn't happen but safety net
        lines.push('No hay parkings públicos verificados en un radio caminable. Indica que pueden buscar en Google Maps.');
    }

    return lines.join('\n');
}

// ─── Main orchestrator ────────────────────────────────────────────────────────

export async function generateArrivalInstructions(
    address: string,
    section?: 'plane' | 'train' | 'road',
    manualGeo?: GeocodingResult,
    propertyParking?: { has_parking: boolean; parking_number?: string }
) {
    console.log('[ARRIVAL] Starting generation for:', address, section ? `(Section: ${section})` : '');

    const geoT0 = Date.now();
    const geo = manualGeo || await geocodeAddress(address);
    console.log(`[PERF][generator] Geocoding: ${Date.now() - geoT0}ms`);

    if (!geo) throw new Error('No se pudo geocodificar la dirección');

    const { lat, lng } = geo;
    const city = geo.city || '';
    const countryCode = geo.countryCode || 'ES';
    console.log(`[ARRIVAL] Coords=${lat},${lng} City=${city} Country=${countryCode}`);

    const placesKey = process.env.GOOGLE_PLACES_API_KEY || '';

    // ─── FAST PATH: section-specific ─────────────────────────────────────────
    if (section) {
        console.log(`[ARRIVAL] Fast path for section="${section}"`);

        // Cache check
        const airports = await findNearestAirports(lat, lng, placesKey);
        const mainAirport = airports[0];
        const cached = await getCachedTransport(city, countryCode, mainAirport?.code);

        if (cached) {
            const hit =
                (section === 'plane' && cached.transport_info) ||
                (section === 'road' && cached.highway_info) ||
                (section === 'train' && cached.transport_info);
            if (hit) {
                console.log('[CACHE HIT] Using cached transport info');
                return buildResponseFromCache(cached, section);
            }
        }

        // Fetch only the data needed for this section in parallel
        const t0 = Date.now();
        const [trainResult, parkingSpots] = await Promise.all([
            section === 'train' ? findNearestTrainStation(lat, lng, placesKey) : Promise.resolve({ trainStations: [], busStations: [] }),
            section === 'road' ? findNearbyParking(lat, lng, placesKey) : Promise.resolve([]),
        ]);
        const { trainStations, busStations } = trainResult as { trainStations: any[], busStations: any[] };
        console.log(`[PERF][generator] Fast path Places lookup: ${Date.now() - t0}ms`);

        const geminiT0 = Date.now();
        const result = await generateSectionFast({
            address, city, mainAirport, airports, section, trainStations, busStations, parkingSpots, propertyParking
        });
        console.log(`[PERF][generator] Fast path Gemini: ${Date.now() - geminiT0}ms`);

        if (mainAirport) {
            saveToCache(city, countryCode, mainAirport.code,
                section !== 'road' ? result : null,
                section === 'road' ? result : null
            ).catch(err => console.warn('[CACHE] Save failed:', err.message));
        }

        return result;
    }

    // ─── FULL PATH ────────────────────────────────────────────────────────────
    console.log('[ARRIVAL] Full path: parallel discovery...');

    const discT0 = Date.now();
    const [airportsResult, trainResult, parkingResult] = await Promise.all([
        findNearestAirports(lat, lng, placesKey),
        findNearestTrainStation(lat, lng, placesKey),
        findNearbyParking(lat, lng, placesKey),
    ]);
    const { trainStations, busStations } = trainResult;
    console.log(`[PERF][generator] All discovery (parallel): ${Date.now() - discT0}ms`);

    const mainAirport = airportsResult[0] || null;

    // Cache check for highway info
    const cached = await getCachedTransport(city, countryCode, mainAirport?.code);
    const airportsWithTransit = cached?.transport_info || airportsResult.slice(0, 3);

    console.log('[ARRIVAL] Generating final JSON...');
    const finalT0 = Date.now();
    const finalResult = await generateArrivalJSON({
        address: geo.formattedAddress,
        city,
        airports: airportsWithTransit,
        trainStations,
        busStations,
        parkingSpots: parkingResult,
        propertyParking,
    });
    console.log(`[PERF][generator] Final JSON generation: ${Date.now() - finalT0}ms`);
    console.log(`[ARRIVAL] Done: ${JSON.stringify(finalResult).substring(0, 100)}...`);

    return finalResult;
}

// ─── Fast path: single Gemini call for one section ────────────────────────────
async function generateSectionFast(ctx: {
    address: string;
    city: string;
    mainAirport: any;
    airports: any[];
    section: 'plane' | 'train' | 'road';
    trainStations: any[];
    busStations: any[];
    parkingSpots: any[];
    propertyParking?: { has_parking: boolean; parking_number?: string };
}): Promise<any> {
    const { address, city, mainAirport, airports, section, trainStations, busStations, parkingSpots, propertyParking } = ctx;

    // Build parking context string for the prompt
    const parkingContext = buildParkingContext(propertyParking, parkingSpots);

    const sectionPrompts: Record<string, string> = {
        plane: `Eres un experto en transporte de ${city}, España.
DESTINO: ${address}
AEROPUERTOS CERCANOS:
${airports.length
                ? airports.map((a: any) => `- ${a.name} (${a.code}) a ${a.distance_km} km`).join('\n')
                : mainAirport
                    ? `- ${mainAirport.name} (${mainAirport.code}) a ${mainAirport.distance_km} km`
                    : `- Aeropuerto principal de ${city}`}

Para el aeropuerto MÁS CERCANO, genera instrucciones detalladas con OPCIÓN A, B y C (transporte público, taxi/VTC, alquiler de coche) con precios reales en € y tiempos.
Para el resto de aeropuertos de la lista, menciona brevemente distancia y opciones principales.
Usa emojis (✈️, 🚇, 🚌, 🚕, 💰, ⏱️).

RESPONDE SOLO CON ESTE JSON:
{
  "access_info": {
    "from_airport": {
      "instructions": "Instrucciones detalladas cubriendo todos los aeropuertos",
      "duration": "Tiempo estimado aeropuerto principal",
      "price_range": "Rango € aeropuerto principal"
    },
    "by_road": null, "from_train": null, "nearby_transport": [], "parking": null
  }
}`,

        train: `Eres un experto en transporte público de larga distancia en España.
DESTINO: ${address} (${city})

ESTACIONES DE TREN CERCANAS (Google Places):
${trainStations.length
                ? trainStations.map(s => `- ${s.name} (${s.address})`).join('\n')
                : `- Sin estaciones de tren identificadas cerca de ${city}`}

ESTACIONES DE AUTOBÚS CERCANAS (Google Places):
${busStations.length
                ? busStations.map(s => `- ${s.name} (${s.address})`).join('\n')
                : `- Sin estaciones de autobús identificadas cerca de ${city}`}

REGLA CRÍTICA: debes rellenar los TRES campos del JSON obligatoriamente. No dejes ninguno vacío.

Campo 1 — "train_ld": Bloque 🚄 TREN LARGA DISTANCIA
- Estaciones hub con AVE/Larga Distancia más cercanas (no cercanías locales).
- Ciudades con conexión directa y tiempo aproximado.
- Si no hay AVE, indícalo honestamente y sugiere la mejor alternativa ferroviaria.

Campo 2 — "bus_interurban": Bloque 🚌 AUTOBÚS INTERURBANO  
- Estación de autobuses hub más cercana.
- Compañías que operan (ALSA, Avanza, FlixBus, etc.) y principales ciudades de origen.
- NO inventes horarios ni precios exactos — remite a alsa.es o flixbus.es para consultar.

Campo 3 — "last_mile": Bloque 🚕 ÚLTIMO TRAMO desde estación/terminal hasta la propiedad
- Opciones reales: taxi/VTC, metro/bus urbano, alquiler de coche. Precios orientativos en € y tiempos.

RESPONDE SOLO CON ESTE JSON (los tres campos son OBLIGATORIOS):
{
  "access_info": {
    "from_train": {
      "train_ld": "🚄 Bloque tren larga distancia con hubs y conexiones",
      "bus_interurban": "🚌 Bloque autobús interurbano con estación hub, compañías y ciudades de origen",
      "last_mile": "🚕 Bloque último tramo con opciones, precios y tiempos",
      "duration": "Tiempo total desde hub más cercana hasta propiedad",
      "price_range": "Rango orientativo transporte + último tramo"
    },
    "from_airport": null, "by_road": null, "nearby_transport": [], "parking": null
  }
}`,

        road: `Eres un experto en acceso por carretera y aparcamiento en ${city}, España.
DESTINO: ${address}

INFORMACIÓN DE PARKING:
${parkingContext}

Genera información REAL sobre:
- Cómo llegar en coche (autopistas/autovías principales de acceso a ${city})
- Si hay peajes en la ruta
- Si hay Zona de Bajas Emisiones (ZBE) u otras restricciones de tráfico
- Aparcamiento: usa la información de parking de arriba como base. Si la propiedad tiene plaza propia, menciónala primero y de forma destacada. Si no tiene, informa sobre zona regulada (SER/ORA/zona azul/libre) y parkings cercanos de la lista.
Usa emojis (📍, 🚗, 🅿️, ⚠️, 💰).

RESPONDE SOLO CON ESTE JSON:
{
  "access_info": {
    "by_road": {
      "title": "📍 LLEGADA EN COCHE",
      "instructions": "Instrucciones con autopistas, ZBE y acceso a la propiedad"
    },
    "parking": {
      "info": "Descripción del parking — primero el propio si existe, luego zona y alternativas cercanas",
      "price": "Precio estimado o 'Incluido' si es plaza propia",
      "distance": "'En la propiedad' si tiene plaza propia, o distancia aproximada si es externo",
      "nearby_options": ["Parking 1", "Parking 2"]
    },
    "from_airport": null, "from_train": null, "nearby_transport": []
  }
}`
    };

    try {
        const { data } = await geminiREST('gemini-2.0-flash', sectionPrompts[section], {
            responseMimeType: 'application/json',
            temperature: 0.2
        });
        console.log(`[ARRIVAL] Fast section "${section}" generated`);
        return data || { access_info: null };
    } catch (error: any) {
        console.error('[ARRIVAL] Fast section failed:', error.message);
        return { access_info: null };
    }
}

// ─── Full path: unified Gemini call ──────────────────────────────────────────
async function generateArrivalJSON(ctx: {
    address: string;
    city: string;
    airports: any[];
    trainStations: any[];
    busStations: any[];
    parkingSpots: any[];
    propertyParking?: { has_parking: boolean; parking_number?: string };
}) {
    const { address, city, airports, trainStations, busStations, parkingSpots, propertyParking } = ctx;
    const parkingContext = buildParkingContext(propertyParking, parkingSpots);

    const prompt = `Actúa como un Recepcionista TOP de Apartamentos de Lujo en ${city}.
Genera la "Guía de Acceso" para huéspedes que llegan a esta propiedad.

📍 DESTINO: ${address}

---
DATOS VERIFICADOS (Google Places + base de conocimiento):

✈️ AEROPUERTOS CERCANOS:
${airports.length
            ? airports.map((a: any) => `- ${a.name} (${a.code}) a ${a.distance_km} km`).join('\n')
            : `- Aeropuerto principal de ${city}`}

🚄 ESTACIONES DE TREN CERCANAS:
${trainStations.length
            ? trainStations.map((s: any) => `- ${s.name} (${s.address})`).join('\n')
            : `- Sin estaciones de tren identificadas cerca de ${city}`}

🚌 ESTACIONES DE AUTOBÚS CERCANAS:
${busStations.length
            ? busStations.map((s: any) => `- ${s.name} (${s.address})`).join('\n')
            : `- Sin estaciones de autobús identificadas cerca de ${city}`}

🅿️ PARKING:
${parkingContext}

---
INSTRUCCIONES:
1. AVIÓN — aeropuerto principal (el más cercano):
   - Da instrucciones detalladas con Opción A, B y C (transporte público, taxi/VTC, alquiler de coche), precios en € y tiempos reales.
   - En "main_airport_name" pon el nombre oficial del aeropuerto principal.
   - En "other_airports" incluye los demás aeropuertos de la lista, cada uno con nombre, código IATA, distancia en km y 1 frase de opciones principales.
2. TRANSPORTE PÚBLICO DE LARGA DISTANCIA — tres bloques dentro de from_train:
   - 🚄 TREN: Estaciones hub con AVE/Larga Distancia más cercanas. Conexiones desde Madrid, Barcelona y otras ciudades principales. Si no hay AVE, indícalo honestamente.
   - 🚌 AUTOBÚS INTERURBANO: Estación de autobuses hub más cercana. Compañías que operan (ALSA, Avanza, etc.) y ciudades con conexión. NO inventes horarios ni precios exactos — remite a alsa.es o web de la compañía.
   - 🚕 ÚLTIMO TRAMO: Desde las estaciones locales de arriba hasta la propiedad. Taxi, bus urbano, alquiler de coche con precios orientativos y tiempos.
3. COCHE: Autopistas de acceso a ${city}, peajes, ZBE si aplica.
   - PARKING: Si la propiedad tiene plaza propia, menciónala primero y de forma destacada. Si no, informa sobre zona regulada y parkings cercanos.

Usa emojis temáticos. Sé específico con nombres reales de calles, líneas, precios.

JSON OBLIGATORIO (sin texto adicional):
{
  "access_info": {
    "from_airport": {
      "main_airport_name": "Nombre oficial del aeropuerto principal",
      "instructions": "Instrucciones detalladas solo del aeropuerto principal con Opción A/B/C",
      "duration": "...",
      "price_range": "...",
      "other_airports": [
        { "name": "Nombre", "code": "IATA", "distance_km": 125, "options": "Alquiler de coche o taxi directo" }
      ]
    },
    "from_train": {
      "train_ld": "🚄 Tren larga distancia: hubs AVE/LD más cercanos, ciudades con conexión directa y tiempos",
      "bus_interurban": "🚌 Autobús interurbano: estación hub más cercana, compañías (ALSA/Avanza/FlixBus) y ciudades de origen. Remitir a alsa.es para horarios",
      "last_mile": "🚕 Último tramo desde estación/terminal hasta propiedad: taxi, metro/bus urbano, alquiler de coche con precios y tiempos",
      "duration": "Tiempo total desde hub más cercana hasta propiedad",
      "price_range": "Rango orientativo transporte + último tramo"
    },
    "by_road": {
      "title": "📍 LLEGADA EN COCHE",
      "instructions": "..."
    },
    "parking": {
      "info": "Parking propio si existe (con número/ubicación), luego zona y alternativas",
      "price": "'Incluido' si es plaza propia, o precio estimado si es externo",
      "distance": "'En la propiedad' si tiene plaza propia, o distancia si es externo",
      "nearby_options": ["..."]
    },
    "nearby_transport": [
      { "type": "Bus/Tren/Metro", "name": "...", "distance": "X min andando" }
    ]
  }
}`;

    const { data } = await geminiREST('gemini-2.0-flash', prompt, {
        responseMimeType: 'application/json',
        temperature: 0.1
        // No useGrounding — context already injected above
    });

    return data || { access_info: null };
}

// ─── Cache helpers ────────────────────────────────────────────────────────────
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

async function getCachedTransport(city: string, countryCode: string, airportCode?: string) {
    try {
        const supabase = getSupabase();
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
        const supabase = getSupabase();
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