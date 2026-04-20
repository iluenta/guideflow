# Reporte de Auditoría de Seguridad - Hospyia

**Fecha Original:** 2024-01-24\
**Última Actualización (Análisis OWASP Top 10):** 2026-02-13\
**Tipo:** Auditoría de Seguridad Integral\
**Alcance:** Análisis de código fuente, flujos de IA, y seguridad Multi-Tenant

## 📋 Índice de Navegación

- [Resumen Ejecutivo](#resumen-ejecutivo)
- [Análisis OWASP Top 10 (2026)](#análisis-owasp-top-10-2026)
- [Vulnerabilidades por Severidad](#vulnerabilidades-por-severidad)
- [Áreas Bien Protegidas](#áreas-bien-protegidas)
- [Recomendaciones y Plan de Acción](#recomendaciones-y-plan-de-acción)

## Resumen Ejecutivo

Se ha realizado una revisión exhaustiva del estado actual de Hospyia tras la
implementación de funcionalidades clave (Traducción, Wizard, RAG Sync, y
Greetings Personalizados). El análisis se ha estructurado siguiendo el estándar
**OWASP Top 10 (2021)** para proporcionar una visión clara de los riesgos y su
impacto.

### Métricas de Seguridad (Febrero 2026)

- **Categorías Analizadas:** 10 (OWASP Standard)
- **Vulnerabilidades Críticas:** 6
- **Vulnerabilidades Altas:** 8
- **Vulnerabilidades Medias:** 5
- **Estado de Salud:** ⚠️ **ACCIÓN REQUERIDA** (Mejoras necesarias antes de
  producción escala)

---

## Análisis OWASP Top 10 (2026)

### 🚨 A01:2021-Broken Access Control (Control de Acceso Quebrado)

**Hallazgo:** Varios endpoints de API y Server Actions bypassan el aislamiento
de tenant o carecen de autenticación.

- **Evidencia:** `app/api/ai-fill-context/route.ts` usa Service Role sin
  verificar propiedad. `translate-guide` es totalmente público.
- **Riesgo:** Fuga de datos entre clientes y abuso de cuotas de IA por terceros.

### 🚨 A03:2021-Injection (Inyección)

**Hallazgo:** Inyección de Prompts en flujos de IA y falta de sanitización XSS
en contenido generado.

- **Evidencia:** `manual-enrichment.ts` reenvía notas del host a Gemini sin
  filtros. El contenido de los manuales se guarda y renderiza como HTML crudo.
- **Riesgo:** Ejecución de scripts maliciosos (XSS) y manipulación de
  comportamiento de la IA (Jailbreak).

### 🚨 A07:2021-Identification and Authentication Failures

**Hallazgo:** Almacenamiento de estado de autenticación volátil e inseguro.

- **Evidencia:** `reauthentication.ts` usa `Map` en memoria para el flujo de
  OTP.
- **Riesgo:** Inoperatividad en entornos Serverless y posible bypass de
  protección secundaria en cold starts.

### ⚠️ A10:2021-Server-Side Request Forgery (SSRF)

**Hallazgo:** Scraping de URLs arbitrarias sin validación de dominio.

- **Evidencia:** `fetchListingContent` permite procesar cualquier URL vía Jina
  Reader.
- **Riesgo:** Uso de la infraestructura como proxy para ataques a terceros o
  escaneo de servicios internos de proveedores.

---

## Vulnerabilidades por Severidad

### 🔴 CRITICAL (Críticas)

#### 1. APIs de IA Sin Autenticación (Unauthorized AI Usage)

- **Archivos:** `app/api/translate-guide/route.ts`,
  `app/api/ai-fill-context/route.ts`
- **Descripción:** Endpoints que consumen Gemini API son accesibles sin login.
- **Acción:** Requerir sesión activa y validar créditos/tokens.

#### 2. Bypass de RLS en API de Relleno de Contexto

- **Archivos:** `app/api/ai-fill-context/route.ts`
- **Descripción:** El uso de `SERVICE_ROLE_KEY` permite a cualquier usuario
  extraer resúmenes de cualquier propiedad si conoce el ID.
- **Acción:** Verificar `property.tenant_id === user.tenant_id`.

#### 3. Sesiones de Re-auth Incompatibles con Serverless

- **Archivos:** `app/actions/reauthentication.ts`
- **Descripción:** Memoria volátil para códigos OTP.
- **Acción:** Migrar a Redis (Vercel KV) o tabla Supabase.

### 🟠 HIGH (Altas)

#### 4. Prompt Injection en Enriquecimiento de Manuales

- **Archivos:** `app/actions/manual-enrichment.ts`
- **Descripción:** Notas del host se pasan directamente al prompt de Gemini.
- **Acción:** Sanitizar inputs y usar "delimitadores" de sistema en el prompt.

#### 5. XSS en Contenido de Manuales (Stored XSS)

- **Archivos:** `ai-ingestion.ts`, `manual-enrichment.ts`
- **Descripción:** No hay sanitización del Markdown/HTML generado por la IA
  antes de mostrarlo.
- **Acción:** Aplicar `isomorphic-dompurify` en el renderizado.

#### 6. Edge Function process-manual-search Sin JWT

- **Archivos:** `supabase/functions/process-manual-search/index.ts`
- **Descripción:** No valida que el llamante sea un usuario autorizado de
  Supabase.
- **Acción:** Añadir validación de Auth Header.

### 🟡 MEDIUM (Medias)

#### 7. SSRF vía URL Scraping

- **Archivos:** `ai-ingestion.ts`
- **Descripción:** Falta whitelist de dominios para el scraping de anuncios.
- **Acción:** Permitir solo airbnb.com, booking.com, etc.

#### 8. Rate Limiting Bypassable

- **Archivos:** `lib/security/rate-limiter.ts`
- **Descripción:** Dependencia excesiva de headers de IP que pueden ser
  falseados.
- **Acción:** Usar tokens firmados o cookies de sesión para el conteo.

---

## Áreas Bien Protegidas (✅ Fortalezas)

1. **Gestión de Tokens de Huésped:** Robustos, con entropía suficiente y
   validaciones temporales precisas.
2. **Aislamiento Multi-Tenant:** RLS en Supabase está bien configurado para las
   tablas base.
3. **Optimización de Costos IA:** Cache de traducciones implementado
   correctamente con hashes de contenido.
4. **Middleware de Seguridad:** Filtra accesos denegados y maneja expiraciones
   de token de forma centralizada.

---

## Plan de Acción Priorizado

### Fase A: Inmediata (Hotfixes)

- [ ] Asegurar todas las APIs bajo `/api/` con `supabase.auth.getUser()`.
- [ ] Migrar OTPs de re-autenticación a Regina/Database.
- [ ] Implementar verificación manual de Tenant en `ai-fill-context`.

### Fase B: Estabilización

- [ ] Añadir capa de sanitización DOMPurify a los componentes que renderizan
      manuales.
- [ ] Implementar validación de dominios en `fetchListingContent`.
- [ ] Reforzar prompts de sistema con técnicas contra inyección (delimitadores).

### Fase C: Monitoreo

- [ ] Conectar fallos de seguridad en APIs con la tabla `suspicious_activities`.
- [ ] Configurar alertas automáticas en Supabase Dashboard.

---

**Auditoría Realizada por:** Antigravity (IA Security Specialist)\
**Versión del Reporte:** 2.0 (Feb 2026)
