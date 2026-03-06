import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'
import type { Role } from '../types/auth'
import { useAuthStore } from '../features/auth/authStore'
import { getHomePathForRole } from '../features/auth/access'

interface RoleGuardProps {
  roles: Role[]
}

export function RoleGuard({ roles, children }: PropsWithChildren<RoleGuardProps>) {
  const role = useAuthStore((state) => state.role)
  if (!role || !roles.includes(role)) {
    return <Navigate to={getHomePathForRole(role)} replace />
  }
  return <>{children}</>
}
