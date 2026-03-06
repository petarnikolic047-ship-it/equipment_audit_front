import { loginResponseSchema } from '../schemas/auth'
import { postParsed } from '../client'
import { normalizeApiError } from '../errors'
import type { LoginRequest, LoginResponse } from '../../types/auth'
import type { Role } from '../../types/auth'
import { rolePermissions } from '../../features/auth/permissions'

const fallbackUsersByRole: Record<Role, LoginResponse['userInfo']> = {
  ADMIN: { id: 1, username: 'john.doe', email: 'john.doe@company.com', fullName: 'John Doe', employeeId: 1 },
  EMPLOYEE: { id: 2, username: 'marko.milic', email: 'marko.milic@company.com', fullName: 'Marko Milic', employeeId: 2 },
  MVP: { id: 3, username: 'mvp.demo', email: 'mvp.demo@company.com', fullName: 'MVP Demo User', employeeId: 4 },
  MANAGER: { id: 4, username: 'manager.one', email: 'manager.one@company.com', fullName: 'Milena Manager', employeeId: 4 },
  READ_ONLY: { id: 6, username: 'viewer', email: 'viewer@company.com', fullName: 'Read Only User', employeeId: 2 },
  OWNER: { id: 5, username: 'owner.account', email: 'owner@company.com', fullName: 'Owner Account', employeeId: 3 },
}

export async function login(request: LoginRequest): Promise<LoginResponse> {
  try {
    return await postParsed('/auth/login', request, loginResponseSchema)
  } catch (error) {
    const normalized = normalizeApiError(error)
    const allowFallback = import.meta.env.VITE_ENABLE_MSW !== 'false'

    if (!allowFallback || normalized.status !== 404) {
      throw normalized
    }

    const username = request.username?.trim()
    const password = request.password?.trim()
    const role = request.role ?? 'ADMIN'

    if (!username || !password) {
      throw { status: 400, code: 'VALIDATION_ERROR', message: 'Username and password are required.' }
    }

    if (password !== 'demo') {
      throw { status: 401, code: 'INVALID_CREDENTIALS', message: 'Invalid credentials.' }
    }

    return loginResponseSchema.parse({
      accessToken: `offline-token|${role}|${Date.now()}`,
      role,
      permissions: rolePermissions[role],
      userInfo: fallbackUsersByRole[role],
    })
  }
}
