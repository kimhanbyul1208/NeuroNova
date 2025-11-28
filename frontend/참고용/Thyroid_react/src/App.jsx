import { Routes, Route, Link } from "react-router-dom";
import ProtectedRoute from "./auth/ProtectedRoute";
import { ROLES } from "./utils/roles";
import NavBar from "./components/NavBar";
import Login from "./pages/Login";
import Predict from "./pages/Predict";
import Patients from "./pages/Patients";
import PatientDetail from "./pages/PatientDetail";
import AdminUsers from "./pages/AdminUsers";
import { useAuth } from "./auth/AuthContext";


function Home() {
  const { isAuthenticated, user } = useAuth();
  const role = user?.role; // "general" | "doctor" | "admin"

  return (
    <div style={{ padding: 20 }}>
      <h2>Home</h2>
      <p>Thyroid Prediction Demo (React + Django + Flask)</p>

      {/* {!isAuthenticated && (
        <p><Link to="/login">Login</Link></p>
      )} */}

      {isAuthenticated && (
        <ul>
          {/* 모든 로그인 사용자 */}
          <li><Link to="/predict">Predict</Link></li>

          {/* doctor/admin 전용 */}
          {(role === ROLES.DOCTOR || role === ROLES.ADMIN) && (
            <li><Link to="/patients">Patients (doctor/admin)</Link></li>
          )}

          {/* admin 전용 */}
          {role === ROLES.ADMIN && (
            <li><Link to="/admin/users">Admin (admin)</Link></li>
          )}
        </ul>
      )}
    </div>
  );
}

export default function App() {
  return (
    <>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route path="/login" element={<Login/>} />

        <Route path="/predict" element={
          <ProtectedRoute roles={[] /* 모든 로그인 사용자 허용 */}>
            <Predict/>
          </ProtectedRoute>
        }/>

        <Route path="/patients" element={
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.ADMIN]}>
            <Patients/>
          </ProtectedRoute>
        }/>
        <Route path="/patients/:id" element={
          <ProtectedRoute roles={[ROLES.DOCTOR, ROLES.ADMIN]}>
            <PatientDetail/>
          </ProtectedRoute>
        }/>

        <Route path="/admin/users" element={
          <ProtectedRoute roles={[ROLES.ADMIN]}>
            <AdminUsers/>
          </ProtectedRoute>
        }/>
      </Routes>
    </>
  );
}
