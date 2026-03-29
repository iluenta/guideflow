// ============================================================
// guide-theme.ts — Runtime Tailwind class maps per visual theme
// ============================================================
// Tailwind purges unused classes at build time, so we define
// every class variant here as a complete string so they are
// all included in the production bundle.
// ============================================================

export type ChipLayout = 'inline' | 'stacked'

export interface GuideThemeClasses {
    /** Page background */
    pageBg: string
    /** Hero overlay gradient */
    heroOverlay: string
    /** Hero sub-label (e.g. "BIENVENIDO A CASA") */
    heroSubLabel: string
    /** Hero main greeting text */
    heroGreeting: string
    /** Hero property name (sub-heading) */
    heroPropertyName: string
    /** Card / content area background */
    cardBg: string
    /** Section label (e.g. "PREGUNTAS FRECUENTES") */
    sectionLabel: string
    /** Primary action button (search send, CTA) */
    actionBtn: string
    /** Search bar background */
    searchBg: string
    /** Search bar text colour */
    searchText: string
    /** Search bar border */
    searchBorder: string
    /** Chip item background — used for inline (2×2) layout */
    chipBg: string
    /** Chip icon container — used for inline layout */
    chipIconBg: string
    /** Chip icon colour — used for inline layout */
    chipIconColor: string
    /** Chip label text */
    chipLabel: string
    /** 'inline' = 2×2 icon-left  |  'stacked' = 4-col circular-icon-top */
    chipLayout: ChipLayout
    /** Per-chip colored circle backgrounds for 'stacked' layout (indices: wifi, access, parking, eat) */
    perChipColors: string[]
    /** "Tu Estancia" small label above guide card */
    guideCardTag: string
    /** Guide card big heading */
    guideCardTitle: string
    /** Guide card subtitle */
    guideCardSubtitle: string
    /** Guide card wrapper background / border */
    guideCardBg: string
    /** Guide card chevron circle */
    guideCardChevron: string
    /** Concierge helper text below search bar */
    conciergeText: string
    /** Accent text color for active tabs and highlighted text bits */
    accentText: string
}

// ── Type alias for backward compat with color-harmonizer.ts ──
export type ThemeColors = GuideThemeClasses

// ── Modern Minimal ─────────────────────────────────────────────────
// Inter · Blanco y gris · Bordes suaves · CTA negro
const modern: GuideThemeClasses = {
    pageBg:           'bg-gray-50',
    heroOverlay:      'bg-gradient-to-t from-black/80 via-black/20 to-transparent',
    heroSubLabel:     'text-white/80 font-bold tracking-[0.2em] uppercase',
    heroGreeting:     'text-white font-bold',
    heroPropertyName: 'text-white/90 font-light',
    cardBg:           'bg-white border border-gray-100 shadow-sm',
    sectionLabel:     'text-gray-400 font-bold uppercase tracking-widest',
    actionBtn:        'bg-gray-900 text-white rounded-xl',
    searchBg:         'bg-white',
    searchText:       'text-gray-500 font-bold tracking-widest uppercase',
    searchBorder:     'border-gray-200',
    chipBg:           'bg-white border border-gray-100 shadow-sm hover:bg-gray-50',
    chipIconBg:       'bg-gray-100',
    chipIconColor:    'text-gray-600',
    chipLabel:        'text-gray-900 font-bold',
    chipLayout:       'inline',
    perChipColors:    [],
    guideCardTag:     'text-gray-400 font-bold uppercase tracking-widest',
    guideCardTitle:   'text-gray-900 font-bold',
    guideCardSubtitle:'text-gray-500',
    guideCardBg:      'bg-white border border-gray-100 shadow-sm',
    guideCardChevron: 'bg-gray-100 text-gray-700 group-hover:bg-gray-900 group-hover:text-white',
    conciergeText:    'text-gray-700 font-bold tracking-widest',
    accentText:       'text-gray-900',
}

