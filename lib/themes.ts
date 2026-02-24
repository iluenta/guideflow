// ============================================================
// GuideFlow — Visual Style Themes
// ============================================================
// Each theme sets a forced CSS variable palette + font pair.
// The guide layout/component tree is UNCHANGED across themes.
// Only colors, typography, and minor CSS overrides change.
// ============================================================

export type LayoutThemeId =
  | 'modern'
  | 'urban'
  | 'coastal'
  | 'warm'
  | 'luxury'
  | 'airbnb';

/** @deprecated legacy alias — use LayoutTheme.colors directly */
export type ThemeColors = LayoutTheme['colors'];



export interface LayoutTheme {
  id: LayoutThemeId;
  name: string;
  tagline: string;
  description: string;
  /** Emoji icon for the wizard selector card */
  icon: string;
  /** Tailwind bg class for icon container */
  iconBg: string;
  /** Tailwind text class for colored tagline */
  tagColor: string;
  /** true = selectable now; false = coming soon */
  implemented: boolean;
  fonts: {
    heading: string;
    body: string;
    /** Google Font family names to load — must also be in app/layout.tsx */
    googleFonts?: string[];
  };
  /** Full forced color palette — no custom override */
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
      muted: string;
    };
    neutral: {
      50: string;
      100: string;
      200: string;
      300: string;
      400: string;
      500: string;
      600: string;
      700: string;
      800: string;
      900: string;
    };
  };
}

