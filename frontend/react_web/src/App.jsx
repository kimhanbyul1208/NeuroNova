import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';

// Pages
import LoginPage from './pages/LoginPage';
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

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<DashboardPage />} />
          <Route path="/patients" element={<PatientListPage />} />
          <Route path="/patients/:id" element={<PatientDetailPage />} />
          <Route path="/appointments" element={<AppointmentManagementPage />} />
          <Route path="/dicom/:studyId" element={<DicomViewerPage />} />
          <Route path="/diagnosis/:id" element={<DiagnosisDetailPage />} />
          <Route path="/soap/:encounterId" element={<SOAPChartPage />} />
          <Route path="/prescriptions" element={<PrescriptionManagementPage />} />
          <Route path="/notifications" element={<NotificationCenterPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
