import type { Role } from '../../types/auth'
import { ROUTE_PATHS } from '../../routes/routePaths'

const roleRoutePrefixes: Record<Role, string[]> = {
  ADMIN: ['/'],
  MANAGER: ['/'],
  OWNER: ['/'],
  READ_ONLY: [ROUTE_PATHS.DASHBOARD, ROUTE_PATHS.MY_EQUIPMENT, ROUTE_PATHS.ASSETS, ROUTE_PATHS.EMPLOYEES, ROUTE_PATHS.ASSIGNMENTS],
  EMPLOYEE: [ROUTE_PATHS.MY_EQUIPMENT, ROUTE_PATHS.ASSETS, ROUTE_PATHS.ASSIGNMENTS],
  MVP: [ROUTE_PATHS.MY_EQUIPMENT, ROUTE_PATHS.EMPLOYEES, ROUTE_PATHS.ASSETS, ROUTE_PATHS.ASSIGNMENTS],
}

const roleHomePath: Record<Role, string> = {
  ADMIN: ROUTE_PATHS.DASHBOARD,
  MANAGER: ROUTE_PATHS.DASHBOARD,
  OWNER: ROUTE_PATHS.DASHBOARD,
  READ_ONLY: ROUTE_PATHS.ASSETS,
  EMPLOYEE: ROUTE_PATHS.MY_EQUIPMENT,
  MVP: ROUTE_PATHS.ASSETS,
}

function matchesPrefix(pathname: string, prefix: string) {
  if (prefix === '/') {
    return true
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`)
}

export function canRoleAccessPath(role: Role | null, pathname: string) {
  if (!role) return false
  const prefixes = roleRoutePrefixes[role]
  return prefixes.some((prefix) => matchesPrefix(pathname, prefix))
}

export function getHomePathForRole(role: Role | null) {
  if (!role) return ROUTE_PATHS.LOGIN
  return roleHomePath[role]
}

