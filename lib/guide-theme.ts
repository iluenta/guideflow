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
}

// ── Type alias for backward compat with color-harmonizer.ts ──
export type ThemeColors = GuideThemeClasses

// ── Modern Minimal ───────────────────────────────────────────
const modern: GuideThemeClasses = {
    pageBg: 'bg-white',
    heroOverlay: 'bg-gradient-to-t from-black/70 via-black/20 to-transparent',
    heroSubLabel: 'text-white/90',
    heroGreeting: 'text-white font-bold font-serif',
    heroPropertyName: 'text-white/90 font-light italic font-serif',
    cardBg: 'bg-white',
    sectionLabel: 'text-gray-400',
    actionBtn: 'bg-[#18181b] text-white',
    searchBg: 'bg-white',
    searchText: 'text-gray-400',
    searchBorder: 'border-gray-100',
    chipBg: 'bg-gray-50/50 border border-gray-100/50 hover:bg-gray-100',
    chipIconBg: 'bg-white shadow-sm',
    chipIconColor: 'text-[#18181b]',
    chipLabel: 'text-gray-700',
    chipLayout: 'inline',
    perChipColors: [],
    guideCardTag: 'text-amber-500',
    guideCardTitle: 'text-gray-900 font-serif',
    guideCardSubtitle: 'text-gray-500',
    guideCardBg: 'bg-white border border-[#18181b]/5',
    guideCardChevron: 'bg-[#18181b]/5 text-[#18181b] group-hover:bg-[#18181b] group-hover:text-white',
    conciergeText: 'text-gray-400',
}

// ── Urban Dark ───────────────────────────────────────────────
const urban: GuideThemeClasses = {
    pageBg: 'bg-[#09090b]',
    heroOverlay: 'bg-gradient-to-t from-[#09090b] via-black/40 to-transparent',
    heroSubLabel: 'text-[#00d4ff] font-black uppercase tracking-widest',
    heroGreeting: 'text-white font-black uppercase tracking-tight',
    heroPropertyName: 'text-white/70 uppercase tracking-widest font-medium',
    cardBg: 'bg-[#18181b]',
    sectionLabel: 'text-zinc-500',
    actionBtn: 'bg-[#00d4ff] text-black font-black',
    searchBg: 'bg-[#18181b]',
    searchText: 'text-zinc-400',
    searchBorder: 'border-zinc-700',
    chipBg: 'bg-[#18181b] border border-zinc-700/50 hover:border-[#00d4ff]/40',
    chipIconBg: 'bg-zinc-800',
    chipIconColor: 'text-[#00d4ff]',
    chipLabel: 'text-zinc-200',
    chipLayout: 'inline',
    perChipColors: [],
    guideCardTag: 'text-[#00d4ff] font-black uppercase tracking-widest',
    guideCardTitle: 'text-white font-black uppercase tracking-tight',
    guideCardSubtitle: 'text-zinc-400',
    guideCardBg: 'bg-[#18181b] border border-zinc-700',
    guideCardChevron: 'bg-[#00d4ff]/10 text-[#00d4ff] group-hover:bg-[#00d4ff] group-hover:text-black',
    conciergeText: 'text-zinc-500',
}

// ── Coastal Breeze ───────────────────────────────────────────
const coastal: GuideThemeClasses = {
    pageBg: 'bg-sky-50',
    // Sky-blue tinted gradient so hero blends into the sky-50 page background
    heroOverlay: 'bg-gradient-to-t from-sky-700/60 via-sky-400/10 to-transparent',
    heroSubLabel: 'text-sky-200 font-semibold tracking-widest uppercase',
    heroGreeting: 'text-white font-bold',
    heroPropertyName: 'text-sky-100 font-light',
    cardBg: 'bg-white rounded-3xl',
    sectionLabel: 'text-sky-500 font-extrabold',
    actionBtn: 'bg-sky-500 text-white rounded-full',
    searchBg: 'bg-white',
    searchText: 'text-gray-400',
    searchBorder: 'border-sky-100',
    // Inline fallback (not rendered in stacked layout)
    chipBg: 'bg-white border border-sky-100 hover:bg-sky-50 rounded-2xl',
    chipIconBg: 'bg-sky-100 rounded-full',
    chipIconColor: 'text-sky-600',
    chipLabel: 'text-gray-700',
    chipLayout: 'stacked',
    // Stacked chip circle colors (wifi, access/checkin, parking, eat)
    perChipColors: [
        'bg-blue-400',    // WiFi
        'bg-orange-400',  // Acceso / Check-in
        'bg-orange-400',  // Parking
        'bg-emerald-500', // Comer
    ],
    guideCardTag: 'text-white/80 font-semibold tracking-widest',
    guideCardTitle: 'text-white font-bold',
    guideCardSubtitle: 'text-white/70',
    guideCardBg: 'bg-sky-500 border-0',
    guideCardChevron: 'bg-white/20 text-white group-hover:bg-white group-hover:text-sky-500 rounded-full',
    conciergeText: 'text-sky-600 font-semibold',
}

// ── Registry ─────────────────────────────────────────────────
const themeMap: Record<string, GuideThemeClasses> = {
    modern,
    urban,
    coastal,
    warm: modern,   // fallback until implemented
    luxury: modern, // fallback until implemented
    airbnb: modern, // fallback until implemented
}

export function getGuideTheme(themeId?: string): GuideThemeClasses {
    return themeMap[themeId || 'modern'] ?? modern
}
