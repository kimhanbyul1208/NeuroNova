import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '20px',
      padding: '12px 24px',
      borderBottom: '1px solid #e0e0e0',
      backgroundColor: '#ffffff',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
    }}>
      <Link to="/" style={linkStyle}>
        <span style={{ fontSize: '20px', fontWeight: 'bold', color: '#1976D2' }}>
          NeuroNova
        </span>
      </Link>

      <Link to="/" style={linkStyle}>대시보드</Link>

      {(user?.role === 'doctor' || user?.role === 'admin') && (
        <>
          <Link to="/patients" style={linkStyle}>환자 관리</Link>
          <Link to="/appointments" style={linkStyle}>예약 관리</Link>
          <Link to="/prescriptions" style={linkStyle}>처방 관리</Link>
        </>
      )}

      {user?.role === 'patient' && (
        <>
          <Link to="/appointments" style={linkStyle}>내 예약</Link>
          <Link to="/notifications" style={linkStyle}>알림</Link>
        </>
      )}

      {user?.role === 'admin' && (
        <Link to="/about" style={linkStyle}>시스템 관리</Link>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '14px', color: '#666' }}>
          {user?.name || user?.username} ({getRoleName(user?.role)})
        </span>
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 16px',
            backgroundColor: '#f44336',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#d32f2f'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#f44336'}
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
}

const linkStyle = {
  textDecoration: 'none',
  color: '#424242',
  fontSize: '14px',
  fontWeight: '500',
  padding: '8px 12px',
  borderRadius: '4px',
  transition: 'background-color 0.2s',
};

function getRoleName(role) {
  const roleNames = {
    'admin': '관리자',
    'doctor': '의사',
    'patient': '환자',
    'staff': '직원'
  };
  return roleNames[role] || role;
}
