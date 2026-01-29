// app/dashboard/property/[id]/manuals/page.tsx
'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle } from 'lucide-react';

export default function ManualsPage({ params }: { params: { id: string } }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<string>('');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setProgress('Subiendo imagen...');

    // 1. Upload a Supabase Storage
    const formData = new FormData();
    formData.append('file', file);
    const uploadRes = await fetch('/api/upload-image', {
      method: 'POST',
      body: formData,
    });
    const { imageUrl } = await uploadRes.json();

    // 2. Analizar imagen
    setProgress('Analizando electrodoméstico...');
    const analysisRes = await fetch('/api/analyze-appliance', {
      method: 'POST',
      body: JSON.stringify({ imageUrl, propertyId: params.id }),
    });
    const { analysis } = await analysisRes.json();

    // 3. Buscar en web si es necesario
    let webResults = null;
    if (analysis.needs_web_search && analysis.brand && analysis.model) {
      setProgress('Buscando información técnica...');
      const searchRes = await fetch('/api/search-manual', {
        method: 'POST',
        body: JSON.stringify({
          brand: analysis.brand,
          model: analysis.model,
          applianceType: analysis.appliance_type,
        }),
      });
      webResults = await searchRes.json();
    }

    // 4. Generar manual
    setProgress('Generando manual completo...');
    const manualRes = await fetch('/api/generate-manual', {
      method: 'POST',
      body: JSON.stringify({
        analysis,
        webResults,
        propertyId: params.id,
      }),
    });
    await manualRes.json();

    setProgress('¡Completado!');
    setUploading(false);
    
    // Recargar lista de manuales
    window.location.reload();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Manuales de Electrodomésticos</h1>

      {/* Upload Zone */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center mb-8">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <label className="cursor-pointer">
          <span className="text-blue-600 hover:text-blue-700 font-semibold">
            Subir foto de electrodoméstico
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
            disabled={uploading}
          />
        </label>
        <p className="text-sm text-gray-500 mt-2">
          Foto del frontal o de la etiqueta técnica
        </p>
      </div>

      {/* Progress */}
      {uploading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3" />
            <span className="text-blue-900">{progress}</span>
          </div>
        </div>
      )}

      {/* Lista de manuales existentes */}
      <ManualsList propertyId={params.id} />
    </div>
  );
}
```

---

## 5. COSTES ESTIMADOS (MVP)

### Costes por Propiedad/Mes

**Generación de Manuales (one-time por aparato):**
- Claude Vision (analizar 1 imagen): ~$0.003
- Brave Search (3 búsquedas): Gratis (plan básico)
- Claude Sonnet (generar manual 3K tokens): ~$0.015
- OpenAI Embeddings (500 tokens): ~$0.00001
- **Total por aparato: ~$0.02**
- **10 aparatos por propiedad: $0.20**

**Chat en Producción (estimado 100 preguntas/mes):**
- OpenAI Embeddings query: 100 × $0.00001 = $0.001
- Claude Haiku (100 respuestas × 200 tokens): ~$0.05
- **Total chat/mes: $0.051**

**TOTAL por propiedad/mes: ~$0.25**

**100 propiedades activas: $25/mes**

### Costes Infraestructura:
- Vercel (Hobby): $0 (hasta 100GB bandwidth)
- Supabase (Free tier): $0 (hasta 500MB DB)
- **Total fijo: $0** (en MVP)

---

## 6. METODOLOGÍA DE TRABAJO

### Semana 1: Setup y Base
**Días 1-2:**
- [ ] Extensión schema Supabase (tablas + pgvector)
- [ ] Configurar variables entorno (.env.local)
- [ ] Setup Anthropic SDK + OpenAI SDK
- [ ] Crear estructura carpetas Next.js

**Días 3-4:**
- [ ] API `/api/upload-image` (Supabase Storage)
- [ ] API `/api/analyze-appliance` (Claude Vision)
- [ ] Testear con 5 imágenes diferentes

**Días 5-7:**
- [ ] API `/api/search-manual` (Brave Search)
- [ ] API `/api/generate-manual` (Claude Sonnet)
- [ ] Función `generateEmbeddings`
- [ ] Testear flujo completo: foto → manual

### Semana 2: RAG y Chat
**Días 8-10:**
- [ ] Función SQL `match_manual_chunks`
- [ ] API `/api/chat` con RAG
- [ ] Componente `GuestChat`
- [ ] Testear retrieval con preguntas reales

**Días 11-12:**
- [ ] Dashboard UI para subir fotos
- [ ] Lista de manuales generados
- [ ] Edición manual básica

**Días 13-14:**
- [ ] Integrar chat en vista huésped
- [ ] Testing E2E completo
- [ ] Ajustes prompts según resultados

### Semana 3: Refinamiento
**Días 15-17:**
- [ ] Optimizar chunking strategy
- [ ] Ajustar thresholds de similarity
- [ ] Mejorar prompts basado en tests
- [ ] Añadir fallback responses

**Días 18-20:**
- [ ] UI/UX polish
- [ ] Analytics básicas (track preguntas)
- [ ] Documentación interna

**Día 21:**
- [ ] Deploy a producción
- [ ] Beta testing con 3-5 propiedades

---

## 7. PROMPTS CLAVE OPTIMIZADOS

### Prompt para Análisis de Imagen
```
Eres un experto en identificación de electrodomésticos y aparatos domésticos.

