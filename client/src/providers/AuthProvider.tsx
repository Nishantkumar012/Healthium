import { createContext, useContext, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import apiClient from '@/services/api-client'
import { ApiResponse, User } from '@/types'

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, setUser, setAccessToken, setIsLoading, isLoading, logout } = useAuthStore()

  // Initialize auth on mount
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true)
      try {
        const response = await apiClient.get<ApiResponse<User>>('/auth/me')
        setUser(response.data.data)
        setAccessToken(response.data.data.id) // Token should be set from cookie
      } catch {
        setUser(null)
        logout()
      } finally {
        setIsLoading(false)
      }
    }

    initAuth()
  }, [setUser, setAccessToken, setIsLoading, logout])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post<ApiResponse<any>>('/auth/login', {
        email,
        password,
      })
      const { user, accessToken, refreshToken } = response.data.data
      setAccessToken(accessToken)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      setUser(user)
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (data: any) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post<ApiResponse<any>>('/auth/register', data)
      const { user, accessToken, refreshToken } = response.data.data
      setAccessToken(accessToken)
      if (refreshToken) {
        localStorage.setItem('refreshToken', refreshToken)
      }
      setUser(user)
    } finally {
      setIsLoading(false)
    }
  }

  const value: AuthContextType = {
    user: user || null,
    isAuthenticated: !!user,
    isLoading,
    login,
    register,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
