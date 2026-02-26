// app/api/generate-manual/route.ts

export async function POST(req: Request) {
  const { analysis, webResults, propertyId } = await req.json();
  
  const contextPrompt = webResults?.length > 0 
    ? `Información encontrada online:\n${JSON.stringify(webResults, null, 2)}`
    : 'No hay información web disponible, genera basándote en el análisis visual.';
  
  const message = await anthropic.messages.create({
    model: "claude-3-5-sonnet-20241022",
    max_tokens: 4096,
    messages: [{
      role: "user",
      content: `Eres un experto técnico creando manuales de usuario simplificados.

APARATO IDENTIFICADO:
${JSON.stringify(analysis, null, 2)}

${contextPrompt}

Genera un manual de usuario completo en ESPAÑOL con esta estructura EXACTA en Markdown:

# ${analysis.appliance_type} - ${analysis.brand} ${analysis.model}

## 1. Descripción General
[Breve descripción del aparato]

## 2. Elementos y Controles
[Lista de botones, perillas, indicadores luminosos]

## 3. Instrucciones de Uso Básico
[Paso a paso para uso diario]

## 4. Programas/Modos Disponibles
[Si aplica: programas de lavado, temperatura del horno, etc]

## 5. Solución de Problemas Comunes
[Mínimo 10 problemas frecuentes con soluciones]
Formato:
**Problema:** [descripción]
**Solución:** [pasos claros]

## 6. Mantenimiento
[Limpieza y cuidados básicos]

## 7. Advertencias de Seguridad
[Puntos críticos de seguridad]

IMPORTANTE: 
- Usa lenguaje claro para cualquier persona
- Sé específico con los pasos
- En "Solución de Problemas" incluye casos como luces parpadeantes, no arranca, hace ruidos, etc.`
    }]
  });
  
  const manualContent = message.content[0].text;
  
  // Guardar manual
  const { data: manual } = await supabase
    .from('property_manuals')
    .insert({
      property_id: propertyId,
      appliance_name: analysis.appliance_type,
      brand: analysis.brand,
      model: analysis.model,
      manual_content: manualContent,
      metadata: {
        source: webResults?.length > 0 ? 'web_enhanced' : 'vision_only',
        confidence: analysis.confidence
      }
    })
    .select()
    .single();
    
  // Generar embeddings
  await generateEmbeddings(manual.id, manualContent);
  
  return Response.json({ manual });
}