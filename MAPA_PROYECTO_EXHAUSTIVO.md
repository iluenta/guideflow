# Documentación Técnica Exhaustiva de Hospyia (Archivo por Archivo)

Este documento detalla la función específica de cada archivo en el repositorio, organizado por directorios.

## 📂 Directorio Raíz (`/`)

- **`.editorconfig`**: Define reglas de formato para el editor (indentación, saltos de línea).
- **`.env.example`**: Guía pública de las variables de entorno necesarias.
- **`.env.local`**: Variables de interfaz local (URL de Supabase, Keys, etc.).
- **`.gitignore`**: Especifica qué archivos no deben rastrearse en el repositorio de Git.
- **`.npmrc`**: Configuración de NPM para la instalación de dependencias.
- **`Analisis_Optimizacion_Costes_IA.md`**: Informe detallado sobre el consumo de tokens y ahorro en APIs de IA.
- **`build_output.txt`**: Registro de salida de la última compilación del proyecto.
- **`CAMBIOS_LOCAL_VS_RELEASE2_0.md`**: Log de cambios entre el entorno local y la versión 2.0.
- **`CAMBIOS_MAIN_VS_RELEASE2_0.md`**: Diferencias acumuladas en la rama main respecto a la release.
- **`components.json`**: Configuración de Shadcn UI (rutas de alias y temas).
- **`context_dump.json`**: Captura del estado del sistema para depuración de estados complejos.
- **`dev_login_debug.txt`**: Trazabilidad detallada del script de acceso administrativo.
- **`DOCUMENTACION_FUNCIONAL.md`**: Resumen general de alto nivel del proyecto.
- **`Documentacion_IA.md`**: Especificaciones sobre prompts, modelos y lógica de Inteligencia Artificial.
- **`manuals_compare.json`**: Datos de prueba comparativos entre versiones de manuales.
- **`manuals_final_compare.json`**: Resultado final de la validación de comparación de manuales.
- **`middleware.ts`**: Interceptor global de Next.js para seguridad y gestión de sesiones Supabase.
- **`models_list.json`**: Configuración estructurada de los modelos de IA disponibles (Gemini, GPT).
- **`models.txt`**: Lista simple de identificadores de modelos utilizados.
- **`next-env.d.ts`**: Definiciones de tipos automáticas para Next.js.
- **`next.config.mjs`**: Archivo de configuración principal del framework (Next.js).
- **`output_link.txt`**: Registro de URLs generadas dinámicamente.
- **`package.json`**: Lista de dependencias, metadatos y scripts de comando.
- **`package-lock.json`**: Árbol de dependencias exacto para instalaciones deterministas.
- **`pnpm-lock.yaml`**: Archivo de bloqueo para entornos que utilicen el gestor PNPM.
- **`postcss.config.mjs`**: Configuración de procesado de CSS para Tailwind y prefijos.
- **`PropertySetupWizard_main.txt`**: Dump de texto del estado actual del asistente de propiedades.
- **`proxy.ts`**: Script opcional para configuración de proxies locales.
- **`README.md`**: Introducción general y guía de inicio del proyecto.
- **`run_git.ps1`**: Script de automatización de operaciones Git comunes.
- **`setupTests.ts`**: Inicializador del entorno de ejecución para pruebas automatizadas.
- **`tsconfig.json`**: Reglas de compilación y resolución de módulos de TypeScript.
- **`vercel.json`**: Directivas de configuración para el despliegue en Vercel.
- **`vitest.config.ts`**: Configuración de la suite de tests de unidad e integración.

---

## 📂 `app/` (Rutas y Páginas)

- **`layout.tsx`**: Define el envoltorio visual común (fuentes, temas) de toda la app.
- **`page.tsx`**: Página de inicio (Landing Page) del sitio público.
- **`not-found.tsx`**: Manejador universal de errores 404.
- **`globals.css`**: Estilos globales y capas de Tailwind CSS.
- **`[slug]/page.tsx`**: Página dinamica donde el huésped consulta la guía de su alojamiento.
- **`access-denied/page.tsx`**: Página informativa para falta de permisos.

### `app/actions/` (Server Actions)
- **`ai-ingestion.ts`**: Procesa y estructura información de alojamientos usando IA.
- **`analytics.ts`**: Funciones para registrar y consultar métricas de uso.
- **`auth.ts`**: Gestión de Login, Registro y Logout del lado del servidor.
- **`chat.ts`**: Lógica de backend para el chat de asistencia al usuario.
- **`guest-access.ts`**: Generación y seguridad de accesos para visitantes.
- **`manual-enrichment.ts`**: Lógica de edición asistida para el anfitrión.
- **`manual-ingestion.ts`**: Entrada de datos manual sin procesamiento IA.
- **`properties.ts`**: Control total (CRUD) de la entidad "Propiedad".
- **`rag-sync.ts`**: Sincronización de contenidos con la base de datos vectorial.
- **`reauthentication.ts`**: Fuerza la validación de usuario antes de tareas críticas.
- **`wizard.ts`**: Mantiene el estado persistente del asistente de configuración.

