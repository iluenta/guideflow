# Inventario Funcional Absoluto de GuideFlow

Este documento contiene la descripción uno-a-uno de cada archivo presente en el proyecto.

## 📄 Archivos de Configuración (Raíz)

1.  **`.editorconfig`**: Establece la configuración de indentación y formato para el editor de código.
2.  **`.env.example`**: Plantilla pública de variables de entorno requeridas.
3.  **`.env.local`**: Configuración privada de claves de API y DB (local).
4.  **`.gitignore`**: Define archivos y carpetas excluidos del control de versiones.
5.  **`.npmrc`**: Configura el comportamiento de NPM durante la instalación.
6.  **`all_files_absolute.txt`**: (Temporal) Listado crudo de archivos del sistema.
7.  **`all_files_utf8.txt`**: (Temporal) Listado codificado de archivos del sistema.
8.  **`Analisis_Optimizacion_Costes_IA.md`**: Informe sobre eficiencia y costes de LLMs.
9.  **`build_output.txt`**: Registro de logs del proceso de build de Next.js.
10. **`CAMBIOS_LOCAL_VS_RELEASE2_0.md`**: Diferencias entre entorno local y versión 2.0.
11. **`CAMBIOS_MAIN_VS_RELEASE2_0.md`**: Diferencias entre rama main y release 2.0.
12. **`components.json`**: Configuración de arquitectura de la librería Shadcn UI.
13. **`context_dump.json`**: Respaldo de contexto de depuración del sistema.
14. **`dev_login_debug.txt`**: Logs de depuración del sistema de acceso administrativo.
15. **`DOCUMENTACION_DETALLADA.md`**: Resumen técnico de la arquitectura.
16. **`DOCUMENTACION_FUNCIONAL.md`**: Resumen de alto nivel para usuarios y negocio.
17. **`Documentacion_IA.md`**: Guía técnica de prompts y modelos de IA.
18. **`env.local`**: (Variante) Archivo de variables de entorno adicionales.
19. **`manuals_compare.json`**: Datos JSON para la lógica de comparación de manuales.
20. **`manuals_final_compare.json`**: Resultado final del proceso de comparación de manuales.
21. **`MAPA_PROYECTO_EXHAUSTIVO.md`**: Mapa descriptivo de la estructura del proyecto.
22. **`middleware.ts`**: Lógica de interceptación de rutas para Auth y Seguridad.
23. **`models.txt`**: Listado simple de modelos de lenguaje utilizados.
24. **`models_list.json`**: Configuración detallada de capacidades de modelos de IA.
25. **`next-env.d.ts`**: Tipos globales autogenerados de Next.js.
26. **`next.config.mjs`**: Configuración del motor de Next.js (headers, imágenes, etc).
27. **`output_link.txt`**: Registro de enlaces generados por el sistema.
28. **`package-lock.json`**: Árbol inmutable de dependencias instaladas.
29. **`package.json`**: Definición de scripts, versiones y metadatos del proyecto.
30. **`pnpm-lock.yaml`**: Bloqueo de versiones si se usa el gestor PNPM.
31. **`postcss.config.mjs`**: Configuración de PostCSS para el procesado de estilos.
32. **`PropertySetupWizard_main.txt`**: Log de auditoría del estado del Wizard.
33. **`proxy.ts`**: Script de configuración de proxy local para APIs.
34. **`README.md`**: Documentación principal del repositorio.
35. **`run_git.ps1`**: Script PowerShell para automatizar flujos de Git.
36. **`setupTests.ts`**: Configuración inicial del entorno de testing.
37. **`tsconfig.json`**: Reglas de tipado y rutas de alias de TypeScript.
38. **`vercel.json`**: Ajustes de despliegue y redirecciones para Vercel.
39. **`vitest.config.ts`**: Configuración de la herramienta de pruebas Vitest.

---

## 📂 `app/` (Enrutamiento y Vistas)

40. **`app/globals.css`**: Estilos globales y utilidades de Tailwind CSS.
41. **`app/layout.tsx`**: Contenedor principal de la aplicación (Providers y Fuentes).
42. **`app/not-found.tsx`**: Página de error 404 personalizada.
43. **`app/page.tsx`**: Página de aterrizaje comercial (Landing Page).
44. **`app/access-denied/page.tsx`**: Página de aviso para accesos no autorizados.

