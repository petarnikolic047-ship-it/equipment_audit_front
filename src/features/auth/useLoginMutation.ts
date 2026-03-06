import { useMutation } from '@tanstack/react-query'
import { login } from '../../api/services/authService'
import { useAuthStore } from './authStore'
import type { LoginRequest } from '../../types/auth'

export function useLoginMutation() {
  const setSession = useAuthStore((state) => state.setSession)
  return useMutation({
    mutationFn: (payload: LoginRequest) => login(payload),
    onSuccess: (session) => setSession(session),
  })
}
