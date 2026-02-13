import axios from 'axios';
import { getDistanceMeters } from '../maps/overpass';

/**
 * Commercial airport discovery using Wikidata
 */

const WIKIDATA_SPARQL_URL = 'https://query.wikidata.org/sparql';

export async function discoverNearbyAirports(coords: [number, number], radiusKm: number = 150) {
    const [lon, lat] = coords;

    const query = `
        SELECT ?item ?itemLabel ?iata ?coords ?cityLabel WHERE {
          SERVICE wikibase:around {
            ?item wdt:P625 ?coords .
            bd:serviceParam wikibase:center "Point(${lon} ${lat})"^^geo:wktLiteral .
            bd:serviceParam wikibase:radius "${radiusKm}" .
          }
          ?item wdt:P31/wdt:P279* wd:Q1248784 . # It is an airport
          ?item wdt:P238 ?iata .                # It has an IATA code
          OPTIONAL { ?item wdt:P131 ?city . }   # Administrative entity
          SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en,es". }
        }
        LIMIT 5
    `;

    try {
        const response = await axios.get(WIKIDATA_SPARQL_URL, {
            params: { query, format: 'json' },
            headers: { 'Accept': 'application/sparql-results+json' }
        });

        const results = response.data.results.bindings || [];

        return results.map((r: any) => {
            // Extract coordinates from "Point(lon lat)" string
            const coordStr = r.coords.value;
            const match = coordStr.match(/Point\(([-\d.]+) ([-\d.]+)\)/);
            const aLon = match ? parseFloat(match[1]) : 0;
            const aLat = match ? parseFloat(match[2]) : 0;

            return {
                name: r.itemLabel.value,
                code: r.iata.value,
                city: r.cityLabel?.value || '',
                lat: aLat,
                lon: aLon,
                distance_km: Math.round(getDistanceMeters(lat, lon, aLat, aLon) / 1000)
            };
        }).sort((a: any, b: any) => a.distance_km - b.distance_km);

    } catch (error) {
        console.error('[WIKIDATA] Error discovering airports:', error);
        return [];
    }
}
