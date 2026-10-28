import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Mail, Lock, User, Phone, Loader, CheckCircle, Users, Info } from 'lucide-react'
import { apiClient } from '@/services/api-client'
import { useAuthStore } from '@/stores/auth.store'

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  userType: z.enum(['patient', 'doctor'] as const, {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
})

type RegisterFormData = z.infer<typeof registerSchema>

const GUEST_ACCOUNTS = [
  {
    type: 'patient',
    email: 'patient@healthum.demo',
    password: 'Demo@12345',
    name: 'John Patient',
  },
  {
    type: 'doctor',
    email: 'doctor@healthum.demo',
    password: 'Demo@12345',
    name: 'Dr. Sarah Doctor',
  },
]

export function RegisterPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const { setUser, setAccessToken } = useAuthStore()

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      userType: 'patient',
    },
  })

  const selectedRole = watch('userType')

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true)
    try {
      const payload = {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        userType: data.userType,
      }

      const response = await apiClient.post<any>('/auth/register', payload)
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

      toast.success('Registration successful!')

      if (responseData.user.userType === 'doctor') {
        navigate('/doctor/dashboard')
      } else {
        navigate('/patient/dashboard')
      }
    } catch (error: any) {
      const message = error.response?.data?.error?.message || 'Registration failed'
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-secondary-50 py-12">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-secondary-900 mb-2">Healthum</h1>
            <p className="text-secondary-600">Telemedicine Platform</p>
          </div>

          <h2 className="text-2xl font-bold text-secondary-900 mb-6 text-center">Create Account</h2>

          {/* Guest Account Info */}
          <div className="mb-6 p-4 bg-warning-50 rounded-lg border border-warning-200">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-warning-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-warning-900 mb-2">Demo Accounts Available</p>
                <div className="space-y-1">
                  {GUEST_ACCOUNTS.map((account) => (
                    <p key={account.type} className="text-xs text-warning-800">
                      <span className="font-medium capitalize">{account.type}:</span> {account.email}
                    </p>
                  ))}
                </div>
                <p className="text-xs text-warning-700 mt-2">
                  Go to <Link to="/login" className="text-warning-800 underline font-medium">Login</Link> to try demo accounts
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-2">
                I am a
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['patient', 'doctor'] as const).map((type) => (
                  <label key={type} className="relative flex cursor-pointer">
                    <input
                      {...register('userType')}
                      type="radio"
                      value={type}
                      className="sr-only"
                    />
                    <div className={`w-full px-3 py-2 rounded-lg border-2 text-center font-medium transition-colors capitalize ${
                      selectedRole === type
                        ? 'border-primary-600 bg-primary-50 text-primary-700'
                        : 'border-secondary-200 bg-white text-secondary-600 hover:border-secondary-300'
                    }`}>
                      {type}
                    </div>
                  </label>
                ))}
              </div>
              {errors.userType && (
                <p className="text-danger-600 text-sm mt-1">{errors.userType.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  First Name
                </label>
                <input
                  {...register('firstName')}
                  type="text"
                  placeholder="John"
                  className="input-base"
                />
                {errors.firstName && (
                  <p className="text-danger-600 text-sm mt-1">{errors.firstName.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-700 mb-1">
                  Last Name
                </label>
                <input
                  {...register('lastName')}
                  type="text"
                  placeholder="Doe"
                  className="input-base"
                />
                {errors.lastName && (
                  <p className="text-danger-600 text-sm mt-1">{errors.lastName.message}</p>
                )}
              </div>
            </div>

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
                Phone
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-5 h-5 text-secondary-400" />
                <input
                  {...register('phone')}
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  className="input-base pl-10"
                />
              </div>
              {errors.phone && (
                <p className="text-danger-600 text-sm mt-1">{errors.phone.message}</p>
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
                  placeholder="At least 8 characters"
                  className="input-base pl-10"
                />
              </div>
              {errors.password && (
                <p className="text-danger-600 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-secondary-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <CheckCircle className="absolute left-3 top-3 w-5 h-5 text-secondary-400" />
                <input
                  {...register('confirmPassword')}
                  type="password"
                  placeholder="Confirm your password"
                  className="input-base pl-10"
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-danger-600 text-sm mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-6"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-secondary-600">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Login here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
