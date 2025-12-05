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
import PatientPrescriptionDetailPage from './pages/PatientPrescriptionDetailPage';
import AppointmentManagementPage from './pages/AppointmentManagementPage';
import DicomViewerPage from './pages/DicomViewerPage';
import DiagnosisDetailPage from './pages/DiagnosisDetailPage';
import AboutPage from './pages/AboutPage';
import SOAPChartPage from './pages/SOAPChartPage';
import PrescriptionManagementPage from './pages/PrescriptionManagementPage';
import PatientPrescriptionsPage from './pages/PatientPrescriptionsPage';
import NotificationCenterPage from './pages/NotificationCenterPage';
import CDSSPage from './pages/CDSSPage';
import DataManagementPage from './pages/DataManagementPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AdminUsersPage from './pages/admin/AdminUsersPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';
import AboutAIPage from './pages/admin/AboutAIPage';
import FormsPage from './pages/nurse/FormsPage';
import MedicalRecordsPage from './pages/MedicalRecordsPage';

import BiomarkerAnalysisPage from './pages/BiomarkerAnalysisPage';
import ProteinViewerPage from './pages/ProteinViewerPage';
import AntigenTestPage from './pages/AntigenTestPage';
import AntigenResultPage from './pages/AntigenResultPage';
import DoctorPatientRelationshipPage from './pages/DoctorPatientRelationshipPage';

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

        {/* Dashboard Redirect */}
        <Route path="/dashboard" element={<DashboardRedirect />} />

        {/* Role-based Dashboards */}
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

        {/* Admin Routes */}
        <Route path="/admin/users" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminUsersPage />
          </ProtectedRoute>
        } />

        <Route path="/admin/settings" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AdminSettingsPage />
          </ProtectedRoute>
        } />

        <Route path="/about-ai" element={
          <ProtectedRoute roles={['ADMIN']}>
            <AboutAIPage />
          </ProtectedRoute>
        } />

        {/* Feature Routes */}
        <Route path="/patient/medical-records" element={
          <ProtectedRoute roles={['PATIENT', 'ADMIN']}>
            <MedicalRecordsPage />
          </ProtectedRoute>
        } />

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

        <Route path="/patients/:patientId/prescriptions/:date" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN', 'NURSE']}>
            <PatientPrescriptionDetailPage />
          </ProtectedRoute>
        } />

        <Route path="/appointments" element={
          <ProtectedRoute>
            <AppointmentManagementPage />
          </ProtectedRoute>
        } />

        <Route path="/appointments/new" element={
          <ProtectedRoute roles={['PATIENT', 'ADMIN']}>
            <BookAppointmentPage />
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

        <Route path="/patient/prescriptions" element={
          <ProtectedRoute roles={['PATIENT', 'ADMIN']}>
            <PatientPrescriptionsPage />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <NotificationCenterPage />
          </ProtectedRoute>
        } />

        <Route path="/doctor/cdss" element={
          <Navigate to="/doctor/biomarker-analysis" replace />
        } />

        <Route path="/doctor/biomarker-analysis" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <BiomarkerAnalysisPage />
          </ProtectedRoute>
        } />

        <Route path="/doctor/protein-viewer" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <ProteinViewerPage />
          </ProtectedRoute>
        } />

        <Route path="/antigen-test" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <AntigenTestPage />
          </ProtectedRoute>
        } />

        <Route path="/antigen-test/:patientId" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <AntigenResultPage />
          </ProtectedRoute>
        } />

        <Route path="/staff/doctor-patient-relations" element={
          <ProtectedRoute roles={['NURSE', 'ADMIN', 'DOCTOR']}>
            <DoctorPatientRelationshipPage />
          </ProtectedRoute>
        } />

        <Route path="/doctor/data-management" element={
          <ProtectedRoute roles={['DOCTOR', 'ADMIN']}>
            <DataManagementPage />
          </ProtectedRoute>
        } />

        <Route path="/forms" element={
          <ProtectedRoute roles={['NURSE', 'DOCTOR', 'ADMIN']}>
            <FormsPage />
          </ProtectedRoute>
        } />
      </Routes>
    </>
  );
}

export default App;
