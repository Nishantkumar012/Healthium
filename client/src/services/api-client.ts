import axios, { AxiosInstance, AxiosError } from 'axios'
import Cookies from 'js-cookie'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired, try refresh
      const refreshToken = Cookies.get('refreshToken')
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {
            refreshToken,
          })
          const { accessToken } = response.data.data
          Cookies.set('accessToken', accessToken)

          // Retry original request
          if (error.config) {
            error.config.headers.Authorization = `Bearer ${accessToken}`
            return apiClient(error.config)
          }
        } catch {
          // Refresh failed, redirect to login
          Cookies.remove('accessToken')
          Cookies.remove('refreshToken')
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default apiClient
