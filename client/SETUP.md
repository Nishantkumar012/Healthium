# Healthum Client Installation & Setup

## Quick Start

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Create Environment File**
   ```bash
   cp .env.example .env.local
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Open in Browser**
   ```
   http://localhost:5173
   ```

## Backend Integration

The client is configured to proxy API requests to the backend:

- Backend URL: `http://localhost:3000/api/v1`
- Client automatically handles:
  - JWT token injection
  - Token refresh on expiry
  - Error handling and logging
  - Request cancellation on unmount

## Project Structure

```
client/
├── src/
│   ├── components/        # Reusable components
│   ├── pages/            # Page components
│   ├── layouts/          # Layout components
│   ├── hooks/            # Custom hooks
│   ├── services/         # API & services
│   ├── stores/           # Zustand stores
│   ├── types/            # TypeScript types
│   ├── utils/            # Utilities
│   ├── constants/        # Constants
│   ├── providers/        # Context providers
│   ├── App.tsx          # Root component
│   ├── main.tsx         # Entry point
│   └── index.css        # Tailwind CSS
├── vite.config.ts       # Vite config
├── tailwind.config.ts   # Tailwind config
├── tsconfig.json        # TypeScript config
└── package.json         # Dependencies
```

## Key Technologies

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 18.3+ | UI library |
| TypeScript | 5.6+ | Type safety |
| Vite | 5.4+ | Build tool |
| Tailwind CSS | 4.0+ | Styling |
| React Router | 6.28+ | Navigation |
| Axios | 1.7+ | HTTP client |
| Zustand | 4.5+ | State management |
| TanStack Query | 5.59+ | Data fetching |
| React Hook Form | 7.52+ | Form handling |
| Zod | 3.23+ | Validation |

## Development Workflow

### Running the Client

```bash
# Development
npm run dev

# Production build
npm run build

# Preview build
npm run preview
```

### Code Quality

```bash
# Linting
npm run lint

# Type checking
npm run type-check

# Formatting
npm run format
```

### Testing

```bash
# Run tests
npm run test

# Watch mode
npm run test:watch

# With UI
npm run test:ui

# Coverage
npm run test:coverage
```

## Environment Variables

Create `.env.local`:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api/v1

# App Configuration
VITE_APP_NAME=Healthum
VITE_APP_VERSION=1.0.0
```

## Authentication Flow

1. User logs in with email/password
2. Backend returns JWT access token + refresh token
3. Client stores tokens in cookies
4. API client automatically injects token in requests
5. On token expiry, client attempts refresh
6. If refresh fails, user is redirected to login

## Pages & Routes

### Public Routes
- `/login` - User login
- `/register` - User registration

### Protected Routes (All authenticated users)
- `/profile` - User profile

### Patient Routes
- `/patient/dashboard` - Patient dashboard
- `/patient/book` - Book consultation
- `/patient/consultations` - View consultations
- `/patient/consultations/:id` - Consultation details
- `/patient/prescriptions` - View prescriptions

### Doctor Routes
- `/doctor/dashboard` - Doctor dashboard
- `/doctor/availability` - Manage availability
- `/doctor/consultations` - View consultations

### Admin Routes
- `/admin/dashboard` - Admin dashboard
- `/admin/users` - Manage users
- `/admin/analytics` - View analytics

## API Integration

All API calls use the centralized `apiClient` from `@/services/api-client`:

```typescript
import apiClient from '@/services/api-client'
import { useQuery, useMutation } from '@tanstack/react-query'

// Fetch data
const { data, isLoading } = useQuery({
  queryKey: ['consultations'],
  queryFn: () => apiClient.get('/consultations')
})

// Mutation
const mutation = useMutation({
  mutationFn: (data) => apiClient.post('/consultations', data)
})
```

## State Management

### Auth State (Zustand)
```typescript
import { useAuthStore } from '@/stores/auth.store'

const { user, isAuthenticated, logout } = useAuthStore()
```

### Server State (TanStack Query)
```typescript
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery(...)
```

## Form Handling

Using React Hook Form + Zod:

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
})

const form = useForm({
  resolver: zodResolver(schema)
})
```

## Component Conventions

- Functional components with TypeScript
- Props interface: `interface ComponentProps { ... }`
- Export: `export function ComponentName() { ... }`
- Styling: Tailwind CSS classes via `cn()` utility
- Icons: Lucide React icons

## Build & Deployment

### Production Build

```bash
npm run build
```

Creates optimized build in `dist/` directory.

### Deployment

The `dist/` folder can be deployed to:
- Vercel
- Netlify
- AWS S3 + CloudFront
- Docker container
- Any static hosting service

## Troubleshooting

### Port Already in Use
```bash
# Change port in vite.config.ts server.port
npm run dev -- --port 3001
```

### CORS Issues
Configured proxy in `vite.config.ts` forwards `/api` requests to backend.

### Token Expiry Issues
The `apiClient` automatically handles token refresh. Check localStorage for tokens.

### Module Resolution Issues
Check `tsconfig.json` path aliases match imports.

## Performance Tips

1. Use React Router lazy loading
2. Implement code splitting
3. Memoize expensive computations
4. Use TanStack Query caching
5. Optimize images
6. Monitor bundle size with `npm run build -- --analyze`

## Security Best Practices

1. Tokens stored in httpOnly cookies (server-set)
2. CORS configured for backend domain
3. Never log sensitive data
4. Validate all user inputs with Zod
5. Use environment variables for API endpoints
6. Keep dependencies updated

## Contributing

1. Follow TypeScript strict mode
2. Use consistent naming conventions
3. Add comments for complex logic
4. Test changes locally
5. Follow project structure

## Support

For issues or questions:
1. Check existing GitHub issues
2. Review error logs
3. Check backend logs
4. Contact development team

---

**Client ready for development!** 🚀
