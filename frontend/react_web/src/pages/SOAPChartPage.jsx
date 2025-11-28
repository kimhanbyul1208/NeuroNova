import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Divider,
  Alert,
} from '@mui/material';
import { Save as SaveIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { LoadingSpinner, ErrorAlert } from '../components';

/**
 * SOAP Chart Page
 * SOAP (Subjective, Objective, Assessment, Plan) 차트 조회 및 수정
 */
const SOAPChartPage = () => {
  const { encounterId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  const [soapData, setSoapData] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: '',
    encounter_id: encounterId,
  });

  const [encounterInfo, setEncounterInfo] = useState(null);

  useEffect(() => {
    fetchSOAPChart();
    fetchEncounterInfo();
  }, [encounterId]);

  const fetchSOAPChart = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get(`${API_ENDPOINTS.SOAP_CHARTS}?encounter_id=${encounterId}`);
      
      if (response.data.results && response.data.results.length > 0) {
        setSoapData(response.data.results[0]);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'SOAP 차트를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchEncounterInfo = async () => {
    try {
      const response = await axiosClient.get(`${API_ENDPOINTS.ENCOUNTERS}${encounterId}/`);
      setEncounterInfo(response.data);
    } catch (err) {
      console.error('진료 정보 조회 실패:', err);
    }
  };

  const handleChange = (field) => (event) => {
    setSoapData({
      ...soapData,
      [field]: event.target.value,
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage('');

      if (soapData.id) {
        // Update existing SOAP chart
        await axiosClient.put(`${API_ENDPOINTS.SOAP_CHARTS}${soapData.id}/`, soapData);
      } else {
        // Create new SOAP chart
        await axiosClient.post(API_ENDPOINTS.SOAP_CHARTS, soapData);
      }

      setSuccessMessage('SOAP 차트가 성공적으로 저장되었습니다.');
      setTimeout(() => {
        navigate(-1);
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'SOAP 차트 저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          variant="outlined"
        >
          뒤로
        </Button>
        <Typography variant="h4" component="h1">
          SOAP 차트
        </Typography>
      </Box>

      {encounterInfo && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">환자</Typography>
              <Typography variant="body1">{encounterInfo.patient_name}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">진료 일시</Typography>
              <Typography variant="body1">
                {new Date(encounterInfo.date).toLocaleString('ko-KR')}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">진료 사유</Typography>
              <Typography variant="body1">{encounterInfo.reason || '-'}</Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {error && <ErrorAlert message={error} onRetry={fetchSOAPChart} sx={{ mb: 3 }} />}
      {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Subjective */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              S (Subjective) - 주관적 증상
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              환자가 호소하는 증상, 불편함, 병력 등
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={soapData.subjective}
              onChange={handleChange('subjective')}
              placeholder="예: 환자는 3일 전부터 지속적인 두통을 호소함. 구토 증상 동반."
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Objective */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              O (Objective) - 객관적 소견
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              의사의 관찰, 검사 결과, 활력 징후 등
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={soapData.objective}
              onChange={handleChange('objective')}
              placeholder="예: 혈압 120/80, 체온 36.5°C. MRI 검사 결과 뇌종양 의심 소견."
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Assessment */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              A (Assessment) - 평가/진단
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              의사의 진단, AI 진단 결과 참고
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={soapData.assessment}
              onChange={handleChange('assessment')}
              placeholder="예: Glioma 의심. AI 진단 결과 85% 신뢰도로 Glioma 예측."
              variant="outlined"
            />
          </Grid>

          <Grid item xs={12}>
            <Divider />
          </Grid>

          {/* Plan */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              P (Plan) - 계획
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              치료 계획, 추가 검사, 처방 등
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              value={soapData.plan}
              onChange={handleChange('plan')}
              placeholder="예: 조직 검사 예정. 항암제 처방. 2주 후 재진."
              variant="outlined"
            />
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
                disabled={saving}
              >
                취소
              </Button>
              <Button
                variant="contained"
                startIcon={<SaveIcon />}
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? '저장 중...' : '저장'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default SOAPChartPage;
