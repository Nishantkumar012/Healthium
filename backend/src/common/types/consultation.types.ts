export interface CreateSlotRequest {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  startTime: string; // HH:mm format
  endTime: string;
  isRecurring: boolean;
  recurringEndDate?: string; // YYYY-MM-DD
}

export interface BookConsultationRequest {
  slotId: string;
  chiefComplaint: string;
  consultationType: 'video' | 'audio' | 'chat';
}

export interface CreatePaymentRequest {
  consultationId: string;
  amount: number;
  paymentMethod: 'card' | 'upi' | 'wallet';
}

export interface UpdateConsultationStatusRequest {
  status: 'in_progress' | 'completed' | 'cancelled';
  notes?: string;
}

export interface ConsultationResponse {
  id: string;
  consultationNumber: string;
  patientId: string;
  doctorId: string;
  slotId: string;
  status: string;
  consultationType: string;
  chiefComplaint: string;
  diagnosis?: string;
  notes?: string;
  scheduledAt: string;
  startedAt?: string;
  completedAt?: string;
  meetingLink?: string;
  recordingUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySlotResponse {
  id: string;
  doctorId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  bookedCount: number;
  totalSlots: number;
  isRecurring: boolean;
  recurringEndDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentResponse {
  id: string;
  paymentId: string;
  consultationId: string;
  amount: number;
  currency: string;
  status: string;
  paymentMethod: string;
  gatewayTransactionId?: string;
  refundAmount?: number;
  refundedAt?: string;
  createdAt: string;
  updatedAt: string;
}
