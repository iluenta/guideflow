import axios from 'axios';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_API_KEY || process.env.MAPBOX_TOKEN;

export interface MapboxLocation {
    lat: number;
    lon: number;
    name?: string;
    place_name?: string;
    city?: string;
    bbox?: number[];
}

/**
 * Geocodes an address to Lat/Lng coordinates using Mapbox.
 */
export async function geocode(address: string): Promise<MapboxLocation | null> {
    if (!MAPBOX_TOKEN) {
        console.error('[MAPBOX] Error: No token provided');
        return null;
    }

    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json`;
        const response = await axios.get(url, {
            params: {
                access_token: MAPBOX_TOKEN,
                limit: 1
            }
        });

        const feature = response.data.features?.[0];
        if (!feature) return null;

        const [lon, lat] = feature.center;
        const city = feature.context?.find((c: any) => c.id.includes('place'))?.text || '';
        const bbox = feature.bbox || feature.context?.find((c: any) => c.id.includes('place'))?.bbox;

        return {
            lat,
            lon,
            place_name: feature.place_name,
            city,
            bbox
        };
    } catch (error: any) {
        console.error('[MAPBOX] Geocoding error:', error.message);
        return null;
    }
}

/**
 * Finds a Point of Interest (POI) near coordinates.
 */
export async function findPOI(lat: number, lon: number, type: string, bbox?: number[]): Promise<MapboxLocation | null> {
    if (!MAPBOX_TOKEN) return null;

    try {
        const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(type)}.json`;
        const params: any = {
            proximity: `${lon},${lat}`,
            types: 'poi,place',
            limit: 1,
            access_token: MAPBOX_TOKEN
        };

        if (bbox) {
            params.bbox = bbox.join(',');
        }

        const response = await axios.get(url, { params });

        console.log(`[MAPBOX] POI Search URL [${type}]: ${url}?${new URLSearchParams(Object.entries(params).map(([k, v]) => [k, v.toString()])).toString()}`);

        const result = response.data.features?.find((f: any) => {
            const [rLon, rLat] = f.center;
            const dist = getDistance(lat, lon, rLat, rLon);
            return dist < 100; // Hard limit: 100km
        }) || response.data.features?.[0];

        if (!result) return null;

        const [lon2, lat2] = result.center;
        const finalDist = getDistance(lat, lon, lat2, lon2);

        if (finalDist > 100) {
            console.warn(`[MAPBOX] Rejecting result '${result.text}' because it is too far (${Math.round(finalDist)}km).`);
            return null;
        }

        return {
            name: result.text,
            lat: lat2,
            lon: lon2,
            place_name: result.place_name
        };
    } catch (error: any) {
        console.error(`[MAPBOX] POI search error [${type}]:`, error.response?.data || error.message);
        return null;
    }
}

/**
 * Calculates a route between two points.
 * Profile can be 'driving', 'walking', 'cycling'.
 */
export async function getMapboxRoute(from: { lat: number, lon: number }, to: { lat: number, lon: number }, profile: 'driving' | 'walking' | 'cycling' = 'driving') {
    if (!MAPBOX_TOKEN) return null;

    try {
        const url = `https://api.mapbox.com/directions/v5/mapbox/${profile}/${from.lon},${from.lat};${to.lon},${to.lat}`;
        const response = await axios.get(url, {
            params: {
                steps: true,
                geometries: 'geojson',
                access_token: MAPBOX_TOKEN
            }
        });

        const route = response.data.routes?.[0];
        if (!route) return null;

        return {
            duration: route.duration, // in seconds
            distance: route.distance, // in meters
            summary: route.legs[0]?.summary || ''
        };
    } catch (error: any) {
        console.error(`[MAPBOX] Routing error [${profile}]:`, error.response?.data || error.message);
        return null;
    }
}
/**
 * Simple Haversine distance formula (returns KM).
 */
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
}
