
# Prompt para IDE de IA — Adaptación de Maqueta a Producto Real

## Contexto del Proyecto

Eres un agente de desarrollo experto en React + TypeScript. Tienes delante una **maqueta funcional** de una aplicación llamada **Guideflow** — una guía digital para huéspedes de alojamientos turísticos (tipo Airbnb, villas, apartamentos). El objetivo es tomar esta maqueta y convertirla en un producto real, production-ready, con arquitectura escalable.

---

## ¿Qué es esta maqueta?

Un **Guest Guide Studio** — una herramienta que permite a anfitriones de alojamientos turísticos crear y personalizar una guía digital para sus huéspedes. La maqueta demuestra cómo el mismo contenido (información de la casa, recomendaciones, WiFi, check-in, etc.) puede presentarse con **6 identidades visuales radicalmente distintas**.

### Los 6 temas actuales

| ID | Nombre | Identidad visual |
|---|---|---|
| `modern` | Modern Minimal | Inter, fondo gris claro, cards flotantes blancas, acento negro |
| `cozy` | Warm Boutique | Playfair Display italic, fondo crema #FDF6EE, tonos terracota |
| `urban` | Urban Dark | Oswald condensado, fondo negro #0F0F0F, acento cyan #00E5FF |
| `coastal` | Coastal Breeze | Nunito redondeado, fondo azul claro, iconos circulares de colores |
| `luxury` | Luxury Estate | Cormorant Garamond, fondo crema #F9F7F4, detalles dorados #C9A84C |
| `airbnb` | Airbnb Style | Inter, blanco puro, acento #FF385C, bottom tab bar, foto full-width |

### Pantallas actuales por tema

Cada tema tiene **2 pantallas**:
- **Home** (`screen === 'home'`): Bienvenida, búsqueda, quick links, tarjeta de guía
- **Detail** (`screen === 'detail'`): Guía completa con recomendaciones, amenities, zonas

---

## Arquitectura actual de la maqueta

```
App.tsx                    → Shell con marco de iPhone + ThemeSwitcher
components/
  GuestGuide.tsx           → Componente principal con switch por tema
  ThemeSwitcher.tsx        → Panel lateral para cambiar tema (demo)
  ChatButton.tsx           → Botón flotante de chat (por tema)
data/
  themes.ts                → Definición de los 6 temas (id, nombre, colores)
index.css                  → Google Fonts imports + Tailwind
tailwind.config.js         → Config de Tailwind
```

### Patrones clave del código actual

- Cada tema tiene sus propias funciones de render: `ModernHome`, `CozyHome`, `UrbanHome`, etc.
- El switch de tema se hace en `HomeScreen` y `DetailScreen` con `switch(theme.id)`
- Los estilos son **inline styles** con valores hex + clases Tailwind
- Fuentes cargadas via Google Fonts en `index.css`: Inter, Playfair Display, Lato, Oswald, Montserrat, Cormorant Garamond, Jost, Nunito
- Iconos: `lucide-react`
- Sin routing real (solo estado `screen: 'home' | 'detail'`)
- Sin datos reales (todo hardcodeado)

---

## Hacia dónde va el producto — Tu misión

### Visión del producto

Guideflow es una plataforma SaaS para anfitriones de alojamientos turísticos. Permite:
1. **Crear** una guía digital personalizada para sus huéspedes
2. **Elegir** una identidad visual (tema) que encaje con su propiedad
3. **Compartir** la guía via QR code o link directo con los huéspedes
4. **Gestionar** el contenido (WiFi, check-in, recomendaciones, normas, etc.)

Los huéspedes acceden a la guía desde su móvil — es una **PWA o web app mobile-first**.

---

## Lo que debes construir

### 1. Arquitectura de rutas (React Router v6)

```
/                          → Landing page / marketing
/login                     → Autenticación del anfitrión
/dashboard                 → Panel del anfitrión (lista de propiedades)
/dashboard/property/:id    → Editar propiedad y su guía
/guide/:propertySlug       → La guía pública para huéspedes (mobile-first)
/guide/:propertySlug/home  → Pantalla home de la guía
/guide/:propertySlug/:section → Sección específica (wifi, checkin, etc.)
```

### 2. Modelos de datos

