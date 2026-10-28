import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redis } from '../../infrastructure/cache/redis.client';
import { logger } from '../../infrastructure/observability/logger';
import { appConfig } from '../config/app.config';

interface RateLimiterOptions {
  windowMs: number;
  max: number;
  message?: string;
  keyGenerator?: (req: any) => string;
}

// Skip rate limiting in development mode
const skipRateLimit = (req: any) => {
  return appConfig.isDevelopment;
};

export const createRateLimiter = (options: RateLimiterOptions) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skip: skipRateLimit,
    keyGenerator: options.keyGenerator || ((req: any) => ipKeyGenerator(req.ip)),
    handler: (req, res) => {
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        path: req.path,
        method: req.method,
      });
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Too many requests, please try again later',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    },
    store: new RedisStore({
      sendCommand: async (...args: string[]) => {
        return (redis as any).call(...args);
      },
    } as any),
  });
};

// Predefined rate limiters for different endpoints

export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
  message: 'Too many authentication attempts, please try again later',
});

export const bookingRateLimiter = createRateLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: parseInt(process.env.BOOKING_RATE_LIMIT_MAX || '20'),
  message: 'Too many booking requests, please try again later',
});

export const generalRateLimiter = createRateLimiter({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'), // 1 minute
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests, please try again later',
});

export const apiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 1000,
  message: 'API rate limit exceeded',
});

logger.info('Rate limiters initialized' + (appConfig.isDevelopment ? ' (disabled in dev mode)' : ''));
