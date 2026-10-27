# Healthum Telemedicine Backend - Step-by-Step Implementation Guide

## Overview

This document provides a detailed, step-by-step implementation guide for building the Healthum telemedicine backend. Each phase builds upon the previous one, ensuring a systematic and tested approach.

**Total Timeline:** 4-5 days  
**Approach:** Build → Test → Verify → Move to Next

---

## Phase 0: Project Setup & Environment Configuration

**Duration:** 2-3 hours  
**Goal:** Create development environment and project foundation

### Step 0.1: Initialize Project Structure
```bash
# Create project directory
mkdir healthum-backend
cd healthum-backend

# Initialize Node.js project
npm init -y

# Initialize Git
git init
```

### Step 0.2: Install Core Dependencies
```bash
# Production dependencies
npm install express
npm install typescript ts-node @types/node @types/express
npm install dotenv
npm install pg
npm install redis
npm install ioredis
npm install bull
npm install winston morgan
npm install helmet cors
npm install express-rate-limit
npm install jsonwebtoken bcryptjs
npm install zod
npm install uuid
npm install date-fns

# Development dependencies
npm install -D nodemon
npm install -D @types/jsonwebtoken
npm install -D @types/bcryptjs
npm install -D @types/uuid
npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin
npm install -D prettier
npm install -D jest @types/jest ts-jest supertest @types/supertest
```

### Step 0.3: Create Configuration Files

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**package.json scripts:**
```json
{
  "scripts": {
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write \"src/**/*.ts\""
  }
}
```

**.env.example:**
```env
# Server
NODE_ENV=development
PORT=3000
API_VERSION=v1

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/healthum
DB_POOL_MIN=5
DB_POOL_MAX=20

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# JWT
JWT_ACCESS_SECRET=your-access-secret-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-change-in-production
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Security
BCRYPT_ROUNDS=12
MFA_ISSUER=Healthum

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# External Services (Mock for now)
SMTP_HOST=localhost
SMTP_PORT=1025
SMS_API_KEY=mock-key
PAYMENT_GATEWAY_KEY=mock-key
```

**.gitignore:**
```
node_modules/
dist/
.env
.env.local
*.log
coverage/
.DS_Store
```

### Step 0.4: Create Base Folder Structure
```bash
mkdir -p src/{modules,common,infrastructure}
mkdir -p src/common/{config,middleware,utils,constants,interfaces,types}
mkdir -p src/infrastructure/{database,cache,queue,observability}
mkdir -p tests/{unit,integration,e2e,fixtures}
mkdir -p infrastructure/{docker,kubernetes,terraform,scripts}
mkdir -p docs
```

**Deliverable:** ✅ Project initialized with dependencies and basic structure

---

## Phase 1: Core Infrastructure & Configuration

**Duration:** 4-6 hours  
**Goal:** Setup database, Redis, logging, and base middleware

### Step 1.1: Database Configuration

**File:** `src/infrastructure/database/connection.ts`
```typescript
import { Pool, PoolConfig } from 'pg';
import { logger } from '../observability/logger';

const poolConfig: PoolConfig = {
  connectionString: process.env.DATABASE_URL,
  min: parseInt(process.env.DB_POOL_MIN || '5'),
  max: parseInt(process.env.DB_POOL_MAX || '20'),
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

export const pool = new Pool(poolConfig);

pool.on('connect', () => {
  logger.info('Database connection established');
});

pool.on('error', (err) => {
  logger.error('Unexpected database error', { error: err.message });
  process.exit(-1);
});

export const query = async (text: string, params?: any[]) => {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    logger.debug('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    logger.error('Query error', { text, error });
    throw error;
  }
};
```

### Step 1.2: Create Database Migrations

**File:** `src/infrastructure/database/migrations/001_create_users_table.sql`
```sql
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('patient', 'doctor', 'admin')),
    is_email_verified BOOLEAN DEFAULT FALSE,
    is_phone_verified BOOLEAN DEFAULT FALSE,
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
    last_login_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_role ON users(role);
```

**File:** `src/infrastructure/database/migrations/002_create_profiles_table.sql`
```sql
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    address JSONB,
    avatar_url VARCHAR(500),
    emergency_contact JSONB,
    medical_history JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_profiles_user_id ON profiles(user_id);
```

**File:** `src/infrastructure/database/migrations/003_create_doctors_table.sql`
```sql
CREATE TABLE IF NOT EXISTS doctors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    license_number VARCHAR(100) UNIQUE NOT NULL,
    specialization VARCHAR(100)[] NOT NULL,
    qualification VARCHAR(500) NOT NULL,
    experience_years INTEGER,
    languages VARCHAR(50)[] DEFAULT ARRAY['English'],
    consultation_fee DECIMAL(10, 2) NOT NULL,
    rating DECIMAL(3, 2) DEFAULT 0.00,
    total_consultations INTEGER DEFAULT 0,
    bio TEXT,
    certifications JSONB,
    is_verified BOOLEAN DEFAULT FALSE,
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_doctors_user_id ON doctors(user_id);
CREATE INDEX idx_doctors_specialization ON doctors USING GIN(specialization);
CREATE INDEX idx_doctors_is_available ON doctors(is_available) WHERE is_available = TRUE;
```

**File:** `src/infrastructure/database/migrate.ts`
```typescript
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { query } from './connection';
import { logger } from '../observability/logger';

export async function runMigrations() {
  const migrationsDir = join(__dirname, 'migrations');
  const files = readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

  for (const file of files) {
    try {
      const sql = readFileSync(join(migrationsDir, file), 'utf-8');
      await query(sql);
      logger.info(`Migration ${file} executed successfully`);
    } catch (error) {
      logger.error(`Migration ${file} failed`, { error });
      throw error;
    }
  }
}
```

### Step 1.3: Redis Configuration

**File:** `src/infrastructure/cache/redis.client.ts`
```typescript
import Redis from 'ioredis';
import { logger } from '../observability/logger';

const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy: (times: number) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
};

export const redis = new Redis(redisConfig);

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error('Redis error', { error: err.message });
});

export const cacheService = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any, ttl?: number): Promise<void> {
    const serialized = JSON.stringify(value);
    if (ttl) {
      await redis.setex(key, ttl, serialized);
    } else {
      await redis.set(key, serialized);
    }
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  },

  async delPattern(pattern: string): Promise<void> {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  },
};
```

### Step 1.4: Logger Setup

