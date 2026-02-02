import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

// export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { propertyId, section, existingData } = await req.json();

    // Obtener detalles de la propiedad para el contexto geográfico
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('name, city, country, neighborhood, description')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      throw new Error('Propiedad no encontrada');
    }

    const fullAddress = existingData?.address || `${property.city}${property.neighborhood ? `, ${property.neighborhood}` : ''}${property.country ? `, ${property.country}` : ''}`;

    // Extracción de ciudad más robusta (asumiendo formato "Calle, CP Ciudad, Provincia, País")
    const cityParts = fullAddress.split(',');
    const extractedCity = cityParts.length > 2 ? cityParts[cityParts.length - 2].trim().replace(/^\d+\s*/, '') : cityParts[0].trim();
    const finalCity = extractedCity || property.city || 'Desconocida';

    console.log(`[AI-FILL] Executing for section: ${section} with SDK`);
    console.log(`[AI-FILL] Target Address: ${fullAddress}`);

    let prompt = '';

    if (section === 'dining') {
      prompt = `Eres un experto local de la ciudad de ${finalCity}.
UBICACIÓN EXACTA DEL APARTAMENTO: ${fullAddress}
NOMBRE DE LA PROPIEDAD: ${property.name}

TAREA: Genera una lista de 8-10 recomendaciones REALES de ocio cerca de esta ubicación exacta, siguiendo esta taxonomía:
1. Desayunos (Cafeterías, panaderías)
2. Comida/Cena (Especialidades locales, opciones económicas)
3. Bares/Copas
4. Supermercados y Farmacias (incluyendo 24h si hay)
5. Ocio y Cultura (Museos, parques, experiencias)

Responde estrictamente en formato JSON con la clave "recommendations". Sin explicaciones.`;
    }
    else if (section === 'transport') {
      prompt = `Eres un experto en movilidad y transporte local.
UBICACIÓN EXACTA: "${fullAddress}"

TAREA: Proporciona instrucciones REALES y detalladas para esta ubicación exacta. 
IMPORTANTE: No dejes campos vacíos. Si no conoces el nombre exacto de un parking, usa uno genérico cercano (ej: "Parking Público Centro") con distancias y precios realistas.

Debes responder con este formato JSON EXACTO:
{
  "access_info": {
    "from_airport": { 
      "instructions": "Describe cómo llegar en transporte público (Metro línea X, Bus Y) o Taxi, mencionando paradas específicas.", 
      "duration": "Ej: 40 min", 
      "price_range": "Ej: €5 - €30" 
    },
    "from_train": { 
      "instructions": "Indica el camino desde la estación principal más cercana.", 
      "duration": "Ej: 15 min", 
      "price_range": "Ej: €2 - €10" 
    },
    "parking": { 
      "info": "Nombre del parking más cercano o descripción de la zona de aparcamiento.", 
      "price": "Ej: €20/día o Gratis", 
      "distance": "Ej: 300m" 
    },
    "nearby_transport": [
      { "type": "Metro", "name": "Nombre estación", "distance": "5 min" },
      { "type": "Bus", "name": "Línea X", "distance": "2 min" }
    ]
  }
}

Responde ÚNICAMENTE con el objeto JSON. Sin explicaciones.`;
    }
    else if (section === 'tech') {
      prompt = `Eres el asistente técnico de una propiedad.
      
TAREA: Genera una guía técnica estándar pero realista para una Smart TV y conectividad.

Responde estrictamente en formato JSON con la clave "tech_info".`;
    }
    else if (section === 'inventory') {
      prompt = `Actúa como un anfitrión detallista.

TAREA: Genera una lista de inventario y servicios básicos que suelen estar disponibles en un alojamiento de calidad.

Responde estrictamente en formato JSON con la clave "inventory".`;
    }
    else if (section === 'faqs') {
      prompt = `Actúa como un anfitrión profesional. Tienes que anticiparte a las dudas basadas en esta TAXONOMÍA:
1. Acceso y Llegada (Check-in, llaves).
2. Normas y Salida (Basura, ruidos, check-out).
3. WiFi y Tecnología.
4. Problemas Técnicos (Agua caliente, luz).
5. Servicios (Toallas extra, secador).

TAREA: Genera 12 FAQs realistas y útiles siguiendo estas categorías.

Responde estrictamente en formato JSON con la clave "faqs".`;
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    return new Response(responseText, {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error: any) {
    console.error('[AI-FILL] Error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
