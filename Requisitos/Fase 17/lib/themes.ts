export interface ThemeColors {
    primary: string;
    secondary: string;
    accent: string;
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
    background: string;
    surface: string;
    text: {
        primary: string;
        secondary: string;
        muted: string;
    };
}

export interface Theme {
    id: string;
    name: string;
    description: string;
    preview?: string;
    colors: ThemeColors;
    fonts: {
        heading: string;
        body: string;
    };
}

export const PRESET_THEMES: Theme[] = [
    {
        id: 'elegant-navy',
        name: 'Elegante Naval',
        description: 'Profesional y sofisticado',
        preview: '/themes/elegant-navy.png',
        colors: {
            primary: '#1e3a8a',
            secondary: '#f59e0b',
            accent: '#10b981',
            neutral: {
                50: '#f8fafc',
                100: '#f1f5f9',
                200: '#e2e8f0',
                300: '#cbd5e1',
                400: '#94a3b8',
                500: '#64748b',
                600: '#475569',
                700: '#334155',
                800: '#1e293b',
                900: '#0f172a'
            },
            background: '#fefefe',
            surface: '#ffffff',
            text: {
                primary: '#1e293b',
                secondary: '#64748b',
                muted: '#94a3b8'
            }
        },
        fonts: {
            heading: 'ui-serif, Georgia, Cambria, "Times New Roman", Times, serif',
            body: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
        }
    },
    {
        id: 'warm-terracotta',
        name: 'Terracota Cálido',
        description: 'Acogedor y mediterráneo',
        colors: {
            primary: '#c2410c',
            secondary: '#0c4a6e',
            accent: '#ca8a04',
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
                900: '#1c1917'
            },
            background: '#fefdfb',
            surface: '#ffffff',
            text: {
                primary: '#292524',
                secondary: '#78716c',
                muted: '#a8a29e'
            }
        },
        fonts: {
            heading: 'ui-serif, "Ipanema", "Times New Roman", serif',
            body: 'ui-sans-serif, system-ui, sans-serif'
        }
    },
    {
        id: 'forest-green',
        name: 'Verde Bosque',
        description: 'Natural y relajante',
        colors: {
            primary: '#065f46',
            secondary: '#92400e',
            accent: '#ea580c',
            neutral: {
                50: '#f9fafb',
                100: '#f3f4f6',
                200: '#e5e7eb',
                300: '#d1d5db',
                400: '#9ca3af',
                500: '#6b7280',
                600: '#4b5563',
                700: '#374151',
                800: '#1f2937',
                900: '#111827'
            },
            background: '#fefffe',
            surface: '#ffffff',
            text: {
                primary: '#1f2937',
                secondary: '#6b7280',
                muted: '#9ca3af'
            }
        },
        fonts: {
            heading: 'ui-serif, "New York", serif',
            body: 'ui-sans-serif, system-ui, sans-serif'
        }
    },
    {
        id: 'modern-minimal',
        name: 'Minimalista Moderno',
        description: 'Limpio y contemporáneo',
        colors: {
            primary: '#18181b',
            secondary: '#71717a',
            accent: '#3b82f6',
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
                900: '#18181b'
            },
            background: '#ffffff',
            surface: '#fafafa',
            text: {
                primary: '#18181b',
                secondary: '#52525b',
                muted: '#a1a1aa'
            }
        },
        fonts: {
            heading: 'ui-sans-serif, system-ui, sans-serif',
            body: 'ui-sans-serif, system-ui, sans-serif'
        }
    }
];
