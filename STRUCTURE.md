# Healthum Telemedicine - Complete Project Structure

## Root Directory Layout

```
healthum/
├── backend/                              # Backend services (Node.js + Express)
│   ├── src/
│   │   ├── modules/                     # Feature modules
│   │   │   ├── auth/
│   │   │   ├── booking/
│   │   │   ├── consultation/
│   │   │   ├── doctor/
│   │   │   ├── payment/
│   │   │   ├── admin/
│   │   │   └── compliance/
│   │   ├── common/                      # Shared utilities
│   │   │   ├── config/
│   │   │   ├── middleware/
│   │   │   ├── guards/
│   │   │   ├── utils/
│   │   │   ├── constants/
│   │   │   └── interfaces/
│   │   ├── infrastructure/               # Infrastructure layer
│   │   │   ├── database/
│   │   │   ├── cache/
│   │   │   ├── queue/
│   │   │   └── observability/
│   │   ├── app.ts
│   │   └── server.ts
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   ├── infrastructure/
│   │   ├── docker/
│   │   ├── kubernetes/
│   │   ├── terraform/
│   │   └── scripts/
│   ├── docs/
│   │   ├── architecture.md
│   │   ├── api-spec.yaml
│   │   ├── database-schema.md
│   │   ├── security-threat-model.md
│   │   └── deployment-guide.md
│   ├── .env.example
│   ├── .gitignore
│   ├── .eslintrc.js
│   ├── tsconfig.json
│   ├── jest.config.js
│   ├── package.json
│   ├── package-lock.json
│   ├── .github/
│   │   └── workflows/
│   │       ├── ci.yml
│   │       ├── cd.yml
│   │       └── security-scan.yml
│   ├── README.md
│   ├── plan.md
│   ├── implementation.md
│   └── FOLDER_STRUCTURE.md
│
├── client/                               # Frontend application (React/Next.js)
│   ├── src/
│   │   ├── components/                  # Reusable React components
│   │   │   ├── auth/                   # Auth components
│   │   │   ├── booking/                # Booking components
│   │   │   ├── consultation/           # Consultation components
│   │   │   ├── doctor/                 # Doctor components
│   │   │   ├── common/                 # Common/shared components
│   │   │   │   ├── Button/
│   │   │   │   ├── Card/
│   │   │   │   ├── Modal/
│   │   │   │   ├── Header/
│   │   │   │   ├── Sidebar/
│   │   │   │   └── Footer/
│   │   │   └── layouts/
│   │   │
│   │   ├── pages/                      # Page components
│   │   │   ├── auth/
│   │   │   │   ├── login.tsx
│   │   │   │   ├── register.tsx
│   │   │   │   └── forgot-password.tsx
│   │   │   ├── dashboard/
│   │   │   │   ├── patient-dashboard.tsx
│   │   │   │   ├── doctor-dashboard.tsx
│   │   │   │   └── admin-dashboard.tsx
│   │   │   ├── booking/
│   │   │   │   ├── search-doctors.tsx
│   │   │   │   └── book-consultation.tsx
│   │   │   ├── consultation/
│   │   │   │   ├── consultation-list.tsx
│   │   │   │   └── consultation-detail.tsx
│   │   │   ├── profile/
│   │   │   │   ├── patient-profile.tsx
│   │   │   │   └── doctor-profile.tsx
│   │   │   └── 404.tsx
│   │   │
│   │   ├── layouts/                    # Layout wrappers
│   │   │   ├── MainLayout.tsx
│   │   │   ├── AuthLayout.tsx
│   │   │   ├── DashboardLayout.tsx
│   │   │   └── AdminLayout.tsx
│   │   │
│   │   ├── hooks/                      # Custom React hooks
│   │   │   ├── useAuth.ts
│   │   │   ├── useBooking.ts
│   │   │   ├── useConsultation.ts
│   │   │   ├── useFetch.ts
│   │   │   └── useLocalStorage.ts
│   │   │
│   │   ├── services/                   # API services
│   │   │   ├── api.client.ts           # Axios instance
│   │   │   ├── auth.service.ts
│   │   │   ├── booking.service.ts
│   │   │   ├── consultation.service.ts
│   │   │   ├── doctor.service.ts
│   │   │   ├── payment.service.ts
│   │   │   └── admin.service.ts
│   │   │
│   │   ├── store/                      # State management (Redux/Zustand)
│   │   │   ├── slices/
│   │   │   │   ├── authSlice.ts
│   │   │   │   ├── bookingSlice.ts
│   │   │   │   └── consultationSlice.ts
│   │   │   ├── actions/
│   │   │   ├── selectors/
│   │   │   └── store.ts
│   │   │
│   │   ├── utils/                      # Utility functions
│   │   │   ├── validators.ts
│   │   │   ├── formatters.ts
│   │   │   ├── date.ts
│   │   │   ├── error-handler.ts
│   │   │   └── helpers.ts
│   │   │
│   │   ├── constants/                  # Application constants
│   │   │   ├── api.constants.ts
│   │   │   ├── routes.constants.ts
│   │   │   ├── messages.constants.ts
│   │   │   └── config.constants.ts
│   │   │
│   │   ├── types/                      # TypeScript type definitions
│   │   │   ├── auth.types.ts
│   │   │   ├── booking.types.ts
│   │   │   ├── consultation.types.ts
│   │   │   ├── doctor.types.ts
│   │   │   ├── api.types.ts
│   │   │   └── common.types.ts
│   │   │
│   │   ├── assets/                     # Static assets
│   │   │   ├── images/
│   │   │   │   ├── logo.svg
│   │   │   │   ├── hero/
│   │   │   │   └── illustrations/
│   │   │   ├── fonts/
│   │   │   ├── icons/
│   │   │   └── animations/
│   │   │
│   │   ├── styles/                     # Global styles
│   │   │   ├── globals.css
│   │   │   ├── variables.css
│   │   │   ├── tailwind.css
│   │   │   └── themes/
│   │   │       ├── light.css
│   │   │       └── dark.css
│   │   │
│   │   ├── App.tsx                     # Root component
│   │   ├── index.tsx                   # Entry point
│   │   └── router.tsx                  # Route configuration
│   │
│   ├── public/                          # Static files
│   │   ├── index.html
│   │   ├── favicon.ico
│   │   └── manifest.json
│   │
│   ├── tests/                           # Test files
│   │   ├── unit/
│   │   │   ├── components/
│   │   │   ├── hooks/
│   │   │   ├── services/
│   │   │   └── utils/
│   │   ├── integration/
│   │   ├── e2e/
│   │   └── fixtures/
│   │
│   ├── .github/
│   │   └── workflows/
│   │       ├── ci.yml
│   │       └── deploy.yml
│   │
│   ├── .env.example
│   ├── .env.local
│   ├── .gitignore
│   ├── .eslintrc.json
│   ├── .prettierrc
│   ├── tailwind.config.js               # Tailwind CSS config
│   ├── tsconfig.json
│   ├── next.config.js or vite.config.ts
│   ├── jest.config.js
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── docs/
│       ├── SETUP.md
│       ├── COMPONENTS.md
│       ├── API_INTEGRATION.md
│       └── DEPLOYMENT.md
│
├── shared/                              # Shared utilities (optional)
│   ├── types/                          # Shared type definitions
│   │   ├── api.types.ts
│   │   └── common.types.ts
│   ├── constants/                      # Shared constants
│   ├── utils/                          # Shared utilities
│   └── package.json
│
├── docs/                                # Root documentation
│   ├── README.md
│   ├── ARCHITECTURE.md
│   ├── GETTING_STARTED.md
│   ├── CONTRIBUTION.md
│   └── DEPLOYMENT.md
│
├── .gitignore                           # Root gitignore
├── .dockerignore                        # Docker ignore
├── docker-compose.yml                   # Full stack docker compose
├── README.md                            # Root README
└── STRUCTURE.md                         # This file
```

