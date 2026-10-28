import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Mail, Lock, Loader, Users } from 'lucide-react'
import { apiClient } from '@/services/api-client'
import { useAuthStore } from '@/stores/auth.store'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

type LoginFormData = z.infer<typeof loginSchema>

const GUEST_ACCOUNTS = {
  patient: { email: 'patient@healthum.demo', password: 'Demo@12345', label: 'Guest Patient' },
  doctor: { email: 'doctor@healthum.demo', password: 'Demo@12345', label: 'Guest Doctor' },
}

export function LoginPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const { setUser, setAccessToken } = useAuthStore()

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  })

  const handleGuestLogin = (accountType: 'patient' | 'doctor') => {
    const account = GUEST_ACCOUNTS[accountType]
    setValue('email', account.email)
    setValue('password', account.password)
  }

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      const response = await apiClient.post<any>('/auth/login', data)
      const { data: responseData } = response.data

      setUser(responseData.user)
      setAccessToken(responseData.accessToken)

      if (responseData.refreshToken) {
        const Cookies = (await import('js-cookie')).default
        Cookies.set('refreshToken', responseData.refreshToken, {
          expires: 7,
          secure: true,
          sameSite: 'Strict',
        })
      }

      toast.success('Login successful!')

      if (responseData.user.userType === 'doctor') {
        navigate('/doctor/dashboard')
      } else {
        navigate('/patient/dashboard')
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Login failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary-50">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Healthum</h1>
            <p className="text-secondary-600">Telemedicine Platform</p>
          </div>

          <h2 className="text-2xl font-bold text-secondary-900 mb-6 text-center">Login</h2>

          {/* Guest Account Options */}
          <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
            <div className="flex items-center gap-2 mb-3">
              <Users className="w-4 h-4 text-primary-600" />
              <p className="text-sm font-medium text-primary-900">Demo Accounts</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleGuestLogin('patient')}
                className="px-3 py-2 bg-white border border-primary-300 text-primary-700 rounded hover:bg-primary-50 text-sm font-medium transition"
              >
                Patient Demo
              </button>
              <button
                type="button"
                onClick={() => handleGuestLogin('doctor')}
                className="px-3 py-2 bg-white border border-primary-300 text-primary-700 rounded hover:bg-primary-50 text-sm font-medium transition"
              >
                Doctor Demo
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-secondary-400" />
                <input
                  {...register('email')}
                  type="email"
                  placeholder="your@email.com"
                  className="input-base pl-10"
                />
              </div>
              {errors.email && (
                <p className="text-danger-600 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-5 h-5 text-secondary-400" />
                <input
                  {...register('password')}
                  type="password"
                  placeholder="Enter your password"
                  className="input-base pl-10"
                />
              </div>
              {errors.password && (
                <p className="text-danger-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Logging in...
                </>
              ) : (
                'Login'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 hover:text-primary-700 font-medium">
                Register here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
