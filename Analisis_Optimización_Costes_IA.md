# Análisis de Optimización de Costes IA - GuideFlow (Actualizado Feb 2026)

Tras analizar el uso de las APIs y las últimas implementaciones técnicas,
GuideFlow ha evolucionado hacia un sistema de **coste operativo marginal**,
optimizando cada llamada a la IA mediante capas de seguridad y eficiencia.

## Comparativa de Modelos y Estrategia

| Componente           | Modelo Actual        | Estrategia de Ahorro                 | Estado     |
| :------------------- | :------------------- | :----------------------------------- | :--------- |
| **Chat & RAG**       | **Gemini 2.0 Flash** | Streaming + Bajo Temperature (0.1)   | **ACTIVO** |
| **Traducciones**     | **Gemini 2.0 Flash** | Caché multi-nivel (L1/L2) + SHA-256  | **ACTIVO** |
| **Ingesta de Datos** | Gemini 1.5 Flash     | Extracción estructurada (OCR/Vision) | **ACTIVO** |
| **Embeddings**       | OpenAI text-3-small  | Persistencia en Supabase (Vector)    | Óptimo     |

## Principales Optimizaciones Implementadas

### 1. Sistema de Caché de Traducción Multi-nivel (Fases 15/17)

Se ha implementado un servicio de traducción especializado
(`TranslationService`) que evita re-traducir frases idénticas:

- **L1 (Memoria):** Caché rápida en el Edge Runtime para respuestas inmediatas.
- **L2 (Base de Datos):** Tabla `translation_cache` en Supabase que almacena
  traducciones persistentes.
- **Seguridad SHA-256:** Generación de hashes únicos combinando
  `texto + idioma + property_id` para garantizar aislamiento absoluto entre
  clientes.
- **Impacto:** Reducción del ~60% en el volumen de tokens enviados a la API de
  traducción para frases recurrentes del sistema.

### 2. Seguridad y Control de Gasto: Rate Limiting de 4 Capas

Para evitar picos de costes por abusos o ataques, el sistema implementa un
filtrado estricto en `RateLimiter`:

1. **Nivel IP:** Límite por conexión para evitar bots.
2. **Nivel Token (Minuto):** Protección contra ráfagas (burst protection).
3. **Nivel Token (Diario):** Límite máximo de mensajes por reserva (Cost
   Protection).
4. **Nivel Dispositivo:** Huella digital (`Device Fingerprint`) basada en IP +
   User Agent para evitar bypass de tokens.

### 3. RAG Adaptativo y Cross-lingual

El sistema de Recuperación Aumentada (RAG) se ha optimizado en
`api/chat/route.ts`:

- **Búsqueda en Español Forzada:** El sistema traduce la consulta del usuario al
  español antes de buscar en el vector de manuales (indexados principalmente en
  español). Esto mejora la relevancia y reduce el desperdicio de tokens en
  respuestas erróneas.
- **Umbrales Dinámicos:** Se ajusta el `match_count` (25-30) y el
  `match_threshold` según si se detecta un código de error técnico o una
  pregunta general.
- **Priorización de Notas:** El motor prioriza "Fragmentos Enriquecidos"
  (instrucciones manuales del anfitrión) sobre manuales genéricos de
  fabricantes.

### 4. Grounding Basado en Confianza (Hybrid Search)

En lugar de llamar siempre a APIs de búsqueda externa (Brave Search), GuideFlow
ahora:

- Evalúa la similitud del RAG. Si la confianza es alta (>0.5), **suprime** la
  búsqueda externa.
- Solo recurre al "Brave Fallback" en consultas de fallos específicos donde el
  manual local no tiene respuesta, minimizando los costes de la API de Brave.

## Resumen de Impacto Financiero

| Métrica                    | Estado Anterior | Estado Actual (Gemini 2.0 + Caché) | Mejora        |
| :------------------------- | :-------------- | :--------------------------------- | :------------ |
| **Coste por 1M de tokens** | $0.25 (Haiku)   | **$0.075 (2.0 Flash)**             | **-70%**      |
| **Eficiencia de Caché**    | 0%              | **40-60% (Traducciones/UI)**       | Significativa |
| **Fugas de Coste (Abuso)** | Alta            | **Mínima (Rate Limit 4 capas)**    | Blindado      |

---

**Nota Técnica:** La migración a **Gemini 2.0 Flash** ha permitido mantener la
latencia por debajo de los 1.5s en streaming, incluso con el sistema de
traducción semántica activo entre capas.
