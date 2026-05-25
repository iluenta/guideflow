import type { PropertyLanding } from '@/lib/types/property';

export type Palette = PropertyLanding['palette'];
export type Typography = PropertyLanding['typography'];
export type BorderRadius = PropertyLanding['border_radius'];

export const PALETTE_VARS: Record<Palette, Record<string, string>> = {
  navy: {
    '--brand': '#1e3a8a', '--brand-deep': '#15296b', '--brand-soft': '#3b5bbd',
    '--accent': '#2dd4bf', '--bg': '#fafbfc', '--bg-deep': '#f1f4f8',
    '--ink': '#0f172a', '--ink-soft': '#475569', '--ink-mute': '#94a3b8', '--rule': '#e2e8f0',
  },
  coastal: {
    '--brand': '#0369a1', '--brand-deep': '#075985', '--brand-soft': '#0ea5e9',
    '--accent': '#fbbf24', '--bg': '#fafbfc', '--bg-deep': '#f1f4f8',
    '--ink': '#0f172a', '--ink-soft': '#475569', '--ink-mute': '#94a3b8', '--rule': '#e2e8f0',
  },
  warm: {
    '--brand': '#b45309', '--brand-deep': '#92400e', '--brand-soft': '#d97706',
    '--accent': '#f59e0b', '--bg': '#fffbf5', '--bg-deep': '#fef3c7',
    '--ink': '#1c1917', '--ink-soft': '#57534e', '--ink-mute': '#a8a29e', '--rule': '#e7e5e4',
  },
  warmsand: {
    '--brand': '#8a5a2b', '--brand-deep': '#6b4520', '--brand-soft': '#c08552',
    '--accent': '#d4a574', '--bg': '#fdfaf4', '--bg-deep': '#f5ede0',
    '--ink': '#1c1917', '--ink-soft': '#57534e', '--ink-mute': '#a8a29e', '--rule': '#e8dcc5',
  },
  forest: {
    '--brand': '#14532d', '--brand-deep': '#0c3a1f', '--brand-soft': '#166534',
    '--accent': '#a3e635', '--bg': '#f7faf6', '--bg-deep': '#ecf2e7',
    '--ink': '#0f172a', '--ink-soft': '#475569', '--ink-mute': '#94a3b8', '--rule': '#d9e6d2',
  },
  ink: {
    '--brand': '#18181b', '--brand-deep': '#09090b', '--brand-soft': '#3f3f46',
    '--accent': '#f59e0b', '--bg': '#fafafa', '--bg-deep': '#f4f4f5',
    '--ink': '#09090b', '--ink-soft': '#52525b', '--ink-mute': '#a1a1aa', '--rule': '#e4e4e7',
  },
  modern: {
    '--brand': '#6366f1', '--brand-deep': '#4f46e5', '--brand-soft': '#818cf8',
    '--accent': '#f43f5e', '--bg': '#fafafa', '--bg-deep': '#f1f5f9',
    '--ink': '#0f172a', '--ink-soft': '#475569', '--ink-mute': '#94a3b8', '--rule': '#e2e8f0',
  },
  urban: {
    '--brand': '#374151', '--brand-deep': '#1f2937', '--brand-soft': '#6b7280',
    '--accent': '#ef4444', '--bg': '#f9fafb', '--bg-deep': '#f3f4f6',
    '--ink': '#111827', '--ink-soft': '#6b7280', '--ink-mute': '#9ca3af', '--rule': '#e5e7eb',
  },
  luxury: {
    '--brand': '#8B6F47', '--brand-deep': '#6B5535', '--brand-soft': '#A0826D',
    '--accent': '#E8956F', '--bg': '#FFF8F3', '--bg-deep': '#F5E8D8',
    '--ink': '#1a2540', '--ink-soft': '#5C4A36', '--ink-mute': '#9A8878', '--rule': '#E8D5C0',
  },
};

const RADIUS_VARS: Record<BorderRadius, Record<string, string>> = {
  soft: { '--r-sm': '8px', '--r-md': '14px', '--r-lg': '20px', '--r-xl': '28px' },
  sharp: { '--r-sm': '2px', '--r-md': '4px', '--r-lg': '6px', '--r-xl': '8px' },
};

export function buildThemeStyle(
  palette: Palette,
  borderRadius: BorderRadius,
): React.CSSProperties {
  const paletteVars = PALETTE_VARS[palette] ?? PALETTE_VARS.navy;
  const radiusVars = RADIUS_VARS[borderRadius] ?? RADIUS_VARS.soft;
  return { ...paletteVars, ...radiusVars } as React.CSSProperties;
}

export function isEditorialTypography(typography: Typography): boolean {
  return typography === 'editorial';
}
