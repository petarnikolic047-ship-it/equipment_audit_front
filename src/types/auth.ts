import type { PermissionCode } from './navigation'

export type Role = 'ADMIN' | 'EMPLOYEE' | 'MVP' | 'MANAGER' | 'READ_ONLY' | 'OWNER'

export interface UserInfo {
  id: number
  username: string
  email: string
  fullName: string
  employeeId?: number | null
}

export interface LoginRequest {
  username: string
  password: string
  role?: Role
}

export interface LoginResponse {
  accessToken: string
  role: Role
  permissions: PermissionCode[]
  userInfo: UserInfo
}

export interface AuthSession {
  token: string | null
  role: Role | null
  permissions: PermissionCode[]
  userInfo: UserInfo | null
}
