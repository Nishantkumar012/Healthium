import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/services/query-client'
import { AuthProvider } from '@/providers/AuthProvider'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import { MainLayout } from '@/layouts/MainLayout'
import { AuthLayout } from '@/layouts/AuthLayout'

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'

// Patient pages
import { DashboardPage } from '@/pages/patient/DashboardPage'
import { BookConsultationPage } from '@/pages/patient/BookConsultationPage'
import { MyConsultationsPage } from '@/pages/patient/MyConsultationsPage'
import { ConsultationDetailPage } from '@/pages/patient/ConsultationDetailPage'
import { PrescriptionsPage } from '@/pages/patient/PrescriptionsPage'

// Doctor pages
import { DoctorDashboardPage } from '@/pages/doctor/DoctorDashboardPage'
import { ManageAvailabilityPage } from '@/pages/doctor/ManageAvailabilityPage'
import { DoctorConsultationsPage } from '@/pages/doctor/DoctorConsultationsPage'

// Admin pages
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { UsersManagementPage } from '@/pages/admin/UsersManagementPage'
import { AnalyticsPage } from '@/pages/admin/AnalyticsPage'

// Common pages
import { ProfilePage } from '@/pages/ProfilePage'
import { NotFoundPage } from '@/pages/NotFoundPage'

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            {/* Auth Routes */}
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Patient Routes */}
            <Route element={<ProtectedRoute roles={['patient']} />}>
              <Route element={<MainLayout />}>
                <Route path="/patient/dashboard" element={<DashboardPage />} />
                <Route path="/patient/book" element={<BookConsultationPage />} />
                <Route path="/patient/consultations" element={<MyConsultationsPage />} />
                <Route path="/patient/consultations/:id" element={<ConsultationDetailPage />} />
                <Route path="/patient/prescriptions" element={<PrescriptionsPage />} />
              </Route>
            </Route>

            {/* Doctor Routes */}
            <Route element={<ProtectedRoute roles={['doctor']} />}>
              <Route element={<MainLayout />}>
                <Route path="/doctor/dashboard" element={<DoctorDashboardPage />} />
                <Route path="/doctor/availability" element={<ManageAvailabilityPage />} />
                <Route path="/doctor/consultations" element={<DoctorConsultationsPage />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<ProtectedRoute roles={['admin']} />}>
              <Route element={<MainLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
                <Route path="/admin/users" element={<UsersManagementPage />} />
                <Route path="/admin/analytics" element={<AnalyticsPage />} />
              </Route>
            </Route>

            {/* Common Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<MainLayout />}>
                <Route path="/profile" element={<ProfilePage />} />
              </Route>
            </Route>

            {/* Redirect root */}
            <Route path="/" element={<Navigate to="/patient/dashboard" replace />} />

            {/* 404 */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Router>
        <Toaster position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  )
}
