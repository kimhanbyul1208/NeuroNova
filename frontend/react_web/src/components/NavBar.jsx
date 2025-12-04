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

      <Link to="/dashboard" style={linkStyle}>대시보드</Link>

      {(user?.role === 'DOCTOR' || user?.role === 'ADMIN' || user?.role === 'NURSE') && (
        <>
          <Link to="/patients" style={linkStyle}>환자 관리</Link>
        </>
      )}

      {(user?.role === 'DOCTOR' || user?.role === 'ADMIN') && (
        <>
          <Link to="/appointments" style={linkStyle}>예약 관리</Link>
          <Link to="/prescriptions" style={linkStyle}>처방 관리</Link>
          <Link to="/antigen-test" style={linkStyle}>항원 검사</Link>
          {/* <Link to="/doctor/data-management" style={linkStyle}>데이터 관리</Link> */}
        </>
      )}

      {user?.role === 'PATIENT' && (
        <>
          <Link to="/appointments" style={linkStyle}>내 예약</Link>
          {/* <Link to="/notifications" style={linkStyle}>알림</Link> */}
          <Link to="/about" style={linkStyle}>About Us</Link>
        </>
      )}

      {user?.role === 'ADMIN' && (
        <Link to="/about" style={linkStyle}>About Us</Link>
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
    'ADMIN': '관리자',
    'DOCTOR': '의사',
    'PATIENT': '환자',
    'NURSE': '간호사/직원'
  };
  return roleNames[role] || role;
}