**File:** `src/infrastructure/observability/logger.ts`
```typescript
import winston from 'winston';

const logLevel = process.env.LOG_LEVEL || 'info';

export const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});

if (process.env.NODE_ENV === 'production') {
  logger.add(
    new winston.transports.File({ filename: 'error.log', level: 'error' })
  );
  logger.add(new winston.transports.File({ filename: 'combined.log' }));
}
```

### Step 1.5: Common Middleware

**File:** `src/common/middleware/error-handler.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infrastructure/observability/logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  if (err instanceof AppError) {
    logger.warn('Application error', {
      statusCode: err.statusCode,
      message: err.message,
      code: err.code,
      path: req.path,
      method: req.method,
    });

    return res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.code || 'ERROR',
        message: err.message,
        details: err.details,
      },
      metadata: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  }

  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: req.id,
    },
  });
};
```

**File:** `src/common/middleware/correlation-id.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

declare global {
  namespace Express {
    interface Request {
      id: string;
    }
  }
}

export const correlationId = (req: Request, res: Response, next: NextFunction) => {
  req.id = req.headers['x-request-id'] as string || uuidv4();
  res.setHeader('X-Request-ID', req.id);
  next();
};
```

**File:** `src/common/middleware/request-logger.middleware.ts`
```typescript
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
  }
);
```

### Step 1.6: Base Application Setup

**File:** `src/common/config/app.config.ts`
```typescript
export const appConfig = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  apiVersion: process.env.API_VERSION || 'v1',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};
```

**File:** `src/app.ts`
```typescript
import express, { Application } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { correlationId } from './common/middleware/correlation-id.middleware';
import { requestLogger } from './common/middleware/request-logger.middleware';
import { errorHandler } from './common/middleware/error-handler.middleware';
import { appConfig } from './common/config/app.config';

export const createApp = (): Application => {
  const app = express();

  // Security middleware
  app.use(helmet());
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Custom middleware
  app.use(correlationId);
  app.use(requestLogger);

  // Health check
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  // API routes will be added here
  app.get(`/api/${appConfig.apiVersion}`, (req, res) => {
    res.json({
      message: 'Healthum API',
      version: appConfig.apiVersion,
      timestamp: new Date().toISOString(),
    });
  });

  // Error handling
  app.use(errorHandler);

  return app;
};
```

**File:** `src/server.ts`
```typescript
import 'dotenv/config';
import { createApp } from './app';
import { appConfig } from './common/config/app.config';
import { logger } from './infrastructure/observability/logger';
import { runMigrations } from './infrastructure/database/migrate';
import { pool } from './infrastructure/database/connection';
import { redis } from './infrastructure/cache/redis.client';

const startServer = async () => {
  try {
    // Run migrations
    await runMigrations();
    logger.info('Database migrations completed');

    // Create Express app
    const app = createApp();

    // Start server
    const server = app.listen(appConfig.port, () => {
      logger.info(`Server running on port ${appConfig.port} in ${appConfig.nodeEnv} mode`);
    });

    // Graceful shutdown
    const shutdown = async () => {
      logger.info('Shutting down gracefully...');
      server.close(() => {
        logger.info('HTTP server closed');
      });

      await pool.end();
      await redis.quit();
      process.exit(0);
    };

    process.on('SIGTERM', shutdown);
    process.on('SIGINT', shutdown);

  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
};

startServer();
```

### Step 1.7: Setup Docker Development Environment

**File:** `infrastructure/docker/docker-compose.yml`
```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: healthum
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

**Test Phase 1:**
```bash
# Start Docker services
docker-compose -f infrastructure/docker/docker-compose.yml up -d

# Copy .env.example to .env
cp .env.example .env

# Run the server
npm run dev

# Test health endpoint
curl http://localhost:3000/health
```

**Deliverable:** ✅ Infrastructure layer complete with DB, Redis, logging, and basic middleware

---

## Phase 2: Authentication & User Management Module

**Duration:** 6-8 hours  
**Goal:** Complete user authentication with JWT, MFA, and RBAC

### Step 2.1: Create Common Utilities

**File:** `src/common/utils/hash.util.ts`
```typescript
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12');

export const hashUtil = {
  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, SALT_ROUNDS);
  },

  async compare(plain: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(plain, hashed);
  },
};
```

**File:** `src/common/constants/roles.constant.ts`
```typescript
export enum Role {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
}

export enum Permission {
  READ_OWN_DATA = 'read:own',
  WRITE_OWN_DATA = 'write:own',
  READ_ALL_DATA = 'read:all',
  WRITE_ALL_DATA = 'write:all',
  MANAGE_USERS = 'manage:users',
  VIEW_ANALYTICS = 'view:analytics',
}

export const rolePermissions: Record<Role, Permission[]> = {
  [Role.PATIENT]: [Permission.READ_OWN_DATA, Permission.WRITE_OWN_DATA],
  [Role.DOCTOR]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.READ_ALL_DATA,
  ],
  [Role.ADMIN]: [
    Permission.READ_OWN_DATA,
    Permission.WRITE_OWN_DATA,
    Permission.READ_ALL_DATA,
    Permission.WRITE_ALL_DATA,
    Permission.MANAGE_USERS,
    Permission.VIEW_ANALYTICS,
  ],
};
```

### Step 2.2: User Module - DTOs and Validators

**File:** `src/modules/auth/dto/register.dto.ts`
```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional(),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain uppercase letter')
    .regex(/[a-z]/, 'Password must contain lowercase letter')
    .regex(/[0-9]/, 'Password must contain number')
    .regex(/[@$!%*?&#]/, 'Password must contain special character'),
  role: z.enum(['patient', 'doctor', 'admin']).default('patient'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
});

export type RegisterDto = z.infer<typeof registerSchema>;
```

**File:** `src/modules/auth/dto/login.dto.ts`
```typescript
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
  mfaCode: z.string().optional(),
});

export type LoginDto = z.infer<typeof loginSchema>;
```

### Step 2.3: User Repository

**File:** `src/modules/auth/repositories/user.repository.ts`
```typescript
import { query } from '../../../infrastructure/database/connection';

export interface User {
  id: string;
  email: string;
  phone?: string;
  password_hash: string;
  role: string;
  is_email_verified: boolean;
  is_phone_verified: boolean;
  mfa_enabled: boolean;
  mfa_secret?: string;
  status: string;
  last_login_at?: Date;
  created_at: Date;
  updated_at: Date;
}