export const LAYOUT_THEMES: LayoutTheme[] = [
  // ── MODERN MINIMAL ───────────────────────────────────────
  {
    id: 'modern',
    name: 'Modern Minimal',
    tagline: 'Limpio · Preciso · Atemporal',
    description: 'Cards flotantes, tipografía Inter, espaciado generoso.',
    icon: '⬛',
    iconBg: 'bg-gray-900',
    tagColor: 'text-gray-500',
    implemented: true,
    fonts: {
      heading: 'Inter, ui-sans-serif, system-ui, sans-serif',
      body: 'Inter, ui-sans-serif, system-ui, sans-serif',
    },
    colors: {
      primary: '#18181b',
      secondary: '#71717a',
      accent: '#3b82f6',
      background: '#f4f4f5',
      surface: '#ffffff',
      text: {
        primary: '#09090b',
        secondary: '#52525b',
        muted: '#a1a1aa',
      },
      neutral: {
        50: '#fafafa',
        100: '#f4f4f5',
        200: '#e4e4e7',
        300: '#d4d4d8',
        400: '#a1a1aa',
        500: '#71717a',
        600: '#52525b',
        700: '#3f3f46',
        800: '#27272a',
        900: '#18181b',
      },
    },
  },

  // ── WARM BOUTIQUE ─────────────────────────────────────────
  {
    id: 'warm',
    name: 'Warm Boutique',
    tagline: 'Acogedor · Personal · Artesanal',
    description: 'Serif elegante, tonos crema, sensación de hogar.',
    icon: '☕',
    iconBg: 'bg-amber-700',
    tagColor: 'text-amber-600',
    implemented: false,
    fonts: {
      heading: '"Playfair Display", ui-serif, Georgia, serif',
      body: 'ui-sans-serif, system-ui, sans-serif',
      googleFonts: ['Playfair Display'],
    },
    colors: {
      primary: '#92400e',
      secondary: '#d97706',
      accent: '#f59e0b',
      background: '#fdfaf6',
      surface: '#fffbf5',
      text: {
        primary: '#292524',
        secondary: '#78716c',
        muted: '#a8a29e',
      },
      neutral: {
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
      },
    },
  },

  // ── URBAN DARK ────────────────────────────────────────────
  {
    id: 'urban',
    name: 'Urban Dark',
    tagline: 'Oscuro · Editorial · Atrevido',
    description: 'Fondo negro, tipografía condensada, alto contraste.',
    icon: '⚡',
    iconBg: 'bg-zinc-900',
    tagColor: 'text-cyan-400',
    implemented: true,
    fonts: {
      heading: 'Oswald, ui-sans-serif, system-ui, sans-serif',
      body: 'ui-sans-serif, system-ui, sans-serif',
      googleFonts: ['Oswald'],
    },
    colors: {
      primary: '#00d4ff',
      secondary: '#60a5fa',
      accent: '#f59e0b',
      background: '#09090b',
      surface: '#18181b',
      text: {
        primary: '#fafafa',
        secondary: '#a1a1aa',
        muted: '#52525b',
      },
      neutral: {
        50: '#fafafa',
        100: '#27272a',
        200: '#3f3f46',
        300: '#52525b',
        400: '#71717a',
        500: '#a1a1aa',
        600: '#d4d4d8',
        700: '#e4e4e7',
        800: '#f4f4f5',
        900: '#fafafa',
      },
    },
  },

  // ── COASTAL BREEZE ────────────────────────────────────────
  {
    id: 'coastal',
    name: 'Coastal Breeze',
    tagline: 'Fresco · Vibrante · Playful',
    description: 'Azules brillantes, Nunito redondeado, energía costera.',
    icon: '🌊',
    iconBg: 'bg-sky-500',
    tagColor: 'text-sky-500',
    implemented: true,
    fonts: {
      heading: 'Nunito, ui-sans-serif, system-ui, sans-serif',
      body: 'Nunito, ui-sans-serif, system-ui, sans-serif',
      googleFonts: ['Nunito'],
    },
    colors: {
      primary: '#0ea5e9',
      secondary: '#38bdf8',
      accent: '#f97316',
      background: '#f0f9ff',
      surface: '#ffffff',
      text: {
        primary: '#0c4a6e',
        secondary: '#0369a1',
        muted: '#7dd3fc',
      },
      neutral: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
    },
  },

  // ── LUXURY ESTATE ─────────────────────────────────────────
  {
    id: 'luxury',
    name: 'Luxury Estate',
    tagline: 'Refinado · Exclusivo · Elegante',
    description: 'Cormorant Garamond, detalles dorados, cinco estrellas.',
    icon: '👑',
    iconBg: 'bg-stone-900',
    tagColor: 'text-amber-400',
    implemented: false,
    fonts: {
      heading: '"Cormorant Garamond", ui-serif, Georgia, serif',
      body: 'ui-sans-serif, system-ui, sans-serif',
      googleFonts: ['Cormorant Garamond'],
    },
    colors: {
      primary: '#92400e',
      secondary: '#d97706',
      accent: '#fbbf24',
      background: '#fafaf9',
      surface: '#ffffff',
      text: {
        primary: '#1c1917',
        secondary: '#57534e',
        muted: '#a8a29e',
      },
      neutral: {
        50: '#fafaf9',
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',
        800: '#292524',
        900: '#1c1917',
      },
    },
  },

  // ── AIRBNB STYLE ──────────────────────────────────────────
  {
    id: 'airbnb',
    name: 'Airbnb Style',
    tagline: 'Familiar · Moderno · Confiable',
    description: 'Bottom tab bar, fotos protagonistas, rojo coral.',
    icon: '🏠',
    iconBg: 'bg-rose-500',
    tagColor: 'text-rose-500',
    implemented: false,
    fonts: {
      heading: '"Cereal", "Plus Jakarta Sans", ui-sans-serif, system-ui, sans-serif',
      body: 'ui-sans-serif, system-ui, sans-serif',
    },
    colors: {
      primary: '#ff385c',
      secondary: '#e31c5f',
      accent: '#00a699',
      background: '#ffffff',
      surface: '#f7f7f7',
      text: {
        primary: '#222222',
        secondary: '#484848',
        muted: '#767676',
      },
      neutral: {
        50: '#f7f7f7',
        100: '#ebebeb',
        200: '#dddddd',
        300: '#b0b0b0',
        400: '#717171',
        500: '#484848',
        600: '#383838',
        700: '#333333',
        800: '#222222',
        900: '#111111',
      },
    },
  },
];

/** Get a theme by id, fallback to modern */
export function getLayoutTheme(id?: string | null): LayoutTheme {
  return LAYOUT_THEMES.find((t) => t.id === id) ?? LAYOUT_THEMES[0];
}

// ── Legacy compatibility ──────────────────────────────────
// The old PRESET_THEMES export is kept so any remaining references
// don't break at compile time. It maps to the new system.
/** @deprecated Use LAYOUT_THEMES instead */
export const PRESET_THEMES = LAYOUT_THEMES;

// Old Theme type alias for backward compat
/** @deprecated Use LayoutTheme instead */
export type Theme = LayoutTheme;
