import { geocodeAddress } from '../geocoding';
import { discoverNearbyAirports } from '../discovery/airports';
import { discoverMainTrainStations, discoverNearbyMetroStations } from '../discovery/stations';
import { findNearbyParking } from '../maps/overpass';
import { searchAirportTransportOptions, searchHighwayInformation } from '../discovery/transit-search';
import { geminiREST } from '../ai/gemini-rest';
import { createClient } from '../supabase/server';

/**
 * Main orchestrator for generating arrival instructions (Fase 13)
 */
export async function generateArrivalInstructions(address: string, section?: 'plane' | 'train' | 'road') {
    console.log('[ARRIVAL] Starting universal generation for:', address, section ? `(Section: ${section})` : '');

    // 1. Geocode
    const geo = await geocodeAddress(address);
    if (!geo) throw new Error('No se pudo geocodificar la dirección');

    const coordinates: [number, number] = [geo.lng, geo.lat];
    const city = geo.city || '';
    const countryCode = geo.countryCode || 'ES';

    // 2. Discover Nodes (Airports, Stations, Metro, Parking)
    console.log('[ARRIVAL] Discovering physical nodes...');
    const [nearbyAirports, nearbyMetro, parkingInfo] = await Promise.all([
        discoverNearbyAirports(coordinates, 150),
        discoverNearbyMetroStations(coordinates, 1000),
        findNearbyParking(geo.lat, geo.lng, 500)
    ]);

    const mainStations = await discoverMainTrainStations(city, coordinates);
    const mainAirport = nearbyAirports[0];

    // 3. Grounding Intelligence with Cache
    console.log('[ARRIVAL] Researching transit logistics...');

    let airportsWithTransit = [];
    let highwayInfo = null;

    if (!section || section === 'plane') {
        const cached = await getCachedTransport(city, countryCode, mainAirport?.code);
        if (cached?.transport_info) {
            console.log('[CACHE HIT] Using cached airport transport info');
            airportsWithTransit = cached.transport_info;
        } else {
            airportsWithTransit = await Promise.all(
                nearbyAirports.slice(0, 2).map(async (airport: any) => {
                    const transitInfo = await searchAirportTransportOptions(
                        airport.code,
                        airport.name,
                        city || airport.city,
                        coordinates,
                        nearbyMetro
                    );
                    return { ...airport, transport: transitInfo };
                })
            );
            // Save to cache if we have a main airport
            if (mainAirport) {
                await saveToCache(city, countryCode, mainAirport.code, airportsWithTransit, null);
            }
        }
    }

    if (!section || section === 'road') {
        const cached = await getCachedTransport(city, countryCode, mainAirport?.code);
        if (cached?.highway_info) {
            console.log('[CACHE HIT] Using cached highway info');
            highwayInfo = cached.highway_info;
        } else {
            highwayInfo = await searchHighwayInformation(city, 'España');
            if (mainAirport) {
                await saveToCache(city, countryCode, mainAirport.code, null, highwayInfo);
            }
        }
    }

    // 4. Final Narrative Generation
    console.log('[ARRIVAL] Generating final structured JSON...');
    const accessInfo = await generateArrivalJSON({
        address: geo.formattedAddress,
        city: city,
        airports: airportsWithTransit,
        mainStations,
        nearbyMetro,
        parkingInfo,
        highwayInfo: highwayInfo || { main_highways: [], notes: '' },
        section
    });

    return {
        ...accessInfo
    };
}

async function getCachedTransport(city: string, countryCode: string, airportCode?: string) {
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
}

async function saveToCache(city: string, countryCode: string, airportCode: string, transport: any, highway: any) {
    const supabase = await createClient();
    const update: any = {
        city_name: city,
        country_code: countryCode,
        airport_code: airportCode,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    };
    if (transport) update.transport_info = transport;
    if (highway) update.highway_info = highway;

    await supabase.from('city_transport_cache').upsert(update, { onConflict: 'city_name,country_code,airport_code' });
}

