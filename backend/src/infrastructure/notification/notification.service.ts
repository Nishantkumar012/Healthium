import { emailQueue, notificationQueue, analyticsQueue } from '../queue/queue.client';
import { logger } from '../observability/logger';
import {
  EmailJobData,
  NotificationJobData,
  AnalyticsJobData,
} from '../../common/types/notification.types';

export class NotificationService {
  // Email Notifications

  static async sendEmail(data: EmailJobData): Promise<void> {
    try {
      await emailQueue.add(data, {
        priority: 1, // High priority
      });

      logger.info('Email job queued', {
        to: data.to,
        subject: data.subject,
        template: data.template,
      });
    } catch (error) {
      logger.error('Failed to queue email job', { error, data });
      throw error;
    }
  }

  static async sendConsultationReminder(
    email: string,
    patientName: string,
    doctorName: string,
    consultationTime: string,
    consultationId: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Consultation Reminder - Healthum',
      template: 'consultation_reminder',
      data: {
        patientName,
        doctorName,
        consultationTime,
        consultationLink: `https://healthum.com/consultation/${consultationId}`,
      },
    });
  }

  static async sendPaymentSuccessEmail(
    email: string,
    patientName: string,
    amount: number,
    consultationId: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Payment Successful - Healthum',
      template: 'payment_success',
      data: {
        patientName,
        amount,
        consultationId,
        paymentDate: new Date().toISOString(),
      },
    });
  }

  static async sendPrescriptionReadyEmail(
    email: string,
    patientName: string,
    doctorName: string,
    prescriptionId: string
  ): Promise<void> {
    await this.sendEmail({
      to: email,
      subject: 'Your Prescription is Ready - Healthum',
      template: 'prescription_ready',
      data: {
        patientName,
        doctorName,
        prescriptionLink: `https://healthum.com/prescription/${prescriptionId}`,
      },
    });
  }

  // In-App Notifications

  static async sendNotification(data: NotificationJobData): Promise<void> {
    try {
      await notificationQueue.add(data, {
        priority: 5, // Normal priority
      });

      logger.info('Notification job queued', {
        userId: data.userId,
        type: data.type,
        title: data.title,
      });
    } catch (error) {
      logger.error('Failed to queue notification job', { error, data });
      throw error;
    }
  }

  static async sendConsultationReminderNotification(
    userId: string,
    consultationId: string,
    doctorName: string,
    time: string
  ): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'consultation_reminder',
      title: 'Upcoming Consultation',
      message: `Your consultation with ${doctorName} is scheduled at ${time}`,
      data: { consultationId },
    });
  }

  static async sendPaymentSuccessNotification(
    userId: string,
    amount: number
  ): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'payment_success',
      title: 'Payment Successful',
      message: `Payment of ₹${amount} completed successfully`,
    });
  }

  static async sendPrescriptionReadyNotification(
    userId: string,
    prescriptionId: string
  ): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'prescription_ready',
      title: 'Prescription Ready',
      message: 'Your prescription is ready to download',
      data: { prescriptionId },
    });
  }

  static async sendConsultationCompletedNotification(
    userId: string,
    consultationId: string,
    doctorName: string
  ): Promise<void> {
    await this.sendNotification({
      userId,
      type: 'consultation_completed',
      title: 'Consultation Completed',
      message: `Your consultation with ${doctorName} has been completed`,
      data: { consultationId },
    });
  }

  // Analytics Events

  static async trackEvent(data: AnalyticsJobData): Promise<void> {
    try {
      await analyticsQueue.add(data, {
        priority: 10, // Low priority
      });

      logger.info('Analytics event queued', {
        event: data.event,
        userId: data.userId,
      });
    } catch (error) {
      logger.error('Failed to queue analytics job', { error, data });
      // Don't throw - analytics failures shouldn't break user flows
    }
  }

  static async trackConsultationBooked(
    patientId: string,
    doctorId: string,
    consultationType: string
  ): Promise<void> {
    await this.trackEvent({
      event: 'consultation_booked',
      userId: patientId,
      data: {
        doctorId,
        consultationType,
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  static async trackPaymentCompleted(
    patientId: string,
    amount: number,
    paymentMethod: string
  ): Promise<void> {
    await this.trackEvent({
      event: 'payment_completed',
      userId: patientId,
      data: {
        amount,
        paymentMethod,
        currency: 'INR',
      },
      timestamp: new Date().toISOString(),
    });
  }

  static async trackConsultationCompleted(
    doctorId: string,
    patientId: string,
    duration: number
  ): Promise<void> {
    await this.trackEvent({
      event: 'consultation_completed',
      userId: doctorId,
      data: {
        patientId,
        duration,
      },
      timestamp: new Date().toISOString(),
    });
  }

  static async trackReviewSubmitted(
    patientId: string,
    doctorId: string,
    rating: number
  ): Promise<void> {
    await this.trackEvent({
      event: 'review_submitted',
      userId: patientId,
      data: {
        doctorId,
        rating,
      },
      timestamp: new Date().toISOString(),
    });
  }
}
