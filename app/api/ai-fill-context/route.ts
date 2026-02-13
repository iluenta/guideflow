import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { searchBrave, formatBraveResults } from '@/lib/ai/brave';
import { geocode, findPOI, getMapboxRoute } from '@/lib/ai/mapbox';
import { generateArrivalInstructions } from '@/lib/arrival/generator-final';

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

    // Extracción de ciudad
    const cityParts = fullAddress.split(',');
    const extractedCity = cityParts.length > 2 ? cityParts[cityParts.length - 2].trim().replace(/^\d+\s*/, '') : cityParts[0].trim();
    const finalCity = extractedCity || property.city || 'Desconocida';

    console.log(`[AI-FILL] Section: ${section} | City: ${finalCity}`);

    let prompt = '';

    if (section === 'dining' || section === 'recommendations') {
      const selectedCat = existingData?.category || 'todos';
      let categoryDirectives = '';

      if (selectedCat === 'todos') {
        categoryDirectives = `Genera una lista de 10-12 recomendaciones REALES distribuidas en estas categorías: Restaurantes, Compras, Cultura, Naturaleza, Ocio, Relax.`;
      } else {
        categoryDirectives = `Genera una lista de 6-8 recomendaciones REALES específicas para la categoría: ${selectedCat.toUpperCase()}.`;
      }

      const existingNames = existingData?.existingNames || [];
      const exclusionDirectives = existingNames.length > 0 ? `\nREGLA: NO generes: ${existingNames.join(', ')}.` : '';

      prompt = `Eres un experto local de la ciudad de ${finalCity}.
      UBICACIÓN: ${fullAddress}. TAREA: ${categoryDirectives}${exclusionDirectives}.
      IMPORTANTE: Datos REALES y turísticos. Responde JSON con la clave "recommendations".`;
    }
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
    else if (section === 'tech') {
      prompt = `Asistente técnico. Guía para Smart TV y WiFi. JSON con clave "tech_info".`;
    }
    else if (section === 'inventory') {
      prompt = `Genera inventario básico. JSON con clave "inventory".`;
    }
    else if (section === 'faqs') {
      const { checkin_time, quiet_hours } = existingData || {};
      prompt = `Eres un experto anfitrión de un alojamiento turístico llamado "${property.name}" en ${property.city}. 
      DESCRIPCIÓN: ${property.description || 'Alojamiento vacacional'}.
      DATOS ESPECÍFICOS: 
      - Check-in: ${checkin_time || 'A convenir'}
      - Horas de silencio: ${quiet_hours || '22:00 - 08:00'}
      
      TAREA: Genera 10-12 FAQs REALES y útiles para un huésped que se queda en este alojamiento.
      Incluye temas como: llegada, wifi, normas, basura, transporte cercano y uso de electrodomésticos.
      
      REGLA DE ORO: NO inventes detalles físicos específicos (ej: tipo de perchas, materiales de los muebles, colores) si no están en la descripción. Sé útil pero factual.
      
      RESPONDE SOLO EL JSON con la clave "faqs" y una lista de objetos { question, answer }.`;
    }
    else if (section === 'contacts') {
      prompt = `Contactos de emergencia para ${finalCity} cerca de ${fullAddress}. JSON con clave "emergency_contacts".`;
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