// ── Urban Dark ─────────────────────────────────────────────────
// Montserrat/Oswald · Negro · Cyan eléctrico · Cuadrado y duro
const urban: GuideThemeClasses = {
    pageBg:           'bg-[#0F0F0F]',
    heroOverlay:      'bg-gradient-to-t from-black via-black/40 to-transparent',
    heroSubLabel:     'text-[#00E5FF] font-bold tracking-[0.3em] uppercase',
    heroGreeting:     'text-white font-bold uppercase',
    heroPropertyName: 'text-white/70 uppercase tracking-widest',
    cardBg:           'bg-[#1C1C1C] border border-[#333]',
    sectionLabel:     'text-[#555] font-bold tracking-[0.2em] uppercase',
    actionBtn:        'bg-[#00E5FF] text-black font-bold tracking-[0.2em] uppercase',
    searchBg:         'bg-[#1C1C1C]',
    searchText:       'text-[#00E5FF] font-bold tracking-[0.2em] uppercase',
    searchBorder:     'border-[#333]',
    chipBg:           'bg-[#1C1C1C] border border-[#333] hover:border-[#00E5FF]/30',
    chipIconBg:       'bg-[#0F0F0F] border border-[#333]',
    chipIconColor:    'text-[#00E5FF]',
    chipLabel:        'text-white font-bold uppercase tracking-widest',
    chipLayout:       'inline',
    perChipColors:    [],
    guideCardTag:     'text-[#555] font-bold tracking-[0.2em] uppercase',
    guideCardTitle:   'text-white font-bold uppercase tracking-widest',
    guideCardSubtitle:'text-[#888]',
    guideCardBg:      'bg-[#1C1C1C] border border-[#333]',
    guideCardChevron: 'bg-[#0F0F0F] border border-[#555] text-[#555] group-hover:text-[#00E5FF]',
    conciergeText:    'text-[#00E5FF] font-bold tracking-[0.2em] uppercase',
    accentText:       'text-[#00E5FF]',
}

// ── Coastal Breeze ─────────────────────────────────────────────────
// Nunito · #F0F9FF azul cielo · íconos circulares de colores · Redondeado
const coastal: GuideThemeClasses = {
    pageBg:           'bg-[#F0F9FF]',
    heroOverlay:      'bg-gradient-to-t from-[#036199]/85 via-[#0EA5E9]/20 to-transparent',
    heroSubLabel:     'text-white/80 font-extrabold tracking-widest uppercase',
    heroGreeting:     'text-white font-extrabold',
    heroPropertyName: 'text-white/90 font-semibold',
    cardBg:           'bg-white border border-[#E0F2FE] rounded-3xl shadow-sm',
    sectionLabel:     'text-[#94A3B8] font-extrabold uppercase tracking-widest',
    actionBtn:        'bg-[#0EA5E9] text-white font-extrabold rounded-full',
    searchBg:         'bg-white',
    searchText:       'text-[#0EA5E9] font-extrabold tracking-widest uppercase',
    searchBorder:     'border-[#E0F2FE]',
    chipBg:           'bg-white border border-[#E0F2FE] rounded-2xl',
    // Coastal uses stacked circular icons — chipIconBg is used as the circle color
    chipIconBg:       'bg-[#0EA5E9]',
    chipIconColor:    'text-white',
    chipLabel:        'text-[#1E3A5F] font-extrabold',
    chipLayout:       'stacked',
    perChipColors:    [
        'bg-[#0EA5E9]',   // WiFi  - sky blue
        'bg-[#06B6D4]',   // Acceso - cyan
        'bg-[#F97316]',   // Parking - orange
        'bg-[#10B981]',   // Comer - emerald
    ],
    guideCardTag:     'text-[#94A3B8] font-extrabold uppercase tracking-widest',
    guideCardTitle:   'text-[#1E3A5F] font-extrabold',
    guideCardSubtitle:'text-[#64748B] font-semibold',
    guideCardBg:      'bg-white border border-[#E0F2FE] rounded-3xl shadow-sm',
    guideCardChevron: 'bg-[#F0F9FF] text-[#BAE6FD] group-hover:bg-[#0EA5E9] group-hover:text-white rounded-full',
    conciergeText:    'text-[#0EA5E9] font-extrabold tracking-widest uppercase',
    accentText:       'text-[#0EA5E9]',
}

