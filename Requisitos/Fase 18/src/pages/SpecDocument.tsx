import React, { useState, Component } from 'react';
export function SpecDocument() {
  const [activeSection, setActiveSection] = useState(0);
  const sections = [
  'Resumen Ejecutivo',
  'Arquitectura de Archivos',
  'Sistema de Diseño',
  'Componentes UI',
  'Páginas',
  'Flujos de Usuario',
  'Stack Técnico',
  'Prompt para IA IDE'];

  return (
    <div className="flex h-full bg-[#0F1117] text-gray-100 overflow-hidden">
      {/* Sticky TOC */}
      <aside className="w-64 flex-shrink-0 border-r border-white/10 p-6 overflow-y-auto">
        <div className="mb-8">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center mb-3">
            <span className="text-white font-bold text-sm">SG</span>
          </div>
          <h2 className="text-lg font-bold text-white">StayGuide</h2>
          <p className="text-xs text-gray-500 mt-1">
            Especificaciones Técnicas v1.0
          </p>
        </div>
        <nav className="space-y-1">
          {sections.map((s, i) =>
          <button
            key={i}
            onClick={() => setActiveSection(i)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${activeSection === i ? 'bg-indigo-600/20 text-indigo-400 font-medium' : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'}`}>

              <span className="text-gray-600 mr-2 font-mono text-xs">
                {String(i + 1).padStart(2, '0')}
              </span>
              {s}
            </button>
          )}
        </nav>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto p-10 max-w-4xl">
        {activeSection === 0 && <SectionResumen />}
        {activeSection === 1 && <SectionArchivos />}
        {activeSection === 2 && <SectionDiseno />}
        {activeSection === 3 && <SectionComponentes />}
        {activeSection === 4 && <SectionPaginas />}
        {activeSection === 5 && <SectionFlujos />}
        {activeSection === 6 && <SectionStack />}
        {activeSection === 7 && <SectionPrompt />}
      </main>
    </div>);

}
function SectionTitle({
  label,
  title,
  description




}: {label: string;title: string;description?: string;}) {
  return (
    <div className="mb-10 pb-6 border-b border-white/10">
      <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest block mb-2">
        {label}
      </span>
      <h1 className="text-4xl font-bold text-white mb-3">{title}</h1>
      {description &&
      <p className="text-gray-400 text-lg leading-relaxed">{description}</p>
      }
    </div>);

}
function Code({ children }: {children: React.ReactNode;}) {
  return (
    <pre className="bg-black/40 border border-white/10 rounded-xl p-6 text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed whitespace-pre-wrap">
      {children}
    </pre>);

}
function Tag({
  color,
  children



}: {color: string;children: React.ReactNode;}) {
  const colors: Record<string, string> = {
    indigo: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
    emerald: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    amber: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    gray: 'bg-gray-500/20 text-gray-300 border-gray-500/30'
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[color]}`}>

      {children}
    </span>);

}
function SectionResumen() {
  return (
    <div>
      <SectionTitle
        label="01 — Resumen"
        title="Resumen Ejecutivo"
        description="StayGuide es una plataforma SaaS para anfitriones de alquiler vacacional que permite crear, gestionar y distribuir guías digitales interactivas para huéspedes." />

      <div className="grid grid-cols-2 gap-6 mb-10">
        {[
        {
          label: 'Producto',
          value: 'SaaS B2C / B2B'
        },
        {
          label: 'Usuarios',
          value: 'Anfitriones Airbnb/Booking'
        },
        {
          label: 'Propósito',
          value: 'Guías digitales de huésped'
        },
        {
          label: 'Diferencial',
          value: 'IA + UX premium'
        }].
        map((item) =>
        <div
          key={item.label}
          className="bg-white/5 border border-white/10 rounded-xl p-5">

            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">
              {item.label}
            </p>
            <p className="text-white font-semibold">{item.value}</p>
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-white mb-4">Propuesta de Valor</h3>
      <ul className="space-y-3 text-gray-400">
        {[
        'Reducir las preguntas repetitivas de los huéspedes en un 70%',
        'Crear guías completas en menos de 15 minutos con asistencia IA',
        'Aumentar la valoración media del alojamiento mejorando la experiencia',
        'Centralizar toda la información de las propiedades en un solo lugar'].
        map((item, i) =>
        <li key={i} className="flex items-start gap-3">
            <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
              ✓
            </span>
            {item}
          </li>
        )}
      </ul>
    </div>);

}
function SectionArchivos() {
  return (
    <div>
      <SectionTitle label="02 — Arquitectura" title="Estructura de Archivos" />
      <Code>{`StayGuide/
├── index.tsx              # Entry point
├── App.tsx                # Root layout + state-based routing
├── index.css              # Google Fonts + Tailwind imports + CSS vars
├── tailwind.config.js     # Custom colors, fonts, shadows
│
├── components/
│   ├── Sidebar.tsx        # Collapsible nav (260px ↔ 80px)
│   ├── TopBar.tsx         # Search + notifications header
│   ├── StatCard.tsx       # KPI metric card with sparkline
│   ├── PropertyCard.tsx   # Property grid card
│   ├── WizardStep.tsx     # Vertical step item for wizard
│   └── Badge.tsx          # Status badge (success/warning/neutral)
│
└── pages/
    ├── Dashboard.tsx      # Main overview with stats + activity
    ├── Properties.tsx     # Property grid with filters
    ├── GuideWizard.tsx    # 12-step guide creation wizard
    └── SpecDocument.tsx   # This document`}</Code>

      <h3 className="text-lg font-bold text-white mt-8 mb-4">Convenciones</h3>
      <ul className="space-y-2 text-gray-400 text-sm">
        <li>
          <span className="text-indigo-400 font-mono">named exports</span> — No
          default exports en ningún archivo
        </li>
        <li>
          <span className="text-indigo-400 font-mono">TypeScript</span> —
          Interfaces explícitas para todos los props
        </li>
        <li>
          <span className="text-indigo-400 font-mono">Tailwind CSS</span> — Sin
          CSS modules ni styled-components
        </li>
        <li>
          <span className="text-indigo-400 font-mono">framer-motion</span> —
          Para todas las animaciones
        </li>
        <li>
          <span className="text-indigo-400 font-mono">lucide-react</span> — Para
          todos los iconos
        </li>
      </ul>
    </div>);

}
function SectionDiseno() {
  return (
    <div>
      <SectionTitle label="03 — Diseño" title="Sistema de Diseño" />

      <h3 className="text-lg font-bold text-white mb-4">Paleta de Colores</h3>
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
        {
          name: 'Navy',
          hex: '#1C1F2E',
          tw: 'navy',
          bg: '#1C1F2E'
        },
        {
          name: 'Indigo',
          hex: '#6366F1',
          tw: 'indigo-500',
          bg: '#6366F1'
        },
        {
          name: 'Emerald',
          hex: '#10B981',
          tw: 'emerald-500',
          bg: '#10B981'
        },
        {
          name: 'Amber',
          hex: '#F59E0B',
          tw: 'amber-500',
          bg: '#F59E0B'
        },
        {
          name: 'Cream BG',
          hex: '#F8F7F4',
          tw: 'cream',
          bg: '#F8F7F4'
        },
        {
          name: 'White Card',
          hex: '#FFFFFF',
          tw: 'white',
          bg: '#FFFFFF'
        },
        {
          name: 'Pink',
          hex: '#EC4899',
          tw: 'pink-500',
          bg: '#EC4899'
        },
        {
          name: 'Gray Border',
          hex: '#E5E7EB',
          tw: 'gray-200',
          bg: '#E5E7EB'
        }].
        map((c) =>
        <div
          key={c.name}
          className="bg-white/5 border border-white/10 rounded-lg p-3">

            <div
            className="w-full h-10 rounded-md mb-2 border border-white/10"
            style={{
              backgroundColor: c.bg
            }} />

            <p className="text-xs font-bold text-white">{c.name}</p>
            <p className="text-xs text-gray-500 font-mono">{c.hex}</p>
          </div>
        )}
      </div>

      <h3 className="text-lg font-bold text-white mb-4">Tipografía</h3>
      <Code>{`/* index.css */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* tailwind.config.js */
fontFamily: {
  sans: ['Inter', 'sans-serif'],        // Body text
  heading: ['"Plus Jakarta Sans"', 'sans-serif'], // h1-h6
}`}</Code>

      <h3 className="text-lg font-bold text-white mt-8 mb-4">
        Sombras Personalizadas
      </h3>
      <Code>{`boxShadow: {
  'soft': '0 4px 20px -2px rgba(28, 31, 46, 0.05)',  // hover cards
  'card': '0 2px 10px rgba(28, 31, 46, 0.03)',        // default cards
}`}</Code>
    </div>);

}
function SectionComponentes() {
  const components = [
  {
    name: 'Sidebar',
    file: 'components/Sidebar.tsx',
    props: 'activeTab: string, onTabChange: (tab: string) => void',
    desc: 'Navegación lateral colapsable. Expandido: 260px (icono + label). Colapsado: 80px (solo icono). Fondo navy #1C1F2E. Toggle con botón circular en el borde derecho.',
    tags: ['motion', 'state']
  },
  {
    name: 'TopBar',
    file: 'components/TopBar.tsx',
    props: '(ninguno)',
    desc: 'Barra superior fija. Buscador a la izquierda, botón "Acción Rápida" + campana de notificaciones + ayuda a la derecha.',
    tags: ['layout']
  },
  {
    name: 'StatCard',
    file: 'components/StatCard.tsx',
    props:
    'title, value, trend?, trendDirection?, icon?, chartData?, accentColor?, delay?',
    desc: 'Tarjeta KPI con borde izquierdo de color, número grande, indicador de tendencia (↑↓), y sparkline opcional con recharts.',
    tags: ['recharts', 'motion']
  },
  {
    name: 'PropertyCard',
    file: 'components/PropertyCard.tsx',
    props:
    'title, location, image, stats{guests,bedrooms,bathrooms}, rating, status, guideCompletion, delay?',
    desc: 'Tarjeta de propiedad con imagen, badge de estado, rating, stats en grid, barra de completitud animada, y botones de acción.',
    tags: ['motion', 'Badge']
  },
  {
    name: 'WizardStep',
    file: 'components/WizardStep.tsx',
    props:
    'stepNumber: number, title: string, status: "complete"|"active"|"upcoming", onClick?: () => void',
    desc: 'Ítem de paso para el panel lateral del wizard. Círculo de estado (verde=completo, índigo=activo, gris=pendiente) + título + borde izquierdo activo.',
    tags: ['motion']
  },
  {
    name: 'Badge',
    file: 'components/Badge.tsx',
    props:
    'children, variant: "default"|"success"|"warning"|"neutral"|"outline"',
    desc: 'Pastilla de estado reutilizable. Colores: indigo/emerald/amber/gray.',
    tags: []
  }];

  return (
    <div>
      <SectionTitle label="04 — Componentes" title="Componentes UI" />
      <div className="space-y-6">
        {components.map((c) =>
        <div
          key={c.name}
          className="bg-white/5 border border-white/10 rounded-xl p-6">

            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-white">{c.name}</h3>
                <p className="text-xs font-mono text-gray-500">{c.file}</p>
              </div>
              <div className="flex gap-2">
                {c.tags.map((t) =>
              <Tag key={t} color="indigo">
                    {t}
                  </Tag>
              )}
              </div>
            </div>
            <p className="text-gray-400 text-sm mb-3 leading-relaxed">
              {c.desc}
            </p>
            <div className="bg-black/30 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">Props</p>
              <code className="text-xs text-emerald-300 font-mono">
                {c.props}
              </code>
            </div>
          </div>
        )}
      </div>
    </div>);

}
function SectionPaginas() {
  return (
    <div>
      <SectionTitle label="05 — Páginas" title="Especificación de Páginas" />

      {[
      {
        name: 'Dashboard',
        route: 'dashboard',
        layout: 'p-8, max-w-7xl, mx-auto',
        sections: [
        'Saludo personalizado con fecha actual (toLocaleDateString es-ES)',
        '4 StatCards en grid: Propiedades Activas (12, indigo), Guías Publicadas (9, emerald), Visitas Hoy (247, amber + sparkline), Valoración Media (4.8★, pink)',
        'Actividad Reciente (2/3 ancho): timeline con 4 eventos, iconos de colores, timestamps relativos',
        'Estado de Propiedades (1/3 ancho): 4 propiedades con barras de salud (verde >90%, indigo >80%, amber resto)',
        'Acciones Rápidas: 4 botones en grid (Nueva Propiedad=indigo filled, resto=ghost)']

      },
      {
        name: 'Properties',
        route: 'properties',
        layout: 'p-8, max-w-7xl, mx-auto',
        sections: [
        'Header: título + subtítulo + botón "Nueva Propiedad" (indigo)',
        'Toolbar: filtros de estado (Todas/Activas/Borradores/Archivadas) + búsqueda + toggle grid/list',
        'Grid 3 columnas: 5 PropertyCards con datos reales + 1 tarjeta "Añadir" con borde punteado',
        'Datos: Villa Sol (100%, activa), Villa Macarena (85%, activa), Soniamar (45%, borrador), Casa del Rio (92%, activa), Apartamento Centro (100%, archivada)']

      },
      {
        name: 'GuideWizard',
        route: 'guides',
        layout: 'flex, h-[calc(100vh-4rem)], 3 paneles',
        sections: [
        'Header: back + nombre propiedad | título | progreso (Paso X de 12 + barra)',
        'Panel izquierdo (260px): lista vertical de 12 pasos con WizardStep, barra de progreso total al fondo',
        'Panel central (flex-1): formulario del paso activo (Acceso por defecto), navegación sticky en el fondo',
        'Panel derecho (300px): mockup de móvil con preview en vivo del contenido del paso actual']

      }].
      map((page) =>
      <div
        key={page.name}
        className="mb-8 bg-white/5 border border-white/10 rounded-xl p-6">

          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-xl font-bold text-white">{page.name}</h3>
            <Tag color="gray">route: {page.route}</Tag>
            <Tag color="indigo">{page.layout}</Tag>
          </div>
          <ul className="space-y-2">
            {page.sections.map((s, i) =>
          <li
            key={i}
            className="flex items-start gap-3 text-sm text-gray-400">

                <span className="text-indigo-500 font-mono text-xs mt-0.5 flex-shrink-0">
                  →
                </span>
                {s}
              </li>
          )}
          </ul>
        </div>
      )}
    </div>);

}
function SectionFlujos() {
  return (
    <div>
      <SectionTitle label="06 — Flujos" title="Flujos de Usuario" />
      {[
      {
        title: 'Crear una Guía Nueva',
        steps: [
        'Dashboard → clic "Crear Guía" en Acciones Rápidas',
        'Sidebar navega a "Guías" → muestra GuideWizard',
        'Paso 1 (Propiedad): nombre, dirección, tipo de alojamiento',
        'Paso 2 (Apariencia): foto de portada, color principal, tipografía',
        'Paso 3 (Acceso): tipo de acceso, código, horarios check-in/out',
        'Pasos 4-11: completar secciones de contenido',
        'Paso 12 (Guía): revisión final → publicar → URL pública generada']

      },
      {
        title: 'Gestionar Propiedades',
        steps: [
        'Sidebar → "Propiedades" → vista grid con todas las propiedades',
        'Filtrar por estado (Activas/Borradores/Archivadas)',
        'Buscar por nombre en el campo de búsqueda',
        'Clic "Editar" en PropertyCard → abre GuideWizard en el paso correspondiente',
        'Clic "Compartir" → copia URL pública de la guía']

      }].
      map((flow) =>
      <div key={flow.title} className="mb-8">
          <h3 className="text-lg font-bold text-white mb-4">{flow.title}</h3>
          <div className="space-y-2">
            {flow.steps.map((step, i) =>
          <div key={i} className="flex items-start gap-4">
                <div className="w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {i + 1}
                </div>
                <p className="text-gray-400 text-sm pt-0.5">{step}</p>
              </div>
          )}
          </div>
        </div>
      )}
    </div>);

}
function SectionStack() {
  return (
    <div>
      <SectionTitle label="07 — Stack" title="Stack Técnico" />
      <div className="grid grid-cols-2 gap-4 mb-8">
        {[
        {
          cat: 'Frontend',
          items: ['React 18', 'TypeScript', 'Vite']
        },
        {
          cat: 'Estilos',
          items: [
          'Tailwind CSS v3',
          'framer-motion',
          'clsx + tailwind-merge']

        },
        {
          cat: 'Iconos & Charts',
          items: ['lucide-react', 'recharts']
        },
        {
          cat: 'Backend (recomendado)',
          items: [
          'Supabase (DB + Auth)',
          'Vercel (deploy)',
          'OpenAI API (IA)']

        }].
        map((group) =>
        <div
          key={group.cat}
          className="bg-white/5 border border-white/10 rounded-xl p-5">

            <h4 className="text-sm font-bold text-indigo-400 mb-3 uppercase tracking-wider">
              {group.cat}
            </h4>
            <ul className="space-y-1.5">
              {group.items.map((item) =>
            <li
              key={item}
              className="text-sm text-gray-300 flex items-center gap-2">

                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0" />
                  {item}
                </li>
            )}
            </ul>
          </div>
        )}
      </div>
      <h3 className="text-lg font-bold text-white mb-4">Dependencias npm</h3>
      <Code>{`npm install framer-motion lucide-react recharts clsx tailwind-merge
npm install -D tailwindcss @types/react @types/react-dom typescript`}</Code>
    </div>);

}
function SectionPrompt() {
  const prompt = `# PROMPT PARA IA IDE — StayGuide SaaS Mockup

## OBJETIVO
Construir una maqueta funcional completa de "StayGuide", una plataforma SaaS para que anfitriones de alquiler vacacional gestionen guías digitales para sus huéspedes. La interfaz debe tener una estética "Command Center" — premium, editorial, profesional — completamente diferente a las interfaces genéricas del mercado.

---

## STACK TÉCNICO
- React 18 + TypeScript
- Tailwind CSS v3 (con configuración personalizada)
- framer-motion (animaciones)
- lucide-react (iconos)
- recharts (gráficos sparkline)
- clsx + tailwind-merge (utilidades de clases)
- Google Fonts: Plus Jakarta Sans (headings) + Inter (body)

IMPORTANTE: Solo named exports. Sin default exports. Sin react-router (usar useState para navegación).

---

## SISTEMA DE DISEÑO

### Colores (tailwind.config.js)
\`\`\`js
colors: {
  navy: { DEFAULT: '#1C1F2E', 800: '#2f3440', 700: '#3d4454' },
  indigo: { DEFAULT: '#6366F1', 50: '#eef2ff', 100: '#e0e7ff', 500: '#6366F1', 600: '#4f46e5' },
  emerald: { DEFAULT: '#10B981', 50: '#ecfdf5', 100: '#d1fae5', 500: '#10B981' },
  amber: { DEFAULT: '#F59E0B', 50: '#fffbeb', 500: '#F59E0B' },
  cream: '#F8F7F4',
}
\`\`\`

### Fuentes
\`\`\`js
fontFamily: {
  sans: ['Inter', 'sans-serif'],
  heading: ['"Plus Jakarta Sans"', 'sans-serif'],
}
\`\`\`

### Sombras
\`\`\`js
boxShadow: {
  'soft': '0 4px 20px -2px rgba(28, 31, 46, 0.05)',
  'card': '0 2px 10px rgba(28, 31, 46, 0.03)',
}
\`\`\`

### index.css
\`\`\`css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

@layer base {
  body { @apply bg-[#F8F7F4] text-[#1C1F2E] font-sans antialiased; }
  h1,h2,h3,h4,h5,h6 { @apply font-heading font-bold tracking-tight; }
}
\`\`\`

---

## ESTRUCTURA DE ARCHIVOS
\`\`\`
App.tsx
components/Badge.tsx
components/PropertyCard.tsx
components/Sidebar.tsx
components/StatCard.tsx
components/TopBar.tsx
components/WizardStep.tsx
pages/Dashboard.tsx
pages/GuideWizard.tsx
pages/Properties.tsx
\`\`\`

---

## App.tsx
Layout principal: Sidebar (izquierda) + contenido (derecha con TopBar + main).
Estado: useState('dashboard') para la página activa.
Rutas: 'dashboard' → Dashboard, 'properties' → Properties, 'guides' → GuideWizard.
Fondo: bg-[#F8F7F4]. Layout: flex h-screen overflow-hidden.

---

## components/Sidebar.tsx
Props: { activeTab: string, onTabChange: (tab: string) => void }

- Fondo: bg-navy (#1C1F2E), texto blanco
- Ancho: 260px expandido, 80px colapsado (motion.aside animate width)
- Logo: cuadrado indigo con icono de casa SVG + texto "StayGuide"
- Toggle: botón circular en el borde derecho (-right-3, top-20)
- Items de navegación:
  * LayoutDashboard → 'dashboard' → "Dashboard"
  * Building2 → 'properties' → "Propiedades"
  * BookOpen → 'guides' → "Guías"
  * Calendar → 'calendar' → "Calendario"
  * BarChart3 → 'analytics' → "Analíticas"
  * Settings → 'settings' → "Ajustes"
- Estado activo: bg-indigo-600, texto blanco, punto blanco a la derecha
- Estado hover: bg-navy-800
- Tooltips en estado colapsado (absolute left-full)
- Footer: avatar gradiente + nombre "Carlos M." + rol "Superhost"
- Botón "Cerrar Sesión" con LogOut icon en rojo

---

## components/TopBar.tsx
- h-16, bg-white, border-b border-gray-100, sticky top-0 z-10
- Izquierda: buscador con Search icon, placeholder "Buscar propiedades, guías o reservas..."
- Derecha: botón "Acción Rápida" (indigo-50, Plus icon) + separador + Bell (con punto rojo) + HelpCircle

---

## components/Badge.tsx
Props: { children, variant: 'default'|'success'|'warning'|'neutral'|'outline' }
- Pill redondeada, text-xs, font-medium
- success: bg-emerald-100 text-emerald-700
- warning: bg-amber-100 text-amber-800
- neutral: bg-gray-100 text-gray-700
- default: bg-indigo-100 text-indigo-700

---

## components/StatCard.tsx
Props: { title, value, trend?, trendDirection?, icon?, chartData?, accentColor?, delay? }

- bg-white, rounded-xl, p-6, shadow-card, border border-gray-100
- Borde izquierdo de color (w-1, absolute, full height) con accentColor
- Número grande: text-3xl font-heading font-bold text-navy
- Tendencia: ArrowUpRight (emerald) o ArrowDownRight (red) + texto "+ vs last week"
- Sparkline: recharts AreaChart, ResponsiveContainer, h-10 w-24, fillOpacity 0.1
- Animación entrada: motion.div opacity 0→1, y 20→0, con delay prop

---

## components/PropertyCard.tsx
Props: { title, location, image, stats{guests,bedrooms,bathrooms}, rating, status, guideCompletion, delay? }

- bg-white, rounded-xl, overflow-hidden, shadow-card, hover:shadow-soft
- Imagen: h-48, object-cover, scale-105 en hover (duration-700)
- Badge de estado (top-right): success/warning/neutral
- Rating badge (top-left): bg-white/90 backdrop-blur, Star amber filled
- Stats: grid 3 columnas con Users/Bed/Bath icons, border-y
- Barra de completitud: h-1.5, animada con motion (width 0→X%), verde si 100%, indigo si <100%
- Botones: "Editar" (bg-navy, Edit2 icon) + "Compartir" (ghost, Share2 icon)

---

## components/WizardStep.tsx
Props: { stepNumber: number, title: string, status: 'complete'|'active'|'upcoming', onClick?: () => void }

Layout: botón de ancho completo, flex, items-center, gap-3, px-4 py-3
- border-l-4: activo=border-indigo-600, resto=border-transparent
- Fondo activo: bg-indigo-50
- Círculo de estado (w-7 h-7):
  * complete: bg-emerald-100, Check icon verde
  * active: bg-indigo-600, número blanco, shadow-md shadow-indigo-200
  * upcoming: border border-gray-300, número gris
- Texto: activo=text-indigo-900 font-medium, completo=text-gray-700, pendiente=text-gray-400
- Punto indicador activo (motion.div layoutId="active-indicator"): w-1.5 h-1.5 bg-indigo-600
- upcoming: disabled, cursor-not-allowed, opacity-60

---

## pages/Dashboard.tsx
Layout: p-8, max-w-7xl mx-auto

SECCIÓN 1 — Saludo:
- h1: "Buenos días, Carlos ☀️" (font-heading, text-3xl, text-navy)
- p: fecha actual con toLocaleDateString('es-ES', {weekday:'long', day:'numeric', month:'long'})

SECCIÓN 2 — KPIs (grid 4 columnas):
- StatCard: "Propiedades Activas", value="12", trend="2", accentColor="#6366F1", icon=Home
- StatCard: "Guías Publicadas", value="9", trend="1", accentColor="#10B981", icon=BookOpen
- StatCard: "Visitas Hoy", value="247", trend="12%", accentColor="#F59E0B", icon=Eye, chartData=[10,25,15,30,45,35,60]
- StatCard: "Valoración Media", value="4.8★", trend="0.1", accentColor="#EC4899"

SECCIÓN 3 — Contenido (grid 3 columnas):
- Actividad Reciente (col-span-2): bg-white, rounded-xl, p-6
  * 4 eventos: "Nueva reserva en Villa Sol" (indigo), "Guía visualizada" (emerald), "Valoración 5★" (amber), "Mantenimiento completado" (gray)
  * Cada evento: círculo de color + título + timestamp relativo + botón MoreHorizontal
- Estado de Propiedades (col-span-1): bg-white, rounded-xl, p-6
  * 4 propiedades con nombre + barra de salud (verde >90%, indigo >80%, amber resto)
  * Villa Macarena 98%, Apartamento Centro 85%, Casa de Playa 92%, Loft Industrial 74%
  * Botón "Ver reporte completo" con ArrowRight

SECCIÓN 4 — Acciones Rápidas (grid 4 columnas):
- "Nueva Propiedad": bg-indigo-600 text-white, Plus icon
- "Crear Guía": ghost border, BookOpen icon
- "Ver Reservas": ghost border, Calendar icon
- "Analíticas": ghost border, BarChart3 icon

---

## pages/Properties.tsx
Estado: viewMode ('grid'|'list'), activeFilter (string)

HEADER: título "Mis Propiedades" + subtítulo + botón "Nueva Propiedad" (indigo, Plus icon)

TOOLBAR (bg-white, rounded-xl, p-2, shadow-sm):
- Filtros: ['Todas','Activas','Borradores','Archivadas'] — activo: bg-navy text-white
- Búsqueda: input con Search icon
- Toggle grid/list: dos botones con LayoutGrid/List icons

GRID (3 columnas, gap-6):
Propiedades con datos reales:
1. Villa Sol | Madrid | 4 guests, 2 beds, 2 baths | rating 4.9 | active | 100%
   image: https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=500&fit=crop
2. Villa Macarena | Madrid | 6 guests, 3 beds, 2 baths | rating 4.8 | active | 85%
   image: https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800&h=500&fit=crop
3. Soniamar | Madrid | 2 guests, 1 bed, 1 bath | rating 4.7 | draft | 45%
   image: https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=500&fit=crop
4. Casa del Rio | Toledo | 8 guests, 4 beds, 3 baths | rating 5.0 | active | 92%
   image: https://images.unsplash.com/photo-1600596542815-2495db9dc2c3?w=800&h=500&fit=crop
5. Apartamento Centro | Madrid | 2 guests, 1 bed, 1 bath | rating 4.6 | archived | 100%
   image: https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=500&fit=crop

Tarjeta "Añadir": border-2 border-dashed border-gray-200, hover:border-indigo-300, Plus icon grande

---

## pages/GuideWizard.tsx
Estado: currentStep (default=3)

12 PASOS:
1.Propiedad 2.Apariencia 3.Acceso 4.Saludo 5.Contactos 6.Check-in 7.Normas 8.Tech 9.Escáner 10.Inventario 11.Recomendaciones 12.Guía

LAYOUT: flex flex-col h-[calc(100vh-4rem)]

HEADER (h-14, bg-white, border-b):
- Izquierda: ChevronLeft + "Propiedad" label + "Villa Sol" título
- Centro: "Configuración de Guía" texto gris
- Derecha: "Paso X de 12" + "25% Completado" + barra w-24 + "Guardar borrador"

BODY: flex flex-1 overflow-hidden

PANEL IZQUIERDO (w-[260px], bg-white, border-r):
- Header: "SECCIONES" label uppercase
- Lista: map de 12 pasos con WizardStep component
  * getStepStatus: stepId===current→'active', stepId<current→'complete', else→'upcoming'
  * onClick: setCurrentStep(step.id) si no es upcoming
- Footer: "Progreso Total" + "17%" + barra emerald h-1

PANEL CENTRAL (flex-1, bg-[#F8F7F4], overflow-y-auto, p-8):
Contenido del paso activo (mostrar Acceso por defecto, placeholder para otros):

Para paso 3 (Acceso):
- Label: "03 — ACCESO" indigo uppercase tracking-widest
- Título: "Instrucciones de Acceso" text-3xl font-heading
- Descripción: "Indica cómo pueden entrar tus huéspedes..."
- Card (bg-white, rounded-xl, p-8):
  * Select "Tipo de Acceso": Caja de seguridad / Código teclado / Llave física / App móvil
  * Textarea "Código o Instrucciones" + botón "Mejorar con IA" (Sparkles icon, indigo)
  * Info: "Esta información solo será visible para huéspedes con reserva confirmada"
  * Grid 2 cols: time inputs "Hora Check-in" (15:00) y "Hora Check-out" (11:00) con Clock icon
  * Toggle row: "Recordatorio Automático" + "Enviar instrucciones 24h antes"
    Toggle: w-11 h-6 bg-indigo-600 rounded-full, punto blanco en right

Para otros pasos: card con título del paso + "Contenido en desarrollo" + icono

NAVEGACIÓN STICKY (absolute bottom-0, bg-white/80 backdrop-blur-md, border-t):
- Izquierda: "Anterior" ghost + ChevronLeft
- Centro: "Guardar y salir" text-gray-400
- Derecha: "Siguiente: [nombre siguiente paso]" bg-indigo-600 + ChevronRight

PANEL DERECHO (w-[300px], bg-white, border-l):
- Header: "VISTA PREVIA" + badge "En vivo" (emerald, punto pulsante)
- Mockup móvil (w-[240px] h-[480px], border-[8px] border-navy, rounded-[2.5rem]):
  * Notch superior centrado
  * Imagen de propiedad (h-32, gradient overlay, "Villa Sol" texto)
  * Sección Acceso: Key icon + "Acceso" título
  * Card: Tipo "Caja Fuerte" + código "4821" (font-mono text-xl) + descripción
  * Grid check-in/out: indigo-50 "15:00" | gray-50 "11:00"
  * Home indicator (w-20 h-1 bg-gray-300)
- Botón "Compartir enlace de prueba" (Share2 icon, text-gray-500)

---

## ANIMACIONES (framer-motion)
- Sidebar: motion.aside animate width 260↔80
- Labels sidebar: motion.span animate opacity 1↔0
- StatCards: motion.div initial opacity:0 y:20 → animate opacity:1 y:0, stagger delay
- PropertyCards: motion.div stagger delay (index * 0.1)
- Barra completitud: motion.div initial width:0 → animate width:X%
- Formulario wizard: motion.div initial opacity:0 y:10 → animate opacity:1 y:0
- WizardStep activo: motion.div layoutId="active-indicator"

---

## NOTAS IMPORTANTES
1. Todos los datos son estáticos (mock data), sin llamadas a API
2. La navegación es state-based, sin react-router
3. El wizard muestra el formulario de "Acceso" para el paso 3 activo; los demás pasos muestran un placeholder
4. Las imágenes usan URLs de Unsplash con parámetros w=800&h=500&fit=crop
5. El componente Badge usa clsx/tailwind-merge para merge de clases
6. Hover effects SOLO en elementos interactivos (botones, tarjetas clicables)
7. El layout es desktop-first (min-width: 1280px recomendado para visualización óptima)`;
  return (
    <div>
      <SectionTitle
        label="08 — Prompt"
        title="Prompt para IA IDE"
        description="Copia este prompt completo en Cursor, Windsurf, GitHub Copilot o cualquier IDE con IA para reconstruir esta maqueta desde cero." />


      <div className="mb-6 flex gap-3">
        <Tag color="emerald">Cursor</Tag>
        <Tag color="indigo">Windsurf</Tag>
        <Tag color="amber">GitHub Copilot</Tag>
        <Tag color="gray">Claude / ChatGPT</Tag>
      </div>

      <div className="relative">
        <div className="absolute top-4 right-4 z-10">
          <button
            onClick={() => navigator.clipboard.writeText(prompt)}
            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors">

            Copiar prompt
          </button>
        </div>
        <pre className="bg-black/60 border border-white/10 rounded-xl p-6 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed whitespace-pre-wrap max-h-[600px] overflow-y-auto">
          {prompt}
        </pre>
      </div>

      <div className="mt-6 bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-5">
        <h4 className="text-sm font-bold text-indigo-300 mb-2">
          💡 Cómo usar este prompt
        </h4>
        <ol className="space-y-2 text-sm text-gray-400">
          <li>
            <span className="text-indigo-400 font-mono mr-2">1.</span>Crea un
            nuevo proyecto React + TypeScript + Vite
          </li>
          <li>
            <span className="text-indigo-400 font-mono mr-2">2.</span>Instala
            las dependencias: framer-motion, lucide-react, recharts, clsx,
            tailwind-merge, tailwindcss
          </li>
          <li>
            <span className="text-indigo-400 font-mono mr-2">3.</span>Abre el
            chat del IDE de IA y pega el prompt completo
          </li>
          <li>
            <span className="text-indigo-400 font-mono mr-2">4.</span>Pide que
            genere los archivos uno por uno si el contexto es limitado
          </li>
          <li>
            <span className="text-indigo-400 font-mono mr-2">5.</span>Verifica
            que tailwind.config.js tenga el content correcto para tu estructura
          </li>
        </ol>
      </div>
    </div>);

}