import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import Cookies from 'js-cookie'
import { User, UserRole } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isLoading: boolean

  setUser: (user: User | null) => void
  setAccessToken: (token: string | null) => void
  setIsLoading: (loading: boolean) => void
  logout: () => void
  hasRole: (roles: UserRole | UserRole[]) => boolean
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isLoading: false,

      setUser: (user) =>
        set(() => ({
          user,
          isAuthenticated: !!user,
        })),

      setAccessToken: (token) => {
        if (token) {
          Cookies.set('accessToken', token, {
            expires: 1, // 1 day
            secure: true,
            sameSite: 'Strict',
          })
        } else {
          Cookies.remove('accessToken')
        }
        set(() => ({ accessToken: token }))
      },

      setIsLoading: (loading) => set(() => ({ isLoading: loading })),

      logout: () => {
        Cookies.remove('accessToken')
        Cookies.remove('refreshToken')
        set(() => ({
          user: null,
          accessToken: null,
          isAuthenticated: false,
        }))
      },

      hasRole: (roles) => {
        const { user } = get()
        if (!user) return false
        const roleArray = Array.isArray(roles) ? roles : [roles]
        return roleArray.includes(user.role)
      },
    }),
    {
      name: 'auth-store',
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
