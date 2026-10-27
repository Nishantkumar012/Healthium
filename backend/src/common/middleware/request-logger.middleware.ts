import { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import { logger } from '../../infrastructure/observability/logger';

morgan.token('id', (req: Request) => req.id);

export const requestLogger = morgan(
  ':id :method :url :status :res[content-length] - :response-time ms',
  {
    stream: {
      write: (message: string) => logger.info(message.trim()),
    },
    skip: (req: Request) => {
      return req.path === '/health' || req.path === '/health/ready' || req.path === '/health/live';
    },
  }
);
