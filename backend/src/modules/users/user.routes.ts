import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware } from '../../common/middleware/auth.middleware';
import { query } from '../../infrastructure/database/connection';
import { logger } from '../../infrastructure/observability/logger';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// Get user profile (requires auth)
router.get('/profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const result = await query(
      `SELECT u.id, u.email, u.phone, u.role, u.is_verified, u.mfa_enabled,
              u.created_at, u.updated_at,
              p.first_name, p.last_name, p.bio, p.avatar_url
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        role: user.role,
        isVerified: user.is_verified,
        mfaEnabled: user.mfa_enabled,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get profile error', { error });
    next(error);
  }
});

// Update user profile (requires auth)
router.put('/profile', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;
    const { firstName, lastName, phone, bio, avatarUrl } = req.body;

    // Update users table
    if (phone) {
      await query(
        'UPDATE users SET phone = $1, updated_at = NOW() WHERE id = $2',
        [phone, userId]
      );
    }

    // Update profiles table
    if (firstName || lastName || bio || avatarUrl !== undefined) {
      const profileResult = await query(
        'SELECT id FROM profiles WHERE user_id = $1',
        [userId]
      );

      if (profileResult.rows.length === 0) {
        // Create profile if it doesn't exist
        await query(
          `INSERT INTO profiles (id, user_id, first_name, last_name, bio, avatar_url, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
          [uuidv4(), userId, firstName || null, lastName || null, bio || null, avatarUrl || null]
        );
      } else {
        // Update existing profile
        await query(
          `UPDATE profiles SET
            first_name = COALESCE($1, first_name),
            last_name = COALESCE($2, last_name),
            bio = COALESCE($3, bio),
            avatar_url = COALESCE($4, avatar_url),
            updated_at = NOW()
           WHERE user_id = $5`,
          [firstName || null, lastName || null, bio || null, avatarUrl || null, userId]
        );
      }
    }

    // Return updated profile
    const result = await query(
      `SELECT u.id, u.email, u.phone, u.role, u.is_verified, u.mfa_enabled,
              u.created_at, u.updated_at,
              p.first_name, p.last_name, p.bio, p.avatar_url
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [userId]
    );

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        role: user.role,
        isVerified: user.is_verified,
        mfaEnabled: user.mfa_enabled,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Update profile error', { error });
    next(error);
  }
});

// Get user by ID (admin only)
router.get('/users/:userId', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (req.user!.role !== 'admin' && req.user!.userId !== req.params.userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Cannot access other users profile',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const result = await query(
      `SELECT u.id, u.email, u.phone, u.role, u.is_verified,
              p.first_name, p.last_name, p.bio, p.avatar_url
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       WHERE u.id = $1`,
      [req.params.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'User not found',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const user = result.rows[0];

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        bio: user.bio,
        avatarUrl: user.avatar_url,
        role: user.role,
        isVerified: user.is_verified,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get user error', { error });
    next(error);
  }
});

export default router;