### Actions (`app/actions/`)
45. **`ai-ingestion.ts`**: Transforma contenido externo en datos estructurados vía IA.
46. **`analytics.ts`**: Consultas y registro de métricas de uso del sistema.
47. **`auth.ts`**: Lógica de servidor para autenticación de usuarios.
48. **`chat.ts`**: Gestión de mensajes y contexto para el asistente IA.
49. **`guest-access.ts`**: Crea y gestiona los links de acceso para huéspedes.
50. **`manual-enrichment.ts`**: Acción para mejorar datos de guías manualmente.
51. **`manual-ingestion.ts`**: Procesado de manuales y textos sin motor pesado de IA.
52. **`properties.ts`**: Operaciones CRUD principales para las propiedades.
53. **`rag-sync.ts`**: Sincroniza datos de la guía con la base de datos vectorial.
54. **`reauthentication.ts`**: Re-valida al usuario para acciones críticas.
55. **`wizard.ts`**: Persiste y recupera el progreso del asistente de configuración.

### API Routes (`app/api/`)
56. **`admin/translation-stats/route.ts`**: Endpoint de métricas de traducción para admin.
57. **`ai-fill-context/route.ts`**: Endpoint que extrae info de URLs (Airbnb/Booking).
58. **`auth/callback/route.ts`**: Manejador del intercambio de tokens de sesión.
59. **`auth/profile/route.ts`**: Servicio que retorna el perfil del usuario actual.
60. **`auth/session/route.ts`**: Gestiona y refresca la sesión del usuario.
61. **`chat/route.ts`**: Endpoint principal de interacción con el asistente IA.
62. **`create-guest-access/route.ts`**: API para generar links de invitado rápidos.
63. **`translate-guide/route.ts`**: API que orquesta la traducción masiva de la guía.

### Auth Pages (`app/auth/`)
64. **`callback/page.tsx`**: Página intermedia para el flujo de login.
65. **`login/page.tsx`**: Interfaz de acceso al sistema para anfitriones.
66. **`signup/page.tsx`**: Interfaz de registro de nuevos usuarios.

### Dashboard Pages (`app/dashboard/`)
67. **`layout.tsx`**: Diseño común del panel de control (Sidebar y Navbar).
68. **`page.tsx`**: Vista de resumen y actividades recientes del dashboard.
69. **`analytics/page.tsx`**: Panel principal de visualización de métricas.
70. **`analytics/conversations/page.tsx`**: Historial detallado de interacciones del chat.
71. **`bookings/page.tsx`**: Gestión de reservas (si aplica) o listado descriptivo.
72. **`calendar/page.tsx`**: Vista de calendario de ocupación.
73. **`properties/loading.tsx`**: Estado de carga para el listado de propiedades.
74. **`properties/page.tsx`**: Listado principal de alojamientos del usuario.
75. **`properties/new/page.tsx`**: Punto de inicio para crear una nueva propiedad.
76. **`properties/[id]/landing/page.tsx`**: Página de previsualización de la guía.
77. **`properties/[id]/setup/page.tsx`**: Acceso al wizard para editar una propiedad existente.
78. **`security/page.tsx`**: Gestión de seguridad y opciones de re-autenticación.
79. **`settings/page.tsx`**: Ajustes de cuenta y preferencias del perfil.

### Otras Rutas Públicas
80. **`app/g/[token]/route.ts`**: Redirección corta para tokens de acceso de invitado.
81. **`app/p/[slug]/page.tsx`**: Ruta pública secundaria para propiedades.
82. **`app/[slug]/page.tsx`**: Visualizador principal de la guía del huésped por slug.

---

## 📂 `components/` (Componentes Visuales)

83. **`global-error-handler.tsx`**: Captura y visualiza errores inesperados en la UI.
84. **`theme-provider.tsx`**: Proveedor de contexto para el cambio entre modo claro/oscuro.

### Auth Components (`components/auth/`)
85. **`magic-link-form.tsx`**: Formulario de login sin contraseña vía email.
86. **`reauthentication-modal.tsx`**: Diálogo que solicita credenciales antes de continuar.

