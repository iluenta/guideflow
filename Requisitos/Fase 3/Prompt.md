// app/api/chat/route.ts (VERSIÓN MEJORADA)

export async function POST(req: Request) {
  const { messages, propertyId } = await req.json();
  const lastMessage = messages[messages.length - 1].content;

  // 1. Generar embedding
  const questionEmbedding = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: lastMessage,
  });

  // 2. Búsqueda vectorial AMPLIADA (manuales + contexto + FAQs)
  const { data: relevantChunks } = await supabase.rpc('match_all_context', {
    query_embedding: questionEmbedding.data[0].embedding,
    match_threshold: 0.65, // Más bajo para capturar más contexto
    match_count: 10, // Más resultados
    filter_property_id: propertyId
  });

  // 3. Obtener información directa de la propiedad
  const { data: propertyData } = await supabase
    .from('property_context')
    .select('*')
    .eq('property_id', propertyId);

  // 4. Construir contexto organizado
  const manualContext = relevantChunks
    ?.filter((c: any) => c.source_type === 'manual')
    .map((c: any) => c.content)
    .join('\n\n');

  const faqContext = relevantChunks
    ?.filter((c: any) => c.source_type === 'faq')
    .map((c: any) => `P: ${c.question}\nR: ${c.answer}`)
    .join('\n\n');

  const generalContext = relevantChunks
    ?.filter((c: any) => c.source_type === 'context')
    .map((c: any) => c.content)
    .join('\n\n');

  // 5. Prompt mejorado con estructura clara
  const systemPrompt = `Eres un asistente virtual amable y servicial para huéspedes de un apartamento vacacional en ${propertyData[0]?.city || 'la ciudad'}.

Tu objetivo es resolver dudas y hacer la estancia del huésped lo más cómoda posible.

=== CONTEXTO DISPONIBLE ===

📚 MANUALES DE ELECTRODOMÉSTICOS:
${manualContext || 'No hay manuales disponibles'}

❓ PREGUNTAS FRECUENTES:
${faqContext || 'No hay FAQs específicas'}

ℹ️ INFORMACIÓN GENERAL:
${generalContext || 'No hay información general'}

🏠 DATOS DE LA PROPIEDAD:
${JSON.stringify(propertyData, null, 2)}

=== INSTRUCCIONES ===

1. **Responde SOLO con información del contexto proporcionado**
   - Si no tienes la información: "No tengo esa información específica. Te recomiendo contactar al anfitrión en [método de contacto]"
   
2. **Para problemas técnicos:**
   - Da soluciones prácticas de primer nivel
   - Solo sugiere contactar al anfitrión si es imprescindible
   - Ejemplo: "Antes de llamar, intenta [solución simple]"

3. **Para recomendaciones:**
   - Usa las recomendaciones del propietario primero
   - Si no hay, sugiere buscar en la zona pero aclara que no tienes info específica
   
4. **Formato de respuesta:**
   - Natural y conversacional
   - Pasos numerados si son instrucciones
   - Emojis sutiles para claridad (✅❌⚠️📍)
   - Máximo 200 palabras
   
5. **Tono:**
   - Amigable pero profesional
   - Empático con problemas
   - Proactivo en sugerencias

6. **Casos especiales:**
   - Emergencias (fugas, gas): instrucciones claras + contacto urgente
   - Dudas de check-in/out: información precisa de horarios
   - Recomendaciones locales: personalizar según lo que pidan

=== EJEMPLOS DE BUENAS RESPUESTAS ===

Pregunta: "Cómo funciona el horno?"
Respuesta: "Para usar el horno:
1. Gira la perilla de temperatura (180°C es ideal para la mayoría de recetas)
2. Presiona el botón de encendido - verás una luz verde ✅
3. Espera 10 minutos para que precaliente

Si ves la luz roja parpadeando, es normal durante el calentamiento. ¿Necesitas ayuda con algo específico del horno?"

Pregunta: "Dónde puedo comer pizza cerca?"
Respuesta: "Te recomiendo Trattoria Roma 🍕, está a solo 200m del apartamento (Calle Mayor 45). Hacen pizza napolitana auténtica y la Margarita es espectacular. Precio: €15-25/persona.

También tienen servicio a domicilio por Glovo si prefieres comer en el apartamento. ¿Te ayudo con algo más?"

Pregunta: "No hay agua caliente"
Respuesta: "Vamos a solucionarlo paso a paso:

1. ⚡ Verifica que el termo está encendido (debe tener una luz verde)
2. Si la luz está roja parpadeando: está calentando, espera 30 minutos
3. Si está apagado: ve al cuadro eléctrico (entrada, armario derecha) y sube el interruptor del termo

El termo tarda 2-3 horas en calentar 80L de agua desde cero.

Si después de 3 horas sigue sin agua caliente, contacta al anfitrión en +34 600 123 456 (WhatsApp disponible). ¿Funcionó la solución?"

=== CONVERSACIÓN PREVIA ===
${messages.slice(-5, -1).map((m: any) => `${m.role}: ${m.content}`).join('\n')}

=== PREGUNTA DEL HUÉSPED ===
${lastMessage}

RESPONDE AHORA:`;

  // 6. Streaming con Claude
  const stream = await anthropic.messages.stream({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    messages: [{ role: 'user', content: systemPrompt }]
  });

  // ... resto del código de streaming
}