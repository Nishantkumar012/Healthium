import { Router, Request, Response, NextFunction } from 'express';
import { authMiddleware, requireRole } from '../../common/middleware/auth.middleware';
import { AdvancedNotificationService } from '../../infrastructure/advanced/advanced-notification.service';
import { HealthCheckService } from '../../infrastructure/health/health-check.service';
import { logger } from '../../infrastructure/observability/logger';
import { DeviceTokenRequest, AppointmentReminderData } from '../../common/types/advanced.types';

const router = Router();

// ==================== DEVICE TOKENS ====================

// Register device token for push notifications (auth required)
router.post('/device-token', authMiddleware, async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const userId = req.user!.userId;
    const { token, platform } = req.body as DeviceTokenRequest;

    if (!token || !platform) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: token, platform',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
      return;
    }

    if (!['ios', 'android', 'web'].includes(platform)) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid platform. Use: ios, android, or web',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
      return;
    }

    await AdvancedNotificationService.registerDeviceToken(userId, token, platform);

    res.status(201).json({
      success: true,
      data: { message: 'Device token registered' },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Register device token error', { error });
    next(error);
  }
});

// ==================== APPOINTMENT REMINDERS ====================

// Schedule appointment reminders (doctor only)
router.post(
  '/reminders/schedule/:consultationId',
  authMiddleware,
  requireRole('doctor'),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { consultationId } = req.params;

      if (!consultationId) {
        res.status(400).json({
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Consultation ID is required',
          },
          metadata: {
            timestamp: new Date().toISOString(),
            requestId: req.id,
          },
        });
        return;
      }

      await AdvancedNotificationService.scheduleAppointmentReminders(consultationId);

      res.status(200).json({
        success: true,
        data: { message: 'Reminders scheduled successfully' },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      logger.error('Schedule reminders error', { error });
      const message = error instanceof Error ? error.message : 'Failed to schedule reminders';

      if (message.includes('not found')) {
        res.status(404).json({
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
        return;
      }

      next(error);
    }
  }
);

// Process pending reminders (admin/cron)
router.post('/reminders/process', authMiddleware, requireRole('admin'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const reminders = await AdvancedNotificationService.getUpcomingReminders(100);

    let processed = 0;
    let failed = 0;

    for (const reminder of reminders) {
      try {
        await AdvancedNotificationService.processReminder(reminder.id);
        processed++;
      } catch (error) {
        logger.error('Failed to process reminder', { reminderId: reminder.id, error });
        failed++;
      }
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Reminders processed',
        processed,
        failed,
        total: reminders.length,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Process reminders error', { error });
    next(error);
  }
});

// ==================== HEALTH CHECKS ====================

// System health check (public)
router.get('/health/system', async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const health = await HealthCheckService.checkSystemHealth();
    const status = HealthCheckService.getOverallStatus(health);

    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: {
        status,
        ...health,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Health check error', { error });
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_UNAVAILABLE',
        message: 'Health check failed',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  }
});

// Database health check (admin)
router.get('/health/database', authMiddleware, requireRole('admin'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const health = await HealthCheckService.checkSystemHealth();

    res.status(200).json({
      success: true,
      data: {
        database: health.database,
        timestamp: health.timestamp,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Database health check error', { error });
    next(error);
  }
});

// Redis health check (admin)
router.get('/health/redis', authMiddleware, requireRole('admin'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const health = await HealthCheckService.checkSystemHealth();

    res.status(200).json({
      success: true,
      data: {
        redis: health.redis,
        timestamp: health.timestamp,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Redis health check error', { error });
    next(error);
  }
});

// Job queue health check (admin)
router.get('/health/queues', authMiddleware, requireRole('admin'), async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const health = await HealthCheckService.checkSystemHealth();

    res.status(200).json({
      success: true,
      data: {
        jobQueues: health.jobQueues,
        timestamp: health.timestamp,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  } catch (error) {
    logger.error('Queue health check error', { error });
    next(error);
  }
});

export default router;
