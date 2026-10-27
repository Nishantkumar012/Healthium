import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { logger } from '../observability/logger';
import { cacheService } from '../cache/cache.service';
import {
  CreateSlotRequest,
  BookConsultationRequest,
  CreatePaymentRequest,
} from '../../common/types/consultation.types';

export class ConsultationService {
  // Availability Slots

  static async createAvailabilitySlot(
    doctorId: string,
    data: CreateSlotRequest
  ): Promise<string> {
    const { dayOfWeek, startTime, endTime, isRecurring, recurringEndDate } = data;

    // Validate time format
    if (!/^\d{2}:\d{2}$/.test(startTime) || !/^\d{2}:\d{2}$/.test(endTime)) {
      throw new Error('Invalid time format. Use HH:mm');
    }

    // Validate day of week
    if (dayOfWeek < 0 || dayOfWeek > 6) {
      throw new Error('Invalid day of week. Use 0-6 (Sunday-Saturday)');
    }

    // Validate start < end
    if (startTime >= endTime) {
      throw new Error('Start time must be before end time');
    }

    const slotId = uuidv4();

    // Insert availability slot
    await query(
      `INSERT INTO availability_slots (
        id, doctor_id, day_of_week, start_time, end_time,
        is_recurring, recurring_end_date, version, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 0, NOW(), NOW())`,
      [
        slotId,
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
        isRecurring,
        recurringEndDate || null,
      ]
    );

    // Invalidate cache
    await cacheService.deletePattern(`doctor_slots:${doctorId}:*`);

    logger.info('Availability slot created', {
      slotId,
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
    });

    return slotId;
  }

  static async getAvailabilitySlots(
    doctorId: string,
    dayOfWeek?: number
  ): Promise<any[]> {
    const cacheKey = dayOfWeek
      ? `doctor_slots:${doctorId}:${dayOfWeek}`
      : `doctor_slots:${doctorId}:all`;

    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached as any[];
    }

    let sql = `SELECT * FROM availability_slots WHERE doctor_id = $1`;
    const params: any[] = [doctorId];

    if (dayOfWeek !== undefined) {
      sql += ` AND day_of_week = $2`;
      params.push(dayOfWeek);
    }

    sql += ` ORDER BY day_of_week, start_time`;

    const result = await query(sql, params);

    // Cache for 1 hour
    await cacheService.set(cacheKey, result.rows, { ttl: 3600 });

