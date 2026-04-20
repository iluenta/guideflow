# Documentación Funcional del Proyecto: Hospyia

Este documento describe la estructura y el propósito funcional de cada archivo y directorio clave en el proyecto Hospyia.

## 📁 Arquitectura General (Directorio Raíz)

- **`middleware.ts`**: Punto de entrada del middleware de Next.js. Gestiona la sesión de Supabase de forma global antes de cada petición.
- **`next.config.mjs`**: Configuración de Next.js (dominios de imágenes, headers, etc.).
- **`package.json`**: Dependencias del proyecto y scripts de ejecución.
- **`tailwind.config.ts`**: Configuración del sistema de diseño basado en Tailwind CSS.
- **`tsconfig.json`**: Configuración de TypeScript.

---

## 📂 `app/` (Next.js App Router)

La carpeta principal que define las rutas, páginas y APIs de la aplicación.

### Rutas de Usuario (Frontend)
- **`layout.tsx`**: Layout raíz con fuentes y estilos globales.
- **`page.tsx`**: Landing page principal del producto.
- **`favicon.ico`**: Icono de la aplicación.

### Dashboard (Panel de Control)
- **`dashboard/layout.tsx`**: Layout del panel de control con barra lateral y navegación superior.
- **`dashboard/page.tsx`**: Página de inicio del dashboard con resumen de actividad y accesos rápidos.
- **`dashboard/properties/page.tsx`**: Gestión y listado de propiedades (alojamientos).
- **`dashboard/bookings/page.tsx`**: Gestión de reservas.
- **`dashboard/calendar/page.tsx`**: Vista de calendario de ocupación.
- **`dashboard/analytics/page.tsx`**: Métricas de rendimiento y uso.
- **`dashboard/settings/page.tsx`**: Configuración de perfil y cuenta.
- **`dashboard/security/page.tsx`**: Ajustes de seguridad y logs de acceso.

### Autenticación
- **`auth/login/page.tsx`**: Página de inicio de sesión.
- **`auth/signup/page.tsx`**: Registro de nuevos usuarios.
- **`auth/callback/route.ts`**: Endpoint para procesar el retorno de autenticación (OAuth/Magic Links).

### APIs (`app/api/`)
- **`api/auth/profile/route.ts`**: Obtiene los datos del perfil del usuario autenticado de forma segura.
- **`api/ai/generate-arrival/route.ts`**: Endpoint para generar instrucciones de llegada usando IA.
- **`api/translate/route.ts`**: Servicio de traducción automática para contenidos de la guía.

---

## 📂 `components/` (Componentes de UI)

### `ui/` (Shadcn/UI & Custom Base)
Componentes atómicos y reutilizables (Botones, Inputs, Diálogos, Badges, etc.).

### `dashboard/`
Componentes específicos para el panel de administración.
- **`wizard/`**: Pasos del asistente para crear/configurar propiedades.
- **`Sidebar.tsx`**: Navegación lateral principal.

### `properties/`
Visualización y gestión de alojamientos.
- **`PropertyCard.tsx`**: Tarjeta visual de una propiedad.
- **`PropertyListItem.tsx`**: Versión compacta para listas largas.
- **`StatusBadge.tsx`**: Indicador de estado (Activo, Borrador, etc.).

---

## 📂 `lib/` (Lógica de Negocio y Utilidades)

- **`supabase/`**: 
  - `client.ts`: Cliente de Supabase para uso en componentes de cliente.
  - `server.ts`: Cliente de Supabase para uso en Server Components/Actions.
  - `middleware.ts`: Lógica de refresco de sesión para el middleware.
- **`arrival/`**: Lógica especializada para la generación de instrucciones de llegada (scripts de scraping, prompts de IA).
- **`utils.ts`**: Funciones de utilidad general (formateo de fechas, manejo de clases CSS).

---

## 📂 `hooks/` (Ganchos Personalizados)

- **`use-user-profile.ts`**: Hook para obtener y gestionar el estado del perfil del usuario en la UI.
- **`use-inactivity.ts`**: Detecta periodos de inactividad para seguridad.

---

## 📂 `supabase/` (Base de Datos)

- **`migrations/`**: Historial de cambios en el esquema de la base de datos (SQL).
  - Ejemplo: `20260323102000_secure_db_objects.sql` gestiona la seguridad RLS.

---

## 📂 `__tests__` (Pruebas)

- **`unit/`**: Tests de lógica pura y hooks.
- **`security/`**: Tests específicos de penetración, XSS, inyección SQL y validación de RLS.

---

## 📂 `scripts/` (Herramientas de Desarrollador)

Scripts para tareas administrativas rápidas.
- **`dev-admin-login.js`**: Genera links de acceso mágico para pruebas locales.