TAREA: Analiza la imagen y extrae información técnica.

FORMATO DE SALIDA (JSON estricto):
{
  "appliance_type": "categoría (horno, lavadora, caldera, termo, lavavajillas, microondas, etc)",
  "brand": "marca visible o null",
  "model": "modelo exacto o null",
  "has_technical_label": boolean,
  "visible_controls": ["descripción control 1", "descripción control 2"],
  "visual_condition": "nuevo/usado/antiguo",
  "confidence": 0.0-1.0,
  "needs_web_search": boolean,
  "search_keywords": "palabras clave para búsqueda web si needs_web_search=true"
}

REGLAS:
1. Si ves una etiqueta técnica con modelo, confidence debe ser > 0.8
2. Si solo ves el frontal sin modelo, confidence < 0.6
3. needs_web_search = true si hay marca/modelo identificable
4. visible_controls debe ser descriptivo: "Perilla temperatura 50-250°C"
5. Si la imagen es borrosa o no muestra un aparato, confidence = 0

RESPONDE SOLO CON EL JSON, SIN TEXTO ADICIONAL.
```

### Prompt para Generación de Manual
```
Eres un experto técnico redactando manuales de usuario simplificados para huéspedes.

APARATO:
{analysis}

INFORMACIÓN WEB ENCONTRADA:
{webResults}

GENERA un manual en ESPAÑOL siguiendo esta estructura EXACTA:

# {appliance_type} - {brand} {model}

## 1. Descripción General
- Tipo de aparato y características principales
- Capacidad/potencia si se conoce

## 2. Panel de Control y Elementos
- Descripción detallada de cada botón/perilla/indicador
- Qué significa cada símbolo o luz

## 3. Instrucciones de Uso Paso a Paso
### Uso Básico Diario
1. [Paso 1]
2. [Paso 2]
...

### Funciones Avanzadas (si aplica)
- [Función especial 1]
- [Función especial 2]

## 4. Programas/Modos Disponibles
| Programa | Descripción | Cuándo usarlo |
|----------|-------------|---------------|
| ... | ... | ... |

## 5. Solución de Problemas Comunes
**🔴 El aparato no enciende**
- Verifica que esté enchufado
- Comprueba el interruptor general
- Revisa el fusible/diferencial

**🔴 Luz roja parpadeando**
- [Causa probable]
- [Solución paso a paso]

**🔴 Hace ruido extraño**
...

[INCLUIR MÍNIMO 10 PROBLEMAS FRECUENTES]

## 6. Mantenimiento Regular
- Limpieza: [frecuencia y método]
- Filtros: [cuándo cambiar/limpiar]
- Descalcificación: [si aplica]

## 7. ⚠️ Advertencias de Seguridad
- [Punto crítico 1]
- [Punto crítico 2]

---

REGLAS DE REDACCIÓN:
- Lenguaje claro para personas no técnicas
- Pasos numerados y concisos
- Incluir soluciones antes de "llamar al anfitrión"
- Si falta información técnica, usa conocimiento general del tipo de aparato
- NO inventes modelos o especificaciones técnicas precisas si no las tienes
```

### Prompt para el Chat RAG
```
Eres un asistente técnico amable para huéspedes de alojamientos vacacionales.

MANUALES DISPONIBLES:
{context}

PREGUNTA DEL HUÉSPED:
{question}

INSTRUCCIONES:
1. Responde SOLO con información del contexto proporcionado
2. Si no está en el contexto: "No tengo información sobre esto. Contacta al anfitrión por [método]."
3. Para problemas técnicos:
   - Da soluciones de primer nivel (reiniciar, verificar conexiones)
   - Solo sugiere llamar al anfitrión si es necesario técnico especializado
4. Formato de respuesta:
   - Saludo breve si es el primer mensaje
   - Respuesta directa
   - Pasos numerados si son instrucciones
   - Emojis sutiles (✅❌⚠️) para claridad
5. Máximo 150 palabras por respuesta
6. Tono: amigable, paciente, servicial

EJEMPLO BUENO:
"Para encender el horno:
1. Gira la perilla de temperatura a 180°C
2. Presiona el botón de encendido (luz verde se enciende)
3. Espera 10 minutos para que precaliente

Si la luz roja parpadea, es normal durante el calentamiento ✅"

RESPONDE: