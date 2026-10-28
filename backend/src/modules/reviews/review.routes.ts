import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../../common/middleware/auth.middleware';
import { ReviewService } from '../../infrastructure/reviews/review.service';
import { logger } from '../../infrastructure/observability/logger';
import { CreateReviewRequest } from '../../common/types/notification.types';

const router = Router();

// Create review (patient only)
router.post('/', authMiddleware, requireRole('patient'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.user!.userId;
    const { consultationId, rating, comment } = req.body as CreateReviewRequest;

    // Validation
    if (!consultationId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: consultationId, rating, comment',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Rating must be between 1 and 5',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const reviewId = await ReviewService.createReview(patientId, consultationId, rating, comment);

    res.status(201).json({
      success: true,
      data: { reviewId },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Create review error', { error });
    const message = error instanceof Error ? error.message : 'Failed to create review';

    if (message.includes('not found') || message.includes('access denied')) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    if (message.includes('already exists') || message.includes('completed') || message.includes('Rating')) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    next(error);
  }
});

// Get doctor reviews (public)
router.get('/doctor/:doctorId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { doctorId } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await ReviewService.getDoctorReviews(doctorId, page, limit);

    res.status(200).json({
      success: true,
      data: result.reviews,
      pagination: result.pagination,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get doctor reviews error', { error });
    next(error);
  }
});

// Get my reviews (patient only)
router.get('/my', authMiddleware, requireRole('patient'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.user!.userId;
    const reviews = await ReviewService.getMyReviews(patientId);

    res.status(200).json({
      success: true,
      data: reviews,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get my reviews error', { error });
    next(error);
  }
});

export default router;
