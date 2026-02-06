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

    if (section === 'dining' || section === 'recommendations') {
      const selectedCat = existingData?.category || 'todos';
      let categoryDirectives = '';

      if (selectedCat === 'todos') {
        categoryDirectives = `Genera una lista de 10-12 recomendaciones REALES distribuidas en estas categorías:
        - Restaurantes (Especialidad local, café)
        - Compras (Supermercados, mercado local)
        - Cultura (Museos, sitios históricos)
        - Naturaleza (Parques, miradores)
        - Ocio (Bares, experiencias)
        - Relax (Spa, zonas tranquilas)`;
      } else {
        categoryDirectives = `Genera una lista de 6-8 recomendaciones REALES específicas para la categoría: ${selectedCat.toUpperCase()}.`;
      }

      const existingNames = existingData?.existingNames || [];
      const exclusionDirectives = existingNames.length > 0
        ? `\nREGLA CRÍTICA: NO generes NINGUNA de estas recomendaciones porque ya existen: ${existingNames.join(', ')}. Busca sitios diferentes.`
        : '';

      prompt = `Eres un experto local de la ciudad de ${finalCity}.
UBICACIÓN EXACTA DEL APARTAMENTO: ${fullAddress}
NOMBRE DE LA PROPIEDAD: ${property.name}

TAREA: ${categoryDirectives}${exclusionDirectives}

IMPORTANTE: Proporciona datos REALES y precisos centrándote en lo que un TURISTA valoraría realmente.
REGLAS DE SELECCIÓN:
1. PRIORIZA Sitios de interés turístico, restaurantes con buenas reseñas, experiencias locales auténticas y servicios esenciales para viajeros.
2. EXCLUYE estrictamente negocios que NO tienen interés turístico: Ferreterías, inmobiliarias, notarías, talleres mecánicos, gestorías o tiendas de barrio irrelevantes (ej: repuestos).
3. EXCEPCIÓN: Solo incluye tiendas especializadas (como joyerías o artesanía) SI la localidad es famosa específicamente por ese sector y es una actividad turística destacada.
4. CALIDAD: Si no encuentras suficientes sitios de alta calidad en una categoría, genera menos cantidad pero que sean excelentes.

Cada recomendación debe tener:
- name: Nombre real.
- category: Una de estas (restaurantes, compras, cultura, naturaleza, ocio, relax).
- distance: Distancia a pie o en coche (ej: 300m, 1.2km).
- time: Tiempo estimado (ej: 5 min, 15 min).
- price_range: Rango de precios (ej: €, €€, €€€).
- description: Breve descripción de por qué es recomendable para alguien de fuera.
- personal_note: Una nota corta y cercana (ej: "No te pierdas su tarta de queso").

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
      const checkinTime = existingData?.checkin_time || 'No definido';
      const quietHours = existingData?.quiet_hours || 'No definido';

      prompt = `Actúa como un anfitrión profesional. Tienes que anticiparte a las dudas basadas en esta TAXONOMÍA:
1. Llegada y Salida (¿Puedo llegar antes?, ¿A qué hora es el check-out?).
2. Normas de Convivencia (Basura, ruidos, mascotas, normas de la comunidad).
3. Problemas Técnicos (Agua caliente, luz, suministros).
4. El Barrio (Supermercados, transporte cercano, seguridad).

REGLAS CRÍTICAS DE EXCLUSIÓN:
- NO generes preguntas sobre "Cómo recoger las llaves" o "Cómo hacer el check-in" (ya hay una sección para esto).
- NO generes preguntas sobre "Contraseña del WiFi" o "Problemas con WiFi" (ya hay una sección para esto).
- NO generes preguntas sobre "Secador de pelo" (se incluirá en el inventario).

CASOS ESPECIALES PARA RESPONDER:
- Si te preguntan "¿Puedo llegar antes de la hora de check-in?", responde mencionando explícitamente que la hora oficial es ${checkinTime}.
- Si te preguntan sobre ruidos, menciona explícitamente el HORARIO DE SILENCIO: ${quietHours}.

TAREA: Genera 10-12 FAQs realistas y útiles siguiendo estas categorías y exclusiones.

Responde estrictamente en formato JSON con la clave "faqs".`;
    }
    else if (section === 'contacts') {
      prompt = `Eres un asistente local experto en servicios de emergencia y soporte para la ciudad de ${finalCity}.
UBICACIÓN EXACTA: "${fullAddress}"

TAREA: Genera una lista de contactos de emergencia REALES y CERCANOS a esta ubicación.
Debes incluir:
1. Policía Local de la zona.
2. El Centro de Salud o Urgencias Médicas más cercano.
3. El Hospital más cercano con urgencias 24h.
4. Una Farmacia cercana (PRIORIZA farmacias 24h o con horario ampliado).

IMPORTANTE: Proporciona nombres reales y números de teléfono reales (formato español preferiblemente si es España, ej: +34 ...). 
Para cada contacto, obligatoriamente proporciona la DIRECCIÓN REAL EXACTA.

Responde estrictamente en formato JSON con la clave "emergency_contacts". El formato de cada contacto debe ser:
{
  "id": "uuid-generado",
  "name": "Nombre del sitio (ej: Hospital Tierra de Barros)",
  "phone": "Teléfono real",
  "address": "Dirección completa y exacta (Calle, número, ciudad)",
  "type": "policia | salud | farmacia | bomberos",
  "distance": "Ej: 5 min en coche"
}

Responde ÚNICAMENTE con el objeto JSON. Sin explicaciones.`;
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
