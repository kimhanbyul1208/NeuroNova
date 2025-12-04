import { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Tabs,
  Tab,
  Chip,
  Button,
  Divider,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemButton,
  ListItemIcon,
} from '@mui/material';
import DashboardLayout from '../layouts/DashboardLayout';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import ScienceIcon from '@mui/icons-material/Science';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { LoadingSpinner, ErrorAlert, AppointmentCard } from '../components';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { format } from 'date-fns';
import './DashboardPage.css';

/**
 * 환자 상세 페이지
 * 환자 정보, 진료 기록, SOAP 차트, 항원 검사 결과(처방전) 표시
 */
const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patient, setPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);

  // 데이터 불러오기
  useEffect(() => {
    const fetchPatientData = async () => {
      try {
        setLoading(true);
        setError(null);

        // 병렬로 데이터 요청
        const [patientRes, encountersRes, appointmentsRes, prescriptionsRes] = await Promise.all([
          axiosClient.get(`${API_ENDPOINTS.PATIENTS}${id}/`),
          axiosClient.get(`${API_ENDPOINTS.ENCOUNTERS}?patient=${id}`),
          axiosClient.get(`${API_ENDPOINTS.APPOINTMENTS}?patient=${id}`),
          axiosClient.get(`${API_ENDPOINTS.PRESCRIPTIONS}?patient=${id}`) // 처방전 데이터 요청
        ]);

        // Helper to handle pagination
        const getResults = (data) => {
          if (!data) return [];
          if (Array.isArray(data)) return data;
          if (data.results && Array.isArray(data.results)) return data.results;
          return [];
        };

        setPatient(patientRes.data);
        setEncounters(getResults(encountersRes.data));
        setAppointments(getResults(appointmentsRes.data));
        setPrescriptions(getResults(prescriptionsRes.data));
      } catch (err) {
        setError(err.response?.data?.message || '환자 정보를 불러오는데 실패했습니다.');
        console.error('Error fetching patient data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id]);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // 처방전 날짜별 그룹화
  const groupedPrescriptions = prescriptions.reduce((groups, prescription) => {
    const date = prescription.created_at ? prescription.created_at.split('T')[0] : 'Unknown Date';
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(prescription);
    return groups;
  }, {});

  // 날짜 내림차순 정렬
  const sortedDates = Object.keys(groupedPrescriptions).sort((a, b) => new Date(b) - new Date(a));

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ marginTop: 4 }}>
        <ErrorAlert
          message={error}
          title="오류 발생"
          onRetry={() => window.location.reload()}
        />
      </Container>
    );
  }

  if (!patient) {
    return (
      <Container maxWidth="lg" sx={{ marginTop: 4 }}>
        <ErrorAlert
          message="환자 정보를 찾을 수 없습니다."
          title="환자 없음"
          severity="warning"
        />
      </Container>
    );
  }

  const genderLabel = patient.gender === 'M' ? '남성' : '여성';
  const genderColor = patient.gender === 'M' ? 'primary' : 'secondary';

  return (
    <DashboardLayout role={user?.role} activePage="patients" title="환자상세조회">
      <div className="page-container">
      <div className="page-header">
        <div className="header-content">
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/patients')}
            className="back-button"
            sx={{ mb: 2 }}
          >
            환자 목록으로
          </Button>
          {/* <div className="page-title-row">
            <h1 className="page-title">환자 상세 정보</h1>
          </div> */}
        </div>
      </div>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 3, m : 1 }} className="patient-info-card">
        {/* 상단 프로필 영역 */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Avatar
            sx={{
              width: 72,
              height: 72,
              mr: 3,
              bgcolor: `${genderColor}.main`,
            }}
          >
            <PersonIcon sx={{ fontSize: 42 }} />
          </Avatar>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              {patient.last_name} {patient.first_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              환자번호: {patient.pid}
            </Typography>
          </Box>

          <Chip
            label={genderLabel}
            color={genderColor}
            sx={{ fontSize: '0.9rem', px: 1.5, py: 0.5 }}
          />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 상세 정보 영역 */}
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                생년월일
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {patient.date_of_birth
                  ? format(new Date(patient.date_of_birth), 'yyyy-MM-dd')
                  : '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                전화번호
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {patient.phone || '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                이메일
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {patient.email || '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                보험번호
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {patient.insurance_id || '-'}
              </Typography>
            </Box>
          </Grid>

          <Grid item xs={12}>
            <Box>
              <Typography variant="subtitle2" color="text.secondary">
                주소
              </Typography>
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {patient.address || '-'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <div className="tab-container">
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider', mb: 2}}
        >
          <Tab label={`예약 (${appointments.length})`} />
          <Tab label={`진료 기록 (${encounters.length})`} />
          <Tab label={`항원 검사 결과 (${prescriptions.length})`} />
        </Tabs>

        {/* 예약 탭 */}
        {activeTab === 0 && (
          <>
            {appointments.length === 0 ? (
              <Box className="empty-state" sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  예약 내역이 없습니다.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2}  >
                {appointments.map((appointment) => (
                  <Grid item xs={12} md={6} key={appointment.id}>
                    <AppointmentCard appointment={appointment} />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        {/* 진료 기록 탭 */}
        {activeTab === 1 && (
          <>
            {encounters.length === 0 ? (
              <Box className="empty-state" sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  진료 기록이 없습니다.
                </Typography>
              </Box>
            ) : (
              encounters.map((encounter) => (
                <Paper
                  key={encounter.id}
                  elevation={2}
                  sx={{ p: 3, mb: 2, borderRadius: 2 }}
                  className="encounter-card"
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      {encounter.encounter_date
                        ? format(new Date(encounter.encounter_date), 'yyyy-MM-dd HH:mm')
                        : '날짜 없음'}
                    </Typography>
                    <Chip
                      label={encounter.status}
                      color={encounter.status === 'COMPLETED' ? 'success' : 'default'}
                      size="small"
                    />
                  </Box>

                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>진료과:</strong> {encounter.facility || '-'}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1 }}>
                    <strong>내원 사유:</strong> {encounter.reason || '-'}
                  </Typography>
                  {encounter.doctor_name && (
                    <Typography variant="body2">
                      <strong>담당의:</strong>
                      {" "}
                      {(() => {
                        const parts = encounter.doctor_name.split(" ");
                        return parts.length === 2 ? `${parts[1]}${parts[0]}` : encounter.doctor_name;
                      })()}

                    </Typography>
                  )}
                </Paper>
              ))
            )}
          </>
        )}

        {/* 항원 검사 결과 (처방전 목록) 탭 */}
        {activeTab === 2 && (
          <>
            {prescriptions.length === 0 ? (
              <Box className="empty-state" sx={{ textAlign: 'center', py: 4 }}>
                <Typography variant="body1" color="text.secondary">
                  항원 검사(처방) 기록이 없습니다.
                </Typography>
              </Box>
            ) : (
              <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <List>
                  {sortedDates.map((date, index) => {
                    const count = groupedPrescriptions[date].length;
                    return (
                      <div key={date}>
                        <ListItemButton
                          onClick={() => navigate(`/patients/${id}/prescriptions/${date}?tab=2`)}
                          sx={{
                            py: 2,
                            '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                          }}
                        >
                          <ListItemIcon>
                            <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.main' }}>
                              <ScienceIcon />
                            </Avatar>
                          </ListItemIcon>
                          <ListItemText
                            primary={
                              <Typography variant="subtitle1" fontWeight={600}>
                                {date} 검사 결과
                              </Typography>
                            }
                            secondary={`총 ${count}건의 처방 내역`}
                          />
                          <ChevronRightIcon color="action" />
                        </ListItemButton>
                        {index < sortedDates.length - 1 && (
                          <Divider variant="inset" component="li" />
                        )}
                      
                    </div>
                    )
                  })}
                </List>
              </Paper>
            )}
          </>
        )}
      </div>      
    </div>
    </DashboardLayout>
  );
};

export default PatientDetailPage;