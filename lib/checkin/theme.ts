import type { CSSProperties } from 'react'
import { cormorant, jost, nunito, oswald, playfair } from '@/lib/fonts-themes'
import { getLayoutTheme } from '@/lib/themes'

// El check-in hereda el mismo tema visual que la guía del huésped
// (property_branding.layout_theme_id): cambiar el tema de la propiedad cambia
// las dos cosas a la vez, sin tocar código.
//
// OJO con las fuentes: cada tema declara la suya por nombre literal en
// lib/themes.ts ("Nunito", "Cormorant Garamond"...), pero next/font/local
// registra las familias con un nombre generado y solo las expone a través de su
// CSS variable. Usar el literal hace que el navegador no encuentre la familia y
// caiga al sans del sistema, así que aquí mapeamos cada tema a su variable real.
//
// Solo se carga la fuente del tema activo (fontClass), no las cinco.
const THEME_FONTS = {
  modern: {
    font: jost,
    heading: 'var(--font-jost), system-ui, sans-serif',
    body: 'var(--font-jost), system-ui, sans-serif',
  },
  warm: {
    font: playfair,
    heading: 'var(--font-playfair), Georgia, serif',
    body: 'var(--font-poppins), system-ui, sans-serif',
  },
  urban: {
    font: oswald,
    heading: 'var(--font-oswald), system-ui, sans-serif',
    body: 'var(--font-poppins), system-ui, sans-serif',
  },
  coastal: {
    font: nunito,
    heading: 'var(--font-nunito), system-ui, sans-serif',
    body: 'var(--font-nunito), system-ui, sans-serif',
  },
  luxury: {
    font: cormorant,
    heading: 'var(--font-cormorant), Georgia, serif',
    body: 'var(--font-poppins), system-ui, sans-serif',
  },
} as const

type ThemeFontKey = keyof typeof THEME_FONTS

export interface CheckinTheme {
  themeId: string
  /** Clase de next/font que declara la variable CSS de la fuente del tema */
  fontClass: string
  /** Variables CSS + estilos base para el contenedor raíz del check-in */
  style: CSSProperties
}

export function buildCheckinTheme(layoutThemeId?: string | null): CheckinTheme {
  const theme = getLayoutTheme(layoutThemeId)
  const fonts = THEME_FONTS[theme.id as ThemeFontKey] ?? THEME_FONTS.modern
  const c = theme.colors

  return {
    themeId: theme.id,
    fontClass: fonts.font.variable,
    style: {
      // Tokens propios del check-in
      '--ck-bg': c.background,
      '--ck-surface': c.surface,
      '--ck-ink': c.text.primary,
      '--ck-ink-soft': c.text.secondary,
      '--ck-ink-mute': c.text.muted,
      '--ck-rule': c.neutral[200],
      '--ck-tint': c.neutral[100],
      '--ck-primary': c.primary,
      '--ck-on-primary': c.surface,
      '--ck-accent': c.accent,

      // Sobrescribe los tokens globales de @theme para que los componentes
      // compartidos (Button, Input, Select…) hereden el tema sin tocarlos.
      '--color-primary': c.primary,
      '--color-primary-foreground': c.surface,
      '--color-accent': c.accent,
      '--color-surface': c.surface,
      '--color-background': c.background,
      '--color-ink': c.text.primary,
      '--color-ink-soft': c.text.secondary,
      '--color-input': c.neutral[200],

      '--font-heading': fonts.heading,
      '--font-body': fonts.body,

      backgroundColor: c.background,
      color: c.text.primary,
      fontFamily: fonts.body,
    } as CSSProperties,
  }
}
