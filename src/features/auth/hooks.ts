import { useAuthStore } from './authStore'
import { hasPermission } from './permissions'
import type { PermissionCode } from '../../types/navigation'

export function useAuth() {
  return useAuthStore((state) => ({
    token: state.token,
    role: state.role,
    permissions: state.permissions,
    userInfo: state.userInfo,
    logout: state.logout,
  }))
}

export function useCan(permission?: PermissionCode) {
  return useAuthStore((state) => hasPermission(state.permissions, permission))
}
