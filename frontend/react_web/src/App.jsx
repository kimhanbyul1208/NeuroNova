import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './auth/AuthContext';
import NavBar from './components/NavBar';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PatientListPage from './pages/PatientListPage';
import PatientDetailPage from './pages/PatientDetailPage';
import AppointmentManagementPage from './pages/AppointmentManagementPage';
import DicomViewerPage from './pages/DicomViewerPage';
import DiagnosisDetailPage from './pages/DiagnosisDetailPage';
import AboutPage from './pages/AboutPage';
import SOAPChartPage from './pages/SOAPChartPage';
import PrescriptionManagementPage from './pages/PrescriptionManagementPage';
import NotificationCenterPage from './pages/NotificationCenterPage';

// Protected Route Component
function ProtectedRoute({ children, roles = [] }) {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If roles are specified, check if user has required role
  if (roles.length > 0 && !roles.includes(user?.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
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

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } />

        <Route path="/patients" element={
          <ProtectedRoute roles={['doctor', 'admin']}>
            <PatientListPage />
          </ProtectedRoute>
        } />

        <Route path="/patients/:id" element={
          <ProtectedRoute roles={['doctor', 'admin']}>
            <PatientDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/appointments" element={
          <ProtectedRoute>
            <AppointmentManagementPage />
          </ProtectedRoute>
        } />

        <Route path="/dicom/:studyId" element={
          <ProtectedRoute roles={['doctor', 'admin']}>
            <DicomViewerPage />
          </ProtectedRoute>
        } />

        <Route path="/diagnosis/:id" element={
          <ProtectedRoute roles={['doctor', 'admin']}>
            <DiagnosisDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/soap/:encounterId" element={
          <ProtectedRoute roles={['doctor', 'admin']}>
            <SOAPChartPage />
          </ProtectedRoute>
        } />

        <Route path="/prescriptions" element={
          <ProtectedRoute roles={['doctor', 'admin']}>
            <PrescriptionManagementPage />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationCenterPage />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;
