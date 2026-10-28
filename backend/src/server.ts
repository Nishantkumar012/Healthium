import 'dotenv/config';
import { createApp } from './app';
import { appConfig } from './common/config/app.config';
import { logger } from './infrastructure/observability/logger';
import { pool, closePool } from './infrastructure/database/connection';
import { seedGuestAccounts } from './infrastructure/database/seed';

const startServer = async () => {
  try {
    // Test database connection
    logger.info('Testing database connection...');
    const testResult = await pool.query('SELECT NOW()');
    logger.info('Database connection successful', { timestamp: testResult.rows[0].now });

    // Seed guest accounts in development mode
    if (appConfig.isDevelopment) {
      await seedGuestAccounts();
    }

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(appConfig.port, () => {
      logger.info(`Server running on port ${appConfig.port} in ${appConfig.nodeEnv} mode`);
      logger.info(`API available at http://localhost:${appConfig.port}/api/${appConfig.apiVersion}`);
      logger.info(`Health check at http://localhost:${appConfig.port}/health`);
    });

    // Graceful shutdown handler
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          await closePool();
          logger.info('Database connection pool closed');
        } catch (error) {
          logger.error('Error closing database pool', { error });
        }

        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after 30 seconds');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason, promise });
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
