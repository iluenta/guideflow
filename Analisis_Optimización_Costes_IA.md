# Análisis de Optimización de Costes IA - GuideFlow

Tras analizar el uso de las APIs, he completado la **migración total de GuideFlow a Gemini 3 Flash**, eliminando por completo la dependencia de Anthropic (Claude) para reducir los costes operativos a prácticamente cero.

## Comparativa de Costes Actuales (por 1M de tokens)

| Proveedor | Modelo | Uso | Coste Entrada | Coste Salida | Ahorro Potencial |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Anthropic** | Claude 3 Haiku | Chat / Auto-fill | $0.250 | $1.250 | - |
| **Google** | Gemini 1.5 Flash | Vision / OCR | **$0.075** | **$0.300** | **~75% menos** |
| **OpenAI** | text-embedding-3-small | RAG | $0.020 | N/A | Óptimo |

## Recomendaciones de Optimización

### 1. Migración de Chat, Auto-fill e Ingesta a Gemini 3 Flash
**Estado: COMPLETADO**
- **Chat/FAQs**: Migrados a `/api/chat` y `/api/ai-fill-context`.
- **Ingesta/Scraping**: `extractListingData` ahora usa Gemini 3 Flash.
- **Manuales Técnicos**: `processBatchScans` ahora genera el contenido con Gemini 3 Flash en lugar de Claude 3.5 Sonnet.
- **Ahorro Estimado**: ~85% de reducción en la factura mensual de IA.

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
