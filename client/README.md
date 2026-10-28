# Healthum Client

React + TypeScript + Vite + Tailwind CSS frontend for the Healthum telemedicine platform.

## Features

- ✅ React 18 with TypeScript
- ✅ Vite for fast development
- ✅ Tailwind CSS v4 with @tailwindcss/vite
- ✅ React Router for navigation
- ✅ TanStack Query for data fetching
- ✅ Zustand for state management
- ✅ React Hook Form + Zod for form validation
- ✅ Axios for API calls
- ✅ React Hot Toast for notifications
- ✅ Recharts for analytics
- ✅ Lucide React for icons

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
VITE_API_URL=http://localhost:3000/api/v1
```

### Development

```bash
npm run dev
```

The client will run on `http://localhost:5173`

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # Reusable UI components
├── pages/              # Page components
├── layouts/            # Layout components
├── hooks/              # Custom React hooks
├── services/           # API services
├── stores/             # Zustand stores
├── types/              # TypeScript types
├── utils/              # Utility functions
├── constants/          # Constants
├── providers/          # Context providers
├── App.tsx             # Root component
└── main.tsx            # Entry point
```

## Key Features

### Authentication
- JWT-based authentication
- Token refresh mechanism
- Protected routes with role-based access
- Persistent auth state with Zustand

### API Integration
- Axios client with interceptors
- Automatic token injection
- Error handling and retry logic
- TanStack Query for caching and syncing

### State Management
- Zustand for auth state
- TanStack Query for server state
- Local component state with React hooks

### Form Handling
- React Hook Form for performance
- Zod for type-safe validation
- Custom form components

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types
- `npm run test` - Run tests with Vitest
- `npm run test:ui` - Run tests with UI
- `npm run test:coverage` - Generate coverage report

## Component Structure

### Pages
- **Auth**: Login, Register
- **Patient**: Dashboard, Book Consultation, My Consultations, Prescriptions
- **Doctor**: Dashboard, Manage Availability, Consultations
- **Admin**: Dashboard, Users Management, Analytics

### Layouts
- **AuthLayout**: For authentication pages
- **MainLayout**: For app pages with sidebar and navbar

### Components
- **ProtectedRoute**: Route protection based on roles
- **Navbar**: Top navigation bar
- **Sidebar**: Side navigation menu
- **ProtectedRoute**: Authentication guard

## API Integration

All API calls go through the centralized `apiClient`:

```typescript
import { apiClient } from '@/services/api-client'

// GET request
const response = await apiClient.get('/users')

// POST request
const response = await apiClient.post('/auth/login', { email, password })

// Automatic token injection
// Automatic error handling
// Automatic token refresh
```

## Performance Optimization

- Code splitting with React Router
- Image optimization
- Bundle size analysis
- Lazy loading routes
- Memoization of components
- Query caching with TanStack Query

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## License

MIT
