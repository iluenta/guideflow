# Documentación de Suministro de IA - GuideFlow

Este documento detalla el uso de las diferentes APIs de Inteligencia Artificial integradas en el proyecto GuideFlow, sus modelos y su propósito específico.

## 1. Google Gemini (Primary Engine)
Utilizado para el procesamiento de imágenes, documentos complejos y generación de texto optimizada. Reemplaza a Anthropic Claude para reducir latencia y costes.

*   **Modelos:** `gemini-2.0-flash` (Principal) / `gemini-2.0-pro-exp-02-05` (Análisis avanzado).
*   **Funcionalidades:**
    *   **Asistente Digital (Chat):** Responde preguntas de huéspedes basadas en el contexto de la propiedad.
    *   **Escáner Visual / OCR:** Analiza fotos de manuales físicos o electrodomésticos para identificar modelos y extraer instrucciones de uso.
    *   **Generación de Texto:** Procesa consultas de chat y auto-rellenado de contexto con baja latencia.
    *   **Búsqueda con Grounding:** Utiliza la búsqueda de Google integrada para validar datos reales.

## 2. OpenAI
Utilizado para la infraestructura de búsqueda semántica (RAG).

*   **Modelo:** `text-embedding-3-small`.
*   **Funcionalidades:**
    *   **Búsqueda Unificada:** Genera vectores (embeddings) de 1536 dimensiones para manuales, FAQs y contexto de la propiedad.
    *   **Recuperación (Retreival):** Permite que el chat encuentre la información más relevante en milisegundos mediante comparación vectorial en Supabase (`pgvector`).

## 3. Brave Search API (Fallback Grounding)
Utilizado para la veracidad de datos externos cuando no se usa el grounding nativo de Gemini.

*   **Funcionalidad:**
    *   **Grounding Local:** Proporciona datos en tiempo real sobre negocios locales, horarios y precios para asegurar que las recomendaciones de la IA sean vigentes y reales (`lib/ai/brave.ts`).

*   **Funcionalidad:**
    *   **Grounding Local:** Proporciona datos en tiempo real sobre negocios locales, horarios y precios para asegurar que las recomendaciones de la IA sean vigentes y reales (`lib/ai/brave.ts`).

---

## Arquitectura de Flujo de IA (Optimizada)

```mermaid
graph TD
    A[Usuario / Host] --> B{Interfaz}
    B -->|Pregunta Chat| C[OpenAI Embeddings]
    C --> D[Supabase Vector Search]
    D --> E[Gemini 2.0 Flash]
    E -->|Respuesta Stream| B
    
    B -->|Foto Manual| F[Gemini 2.0 Flash]
    F -->|OCR / Estructuración| G[Gemini 2.0 Flash]
    G --> H[Almacenamiento Vectorial]
    
    B -->|Auto-Rellenar| I[Google Search Grounding]
    I --> J[Gemini 2.0 Flash]
    J -->|Sugerencia Estructurada| B
```
