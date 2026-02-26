import { findNearbyStations } from '../maps/overpass';

/**
 * Filter and categorize stations found via Overpass
 */

export async function discoverMainTrainStations(cityName: string, coords: [number, number]) {
    const [lon, lat] = coords;
    // Search in a larger radius for main stations
    const rawStations = await findNearbyStations(lat, lon, 5000);

    return rawStations
        .filter((s: any) => s.type === 'train')
        .map((s: any) => ({
            ...s,
            distance_km: (s.distance_m / 1000).toFixed(1)
        }));
}

export async function discoverNearbyMetroStations(coords: [number, number], radius: number = 1000) {
    const [lon, lat] = coords;
    const rawStations = await findNearbyStations(lat, lon, radius);

    return rawStations.filter((s: any) => s.type === 'metro');
}
