import { Request, Response, NextFunction } from 'express';
import { cacheService } from '../../infrastructure/cache/cache.service';
import { logger } from '../../infrastructure/observability/logger';
import { addHours } from 'date-fns';

interface IdempotencyOptions {
  ttl?: number; // Time to live in seconds (default: 24 hours)
}

const DEFAULT_TTL = 24 * 60 * 60; // 24 hours

export const idempotencyMiddleware = (options: IdempotencyOptions = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Only apply to POST, PUT, PATCH, DELETE requests
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
      return next();
    }

    // Get idempotency key from headers
    const idempotencyKey = req.headers['idempotency-key'] as string;

    if (!idempotencyKey) {
      return next();
    }

    // Validate idempotency key format
    if (typeof idempotencyKey !== 'string' || idempotencyKey.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_IDEMPOTENCY_KEY',
          message: 'Invalid Idempotency-Key header',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    }

    const cacheKey = `idempotency:${idempotencyKey}`;
    const ttl = options.ttl || DEFAULT_TTL;

    try {
      // Check if request was already processed
      const cachedResponse = await cacheService.get(cacheKey);

      if (cachedResponse) {
        logger.info('Idempotent request - returning cached response', {
          idempotencyKey,
          method: req.method,
          path: req.path,
        });

        res.setHeader('Idempotency-Replay', 'true');
        return res.status(cachedResponse.statusCode).json(cachedResponse.body);
      }

      // Store original send method
      const originalSend = res.send.bind(res);

      // Override send method to cache the response
      res.send = function (data: any) {
        // Only cache successful responses (2xx)
        if (res.statusCode >= 200 && res.statusCode < 300) {
          const responseData = {
            statusCode: res.statusCode,
            body: typeof data === 'string' ? JSON.parse(data) : data,
          };

          cacheService.set(cacheKey, responseData, { ttl }).catch((err) => {
            logger.error('Failed to cache idempotent response', {
              idempotencyKey,
              error: err.message,
            });
          });

          logger.info('Idempotent request - response cached', {
            idempotencyKey,
            method: req.method,
            path: req.path,
            ttl,
          });
        }

        return originalSend(data);
      };

      next();
    } catch (error) {
      logger.error('Idempotency middleware error', {
        idempotencyKey,
        error,
      });
      next();
    }
  };
};