### `app/api/` (Rutas de API)
- **`api/auth/profile/route.ts`**: Retorna el perfil completo del usuario autenticado.
- **`api/chat/route.ts`**: Endpoint de comunicación para el chatbot IA.
- **`api/translate-guide/route.ts`**: Servicio backend que traduce toda la guía a un nuevo idioma.
- **`api/ai-fill-context/route.ts`**: Rellena datos automáticamente a partir de una URL externa.

---

## 📂 `lib/` (Núcleo y Utilidades)

### `lib/ai/` (Motores de Inteligencia Artificial)
- **`brave.ts`**: Cliente para la búsqueda de información externa vía Brave Search.
- **`embeddings.ts`**: Generador de vectores para el motor de búsqueda semántica.
- **`gemini-rest.ts`**: Implementación de llamadas a Google Gemini vía REST API.
- **`intent-classifier.ts`**: Detecta qué quiere el usuario en base a su lenguaje natural.
- **`mapbox.ts`**: Herramientas de geocodificación y renderizado de mapas.
- **`openai.ts`**: Integración con las APIs de OpenAI.

### `lib/discovery/` (Búsqueda de Servicios)
- **`airports.ts`**: Filtra y selecciona los aeropuertos más relevantes según la posición.
- **`airports-fallback.ts`**: Datos estáticos de aeropuertos para redundancia.
- **`stations.ts`**: Localiza paradas de metro y tren cercanas a la propiedad.
- **`transit-search.ts`**: Orquesta la búsqueda combinada de transporte (vuelos + tren + bus).

### `lib/supabase/` (Capa de Datos)
- **`client.ts`**: Cliente Supabase para Browser.
- **`server.ts`**: Cliente Supabase para Server Components.
- **`middleware.ts`**: Helper para manejar sesiones en el middleware de Next.js.
- **`admin.ts`**: Operaciones privilegiadas con Service Role.
- **`edge.ts`**: Adaptador para despliegue en Edge Runtime.

### `lib/` (Utilidades Varias)
- **`arrival/generator-final.ts`**: Generador de instrucciones de llegada paso a paso.
- **`color-harmonizer.ts`**: Crea paletas de colores basadas en una imagen o marca.
- **`translation-service.ts`**: Motor principal de gestión de traducciones.
- **`utils.ts`**: Funciones comunes de JavaScript/React (cn, formatting).
- **`themes.ts` / `guide-theme.ts`**: Lógica de personalización visual de las guías.

---

## 📂 `components/` (Interfaz de Usuario)

### `components/guide/` (Vista del Huésped)
- **`CheckInView.tsx`**: Instrucciones visuales para el registro de entrada.
- **`EnglishCheckInView.tsx`**: (Variante) Versión específica para inglés del check-in.
- **`EmergencyView.tsx`**: Contactos de emergencia y localización de servicios.
- **`GuestChat.tsx`**: Componente de chat interactivo para el visitante.
- **`GuideHome.tsx`**: Página de inicio de la guía con acceso a todas las secciones.
- **`HouseInfoView.tsx`**: Detalles técnicos de la vivienda (enchufes, basura, etc.).
- **`WifiView.tsx`**: Muestra claramente el QR y claves de internet.

### `components/dashboard/` (Vista del Anfitrión)
- **`wizard/`**: Carpeta con todos los pasos del asistente (StepProperty, StepWifi, etc.).
- **`PropertyCard.tsx`**: Tarjeta resumen de un alojamiento en el dashboard.
- **`MapPreview.tsx`**: Previsualización del mapa de ubicación.

---

## 📂 `hooks/` (Ganchos de React)

- **`use-auth.ts`**: Estado reactivo de la sesión de usuario.
- **`use-user-profile.ts`**: Carga y gestiona los datos del perfil del usuario.
- **`useLocalizedContent.ts`**: Proporciona traducciones automáticas al componente.
- **`useWeather.ts`**: Obtiene el clima en tiempo real para una ubicación.

---

## 📂 `supabase/` (Base de Datos)

- **`migrations/`**: Carpeta con archivos SQL de creación y modificación de tablas.
- **`functions/`**: Código fuente de las Edge Functions (backend serverless).

## 📂 `__tests__` (Pruebas Automatizadas)

- **`security/`**: Tests de penetración y política de seguridad (RLS, XSS).
- **`unit/`**: Tests de lógica individual de componentes y funciones lib.