```typescript
// Propiedad del anfitrión
interface Property {
  id: string
  slug: string                    // URL-friendly: "villa-enrique"
  name: string                    // "Villa Enrique"
  location: string                // "Las Rozas de Madrid"
  heroImage: string               // URL de la foto principal
  themeId: ThemeId                // 'modern' | 'cozy' | 'urban' | 'coastal' | 'luxury' | 'airbnb'
  hostName: string
  hostAvatar: string
  rating: number                  // 4.97
  reviewCount: number             // 128
  checkInTime: string             // "15:00"
  checkOutTime: string            // "11:00"
  wifi: { network: string; password: string }
  parking: string                 // Descripción del parking
  sections: GuideSection[]
  recommendations: Recommendation[]
  createdAt: string
  updatedAt: string
}

// Sección de la guía
interface GuideSection {
  id: string
  type: 'checkin' | 'wifi' | 'parking' | 'rules' | 'manual' | 'sos' | 'custom'
  title: string
  content: string                 // Markdown o texto plano
  icon: string                    // Emoji o nombre de icono lucide
  order: number
}

// Recomendación del anfitrión
interface Recommendation {
  id: string
  category: 'food' | 'activities' | 'shopping' | 'transport' | 'emergency'
  name: string
  description: string
  address?: string
  rating?: number
  imageUrl?: string
  mapsUrl?: string
}

// Tema visual
type ThemeId = 'modern' | 'cozy' | 'urban' | 'coastal' | 'luxury' | 'airbnb'
```

### 3. Componentes a crear / refactorizar

#### Guía pública (lo que ve el huésped)

Tomar los componentes actuales de `GuestGuide.tsx` y:

- **Separar cada tema en su propio archivo**: `themes/ModernTheme.tsx`, `themes/CozyTheme.tsx`, etc.
- **Hacer los componentes data-driven**: en lugar de texto hardcodeado, reciben `property: Property` como prop
- **Añadir routing real** dentro de la guía: cada sección es una ruta
- **Hacer el bottom tab bar funcional** (especialmente en el tema Airbnb)
- **Añadir transiciones de página** con Framer Motion (slide entre secciones)

```typescript
// Interfaz que cada tema debe implementar
interface ThemeProps {
  property: Property
  section?: string
  onNavigate: (section: string) => void
}
```

#### Panel del anfitrión (dashboard)

- Lista de propiedades con preview del tema seleccionado
- Editor de contenido por sección (WYSIWYG simple o markdown)
- Selector de tema con preview en tiempo real (reutilizar la lógica del `ThemeSwitcher` actual)
- Generador de QR code para compartir la guía
- Estadísticas básicas (visitas, secciones más vistas)

### 4. Stack recomendado para producción

```
Frontend:
  - React 18 + TypeScript
  - React Router v6 (rutas)
  - Framer Motion (animaciones de transición)
  - Tailwind CSS (estilos — ya configurado)
  - lucide-react (iconos — ya en uso)
  - react-query o SWR (fetching de datos)
  - Zustand (estado global del anfitrión autenticado)

Backend (sugerido):
  - Supabase (auth + PostgreSQL + storage para imágenes)
  - O: Firebase / PocketBase

PWA:
  - Vite PWA plugin
  - Service worker para offline (la guía debe funcionar sin conexión)
  - Web App Manifest para "Add to Home Screen"
```

---

## Instrucciones específicas para el IDE

### Paso 1: Refactorizar la estructura de archivos

```
src/
  components/
    guide/
      GuestGuide.tsx           → Componente orquestador (mantener)
      themes/
        ModernTheme.tsx        → Extraer ModernHome + ModernDetail
        CozyTheme.tsx          → Extraer CozyHome + CozyDetail
        UrbanTheme.tsx         → Extraer UrbanHome + UrbanDetail
        CoastalTheme.tsx       → Extraer CoastalHome + CoastalDetail
        LuxuryTheme.tsx        → Extraer LuxuryHome + LuxuryDetail
        AirbnbTheme.tsx        → Extraer AirbnbHome + AirbnbDetail
      sections/
        WifiSection.tsx
        CheckInSection.tsx
        RecommendationsSection.tsx
        HouseRulesSection.tsx
    dashboard/
      PropertyList.tsx
      PropertyEditor.tsx
      ThemeSelector.tsx        → Basado en ThemeSwitcher.tsx actual
      QRGenerator.tsx
    ui/
      Button.tsx
      Card.tsx
      Input.tsx
      Modal.tsx
  pages/
    LandingPage.tsx
    LoginPage.tsx
    DashboardPage.tsx
    GuidePage.tsx              → Carga la propiedad y renderiza el tema correcto
  data/
    themes.ts                  → Ya existe, mantener
    mockProperties.ts          → Datos de ejemplo para desarrollo
  hooks/
    useProperty.ts             → Fetch de datos de propiedad por slug
    useTheme.ts                → Gestión del tema activo
  types/
    index.ts                   → Property, GuideSection, Recommendation, etc.
```

### Paso 2: Hacer los temas data-driven

Tomar el código actual de, por ejemplo, `ModernHome` en `GuestGuide.tsx` y adaptarlo:

```typescript
// ANTES (hardcodeado):
function ModernHome({ onNavigate }: { onNavigate: () => void }) {
  return (
    <h1>Hola</h1>
    <p>Villa Enrique</p>
    // ...
  )
}

// DESPUÉS (data-driven):
function ModernHome({ property, onNavigate }: { property: Property; onNavigate: (s: string) => void }) {
  return (
    <h1>Hola</h1>
    <p>{property.name}</p>
    // ...
  )
}
```

