# Healthum Telemedicine Backend - Folder Structure

## Complete Directory Layout

```
healthum/
│
├── src/                                    # Main source code
│   ├── modules/                           # Feature modules (domain-driven design)
│   │   ├── auth/                         # Authentication & Authorization
│   │   │   ├── controllers/              # HTTP request handlers
│   │   │   ├── services/                 # Business logic
│   │   │   ├── repositories/             # Data access layer
│   │   │   ├── dto/                      # Data transfer objects
│   │   │   ├── entities/                 # Domain models
│   │   │   ├── middleware/               # Auth middleware (JWT, RBAC)
│   │   │   ├── validators/               # Input validation schemas
│   │   │   └── routes.ts                 # Route definitions
│   │   │
│   │   ├── booking/                      # Doctor booking system
│   │   │   ├── controllers/              # Booking endpoints
│   │   │   ├── services/                 # Booking logic (SAGA pattern)
│   │   │   ├── repositories/             # Slot & booking data access
│   │   │   ├── dto/                      # Booking DTOs
│   │   │   ├── entities/                 # Slot & consultation entities
│   │   │   ├── jobs/                     # Async jobs (reminders, expiry)
│   │   │   └── routes.ts
│   │   │
│   │   ├── consultation/                 # Consultation lifecycle
│   │   │   ├── controllers/              # Consultation endpoints
│   │   │   ├── services/                 # Consultation state management
│   │   │   ├── repositories/             # Consultation data access
│   │   │   ├── dto/                      # Consultation DTOs
│   │   │   ├── entities/                 # Consultation & prescription entities
│   │   │   └── routes.ts
│   │   │
│   │   ├── doctor/                       # Doctor management
│   │   │   ├── controllers/              # Doctor endpoints
│   │   │   ├── services/                 # Doctor search & profile
│   │   │   ├── repositories/             # Doctor data access
│   │   │   ├── dto/                      # Doctor profile DTOs
│   │   │   ├── entities/                 # Doctor entity
│   │   │   └── routes.ts
│   │   │
│   │   ├── payment/                      # Payment processing
│   │   │   ├── controllers/              # Payment endpoints
│   │   │   ├── services/                 # Payment gateway integration
│   │   │   ├── repositories/             # Payment data access
│   │   │   ├── dto/                      # Payment DTOs
│   │   │   ├── entities/                 # Payment entity
│   │   │   └── routes.ts
│   │   │
│   │   ├── admin/                        # Admin dashboard & analytics
│   │   │   ├── controllers/              # Admin endpoints
│   │   │   ├── services/                 # Analytics & audit logic
│   │   │   ├── repositories/             # Admin data queries
│   │   │   ├── dto/                      # Analytics DTOs
│   │   │   └── routes.ts
│   │   │
│   │   └── compliance/                   # Compliance & audit
│   │       ├── services/                 # Audit logging, data retention
│   │       └── entities/                 # Audit log entity
│   │
│   ├── common/                            # Shared across modules
│   │   ├── config/                       # Application configuration
│   │   │   ├── database.config.ts        # DB pool config
│   │   │   ├── redis.config.ts           # Redis config
│   │   │   ├── queue.config.ts           # Bull queue config
│   │   │   └── app.config.ts             # App settings
│   │   │
│   │   ├── middleware/                   # Express middleware
│   │   │   ├── error-handler.middleware.ts
│   │   │   ├── request-logger.middleware.ts
│   │   │   ├── rate-limiter.middleware.ts
│   │   │   ├── idempotency.middleware.ts
│   │   │   └── correlation-id.middleware.ts
│   │   │
│   │   ├── interceptors/                 # Response transformers
│   │   │   └── response-transform.interceptor.ts
│   │   │
│   │   ├── filters/                      # Exception filters
│   │   │   └── http-exception.filter.ts
│   │   │
│   │   ├── guards/                       # Authorization guards
│   │   │   ├── auth.guard.ts
│   │   │   └── role.guard.ts
│   │   │
│   │   ├── decorators/                   # Custom decorators
│   │   │   ├── roles.decorator.ts
│   │   │   ├── current-user.decorator.ts
│   │   │   └── idempotent.decorator.ts
│   │   │
│   │   ├── utils/                        # Utility functions
│   │   │   ├── encryption.util.ts        # AES-256 encryption
│   │   │   ├── hash.util.ts              # bcrypt hashing
│   │   │   ├── date.util.ts              # Date utilities
│   │   │   └── retry.util.ts             # Retry logic
│   │   │
│   │   ├── constants/                    # Application constants
│   │   │   ├── roles.constant.ts         # User roles & permissions
│   │   │   ├── error-codes.constant.ts   # Error codes
│   │   │   └── cache-keys.constant.ts    # Cache key patterns
│   │   │
│   │   ├── interfaces/                   # TypeScript interfaces
│   │   │   ├── response.interface.ts     # API response format
│   │   │   └── pagination.interface.ts   # Pagination interface
│   │   │
│   │   └── types/                        # TypeScript type definitions
│   │       └── express.d.ts              # Express type extensions
│   │
│   ├── infrastructure/                   # Infrastructure layer
│   │   ├── database/
│   │   │   ├── migrations/               # SQL migration files
│   │   │   │   ├── 001_create_users_table.sql
│   │   │   │   ├── 002_create_profiles_table.sql
│   │   │   │   ├── 003_create_doctors_table.sql
│   │   │   │   ├── 004_create_availability_slots_table.sql
│   │   │   │   ├── 005_create_consultations_table.sql
│   │   │   │   ├── 006_create_payments_table.sql
│   │   │   │   ├── 007_create_prescriptions_table.sql
│   │   │   │   ├── 008_create_audit_logs_table.sql
│   │   │   │   └── 009_create_idempotency_keys_table.sql
│   │   │   ├── seeds/                   # Seed data scripts
│   │   │   │   ├── 001_seed_roles.sql
│   │   │   │   └── 002_seed_test_doctors.sql
│   │   │   └── connection.ts             # PostgreSQL connection pool
│   │   │
│   │   ├── cache/
│   │   │   ├── redis.client.ts           # Redis client setup
│   │   │   └── cache.service.ts          # Cache operations
│   │   │
│   │   ├── queue/
│   │   │   ├── queue.client.ts           # Bull queue setup
│   │   │   └── processors/               # Job processors
│   │   │       ├── email.processor.ts
│   │   │       └── notification.processor.ts
│   │   │
│   │   └── observability/
│   │       ├── logger.ts                 # Winston logger
│   │       ├── tracer.ts                 # OpenTelemetry tracing
│   │       └── metrics.ts                # Prometheus metrics
│   │
│   ├── app.ts                            # Express app setup
│   └── server.ts                         # Server entry point
│
├── tests/                                # Test suites
│   ├── unit/                            # Unit tests
│   │   ├── auth/                        # Auth service tests
│   │   ├── booking/                     # Booking service tests
│   │   ├── consultation/                # Consultation tests
│   │   ├── doctor/                      # Doctor service tests
│   │   └── payment/                     # Payment service tests
│   │
│   ├── integration/                     # Integration tests
│   │   ├── api/                         # API endpoint tests
│   │   └── database/                    # Database transaction tests
│   │
│   ├── e2e/                             # End-to-end tests
│   │   ├── booking-flow.e2e.test.ts     # Complete booking flow
│   │   └── consultation-flow.e2e.test.ts
│   │
│   └── fixtures/                        # Test data
│       └── test-data.ts                 # Mock data generators
│
├── infrastructure/                       # Infrastructure as Code
│   ├── docker/
│   │   ├── Dockerfile                   # Production image
│   │   ├── Dockerfile.dev                # Development image
│   │   └── docker-compose.yml           # Local dev environment
│   │
│   ├── kubernetes/                      # K8s manifests
│   │   ├── deployment.yaml              # App deployment
│   │   ├── service.yaml                 # K8s service
│   │   ├── ingress.yaml                 # Ingress rules
│   │   ├── configmap.yaml               # Configuration
│   │   ├── secret.yaml                  # Secrets
│   │   └── hpa.yaml                     # Horizontal Pod Autoscaler
│   │
│   ├── terraform/                       # Terraform IaC
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   ├── outputs.tf
│   │   ├── database.tf                  # RDS setup
│   │   ├── redis.tf                     # ElastiCache setup
│   │   └── monitoring.tf                # CloudWatch setup
│   │
│   └── scripts/
│       ├── backup.sh                    # Database backup
│       ├── restore.sh                   # Database restore
│       └── deploy.sh                    # Deployment script
│
├── docs/                                 # Documentation
│   ├── architecture.md                  # System architecture
│   ├── api-spec.yaml                    # OpenAPI specification
│   ├── database-schema.md                # Database documentation
│   ├── security-threat-model.md         # Security & threats
│   ├── deployment-guide.md              # Deployment steps
│   └── runbook.md                       # Operational runbook
│
├── .github/
│   └── workflows/                       # GitHub Actions CI/CD
│       ├── ci.yml                       # Continuous integration
│       ├── cd.yml                       # Continuous deployment
│       └── security-scan.yml            # Security scanning
│
├── .env.example                         # Environment template
├── .gitignore                           # Git ignore rules
├── .eslintrc.js                         # ESLint config
├── .prettierrc                          # Prettier config
├── tsconfig.json                        # TypeScript config
├── jest.config.js                       # Jest test config
├── package.json                         # Dependencies
├── package-lock.json                    # Locked versions
├── README.md                            # Project overview
├── plan.md                              # Project plan
├── implementation.md                    # Implementation guide
└── FOLDER_STRUCTURE.md                  # This file
```

---

## Directory Summary

### Modules (Feature-Based Organization)
| Module | Purpose |
|--------|---------|
| **auth** | User registration, login, JWT, MFA, RBAC |
| **booking** | Doctor availability, slot booking, cancellation |
| **consultation** | Consultation lifecycle, state management |
| **doctor** | Doctor profiles, search, verification |
| **payment** | Payment processing, gateway integration |
| **admin** | Analytics, user management, audit |
| **compliance** | Audit logging, data retention |

### Common (Cross-Cutting Concerns)
- Config: Application configuration management
- Middleware: Request/response processing
- Guards: Authorization checks
- Utils: Reusable functions
- Constants: Application constants
- Interfaces: TypeScript contracts

### Infrastructure
- **Database**: PostgreSQL connection, migrations, seeds
- **Cache**: Redis client and cache operations
- **Queue**: Bull job queue and processors
- **Observability**: Logging, tracing, metrics

### Testing
- **Unit**: Service and utility tests
- **Integration**: API and database tests
- **E2E**: Complete flow testing
- **Fixtures**: Test data generators

### Infrastructure as Code
- Docker: Containerization
- Kubernetes: Container orchestration
- Terraform: Cloud infrastructure
- Scripts: Deployment automation

### Documentation
- Architecture: System design
- API Spec: OpenAPI documentation
- Database: Schema documentation
- Security: Threat model
- Deployment: Setup guides

