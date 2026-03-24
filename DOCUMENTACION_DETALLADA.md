# Guía Exhaustiva de la Estructura de GuideFlow

Este documento proporciona un desglose detallado, archivo por archivo, de todo el proyecto GuideFlow (excluyendo bibliotecas externas y dependencias temporales).

## 📄 Archivos en la Raíz (Configuración y Herramientas)

- **`.editorconfig`**: Configuración del editor para mantener estilos de código consistentes (espacios, saltos de línea).
- **`.env.example`**: Plantilla pública de las variables de entorno necesarias para que el proyecto funcione.
- **`.env.local`**: Variables de entorno privadas (secreto local, no subido a Git).
- **`.gitignore`**: Lista de archivos y carpetas que Git debe ignorar (node_modules, .next, etc.).
- **`.npmrc`**: Configuración de comportamiento de NPM para la instalación de dependencias.
- **`Analisis_Optimizacion_Costes_IA.md`**: Informe sobre el consumo y la optimización de costes de las APIs de IA.
- **`build_output.txt`**: Archivo temporal con los logs de salida del proceso de construcción (build).
- **`CAMBIOS_LOCAL_VS_RELEASE2_0.md`**: Registro de diferencias entre el código local y la versión "Release 2.0".
- **`CAMBIOS_MAIN_VS_RELEASE2_0.md`**: Registro de diferencias entre la rama principal y la "Release 2.0".
- **`components.json`**: Configuración de Shadcn UI que define dónde se instalan los componentes y estilos.
- **`context_dump.json`**: Volcado de datos de estado global para tareas de depuración profunda.
- **`dev_login_debug.txt`**: Registro de errores y trazabilidad del script de login para desarrolladores.
- **`DOCUMENTACION_FUNCIONAL.md`**: Documento resumen de las funciones principales del sistema.
- **`Documentacion_IA.md`**: Especificaciones sobre el uso de LLMs, prompts y flujos de IA en el proyecto.
- **`manuals_compare.json` / `manuals_final_compare.json`**: Datos JSON resultantes de pruebas de comparación entre manuales de usuario.
- **`middleware.ts`**: Lógica de interceptación de peticiones de Next.js. Maneja la sesión de Supabase y redirecciones de seguridad.
- **`models_list.json` / `models.txt`**: Listado de modelos de IA compatibles y configurados para el generador.
- **`next-env.d.ts`**: Tipos de TypeScript generados automáticamente para las funciones de Next.js.
- **`next.config.mjs`**: Configuración central del framework Next.js (dominios, headers, optimizaciones).
- **`package.json` / `package-lock.json`**: Definición de scripts, dependencias y versiones de librerías del proyecto.
- **`pnpm-lock.yaml`**: Archivo de bloqueo para el gestor de paquetes PNPM.
- **`postcss.config.mjs`**: Configuración de PostCSS para procesar estilos CSS con Tailwind.
- **`PropertySetupWizard_main.txt`**: Log de texto con el estado interno del asistente de configuración de propiedades.
- **`proxy.ts`**: Configuración de proxy para redirigir tráfico en entornos de desarrollo local.
- **`README.md`**: Archivo de presentación y bienvenida del repositorio.
- **`run_git.ps1`**: Script de automatización de comandos Git para Windows (PowerShell).
- **`setupTests.ts`**: Configuración del entorno de pruebas unitarias.
- **`tsconfig.json`**: Definición de reglas y opciones del compilador de TypeScript.
- **`vercel.json`**: Configuración específica para el despliegue automático en la plataforma Vercel.
- **`vitest.config.ts`**: Configuración de la suite de pruebas Vitest.

---

## 📂 `app/` (Lógica de Navegación y Rutas)

### Rutas Dinámicas y Páginas
- **`[slug]/page.tsx`**: Página principal del Huésped. Carga la guía personalizada según el slug de la propiedad.
- **`access-denied/page.tsx`**: Vista de error 403 para accesos no autorizados.
- **`app/layout.tsx`**: Proveedor de fuentes, temas y estilos globales de la aplicación.
- **`app/page.tsx`**: Home comercial de GuideFlow (Landing Page).
- **`not-found.tsx`**: Página de error 404 personalizada.

