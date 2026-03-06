import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthSession, LoginResponse } from '../../types/auth'

interface AuthState extends AuthSession {
  setSession: (session: LoginResponse) => void
  logout: () => void
}

const initialState: AuthSession = {
  token: null,
  role: null,
  permissions: [],
  userInfo: null,
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      ...initialState,
      setSession: (session) =>
        set({
          token: session.accessToken,
          role: session.role,
          permissions: session.permissions,
          userInfo: session.userInfo,
        }),
      logout: () => set(initialState),
    }),
    {
      name: 'ems-auth-v1',
    },
  ),
)
