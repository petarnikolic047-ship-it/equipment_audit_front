import type { Role } from '../types/auth'

export interface MockAuthUser {
  id: number
  username: string
  email: string
  fullName: string
  employeeId: number | null
}

export const mockUsersByRole: Record<Role, MockAuthUser> = {
  ADMIN: { id: 1, username: 'john.doe', email: 'john.doe@company.com', fullName: 'John Doe', employeeId: 1 },
  EMPLOYEE: { id: 2, username: 'marko.milic', email: 'marko.milic@company.com', fullName: 'Marko Milic', employeeId: 2 },
  MVP: { id: 3, username: 'mvp.demo', email: 'mvp.demo@company.com', fullName: 'MVP Demo User', employeeId: 4 },
  MANAGER: { id: 4, username: 'manager.one', email: 'manager.one@company.com', fullName: 'Milena Manager', employeeId: 4 },
  OWNER: { id: 5, username: 'owner.account', email: 'owner@company.com', fullName: 'Owner Account', employeeId: 3 },
  READ_ONLY: { id: 6, username: 'viewer', email: 'viewer@company.com', fullName: 'Read Only User', employeeId: 2 },
}

