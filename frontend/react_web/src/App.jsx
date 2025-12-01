import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import NavBar from './components/NavBar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/dashboard/AdminDashboard';
import DoctorDashboard from './pages/dashboard/DoctorDashboard';
import StaffDashboard from './pages/dashboard/StaffDashboard';
import PatientDashboard from './pages/dashboard/PatientDashboard';

import PatientListPage from './pages/PatientListPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AppointmentManagementPage from './pages/AppointmentManagementPage';
import DicomViewerPage from './pages/DicomViewerPage';
import DiagnosisDetailPage from './pages/DiagnosisDetailPage';
import AboutPage from './pages/AboutPage';
import SOAPChartPage from './pages/SOAPChartPage';
import PrescriptionManagementPage from './pages/PrescriptionManagementPage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import CDSSPage from './pages/CDSSPage';

// Protected Route Component
function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user has required role (Case Insensitive)
  if (roles.length > 0) {
    const userRole = user?.role?.toUpperCase();
    const requiredRoles = roles.map(r => r.toUpperCase());

    if (!requiredRoles.includes(userRole)) {
      console.log(`Access denied. User role: ${userRole}, Required: ${requiredRoles}`);
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
}

// Dashboard Redirect Component
function DashboardRedirect() {
  const { user, loading } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  const role = user.role?.toUpperCase();
  console.log('Redirecting based on role:', role);

  switch (role) {
    case 'ADMIN': return <Navigate to="/admin/dashboard" replace />;
    case 'DOCTOR': return <Navigate to="/doctor/dashboard" replace />;
    case 'NURSE': return <Navigate to="/staff/dashboard" replace />;
    case 'PATIENT': return <Navigate to="/patient/dashboard" replace />;
    default:
      console.warn('Unknown role:', role);
      return <div>Unknown Role: {user.role}</div>;
  }
}

function App() {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <NavBar />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={
          isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />
        } />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/about" element={<AboutPage />} />

        {/* Dashboard Routing */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Role-Based Dashboards */}
        <Route path="/admin/dashboard" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminDashboard />
          </ProtectedRoute>
        } />

        <Route path="/doctor/dashboard" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <DoctorDashboard />
          </ProtectedRoute>
        } />

        <Route path="/staff/dashboard" element={
          <ProtectedRoute roles={['NURSE', 'ADMIN']}>
            <StaffDashboard />
          </ProtectedRoute>
        } />

        <Route path="/patient/dashboard" element={
          <ProtectedRoute roles={['PATIENT', 'ADMIN']}>
            <PatientDashboard />
          </ProtectedRoute>
        } />

        {/* Feature Routes */}
        <Route path="/patients" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN', 'NURSE']}>
            <PatientListPage />
          </ProtectedRoute>
        } />

        <Route path="/patients/:id" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN', 'NURSE']}>
            <PatientDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/appointments" element={
          <ProtectedRoute>
            <AppointmentManagementPage />
          </ProtectedRoute>
        } />

        <Route path="/dicom/:studyId" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <DicomViewerPage />
          </ProtectedRoute>
        } />

        <Route path="/diagnosis/:id" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <DiagnosisDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/soap/:encounterId" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <SOAPChartPage />
          </ProtectedRoute>
        } />

        <Route path="/prescriptions" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <PrescriptionManagementPage />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationCenterPage />
          </ProtectedRoute>
        } />

        <Route path="/doctor/cdss" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <CDSSPage />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;
