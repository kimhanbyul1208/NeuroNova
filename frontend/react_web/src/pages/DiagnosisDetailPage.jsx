import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { LoadingSpinner, ErrorAlert } from '../components';
import XAIVisualization from '../components/XAIVisualization';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { format } from 'date-fns';

/**
 * AI 진단 상세 페이지
 * 진단 결과 상세 정보 및 XAI 시각화, 의사 피드백 입력
 */
const DiagnosisDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [feedback, setFeedback] = useState('');
  const [doctorNote, setDoctorNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axiosClient.get(`${API_ENDPOINTS.PREDICTIONS}${id}/`);
        setPrediction(response.data);
        setFeedback(response.data.doctor_feedback || '');
        setDoctorNote(response.data.doctor_note || '');
      } catch (err) {
        setError(err.response?.data?.message || 'AI 진단 결과를 불러오는데 실패했습니다.');
        console.error('Error fetching prediction:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [id]);

  const handleSaveFeedback = async () => {
    try {
      setSaving(true);
      await axiosClient.patch(`${API_ENDPOINTS.PREDICTIONS}${id}/`, {
        doctor_feedback: feedback,
        doctor_note: doctorNote
      });

      setSnackbar({
        open: true,
        message: '피드백이 저장되었습니다.',
        severity: 'success'
      });

      // 데이터 새로고침
      const response = await axiosClient.get(`${API_ENDPOINTS.PREDICTIONS}${id}/`);
      setPrediction(response.data);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || '피드백 저장에 실패했습니다.',
        severity: 'error'
      });
      console.error('Error saving feedback:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ marginTop: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ marginBottom: 2 }}
        >
          뒤로 가기
        </Button>
        <ErrorAlert
          message={error}
          title="오류 발생"
          onRetry={() => window.location.reload()}
        />
      </Container>
    );
  }

  if (!prediction) {
    return (
      <Container maxWidth="lg" sx={{ marginTop: 4 }}>
        <ErrorAlert
          message="AI 진단 결과를 찾을 수 없습니다."
          title="데이터 없음"
          severity="warning"
        />
      </Container>
    );
  }

  const confidencePercent = Math.round(prediction.confidence_score * 100);

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4, marginBottom: 4 }}>
      {/* 헤더 */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ marginBottom: 2 }}
      >
        뒤로 가기
      </Button>

      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          AI 진단 상세
        </Typography>
        <Typography variant="body1" color="text.secondary">
          진단 ID: {prediction.id}
        </Typography>
      </Box>

      {/* 진단 요약 */}
      <Paper sx={{ padding: 3, marginBottom: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              진단 결과
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, marginBottom: 2 }}>
              <Typography variant="h5" color="primary">
                {prediction.prediction_class}
              </Typography>
              <Chip
                label={`신뢰도 ${confidencePercent}%`}
                color={confidencePercent >= 90 ? 'success' : confidencePercent >= 70 ? 'warning' : 'error'}
              />
            </Box>
          </Grid>

          <Grid item xs={12} md={6}>
            <Typography variant="body2" color="text.secondary">
              검토 일시
            </Typography>
            <Typography variant="body1" gutterBottom>
              {prediction.confirmed_at
                ? format(new Date(prediction.confirmed_at), 'yyyy-MM-dd HH:mm')
                : '검토 대기 중'}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              환자 ID
            </Typography>
            <Typography variant="body1">
              {prediction.patient_id || '-'}
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* XAI 시각화 */}
      <Box sx={{ marginBottom: 3 }}>
        <Typography variant="h6" gutterBottom>
          설명가능한 AI (XAI) 분석
        </Typography>
        <XAIVisualization predictionResult={prediction} />
      </Box>

      {/* 의사 피드백 */}
      <Paper sx={{ padding: 3 }}>
        <Typography variant="h6" gutterBottom>
          의사 피드백 (Human-in-the-loop)
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          AI 진단 결과에 대한 피드백을 제공하여 모델 성능을 개선합니다.
        </Typography>

        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>진단 정확도</InputLabel>
              <Select
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                label="진단 정확도"
              >
                <MenuItem value="">선택 안 함</MenuItem>
                <MenuItem value="CORRECT">정확함</MenuItem>
                <MenuItem value="INCORRECT">부정확함</MenuItem>
                <MenuItem value="AMBIGUOUS">애매함</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="의사 소견"
              placeholder="AI 진단에 대한 의견이나 추가 소견을 입력하세요..."
              value={doctorNote}
              onChange={(e) => setDoctorNote(e.target.value)}
            />
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSaveFeedback}
              disabled={saving}
            >
              {saving ? '저장 중...' : '피드백 저장'}
            </Button>
          </Grid>
        </Grid>
      </Paper>

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
    </Container>
  );
};

export default DiagnosisDetailPage;
