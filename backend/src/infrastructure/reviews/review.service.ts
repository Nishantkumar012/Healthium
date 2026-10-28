import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/connection';
import { logger } from '../observability/logger';
import { cacheService } from '../cache/cache.service';
import { NotificationService } from '../notification/notification.service';

export class ReviewService {
  static async createReview(
    patientId: string,
    consultationId: string,
    rating: number,
    comment: string
  ): Promise<string> {
    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error('Rating must be between 1 and 5');
    }

    // Check if consultation exists and belongs to patient
    const consultResult = await query(
      `SELECT id, doctor_id, status FROM consultations WHERE id = $1 AND patient_id = $2`,
      [consultationId, patientId]
    );

    if (consultResult.rows.length === 0) {
      throw new Error('Consultation not found or access denied');
    }

    const consultation = consultResult.rows[0];

    if (consultation.status !== 'completed') {
      throw new Error('Can only review completed consultations');
    }

    // Check if review already exists
    const existingReview = await query(
      'SELECT id FROM reviews WHERE consultation_id = $1',
      [consultationId]
    );

    if (existingReview.rows.length > 0) {
      throw new Error('Review already exists for this consultation');
    }

    // Create review
    const reviewId = uuidv4();
    await query(
      `INSERT INTO reviews (id, consultation_id, patient_id, doctor_id, rating, comment, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [reviewId, consultationId, patientId, consultation.doctor_id, rating, comment]
    );

    // Update doctor's average rating
    await this.updateDoctorRating(consultation.doctor_id);

    // Invalidate cache
    await cacheService.deletePattern(`reviews:doctor:${consultation.doctor_id}:*`);
    await cacheService.deletePattern(`doctor:${consultation.doctor_id}`);

    // Track analytics
    await NotificationService.trackReviewSubmitted(patientId, consultation.doctor_id, rating);

    logger.info('Review created', {
      reviewId,
      consultationId,
      patientId,
      doctorId: consultation.doctor_id,
      rating,
    });

    return reviewId;
  }

  static async getDoctorReviews(doctorId: string, page: number = 1, limit: number = 10): Promise<any> {
    const cacheKey = `reviews:doctor:${doctorId}:${page}:${limit}`;

    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await query(
      'SELECT COUNT(*) as count FROM reviews WHERE doctor_id = $1',
      [doctorId]
    );
    const total = countResult.rows[0].count;

    // Get reviews with patient info
    const result = await query(
      `SELECT r.id, r.consultation_id, r.rating, r.comment, r.created_at, r.updated_at,
              p.first_name as patient_first_name, p.last_name as patient_last_name
       FROM reviews r
       LEFT JOIN profiles p ON r.patient_id = p.user_id
       WHERE r.doctor_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [doctorId, limit, offset]
    );

    const response = {
      reviews: result.rows.map((row: any) => ({
        id: row.id,
        consultationId: row.consultation_id,
        rating: row.rating,
        comment: row.comment,
        patientName: `${row.patient_first_name} ${row.patient_last_name?.charAt(0)}.`,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };

    // Cache for 10 minutes
    await cacheService.set(cacheKey, response, { ttl: 600 });

    return response;
  }

  static async getMyReviews(patientId: string): Promise<any[]> {
    const result = await query(
      `SELECT r.id, r.consultation_id, r.rating, r.comment, r.created_at,
              d.specialization, p.first_name as doctor_first_name, p.last_name as doctor_last_name
       FROM reviews r
       JOIN doctors d ON r.doctor_id = d.user_id
       LEFT JOIN profiles p ON r.doctor_id = p.user_id
       WHERE r.patient_id = $1
       ORDER BY r.created_at DESC`,
      [patientId]
    );

    return result.rows;
  }

  private static async updateDoctorRating(doctorId: string): Promise<void> {
    // Calculate new average rating
    const result = await query(
      `SELECT AVG(rating) as avg_rating, COUNT(*) as total_reviews
       FROM reviews
       WHERE doctor_id = $1`,
      [doctorId]
    );

    const { avg_rating, total_reviews } = result.rows[0];

    // Update doctor's rating
    await query(
      `UPDATE doctors
       SET rating = $1, total_reviews = $2, updated_at = NOW()
       WHERE user_id = $3`,
      [parseFloat(avg_rating || 0).toFixed(2), total_reviews, doctorId]
    );

    logger.info('Doctor rating updated', {
      doctorId,
      newRating: avg_rating,
      totalReviews: total_reviews,
    });
  }
}
