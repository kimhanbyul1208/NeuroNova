import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function ProtectedRoute({ children, roles }) {
  const { loading, me } = useAuth();

  if (loading) return <div style={{ padding: 20 }}>Loading...</div>;
  if (!me) return <Navigate to="/login" replace />;

  if (roles && roles.length > 0 && !roles.includes(me.role)) {
    return <div style={{ padding: 20 }}>권한이 없습니다.</div>;
  }
  return children;
}