---

## Backend Folder Structure Details

### `/backend/src/modules/`
7 feature modules following DDD principles:
- **auth**: Authentication, JWT, MFA, RBAC
- **booking**: Doctor availability, slot booking
- **consultation**: Consultation lifecycle
- **doctor**: Doctor profiles, search
- **payment**: Payment processing
- **admin**: Analytics, dashboards
- **compliance**: Audit logging

### `/backend/src/common/`
Shared utilities across modules:
- **config**: Database, Redis, queue configs
- **middleware**: Error handling, logging, CORS
- **guards**: Authorization checks
- **utils**: Encryption, hashing, date utilities
- **constants**: Roles, permissions, error codes
- **interfaces**: TypeScript contracts

### `/backend/src/infrastructure/`
Infrastructure layer:
- **database**: PostgreSQL migrations, seeds, connection pool
- **cache**: Redis client, cache service
- **queue**: Bull job queue, processors
- **observability**: Logger, tracer, metrics

### `/backend/tests/`
Test suites:
- **unit**: Service and utility tests
- **integration**: API and database tests
- **e2e**: Complete flow testing

### `/backend/infrastructure/`
Infrastructure as Code:
- **docker**: Dockerfile, docker-compose
- **kubernetes**: K8s manifests
- **terraform**: Cloud infrastructure
- **scripts**: Deployment automation

---

## Frontend Folder Structure Details

### `/client/src/components/`
Reusable React components organized by feature:
- **auth**: Login, Register, MFA components
- **booking**: Search, booking, slot selection
- **consultation**: Consultation list, detail
- **doctor**: Doctor profile, list
- **common**: Shared UI components (Button, Card, Modal, etc.)