### Acciones de Servidor (`app/actions/`)
- **`ai-ingestion.ts`**: Lógica para transformar texto crudo en datos estructurados de alojamiento usando IA.
- **`analytics.ts`**: Consultas a la base de datos para generar reportes de uso.
- **`auth.ts`**: Manejo de Login, Registro y Cierre de Sesión.
- **`chat.ts`**: Gestión de mensajes y contexto del chat del asistente de la guía.
- **`guest-access.ts`**: Creación de tokens de acceso efímeros para los huéspedes.
- **`manual-enrichment.ts`**: Edición y mejora manual de los datos de la propiedad.
- **`manual-ingestion.ts`**: Procesado de entradas de datos no-IA en el asistente.
- **`properties.ts`**: Gestión completa de alojamientos (Crear, Editar, Listar, Borrar).
- **`rag-sync.ts`**: Sincronización de información con vectores de búsqueda para el chatbot.
- **`reauthentication.ts`**: Validación de contraseña para acciones de alta seguridad.
- **`wizard.ts`**: Gestión del progreso del usuario en el asistente de configuración inicial.

### Endpoints de API (`app/api/`)
Controladores backend para peticiones AJAX y servicios externos.
- **`api/ai-fill-context/route.ts`**: Rellenado automático de campos basado en la URL de Booking/Airbnb.
- **`api/auth/profile/route.ts`**: Devuelve los datos del perfil del usuario logueado.
- **`api/chat/route.ts`**: Conexión con el modelo de lenguaje para el chat interactivo.
- **`api/translate-guide/route.ts`**: Orquestación de traducciones para múltiples idiomas de la guía.

---

## 📂 `components/` (Interfaz de Usuario)

### `dashboard/`
- **`wizard/`**: Una extensa colección de secciones (`ManualsSection.tsx`) y pasos (`StepCheckin.tsx`, `StepWifi.tsx`, etc.) que componen el flujo de configuración de la guía.
- **`MapPreview.tsx`**: Visualizador dinámico de mapas para la ubicación de la propiedad.
- **`PropertySetupWizard.tsx`**: Componente contenedor del asistente de configuración.

### `guide/` (Vista del Huésped)
- **`CheckInView.tsx`**: Detalles y fotos para el proceso de entrada.
- **`GuestChat.tsx`**: Interfaz de chat flotante para el huésped.
- **`WifiView.tsx`**: Visualización clara de los datos de conexión a internet.
- **`MenuGrid.tsx`**: Rejilla de navegación principal de la guía móvil.

---

## 📂 `lib/` (Núcleo de la Aplicación)

- **`ai/`**: Motores de búsqueda y conectores con Gemini, OpenAI y Brave Search.
- **`arrival/`**: `generator-final.ts` contiene el algoritmo de generación de rutas paso a paso.
- **`discovery/`**: Lógica de búsqueda de estaciones de tren, aeropuertos y paradas de bus cercanas.
- **`supabase/`**: Clientes de servidor, cliente y middleware para la comunicación con Supabase.
- **`translation-service.ts`**: Lógica para manejar el almacenamiento y recuperación de traducciones.

---

## 📂 `hooks/` (Lógica Compartida de UI)

- **`use-user-profile.ts`**: Sincroniza los datos del usuario entre el servidor y la interfaz.
- **`useLocalizedContent.ts`**: Hook para mostrar el contenido en el idioma preferido del huésped.
- **`useWeather.ts`**: Servicio meteorológico integrado para la guía.

---

## 📂 `documentacion/` (Guías de Mantenimiento)

- **`JWT_EXPIRATION.md`**: Detalles sobre la expiración y renovación de tokens.
- **`SECURITY_AUDIT.md`**: Reporte de auditoría de seguridad y Row Level Security.
- **`SUPABASE_SETUP.md`**: Instrucciones para la configuración inicial de la base de datos.
- **`TROUBLESHOOTING.md`**: Guía de resolución de errores comunes.
