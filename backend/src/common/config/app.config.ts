export const appConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isStaging: process.env.NODE_ENV === 'staging',
  corsOrigin: process.env.CORS_ORIGIN || '*',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Database
  databaseUrl: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/healthum',
  dbPoolMin: parseInt(process.env.DB_POOL_MIN || '5'),
  dbPoolMax: parseInt(process.env.DB_POOL_MAX || '20'),
  dbIdleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  dbConnectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),

  // Redis
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379'),
  redisPassword: process.env.REDIS_PASSWORD,
  redisDb: parseInt(process.env.REDIS_DB || '0'),

  // JWT
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || 'default-access-secret-change-in-production',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'default-refresh-secret-change-in-production',
  jwtAccessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  jwtRefreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',

  // Security
  bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS || '12'),
  mfaIssuer: process.env.MFA_ISSUER || 'Healthum',
  mfaWindow: parseInt(process.env.MFA_WINDOW || '2'),

  // Rate Limiting
  rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000'),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5'),
  bookingRateLimitMax: parseInt(process.env.BOOKING_RATE_LIMIT_MAX || '20'),
};

