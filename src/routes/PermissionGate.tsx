import type { PropsWithChildren } from 'react'
import type { PermissionCode } from '../types/navigation'
import { useCan } from '../features/auth/hooks'

interface PermissionGateProps {
  permission?: PermissionCode
  fallback?: JSX.Element | null
}

export function PermissionGate({ permission, fallback = null, children }: PropsWithChildren<PermissionGateProps>) {
  const allowed = useCan(permission)
  if (!allowed) return fallback
  return <>{children}</>
}
