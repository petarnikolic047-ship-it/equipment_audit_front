import type { PropsWithChildren } from 'react'
import type { Role } from '../../types/auth'
import { useAuthStore } from '../../features/auth/authStore'

interface RoleGateProps {
  roles: Role[]
  fallback?: JSX.Element | null
}

export function RoleGate({ roles, fallback = null, children }: PropsWithChildren<RoleGateProps>) {
  const role = useAuthStore((state) => state.role)
  if (!role || !roles.includes(role)) return fallback
  return <>{children}</>
}

