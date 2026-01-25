// Sensitive actions that require re-authentication
export const SENSITIVE_ACTIONS = {
  CHANGE_EMAIL: 'change_email',
  CHANGE_PASSWORD: 'change_password',
  MODIFY_ADMIN_PERMISSIONS: 'modify_admin_permissions',
  ACCESS_FINANCIAL_REPORTS: 'access_financial_reports',
  MODIFY_TENANT_SETTINGS: 'modify_tenant_settings',
  DELETE_USER: 'delete_user',
  BILLING_CHANGES: 'billing_changes',
} as const

export type SensitiveAction = typeof SENSITIVE_ACTIONS[keyof typeof SENSITIVE_ACTIONS]

export const SENSITIVE_ACTION_LABELS: Record<SensitiveAction, string> = {
  [SENSITIVE_ACTIONS.CHANGE_EMAIL]: 'Cambiar email',
  [SENSITIVE_ACTIONS.CHANGE_PASSWORD]: 'Cambiar contraseña',
  [SENSITIVE_ACTIONS.MODIFY_ADMIN_PERMISSIONS]: 'Modificar permisos de administrador',
  [SENSITIVE_ACTIONS.ACCESS_FINANCIAL_REPORTS]: 'Acceder a reportes financieros',
  [SENSITIVE_ACTIONS.MODIFY_TENANT_SETTINGS]: 'Modificar configuración del tenant',
  [SENSITIVE_ACTIONS.DELETE_USER]: 'Eliminar usuario',
  [SENSITIVE_ACTIONS.BILLING_CHANGES]: 'Cambios en facturación',
}

export function isSensitiveAction(action: string): action is SensitiveAction {
  return Object.values(SENSITIVE_ACTIONS).includes(action as SensitiveAction)
}

export function getSensitiveActionLabel(action: SensitiveAction): string {
  return SENSITIVE_ACTION_LABELS[action] || action
}
