import dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
dotenv.config();

import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { query } from './connection';
import { logger } from '../observability/logger';

export async function runMigrations() {
  const migrationsDir = join(__dirname, 'migrations');

  try {
    const files = readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    if (files.length === 0) {
      logger.warn('No migration files found');
      return;
    }

    logger.info(`Found ${files.length} migration files`);

    for (const file of files) {
      try {
        const sql = readFileSync(join(migrationsDir, file), 'utf-8');
        await query(sql);
        logger.info(`✓ Migration executed: ${file}`);
      } catch (error) {
        logger.error(`✗ Migration failed: ${file}`, {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
      }
    }

    logger.info('All migrations completed successfully');
  } catch (error) {
    logger.error('Migration process failed', { error });
    throw error;
  }
}

if (require.main === module) {
  logger.info('Starting migrations', {
    database: process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 60) + '...' : 'NOT SET'
  });
  runMigrations()
    .then(() => {
      logger.info('Migrations complete');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration error', { error });
      process.exit(1);
    });
}