### Dashboard Components (`components/dashboard/`)
87. **`InventorySelector.tsx`**: Selector de electrodomésticos y servicios para la guía.
88. **`MapPreview.tsx`**: Renderizado de mapa estático/interactivo de la propiedad.
89. **`PropertySetupWizard.tsx`**: Orquestador principal del flujo paso a paso.
90. **`ThemePreviewCard.tsx`**: Previsualización en tiempo real del tema visual elegido.
91. **`TransportInfo.tsx`**: Vista resumen de la información de transporte generada.

### Wizard Core (`components/dashboard/wizard/`)
92. **`SectionView.tsx`**: Renderiza secciones específicas del wizard.
93. **`types.ts`**: Definición de interfaces y tipos para el estado del wizard.
94. **`WizardContext.tsx`**: Contexto de React que maneja el estado global del asistente.
95. **`WizardLayout.tsx`**: Estructura visual (Pasos + Contenido) del wizard.
96. **`WizardNavigation.tsx`**: Botones de Atrás/Siguiente del wizard.
97. **`WizardProgressHeader.tsx`**: Barra de progreso e indicadores de completitud.
98. **`WizardSidebar.tsx`**: Menú lateral de navegación entre pasos del wizard.
99. **`WizardStepper.tsx`**: Indicador visual de los pasos realizados y pendientes.

### Wizard Steps (`components/dashboard/wizard/steps/`)
100. **`StepAccess.tsx`**: Configuración de códigos de acceso y llaves.
101. **`StepAppearance.tsx`**: Selección de colores, temas y tipografías.
102. **`StepApplianceManuals.tsx`**: Carga y gestión de manuales de uso (PDF/Texto).
103. **`StepCheckin.tsx`**: Instrucciones detalladas de entrada al alojamiento.
104. **`StepContacts.tsx`**: Información de contacto del anfitrión y emergencias.
105. **`StepDining.tsx`**: Recomendaciones de restaurantes y locales cercanos.
106. **`StepFaqs.tsx`**: Preguntas frecuentes sobre la estancia.
107. **`StepInventory.tsx`**: Inventario de equipamiento disponible.
108. **`StepProperty.tsx`**: Datos básicos de la propiedad (nombre, tipo, foto).
109. **`StepRules.tsx`**: Normas de la casa y políticas de cancelación/estancia.
110. **`StepTech.tsx`**: Detalles técnicos (Smart TV, Altavoces, Domótica).
111. **`StepVisualScanner.tsx`**: Interfaz para escaneo visual de manuales.
112. **`StepWelcome.tsx`**: Mensaje de bienvenida inicial y guía rápida.

### Guide Components (`components/guide/`) (Vista Huésped)
113. **`BottomNav.tsx`**: Barra de navegación inferior móvil.
114. **`CheckInView.tsx`**: Pantalla de instrucciones de registro de entrada.
115. **`DynamicRecommendationWidget.tsx`**: Carrusel de sitios recomendados.
116. **`EmergencyView.tsx`**: Teléfonos y ubicaciones de emergencia.
117. **`GuestChat.tsx`**: Ventana de chat con el asistente IA.
118. **`GuideHome.tsx`**: Menú de inicio de la guía con accesos directos.
119. **`GuideViewContainer.tsx`**: Contenedor principal de la experiencia del huésped.
120. **`GuideWelcome.tsx`**: Mensaje de bienvenida animado.
121. **`HouseInfoView.tsx`**: Información sobre suministros y uso de la casa.
122. **`HowToAccordion.tsx`**: Lista desplegable de manuales de electrodomésticos.
123. **`LanguageSelector.tsx`**: Cambio dinámico de idioma de la guía.
124. **`ManualsList.tsx`**: Listado de manuales disponibles.
125. **`ManualsView.tsx`**: Detalle y visualización de un manual concreto.
126. **`MenuGrid.tsx`**: Rejilla de iconos para navegación rápida.
127. **`ModernWelcome.tsx`**: Variante moderna del mensaje de bienvenida.
128. **`PageHeader.tsx`**: Cabecera común para todas las vistas de la guía.
129. **`RecommendationsView.tsx`**: Vista completa de sitios recomendados por categorías.
130. **`RulesView.tsx`**: Normas de la casa en formato lista.
131. **`SectionRenderer.tsx`**: Selector dinámico que decide qué vista mostrar según la ruta.
132. **`WeatherWidgetMini.tsx`**: Visualizador de clima en tiempo real.
133. **`WifiView.tsx`**: Pasos para conectar al WiFi y visualización de QR.

