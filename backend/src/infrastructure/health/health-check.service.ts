import { pool } from '../database/connection';
import { redis } from '../cache/redis.client';
import { emailQueue, notificationQueue, analyticsQueue } from '../queue/queue.client';
import { logger } from '../observability/logger';
import { SystemHealthCheck } from '../../common/types/advanced.types';

export class HealthCheckService {
  private static startTime = Date.now();

  static async checkSystemHealth(): Promise<SystemHealthCheck> {
    const results: SystemHealthCheck = {
      database: { status: 'healthy', connections: 0, responseTime: 0 },
      redis: { status: 'healthy', memoryUsage: 0, responseTime: 0 },
      jobQueues: {
        emailQueue: { status: 'healthy', pendingJobs: 0, failedJobs: 0 },
        notificationQueue: { status: 'healthy', pendingJobs: 0, failedJobs: 0 },
        analyticsQueue: { status: 'healthy', pendingJobs: 0, failedJobs: 0 },
      },
      systemUptime: Math.floor((Date.now() - this.startTime) / 1000),
      timestamp: new Date().toISOString(),
    };

    // Check database
    try {
      const start = Date.now();
      await pool.query('SELECT NOW()');
      results.database.responseTime = Date.now() - start;
      results.database.connections = pool.totalCount;

      if (results.database.responseTime > 1000) {
        results.database.status = 'degraded';
      }
    } catch (error) {
      results.database.status = 'unhealthy';
      logger.error('Database health check failed', { error });
    }

    // Check Redis
    try {
      const start = Date.now();
      await redis.ping();
      results.redis.responseTime = Date.now() - start;

      // Get memory info
      const info = await redis.info('memory');
      const memUsage = parseInt(info.split('used_memory:')[1]?.split('\r')[0] || '0');
      results.redis.memoryUsage = Math.round(memUsage / 1024 / 1024); // MB

      if (results.redis.responseTime > 500 || results.redis.memoryUsage > 1000) {
        results.redis.status = 'degraded';
      }
    } catch (error) {
      results.redis.status = 'unhealthy';
      logger.error('Redis health check failed', { error });
    }

    // Check Job Queues
    try {
      const emailCounts = await emailQueue.getJobCounts();
      results.jobQueues.emailQueue.pendingJobs = emailCounts.waiting;
      results.jobQueues.emailQueue.failedJobs = emailCounts.failed;

      const notificationCounts = await notificationQueue.getJobCounts();
      results.jobQueues.notificationQueue.pendingJobs = notificationCounts.waiting;
      results.jobQueues.notificationQueue.failedJobs = notificationCounts.failed;

      const analyticsCounts = await analyticsQueue.getJobCounts();
      results.jobQueues.analyticsQueue.pendingJobs = analyticsCounts.waiting;
      results.jobQueues.analyticsQueue.failedJobs = analyticsCounts.failed;

      // Mark as degraded if too many failed jobs
      if (
        emailCounts.failed > 100 ||
        notificationCounts.failed > 100 ||
        analyticsCounts.failed > 100
      ) {
        results.jobQueues.emailQueue.status = 'degraded';
        results.jobQueues.notificationQueue.status = 'degraded';
        results.jobQueues.analyticsQueue.status = 'degraded';
      }
    } catch (error) {
      logger.error('Job queue health check failed', { error });
    }

    return results;
  }

  static getOverallStatus(health: SystemHealthCheck): 'healthy' | 'degraded' | 'unhealthy' {
    const statuses = [
      health.database.status,
      health.redis.status,
      health.jobQueues.emailQueue.status,
      health.jobQueues.notificationQueue.status,
      health.jobQueues.analyticsQueue.status,
    ];

    if (statuses.some((s) => s === 'unhealthy')) {
      return 'unhealthy';
    }
    if (statuses.some((s) => s === 'degraded')) {
      return 'degraded';
    }
    return 'healthy';
  }
}
