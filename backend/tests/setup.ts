/**
 * Jest Setup File
 * Runs before all tests
 */

import { beforeAll, afterAll, jest } from '@jest/globals';

// Test environment setup
beforeAll(() => {
  // Setup test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/healthum';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.PORT = '3001';
});

// Cleanup after all tests
afterAll(async () => {
  jest.clearAllMocks();
});
