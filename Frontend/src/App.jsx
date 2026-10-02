import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { OAuthCallbackPage } from '@/features/auth/pages/OAuthCallbackPage'
import { AppShell } from '@/components/layout/AppShell'
import { ProtectedRoute } from '@/components/layout/ProtectedRoute'
import { RoleGuard } from '@/components/layout/RoleGuard'

// Patient Pages
import { PatientDashboard } from '@/features/patient/pages/PatientDashboard'
import { BookAppointmentPage } from '@/features/patient/pages/BookAppointmentPage'
import { MyAppointmentsPage } from '@/features/patient/pages/MyAppointmentsPage'
import { MedicalRecordsPage } from '@/features/patient/pages/MedicalRecordsPage'
import { BillsPage } from '@/features/patient/pages/BillsPage'
import { InsurancePage } from '@/features/patient/pages/InsurancePage'
import { PatientProfilePage } from '@/features/patient/pages/PatientProfilePage'

// Doctor Pages
import { DoctorDashboard } from '@/features/doctor/pages/DoctorDashboard'
import { DoctorAppointmentsPage } from '@/features/doctor/pages/DoctorAppointmentsPage'
import { DoctorAvailabilityPage } from '@/features/doctor/pages/DoctorAvailabilityPage'
import { DoctorPatientsPage } from '@/features/doctor/pages/DoctorPatientsPage'

// Admin Pages
import { AdminDashboard } from '@/features/admin/pages/AdminDashboard'
import { DoctorManagementPage } from '@/features/admin/pages/DoctorManagementPage'
import { PatientDirectoryPage } from '@/features/admin/pages/PatientDirectoryPage'
import { DepartmentManagementPage } from '@/features/admin/pages/DepartmentManagementPage'
import { AllAppointmentsPage } from '@/features/admin/pages/AllAppointmentsPage'
import { AdminBillingPage } from '@/features/admin/pages/AdminBillingPage'
import { UserAccessControlPage } from '@/features/admin/pages/UserAccessControlPage'

import { NotFoundPage } from '@/features/misc/NotFoundPage'
import { ErrorBoundary } from '@/components/shared/ErrorBoundary'

export default function App() {
  return (
    <ErrorBoundary>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/oauth-callback" element={<OAuthCallbackPage />} />
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Patient Portal */}
        <Route
          path="/patient"
          element={
            <ProtectedRoute>
              <RoleGuard role="PATIENT">
                <AppShell />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/patient/dashboard" replace />} />
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="book" element={<BookAppointmentPage />} />
          <Route path="appointments" element={<MyAppointmentsPage />} />
          <Route path="records" element={<MedicalRecordsPage />} />
          <Route path="bills" element={<BillsPage />} />
          <Route path="insurance" element={<InsurancePage />} />
          <Route path="profile" element={<PatientProfilePage />} />
          <Route path="*" element={<Navigate to="/patient/dashboard" replace />} />
        </Route>

        {/* Doctor Portal */}
        <Route
          path="/doctor"
          element={
            <ProtectedRoute>
              <RoleGuard role="DOCTOR">
                <AppShell />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/doctor/dashboard" replace />} />
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointments" element={<DoctorAppointmentsPage />} />
          <Route path="availability" element={<DoctorAvailabilityPage />} />
          <Route path="patients" element={<DoctorPatientsPage />} />
          <Route path="*" element={<Navigate to="/doctor/dashboard" replace />} />
        </Route>

        {/* Admin Portal */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <RoleGuard role="ADMIN">
                <AppShell />
              </RoleGuard>
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="doctors" element={<DoctorManagementPage />} />
          <Route path="patients" element={<PatientDirectoryPage />} />
          <Route path="departments" element={<DepartmentManagementPage />} />
          <Route path="appointments" element={<AllAppointmentsPage />} />
          <Route path="bills" element={<AdminBillingPage />} />
          <Route path="users" element={<UserAccessControlPage />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/* 404 Catch-All */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </ErrorBoundary>
  )
}