---

## File Naming Conventions

### Controllers
- `*.controller.ts` - HTTP request handlers
- Example: `auth.controller.ts`

### Services
- `*.service.ts` - Business logic
- Example: `auth.service.ts`, `slot-lock.service.ts`

### Repositories
- `*.repository.ts` - Data access layer
- Example: `user.repository.ts`, `booking.repository.ts`

### DTOs
- `*.dto.ts` - Data transfer objects
- Example: `register.dto.ts`, `login.dto.ts`

### Entities
- `*.entity.ts` - Domain models
- Example: `user.entity.ts`, `consultation.entity.ts`

### Middleware
- `*.middleware.ts` - Express middleware
- Example: `auth.middleware.ts`, `error-handler.middleware.ts`

### Tests
- `*.test.ts` or `*.spec.ts` - Test files
- Example: `auth.service.test.ts`, `booking-flow.e2e.test.ts`

### SQL
- `NNN_description.sql` - Numbered migrations
- Example: `001_create_users_table.sql`

### Configuration
- `*.config.ts` - Configuration files
- `*.yaml` or `*.yml` - YAML configs
- `.env*` - Environment files

---

## Total Structure Statistics

| Category | Count |
|----------|-------|
| **Modules** | 7 |
| **Common Directories** | 10 |
| **Infrastructure Dirs** | 4 |
| **Test Directories** | 5 |
| **Total Directories** | ~70+ |
| **IaC Directories** | 4 |
| **Documentation Files** | 6+ |

---

## How to Use This Structure

### For Development
1. Navigate to specific module directory
2. Follow the pattern: Controller → Service → Repository
3. Add DTOs for request/response validation
4. Create entities for domain models
5. Write tests alongside code

### For Adding New Features
1. Create new module under `src/modules/`
2. Follow the same structure (controllers, services, repos, etc.)
3. Create routes file
4. Update `src/app.ts` to include new routes
5. Add tests in `tests/unit/`

### For Infrastructure Changes
1. Update migration in `src/infrastructure/database/migrations/`
2. Update seed data if needed
3. Update Terraform files if cloud resources change
4. Update Kubernetes manifests for orchestration

### For Deployments
1. Use Docker images with `infrastructure/docker/`
2. Deploy with Kubernetes manifests
3. Provision infrastructure with Terraform
4. Follow runbook in `docs/`

---

## Next Steps

✅ **Folder structure is ready**

You can now:
1. Initialize git repository
2. Create package.json with dependencies
3. Set up configuration files
4. Start implementing Phase 0 of development

Ready to proceed with Phase 0 setup? 🚀
