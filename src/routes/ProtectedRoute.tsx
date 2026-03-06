import type { PropsWithChildren } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '../features/auth/authStore'
import { ROUTE_PATHS } from './routePaths'

export function ProtectedRoute({ children }: PropsWithChildren) {
  const token = useAuthStore((state) => state.token)
  const location = useLocation()
  if (!token) {
    const redirect = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`${ROUTE_PATHS.LOGIN}?redirect=${redirect}`} replace />
  }
  return <>{children}</>
}
