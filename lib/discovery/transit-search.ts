import { geminiREST } from '../ai/gemini-rest';

/**
 * Intelligent web search for transit options using Gemini
 */

export async function searchAirportTransportOptions(
    airportCode: string,
    airportName: string,
    cityName: string,
    destinationCoords: [number, number],
    nearbyMetroStations: Array<{ name: string, lines: string[], distance_m: number }>
) {
    const nearbyStationsText = nearbyMetroStations.length > 0
        ? `Las estaciones de metro más cercanas al destino son: ${nearbyMetroStations.slice(0, 3).map(s => `${s.name} (${s.distance_m}m, líneas ${s.lines.join('/')})`).join(', ')}`
        : 'No hay estaciones de metro identificadas cerca del destino';

    const prompt = `Busca información actualizada sobre cómo llegar desde el aeropuerto ${airportName} (${airportCode}) al centro de ${cityName} y específicamente a la zona de coordenadas cercanas.
    
    🎯 **CONTEXTO DEL DESTINO:**
    - Ciudad: ${cityName}
    - ${nearbyStationsText}
    
    📋 **INFORMACIÓN A BUSCAR:**
    
    1. **Transporte Público desde ${airportCode}:**
       - ¿Qué líneas de metro/tren/autobús conectan el aeropuerto con el centro?
       - Para cada opción: nombre, ruta, frecuencia, duración, precio.
       - Si hay estaciones de metro cercanas al destino mencionadas arriba, indica cómo conectar.
    
    2. **Taxi/VTC desde ${airportCode}:**
       - Precio estimado al centro de ${cityName}.
       - ¿Hay tarifa plana oficial?
       - ¿Está disponible Uber/Bolt/Cabify/similar?
       - Duración estimada del trayecto.
    
    🔍 **ESTRATEGIA DE BÚSQUEDA:**
    - Busca en webs oficiales del aeropuerto y autoridades de transporte de ${cityName}.
    
    📤 **FORMATO DE RESPUESTA (JSON ESTRICTO):**
    {
      "public_transport": [
        {
          "type": "metro",
          "name": "Nombre",
          "route": "Ruta",
          "frequency": "Frecuencia",
          "duration": "Duración",
          "price": "Precio",
          "notes": "Notas"
        }
      ],
      "taxi": {
        "price_range": "Precio",
        "duration": "Duración",
        "uber_available": true,
        "notes": "Notas"
      }
    }
    
    RESPONDE SOLO CON EL JSON.`;

    try {
        const { data } = await geminiREST('gemini-2.0-flash', prompt, {
            responseMimeType: 'application/json',
            temperature: 0.2,
            useGrounding: true
        });

        return data || fallbackAirportData(airportCode, cityName);
    } catch (error) {
        console.error('[Transit Search Error]', error);
        return fallbackAirportData(airportCode, cityName);
    }
}

export async function searchHighwayInformation(cityName: string, countryCode: string) {
    const prompt = `Busca información sobre autopistas y accesos por carretera a ${cityName}, ${countryCode}.
    
    📋 **INFORMACIÓN REQUERIDA:**
    1. Principales autopistas/autovías que llegan a la ciudad (nombres/números).
    2. ¿Hay peajes (tolls) en estas autopistas?
    3. ¿Hay zonas de bajas emisiones o peajes urbanos (congestion charge)?
    4. Notas importantes para conductores.
    
    📤 **FORMATO JSON:**
    {
      "main_highways": ["Autopista 1", "Autopista 2"],
      "tolls": boolean,
      "congestion_zones": boolean,
      "notes": "Texto"
    }
    
    RESPONDE SOLO CON JSON.`;

    try {
        const { data } = await geminiREST('gemini-2.0-flash', prompt, {
            responseMimeType: 'application/json',
            temperature: 0.2,
            useGrounding: true
        });

        return data || {
            main_highways: ['Consultar GPS'],
            tolls: false,
            congestion_zones: false,
            notes: 'Información no disponible'
        };
    } catch (error) {
        return {
            main_highways: ['Consultar GPS'],
            tolls: false,
            congestion_zones: false,
            notes: ''
        };
    }
}

function fallbackAirportData(airportCode: string, cityName: string) {
    return {
        public_transport: [{
            type: 'bus',
            name: 'Transporte público',
            route: `${airportCode} → ${cityName}`,
            frequency: 'Consultar',
            duration: 'Consultar',
            price: 'Consultar',
            notes: 'Información no disponible en este momento'
        }],
        taxi: {
            price_range: 'Variable',
            duration: 'Variable',
            uber_available: false
        }
    };
}
