import Queue from 'bull';
import { logger } from '../observability/logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

// Job queue types
export enum JobPriority {
  HIGH = 1,
  NORMAL = 5,
  LOW = 10,
}

// Email job
export const emailQueue = new Queue('email', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Notification job
export const notificationQueue = new Queue('notification', redisUrl, {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Analytics job
export const analyticsQueue = new Queue('analytics', redisUrl, {
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

// Setup event listeners for all queues
const setupQueueListeners = (queue: Queue.Queue, queueName: string) => {
  queue.on('completed', (job) => {
    logger.info(`Job completed: ${queueName}`, {
      jobId: job.id,
      duration: job.finishedOn! - job.processedOn!,
    });
  });

  queue.on('failed', (job, err) => {
    logger.error(`Job failed: ${queueName}`, {
      jobId: job.id,
      attempt: job.attemptsMade,
      error: err.message,
    });
  });

  queue.on('error', (err) => {
    logger.error(`Queue error: ${queueName}`, { error: err.message });
  });

  queue.on('stalled', (job) => {
    logger.warn(`Job stalled: ${queueName}`, { jobId: job.id });
  });
};

setupQueueListeners(emailQueue, 'email');
setupQueueListeners(notificationQueue, 'notification');
setupQueueListeners(analyticsQueue, 'analytics');

logger.info('Job queues initialized');

export async function closeQueues(): Promise<void> {
  await emailQueue.close();
  await notificationQueue.close();
  await analyticsQueue.close();
  logger.info('All job queues closed');
}
