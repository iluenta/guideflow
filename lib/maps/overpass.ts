import axios from 'axios';

/**
 * OpenStreetMap nodes discovery utility using Overpass API
 */

const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Calculates distance between two points in meters
 */
export function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // metres
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

/**
 * Finds railway stations or metro stops near coordinates
 */
export async function findNearbyStations(lat: number, lon: number, radius: number = 2000) {
    const query = `
        [out:json][timeout:25];
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

    return retryOverpass(query, (elements) => {
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
    }, []);
}

/**
 * Finds parking areas near coordinates
 */
export async function findNearbyParking(lat: number, lon: number, radius: number = 500) {
    const query = `
        [out:json][timeout:25];
        (
          node["amenity"="parking"](around:${radius},${lat},${lon});
          way["amenity"="parking"](around:${radius},${lat},${lon});
          relation["amenity"="parking"](around:${radius},${lat},${lon});
        );
        out center;
    `;

    return retryOverpass(query, (elements) => {
        const parking_zones = elements.map((e: any) => ({
            name: e.tags?.name || 'Parking Público',
            type: e.tags?.parking || 'surface',
            fee: e.tags?.fee || 'unknown',
            lat: e.center?.lat || e.lat,
            lon: e.center?.lon || e.lon,
            distance_m: Math.round(getDistanceMeters(lat, lon, e.center?.lat || e.lat, e.center?.lon || e.lon))
        }));

        const has_regulated_parking = parking_zones.some((p: any) => p.fee === 'yes');

        return {
            has_regulated_parking,
            parking_zones: parking_zones.sort((a: any, b: any) => a.distance_m - b.distance_m)
        };
    }, { has_regulated_parking: false, parking_zones: [] });
}

async function retryOverpass(query: string, transform: (elements: any[]) => any, fallback: any, retries: number = 2) {
    let attempt = 0;
    while (attempt <= retries) {
        try {
            const response = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(query)}`, {
                timeout: 30000,
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return transform(response.data.elements || []);
        } catch (error: any) {
            const isTimeout = error.code === 'ECONNABORTED' || error.response?.status === 504 || error.response?.status === 429;
            if (isTimeout && attempt < retries) {
                attempt++;
                const delay = attempt * 1500;
                console.warn(`[OVERPASS] Error ${error.response?.status || error.code}. Retrying in ${delay}ms... (Attempt ${attempt}/${retries})`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }
            console.error('[OVERPASS] Final failure:', error.message);
            return fallback;
        }
    }
    return fallback;
}
