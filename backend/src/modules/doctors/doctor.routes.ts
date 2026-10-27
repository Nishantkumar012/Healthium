import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../../common/middleware/auth.middleware';
import { query } from '../../infrastructure/database/connection';
import { logger } from '../../infrastructure/observability/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Create/update doctor profile (doctor only)
router.post('/profile', authMiddleware, requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { specialization, licenseNumber, yearsOfExperience, qualifications, consultationFee, about } = req.body;

    if (!specialization || !licenseNumber) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Specialization and license number are required',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    // Check if doctor profile exists
    const existingResult = await query(
      'SELECT id FROM doctors WHERE user_id = $1',
      [userId]
    );

    if (existingResult.rows.length > 0) {
      // Update existing
      await query(
        `UPDATE doctors SET
          specialization = $1,
          license_number = $2,
          years_of_experience = COALESCE($3, years_of_experience),
          qualifications = COALESCE($4, qualifications),
          consultation_fee = COALESCE($5, consultation_fee),
          about = COALESCE($6, about),
          updated_at = NOW()
         WHERE user_id = $7`,
        [specialization, licenseNumber, yearsOfExperience || null, qualifications || null, consultationFee || null, about || null, userId]
      );
    } else {
      // Create new
      await query(
        `INSERT INTO doctors (id, user_id, specialization, license_number, years_of_experience, qualifications, consultation_fee, about, is_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, false, NOW(), NOW())`,
        [uuidv4(), userId, specialization, licenseNumber, yearsOfExperience || null, qualifications || null, consultationFee || null, about || null]
      );
    }

    // Return doctor profile
    const result = await query(
      `SELECT d.id, d.user_id, d.specialization, d.license_number, d.years_of_experience,
              d.qualifications, d.consultation_fee, d.about, d.is_verified, d.rating, d.total_reviews,
              d.created_at, d.updated_at,
              u.email, p.first_name, p.last_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE d.user_id = $1`,
      [userId]
    );

    const doctor = result.rows[0];

    res.status(201).json({
      success: true,
      data: {
        id: doctor.id,
        userId: doctor.user_id,
        email: doctor.email,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        specialization: doctor.specialization,
        licenseNumber: doctor.license_number,
        yearsOfExperience: doctor.years_of_experience,
        qualifications: doctor.qualifications,
        consultationFee: doctor.consultation_fee,
        about: doctor.about,
        isVerified: doctor.is_verified,
        rating: doctor.rating,
        totalReviews: doctor.total_reviews,
        createdAt: doctor.created_at,
        updatedAt: doctor.updated_at,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Create doctor profile error', { error });
    next(error);
  }
});

// Get doctor profile
router.get('/profile/:doctorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await query(
      `SELECT d.id, d.user_id, d.specialization, d.license_number, d.years_of_experience,
              d.qualifications, d.consultation_fee, d.about, d.is_verified, d.rating, d.total_reviews,
              d.created_at, d.updated_at,
              u.email, p.first_name, p.last_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE d.id = $1`,
      [req.params.doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Doctor not found',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const doctor = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: doctor.id,
        userId: doctor.user_id,
        email: doctor.email,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        specialization: doctor.specialization,
        licenseNumber: doctor.license_number,
        yearsOfExperience: doctor.years_of_experience,
        qualifications: doctor.qualifications,
        consultationFee: doctor.consultation_fee,
        about: doctor.about,
        isVerified: doctor.is_verified,
        rating: doctor.rating,
        totalReviews: doctor.total_reviews,
        createdAt: doctor.created_at,
        updatedAt: doctor.updated_at,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get doctor profile error', { error });
    next(error);
  }
});

// Get all doctors (with filtering and pagination)
router.get('/list', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const specialization = req.query.specialization as string;
    const offset = (page - 1) * limit;

    let countQuery = 'SELECT COUNT(*) as count FROM doctors WHERE is_verified = true';
    let countParams: any[] = [];

    let dataQuery = `SELECT d.id, d.user_id, d.specialization, d.license_number, d.years_of_experience,
                           d.consultation_fee, d.about, d.rating, d.total_reviews,
                           u.email, p.first_name, p.last_name
                    FROM doctors d
                    JOIN users u ON d.user_id = u.id
                    LEFT JOIN profiles p ON u.id = p.user_id
                    WHERE d.is_verified = true`;
    let dataParams: any[] = [];

    if (specialization) {
      countQuery += ' AND specialization = $1';
      dataQuery += ' AND specialization = $1';
      countParams.push(specialization);
      dataParams.push(specialization);
    }

    const countResult = await query(countQuery, countParams);
    const total = countResult.rows[0].count;

    dataQuery += ' ORDER BY d.rating DESC, d.total_reviews DESC LIMIT $' + (dataParams.length + 1) + ' OFFSET $' + (dataParams.length + 2);
    dataParams.push(limit, offset);

    const result = await query(dataQuery, dataParams);

    const doctors = result.rows.map((row: any) => ({
      id: row.id,
      userId: row.user_id,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      specialization: row.specialization,
      yearsOfExperience: row.years_of_experience,
      consultationFee: row.consultation_fee,
      about: row.about,
      rating: row.rating,
      totalReviews: row.total_reviews,
    }));

    res.status(200).json({
      success: true,
      data: doctors,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('List doctors error', { error });
    next(error);
  }
});

// Get my doctor profile (doctor only)
router.get('/me', authMiddleware, requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const result = await query(
      `SELECT d.id, d.user_id, d.specialization, d.license_number, d.years_of_experience,
              d.qualifications, d.consultation_fee, d.about, d.is_verified, d.rating, d.total_reviews,
              d.created_at, d.updated_at,
              u.email, p.first_name, p.last_name
       FROM doctors d
       JOIN users u ON d.user_id = u.id
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE d.user_id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Doctor profile not found',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const doctor = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: doctor.id,
        userId: doctor.user_id,
        email: doctor.email,
        firstName: doctor.first_name,
        lastName: doctor.last_name,
        specialization: doctor.specialization,
        licenseNumber: doctor.license_number,
        yearsOfExperience: doctor.years_of_experience,
        qualifications: doctor.qualifications,
        consultationFee: doctor.consultation_fee,
        about: doctor.about,
        isVerified: doctor.is_verified,
        rating: doctor.rating,
        totalReviews: doctor.total_reviews,
        createdAt: doctor.created_at,
        updatedAt: doctor.updated_at,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get my doctor profile error', { error });
    next(error);
  }
});

export default router;
