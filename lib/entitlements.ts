export type PackageLevel = 'basic' | 'standard' | 'premium'

export const PACKAGE_FEATURES = {
  basic: {
    max_properties:     1,
    max_team_members:   2,
    guide_digital:      true,
    chat_ai:            true,
    reservations:       false,
    expense_management: false,
    multi_language:     true,
    custom_branding:    false,
    api_access:         false,
  },
  standard: {
    max_properties:     5,
    max_team_members:   5,
    guide_digital:      true,
    chat_ai:            true,
    reservations:       true,
    expense_management: true,
    multi_language:     true,
    custom_branding:    false,
    api_access:         false,
  },
  premium: {
    max_properties:     999,
    max_team_members:   999,
    guide_digital:      true,
    chat_ai:            true,
    reservations:       true,
    expense_management: true,
    multi_language:     true,
    custom_branding:    true,
    api_access:         true,
  },
} as const

type BooleanFeature = {
  [K in keyof typeof PACKAGE_FEATURES.basic]: typeof PACKAGE_FEATURES.basic[K] extends boolean ? K : never
}[keyof typeof PACKAGE_FEATURES.basic]

type NumericFeature = {
  [K in keyof typeof PACKAGE_FEATURES.basic]: typeof PACKAGE_FEATURES.basic[K] extends number ? K : never
}[keyof typeof PACKAGE_FEATURES.basic]

export function hasFeature(packageLevel: PackageLevel, feature: BooleanFeature): boolean {
  return PACKAGE_FEATURES[packageLevel]?.[feature] === true
}

export function getLimit(packageLevel: PackageLevel, limit: NumericFeature): number {
  return (PACKAGE_FEATURES[packageLevel]?.[limit] as number) ?? 0
}