// ── Warm Boutique ─────────────────────────────────────────────────
// Lato + Playfair · Crema #FDF6EE · Marrón #8B5E3C · Dorado #C4956A
const warm: GuideThemeClasses = {
    pageBg:           'bg-[#FDF6EE]',
    heroOverlay:      'bg-gradient-to-t from-[#5A2D0A]/90 via-[#8C501E]/30 to-transparent',
    heroSubLabel:     'text-[#F5C89A] font-bold tracking-[0.2em] uppercase',
    heroGreeting:     'text-white font-bold italic',
    heroPropertyName: 'text-white/90 italic',
    cardBg:           'bg-white border border-[#E8D5BE] shadow-sm',
    sectionLabel:     'text-[#9C7B5E] font-bold uppercase tracking-widest italic',
    actionBtn:        'bg-[#8B5E3C] text-[#FDF6EE] rounded-xl',
    searchBg:         'bg-[#FEF3E2]',
    searchText:       'text-[#8B5E3C] font-bold tracking-widest uppercase',
    searchBorder:     'border-[#E8D5BE]',
    chipBg:           'bg-[#FEF3E2] border border-[#E8D5BE] hover:bg-[#FEE6C8]',
    chipIconBg:       'bg-[#FEF3E2]',
    chipIconColor:    'text-[#8B5E3C]',
    chipLabel:        'text-[#3D2B1F] font-bold',
    chipLayout:       'inline',
    perChipColors:    [],
    guideCardTag:     'text-[#9C7B5E] font-bold uppercase tracking-widest italic',
    guideCardTitle:   'text-[#3D2B1F] font-bold italic',
    guideCardSubtitle:'text-[#7A5C45]',
    guideCardBg:      'bg-white border border-[#E8D5BE] shadow-sm',
    guideCardChevron: 'bg-[#FEF3E2] text-[#C4956A] group-hover:bg-[#8B5E3C] group-hover:text-white',
    conciergeText:    'text-[#8B5E3C] font-bold tracking-widest uppercase',
    accentText:       'text-[#8B5E3C]',
}

// ── Luxury Estate ─────────────────────────────────────────────────
// Cormorant + Jost · Marfil #F9F7F4 · Navy #1B2A4A · Oro #C9A84C
const luxury: GuideThemeClasses = {
    pageBg:           'bg-[#F9F7F4]',
    heroOverlay:      'bg-gradient-to-t from-[#1B2A4A]/95 via-[#1B2A4A]/40 to-transparent',
    heroSubLabel:     'text-[#C9A84C] font-medium tracking-[0.35em] uppercase',
    heroGreeting:     'text-white font-light',
    heroPropertyName: 'text-white/80 italic font-light',
    cardBg:           'bg-white border border-[#D4C5A9]',
    sectionLabel:     'text-[#8A8070] font-medium tracking-[0.25em] uppercase',
    actionBtn:        'bg-[#1B2A4A] text-[#C9A84C] font-medium tracking-[0.25em] uppercase',
    searchBg:         'bg-white',
    searchText:       'text-[#8A8070] font-medium tracking-[0.25em] uppercase',
    searchBorder:     'border-[#D4C5A9]',
    chipBg:           'bg-white border border-[#D4C5A9] hover:border-[#C9A84C]/50',
    chipIconBg:       'bg-[#F9F7F4] border border-[#D4C5A9]',
    chipIconColor:    'text-[#C9A84C]',
    chipLabel:        'text-[#1B2A4A] font-medium tracking-widest uppercase',
    chipLayout:       'inline',
    perChipColors:    [],
    guideCardTag:     'text-[#8A8070] font-medium tracking-[0.25em] uppercase',
    guideCardTitle:   'text-[#1B2A4A] font-medium tracking-widest uppercase',
    guideCardSubtitle:'text-[#8A8070] font-light',
    guideCardBg:      'bg-white border border-[#D4C5A9]',
    guideCardChevron: 'bg-[#F9F7F4] border border-[#D4C5A9] text-[#C9A84C] group-hover:bg-[#1B2A4A] group-hover:text-[#C9A84C]',
    conciergeText:    'text-[#8A8070] font-medium tracking-[0.25em] uppercase',
    accentText:       'text-[#1B2A4A]',
}

// ── Registry ─────────────────────────────────────────────────
const themeMap: Record<string, GuideThemeClasses> = {
    modern,
    modern_v2: modern, // alias used in some component defaults
    urban,
    coastal,
    warm,
    luxury,
}

export function getGuideTheme(themeId?: string): GuideThemeClasses {
    return themeMap[themeId || 'modern'] ?? modern
}
