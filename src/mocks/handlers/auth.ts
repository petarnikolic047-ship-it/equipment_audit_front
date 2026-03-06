import { http, HttpResponse } from 'msw'
import { permissionsForRole } from '../rbac'
import type { Role } from '../../types/auth'
import { mockUsersByRole } from '../authUsers'

export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as { username?: string; password?: string; role?: Role }
    const username = body.username?.trim()
    const password = body.password?.trim()
    const role = body.role ?? 'ADMIN'

    if (!username || !password) {
      return HttpResponse.json(
        {
          status: 400,
          code: 'VALIDATION_ERROR',
          message: 'Username and password are required.',
        },
        { status: 400 },
      )
    }

    if (password !== 'demo') {
      return HttpResponse.json(
        {
          status: 401,
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid credentials.',
        },
        { status: 401 },
      )
    }

    const user = mockUsersByRole[role]
    return HttpResponse.json({
      accessToken: `mock-token|${role}|${user.employeeId ?? ''}|${Date.now()}`,
      role,
      permissions: permissionsForRole(role),
      userInfo: user,
    })
  }),
]
