/**
 * Fallback airport discovery when Wikidata fails
 * Uses a predefined list of major Spanish airports + distance calculation
 */

import { getDistanceMeters } from '../maps/overpass';

// Major Spanish airports with IATA codes and coordinates
const SPANISH_AIRPORTS = [
    { name: 'Adolfo Suárez Madrid-Barajas', code: 'MAD', city: 'Madrid', lat: 40.4719, lon: -3.5626 },
    { name: 'Barcelona-El Prat', code: 'BCN', city: 'Barcelona', lat: 41.2971, lon: 2.0785 },
    { name: 'Palma de Mallorca', code: 'PMI', city: 'Palma', lat: 39.5517, lon: 2.7389 },
    { name: 'Málaga-Costa del Sol', code: 'AGP', city: 'Málaga', lat: 36.6747, lon: -4.4991 },
    { name: 'Alicante-Elche', code: 'ALC', city: 'Alicante', lat: 38.2822, lon: -0.5717 },
    { name: 'Valencia', code: 'VLC', city: 'Valencia', lat: 39.4893, lon: -0.4816 },
    { name: 'Sevilla', code: 'SVQ', city: 'Sevilla', lat: 37.4178, lon: -5.8931 },
    { name: 'Bilbao', code: 'BIO', city: 'Bilbao', lat: 43.3011, lon: -2.9104 },
    { name: 'Ibiza', code: 'IBZ', city: 'Ibiza', lat: 38.8729, lon: 1.3647 },
    { name: 'Tenerife Sur', code: 'TFS', city: 'Tenerife', lat: 28.0445, lon: -16.5725 },
    { name: 'Gran Canaria', code: 'LPA', city: 'Las Palmas', lat: 27.9319, lon: -15.3866 },
    { name: 'Fuerteventura', code: 'FUE', city: 'Puerto del Rosario', lat: 28.4527, lon: -13.8638 },
    { name: 'Menorca', code: 'MAH', city: 'Mahón', lat: 39.8629, lon: 4.2237 },
    { name: 'Santiago de Compostela', code: 'SCQ', city: 'Santiago', lat: 42.8967, lon: -8.4153 },
    { name: 'Zaragoza', code: 'ZAZ', city: 'Zaragoza', lat: 41.6664, lon: -1.0274 }
];

export async function discoverNearbyAirportsFallback(coords: [number, number], radiusKm: number = 150) {
    const [lon, lat] = coords;

    try {
        // Calculate distances to all Spanish airports
        const airportsWithDistance = SPANISH_AIRPORTS.map(airport => ({
            ...airport,
            distance_km: Math.round(getDistanceMeters(lat, lon, airport.lat, airport.lon) / 1000)
        }));

        // Filter by radius and sort by distance
        const nearbyAirports = airportsWithDistance
            .filter(airport => airport.distance_km <= radiusKm)
            .sort((a, b) => a.distance_km - b.distance_km)
            .slice(0, 5); // Return max 5 airports

        console.log(`[AIRPORTS-FALLBACK] Found ${nearbyAirports.length} airports within ${radiusKm}km`);
        return nearbyAirports;

    } catch (error) {
        console.error('[AIRPORTS-FALLBACK] Error:', error);
        return [];
    }
}

// Additional function to get closest major airport even if outside radius
export async function getClosestMajorAirport(coords: [number, number]) {
    const [lon, lat] = coords;

    try {
        const airportsWithDistance = SPANISH_AIRPORTS.map(airport => ({
            ...airport,
            distance_km: Math.round(getDistanceMeters(lat, lon, airport.lat, airport.lon) / 1000)
        }));

        return airportsWithDistance.sort((a, b) => a.distance_km - b.distance_km)[0];

    } catch (error) {
        console.error('[AIRPORTS-FALLBACK] Error getting closest airport:', error);
        return null;
    }
}
