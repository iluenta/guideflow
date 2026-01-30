# Análisis de Optimización de Costes IA - GuideFlow

Tras analizar el uso actual de las APIs, he identificado oportunidades significativas para reducir costes operativos manteniendo o incluso mejorando la calidad del servicio.

## Comparativa de Costes Actuales (por 1M de tokens)

| Proveedor | Modelo | Uso | Coste Entrada | Coste Salida | Ahorro Potencial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Anthropic** | Claude 3 Haiku | Chat / Auto-fill | $0.250 | $1.250 | - |
| **Google** | Gemini 1.5 Flash | Vision / OCR | **$0.075** | **$0.300** | **~75% menos** |
| **OpenAI** | text-embedding-3-small | RAG | $0.020 | N/A | Óptimo |

## Recomendaciones de Optimización

### 1. Migrar Chat y Auto-fill a Gemini 1.5 Flash
**Análisis:** Actualmente usamos Claude 3 Haiku para la lógica de chat y generación de FAQs. 
- **Ventaja de Coste:** Gemini 1.5 Flash es entre 3 y 4 veces más barato que Haiku.
- **Ventaja Técnica:** Gemini tiene una ventana de contexto de 1M de tokens (frente a los 200k de Haiku) y es extremadamente eficiente procesando múltiples documentos (manuales técnicos largos).
- **Acción:** Cambiar los endpoints `/api/chat` y `/api/ai-fill-context` para usar Gemini 1.5 Flash.

### 2. Consolidación de Grounding (Búsqueda Local)
**Análisis:** Usamos Brave Search para encontrar datos reales de negocios.
- **Optimización:** Gemini 1.5 Flash permite integración nativa con el **Buscador de Google (Google Search Grounding)**. 
- **Ventaja:** Google suele tener datos más actualizados sobre horarios y reseñas de negocios locales que Brave. Al usarlo dentro del mismo modelo, eliminamos la dependencia y el coste latente de una API adicional (Brave).
- **Acción:** Implementar el "Google Search Tool" en la llamada de Gemini para las recomendaciones de ocio.

### 3. Mantener OpenAI para Embeddings
**Análisis:** El coste de OpenAI para embeddings es despreciable ($0.02 por 1M de tokens). 
- **Recomendación:** No cambiarlo. Migrar a Google Embeddings no aportaría un ahorro significativo y requeriría re-indexar toda la base de datos de vectores en Supabase.

### 4. Uso de Gemini 1.5 Pro para Tareas Complejas
**Análisis:** Para el 90% de las tareas, Flash es suficiente.
- **Recomendación:** Reservar **Gemini 1.5 Pro** solo para la "Análisis Inicial de Propiedad" (cuando se suben muchos manuales a la vez) por su razonamiento superior, y usar **Flash** para el día a día del huésped.

## Resumen del Impacto
| Métrica | Estado Actual | Con Optimización | Mejoría |
| :--- | :--- | :--- | :--- |
| **Coste Promedio por Guía** | $0.15 - $0.20 | $0.04 - $0.05 | **-72%** |
| **Latencia** | Rápida (Haiku) | Ultra-Rápida (Flash) | Similar |
| **Precisión Datos Reales** | Buena (Brave) | Excelente (Google Search) | Superior |

---
**Nota sobre Claude 4.5/Sonnet:** Estos modelos son excelentes para desarrollo o razonamiento lógico extremo, pero para una aplicación de cara al público con alto volumen de peticiones cortas, los modelos "Flash" o "Haiku" son la opción profesional técnica y financieramente más responsable.