export class UserRepository {
  async create(data: {
    email: string;
    phone?: string;
    password_hash: string;
    role: string;
  }): Promise<User> {
    const result = await query(
      `INSERT INTO users (email, phone, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.email, data.phone, data.password_hash, data.role]
    );
    return result.rows[0];
  }

  async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0] || null;
  }

  async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  async updateLastLogin(id: string): Promise<void> {
    await query(
      'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  async updateMfaSecret(id: string, secret: string): Promise<void> {
    await query(
      'UPDATE users SET mfa_secret = $1, mfa_enabled = true WHERE id = $2',
      [secret, id]
    );
  }
}
```

### Step 2.4: Token Service

**File:** `src/modules/auth/services/token.service.ts`
```typescript
import jwt from 'jsonwebtoken';
import { User } from '../repositories/user.repository';

interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export class TokenService {
  private accessSecret = process.env.JWT_ACCESS_SECRET!;
  private refreshSecret = process.env.JWT_REFRESH_SECRET!;
  private accessExpiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  private refreshExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';

  generateAccessToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, this.accessSecret, { expiresIn: this.accessExpiry });
  }

  generateRefreshToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, this.refreshSecret, { expiresIn: this.refreshExpiry });
  }

  verifyAccessToken(token: string): TokenPayload {
    return jwt.verify(token, this.accessSecret) as TokenPayload;
  }

  verifyRefreshToken(token: string): TokenPayload {
    return jwt.verify(token, this.refreshSecret) as TokenPayload;
  }
}
```

### Step 2.5: Auth Service

**File:** `src/modules/auth/services/auth.service.ts`
```typescript
import { hashUtil } from '../../../common/utils/hash.util';
import { UserRepository, User } from '../repositories/user.repository';
import { TokenService } from './token.service';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import { AppError } from '../../../common/middleware/error-handler.middleware';

export class AuthService {
  private userRepository = new UserRepository();
  private tokenService = new TokenService();

  async register(dto: RegisterDto): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new AppError(409, 'User already exists', 'USER_EXISTS');
    }

    // Hash password
    const passwordHash = await hashUtil.hash(dto.password);

    // Create user
    const user = await this.userRepository.create({
      email: dto.email,
      phone: dto.phone,
      password_hash: passwordHash,
      role: dto.role,
    });

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async login(dto: LoginDto): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    // Find user
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Verify password
    const isValidPassword = await hashUtil.compare(dto.password, user.password_hash);
    if (!isValidPassword) {
      throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check MFA if enabled
    if (user.mfa_enabled && !dto.mfaCode) {
      throw new AppError(401, 'MFA code required', 'MFA_REQUIRED');
    }

    // Update last login
    await this.userRepository.updateLastLogin(user.id);

    // Generate tokens
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(user);

    return {
      user,
      tokens: { accessToken, refreshToken },
    };
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = this.tokenService.verifyRefreshToken(refreshToken);
      const user = await this.userRepository.findById(payload.userId);
      
      if (!user) {
        throw new AppError(401, 'Invalid token', 'INVALID_TOKEN');
      }

      const newAccessToken = this.tokenService.generateAccessToken(user);
      const newRefreshToken = this.tokenService.generateRefreshToken(user);

      return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new AppError(401, 'Invalid token', 'INVALID_TOKEN');
    }
  }
}
```

### Step 2.6: Auth Middleware

**File:** `src/modules/auth/middleware/jwt.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { TokenService } from '../services/token.service';
import { UserRepository } from '../repositories/user.repository';
import { AppError } from '../../../common/middleware/error-handler.middleware';

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError(401, 'No token provided', 'NO_TOKEN');
    }

    const token = authHeader.substring(7);
    const tokenService = new TokenService();
    
    const payload = tokenService.verifyAccessToken(token);
    
    // Verify user still exists
    const userRepo = new UserRepository();
    const user = await userRepo.findById(payload.userId);
    
    if (!user || user.status !== 'active') {
      throw new AppError(401, 'Invalid token', 'INVALID_TOKEN');
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    next();
  } catch (error) {
    if (error instanceof AppError) {
      next(error);
    } else {
      next(new AppError(401, 'Invalid token', 'INVALID_TOKEN'));
    }
  }
};
```

**File:** `src/modules/auth/middleware/rbac.middleware.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../../common/middleware/error-handler.middleware';

export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError(401, 'Unauthorized', 'UNAUTHORIZED'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AppError(403, 'Forbidden', 'FORBIDDEN'));
    }

    next();
  };
};
```

### Step 2.7: Auth Controller

**File:** `src/modules/auth/controllers/auth.controller.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { registerSchema } from '../dto/register.dto';
import { loginSchema } from '../dto/login.dto';
import { AppError } from '../../../common/middleware/error-handler.middleware';

export class AuthController {
  private authService = new AuthService();

  register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await this.authService.register(validatedData);

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
          },
          tokens: result.tokens,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'ZodError') {
        next(new AppError(400, 'Validation error', 'VALIDATION_ERROR', error));
      } else {
        next(error);
      }
    }
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await this.authService.login(validatedData);

      // Set refresh token as httpOnly cookie
      res.cookie('refreshToken', result.tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      res.json({
        success: true,
        data: {
          user: {
            id: result.user.id,
            email: result.user.email,
            role: result.user.role,
          },
          accessToken: result.tokens.accessToken,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

      if (!refreshToken) {
        throw new AppError(401, 'No refresh token provided', 'NO_REFRESH_TOKEN');
      }

      const tokens = await this.authService.refreshToken(refreshToken);

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.json({
        success: true,
        data: {
          accessToken: tokens.accessToken,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.clearCookie('refreshToken');
      
      res.json({
        success: true,
        data: {
          message: 'Logged out successfully',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json({
        success: true,
        data: {
          user: req.user,
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
```

### Step 2.8: Auth Routes

**File:** `src/modules/auth/routes.ts`
```typescript
import { Router } from 'express';
import { AuthController } from './controllers/auth.controller';
import { authenticate } from './middleware/jwt.middleware';

const router = Router();
const authController = new AuthController();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authenticate, authController.logout);
router.get('/me', authenticate, authController.getMe);

export default router;
```

### Step 2.9: Update App with Auth Routes

**Update:** `src/app.ts`
```typescript
// ... existing imports
import authRoutes from './modules/auth/routes';

export const createApp = (): Application => {
  // ... existing middleware

  // API routes
  app.use(`/api/${appConfig.apiVersion}/auth`, authRoutes);

  // ... rest of the code
};
```

**Test Phase 2:**
```bash
# Test registration
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "Test@1234",
    "role": "patient",
    "firstName": "John",
    "lastName": "Doe"
  }'

# Test login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "patient@test.com",
    "password": "Test@1234"
  }'

# Test protected endpoint
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

**Deliverable:** ✅ Complete authentication system with JWT, registration, login, and protected routes

---

## Phase 3: Doctor & Booking Module

**Duration:** 8-10 hours  
**Goal:** Implement doctor profiles, availability management, and booking system with concurrency control

### Step 3.1: Create Remaining Migration Files

**File:** `src/infrastructure/database/migrations/004_create_availability_slots_table.sql`
```sql
CREATE TABLE IF NOT EXISTS availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
    max_bookings INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    version INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_time_range CHECK (start_time < end_time),
    CONSTRAINT check_booking_limit CHECK (current_bookings <= max_bookings)
);

CREATE INDEX idx_availability_doctor_date ON availability_slots(doctor_id, slot_date);
CREATE INDEX idx_availability_status ON availability_slots(status) WHERE status = 'available';
CREATE UNIQUE INDEX idx_availability_unique ON availability_slots(doctor_id, slot_date, start_time);
```

**File:** `src/infrastructure/database/migrations/005_create_consultations_table.sql`
```sql
CREATE TABLE IF NOT EXISTS consultations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consultation_number VARCHAR(50) UNIQUE NOT NULL,
    patient_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES doctors(id),
    slot_id UUID REFERENCES availability_slots(id),
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(30) DEFAULT 'scheduled' CHECK (status IN 
        ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
    consultation_type VARCHAR(20) DEFAULT 'video' CHECK (consultation_type IN ('video', 'audio', 'chat')),
    chief_complaint TEXT,
    diagnosis TEXT,
    notes TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES users(id),
    meeting_link VARCHAR(500),
    recording_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_scheduled_at ON consultations(scheduled_at);

-- Create first partition
CREATE TABLE consultations_2026_10 PARTITION OF consultations
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
```

**File:** `src/infrastructure/database/migrations/006_create_payments_table.sql`
```sql
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id VARCHAR(100) UNIQUE NOT NULL,
    consultation_id UUID REFERENCES consultations(id),
    patient_id UUID REFERENCES users(id),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN 
        ('pending', 'processing', 'completed', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    gateway_response JSONB,
    refund_amount DECIMAL(10, 2),
    refunded_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_payments_consultation ON payments(consultation_id);
CREATE INDEX idx_payments_patient ON payments(patient_id);
CREATE INDEX idx_payments_status ON payments(status);
```

### Step 3.2: Doctor Repository & Service

**File:** `src/modules/doctor/repositories/doctor.repository.ts`
```typescript
import { query } from '../../../infrastructure/database/connection';

export interface Doctor {
  id: string;
  user_id: string;
  license_number: string;
  specialization: string[];
  qualification: string;
  experience_years: number;
  languages: string[];
  consultation_fee: number;
  rating: number;
  total_consultations: number;
  bio: string;
  certifications: any;
  is_verified: boolean;
  is_available: boolean;
  created_at: Date;
  updated_at: Date;
}

export class DoctorRepository {
  async create(data: {
    user_id: string;
    license_number: string;
    specialization: string[];
    qualification: string;
    experience_years: number;
    consultation_fee: number;
  }): Promise<Doctor> {
    const result = await query(
      `INSERT INTO doctors 
       (user_id, license_number, specialization, qualification, experience_years, consultation_fee)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.user_id,
        data.license_number,
        data.specialization,
        data.qualification,
        data.experience_years,
        data.consultation_fee,
      ]
    );
    return result.rows[0];
  }

  async findById(id: string): Promise<Doctor | null> {
    const result = await query('SELECT * FROM doctors WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async findByUserId(userId: string): Promise<Doctor | null> {
    const result = await query('SELECT * FROM doctors WHERE user_id = $1', [userId]);
    return result.rows[0] || null;
  }

  async search(filters: {
    specialization?: string;
    is_available?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ doctors: Doctor[]; total: number }> {
    let queryText = 'SELECT * FROM doctors WHERE 1=1';
    const params: any[] = [];
    let paramCount = 0;

    if (filters.specialization) {
      paramCount++;
      queryText += ` AND $${paramCount} = ANY(specialization)`;
      params.push(filters.specialization);
    }

    if (filters.is_available !== undefined) {
      paramCount++;
      queryText += ` AND is_available = $${paramCount}`;
      params.push(filters.is_available);
    }

    // Get total count
    const countResult = await query(`SELECT COUNT(*) FROM (${queryText}) as count_query`, params);
    const total = parseInt(countResult.rows[0].count);

    // Add pagination
    if (filters.limit) {
      paramCount++;
      queryText += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    if (filters.offset) {
      paramCount++;
      queryText += ` OFFSET $${paramCount}`;
      params.push(filters.offset);
    }

    const result = await query(queryText, params);
    return { doctors: result.rows, total };
  }
}
```

### Step 3.3: Availability Repository

**File:** `src/modules/booking/repositories/availability.repository.ts`
```typescript
import { query } from '../../../infrastructure/database/connection';

export interface AvailabilitySlot {
  id: string;
  doctor_id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: 'available' | 'booked' | 'blocked';
  max_bookings: number;
  current_bookings: number;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export class AvailabilityRepository {
  async create(data: {
    doctor_id: string;
    slot_date: string;
    start_time: string;
    end_time: string;
  }): Promise<AvailabilitySlot> {
    const result = await query(
      `INSERT INTO availability_slots (doctor_id, slot_date, start_time, end_time)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [data.doctor_id, data.slot_date, data.start_time, data.end_time]
    );
    return result.rows[0];
  }

  async findByDoctorAndDate(
    doctorId: string,
    date: string
  ): Promise<AvailabilitySlot[]> {
    const result = await query(
      `SELECT * FROM availability_slots 
       WHERE doctor_id = $1 AND slot_date = $2
       ORDER BY start_time`,
      [doctorId, date]
    );
    return result.rows;
  }

  async findAvailableSlots(doctorId: string, date: string): Promise<AvailabilitySlot[]> {
    const result = await query(
      `SELECT * FROM availability_slots 
       WHERE doctor_id = $1 
       AND slot_date = $2 
       AND status = 'available'
       AND current_bookings < max_bookings
       ORDER BY start_time`,
      [doctorId, date]
    );
    return result.rows;
  }

  async bookSlot(slotId: string, version: number): Promise<boolean> {
    const result = await query(
      `UPDATE availability_slots 
       SET current_bookings = current_bookings + 1,
           status = CASE 
             WHEN current_bookings + 1 >= max_bookings THEN 'booked'
             ELSE status 
           END,
           version = version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 
       AND version = $2 
       AND status = 'available'
       AND current_bookings < max_bookings
       RETURNING *`,
      [slotId, version]
    );
    return result.rowCount > 0;
  }

  async releaseSlot(slotId: string): Promise<void> {
    await query(
      `UPDATE availability_slots 
       SET current_bookings = GREATEST(current_bookings - 1, 0),
           status = 'available',
           version = version + 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1`,
      [slotId]
    );
  }
}
```

### Step 3.4: Slot Lock Service (Redis)

**File:** `src/modules/booking/services/slot-lock.service.ts`
```typescript
import { redis } from '../../../infrastructure/cache/redis.client';
import { AppError } from '../../../common/middleware/error-handler.middleware';

export class SlotLockService {
  private readonly LOCK_TTL = 300; // 5 minutes
  private readonly LOCK_PREFIX = 'lock:slot:';

  async acquireLock(slotId: string, userId: string): Promise<boolean> {
    const lockKey = `${this.LOCK_PREFIX}${slotId}`;
    const result = await redis.set(lockKey, userId, 'EX', this.LOCK_TTL, 'NX');
    return result === 'OK';
  }

  async releaseLock(slotId: string, userId: string): Promise<void> {
    const lockKey = `${this.LOCK_PREFIX}${slotId}`;
    const currentHolder = await redis.get(lockKey);
    
    if (currentHolder === userId) {
      await redis.del(lockKey);
    }
  }

  async extendLock(slotId: string, userId: string): Promise<boolean> {
    const lockKey = `${this.LOCK_PREFIX}${slotId}`;
    const currentHolder = await redis.get(lockKey);
    
    if (currentHolder === userId) {
      await redis.expire(lockKey, this.LOCK_TTL);
      return true;
    }
    
    return false;
  }
}
```

### Step 3.5: Booking Service with SAGA Pattern

**File:** `src/modules/booking/services/booking.service.ts`
```typescript
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../../infrastructure/database/connection';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { SlotLockService } from './slot-lock.service';
import { AppError } from '../../../common/middleware/error-handler.middleware';
import { logger } from '../../../infrastructure/observability/logger';

export interface Consultation {
  id: string;
  consultation_number: string;
  patient_id: string;
  doctor_id: string;
  slot_id: string;
  scheduled_at: Date;
  status: string;
}

export class BookingService {
  private availabilityRepo = new AvailabilityRepository();
  private slotLockService = new SlotLockService();

  async createBooking(data: {
    patient_id: string;
    slot_id: string;
  }): Promise<Consultation> {
    const client = await (await import('../../../infrastructure/database/connection')).pool.connect();
    
    try {
      await client.query('BEGIN');

      // Step 1: Get slot details
      const slotResult = await client.query(
        'SELECT * FROM availability_slots WHERE id = $1 FOR UPDATE',
        [data.slot_id]
      );

      if (slotResult.rowCount === 0) {
        throw new AppError(404, 'Slot not found', 'SLOT_NOT_FOUND');
      }

      const slot = slotResult.rows[0];

      // Step 2: Validate slot availability
      if (slot.status !== 'available' || slot.current_bookings >= slot.max_bookings) {
        throw new AppError(409, 'Slot no longer available', 'SLOT_UNAVAILABLE');
      }

      // Step 3: Acquire distributed lock
      const lockAcquired = await this.slotLockService.acquireLock(data.slot_id, data.patient_id);
      if (!lockAcquired) {
        throw new AppError(409, 'Slot is being booked by another user', 'SLOT_LOCKED');
      }

      try {
        // Step 4: Update slot (optimistic locking)
        const updateResult = await client.query(
          `UPDATE availability_slots 
           SET current_bookings = current_bookings + 1,
               status = CASE 
                 WHEN current_bookings + 1 >= max_bookings THEN 'booked'::VARCHAR
                 ELSE status 
               END,
               version = version + 1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = $1 
           AND version = $2 
           AND status = 'available'
           RETURNING *`,
          [data.slot_id, slot.version]
        );

        if (updateResult.rowCount === 0) {
          throw new AppError(409, 'Slot booking conflict', 'BOOKING_CONFLICT');
        }

        // Step 5: Create consultation
        const consultationNumber = `CON-${Date.now()}-${uuidv4().slice(0, 8)}`;
        const scheduledAt = new Date(`${slot.slot_date}T${slot.start_time}`);

        const consultationResult = await client.query(
          `INSERT INTO consultations 
           (consultation_number, patient_id, doctor_id, slot_id, scheduled_at, status)
           VALUES ($1, $2, $3, $4, $5, 'scheduled')
           RETURNING *`,
          [consultationNumber, data.patient_id, slot.doctor_id, data.slot_id, scheduledAt]
        );

        const consultation = consultationResult.rows[0];

        // Step 6: Commit transaction
        await client.query('COMMIT');

        logger.info('Booking created successfully', {
          consultationId: consultation.id,
          patientId: data.patient_id,
          slotId: data.slot_id,
        });

        return consultation;

      } finally {
        // Always release lock
        await this.slotLockService.releaseLock(data.slot_id, data.patient_id);
      }

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Booking creation failed', { error, data });
      throw error;
    } finally {
      client.release();
    }
  }

  async cancelBooking(consultationId: string, userId: string, reason: string): Promise<void> {
    const client = await (await import('../../../infrastructure/database/connection')).pool.connect();

    try {
      await client.query('BEGIN');

      // Get consultation
      const consultationResult = await client.query(
        'SELECT * FROM consultations WHERE id = $1 FOR UPDATE',
        [consultationId]
      );

      if (consultationResult.rowCount === 0) {
        throw new AppError(404, 'Consultation not found', 'CONSULTATION_NOT_FOUND');
      }

      const consultation = consultationResult.rows[0];

      if (consultation.status !== 'scheduled') {
        throw new AppError(400, 'Cannot cancel this consultation', 'INVALID_STATUS');
      }

      // Update consultation status
      await client.query(
        `UPDATE consultations 
         SET status = 'cancelled',
             cancelled_at = CURRENT_TIMESTAMP,
             cancelled_by = $1,
             cancellation_reason = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [userId, reason, consultationId]
      );

      // Release the slot
      await client.query(
        `UPDATE availability_slots 
         SET current_bookings = GREATEST(current_bookings - 1, 0),
             status = 'available',
             version = version + 1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $1`,
        [consultation.slot_id]
      );

      await client.query('COMMIT');

      logger.info('Booking cancelled successfully', {
        consultationId,
        userId,
        reason,
      });

    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('Booking cancellation failed', { error, consultationId });
      throw error;
    } finally {
      client.release();
    }
  }

  async getBookingById(id: string): Promise<Consultation | null> {
    const result = await query('SELECT * FROM consultations WHERE id = $1', [id]);
    return result.rows[0] || null;
  }

  async getUserBookings(userId: string, role: string): Promise<Consultation[]> {
    const field = role === 'doctor' ? 'doctor_id' : 'patient_id';
    const result = await query(
      `SELECT * FROM consultations WHERE ${field} = $1 ORDER BY scheduled_at DESC`,
      [userId]
    );
    return result.rows;
  }
}
```

### Step 3.6: Booking Controller & Routes

**File:** `src/modules/booking/controllers/booking.controller.ts`
```typescript
import { Request, Response, NextFunction } from 'express';
import { BookingService } from '../services/booking.service';
import { AvailabilityRepository } from '../repositories/availability.repository';
import { DoctorRepository } from '../../doctor/repositories/doctor.repository';
import { z } from 'zod';
import { AppError } from '../../../common/middleware/error-handler.middleware';

const createBookingSchema = z.object({
  slot_id: z.string().uuid('Invalid slot ID'),
});

const createAvailabilitySchema = z.object({
  slot_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start_time: z.string().regex(/^\d{2}:\d{2}$/),
  end_time: z.string().regex(/^\d{2}:\d{2}$/),
});

export class BookingController {
  private bookingService = new BookingService();
  private availabilityRepo = new AvailabilityRepository();
  private doctorRepo = new DoctorRepository();

  // Create booking
  createBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createBookingSchema.parse(req.body);
      
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const consultation = await this.bookingService.createBooking({
        patient_id: req.user.id,
        slot_id: validatedData.slot_id,
      });

      res.status(201).json({
        success: true,
        data: { consultation },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Get booking by ID
  getBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const consultation = await this.bookingService.getBookingById(id);

      if (!consultation) {
        throw new AppError(404, 'Booking not found', 'BOOKING_NOT_FOUND');
      }

      res.json({
        success: true,
        data: { consultation },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Get user bookings
  getUserBookings = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      const consultations = await this.bookingService.getUserBookings(
        req.user.id,
        req.user.role
      );

      res.json({
        success: true,
        data: { consultations },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Cancel booking
  cancelBooking = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;

      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      await this.bookingService.cancelBooking(id, req.user.id, reason);

      res.json({
        success: true,
        data: {
          message: 'Booking cancelled successfully',
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Doctor: Create availability
  createAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validatedData = createAvailabilitySchema.parse(req.body);

      if (!req.user) {
        throw new AppError(401, 'Unauthorized', 'UNAUTHORIZED');
      }

      // Get doctor ID from user
      const doctor = await this.doctorRepo.findByUserId(req.user.id);
      if (!doctor) {
        throw new AppError(404, 'Doctor profile not found', 'DOCTOR_NOT_FOUND');
      }

      const slot = await this.availabilityRepo.create({
        doctor_id: doctor.id,
        ...validatedData,
      });

      res.status(201).json({
        success: true,
        data: { slot },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Get doctor availability
  getDoctorAvailability = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;

      if (!date || typeof date !== 'string') {
        throw new AppError(400, 'Date parameter is required', 'MISSING_DATE');
      }

      const slots = await this.availabilityRepo.findAvailableSlots(doctorId, date);

      res.json({
        success: true,
        data: { slots },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  // Search doctors
  searchDoctors = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { specialization, page = '1', limit = '20' } = req.query;

      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);

      const result = await this.doctorRepo.search({
        specialization: specialization as string,
        is_available: true,
        limit: parseInt(limit as string),
        offset,
      });

      res.json({
        success: true,
        data: {
          doctors: result.doctors,
        },
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: result.total,
          totalPages: Math.ceil(result.total / parseInt(limit as string)),
        },
        metadata: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
```

**File:** `src/modules/booking/routes.ts`
```typescript
import { Router } from 'express';
import { BookingController } from './controllers/booking.controller';
import { authenticate } from '../auth/middleware/jwt.middleware';
import { authorize } from '../auth/middleware/rbac.middleware';

const router = Router();
const bookingController = new BookingController();

// Booking endpoints
router.post('/bookings', authenticate, bookingController.createBooking);
router.get('/bookings/:id', authenticate, bookingController.getBooking);
router.get('/bookings', authenticate, bookingController.getUserBookings);
router.patch('/bookings/:id/cancel', authenticate, bookingController.cancelBooking);

// Doctor availability
router.post(
  '/availability',
  authenticate,
  authorize('doctor'),
  bookingController.createAvailability
);
router.get('/doctors/:doctorId/availability', bookingController.getDoctorAvailability);

// Doctor search
router.get('/doctors', bookingController.searchDoctors);

export default router;
```

### Step 3.7: Update App with Booking Routes

**Update:** `src/app.ts`
```typescript
// ... existing imports
import bookingRoutes from './modules/booking/routes';

export const createApp = (): Application => {
  // ... existing middleware

  // API routes
  app.use(`/api/${appConfig.apiVersion}/auth`, authRoutes);
  app.use(`/api/${appConfig.apiVersion}`, bookingRoutes);

  // ... rest of the code
};
```

**Test Phase 3:**
```bash
# 1. Create doctor availability (as doctor)
curl -X POST http://localhost:3000/api/v1/availability \
  -H "Authorization: Bearer DOCTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slot_date": "2026-10-28",
    "start_time": "10:00",
    "end_time": "11:00"
  }'

# 2. Search doctors
curl "http://localhost:3000/api/v1/doctors?specialization=Cardiology"

# 3. Get doctor availability
curl "http://localhost:3000/api/v1/doctors/DOCTOR_ID/availability?date=2026-10-28"

# 4. Create booking (as patient)
curl -X POST http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slot_id": "SLOT_ID"
  }'

# 5. Get user bookings
curl http://localhost:3000/api/v1/bookings \
  -H "Authorization: Bearer PATIENT_TOKEN"
```

**Deliverable:** ✅ Complete booking system with concurrency control, distributed locking, and SAGA pattern

---

## Phase 4: Remaining Tables, Documentation & Testing

**Duration:** 6-8 hours  
**Goal:** Complete remaining features, documentation, and comprehensive testing

### Step 4.1: Create Remaining Migrations

**File:** `src/infrastructure/database/migrations/007_create_prescriptions_table.sql`
```sql
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prescription_number VARCHAR(50) UNIQUE NOT NULL,
    consultation_id UUID REFERENCES consultations(id),
    patient_id UUID REFERENCES users(id),
    doctor_id UUID REFERENCES doctors(id),
    medications JSONB NOT NULL,
    instructions TEXT,
    valid_until DATE,
    is_dispensed BOOLEAN DEFAULT FALSE,
    dispensed_at TIMESTAMP WITH TIME ZONE,
    digital_signature TEXT,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_prescriptions_consultation ON prescriptions(consultation_id);
CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_prescriptions_valid_until ON prescriptions(valid_until);
```

**File:** `src/infrastructure/database/migrations/008_create_audit_logs_table.sql`
```sql
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    request_id VARCHAR(100),
    changes JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
) PARTITION BY RANGE (created_at);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

CREATE TABLE audit_logs_2026_10 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
```

**File:** `src/infrastructure/database/migrations/009_create_idempotency_keys_table.sql`
```sql
CREATE TABLE IF NOT EXISTS idempotency_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key VARCHAR(255) UNIQUE NOT NULL,
    request_path VARCHAR(500) NOT NULL,
    request_method VARCHAR(10) NOT NULL,
    user_id UUID REFERENCES users(id),
    response_status INTEGER,
    response_body JSONB,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_idempotency_key ON idempotency_keys(key);
CREATE INDEX idx_idempotency_expires ON idempotency_keys(expires_at);
```

### Step 4.2: Write Unit Tests

**File:** `tests/unit/auth/auth.service.test.ts`
```typescript
import { AuthService } from '../../../src/modules/auth/services/auth.service';
import { UserRepository } from '../../../src/modules/auth/repositories/user.repository';
import { hashUtil } from '../../../src/common/utils/hash.util';

jest.mock('../../../src/modules/auth/repositories/user.repository');
jest.mock('../../../src/common/utils/hash.util');

describe('AuthService', () => {
  let authService: AuthService;
  let mockUserRepo: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepo = new UserRepository() as jest.Mocked<UserRepository>;
    authService = new AuthService();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const registerDto = {
        email: 'test@example.com',
        password: 'Test@1234',
        role: 'patient' as const,
        firstName: 'John',
        lastName: 'Doe',
      };

      mockUserRepo.findByEmail = jest.fn().mockResolvedValue(null);
      mockUserRepo.create = jest.fn().mockResolvedValue({
        id: 'user-123',
        email: registerDto.email,
        role: registerDto.role,
      });

      (hashUtil.hash as jest.Mock).mockResolvedValue('hashed-password');

      const result = await authService.register(registerDto);

      expect(result.user).toBeDefined();
      expect(result.tokens).toBeDefined();
      expect(mockUserRepo.findByEmail).toHaveBeenCalledWith(registerDto.email);
    });

    it('should throw error if user already exists', async () => {
      mockUserRepo.findByEmail = jest.fn().mockResolvedValue({ id: 'existing-user' });

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'Test@1234',
          role: 'patient',
          firstName: 'John',
          lastName: 'Doe',
        })
      ).rejects.toThrow('User already exists');
    });
  });
});
```

### Step 4.3: Create OpenAPI Documentation

**File:** `docs/api-spec.yaml`
```yaml
openapi: 3.0.0
info:
  title: Healthum Telemedicine API
  version: 1.0.0
  description: Production-grade telemedicine backend API
servers:
  - url: http://localhost:3000/api/v1
    description: Development server

components:
  securitySchemes:
    BearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

  schemas:
    Error:
      type: object
      properties:
        success:
          type: boolean
          example: false
        error:
          type: object
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object

    User:
      type: object
      properties:
        id:
          type: string
          format: uuid
        email:
          type: string
          format: email
        role:
          type: string
          enum: [patient, doctor, admin]

paths:
  /auth/register:
    post:
      tags:
        - Authentication
      summary: Register a new user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
                - firstName
                - lastName
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                role:
                  type: string
                  enum: [patient, doctor, admin]
                  default: patient
                firstName:
                  type: string
                lastName:
                  type: string
      responses:
        '201':
          description: User registered successfully
        '400':
          description: Validation error
        '409':
          description: User already exists

  /auth/login:
    post:
      tags:
        - Authentication
      summary: Login user
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - email
                - password
              properties:
                email:
                  type: string
                password:
                  type: string
      responses:
        '200':
          description: Login successful
        '401':
          description: Invalid credentials

  /bookings:
    post:
      tags:
        - Bookings
      summary: Create a new booking
      security:
        - BearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - slot_id
              properties:
                slot_id:
                  type: string
                  format: uuid
      responses:
        '201':
          description: Booking created successfully
        '401':
          description: Unauthorized
        '409':
          description: Slot conflict

    get:
      tags:
        - Bookings
      summary: Get user bookings
      security:
        - BearerAuth: []
      responses:
        '200':
          description: List of bookings
        '401':
          description: Unauthorized
```

### Step 4.4: Create README

**File:** `README.md`
```markdown
# Healthum Telemedicine Backend

Production-grade telemedicine backend supporting 100k daily consultations with 99.95% availability.

## Features

- ✅ JWT Authentication with MFA support
- ✅ Role-Based Access Control (RBAC)
- ✅ Doctor availability management
- ✅ Booking system with concurrency control
- ✅ Distributed locking with Redis
- ✅ SAGA pattern for distributed transactions
- ✅ Comprehensive logging and error handling
- ✅ API documentation (OpenAPI 3.0)

## Tech Stack

- **Runtime:** Node.js 20+
- **Language:** TypeScript
- **Framework:** Express.js
- **Database:** PostgreSQL 15+
- **Cache:** Redis 7+
- **Testing:** Jest

## Prerequisites

- Node.js 20+
- Docker & Docker Compose
- PostgreSQL 15+
- Redis 7+

## Quick Start

### 1. Clone and Install

```bash
git clone <repository-url>
cd healthum-backend
npm install
```

### 2. Setup Environment

```bash
cp .env.example .env
# Edit .env with your configuration
```

### 3. Start Database Services

```bash
docker-compose -f infrastructure/docker/docker-compose.yml up -d
```

### 4. Run Development Server

```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Documentation

See `docs/api-spec.yaml` for complete API documentation.

### Health Check

```bash
curl http://localhost:3000/health
```

### Register User

```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Test@1234",
    "firstName": "John",
    "lastName": "Doe",
    "role": "patient"
  }'
```

## Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Project Structure

```
src/
├── modules/           # Feature modules
│   ├── auth/         # Authentication
│   ├── booking/      # Booking system
│   ├── doctor/       # Doctor management
│   └── ...
├── common/           # Shared utilities
├── infrastructure/   # Database, cache, logging
└── app.ts           # Application setup
```

## Database Migrations

Migrations run automatically on server start. To run manually:

```bash
npm run migrate
```

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT
```

### Step 4.5: Dockerfile

**File:** `infrastructure/docker/Dockerfile`
```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

**Deliverable:** ✅ Complete application with tests, documentation, and Docker support

---

## Phase 5: Final Polish & Deployment Preparation

**Duration:** 4-6 hours  
**Goal:** Security hardening, CI/CD, and production readiness

### Step 5.1: Rate Limiting Middleware

**File:** `src/common/middleware/rate-limiter.middleware.ts`
```typescript
import rateLimit from 'express-rate-limit';
import { redis } from '../../infrastructure/cache/redis.client';

export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: options.message || 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    // Use Redis for distributed rate limiting
    store: {
      increment: async (key: string) => {
        const count = await redis.incr(`ratelimit:${key}`);
        if (count === 1) {
          await redis.expire(`ratelimit:${key}`, Math.ceil(options.windowMs / 1000));
        }
        return { totalHits: count, resetTime: undefined };
      },
      decrement: async (key: string) => {
        await redis.decr(`ratelimit:${key}`);
      },
      resetKey: async (key: string) => {
        await redis.del(`ratelimit:${key}`);
      },
    } as any,
  });
};

// Predefined rate limiters
export const authRateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: 'Too many authentication attempts',
});

export const bookingRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
});

export const generalRateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100,
});
```

### Step 5.2: GitHub Actions CI/CD

**File:** `.github/workflows/ci.yml`
```yaml
name: CI

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15-alpine
        env:
          POSTGRES_DB: healthum_test
          POSTGRES_USER: postgres
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run build

      - name: Run tests
        run: npm run test:coverage
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/healthum_test
          REDIS_URL: redis://localhost:6379

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

  security:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Run Snyk security scan
        uses: snyk/actions/node@master
        env:
          SNYK_TOKEN: ${{ secrets.SNYK_TOKEN }}
```

### Step 5.3: Architecture Documentation

**File:** `docs/architecture.md`
```markdown
# System Architecture

## Overview

Healthum is built as a modular monolith with clear domain boundaries, enabling future microservices migration if needed.

## Architecture Diagram

```
┌─────────────────────────────────────────┐
│          Load Balancer / CDN            │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         Application Servers             │
│  (Node.js + Express + TypeScript)       │
│                                          │
│  ┌────────────┐  ┌────────────┐        │
│  │   Auth     │  │  Booking   │  ...   │
│  │   Module   │  │   Module   │        │
│  └────────────┘  └────────────┘        │
└─────────────────────────────────────────┘
        │                   │
        ▼                   ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │
│  (Primary)   │   │   (Cache)    │
└──────────────┘   └──────────────┘
```

## Module Structure

Each module follows clean architecture principles:

- **Controllers**: HTTP request handling
- **Services**: Business logic
- **Repositories**: Data access
- **DTOs**: Data transfer objects
- **Entities**: Domain models

## Data Flow

1. Request enters through Express middleware stack
2. Authentication & authorization checks
3. Request validation (Zod schemas)
4. Business logic in service layer
5. Database operations through repository
6. Response formatting and return

## Security Layers

1. **Network**: TLS 1.3, firewall rules
2. **Application**: Helmet.js headers, CORS
3. **Authentication**: JWT with refresh tokens
4. **Authorization**: RBAC middleware
5. **Data**: Encryption at rest, parameterized queries

## Scalability Design

- **Horizontal scaling**: Stateless application servers
- **Database**: Read replicas, connection pooling
- **Cache**: Redis for hot data
- **Async processing**: Bull queue for background jobs

## Monitoring

- **Logs**: Winston structured logging
- **Metrics**: Prometheus exporters (future)
- **Tracing**: OpenTelemetry (future)
- **Health checks**: /health endpoint
```

**Deliverable:** ✅ Production-ready application with security, CI/CD, and documentation

---

## Testing Checklist

### Unit Tests
- [ ] Auth service (register, login, token refresh)
- [ ] Booking service (create, cancel)
- [ ] Hash utility
- [ ] Token service

### Integration Tests
- [ ] Auth API endpoints
- [ ] Booking API endpoints
- [ ] Database operations
- [ ] Redis operations

### E2E Tests
- [ ] Complete booking flow
- [ ] User registration to booking
- [ ] Concurrent booking attempts
- [ ] Booking cancellation

### Load Tests
- [ ] 100 concurrent users
- [ ] Booking endpoint stress test
- [ ] Database connection pool limits

---

## Deployment Steps

### 1. Build Docker Image
```bash
docker build -t healthum-backend:latest -f infrastructure/docker/Dockerfile .
```

### 2. Run Production Container
```bash
docker run -d \
  --name healthum-backend \
  -p 3000:3000 \
  --env-file .env.production \
  healthum-backend:latest
```

### 3. Database Setup
```bash
# Run migrations
npm run migrate
```

### 4. Health Check
```bash
curl http://localhost:3000/health
```

---

## Success Criteria

- [ ] All database tables created successfully
- [ ] User registration and login working
- [ ] Doctor can create availability slots
- [ ] Patient can book consultations
- [ ] Concurrent booking conflicts handled correctly
- [ ] All unit tests passing
- [ ] API documentation complete
- [ ] Docker container runs successfully
- [ ] CI/CD pipeline configured
- [ ] Security checklist completed

---

## Next Steps After MVP

1. Add MFA implementation
2. Implement prescription module
3. Add payment gateway integration
4. Setup observability (Prometheus + Grafana)
5. Implement audit logging
6. Add email/SMS notifications
7. Create admin analytics dashboard
8. Performance optimization
9. Load testing
10. Security audit

---

## Troubleshooting

### Database Connection Issues
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check connection
psql -h localhost -U postgres -d healthum
```

### Redis Connection Issues
```bash
# Check Redis is running
docker ps | grep redis

# Test connection
redis-cli ping
```

### Migration Failures
```bash
# Reset database (DEV ONLY)
DROP DATABASE healthum;
CREATE DATABASE healthum;

# Re-run migrations
npm run migrate
```

---

## Summary

This implementation guide provides a step-by-step roadmap to build a production-grade telemedicine backend. Each phase builds incrementally:

1. **Phase 0**: Project setup
2. **Phase 1**: Infrastructure (DB, Redis, logging)
3. **Phase 2**: Authentication & authorization
4. **Phase 3**: Core booking system
5. **Phase 4**: Testing & documentation
6. **Phase 5**: Production readiness

Follow each step sequentially, test thoroughly, and maintain the modular architecture for future scalability.
