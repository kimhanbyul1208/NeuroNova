import { useState, useEffect } from 'react';
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
  Avatar
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import { LoadingSpinner, ErrorAlert, AppointmentCard, DiagnosisResultCard } from '../components';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { format } from 'date-fns';

/**
 * 환자 상세 페이지
 * 환자 정보, 진료 기록, SOAP 차트, AI 진단 결과 표시
 */
const PatientDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [patient, setPatient] = useState(null);
  const [encounters, setEncounters] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [predictions, setPredictions] = useState([]);
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
        const [patientRes, encountersRes, appointmentsRes, predictionsRes] = await Promise.all([
          axiosClient.get(`${API_ENDPOINTS.PATIENTS}${id}/`),
          axiosClient.get(`${API_ENDPOINTS.ENCOUNTERS}?patient_id=${id}`),
          axiosClient.get(`${API_ENDPOINTS.APPOINTMENTS}?patient_id=${id}`),
          axiosClient.get(`${API_ENDPOINTS.PREDICTIONS}?patient_id=${id}`)
        ]);

        // Helper to handle pagination
        const getResults = (data) => {
          console.log('API Data:', data);
          if (!data) return [];
          if (Array.isArray(data)) return data;
          if (data.results && Array.isArray(data.results)) return data.results;
          return [];
        };

        setPatient(patientRes.data);
        setEncounters(getResults(encountersRes.data));
        setAppointments(getResults(appointmentsRes.data));
        setPredictions(getResults(predictionsRes.data));
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
    <Container maxWidth="lg" sx={{ marginTop: 4, marginBottom: 4 }}>
      {/* 뒤로 가기 버튼 */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/patients')}
        sx={{ marginBottom: 2 }}
      >
        환자 목록으로
      </Button>

      {/* 환자 기본 정보 */}
      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
          <Avatar sx={{ width: 64, height: 64, marginRight: 2, bgcolor: genderColor + '.main' }}>
            <PersonIcon sx={{ fontSize: 40 }} />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h4" component="h1">
              {patient.last_name}{patient.first_name}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              환자번호: {patient.pid}
            </Typography>
          </Box>
          <Chip label={genderLabel} color={genderColor} />
        </Box>

        <Divider sx={{ marginY: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              생년월일
            </Typography>
            <Typography variant="body1">
              {patient.date_of_birth ? format(new Date(patient.date_of_birth), 'yyyy-MM-dd') : '-'}
            </Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              전화번호
            </Typography>
            <Typography variant="body1">{patient.phone || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              이메일
            </Typography>
            <Typography variant="body1">{patient.email || '-'}</Typography>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary">
              보험번호
            </Typography>
            <Typography variant="body1">{patient.insurance_id || '-'}</Typography>
          </Grid>
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              주소
            </Typography>
            <Typography variant="body1">{patient.address || '-'}</Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* 탭 메뉴 */}
      <Paper sx={{ marginBottom: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label={`예약 (${appointments.length})`} />
          <Tab label={`진료 기록 (${encounters.length})`} />
          <Tab label={`AI 진단 (${predictions.length})`} />
        </Tabs>
      </Paper>

      {/* 탭 컨텐츠 */}
      <Box>
        {/* 예약 탭 */}
        {activeTab === 0 && (
          <Box>
            {appointments.length === 0 ? (
              <Paper sx={{ padding: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  예약 내역이 없습니다.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {Array.isArray(appointments) && appointments.map((appointment) => (
                  <Grid item xs={12} md={6} key={appointment.id}>
                    <AppointmentCard appointment={appointment} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}

        {/* 진료 기록 탭 */}
        {activeTab === 1 && (
          <Box>
            {encounters.length === 0 ? (
              <Paper sx={{ padding: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  진료 기록이 없습니다.
                </Typography>
              </Paper>
            ) : (
              Array.isArray(encounters) && encounters.map((encounter) => (
                <Paper key={encounter.id} sx={{ padding: 3, marginBottom: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                    <Typography variant="h6">
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
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    진료과: {encounter.facility || '-'}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    내원 사유: {encounter.reason || '-'}
                  </Typography>
                  {encounter.doctor_name && (
                    <Typography variant="body2" color="text.secondary">
                      담당의: {encounter.doctor_name}
                    </Typography>
                  )}
                </Paper>
              ))
            )}
          </Box>
        )}

        {/* AI 진단 탭 */}
        {activeTab === 2 && (
          <Box>
            {predictions.length === 0 ? (
              <Paper sx={{ padding: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">
                  AI 진단 기록이 없습니다.
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {Array.isArray(predictions) && predictions.map((prediction) => (
                  <Grid item xs={12} md={6} key={prediction.id}>
                    <DiagnosisResultCard result={prediction} />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default PatientDetailPage;
