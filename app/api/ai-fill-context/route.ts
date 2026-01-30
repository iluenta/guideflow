import { createClient } from '@supabase/supabase-js';
import { geminiREST } from '@/lib/ai/gemini-rest';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { propertyId, section, existingData } = await req.json();

    // Obtener detalles de la propiedad para el contexto geográfico
    const { data: property, error: propError } = await supabase
      .from('properties')
      .select('name, location, description')
      .eq('id', propertyId)
      .single();

    if (propError || !property) {
      throw new Error('Propiedad no encontrada');
    }

    const city = property.location.split(',').pop()?.trim() || property.location;
    const address = property.location;

    let prompt = '';

    if (section === 'dining') {
      prompt = `Eres un experto local de ${city}.
UBICACIÓN DEL APARTAMENTO: ${address}
NOMBRE DE LA PROPIEDAD: ${property.name}

TAREA: Genera una lista de 8-10 recomendaciones REALES de ocio cerca de esta ubicación, siguiendo esta taxonomía:
1. Desayunos (Cafeterías, panaderías)
2. Comida/Cena (Especialidades locales, opciones económicas)
3. Bares/Copas
4. Supermercados y Farmacias (incluyendo 24h si hay)
5. Ocio y Cultura (Museos, parques, experiencias)

Para cada sitio, proporciona en formato JSON:
{
  "recommendations": [
    {
      "name": "Nombre Real",
      "type": "Restaurante / Supermercado / Museo / etc",
      "distance": "5 min andando / 200m",
      "price_range": "€ / €€ / €€€",
      "specialty": "Lo más destacado",
      "address": "Dirección completa",
      "personal_note": "Una breve recomendación cálida",
      "metadata": {
        "delivery": true/false,
        "phone": "número de teléfono si lo sabes",
        "opening_hours": "horario si lo sabes"
      }
    }
  ]
}

Responde ÚNICAMENTE con el objeto JSON. Sin explicaciones.`;
    }
    else if (section === 'transport') {
      prompt = `Eres un experto en movilidad en ${city}.
UBICACIÓN COCHE/PORTAL: ${address}

TAREA: Proporciona instrucciones REALES y detalladas siguiendo la taxonomía:
1. Cómo llegar desde el AEROPUERTO (Metro/Tren/Bus Express/Taxi con precios aprox).
2. Cómo llegar desde la ESTACIÓN DE TREN principal.
3. PARKING: Opciones públicas cercanas, precios aprox y si hay zona azul/verde.
4. Transporte público cercano (Estaciones de metro/bus a <5 min).

Formato JSON esperado:
{
  "access_info": {
    "from_airport": { "instructions": "Instrucciones detalladas...", "duration": "45 min", "price_range": "€30-40" },
    "from_train": { "instructions": "Instrucciones...", "duration": "15 min", "price_range": "€5-10" },
    "parking": { "info": "Nombre del parking y detalles...", "price": "€25/día", "distance": "200m" },
    "nearby_transport": [
      { "type": "Metro", "name": "Nombre estación", "distance": "3 min" },
      { "type": "Bus", "name": "Línea X", "distance": "1 min" }
    ]
  }
}

Responde ÚNICAMENTE con el JSON.`;
    }
    else if (section === 'tech') {
      prompt = `Eres el asistente técnico de una propiedad en ${city}.

TAREA: Genera una guía técnica estándar pero realista para una Smart TV y conectividad.

Formato JSON esperado:
{
  "tech_info": {
    "wifi": { "ssid_example": "Nombre_Red_GUEST", "password_hint": "Clave en el router", "speed": "Fibra 300MB" },
    "tv": { "model": "Smart TV", "apps": ["Netflix", "YouTube", "Prime Video"], "instructions": "Usa el mando negro, botón Home para apps." },
    "bluetooth_speaker": { "instructions": "Botón ON 3 seg, busca 'GuestSpeaker'." }
  }
}

Responde ÚNICAMENTE con el JSON.`;
    }
    else if (section === 'inventory') {
      prompt = `Actúa como un anfitrión detallista.

TAREA: Genera una lista de inventario y servicios básicos que suelen estar disponibles en un alojamiento de calidad en ${city}.

Formato JSON esperado:
{
  "inventory": {
    "bathroom": ["Secador de pelo", "Gel y Champú", "Toallas extra en armario"],
    "bedroom": ["Almohadas extra", "Mantas", "Perchas"],
    "kitchen": ["Cafetera Nespresso", "Sal, azúcar y aceite", "Tostadora"],
    "cleaning": ["Plancha y tabla", "Tendedero portátil", "Aspiradora"]
  }
}

Responde ÚNICAMENTE con el JSON.`;
    }
    else if (section === 'faqs') {
      prompt = `Actúa como un anfitrión profesional. Tienes que anticiparte a las dudas basadas en esta TAXONOMÍA:
1. Acceso y Llegada (Check-in, llaves).
2. Normas y Salida (Basura, ruidos, check-out).
3. WiFi y Tecnología.
4. Problemas Técnicos (Agua caliente, luz).
5. Servicios (Toallas extra, secador).

TAREA: Genera 12 FAQs realistas y útiles siguiendo estas categorías.

Formato JSON esperado:
{
  "faqs": [
    {
      "question": "¿Pregunta real?",
      "answer": "Respuesta clara y amable.",
      "category": "access / rules / tech / maintenance / services"
    }
  ]
}

Responde ÚNICAMENTE con el JSON.`;
    }

    // Usar Gemini REST Helper con JSON Mode
    const result = await geminiREST('gemini-3-flash-preview', prompt, {
      responseMimeType: 'application/json',
      temperature: 0.1
    });

    if (!result) {
      throw new Error('No se pudo generar el contenido con Gemini');
    }

    return new Response(JSON.stringify(result), {
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
