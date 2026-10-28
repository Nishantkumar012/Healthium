export interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface NotificationJobData {
  userId: string;
  type: 'consultation_reminder' | 'payment_success' | 'prescription_ready' | 'consultation_completed';
  title: string;
  message: string;
  data?: Record<string, any>;
}

export interface AnalyticsJobData {
  event: string;
  userId?: string;
  data: Record<string, any>;
  timestamp: string;
}

export interface CreateReviewRequest {
  consultationId: string;
  rating: number; // 1-5
  comment: string;
}

export interface ReviewResponse {
  id: string;
  consultationId: string;
  patientId: string;
  doctorId: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt: string;
}
