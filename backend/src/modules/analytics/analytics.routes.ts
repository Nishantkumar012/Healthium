import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../../common/middleware/auth.middleware';
import { AnalyticsService } from '../../infrastructure/analytics/analytics.service';
import { logger } from '../../infrastructure/observability/logger';

const router = Router();

// Get doctor analytics (doctor only)
router.get('/doctor', authMiddleware, requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user!.userId;
    const analytics = await AnalyticsService.getDoctorAnalytics(doctorId);

    res.status(200).json({
      success: true,
      data: analytics,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get doctor analytics error', { error });
    next(error);
  }
});

// Get patient analytics (patient only)
router.get('/patient', authMiddleware, requireRole('patient'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const patientId = req.user!.userId;
    const analytics = await AnalyticsService.getPatientAnalytics(patientId);

    res.status(200).json({
      success: true,
      data: analytics,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get patient analytics error', { error });
    next(error);
  }
});

// Get admin analytics (admin only)
router.get('/admin', authMiddleware, requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const analytics = await AnalyticsService.getAdminAnalytics();

    res.status(200).json({
      success: true,
      data: analytics,
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Get admin analytics error', { error });
    next(error);
  }
});

export default router;