    return result.rows as any[];
  }

  // Consultations

  static async bookConsultation(
    patientId: string,
    data: BookConsultationRequest
  ): Promise<string> {
    const { slotId, chiefComplaint, consultationType } = data;

    if (!['video', 'audio', 'chat'].includes(consultationType)) {
      throw new Error('Invalid consultation type');
    }

    // Get slot details with optimistic locking
    const slotResult = await query(
      `SELECT * FROM availability_slots WHERE id = $1`,
      [slotId]
    );

    if (slotResult.rows.length === 0) {
      throw new Error('Slot not found');
    }

    const slot = slotResult.rows[0];

    // Check if slot is already booked (optimistic locking)
    const bookingResult = await query(
      `SELECT COUNT(*) as count FROM consultations
       WHERE slot_id = $1 AND status != 'cancelled'`,
      [slotId]
    );

    if (bookingResult.rows[0].count > 0) {
      throw new Error('Slot already booked');
    }

    // Generate consultation number
    const consultationNumber = `CONS-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Get doctor ID from slot
    const doctorId = slot.doctor_id;

    // Calculate scheduled date (next occurrence of the day)
    const scheduledDate = this.getNextOccurrence(slot.day_of_week, slot.start_time);

    // Create consultation
    const consultationId = uuidv4();
    await query(
      `INSERT INTO consultations (
        id, consultation_number, patient_id, doctor_id, slot_id,
        scheduled_at, status, consultation_type, chief_complaint,
        created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, 'scheduled', $7, $8, NOW(), NOW())`,
      [
        consultationId,
        consultationNumber,
        patientId,
        doctorId,
        slotId,
        scheduledDate,
        consultationType,
        chiefComplaint,
      ]
    );

    // Invalidate doctor's slots cache
    await cacheService.deletePattern(`doctor_slots:${doctorId}:*`);
    await cacheService.deletePattern(`consultations:patient:${patientId}:*`);

    logger.info('Consultation booked', {
      consultationId,
      consultationNumber,
      patientId,
      doctorId,
    });

    return consultationId;
  }

  static async getPatientConsultations(
    patientId: string,
    status?: string
  ): Promise<any[]> {
    const cacheKey = status
      ? `consultations:patient:${patientId}:${status}`
      : `consultations:patient:${patientId}:all`;

    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached as any[];
    }

    let sql = `
      SELECT c.*,
             d.specialization, p.first_name, p.last_name
      FROM consultations c
      JOIN doctors d ON c.doctor_id = d.user_id
      LEFT JOIN profiles p ON c.doctor_id = p.user_id
      WHERE c.patient_id = $1
    `;
    const params: any[] = [patientId];

    if (status) {
      sql += ` AND c.status = $2`;
      params.push(status);
    }

    sql += ` ORDER BY c.scheduled_at DESC`;

    const result = await query(sql, params);

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result.rows, { ttl: 300 });

    return result.rows as any[];
  }

  static async getDoctorConsultations(
    doctorId: string,
    status?: string
  ): Promise<any[]> {
    const cacheKey = status
      ? `consultations:doctor:${doctorId}:${status}`
      : `consultations:doctor:${doctorId}:all`;

    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached as any[];
    }

    let sql = `
      SELECT c.*,
             p1.first_name as patient_first_name, p1.last_name as patient_last_name, u.email as patient_email,
             p2.first_name as doctor_first_name, p2.last_name as doctor_last_name
      FROM consultations c
      JOIN users u ON c.patient_id = u.id
      LEFT JOIN profiles p1 ON c.patient_id = p1.user_id
      LEFT JOIN profiles p2 ON c.doctor_id = p2.user_id
      WHERE c.doctor_id = $1
    `;
    const params: any[] = [doctorId];

    if (status) {
      sql += ` AND c.status = $2`;
      params.push(status);
    }

    sql += ` ORDER BY c.scheduled_at DESC`;

    const result = await query(sql, params);

    // Cache for 5 minutes
    await cacheService.set(cacheKey, result.rows, { ttl: 300 });

    return result.rows as any[];
  }

  static async updateConsultationStatus(
    consultationId: string,
    status: string,
    notes?: string
  ): Promise<void> {
    // Validate status
    if (!['in_progress', 'completed', 'cancelled'].includes(status)) {
      throw new Error('Invalid consultation status');
    }

    // Get consultation to find associated IDs
    const consultResult = await query(
      'SELECT patient_id, doctor_id FROM consultations WHERE id = $1',
      [consultationId]
    );

    if (consultResult.rows.length === 0) {
      throw new Error('Consultation not found');
    }

    const { patient_id, doctor_id } = consultResult.rows[0];

    const updateColumn = status === 'completed' ? 'completed_at' : status === 'in_progress' ? 'started_at' : 'cancelled_at';

    await query(
      `UPDATE consultations
       SET status = $1, ${updateColumn} = NOW(), notes = COALESCE($2, notes), updated_at = NOW()
       WHERE id = $3`,
      [status, notes || null, consultationId]
    );

    // Invalidate caches
    await cacheService.deletePattern(`consultations:patient:${patient_id}:*`);
    await cacheService.deletePattern(`consultations:doctor:${doctor_id}:*`);

    logger.info('Consultation status updated', {
      consultationId,
      status,
    });
  }

  static async cancelConsultation(
    consultationId: string,
    reason: string
  ): Promise<void> {
    await this.updateConsultationStatus(consultationId, 'cancelled', reason);
  }

  // Payments

  static async createPayment(
    data: CreatePaymentRequest
  ): Promise<string> {
    const { consultationId, amount, paymentMethod } = data;

    if (!['card', 'upi', 'wallet'].includes(paymentMethod)) {
      throw new Error('Invalid payment method');
    }

    if (amount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    // Get consultation details
    const consultResult = await query(
      'SELECT id, patient_id, doctor_id FROM consultations WHERE id = $1',
      [consultationId]
    );

    if (consultResult.rows.length === 0) {
      throw new Error('Consultation not found');
    }

    const consultation = consultResult.rows[0];

    // Check if payment already exists
    const existingPayment = await query(
      `SELECT id FROM payments WHERE consultation_id = $1 AND status != 'failed'`,
      [consultationId]
    );

    if (existingPayment.rows.length > 0) {
      throw new Error('Payment already exists for this consultation');
    }

    // Generate payment ID
    const paymentId = `PAY-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Create payment record
    const paymentRecordId = uuidv4();
    await query(
      `INSERT INTO payments (
        id, payment_id, consultation_id, patient_id, amount,
        currency, status, payment_method, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, 'INR', 'pending', $6, NOW(), NOW())`,
      [paymentRecordId, paymentId, consultationId, consultation.patient_id, amount, paymentMethod]
    );

    logger.info('Payment created', {
      paymentId,
      consultationId,
      amount,
      paymentMethod,
    });

    return paymentRecordId;
  }

  static async updatePaymentStatus(
    paymentId: string,
    status: string,
    gatewayTransactionId?: string,
    gatewayResponse?: any
  ): Promise<void> {
    if (!['pending', 'processing', 'completed', 'failed', 'refunded'].includes(status)) {
      throw new Error('Invalid payment status');
    }

    await query(
      `UPDATE payments
       SET status = $1, gateway_transaction_id = COALESCE($2, gateway_transaction_id),
           gateway_response = COALESCE($3::jsonb, gateway_response), updated_at = NOW()
       WHERE payment_id = $4`,
      [status, gatewayTransactionId || null, JSON.stringify(gatewayResponse) || null, paymentId]
    );

    logger.info('Payment status updated', { paymentId, status });
  }

  static async getPaymentByConsultation(consultationId: string): Promise<any> {
    const result = await query(
      'SELECT * FROM payments WHERE consultation_id = $1',
      [consultationId]
    );

    if (result.rows.length === 0) {
      throw new Error('Payment not found');
    }

    return result.rows[0];
  }

  // Helper methods

  private static getNextOccurrence(dayOfWeek: number, startTime: string): Date {
    const now = new Date();
    const currentDay = now.getDay();
    let daysToAdd = dayOfWeek - currentDay;

    if (daysToAdd < 0 || (daysToAdd === 0 && now.getHours() * 60 + now.getMinutes() >= this.timeToMinutes(startTime))) {
      daysToAdd += 7;
    }

    const date = new Date(now);
    date.setDate(date.getDate() + daysToAdd);

    const [hours, minutes] = startTime.split(':').map(Number);
    date.setHours(hours, minutes, 0, 0);

    return date;
  }

  private static timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Prescription Management

  static async createPrescription(
    consultationId: string,
    medications: any[],
    instructions: string,
    validUntilDays: number = 30
  ): Promise<string> {
    // Get consultation details
    const consultResult = await query(
      `SELECT patient_id, doctor_id FROM consultations WHERE id = $1`,
      [consultationId]
    );

    if (consultResult.rows.length === 0) {
      throw new Error('Consultation not found');
    }

    const { patient_id, doctor_id } = consultResult.rows[0];

    // Generate prescription number
    const prescriptionNumber = `RX-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    // Calculate valid until date
    const validUntil = new Date();
    validUntil.setDate(validUntil.getDate() + validUntilDays);

    // Create prescription
    const prescriptionId = uuidv4();
    await query(
      `INSERT INTO prescriptions (
        id, prescription_number, consultation_id, patient_id, doctor_id,
        medications, instructions, valid_until, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())`,
      [
        prescriptionId,
        prescriptionNumber,
        consultationId,
        patient_id,
        doctor_id,
        JSON.stringify(medications),
        instructions,
        validUntil,
      ]
    );

    logger.info('Prescription created', {
      prescriptionId,
      prescriptionNumber,
      consultationId,
    });

    return prescriptionId;
  }

  static async getPrescriptionsByPatient(patientId: string): Promise<any[]> {
    const result = await query(
      `SELECT * FROM prescriptions WHERE patient_id = $1 AND valid_until > NOW()
       ORDER BY created_at DESC`,
      [patientId]
    );

    return result.rows;
  }

  static async getPrescriptionsByDoctor(doctorId: string): Promise<any[]> {
    const result = await query(
      `SELECT * FROM prescriptions WHERE doctor_id = $1
       ORDER BY created_at DESC`,
      [doctorId]
    );

    return result.rows;
  }
}
