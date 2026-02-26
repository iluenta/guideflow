import axios from 'axios';

/**
 * OpenStreetMap nodes discovery utility using Overpass API
 * Optimized: short timeouts + Gemini fallback when proxy blocks external APIs
 */

export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3;
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

// ─── Mirrors ordered by reliability ──────────────────────────────────────────
const MIRRORS = [
    'https://overpass-api.de/api/interpreter',
    'https://lz4.overpass-api.de/api/interpreter',
    'https://z.overpass-api.de/api/interpreter',
    'https://overpass.kumi.systems/api/interpreter'
];

// ─── Core retry logic: 2 attempts max, 5s timeout, 800ms delay ───────────────
async function retryOverpass<T>(
    query: string,
    transform: (elements: any[]) => T,
    fallback: T,
    maxAttempts: number = 2    // Was 3 — reduced to fail fast
): Promise<T> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const mirrorUrl = MIRRORS[attempt % MIRRORS.length];
        try {
            const response = await axios.post(
                mirrorUrl,
                `data=${encodeURIComponent(query)}`,
                {
                    timeout: 5000,  // Was 30000 — reduced to 5s to fail fast
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
                }
            );
            return transform(response.data.elements || []);
        } catch (error: any) {
            const isRetryable =
                error.code === 'ECONNABORTED' ||
                [503, 504, 429].includes(error.response?.status);

            if (isRetryable && attempt < maxAttempts - 1) {
                const delay = 800; // Was attempt*1000 — fixed short delay
                console.warn(`[OVERPASS] Error ${error.response?.status || error.code} on ${mirrorUrl}. Retrying in ${delay}ms... (Attempt ${attempt + 1}/${maxAttempts})`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            console.warn(`[OVERPASS] All attempts failed, using fallback. Last error: ${error.message}`);
            return fallback;
        }
    }
    return fallback;
}

// ─── Gemini fallback: generates realistic station/parking data via AI ─────────
async function geminiLocationFallback(
    type: 'stations' | 'parking',
    lat: number,
    lon: number,
    address: string
): Promise<any> {
    try {
        const { GoogleGenerativeAI } = await import('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
        const model = genAI.getGenerativeModel({
            model: 'gemini-2.0-flash',
            generationConfig: { responseMimeType: 'application/json', temperature: 0.1 }
        });

        let prompt = '';

        if (type === 'stations') {
            prompt = `Eres un experto en transporte urbano de Madrid y España.
UBICACIÓN: ${address} (lat: ${lat}, lon: ${lon})

Genera una lista REAL de estaciones de metro, cercanías o tren más cercanas a esta ubicación.
Usa solo estaciones que realmente existen en Madrid.

RESPONDE SOLO JSON:
{
  "stations": [
    {
      "name": "Nombre real de la estación",
      "type": "metro|train",
      "distance_m": 350,
      "lines": ["L1", "L2"]
    }
  ]
}`;
        } else {
            prompt = `Eres un experto en aparcamiento urbano de Madrid y España.
UBICACIÓN: ${address} (lat: ${lat}, lon: ${lon})

Indica si hay zona de estacionamiento regulado (ORA/SER/zona azul/zona verde) en esta zona
y describe brevemente las opciones de parking más cercanas.

RESPONDE SOLO JSON:
{
  "has_regulated_parking": true,
  "parking_zones": [
    {
      "name": "Nombre o descripción",
      "type": "underground|surface|street",
      "fee": "yes|no|unknown",
      "distance_m": 200
    }
  ],
  "regulated_info": "Descripción del tipo de regulación en la zona (ORA, SER, zona azul, etc.)"
}`;
        }

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        const parsed = JSON.parse(text);

        console.log(`[OVERPASS-FALLBACK] Gemini generated ${type} data for ${address}`);

        if (type === 'stations') {
            return (parsed.stations || []).map((s: any) => ({
                name: s.name,
                type: s.type || 'metro',
                lat,
                lon,
                distance_m: s.distance_m || 500,
                lines: s.lines || []
            }));
        } else {
            return {
                has_regulated_parking: parsed.has_regulated_parking ?? true,
                parking_zones: parsed.parking_zones || [],
                regulated_info: parsed.regulated_info || '',
                source: 'ai_fallback'
            };
        }
    } catch (err: any) {
        console.error('[OVERPASS-FALLBACK] Gemini fallback failed:', err.message);
        return type === 'stations' ? [] : { has_regulated_parking: false, parking_zones: [] };
    }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function findNearbyStations(
    lat: number,
    lon: number,
    radius: number = 2000,
    address?: string
) {
    const query = `
        [out:json][timeout:10];
        (
          node["railway"="station"](around:${radius},${lat},${lon});
          node["railway"="halt"](around:${radius},${lat},${lon});
          node["railway"="subway_entrance"](around:${radius},${lat},${lon});
          way["railway"="station"](around:${radius},${lat},${lon});
        );
        out body;
        >;
        out skel qt;
    `;

    const result = await retryOverpass(query, (elements) => {
        return elements
            .filter((e: any) => e.type === 'node')
            .map((e: any) => ({
                name: e.tags?.name || 'Estación sin nombre',
                type: (e.tags?.railway === 'subway_entrance' || e.tags?.station === 'subway' || e.tags?.subway === 'yes') ? 'metro' : 'train',
                lat: e.lat,
                lon: e.lon,
                distance_m: Math.round(getDistanceMeters(lat, lon, e.lat, e.lon)),
                lines: e.tags?.route_ref?.split(';') || []
            }))
            .sort((a: any, b: any) => a.distance_m - b.distance_m);
    }, null); // null = trigger fallback

    // If Overpass returned nothing or failed, use Gemini
    if (!result || (Array.isArray(result) && result.length === 0)) {
        console.log('[OVERPASS] No stations found via Overpass, using Gemini fallback...');
        return geminiLocationFallback('stations', lat, lon, address || `${lat},${lon}`);
    }

    return result;
}

export async function findNearbyParking(
    lat: number,
    lon: number,
    radius: number = 500,
    address?: string
) {
    const query = `
        [out:json][timeout:10];
        (
          node["amenity"="parking"](around:${radius},${lat},${lon});
          way["amenity"="parking"](around:${radius},${lat},${lon});
          relation["amenity"="parking"](around:${radius},${lat},${lon});
        );
        out center;
    `;

    const result = await retryOverpass(query, (elements) => {
        const parking_zones = elements.map((e: any) => ({
            name: e.tags?.name || 'Parking Público',
            type: e.tags?.parking || 'surface',
            fee: e.tags?.fee || 'unknown',
            lat: e.center?.lat || e.lat,
            lon: e.center?.lon || e.lon,
            distance_m: Math.round(getDistanceMeters(lat, lon, e.center?.lat || e.lat, e.center?.lon || e.lon))
        }));

        return {
            has_regulated_parking: parking_zones.some((p: any) => p.fee === 'yes'),
            parking_zones: parking_zones.sort((a: any, b: any) => a.distance_m - b.distance_m)
        };
    }, null); // null = trigger fallback

    // If Overpass failed, use Gemini
    if (!result) {
        console.log('[OVERPASS] Parking query failed via Overpass, using Gemini fallback...');
        return geminiLocationFallback('parking', lat, lon, address || `${lat},${lon}`);
    }

    return result;
}