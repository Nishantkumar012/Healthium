import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/auth.store'
import { apiClient } from '@/services/api-client'
import toast from 'react-hot-toast'
import { Calendar, Heart, TrendingUp, Clock, AlertCircle, Loader } from 'lucide-react'

interface DashboardStats {
  totalConsultations: number
  upcomingConsultations: number
  completedConsultations: number
  totalPrescriptions: number
}

interface UpcomingConsultation {
  id: string
  consultationNumber: string
  doctorName: string
  doctorSpecialization: string[]
  scheduledAt: string
  consultationType: string
  status: string
}

export function PatientDashboardPage() {
  const { user } = useAuthStore()
  const [isLoading, setIsLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [upcomingConsultations, setUpcomingConsultations] = useState<UpcomingConsultation[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      // Fetch consultations to calculate stats
      const consultationsRes = await apiClient.get<any>('/consultations?status=all')
      const consultations = consultationsRes.data.data || []

      // Calculate stats
      const stats: DashboardStats = {
        totalConsultations: consultations.length,
        upcomingConsultations: consultations.filter(
          (c: any) => c.status === 'scheduled' && new Date(c.scheduledAt) > new Date()
        ).length,
        completedConsultations: consultations.filter(
          (c: any) => c.status === 'completed'
        ).length,
        totalPrescriptions: 0, // Will fetch separately
      }

      // Fetch prescriptions count
      try {
        const prescriptionsRes = await apiClient.get<any>('/consultations/prescriptions')
        stats.totalPrescriptions = prescriptionsRes.data.data?.length || 0
      } catch {
        // Prescriptions endpoint might not exist yet
      }

      setStats(stats)

      // Get upcoming consultations (next 3)
      const upcoming = consultations
        .filter((c: any) => c.status === 'scheduled' && new Date(c.scheduledAt) > new Date())
        .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
        .slice(0, 3)

      setUpcomingConsultations(upcoming)
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to load dashboard data'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-lg p-8 border border-primary-200">
        <h1 className="text-3xl font-bold text-primary-900 mb-2">
          Welcome back, {user?.firstName || 'Patient'}!
        </h1>
        <p className="text-primary-700">
          Manage your health, book consultations, and track your medical records all in one place.
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-danger-900">Error</p>
            <p className="text-sm text-danger-700">{error}</p>
          </div>
        </div>
      )}

      {/* Stats Grid */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard
            icon={Calendar}
            label="Total Consultations"
            value={stats.totalConsultations}
            color="primary"
          />
          <StatCard
            icon={Clock}
            label="Upcoming"
            value={stats.upcomingConsultations}
            color="warning"
          />
          <StatCard
            icon={TrendingUp}
            label="Completed"
            value={stats.completedConsultations}
            color="success"
          />
          <StatCard
            icon={Heart}
            label="Prescriptions"
            value={stats.totalPrescriptions}
            color="danger"
          />
        </div>
      )}

      {/* Upcoming Consultations */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-secondary-200">
        <h2 className="text-2xl font-bold text-secondary-900 mb-6">Upcoming Consultations</h2>

        {upcomingConsultations.length > 0 ? (
          <div className="space-y-4">
            {upcomingConsultations.map((consultation) => (
              <div
                key={consultation.id}
                className="flex items-start justify-between p-4 bg-secondary-50 rounded-lg border border-secondary-200 hover:border-primary-300 transition"
              >
                <div className="flex-1">
                  <h3 className="font-semibold text-secondary-900">
                    Dr. {consultation.doctorName}
                  </h3>
                  <p className="text-sm text-secondary-600 mb-2">
                    {consultation.doctorSpecialization?.join(', ')}
                  </p>
                  <p className="text-sm text-secondary-700">
                    <Calendar className="inline w-4 h-4 mr-1" />
                    {new Date(consultation.scheduledAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-secondary-600 mt-1">
                    Type: <span className="capitalize">{consultation.consultationType}</span>
                  </p>
                </div>
                <div className="ml-4">
                  <span className="inline-block px-3 py-1 bg-primary-100 text-primary-800 text-sm font-medium rounded-full">
                    {consultation.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-secondary-300 mx-auto mb-3" />
            <p className="text-secondary-600">No upcoming consultations</p>
            <p className="text-sm text-secondary-500">Book a consultation with a doctor to get started</p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <a
          href="/patient/book-consultation"
          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg p-6 text-center font-medium transition transform hover:scale-105"
        >
          📅 Book a Consultation
        </a>
        <a
          href="/patient/profile"
          className="bg-secondary-200 hover:bg-secondary-300 text-secondary-900 rounded-lg p-6 text-center font-medium transition transform hover:scale-105"
        >
          👤 Update Profile
        </a>
      </div>
    </div>
  )
}

interface StatCardProps {
  icon: React.ComponentType<{ className: string }>
  label: string
  value: number
  color: 'primary' | 'warning' | 'success' | 'danger'
}

function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-600 border-primary-200',
    warning: 'bg-warning-50 text-warning-600 border-warning-200',
    success: 'bg-success-50 text-success-600 border-success-200',
    danger: 'bg-danger-50 text-danger-600 border-danger-200',
  }

  return (
    <div className={`rounded-lg border p-6 ${colorClasses[color]}`}>
      <Icon className="w-8 h-8 mb-3" />
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}