### Paso 3: Añadir transiciones entre pantallas

Usar Framer Motion para que el cambio entre `home` y `detail` (y futuras secciones) tenga una transición de slide horizontal, como una app nativa:

```typescript
import { AnimatePresence, motion } from 'framer-motion'

// Slide desde la derecha al navegar hacia adelante
// Slide desde la izquierda al volver atrás
const slideVariants = {
  enter: (direction: number) => ({ x: direction > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction < 0 ? '100%' : '-100%', opacity: 0 }),
}
```

### Paso 4: PWA para huéspedes

La guía pública (`/guide/:slug`) debe funcionar como PWA:
- Cachear los datos de la propiedad en localStorage al primer acceso
- Funcionar offline (el huésped puede no tener buena conexión en la villa)
- Mostrar un banner "Añadir a pantalla de inicio" en móvil

---

## Datos de ejemplo para desarrollo

Usa estos datos mock mientras no hay backend:

```typescript
export const mockProperty: Property = {
  id: '1',
  slug: 'villa-enrique',
  name: 'Villa Enrique',
  location: 'Las Rozas de Madrid, España',
  heroImage: 'https://cdn.magicpatterns.com/uploads/kBaeBHZGryfaQWYnybg2iQ/image.png',
  themeId: 'airbnb',
  hostName: 'Francisco',
  hostAvatar: 'https://cdn.magicpatterns.com/uploads/kBaeBHZGryfaQWYnybg2iQ/image.png',
  rating: 4.97,
  reviewCount: 128,
  checkInTime: '15:00',
  checkOutTime: '11:00',
  wifi: { network: 'VillaEnrique_5G', password: 'bienvenido2024' },
  parking: 'Parking privado en la entrada. Código de la verja: 1234.',
  sections: [
    { id: '1', type: 'checkin', title: 'Check-in', content: 'La caja de llaves está a la derecha de la puerta principal. Código: 4521.', icon: '🔑', order: 1 },
    { id: '2', type: 'wifi', title: 'WiFi', content: 'Red: VillaEnrique_5G\nContraseña: bienvenido2024', icon: '📶', order: 2 },
    { id: '3', type: 'parking', title: 'Parking', content: 'Parking privado en la entrada. Código de la verja: 1234.', icon: '🚗', order: 3 },
    { id: '4', type: 'rules', title: 'Normas de la Casa', content: 'No fumar en el interior. Silencio a partir de las 23:00. Mascotas permitidas en el jardín.', icon: '📋', order: 4 },
    { id: '5', type: 'sos', title: 'Emergencias', content: 'Emergencias: 112\nAnfitrión: +34 600 000 000\nHospital más cercano: Hospital de Las Rozas (8 min)', icon: '🆘', order: 5 },
  ],
  recommendations: [
    { id: '1', category: 'food', name: 'Restaurante Japonés Sakura', description: 'El sushi es excelente. Tienen menú degustación para probar diferentes platos.', address: 'C/ Mayor 12, Las Rozas', rating: 4.8 },
    { id: '2', category: 'food', name: 'La Taberna de Enrique', description: 'Cocina española tradicional. Los domingos tienen paella.', address: 'Plaza del Ayuntamiento 3', rating: 4.6 },
    { id: '3', category: 'activities', name: 'Las Rozas Village', description: 'Centro comercial outlet premium a 5 minutos en coche.', address: 'Calle Juan Ramón Jiménez, Las Rozas', rating: 4.5 },
  ],
  createdAt: '2024-01-01',
  updatedAt: '2024-01-01',
}
```

---

## Criterios de éxito

La adaptación estará completa cuando:

- [ ] La URL `/guide/villa-enrique` carga la guía de la propiedad con el tema configurado
- [ ] El contenido (WiFi, check-in, recomendaciones) viene de datos reales, no hardcodeado
- [ ] Las transiciones entre secciones son fluidas (Framer Motion)
- [ ] La guía funciona offline en móvil (PWA)
- [ ] El anfitrión puede cambiar el tema desde el dashboard y se refleja en la guía
- [ ] El código de cada tema está en su propio archivo (no todo en GuestGuide.tsx)
- [ ] TypeScript sin errores, sin `any`

---

## Notas importantes

1. **No romper la maqueta actual** — el `ThemeSwitcher` y la demo del marco de iPhone pueden mantenerse en `/demo` para presentaciones
2. **Mobile-first siempre** — la guía para huéspedes se ve en móvil, el dashboard puede ser desktop
3. **Los 6 temas son un diferenciador clave del producto** — mantener sus identidades visuales únicas
4. **El tema Airbnb** tiene bottom tab bar fija — cuidado con el `position: fixed` dentro de contenedores con overflow
5. **Fuentes** — ya están importadas en `index.css` via Google Fonts, no reimportar

---

*Generado desde la maqueta de Guideflow — Magic Patterns*
