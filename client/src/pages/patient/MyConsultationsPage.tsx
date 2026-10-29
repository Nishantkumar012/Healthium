import { useState, useEffect } from 'react'
import { apiClient } from '@/services/api-client'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Loader, AlertCircle, Calendar, Clock, Video, Phone, MessageSquare, User, FileText, CheckCircle, XCircle } from 'lucide-react'

interface Consultation {
  id: string
  consultationNumber: string
  doctorId: string
  doctorName: string
  doctorSpecialization: string[]
  scheduledAt: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  consultationType: 'video' | 'audio' | 'chat'
  chiefComplaint?: string
  diagnosis?: string
  notes?: string
  startedAt?: string
  completedAt?: string
  meetingLink?: string
  consultationFee: number
}

export function MyConsultationsPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(true)
  const [consultations, setConsultations] = useState<Consultation[]>([])
  const [filteredConsultations, setFilteredConsultations] = useState<Consultation[]>([])
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  useEffect(() => {
    fetchConsultations()
  }, [])

  useEffect(() => {
    filterConsultations()
  }, [consultations, statusFilter])

  const fetchConsultations = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.get<any>('/consultations')
      const consultationsList = response.data.data || []
      setConsultations(consultationsList)
      setFilteredConsultations(consultationsList)
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to load consultations'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const filterConsultations = () => {
    if (statusFilter === 'all') {
      setFilteredConsultations(consultations)
    } else {
      setFilteredConsultations(consultations.filter((c) => c.status === statusFilter))
    }
  }

  const handleCancelConsultation = async (consultationId: string) => {
    if (!confirm('Are you sure you want to cancel this consultation?')) {
      return
    }

    try {
      await apiClient.patch(`/consultations/${consultationId}/cancel`)
      toast.success('Consultation cancelled successfully')
      fetchConsultations()
    } catch (err: any) {
      const message = err.response?.data?.error?.message || 'Failed to cancel consultation'
      toast.error(message)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { icon: any; color: string; text: string }> = {
      scheduled: { icon: Clock, color: 'bg-warning-100 text-warning-800', text: 'Scheduled' },
      in_progress: { icon: Video, color: 'bg-primary-100 text-primary-800', text: 'In Progress' },
      completed: { icon: CheckCircle, color: 'bg-success-100 text-success-800', text: 'Completed' },
      cancelled: { icon: XCircle, color: 'bg-danger-100 text-danger-800', text: 'Cancelled' },
      no_show: { icon: XCircle, color: 'bg-secondary-100 text-secondary-800', text: 'No Show' },
    }

    const badge = badges[status] || badges.scheduled
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${badge.color}`}>
        <Icon className="w-4 h-4" />
        {badge.text}
      </span>
    )
  }

  const getConsultationTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="w-4 h-4" />
      case 'audio':
        return <Phone className="w-4 h-4" />
      case 'chat':
        return <MessageSquare className="w-4 h-4" />
      default:
        return <Video className="w-4 h-4" />
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-secondary-900">My Consultations</h1>
          <p className="text-secondary-600 mt-2">View and manage your consultation history</p>
        </div>
        <button
          onClick={() => navigate('/patient/book-consultation')}
          className="btn-primary"
        >
          Book New Consultation
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-danger-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2">
        {['all', 'scheduled', 'completed', 'cancelled'].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
              statusFilter === status
                ? 'bg-primary-600 text-white'
                : 'bg-secondary-100 text-secondary-700 hover:bg-secondary-200'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Consultations List */}
      {filteredConsultations.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {filteredConsultations.map((consultation) => (
            <div
              key={consultation.id}
              className="bg-white rounded-lg shadow-md border border-secondary-200 p-6 hover:shadow-lg transition"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-secondary-900">
                      {consultation.consultationNumber}
                    </h3>
                    {getStatusBadge(consultation.status)}
                  </div>
                  <div className="flex items-center gap-2 text-secondary-600">
                    <User className="w-4 h-4" />
                    <p>Dr. {consultation.doctorName}</p>
                  </div>
                  <p className="text-sm text-secondary-500 mt-1">
                    {consultation.doctorSpecialization?.join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-secondary-700">
                    ${consultation.consultationFee}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm text-secondary-700">
                  <Calendar className="w-4 h-4" />
                  {new Date(consultation.scheduledAt).toLocaleDateString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-700">
                  <Clock className="w-4 h-4" />
                  {new Date(consultation.scheduledAt).toLocaleTimeString()}
                </div>
                <div className="flex items-center gap-2 text-sm text-secondary-700">
                  {getConsultationTypeIcon(consultation.consultationType)}
                  <span className="capitalize">{consultation.consultationType} Consultation</span>
                </div>
                {consultation.completedAt && (
                  <div className="flex items-center gap-2 text-sm text-success-700">
                    <CheckCircle className="w-4 h-4" />
                    Completed {new Date(consultation.completedAt).toLocaleDateString()}
                  </div>
                )}
              </div>

              {consultation.chiefComplaint && (
                <div className="mb-4 p-3 bg-secondary-50 rounded border border-secondary-200">
                  <p className="text-sm font-medium text-secondary-900 mb-1">Chief Complaint</p>
                  <p className="text-sm text-secondary-700">{consultation.chiefComplaint}</p>
                </div>
              )}

              {consultation.diagnosis && (
                <div className="mb-4 p-3 bg-primary-50 rounded border border-primary-200">
                  <p className="text-sm font-medium text-primary-900 mb-1">Diagnosis</p>
                  <p className="text-sm text-primary-700">{consultation.diagnosis}</p>
                </div>
              )}

              <div className="flex items-center gap-3 pt-4 border-t border-secondary-200">
                <button
                  onClick={() => navigate(`/patient/consultation/${consultation.id}`)}
                  className="btn-secondary flex-1"
                >
                  View Details
                </button>
                {consultation.status === 'scheduled' && (
                  <>
                    {consultation.meetingLink && (
                      <a
                        href={consultation.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex-1"
                      >
                        Join Meeting
                      </a>
                    )}
                    <button
                      onClick={() => handleCancelConsultation(consultation.id)}
                      className="px-4 py-2 bg-danger-100 text-danger-700 hover:bg-danger-200 rounded-lg font-medium transition"
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-md border border-secondary-200">
          <Calendar className="w-16 h-16 text-secondary-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-secondary-900 mb-2">No Consultations Found</h3>
          <p className="text-secondary-600 mb-6">
            {statusFilter === 'all'
              ? "You haven't booked any consultations yet"
              : `No ${statusFilter} consultations found`}
          </p>
          <button
            onClick={() => navigate('/patient/book-consultation')}
            className="btn-primary"
          >
            Book Your First Consultation
          </button>
        </div>
      )}
    </div>
  )
}
