import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { correlationId } from './common/middleware/correlation-id.middleware';
import { requestLogger } from './common/middleware/request-logger.middleware';
import { errorHandler, AppError } from './common/middleware/error-handler.middleware';
import { authRateLimiter, bookingRateLimiter, apiRateLimiter } from './common/middleware/rate-limiter.middleware';
import { idempotencyMiddleware } from './common/middleware/idempotency.middleware';
import { appConfig } from './common/config/app.config';
import { logger } from './infrastructure/observability/logger';
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/users/user.routes';
import doctorRoutes from './modules/doctors/doctor.routes';
import consultationRoutes from './modules/consultations/consultation.routes';
import reviewRoutes from './modules/reviews/review.routes';
import analyticsRoutes from './modules/analytics/analytics.routes';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(
    cors({
      origin: appConfig.corsOrigin,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
    })
  );

  // Body parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Custom middleware
  app.use(correlationId);
  app.use(requestLogger);
  app.use(idempotencyMiddleware());

  // General rate limiter
  app.use(apiRateLimiter);

  // Health check endpoints
  app.get('/health', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  });

  app.get('/health/ready', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'ready',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  });

  app.get('/health/live', (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        status: 'live',
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  });

  // API version check
  app.get(`/api/${appConfig.apiVersion}`, (req: Request, res: Response) => {
    res.json({
      success: true,
      data: {
        message: 'Healthum Telemedicine API',
        version: appConfig.apiVersion,
        environment: appConfig.nodeEnv,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  });

  // API Routes
  app.use(`/api/${appConfig.apiVersion}/auth`, authRateLimiter, authRoutes);
  app.use(`/api/${appConfig.apiVersion}/users`, userRoutes);
  app.use(`/api/${appConfig.apiVersion}/doctors`, doctorRoutes);
  app.use(`/api/${appConfig.apiVersion}/consultations`, bookingRateLimiter, consultationRoutes);
  app.use(`/api/${appConfig.apiVersion}/reviews`, reviewRoutes);
  app.use(`/api/${appConfig.apiVersion}/analytics`, analyticsRoutes);


  
  // 404 handler
  app.use((req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'NOT_FOUND',
        message: `Route ${req.method} ${req.path} not found`,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  });

  // Error handling (must be last)
  app.use(errorHandler);

  return app;
};
