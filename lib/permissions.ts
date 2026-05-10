export type TenantRole = 'owner' | 'admin' | 'support' | 'viewer'

export const TENANT_ROLE_PERMISSIONS = {
  owner: {
    properties:   { create: true,  edit: true,  delete: true,  view: true  },
    reservations: { create: true,  edit: true,  cancel: true,  delete: true,  view: true  },
    guests:       { view: true,  communicate: true,  manage_guides: true  },
    finances:     { view: true,  create: true,  edit: true,  delete: true,  reports: true },
    members:      { invite: true,  edit: true,  remove: true  },
    billing:      { view: true,  manage: true  },
    settings:     { view: true,  edit: true  },
  },
  admin: {
    properties:   { create: true,  edit: true,  delete: false, view: true  },
    reservations: { create: true,  edit: true,  cancel: true,  delete: false, view: true  },
    guests:       { view: true,  communicate: true,  manage_guides: true  },
    finances:     { view: true,  create: true,  edit: true,  delete: false, reports: true },
    members:      { invite: false, edit: false, remove: false },
    billing:      { view: false, manage: false },
    settings:     { view: true,  edit: true  },
  },
  support: {
    properties:   { create: false, edit: false, delete: false, view: true  },
    reservations: { create: true,  edit: true,  cancel: false, delete: false, view: true  },
    guests:       { view: true,  communicate: true,  manage_guides: false },
    finances:     { view: false, create: false, edit: false, delete: false, reports: false },
    members:      { invite: false, edit: false, remove: false },
    billing:      { view: false, manage: false },
    settings:     { view: false, edit: false },
  },
  viewer: {
    properties:   { create: false, edit: false, delete: false, view: true  },
    reservations: { create: false, edit: false, cancel: false, delete: false, view: true  },
    guests:       { view: false, communicate: false, manage_guides: false },
    finances:     { view: false, create: false, edit: false, delete: false, reports: false },
    members:      { invite: false, edit: false, remove: false },
    billing:      { view: false, manage: false },
    settings:     { view: false, edit: false },
  },
} as const

type Resource = keyof typeof TENANT_ROLE_PERMISSIONS.owner
type ActionOf<R extends Resource> = keyof typeof TENANT_ROLE_PERMISSIONS.owner[R]

export function can<R extends Resource>(
  tenantRole: TenantRole,
  resource: R,
  action: ActionOf<R>
): boolean {
  return (TENANT_ROLE_PERMISSIONS[tenantRole]?.[resource] as Record<string, boolean>)?.[action as string] === true
}

// Admins de plataforma (role='admin') tienen acceso total independientemente del tenant_role
export function canPlatformAdmin(
  platformRole: string,
  tenantRole: TenantRole,
  resource: Resource,
  action: string
): boolean {
  if (platformRole === 'admin') return true
  return can(tenantRole, resource, action as ActionOf<typeof resource>)
}
