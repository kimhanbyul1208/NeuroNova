import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { ROLES } from "../utils/roles";

export default function NavBar() {
  const { me, logout } = useAuth();
  const navigate = useNavigate();

  function onLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div style={{ display: "flex", gap: 12, padding: 12, borderBottom: "1px solid #eee" }}>
      <Link to="/">Home</Link>
      <Link to="/predict">Predict</Link>
      {me?.role === ROLES.DOCTOR || me?.role === ROLES.ADMIN ? (
        <>
          <Link to="/patients">Patients</Link>
        </>
      ) : null}
      {me?.role === ROLES.ADMIN ? (
        <Link to="/admin/users">Admin</Link>
      ) : null}
      <div style={{ marginLeft: "auto" }}>
        {me ? (
          <>
            <span style={{ marginRight: 10 }}>
              {me.username} ({me.role})
            </span>
            <button onClick={onLogout}>Logout</button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </div>
  );
}
