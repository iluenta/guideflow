import { TinyColor } from '@ctrl/tinycolor';
import { Theme, ThemeColors } from './themes';

/**
 * Harmonizes a base theme with a new primary color.
 * Generates secondary, accent, and neutral scales automatically.
 */
export function harmonizeThemeFromPrimary(
    baseTheme: Theme,
    newPrimaryColor: string
): Theme {
    const primary = new TinyColor(newPrimaryColor);

    // Validar contraste mínimo (si es demasiado claro, oscurecer para legibilidad)
    let adjustedPrimary = primary;
    if (primary.getLuminance() > 0.8) {
        adjustedPrimary = primary.darken(20);
    }

    // Generar color secundario (Complementario suave)
    const secondary = adjustedPrimary.spin(180).desaturate(20).lighten(10);

    // Generar color de acento (Analogo)
    const accent = adjustedPrimary.spin(30).saturate(10);

    // Generar escala neutral basada en el primario (tintes de gris)
    const neutral = generateNeutralScale(adjustedPrimary);

    // Colores de texto optimizados
    // Si el fondo es blanco (#ffffff), necesitamos texto oscuro
    const textPrimary = '#1a1a1a';
    const textSecondary = adjustedPrimary.darken(30).toHexString();
    const textMuted = neutral[400];

    return {
        ...baseTheme,
        colors: {
            primary: adjustedPrimary.toHexString(),
            secondary: secondary.toHexString(),
            accent: accent.toHexString(),
            neutral: neutral,
            background: '#ffffff', // For MVP we keep background white/off-white for clean look
            surface: '#ffffff',
            text: {
                primary: textPrimary,
                secondary: textSecondary,
                muted: textMuted
            }
        }
    };
}

function generateNeutralScale(baseColor: TinyColor) {
    const hue = baseColor.toHsl().h;
    const saturation = 4; // Muy baja saturación para neutrales elegantes

    return {
        50: new TinyColor({ h: hue, s: saturation, l: 98 }).toHexString(),
        100: new TinyColor({ h: hue, s: saturation, l: 96 }).toHexString(),
        200: new TinyColor({ h: hue, s: saturation, l: 92 }).toHexString(),
        300: new TinyColor({ h: hue, s: saturation, l: 84 }).toHexString(),
        400: new TinyColor({ h: hue, s: saturation, l: 68 }).toHexString(),
        500: new TinyColor({ h: hue, s: saturation, l: 52 }).toHexString(),
        600: new TinyColor({ h: hue, s: saturation, l: 40 }).toHexString(),
        700: new TinyColor({ h: hue, s: saturation, l: 30 }).toHexString(),
        800: new TinyColor({ h: hue, s: saturation, l: 20 }).toHexString(),
        900: new TinyColor({ h: hue, s: saturation, l: 12 }).toHexString()
    };
}

export function validateContrast(
    foreground: string,
    background: string
): { passes: boolean; ratio: number } {
    const fg = new TinyColor(foreground);
    const bg = new TinyColor(background);

    const ratio = fg.getContrast(bg);
    const passes = ratio >= 4.5; // WCAG AA

    return { passes, ratio };
}
