import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { logger } from '../observability/logger';
import { cacheService } from '../cache/cache.service';
import { NotificationService } from '../notification/notification.service';

export class AdvancedNotificationService {
  // SMS Notifications

  static async sendSMS(phoneNumber: string, message: string): Promise<void> {
    // TODO: Integrate with Twilio/AWS SNS
    logger.info('SMS queued', {
      phoneNumber: this.maskPhone(phoneNumber),
      messageLength: message.length,
    });

    // For now, log to simulated queue
    await query(
      `INSERT INTO notification_logs (id, type, recipient, content, status, created_at)
       VALUES ($1, 'sms', $2, $3, 'queued', NOW())`,
      [uuidv4(), phoneNumber, message]
    );
  }

  static async sendConsultationReminderSMS(
    phoneNumber: string,
    patientName: string,
    doctorName: string,
    consultationTime: string
  ): Promise<void> {
    const message = `Hi ${patientName}, reminder: Your consultation with ${doctorName} is at ${consultationTime}. Reply CONFIRM to confirm.`;
    await this.sendSMS(phoneNumber, message);
  }

  static async sendPaymentReminderSMS(
    phoneNumber: string,
    amount: number
  ): Promise<void> {
    const message = `Payment of ₹${amount} is pending for your consultation. Please complete payment to confirm your appointment.`;
    await this.sendSMS(phoneNumber, message);
  }

  // Push Notifications

  static async registerDeviceToken(
    userId: string,
    token: string,
    platform: 'ios' | 'android' | 'web'
  ): Promise<void> {
    // Check if token already exists
    const existing = await query(
      'SELECT id FROM device_tokens WHERE user_id = $1 AND token = $2',
      [userId, token]
    );

    if (existing.rows.length > 0) {
      // Update last seen
      await query(
        'UPDATE device_tokens SET updated_at = NOW() WHERE user_id = $1 AND token = $2',
        [userId, token]
      );
    } else {
      // Insert new token
      await query(
        `INSERT INTO device_tokens (id, user_id, token, platform, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW())`,
        [uuidv4(), userId, token, platform]
      );
    }

    logger.info('Device token registered', { userId, platform });

    // Invalidate cache
    await cacheService.delete(`device_tokens:${userId}`);
  }

  static async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>
  ): Promise<void> {
    // Get user's device tokens
    const tokensResult = await query(
      'SELECT token, platform FROM device_tokens WHERE user_id = $1 AND is_active = true',
      [userId]
    );

    if (tokensResult.rows.length === 0) {
      logger.warn('No device tokens found for user', { userId });
      return;
    }

    // TODO: Send via FCM/APNs
    logger.info('Push notification sent', {
      userId,
      deviceCount: tokensResult.rows.length,
      title,
    });

    // Store notification record
    await query(
      `INSERT INTO push_notifications (id, user_id, title, body, data, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [uuidv4(), userId, title, body, JSON.stringify(data || {})]
    );
  }

  static async sendConsultationStartingSoonNotification(
    userId: string,
    doctorName: string,
    minutesUntilConsultation: number
  ): Promise<void> {
    const title = 'Consultation Starting Soon';
    const body = `Your consultation with ${doctorName} starts in ${minutesUntilConsultation} minutes`;

    await this.sendPushNotification(userId, title, body, {
      type: 'consultation_starting',
      minutesUntilConsultation,
    });
  }

  // Appointment Reminders

  static async scheduleAppointmentReminders(consultationId: string): Promise<void> {
    // Get consultation details
    const consultResult = await query(
      `SELECT patient_id, doctor_id, scheduled_at FROM consultations WHERE id = $1`,
      [consultationId]
    );

    if (consultResult.rows.length === 0) {
      throw new Error('Consultation not found');
    }

    const { patient_id, doctor_id, scheduled_at } = consultResult.rows[0];
    const scheduledTime = new Date(scheduled_at);

    // Schedule reminders at specific times
    const reminders = [
      { offset: 24 * 60, type: 'reminder_24h' }, // 24 hours before
      { offset: 60, type: 'reminder_1h' },       // 1 hour before
      { offset: 15, type: 'reminder_15m' },      // 15 minutes before
    ];

    for (const reminder of reminders) {
      const reminderTime = new Date(scheduledTime.getTime() - reminder.offset * 60 * 1000);

      if (reminderTime > new Date()) {
        // Store reminder task
        await query(
          `INSERT INTO reminder_tasks (id, consultation_id, patient_id, doctor_id, scheduled_at, reminder_type, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, 'pending', NOW())`,
          [uuidv4(), consultationId, patient_id, doctor_id, reminderTime, reminder.type]
        );

        logger.info('Reminder scheduled', {
          consultationId,
          type: reminder.type,
          scheduledAt: reminderTime,
        });
      }
    }
  }

  static async getUpcomingReminders(limit: number = 100): Promise<any[]> {
    const result = await query(
      `SELECT r.*, c.scheduled_at, u.email, u.phone, p.first_name, p.last_name
       FROM reminder_tasks r
       JOIN consultations c ON r.consultation_id = c.id
       JOIN users u ON r.patient_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE r.status = 'pending'
         AND r.scheduled_at <= NOW() + INTERVAL '5 minutes'
       ORDER BY r.scheduled_at ASC
       LIMIT $1`,
      [limit]
    );

    return result.rows;
  }

  static async processReminder(reminderId: string): Promise<void> {
    // Get reminder details
    const reminderResult = await query(
      'SELECT * FROM reminder_tasks WHERE id = $1',
      [reminderId]
    );

    if (reminderResult.rows.length === 0) {
      throw new Error('Reminder not found');
    }

    const reminder = reminderResult.rows[0];

    // Send notifications based on type
    if (reminder.reminder_type === 'reminder_24h') {
      await NotificationService.sendConsultationReminderNotification(
        reminder.patient_id,
        reminder.consultation_id,
        'Your doctor',
        '24 hours'
      );
    } else if (reminder.reminder_type === 'reminder_1h') {
      await NotificationService.sendConsultationReminderNotification(
        reminder.patient_id,
        reminder.consultation_id,
        'Your doctor',
        '1 hour'
      );
      await this.sendConsultationStartingSoonNotification(
        reminder.patient_id,
        'Your doctor',
        60
      );
    } else if (reminder.reminder_type === 'reminder_15m') {
      await this.sendConsultationStartingSoonNotification(
        reminder.patient_id,
        'Your doctor',
        15
      );
    }

    // Mark as processed
    await query(
      'UPDATE reminder_tasks SET status = $1, processed_at = NOW() WHERE id = $2',
      ['processed', reminderId]
    );

    logger.info('Reminder processed', { reminderId, type: reminder.reminder_type });
  }

  // Helper methods

  private static maskPhone(phone: string): string {
    return phone.replace(/\d(?=\d{4})/g, '*');
  }
}
