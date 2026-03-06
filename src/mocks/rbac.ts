import type { Role } from '../types/auth'
import type { PermissionCode } from '../types/navigation'
import { rolePermissions } from '../features/auth/permissions'

export function permissionsForRole(role: Role): PermissionCode[] {
  return rolePermissions[role]
}

export function hasPermission(role: Role, permission: PermissionCode) {
  return permissionsForRole(role).includes(permission)
}
