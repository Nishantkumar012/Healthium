# Healthum Telemedicine Backend - Implementation Plan

## Executive Summary

Production-grade telemedicine backend for Amrutam supporting 100k daily consultations with 99.95% availability, sub-200ms read latency, and comprehensive security/observability.

**Timeline:** 4-5 days  
**Tech Stack:** Node.js + TypeScript, PostgreSQL, Redis, Docker, AWS/GCP  
**Architecture:** Modular monolith with service layer pattern, ready for microservices migration

---

## 1. System Architecture

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Load Balancer                         │
│                     (Rate Limiting Layer)                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway Layer                        │
│          (Auth, Validation, Request Tracing)                 │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   Auth       │    │  Booking     │    │   Admin      │
│   Service    │    │  Service     │    │   Service    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  PostgreSQL  │    │    Redis     │    │  Job Queue   │
│   (Primary)  │    │   (Cache)    │    │   (Bull)     │
└──────────────┘    └──────────────┘    └──────────────┘
        │
        ▼
┌──────────────┐
│  PostgreSQL  │
│  (Replica)   │
└──────────────┘
```

### 1.2 Technology Decisions

**Backend Framework:** Node.js + TypeScript + Express
- Async I/O for high concurrency
- Rich ecosystem for healthcare integrations
- TypeScript for type safety and maintainability

**Database:** PostgreSQL 15+
- ACID compliance for critical healthcare data
- JSON columns for flexible document storage
- Partitioning support for scalability

**Cache:** Redis 7+
- Session management
- Rate limiting counters
- Availability slot caching

**Job Queue:** Bull (Redis-based)
- Email notifications
- Report generation
- Data aggregation tasks

**Observability:** OpenTelemetry + Prometheus + Grafana + Loki
- Distributed tracing
- Metrics collection
- Centralized logging

---

## 2. Project Structure

```
healthum/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── controllers/
│   │   │   │   ├── auth.controller.ts
│   │   │   │   └── auth.controller.test.ts
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts
│   │   │   │   ├── mfa.service.ts
│   │   │   │   └── token.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── user.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── mfa.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── user.entity.ts
│   │   │   ├── middleware/
│   │   │   │   ├── jwt.middleware.ts
│   │   │   │   └── rbac.middleware.ts
│   │   │   ├── validators/
│   │   │   │   └── auth.validator.ts
│   │   │   └── routes.ts
│   │   │
│   │   ├── booking/
│   │   │   ├── controllers/
│   │   │   │   ├── booking.controller.ts
│   │   │   │   └── availability.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── booking.service.ts
│   │   │   │   ├── availability.service.ts
│   │   │   │   ├── slot-lock.service.ts
│   │   │   │   └── notification.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── booking.repository.ts
│   │   │   │   └── availability.repository.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-booking.dto.ts
│   │   │   │   └── update-availability.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── booking.entity.ts
│   │   │   │   └── availability-slot.entity.ts
│   │   │   ├── jobs/
│   │   │   │   ├── booking-reminder.job.ts
│   │   │   │   └── booking-expiry.job.ts
│   │   │   └── routes.ts
│   │   │
│   │   ├── consultation/
│   │   │   ├── controllers/
│   │   │   │   ├── consultation.controller.ts
│   │   │   │   └── prescription.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── consultation.service.ts
│   │   │   │   ├── prescription.service.ts
│   │   │   │   └── consultation-state.service.ts
│   │   │   ├── repositories/
│   │   │   │   ├── consultation.repository.ts
│   │   │   │   └── prescription.repository.ts
│   │   │   ├── dto/
│   │   │   │   └── create-prescription.dto.ts
│   │   │   ├── entities/
│   │   │   │   ├── consultation.entity.ts
│   │   │   │   └── prescription.entity.ts
│   │   │   └── routes.ts
│   │   │
│   │   ├── doctor/
│   │   │   ├── controllers/
│   │   │   │   └── doctor.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── doctor.service.ts
│   │   │   │   └── doctor-search.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── doctor.repository.ts
│   │   │   ├── dto/
│   │   │   │   └── doctor-profile.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── doctor.entity.ts
│   │   │   └── routes.ts
│   │   │
│   │   ├── payment/
│   │   │   ├── controllers/
│   │   │   │   └── payment.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── payment.service.ts
│   │   │   │   └── payment-gateway.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── payment.repository.ts
│   │   │   ├── dto/
│   │   │   │   └── payment.dto.ts
│   │   │   ├── entities/
│   │   │   │   └── payment.entity.ts
│   │   │   └── routes.ts
│   │   │
│   │   ├── admin/
│   │   │   ├── controllers/
│   │   │   │   ├── analytics.controller.ts
│   │   │   │   └── audit.controller.ts
│   │   │   ├── services/
│   │   │   │   ├── analytics.service.ts
│   │   │   │   └── audit.service.ts
│   │   │   ├── repositories/
│   │   │   │   └── audit.repository.ts
│   │   │   ├── dto/
│   │   │   │   └── analytics.dto.ts
│   │   │   └── routes.ts
│   │   │
│   │   └── compliance/
│   │       ├── services/
│   │       │   ├── audit-log.service.ts
│   │       │   └── data-retention.service.ts
│   │       └── entities/
│   │           └── audit-log.entity.ts
│   │
│   ├── common/
│   │   ├── config/
│   │   │   ├── database.config.ts
│   │   │   ├── redis.config.ts
│   │   │   ├── queue.config.ts
│   │   │   └── app.config.ts
│   │   ├── middleware/
│   │   │   ├── error-handler.middleware.ts
│   │   │   ├── request-logger.middleware.ts
│   │   │   ├── rate-limiter.middleware.ts
│   │   │   ├── idempotency.middleware.ts
│   │   │   └── correlation-id.middleware.ts
│   │   ├── interceptors/
│   │   │   └── response-transform.interceptor.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   ├── decorators/
│   │   │   ├── roles.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── idempotent.decorator.ts
│   │   ├── utils/
│   │   │   ├── encryption.util.ts
│   │   │   ├── hash.util.ts
│   │   │   ├── date.util.ts
│   │   │   └── retry.util.ts
│   │   ├── constants/
│   │   │   ├── roles.constant.ts
│   │   │   ├── error-codes.constant.ts
│   │   │   └── cache-keys.constant.ts
│   │   ├── interfaces/
│   │   │   ├── response.interface.ts
│   │   │   └── pagination.interface.ts
│   │   └── types/
│   │       └── express.d.ts
│   │
│   ├── infrastructure/
│   │   ├── database/
│   │   │   ├── migrations/
│   │   │   │   ├── 001_create_users_table.sql
│   │   │   │   ├── 002_create_doctors_table.sql
│   │   │   │   ├── 003_create_availability_slots_table.sql
│   │   │   │   ├── 004_create_consultations_table.sql
│   │   │   │   ├── 005_create_prescriptions_table.sql
│   │   │   │   ├── 006_create_payments_table.sql
│   │   │   │   ├── 007_create_audit_logs_table.sql
│   │   │   │   └── 008_create_indexes.sql
│   │   │   ├── seeds/
│   │   │   │   ├── 001_seed_roles.sql
│   │   │   │   └── 002_seed_test_doctors.sql
│   │   │   └── connection.ts
│   │   ├── cache/
│   │   │   ├── redis.client.ts
│   │   │   └── cache.service.ts
│   │   ├── queue/
│   │   │   ├── queue.client.ts
│   │   │   └── processors/
│   │   │       ├── email.processor.ts
│   │   │       └── notification.processor.ts
│   │   └── observability/
│   │       ├── logger.ts
│   │       ├── tracer.ts
│   │       └── metrics.ts
│   │
│   ├── app.ts
│   └── server.ts
│
├── tests/
│   ├── unit/
│   │   ├── auth/
│   │   ├── booking/
│   │   └── consultation/
│   ├── integration/
│   │   ├── api/
│   │   └── database/
│   ├── e2e/
│   │   ├── booking-flow.e2e.test.ts
│   │   └── consultation-flow.e2e.test.ts
│   └── fixtures/
│       └── test-data.ts
│
├── infrastructure/
│   ├── docker/
│   │   ├── Dockerfile
│   │   ├── Dockerfile.dev
│   │   └── docker-compose.yml
│   ├── kubernetes/
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── ingress.yaml
│   │   ├── configmap.yaml
│   │   ├── secret.yaml
│   │   └── hpa.yaml
│   ├── terraform/
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── database.tf
│   │   ├── redis.tf
│   │   └── monitoring.tf
│   └── scripts/
│       ├── backup.sh
│       ├── restore.sh
│       └── deploy.sh
│
├── docs/
│   ├── architecture.md
│   ├── api-spec.yaml
│   ├── database-schema.md
│   ├── security-threat-model.md
│   ├── deployment-guide.md
│   └── runbook.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── cd.yml
│       └── security-scan.yml
│
├── .env.example
├── .gitignore
├── .eslintrc.js
├── .prettierrc
├── tsconfig.json
├── jest.config.js
├── package.json
└── README.md
```

---

## 3. Database Schema Design

### 3.1 Core Tables

#### users
```sql
CREATE TABLE users (
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

#### profiles
```sql
CREATE TABLE profiles (
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

#### doctors
```sql
CREATE TABLE doctors (
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

#### availability_slots
```sql
CREATE TABLE availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
    slot_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'booked', 'blocked')),
    max_bookings INTEGER DEFAULT 1,
    current_bookings INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_time_range CHECK (start_time < end_time),
    CONSTRAINT check_booking_limit CHECK (current_bookings <= max_bookings)
);

CREATE INDEX idx_availability_doctor_date ON availability_slots(doctor_id, slot_date);
CREATE INDEX idx_availability_status ON availability_slots(status) WHERE status = 'available';
CREATE UNIQUE INDEX idx_availability_unique ON availability_slots(doctor_id, slot_date, start_time);
```

#### consultations
```sql
CREATE TABLE consultations (
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
);

CREATE INDEX idx_consultations_patient ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON consultations(doctor_id);
CREATE INDEX idx_consultations_status ON consultations(status);
CREATE INDEX idx_consultations_scheduled_at ON consultations(scheduled_at);

-- Partition by month for scalability
CREATE TABLE consultations_2026_10 PARTITION OF consultations
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
```

#### prescriptions
```sql
CREATE TABLE prescriptions (
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

#### payments
```sql
CREATE TABLE payments (
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

#### audit_logs
```sql
CREATE TABLE audit_logs (
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
);

CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- Partition by month
CREATE TABLE audit_logs_2026_10 PARTITION OF audit_logs
    FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
```

#### idempotency_keys
```sql
CREATE TABLE idempotency_keys (
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

---

## 4. API Design

### 4.1 RESTful API Endpoints

#### Authentication
```
POST   /api/v1/auth/register
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh-token
POST   /api/v1/auth/verify-email
POST   /api/v1/auth/verify-phone
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/mfa/enable
POST   /api/v1/auth/mfa/verify
POST   /api/v1/auth/mfa/disable
```

#### Users & Profiles
```
GET    /api/v1/users/me
PUT    /api/v1/users/me
PATCH  /api/v1/users/me/password
GET    /api/v1/profiles/me
PUT    /api/v1/profiles/me
```

#### Doctors
```
GET    /api/v1/doctors              # Search/filter doctors
GET    /api/v1/doctors/:id          # Get doctor details
GET    /api/v1/doctors/:id/availability
POST   /api/v1/doctors/availability # Doctor sets availability
PUT    /api/v1/doctors/availability/:id
DELETE /api/v1/doctors/availability/:id
GET    /api/v1/doctors/me/stats     # Doctor dashboard stats
```

#### Bookings
```
POST   /api/v1/bookings             # Create booking (idempotent)
GET    /api/v1/bookings/:id
GET    /api/v1/bookings             # List user bookings
PATCH  /api/v1/bookings/:id/cancel
POST   /api/v1/bookings/:id/reschedule
GET    /api/v1/bookings/upcoming
GET    /api/v1/bookings/history
```

#### Consultations
```
GET    /api/v1/consultations/:id
PATCH  /api/v1/consultations/:id/start
PATCH  /api/v1/consultations/:id/complete
POST   /api/v1/consultations/:id/notes
GET    /api/v1/consultations/:id/meeting-link
```

#### Prescriptions
```
POST   /api/v1/prescriptions        # Doctor creates prescription
GET    /api/v1/prescriptions/:id
GET    /api/v1/prescriptions/:id/pdf
GET    /api/v1/prescriptions        # List prescriptions
```

#### Payments
```
POST   /api/v1/payments/initiate
POST   /api/v1/payments/webhook     # Payment gateway callback
GET    /api/v1/payments/:id
POST   /api/v1/payments/:id/refund
```

#### Admin
```
GET    /api/v1/admin/analytics/dashboard
GET    /api/v1/admin/analytics/consultations
GET    /api/v1/admin/analytics/revenue
GET    /api/v1/admin/users
GET    /api/v1/admin/doctors/pending-verification
PATCH  /api/v1/admin/doctors/:id/verify
GET    /api/v1/admin/audit-logs
```

### 4.2 Response Format

```typescript
// Success Response
{
  "success": true,
  "data": { ... },
  "metadata": {
    "timestamp": "2026-10-27T13:28:34.238Z",
    "requestId": "req_abc123",
    "version": "v1"
  }
}

// Error Response
{
  "success": false,
  "error": {
    "code": "BOOKING_CONFLICT",
    "message": "The selected time slot is no longer available",
    "details": { ... }
  },
  "metadata": {
    "timestamp": "2026-10-27T13:28:34.238Z",
    "requestId": "req_abc123"
  }
}

// Paginated Response
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  },
  "metadata": { ... }
}
```

---

## 5. Security Implementation

### 5.1 Authentication & Authorization

**JWT Strategy:**
- Access token: 15 minutes expiry
- Refresh token: 7 days expiry (stored in httpOnly cookie)
- Token rotation on refresh

**MFA Support:**
- TOTP-based (Google Authenticator compatible)
- Backup codes for account recovery

**RBAC Implementation:**
```typescript
enum Role {
  PATIENT = 'patient',
  DOCTOR = 'doctor',
  ADMIN = 'admin'
}

enum Permission {
  READ_OWN_DATA = 'read:own',
  WRITE_OWN_DATA = 'write:own',
  READ_ALL_DATA = 'read:all',
  WRITE_ALL_DATA = 'write:all',
  MANAGE_USERS = 'manage:users',
  VIEW_ANALYTICS = 'view:analytics'
}
```

### 5.2 Data Protection

**Encryption at Rest:**
- AES-256 for sensitive fields (medical history, prescriptions)
- Database-level encryption (PostgreSQL TDE)

**Encryption in Transit:**
- TLS 1.3 for all API communications
- Certificate pinning for mobile apps

**PII Handling:**
- Tokenization for payment data
- Hash phone/email before logging
- Automatic PII masking in logs

### 5.3 Security Measures

**Input Validation:**
- Joi/Zod for request validation
- SQL injection prevention (parameterized queries)
- XSS protection (sanitization)

**Rate Limiting:**
```typescript
// Per endpoint rate limits
AUTH_ENDPOINTS: 5 requests/minute
BOOKING_ENDPOINTS: 20 requests/minute
READ_ENDPOINTS: 100 requests/minute
```

**API Security:**
- CORS configuration
- CSRF protection for cookie-based auth
- Request signing for webhooks
- IP whitelisting for admin endpoints

---

## 6. Scalability Strategy

### 6.1 Database Optimization

**Partitioning:**
- Consultations: Partition by month
- Audit logs: Partition by month
- Old partitions archived to cold storage

**Indexing Strategy:**
```sql
-- Composite indexes for common queries
CREATE INDEX idx_consultations_doctor_scheduled 
    ON consultations(doctor_id, scheduled_at) 
    WHERE status = 'scheduled';

CREATE INDEX idx_availability_search 
    ON availability_slots(slot_date, status) 
    WHERE status = 'available';
```

**Connection Pooling:**
```typescript
// pg pool config
{
  max: 20,              // Max connections
  min: 5,               // Min connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
}
```

### 6.2 Caching Strategy

**Redis Cache Layers:**

**Layer 1: Hot Data (TTL: 5-15 mins)**
- Doctor availability slots
- Active consultation counts
- User session data

**Layer 2: Warm Data (TTL: 1-6 hours)**
- Doctor profiles
- Specialization filters
- Platform statistics

**Cache Patterns:**
```typescript
// Cache-aside pattern
async getDoctorAvailability(doctorId: string, date: string) {
  const cacheKey = `availability:${doctorId}:${date}`;
  
  // Try cache first
  let slots = await redis.get(cacheKey);
  
  if (!slots) {
    // Cache miss - fetch from DB
    slots = await db.query(/* ... */);
    await redis.setex(cacheKey, 300, JSON.stringify(slots));
  }
  
  return JSON.parse(slots);
}

// Write-through pattern for critical updates
async updateAvailability(slotId: string, status: string) {
  await db.update(/* ... */);
  await redis.del(`availability:*`); // Invalidate cache
}
```

### 6.3 Concurrency Handling

**Optimistic Locking:**
```typescript
// version-based optimistic locking
UPDATE availability_slots 
SET status = 'booked', 
    current_bookings = current_bookings + 1,
    version = version + 1
WHERE id = $1 AND version = $2 AND status = 'available';
```

**Distributed Locking:**
```typescript
// Redlock for slot booking
async bookSlot(slotId: string, userId: string) {
  const lock = await redlock.acquire([`lock:slot:${slotId}`], 5000);
  
  try {
    // Check availability
    // Create booking
    // Update slot
    await db.transaction(/* ... */);
  } finally {
    await lock.release();
  }
}
```

### 6.4 Async Processing

**Job Queue Categories:**

**High Priority (Process immediately):**
- Booking confirmations
- Consultation reminders

**Normal Priority (Process within 1 min):**
- Email notifications
- SMS notifications

**Low Priority (Process within 5 mins):**
- Analytics aggregation
- Report generation

---

## 7. Observability

### 7.1 Logging

**Log Levels:**
```typescript
ERROR:   System failures, unhandled exceptions
WARN:    Recoverable errors, deprecated APIs
INFO:    Business events (booking created, payment completed)
DEBUG:   Detailed execution flow (dev/staging only)
```

**Structured Logging:**
```typescript
logger.info('Booking created', {
  bookingId: booking.id,
  patientId: booking.patientId,
  doctorId: booking.doctorId,
  scheduledAt: booking.scheduledAt,
  requestId: req.id,
  userId: req.user.id,
  duration: Date.now() - startTime
});
```

### 7.2 Metrics

**Key Metrics:**
```
# System Metrics
- http_requests_total (counter)
- http_request_duration_seconds (histogram)
- http_requests_in_flight (gauge)
- db_query_duration_seconds (histogram)
- cache_hit_rate (gauge)

# Business Metrics
- consultations_total (counter)
- bookings_created_total (counter)
- payment_success_rate (gauge)
- doctor_utilization_rate (gauge)
- average_wait_time_seconds (histogram)
```

### 7.3 Tracing

**OpenTelemetry Implementation:**
```typescript
// Distributed tracing
const span = tracer.startSpan('create_booking');
span.setAttribute('booking.patient_id', patientId);
span.setAttribute('booking.doctor_id', doctorId);

try {
  // Business logic
  span.addEvent('slot_locked');
  // ...
  span.setStatus({ code: SpanStatusCode.OK });
} catch (error) {
  span.recordException(error);
  span.setStatus({ code: SpanStatusCode.ERROR });
} finally {
  span.end();
}
```

### 7.4 Health Checks

```typescript
GET /health
{
  "status": "healthy",
  "timestamp": "2026-10-27T13:28:34.238Z",
  "uptime": 86400,
  "checks": {
    "database": { "status": "up", "latency": 12 },
    "redis": { "status": "up", "latency": 3 },
    "queue": { "status": "up", "pending_jobs": 42 }
  }
}

GET /health/ready  # Kubernetes readiness probe
GET /health/live   # Kubernetes liveness probe
```

---

## 8. Resilience & Reliability

### 8.1 Retry Strategy

**Exponential Backoff:**
```typescript
const retryConfig = {
  retries: 3,
  factor: 2,
  minTimeout: 1000,
  maxTimeout: 10000,
  randomize: true
};

// Retry for transient failures
await retry(async () => {
  return await externalAPI.call();
}, {
  ...retryConfig,
  onRetry: (error, attempt) => {
    logger.warn(`Retry attempt ${attempt}`, { error });
  }
});
```

**Circuit Breaker:**
```typescript
const breaker = new CircuitBreaker(paymentGateway.charge, {
  timeout: 5000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

breaker.on('open', () => {
  logger.error('Circuit breaker opened');
  // Alert ops team
});
```

### 8.2 Idempotency

```typescript
@Idempotent()
async createBooking(dto: CreateBookingDto, idempotencyKey: string) {
  // Check if request already processed
  const existing = await this.idempotencyRepo.findByKey(idempotencyKey);
  if (existing) {
    return existing.response;
  }

  // Process request
  const booking = await this.processBooking(dto);

  // Store response
  await this.idempotencyRepo.save({
    key: idempotencyKey,
    response: booking,
    expiresAt: addHours(new Date(), 24)
  });

  return booking;
}
```

### 8.3 Transaction Management

**SAGA Pattern for Distributed Transactions:**
```typescript
async bookConsultation(dto: BookingDto) {
  const saga = new Saga();

  try {
    // Step 1: Lock slot
    const slot = await saga.execute(
      () => this.lockSlot(dto.slotId),
      () => this.unlockSlot(dto.slotId)
    );

    // Step 2: Create booking
    const booking = await saga.execute(
      () => this.createBooking(dto),
      () => this.cancelBooking(booking.id)
    );

    // Step 3: Process payment
    const payment = await saga.execute(
      () => this.processPayment(booking),
      () => this.refundPayment(payment.id)
    );

    // Step 4: Send confirmation
    await saga.execute(
      () => this.sendConfirmation(booking),
      () => this.sendCancellation(booking)
    );

    await saga.commit();
    return booking;

  } catch (error) {
    await saga.rollback();
    throw error;
  }
}
```

---

## 9. Backup & Disaster Recovery

### 9.1 Backup Strategy

**Database Backups:**
```bash
# Automated daily backups
0 2 * * * /scripts/backup.sh

# Backup retention policy
- Daily backups: Keep 7 days
- Weekly backups: Keep 4 weeks
- Monthly backups: Keep 12 months
```

**Point-in-Time Recovery:**
- WAL archiving enabled
- 7-day recovery window

### 9.2 Disaster Recovery

**RTO/RPO Targets:**
- RTO (Recovery Time Objective): 2 hours
- RPO (Recovery Point Objective): 15 minutes

**DR Strategy:**
1. **Primary Region:** Active serving traffic
2. **Secondary Region:** Hot standby with async replication
3. **Failover:** Automatic DNS failover via health checks

**DR Drill Quarterly:**
- Test failover procedure
- Verify data integrity
- Measure recovery time

---

## 10. CI/CD Pipeline

### 10.1 GitHub Actions Workflow

**On Pull Request:**
```yaml
- Lint check (ESLint, Prettier)
- Type check (TypeScript)
- Unit tests (Jest)
- Integration tests
- Security scan (Snyk, Trivy)
- Build Docker image
- Deploy to staging
```

**On Merge to Main:**
```yaml
- Run full test suite
- Build production image
- Push to container registry
- Deploy to production (blue-green)
- Run smoke tests
- Update monitoring dashboards
```

### 10.2 Deployment Strategy

**Blue-Green Deployment:**
1. Deploy new version to "green" environment
2. Run health checks and smoke tests
3. Switch traffic to "green"
4. Monitor for 15 minutes
5. If issues detected, instant rollback to "blue"
6. If stable, decommission "blue"

---

## 11. Development Phases (4-5 Days)

### Day 1: Foundation & Core Infrastructure
**Tasks:**
- [ ] Initialize Node.js + TypeScript project
- [ ] Setup PostgreSQL database with migrations
- [ ] Setup Redis for caching
- [ ] Implement base architecture (DI, middleware)
- [ ] Configure logging and error handling
- [ ] Setup Docker development environment
- [ ] Create database migrations (all tables)
- [ ] Implement connection pooling

**Deliverables:**
- Working dev environment
- All database tables created
- Basic health check endpoint

---

### Day 2: Authentication & User Management
**Tasks:**
- [ ] Implement JWT-based authentication
- [ ] Password hashing with bcrypt
- [ ] Registration/login endpoints
- [ ] Email/phone verification
- [ ] MFA implementation (TOTP)
- [ ] RBAC middleware
- [ ] User profile management
- [ ] Doctor profile management
- [ ] Rate limiting middleware
- [ ] Idempotency middleware

**Deliverables:**
- Complete auth system
- User and doctor CRUD
- Unit tests for auth

---

### Day 3: Core Business Logic - Booking System
**Tasks:**
- [ ] Doctor availability management
- [ ] Availability slot search and filtering
- [ ] Booking creation with concurrency control
- [ ] Slot locking with Redis
- [ ] Booking cancellation/rescheduling
- [ ] Payment integration (mock gateway)
- [ ] Booking state machine
- [ ] Notification service (email/SMS queue)
- [ ] Audit logging for all operations

**Deliverables:**
- Complete booking flow
- Payment processing
- Integration tests

---

### Day 4: Consultation & Prescriptions + Observability
**Tasks:**
- [ ] Consultation lifecycle management
- [ ] Prescription creation and management
- [ ] Doctor search and filtering
- [ ] Admin analytics endpoints
- [ ] Audit log querying
- [ ] OpenTelemetry integration
- [ ] Prometheus metrics
- [ ] Structured logging with correlation IDs
- [ ] E2E tests for critical flows

**Deliverables:**
- Complete consultation flow
- Observability stack
- E2E test suite

---

### Day 5: Security, Infrastructure & Documentation
**Tasks:**
- [ ] Security hardening (helmet, CORS, CSP)
- [ ] Input validation and sanitization
- [ ] SQL injection testing
- [ ] Dependency vulnerability scanning
- [ ] Complete OpenAPI specification
- [ ] Architecture documentation
- [ ] Threat model document
- [ ] Infrastructure as Code (Terraform/K8s)
- [ ] CI/CD pipeline setup
- [ ] Backup and restore scripts
- [ ] Deployment runbook
- [ ] Performance testing (load tests)
- [ ] Record demo video

**Deliverables:**
- Complete documentation
- IaC scripts
- CI/CD pipeline
- Security checklist
- Demo video

---

## 12. Tech Stack Summary

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Runtime | Node.js 20+ | Backend runtime |
| Language | TypeScript 5+ | Type safety |
| Framework | Express.js | HTTP server |
| Database | PostgreSQL 15+ | Primary datastore |
| Cache | Redis 7+ | Caching & sessions |
| Queue | Bull | Async job processing |
| ORM | Knex.js | Query builder & migrations |
| Validation | Zod | Request validation |
| Auth | jsonwebtoken + bcrypt | Authentication |
| Testing | Jest + Supertest | Unit & integration tests |
| Logging | Winston + Morgan | Application logging |
| Metrics | Prometheus | Metrics collection |
| Tracing | OpenTelemetry | Distributed tracing |
| Containerization | Docker | Application packaging |
| Orchestration | Kubernetes | Container orchestration |
| IaC | Terraform | Infrastructure provisioning |
| CI/CD | GitHub Actions | Automation pipeline |

---

## 13. Key Design Decisions

### Why Modular Monolith?
- Faster development for MVP
- Single deployment unit (simpler ops)
- Clear module boundaries enable future microservices migration
- Reduced operational complexity
- Better for 100k daily consultations scale

### Why PostgreSQL?
- ACID compliance for healthcare data
- JSON support for flexible schemas
- Excellent partitioning support
- Strong community and tooling
- Native full-text search

### Why Redis?
- In-memory performance for hot data
- Atomic operations for distributed locking
- Pub/sub for real-time features
- Built-in expiration for cache invalidation

### Why Express over NestJS?
- Lighter weight, less abstraction
- More control over architecture
- Easier to implement custom patterns
- Better performance for high-throughput APIs

---

## 14. Performance Targets

| Metric | Target | Strategy |
|--------|--------|----------|
| Read latency (p95) | <200ms | Caching, indexing, connection pooling |
| Write latency (p95) | <500ms | Async processing, optimistic locking |
| Throughput | 1000 req/s | Horizontal scaling, load balancing |
| Availability | 99.95% | Multi-AZ deployment, circuit breakers |
| Database connections | <100 | Connection pooling, query optimization |
| Cache hit rate | >90% | Strategic caching, cache warming |
| Error rate | <0.1% | Retry logic, graceful degradation |

---

## 15. Security Checklist

- [x] HTTPS/TLS 1.3 enforcement
- [x] JWT with short expiry and refresh tokens
- [x] MFA support (TOTP)
- [x] Password hashing (bcrypt, cost factor 12)
- [x] Rate limiting per endpoint
- [x] Input validation and sanitization
- [x] SQL injection prevention (parameterized queries)
- [x] XSS protection (content security policy)
- [x] CSRF protection
- [x] CORS configuration
- [x] Helmet.js security headers
- [x] Secrets management (env vars, never committed)
- [x] PII encryption at rest (AES-256)
- [x] Audit logging for all sensitive operations
- [x] RBAC implementation
- [x] Dependency vulnerability scanning
- [x] Regular security updates
- [x] API request signing for webhooks
- [x] IP whitelisting for admin endpoints
- [x] Database encryption at rest

---

## 16. Monitoring & Alerts

### Critical Alerts
- API error rate >1%
- Database connection pool exhausted
- Redis connection failure
- Payment gateway failures >5%
- Disk usage >80%
- Memory usage >85%
- Response time p95 >500ms

### Warning Alerts
- Cache hit rate <80%
- Queue depth >1000 jobs
- Failed jobs >10/min
- CPU usage >70%

---

## 17. Compliance Considerations

**HIPAA Compliance (if US market):**
- Encrypt PHI at rest and in transit
- Access control and audit logs
- Business Associate Agreements (BAA)
- Regular security risk assessments

**GDPR Compliance (if EU market):**
- Right to erasure implementation
- Data portability
- Consent management
- Privacy policy and terms

**Indian Healthcare (if India market):**
- Digital Information Security in Healthcare Act (DISHA)
- Telemedicine Practice Guidelines
- E-pharmacy regulations

---

## 18. Next Steps After Implementation

### Post-MVP Enhancements
1. **Real-time Features:** WebSocket for video consultations
2. **AI Integration:** Symptom checker, prescription OCR
3. **Mobile Apps:** React Native apps for iOS/Android
4. **Advanced Analytics:** ML-based doctor recommendations
5. **Multi-tenancy:** White-label for hospitals
6. **Integrations:** EHR systems, pharmacy networks
7. **Internationalization:** Multi-language support
8. **Advanced Notifications:** Push notifications, WhatsApp

### Microservices Migration Path
When scale requires (>500k daily consultations):
1. Extract booking service
2. Extract payment service
3. Extract notification service
4. Implement API gateway
5. Service mesh (Istio)

---

## 19. Risk Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Payment gateway downtime | High | Queue payments, retry with backoff |
| Database failure | Critical | Hot standby, automated failover |
| Cache failure | Medium | Graceful degradation to DB |
| API rate limiting | Medium | Queue jobs, batch operations |
| Data breach | Critical | Encryption, audit logs, access control |
| Concurrent booking conflicts | High | Distributed locking, optimistic locking |
| Scale spikes | High | Auto-scaling, circuit breakers |

---

## 20. Success Metrics

**Technical:**
- 99.95% uptime achieved
- <200ms p95 read latency
- <500ms p95 write latency
- <0.1% error rate
- >90% cache hit rate
- Zero SQL injection vulnerabilities
- Zero critical security findings

**Business:**
- Support 100k daily consultations
- <1% booking conflicts
- <2% payment failures
- >95% successful consultation completion rate
- <5s average booking time

---

## Conclusion

This plan provides a comprehensive roadmap for building a production-grade telemedicine backend that is:
- **Secure:** Multi-layered security with encryption, MFA, RBAC
- **Scalable:** Horizontal scaling, caching, partitioning
- **Reliable:** 99.95% availability with DR strategy
- **Observable:** Full observability with logs, metrics, traces
- **Maintainable:** Clean architecture, comprehensive tests, documentation

The modular architecture allows rapid MVP development while maintaining clear boundaries for future microservices migration when scale demands it.