async function generateArrivalJSON(context: any) {
    const prompt = `Actúa como un Recepcionista TOP de Apartamentos de Lujo. Tu misión es generar la "Guía de Acceso Maestra" en formato JSON.
    
    📍 **UBICACIÓN DESTINO:** ${context.address}
    
    ${context.section ? `⚠️ **SOLO REGENERA LA SECCIÓN:** ${context.section}` : ''}

    ---
    ### DATOS FÍSICOS (ÚSALOS DE FORMA INTELIGENTE):
    
    **AEROPUERTOS:**
    ${context.airports.map((a: any) => `
    - ${a.name} (${a.code}) a ${a.distance_km} km.
      Logística: ${JSON.stringify(a.transport)}
    `).join('\n')}
    
    **ESTACIONES DE TREN:**
    ${context.mainStations.map((s: any) => `- ${s.name} (${s.distance_km} km)`).join('\n')}
    
    **METRO/BUS CERCANO:**
    ${context.nearbyMetro.map((m: any) => `- ${m.name} (${m.distance_m}m) - Líneas: ${m.lines?.join(', ') || 'N/A'}`).join('\n')}
    
    **CARRETERAS:**
    - Autopistas: ${context.highwayInfo?.main_highways?.join(', ') || 'N/A'}
    - Peajes: ${context.highwayInfo?.tolls ? 'Sí' : 'No'}
    - Zonas Bajas Emisiones: ${context.highwayInfo?.congestion_zones ? 'Sí' : 'No'}
    - Notas: ${context.highwayInfo?.notes || ''}
    
    **PARKING:**
    - Pago/Regulado: ${context.parkingInfo.has_regulated_parking ? 'Sí' : 'No'}
    - Cercanos: ${context.parkingInfo.parking_zones.slice(0, 2).map((p: any) => p.name).join(', ')}
    
    ---
    🎨 **REQUISITOS DE FORMATO VISUAL (En el campo "instructions"):**
    - Usa emojis temáticos (✈️, 🚇, 🚌, 🚕, 📍, 💰, ⏱️).
    - Estructura las rutas con "OPCIÓN A: [Medio] (Más económica)", "OPCIÓN B: [Medio] (Más rápida)".
    - Usa negritas para nombres de estaciones, líneas y precios.
    - Los precios deben estar en formato € o moneda local.
    - El estilo debe ser profesional, servicial y directo.

    ---
    🎯 **ESTRUCTURA JSON OBLIGATORIA:**
    {
      "access_info": {
        "by_road": { "title": "📍 UBICACIÓN Y ACCESO", "instructions": "Usa emojis e iconografía. Habla de autopistas y zona de bajas emisiones." },
        "from_airport": { "instructions": "Ruta detallada con opciones A, B y C. Usa emojis y precios claros.", "duration": "Tiempo total aprox", "price_range": "Precio total aprox" },
        "from_train": { "instructions": "Ruta desde la estación principal. Usa iconos y detalles de paradas.", "duration": "Tiempo total aprox", "price_range": "Precio/Tipo" },
        "nearby_transport": [
          { "type": "Bus/Metro/Tren", "name": "Nombre real y paradas", "distance": "X min andando" }
        ],
        "parking": { "info": "Información sobre parking GRATIS vs REGULADO (SER).", "price": "Precio o Gratis", "distance": "Ubicación" }
      }
    }
    
    🚫 **REGLAS:**
    - NO inventes nombres. Usa los datos proporcionados.
    - Si context.section está presente, solo enfócate en llenar ese campo y el resto déjalos como están o nulos.
    
    RESPONDE ÚNICAMENTE CON EL JSON VÁLIDO.`;

    const { data } = await geminiREST('gemini-2.0-flash', prompt, {
        responseMimeType: 'application/json',
        temperature: 0.2
    });

    return data || { access_info: null };
}