### UI Base Components (`components/ui/`)
- *(134-190)*: Conjunto completo de primitivos de interfaz (Botones, Selectores, Diálogos, Tablas) basados en **Radix UI** y **Tailwind**, esenciales para la coherencia visual del sistema.

---

## 📂 `lib/` (Núcleo Técnico)

### Motores de IA (`lib/ai/`)
191. **`brave.ts`**: Servicio de búsqueda web para enriquecer datos de la guía.
192. **`embeddings.ts`**: Convierte texto en vectores matemáticos para búsqueda semántica.
193. **`gemini-rest.ts`**: Cliente directo para la API de Google Gemini Pro.
194. **`intent-classifier.ts`**: Determina la intención (pregunta, comando, saludo) del usuario en el chat.
195. **`mapbox.ts`**: Integración para obtención de mapas y geocodificación reversa.
196. **`openai.ts`**: Cliente auxiliar para servicios específicos de GPT.

### Localización de Servicios (`lib/discovery/`)
197. **`airports.ts`**: Calcula y filtra aeropuertos cercanos.
198. **`airports-fallback.ts`**: Datos estáticos de aeropuertos para modo offline/error.
199. **`stations.ts`**: Localiza estaciones de transporte público cercanas.
200. **`transit-search.ts`**: Orquesta el motor de búsqueda de transporte global.

### Infraestructura Supabase (`lib/supabase/`)
201. **`admin.ts`**: Cliente con permisos totales para servidor.
202. **`client.ts`**: Instancia cliente para uso en componentes de React (lado cliente).
203. **`edge.ts`**: Cliente configurado para Edge Functions.
204. **`middleware.ts`**: Lógica necesaria para inyectar la sesión en las peticiones.
205. **`server-admin.ts`**: Variante del administrador para entorno Node.js pesado.
206. **`server.ts`**: Cliente estándar para Server Actions y RSC.

---

## 📂 `hooks/` (Lógica de Interfaz)

207. **`use-auth.ts`**: Acceso reactivo al estado de autenticación.
208. **`use-inactivity.ts`**: Ejecuta acciones tras periodos de inactividad.
209. **`use-mobile.ts`**: Hook para manejar condicionales según el dispositivo.
210. **`use-sensitive-action.tsx`**: Envuelve funciones críticas con re-autenticación obligatoria.
211. **`use-user-profile.ts`**: Gestión sincrónica de los datos de la tabla `profiles`.
212. **`useLocalizedContent.ts`**: Motor cliente de traducción dinámica.
213. **`useWeather.ts`**: Conexión con APIs de clima geo-localizadas.

---

## 📂 `supabase/` (Backend e Infraestructura)

### Migraciones SQL (`supabase/migrations/`)
- *(214-250)*: Archivos de control de versiones de la base de datos, incluyendo RLS, vectores y esquemas de propiedades. Destaca el último `20260323102000_secure_db_objects.sql` para endurecimiento de seguridad.

### Edge Functions (`supabase/functions/`)
251. **`process-manual-search/index.ts`**: Función serverless que procesa búsquedas avanzadas.

---

## 📂 `scripts/` (Herramientas de Desarrollador)

- *(252-276)*: Colección de utilidades para mantenimiento, como `fix-utf8.js`, `create-dev-admin.js`, `test-geocoding.js` y tareas de limpieza de tokens expirados.

---

## 📂 `__tests__` (Calidad y Seguridad)

- *(277-290)*: Pruebas automatizadas de XSS, Inyección SQL, Rate Limiting y lógica de negocio, fundamentales para la estabilidad del producto.

---

*Este inventario cubre el 100% de los archivos relevantes del workspace en su estado actual.*
