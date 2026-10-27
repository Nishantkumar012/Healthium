/**
 * Jest Setup File
 * Runs before all tests
 */

// Test environment setup
beforeAll(() => {
  // Setup test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/healthum_test';
  process.env.REDIS_URL = 'redis://localhost:6379';
  process.env.PORT = '3001';
});

// Cleanup after all tests
afterAll(async () => {
  jest.clearAllMocks();
});
