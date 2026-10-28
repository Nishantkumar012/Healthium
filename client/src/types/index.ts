export type UserRole = 'patient' | 'doctor' | 'admin'

export interface User {
  id: string
  email: string
  phone?: string
  role: UserRole
  status: 'active' | 'suspended' | 'deleted'
  isEmailVerified: boolean
  isPhoneVerified: boolean
  mfaEnabled: boolean
  createdAt: string
  updatedAt: string
}

export interface Profile {
  id: string
  userId: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: string
  address?: Record<string, any>
  avatarUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Doctor {
  id: string
  userId: string
  licenseNumber: string
  specialization: string[]
  qualification: string
  experienceYears: number
  languages: string[]
  consultationFee: number
  rating: number
  totalConsultations: number
  bio?: string
  isVerified: boolean
  isAvailable: boolean
  createdAt: string
  updatedAt: string
}

export interface AvailabilitySlot {
  id: string
  doctorId: string
  slotDate: string
  startTime: string
  endTime: string
  status: 'available' | 'booked' | 'blocked'
  maxBookings: number
  currentBookings: number
  createdAt: string
  updatedAt: string
}

export interface Consultation {
  id: string
  consultationNumber: string
  patientId: string
  doctorId: string
  slotId: string
  scheduledAt: string
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'no_show'
  consultationType: 'video' | 'audio' | 'chat'
  chiefComplaint?: string
  diagnosis?: string
  notes?: string
  startedAt?: string
  completedAt?: string
  meetingLink?: string
  recordingUrl?: string
  createdAt: string
  updatedAt: string
}

export interface Payment {
  id: string
  paymentId: string
  consultationId: string
  patientId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded'
  paymentMethod?: string
  gatewayTransactionId?: string
  createdAt: string
  updatedAt: string
}

export interface Prescription {
  id: string
  prescriptionNumber: string
  consultationId: string
  patientId: string
  doctorId: string
  medications: Array<{
    name: string
    dosage: string
    frequency: string
    duration: string
    instructions?: string
  }>
  instructions?: string
  validUntil?: string
  isDispensed: boolean
  pdfUrl?: string
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken?: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  error?: {
    code: string
    message: string
    details?: any
  }
  metadata: {
    timestamp: string
    requestId: string
  }
}
