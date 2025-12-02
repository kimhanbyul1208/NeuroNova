/**
 * Dashboard Page for medical staff.
 * Main overview of patients, appointments, and AI predictions.
 */
import { useAuth } from '../auth/AuthContext';
import './DashboardPage.css';

const DashboardPage = () => {
  const { user, logout } = useAuth();

  return (
    <div className="dashboard-container">
      <header id="dashboard-header">
        <h1>NeuroNova 대시보드</h1>
        <div>
          <span className="user-info-text">환영합니다, {user?.username}님</span>
          <button onClick={logout}>로그아웃</button>
        </div>
      </header>

      <div className="stats-grid">
        <div className="stat-card">
          <h3>오늘의 예약</h3>
          <p className="stat-value">12</p>
        </div>

        <div className="stat-card">
          <h3>대기 중인 진단</h3>
          <p className="stat-value">5</p>
        </div>

        <div className="stat-card">
          <h3>AI 분석 완료</h3>
          <p className="stat-value">8</p>
        </div>

        <div className="stat-card">
          <h3>총 환자 수</h3>
          <p className="stat-value">245</p>
        </div>
      </div>

      <div id="recent-results-section">
        <h2>최근 AI 진단 결과</h2>
        <table className="results-table">
          <thead>
            <tr className="table-header-row">
              <th className="table-header-cell">환자명</th>
              <th className="table-header-cell">진단 유형</th>
              <th className="table-header-cell">신뢰도</th>
              <th className="table-header-cell">상태</th>
            </tr>
          </thead>
          <tbody>
            <tr className="table-body-row">
              <td className="table-body-cell">홍길동</td>
              <td className="table-body-cell">Meningioma</td>
              <td className="table-body-cell">94%</td>
              <td className="table-body-cell">검토 대기</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DashboardPage;
