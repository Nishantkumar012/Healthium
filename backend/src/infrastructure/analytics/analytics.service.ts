import { query } from '../database/connection';
import { logger } from '../observability/logger';
import { cacheService } from '../cache/cache.service';

export class AnalyticsService {
  // Dashboard Analytics

  static async getDoctorAnalytics(doctorId: string): Promise<any> {
    const cacheKey = `analytics:doctor:${doctorId}`;

    // Try cache first (1 hour TTL)
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get consultation stats
    const consultationStats = await query(
      `SELECT
        COUNT(*) as total_consultations,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_consultations,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_consultations,
        COUNT(*) FILTER (WHERE status = 'scheduled') as upcoming_consultations,
        AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) FILTER (WHERE status = 'completed') as avg_duration_seconds
       FROM consultations
       WHERE doctor_id = $1`,
      [doctorId]
    );

    // Get payment stats
    const paymentStats = await query(
      `SELECT
        COUNT(*) as total_payments,
        SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
        AVG(amount) FILTER (WHERE status = 'completed') as avg_consultation_fee
       FROM payments p
       JOIN consultations c ON p.consultation_id = c.id
       WHERE c.doctor_id = $1`,
      [doctorId]
    );

    // Get review stats
    const reviewStats = await query(
      `SELECT
        COUNT(*) as total_reviews,
        AVG(rating) as avg_rating
       FROM reviews
       WHERE doctor_id = $1`,
      [doctorId]
    );

    // Get monthly consultation trend (last 6 months)
    const monthlyTrend = await query(
      `SELECT
        DATE_TRUNC('month', created_at) as month,
        COUNT(*) as consultations,
        COUNT(*) FILTER (WHERE status = 'completed') as completed
       FROM consultations
       WHERE doctor_id = $1
         AND created_at >= NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month DESC`,
      [doctorId]
    );

    const analytics = {
      consultations: {
        total: consultationStats.rows[0].total_consultations,
        completed: consultationStats.rows[0].completed_consultations,
        cancelled: consultationStats.rows[0].cancelled_consultations,
        upcoming: consultationStats.rows[0].upcoming_consultations,
        avgDurationSeconds: consultationStats.rows[0].avg_duration_seconds || 0,
      },
      payments: {
        total: paymentStats.rows[0].total_payments,
        totalRevenue: paymentStats.rows[0].total_revenue || 0,
        avgConsultationFee: paymentStats.rows[0].avg_consultation_fee || 0,
      },
      reviews: {
        total: reviewStats.rows[0].total_reviews,
        avgRating: reviewStats.rows[0].avg_rating || 0,
      },
      monthlyTrend: monthlyTrend.rows.map((row: any) => ({
        month: row.month,
        consultations: row.consultations,
        completed: row.completed,
      })),
    };

    // Cache for 1 hour
    await cacheService.set(cacheKey, analytics, { ttl: 3600 });

    return analytics;
  }

  static async getPatientAnalytics(patientId: string): Promise<any> {
    const cacheKey = `analytics:patient:${patientId}`;

    // Try cache first
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get consultation stats
    const consultationStats = await query(
      `SELECT
        COUNT(*) as total_consultations,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_consultations,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_consultations,
        COUNT(*) FILTER (WHERE status = 'scheduled') as upcoming_consultations
       FROM consultations
       WHERE patient_id = $1`,
      [patientId]
    );

    // Get payment stats
    const paymentStats = await query(
      `SELECT
        COUNT(*) as total_payments,
        SUM(amount) FILTER (WHERE status = 'completed') as total_spent
       FROM payments
       WHERE patient_id = $1`,
      [patientId]
    );

    // Get prescription stats
    const prescriptionStats = await query(
      `SELECT
        COUNT(*) as total_prescriptions,
        COUNT(*) FILTER (WHERE valid_until > NOW()) as active_prescriptions
       FROM prescriptions
       WHERE patient_id = $1`,
      [patientId]
    );

    // Get most consulted specializations
    const topSpecializations = await query(
      `SELECT d.specialization, COUNT(*) as count
       FROM consultations c
       JOIN doctors d ON c.doctor_id = d.user_id
       WHERE c.patient_id = $1
       GROUP BY d.specialization
       ORDER BY count DESC
       LIMIT 5`,
      [patientId]
    );

    const analytics = {
      consultations: {
        total: consultationStats.rows[0].total_consultations,
        completed: consultationStats.rows[0].completed_consultations,
        cancelled: consultationStats.rows[0].cancelled_consultations,
        upcoming: consultationStats.rows[0].upcoming_consultations,
      },
      payments: {
        total: paymentStats.rows[0].total_payments,
        totalSpent: paymentStats.rows[0].total_spent || 0,
      },
      prescriptions: {
        total: prescriptionStats.rows[0].total_prescriptions,
        active: prescriptionStats.rows[0].active_prescriptions,
      },
      topSpecializations: topSpecializations.rows,
    };

    // Cache for 30 minutes
    await cacheService.set(cacheKey, analytics, { ttl: 1800 });

    return analytics;
  }

  static async getAdminAnalytics(): Promise<any> {
    const cacheKey = 'analytics:admin';

    // Try cache first (5 minute TTL for admin)
    const cached = await cacheService.get(cacheKey);
    if (cached) {
      return cached;
    }

    // Get user stats
    const userStats = await query(
      `SELECT
        COUNT(*) as total_users,
        COUNT(*) FILTER (WHERE role = 'patient') as patients,
        COUNT(*) FILTER (WHERE role = 'doctor') as doctors,
        COUNT(*) FILTER (WHERE role = 'admin') as admins
       FROM users`
    );

    // Get consultation stats
    const consultationStats = await query(
      `SELECT
        COUNT(*) as total_consultations,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE status = 'scheduled') as scheduled
       FROM consultations`
    );

    // Get payment stats
    const paymentStats = await query(
      `SELECT
        COUNT(*) as total_payments,
        SUM(amount) FILTER (WHERE status = 'completed') as total_revenue,
        AVG(amount) FILTER (WHERE status = 'completed') as avg_payment
       FROM payments`
    );

    // Get monthly revenue (last 12 months)
    const monthlyRevenue = await query(
      `SELECT
        DATE_TRUNC('month', created_at) as month,
        SUM(amount) as revenue,
        COUNT(*) as payments
       FROM payments
       WHERE status = 'completed'
         AND created_at >= NOW() - INTERVAL '12 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month DESC`
    );

    // Get top doctors by consultations
    const topDoctors = await query(
      `SELECT
        d.user_id, d.specialization, d.rating, d.total_reviews,
        p.first_name, p.last_name,
        COUNT(c.id) as consultation_count
       FROM doctors d
       LEFT JOIN profiles p ON d.user_id = p.user_id
       LEFT JOIN consultations c ON d.user_id = c.doctor_id
       GROUP BY d.user_id, d.specialization, d.rating, d.total_reviews, p.first_name, p.last_name
       ORDER BY consultation_count DESC
       LIMIT 10`
    );

    const analytics = {
      users: userStats.rows[0],
      consultations: consultationStats.rows[0],
      payments: paymentStats.rows[0],
      monthlyRevenue: monthlyRevenue.rows,
      topDoctors: topDoctors.rows,
    };

    // Cache for 5 minutes
    await cacheService.set(cacheKey, analytics, { ttl: 300 });

    return analytics;
  }
}
