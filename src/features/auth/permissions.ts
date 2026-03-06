import type { PermissionCode } from '../../types/navigation'
import type { Role } from '../../types/auth'

export const rolePermissions: Record<Role, PermissionCode[]> = {
  ADMIN: ['ASSET_EDIT', 'EMPLOYEE_EDIT', 'REFERENCE_MANAGE', 'ATTRIBUTE_MANAGE', 'EXPORT_RUN', 'IMPORT_RUN', 'STOCKTAKE_RUN', 'AUDIT_VIEW'],
  EMPLOYEE: [],
  MVP: ['ASSET_EDIT', 'EMPLOYEE_EDIT'],
  MANAGER: ['ASSET_EDIT', 'EMPLOYEE_EDIT', 'EXPORT_RUN', 'IMPORT_RUN', 'STOCKTAKE_RUN'],
  OWNER: ['ASSET_EDIT', 'EMPLOYEE_EDIT', 'EXPORT_RUN', 'STOCKTAKE_RUN'],
  READ_ONLY: [],
}

export function hasPermission(permissions: PermissionCode[], permission?: PermissionCode) {
  if (!permission) return true
  return permissions.includes(permission)
}
