export interface SMSJobData {
  phoneNumber: string;
  message: string;
  templateId?: string;
}

export interface PushNotificationJobData {
  userId: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  deviceTokens?: string[];
}

export interface AppointmentReminderData {
  consultationId: string;
  patientId: string;
  doctorId: string;
  scheduledTime: string;
  reminderType: 'reminder_24h' | 'reminder_1h' | 'reminder_15m';
}

export interface DeviceTokenRequest {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface PerformanceMetrics {
  endpoint: string;
  method: string;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestCount: number;
  errorCount: number;
  errorRate: number;
}

export interface SystemHealthCheck {
  database: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    connections: number;
    responseTime: number;
  };
  redis: {
    status: 'healthy' | 'degraded' | 'unhealthy';
    memoryUsage: number;
    responseTime: number;
  };
  jobQueues: {
    emailQueue: { status: string; pendingJobs: number; failedJobs: number };
    notificationQueue: { status: string; pendingJobs: number; failedJobs: number };
    analyticsQueue: { status: string; pendingJobs: number; failedJobs: number };
  };
  systemUptime: number;
  timestamp: string;
}