### `/client/src/pages/`
Page-level components:
- **auth**: Login, register, forgot password pages
- **dashboard**: Patient, doctor, admin dashboards
- **booking**: Search and book consultation
- **consultation**: View and manage consultations
- **profile**: User profile management

### `/client/src/layouts/`
Layout wrappers:
- **MainLayout**: Default app layout
- **AuthLayout**: Minimal auth page layout
- **DashboardLayout**: Dashboard with sidebar
- **AdminLayout**: Admin panel layout

### `/client/src/hooks/`
Custom React hooks:
- `useAuth`: Authentication state
- `useBooking`: Booking operations
- `useConsultation`: Consultation operations
- `useFetch`: API data fetching
- `useLocalStorage`: Local storage management

### `/client/src/services/`
API service layer:
- `api.client.ts`: Configured Axios instance
- `auth.service.ts`: Auth API calls
- `booking.service.ts`: Booking operations
- `consultation.service.ts`: Consultation operations
- etc.

### `/client/src/store/`
State management (Redux or Zustand):
- **slices**: Redux slices (auth, booking, etc.)
- **actions**: Action creators
- **selectors**: State selectors
- `store.ts`: Store configuration

### `/client/src/types/`
TypeScript type definitions:
- `auth.types.ts`: Auth types
- `booking.types.ts`: Booking types
- `api.types.ts`: API response types
- `common.types.ts`: Common types

### `/client/src/utils/`
Utility functions:
- `validators.ts`: Form validators
- `formatters.ts`: Data formatters
- `date.ts`: Date utilities
- `error-handler.ts`: Error handling
- `helpers.ts`: Helper functions

### `/client/src/assets/`
Static assets:
- **images**: Logo, illustrations, backgrounds
- **fonts**: Custom fonts
- **icons**: SVG icons
- **animations**: Animation files

### `/client/src/styles/`
Global styles:
- `globals.css`: Global styles
- `variables.css`: CSS variables
- `tailwind.css`: Tailwind directives
- **themes**: Dark/light mode themes

---

## Tech Stack Summary

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Node.js 20+ |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| Cache | Redis |
| Job Queue | Bull |
| Testing | Jest |
| Containerization | Docker |

### Frontend
| Layer | Technology |
|-------|-----------|
| Framework | React 18+ or Next.js 14+ |
| Language | TypeScript |
| Styling | Tailwind CSS |
| State Management | Redux or Zustand |
| HTTP Client | Axios |
| Testing | Jest, React Testing Library |
| Build Tool | Vite or Webpack |
| Containerization | Docker |

### Shared
| Aspect | Tools |
|--------|-------|
| Monorepo | npm workspaces or Lerna |
| Version Control | Git |
| CI/CD | GitHub Actions |
| IaC | Terraform |
| Orchestration | Kubernetes |

---

## Development Workflow

### Backend Development
```
backend/
├── Make code changes
├── Run tests: npm test
├── Check types: npm run type-check
├── Lint: npm run lint
└── Commit: git commit
```

### Frontend Development
```
client/
├── Make code changes
├── Run dev server: npm run dev
├── Run tests: npm test
├── Check types: npm run type-check
├── Lint: npm run lint
└── Commit: git commit
```

### Docker Development
```
docker-compose up -d      # Start all services
docker-compose logs -f    # View logs
docker-compose down       # Stop services
```

---

## Project Initialization Steps

### 1. Backend Setup
```bash
cd backend
npm init -y
npm install express typescript pg redis ioredis bull winston
npm install -D @types/node @types/express jest ts-jest
```

### 2. Frontend Setup
```bash
cd client
npm create vite@latest . -- --template react-ts
# OR
npx create-next-app@latest .
npm install axios zustand
npm install -D tailwindcss postcss autoprefixer
```

### 3. Root Setup
```bash
npm init -y
# Configure monorepo if needed
```

---

## Git Structure

### Branches
- `main`: Production-ready code
- `develop`: Development branch
- `feature/`: Feature branches
- `bugfix/`: Bug fix branches

### Commits
Both backend and frontend should be committed together:
```
git add backend/ client/
git commit -m "feat: add new feature"
```

---

## Environment Variables

### Backend (`.env`)
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...
```

### Frontend (`.env.local`)
```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_APP_NAME=Healthum
```

---

## Project Statistics

| Item | Count |
|------|-------|
| **Backend Modules** | 7 |
| **Frontend Pages** | 10+ |
| **Common Components** | 15+ |
| **API Services** | 7 |
| **Custom Hooks** | 5+ |
| **Test Suites** | 3 (Unit, Integration, E2E) |
| **IaC Directories** | 4 |
| **Documentation Files** | 10+ |

---

## Next Steps

✅ **Folder structure is ready!**

You can now:
1. Initialize backend with `npm init`
2. Initialize frontend with Vite or Next.js
3. Setup git repository
4. Create initial configuration files
5. Start implementing Phase 0

**Ready to proceed?** 🚀
