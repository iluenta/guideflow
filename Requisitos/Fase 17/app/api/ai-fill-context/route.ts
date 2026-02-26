import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { generateArrivalInstructions } from '@/lib/arrival/generator-final';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { propertyId, section, existingData } = await req.json();

    if (!propertyId) {
      return new Response(JSON.stringify({ error: 'ID de propiedad requerido para generar contexto' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

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

    // Extracción de ciudad mejorada
    let finalCity = property.city || 'Desconocida';

    if (existingData?.address) {
      const addressParts = existingData.address.split(',');
      if (addressParts.length >= 2) {
        const possibleCity = addressParts[addressParts.length - 2].trim().replace(/^\d+\s*/, '');
        if (possibleCity && possibleCity.length > 2) {
          finalCity = possibleCity;
        }
      }
    }

    if (finalCity === 'Desconocida' && property.country) {
      const countryLower = property.country.toLowerCase();
      if (countryLower.includes('espa')) finalCity = 'Madrid';
      else if (countryLower.includes('franc')) finalCity = 'París';
      else if (countryLower.includes('ital')) finalCity = 'Roma';
      else if (countryLower.includes('portugal')) finalCity = 'Lisboa';
    }

    console.log(`[AI-FILL] Section: ${section} | City: ${finalCity}`);

    // ─── TRANSPORT: early return, no Gemini ───────────────────────────────────
    const isTransport = ['transport', 'plane', 'train', 'road'].includes(section);
    if (isTransport) {
      try {
        const subSection = section === 'transport' ? undefined : section as any;
        const result = await generateArrivalInstructions(fullAddress, subSection);
        return Response.json(result);
      } catch (error: any) {
        console.error('[TRANSPORT-FILL] Error:', error.message);
        return Response.json({ error: error.message }, { status: 500 });
      }
    }

    // ─── PROMPTS para Gemini ──────────────────────────────────────────────────
    let prompt = '';

    if (section === 'dining' || section === 'recommendations') {
      const selectedCat = existingData?.category || 'todos';
      const existingNames = existingData?.existingNames || [];
      const exclusionRule = existingNames.length > 0
        ? `\nREGLA CRÍTICA: NO incluyas ninguno de estos sitios ya existentes: ${existingNames.join(', ')}.`
        : '';

      // Categorías válidas que espera el componente LocalRecommendations
      const validCategories = ['restaurantes', 'compras', 'cultura', 'naturaleza', 'ocio', 'relax'];

      let categoryDirectives = '';
      if (selectedCat === 'todos') {
        categoryDirectives = `Genera exactamente 10-12 recomendaciones REALES distribuidas entre estas categorías: restaurantes, compras, cultura, naturaleza, ocio, relax. Incluye al menos 1-2 de cada categoría.`;
      } else {
        categoryDirectives = `Genera exactamente 6-8 recomendaciones REALES y específicas para la categoría: "${selectedCat}". TODOS los objetos deben tener category = "${selectedCat}".`;
      }

      prompt = `Eres un guía local experto de ${finalCity}, España.
UBICACIÓN DEL APARTAMENTO: ${fullAddress}

TAREA: ${categoryDirectives}${exclusionRule}

REGLAS:
- Usa SOLO lugares REALES que existan en ${finalCity}
- Incluye distancia estimada caminando desde ${fullAddress}
- El campo "category" DEBE ser uno de: ${validCategories.join(', ')}
- Sé específico: nombre real, qué hace especial al sitio, precio orientativo

ESTRUCTURA JSON REQUERIDA (responde SOLO el JSON, sin texto adicional):
{
  "recommendations": [
    {
      "id": "uuid-unico",
      "name": "Nombre Real del Sitio",
      "category": "restaurantes",
      "description": "Qué ofrece y por qué merece la pena visitarlo.",
      "distance": "350m",
      "time": "5 min andando",
      "price_range": "€€",
      "personal_note": "Consejo específico del guía local (ej: pide el menú del día, mejor ir por la mañana...)"
    }
  ]
}`;

    } else if (section === 'tech') {
      prompt = `Asistente técnico para alojamiento turístico. Genera consejos básicos para Smart TV y WiFi. JSON con clave "tech_info".`;

    } else if (section === 'inventory') {
      prompt = `Genera inventario básico para un apartamento turístico. JSON con clave "inventory".`;

    } else if (section === 'faqs') {
      const { checkin_time, quiet_hours } = existingData || {};
      prompt = `Eres un experto anfitrión de un alojamiento turístico llamado "${property.name}" en ${property.city}. 
DESCRIPCIÓN: ${property.description || 'Alojamiento vacacional'}.
DATOS ESPECÍFICOS: 
- Check-in: ${checkin_time || 'A convenir'}
- Horas de silencio: ${quiet_hours || '22:00 - 08:00'}

TAREA: Genera 10-12 FAQs REALES y útiles para un huésped que se queda en este alojamiento.
Incluye temas como: llegada, wifi, normas, basura, transporte cercano y uso de electrodomésticos.

REGLA DE ORO: NO inventes detalles físicos específicos si no están en la descripción. Sé útil pero factual.

RESPONDE SOLO EL JSON con la clave "faqs" y una lista de objetos { question, answer }.`;

    } else if (section === 'contacts') {
      prompt = `Eres un experto en servicios de emergencia y recursos sanitarios de ${finalCity}, España.

UBICACIÓN EXACTA: ${fullAddress}

TAREA: Generar una lista COMPLETA y REAL de contactos de emergencia y servicios esenciales 
para un huésped que no conoce la zona. Prioriza los más cercanos a la ubicación indicada.

SERVICIOS A INCLUIR (en este orden de prioridad):

1. EMERGENCIAS GENERALES (siempre incluir):
   - 112 Emergencias General
   - 091 Policía Nacional (con dirección de la comisaría más cercana)
   - 062 Guardia Civil (con dirección del puesto más cercano)
   - 080 Bomberos locales (con dirección del parque más cercano)

2. URGENCIAS MÉDICAS:
   - Hospital general más cercano con urgencias 24h (nombre real, dirección, teléfono)
   - Centro de salud más cercano (nombre real, dirección, teléfono, horario)
   - PAC o Punto de Atención Continuada más cercano si existe (24h preferente)
   - Cruz Roja local si tiene servicio de urgencias en la zona

3. FARMACIAS:
   - Farmacia de guardia 24h más cercana (si existe permanente en la zona)
   - Al menos 1-2 farmacias cercanas a la dirección con horario habitual
   - Teléfono del turno de guardia de farmacias de la provincia

4. VETERINARIA (para huéspedes con mascotas):
   - Clínica veterinaria de urgencias 24h más cercana (nombre real, dirección, teléfono)
   - Al menos 1 clínica veterinaria cercana con horario normal como alternativa

5. OTROS SERVICIOS ÚTILES:
   - Taxi local o radiotaxi de la zona (teléfono real)
   - Grúa o asistencia en carretera (si zona turística)

REGLAS CRÍTICAS:
- Usa SOLO nombres, direcciones y teléfonos REALES y verificables
- Si no tienes certeza de un dato concreto, usa el número genérico nacional (ej: 112) en lugar de inventar
- Prioriza servicios 24h
- La distancia debe ser realista desde ${fullAddress}

ESTRUCTURA JSON EXIGIDA:
{
  "emergency_contacts": [
    { "id": "emergencias_112", "name": "Emergencias General", "phone": "112", "address": "Servicio de cobertura nacional", "distance": "Inmediato", "type": "emergency" },
    { "id": "policia_nacional", "name": "Policía Nacional", "phone": "091", "address": "[Dirección real comisaría más cercana]", "distance": "[X min]", "type": "policia" },
    { "id": "guardia_civil", "name": "Guardia Civil", "phone": "062", "address": "[Dirección real puesto más cercano]", "distance": "[X min]", "type": "policia" },
    { "id": "bomberos", "name": "Bomberos", "phone": "080", "address": "[Dirección real parque más cercano]", "distance": "[X min]", "type": "emergency" },
    { "id": "hospital_urgencias", "name": "[Nombre real hospital]", "phone": "[Teléfono real]", "address": "[Dirección real] — Urgencias 24h", "distance": "[X min en coche]", "type": "salud" },
    { "id": "centro_salud", "name": "[Nombre real centro salud o PAC]", "phone": "[Teléfono real]", "address": "[Dirección real] — [Horario]", "distance": "[X min]", "type": "salud" },
    { "id": "farmacia_guardia", "name": "Farmacia de Guardia", "phone": "[Teléfono guardia provincial]", "address": "[Dirección o 'rotativa por la zona']", "distance": "[X min]", "type": "farmacia" },
    { "id": "farmacia_cercana", "name": "[Nombre real farmacia]", "phone": "[Teléfono real]", "address": "[Dirección real] — [Horario]", "distance": "[X min]", "type": "farmacia" },
    { "id": "veterinaria_urgencias", "name": "[Nombre real clínica veterinaria]", "phone": "[Teléfono real]", "address": "[Dirección real] — [24h / Horario]", "distance": "[X min]", "type": "veterinaria" },
    { "id": "taxi_local", "name": "Radio Taxi ${finalCity}", "phone": "[Teléfono real radiotaxi local]", "address": "Servicio zona", "distance": "Bajo demanda", "type": "transporte" }
  ]
}

RESPONDE ÚNICAMENTE CON EL JSON VÁLIDO, sin texto adicional.`;
    }

    if (!prompt) {
      return new Response(JSON.stringify({ error: `Sección no soportada: ${section}` }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 }
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