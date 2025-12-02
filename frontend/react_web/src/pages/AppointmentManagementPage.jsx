import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  Tabs,
  Tab,
  Snackbar,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip
} from '@mui/material';
import axiosClient from '../api/axios';
import { API_ENDPOINTS, APPOINTMENT_STATUS } from '../utils/config';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import './DashboardPage.css';

/**
 * 예약 관리 페이지
 * 의사가 환자 예약을 승인/거부하고 관리
 */
const AppointmentManagementPage = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // 예약 목록 불러오기
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get(API_ENDPOINTS.APPOINTMENTS);

      // Handle pagination
      const data = response.data;
      setAppointments(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      setError(err.response?.data?.message || '예약 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  // 예약 승인
  const handleApprove = async (appointmentId) => {
    try {
      // Use specific action endpoint
      await axiosClient.post(`${API_ENDPOINTS.APPOINTMENTS}${appointmentId}/confirm/`);

      setSnackbar({
        open: true,
        message: '예약이 승인되었습니다.',
        severity: 'success'
      });

      // 목록 갱신
      fetchAppointments();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || '예약 승인에 실패했습니다.',
        severity: 'error'
      });
      console.error('Error approving appointment:', err);
    }
  };

  // 예약 거부
  const handleReject = async (appointmentId) => {
    try {
      // Use specific action endpoint
      await axiosClient.post(`${API_ENDPOINTS.APPOINTMENTS}${appointmentId}/cancel/`);

      setSnackbar({
        open: true,
        message: '예약이 거부되었습니다.',
        severity: 'info'
      });

      // 목록 갱신
      fetchAppointments();
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || '예약 거부에 실패했습니다.',
        severity: 'error'
      });
      console.error('Error rejecting appointment:', err);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // 상태별 필터링
  const pendingAppointments = appointments.filter(
    (apt) => apt.status === APPOINTMENT_STATUS.PENDING
  );
  const confirmedAppointments = appointments.filter(
    (apt) => apt.status === APPOINTMENT_STATUS.CONFIRMED
  );
  const completedAppointments = appointments.filter(
    (apt) => apt.status === APPOINTMENT_STATUS.COMPLETED
  );
  const cancelledAppointments = appointments.filter(
    (apt) => apt.status === APPOINTMENT_STATUS.CANCELLED || apt.status === APPOINTMENT_STATUS.NO_SHOW
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <DashboardLayout role={user?.role} activePage="appointments" title="Appointment Management">
      <div className="page-container">
        {/* 헤더 */}
        <div className="page-header">
          <Box>
            <h1 className="page-title">
              예약 관리
            </h1>
            <p className="page-subtitle">
              환자 예약을 승인하고 관리합니다.
            </p>
          </Box>
        </div>

        {/* 에러 표시 */}
        {error && (
          <Alert severity="error" sx={{ marginBottom: 2 }}>
            <Typography variant="h6">오류 발생</Typography>
            <Typography>{error}</Typography>
            <Button onClick={fetchAppointments} sx={{ marginTop: 1 }}>재시도</Button>
          </Alert>
        )}

        {/* 탭 메뉴 */}
        {!error && (
          <>
            <div className="tab-container">
              <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
                <Tab label={`대기 중 (${pendingAppointments.length})`} />
                <Tab label={`확정 (${confirmedAppointments.length})`} />
                <Tab label={`완료 (${completedAppointments.length})`} />
                <Tab label={`취소/미방문 (${cancelledAppointments.length})`} />
              </Tabs>
            </div>

            {/* 탭 컨텐츠 */}
            <Box>
              {/* 대기 중 탭 */}
              {activeTab === 0 && (
                <Box>
                  {pendingAppointments.length === 0 ? (
                    <div className="empty-state">
                      대기 중인 예약이 없습니다.
                    </div>
                  ) : (
                    <div className="appointment-grid">
                      {pendingAppointments.map((appointment) => (
                        <Card key={appointment.id} className="content-card">
                          <CardContent>
                            <Typography variant="h6">{appointment.patient_name || '환자정보 없음'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(appointment.scheduled_time).toLocaleString('ko-KR')}
                            </Typography>
                            <Chip label={appointment.status} size="small" sx={{ marginTop: 1 }} />
                          </CardContent>
                          <CardActions>
                            <Button size="small" color="primary" onClick={() => handleApprove(appointment.id)}>승인</Button>
                            <Button size="small" color="error" onClick={() => handleReject(appointment.id)}>거부</Button>
                          </CardActions>
                        </Card>
                      ))}
                    </div>
                  )}
                </Box>
              )}

              {/* 확정 탭 */}
              {activeTab === 1 && (
                <Box>
                  {confirmedAppointments.length === 0 ? (
                    <div className="empty-state">
                      확정된 예약이 없습니다.
                    </div>
                  ) : (
                    <div className="appointment-grid">
                      {confirmedAppointments.map((appointment) => (
                        <Card key={appointment.id} className="content-card">
                          <CardContent>
                            <Typography variant="h6">{appointment.patient_name || '환자정보 없음'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(appointment.scheduled_time).toLocaleString('ko-KR')}
                            </Typography>
                            <Chip label={appointment.status} size="small" color="success" sx={{ marginTop: 1 }} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </Box>
              )}

              {/* 완료 탭 */}
              {activeTab === 2 && (
                <Box>
                  {completedAppointments.length === 0 ? (
                    <div className="empty-state">
                      완료된 예약이 없습니다.
                    </div>
                  ) : (
                    <div className="appointment-grid">
                      {completedAppointments.map((appointment) => (
                        <Card key={appointment.id} className="content-card">
                          <CardContent>
                            <Typography variant="h6">{appointment.patient_name || '환자정보 없음'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(appointment.scheduled_time).toLocaleString('ko-KR')}
                            </Typography>
                            <Chip label={appointment.status} size="small" color="default" sx={{ marginTop: 1 }} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </Box>
              )}

              {/* 취소/미방문 탭 */}
              {activeTab === 3 && (
                <Box>
                  {cancelledAppointments.length === 0 ? (
                    <div className="empty-state">
                      취소 또는 미방문 예약이 없습니다.
                    </div>
                  ) : (
                    <div className="appointment-grid">
                      {cancelledAppointments.map((appointment) => (
                        <Card key={appointment.id} className="content-card">
                          <CardContent>
                            <Typography variant="h6">{appointment.patient_name || '환자정보 없음'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(appointment.scheduled_time).toLocaleString('ko-KR')}
                            </Typography>
                            <Chip label={appointment.status} size="small" color="error" sx={{ marginTop: 1 }} />
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </Box>
              )}
            </Box>
          </>
        )}

        {/* 스낵바 알림 */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={6000}
          onClose={handleCloseSnackbar}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseSnackbar} severity={snackbar.severity}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </div>
    </DashboardLayout>
  );
};

export default AppointmentManagementPage;
