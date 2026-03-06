import { HttpResponse } from 'msw'
import { requireAuth } from '../db'
import type { PermissionCode } from '../../types/navigation'
import type { Role } from '../../types/auth'
import { mockUsersByRole } from '../authUsers'

export function unauthorized() {
  return HttpResponse.json({ status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' }, { status: 401 })
}

export function forbidden(permission: PermissionCode) {
  return HttpResponse.json(
    { status: 403, code: 'FORBIDDEN', message: `Missing permission ${permission}` },
    { status: 403 },
  )
}

export function notFound(message = 'Not found') {
  return HttpResponse.json({ status: 404, code: 'NOT_FOUND', message }, { status: 404 })
}

export function conflict(message: string, code = 'CONFLICT') {
  return HttpResponse.json({ status: 409, code, message }, { status: 409 })
}

export function badRequest(message: string, fieldErrors?: Record<string, string>) {
  return HttpResponse.json({ status: 400, code: 'VALIDATION_ERROR', message, fieldErrors }, { status: 400 })
}

export function ensureAuth(request: Request) {
  return requireAuth(request)
}

export interface AuthPrincipal {
  role: Role
  employeeId: number | null
}

function isRole(value: string): value is Role {
  return ['ADMIN', 'EMPLOYEE', 'MVP', 'MANAGER', 'READ_ONLY', 'OWNER'].includes(value)
}

export function getAuthPrincipal(request: Request): AuthPrincipal | null {
  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const token = auth.slice('Bearer '.length)

  if (token.startsWith('mock-token|')) {
    const [, roleRaw, employeeIdRaw] = token.split('|')
    const role = roleRaw?.toUpperCase()
    if (role && isRole(role)) {
      return {
        role,
        employeeId: employeeIdRaw ? Number(employeeIdRaw) : mockUsersByRole[role].employeeId,
      }
    }
  }

  const legacyMatch = token.match(/^mock-token-([a-z_]+)-/)
  if (legacyMatch) {
    const roleCandidate = legacyMatch[1].toUpperCase()
    if (isRole(roleCandidate)) {
      return {
        role: roleCandidate,
        employeeId: mockUsersByRole[roleCandidate].employeeId,
      }
    }
  }

  return null
}
