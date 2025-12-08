import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  CircularProgress,
  Alert,
  LinearProgress,
  Chip
} from '@mui/material';
import {
  CheckCircle as AgreeIcon,
  Cancel as DisagreeIcon,
  Help as NeedsInfoIcon,
  TrendingUp as HighConfIcon,
  TrendingDown as LowConfIcon
} from '@mui/icons-material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import apiClient from '../../services/apiClient';

const COLORS = ['#4caf50', '#f44336', '#ff9800'];

export default function ModelPerformanceDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);

  useEffect(() => {
    fetchPerformanceData();
  }, []);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.get('/api/v1/emr/statistics/model_performance/');
      setPerformanceData(response.data);
    } catch (err) {
      console.error('Failed to fetch performance data:', err);
      setError('모델 성능 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container sx={{ mt: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  if (!performanceData) {
    return null;
  }

  // Prepare feedback distribution data
  const feedbackData = [
    { name: '동의', value: performanceData.feedback_summary.agree, color: '#4caf50' },
    { name: '비동의', value: performanceData.feedback_summary.disagree, color: '#f44336' },
    { name: '추가정보필요', value: performanceData.feedback_summary.needs_more_info, color: '#ff9800' }
  ];

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4 }}>
        AI 모델 성능 분석
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                총 예측 건수
              </Typography>
              <Typography variant="h4">
                {performanceData.total_predictions}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                의사 검토 완료
              </Typography>
              <Typography variant="h4">
                {performanceData.reviewed_predictions}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(performanceData.reviewed_predictions / performanceData.total_predictions) * 100}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                검토 대기 중
              </Typography>
              <Typography variant="h4">
                {performanceData.pending_review}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card sx={{ bgcolor: '#e8f5e9' }}>
            <CardContent>
              <Typography color="textSecondary" variant="body2" gutterBottom>
                의사 동의율
              </Typography>
              <Typography variant="h4" color="success.main">
                {performanceData.agreement_rate}%
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Feedback Analysis */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                의사 피드백 분포
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={feedbackData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {feedbackData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                피드백 상세
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center">
                    <AgreeIcon sx={{ mr: 1, color: '#4caf50' }} />
                    <Typography>동의</Typography>
                  </Box>
                  <Chip
                    label={performanceData.feedback_summary.agree}
                    color="success"
                    size="small"
                  />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center">
                    <DisagreeIcon sx={{ mr: 1, color: '#f44336' }} />
                    <Typography>비동의</Typography>
                  </Box>
                  <Chip
                    label={performanceData.feedback_summary.disagree}
                    color="error"
                    size="small"
                  />
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <NeedsInfoIcon sx={{ mr: 1, color: '#ff9800' }} />
                    <Typography>추가 정보 필요</Typography>
                  </Box>
                  <Chip
                    label={performanceData.feedback_summary.needs_more_info}
                    color="warning"
                    size="small"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Confidence Distribution */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                신뢰도 분포
              </Typography>
              <Box sx={{ mt: 3 }}>
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                  <Box display="flex" alignItems="center">
                    <HighConfIcon sx={{ mr: 1, color: '#4caf50' }} />
                    <Typography>높은 신뢰도 (≥80%)</Typography>
                  </Box>
                  <Typography variant="h6">
                    {performanceData.confidence_distribution.high_confidence}
                  </Typography>
                </Box>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center">
                    <LowConfIcon sx={{ mr: 1, color: '#ff9800' }} />
                    <Typography>낮은 신뢰도 (&lt;60%)</Typography>
                  </Box>
                  <Typography variant="h6">
                    {performanceData.confidence_distribution.low_confidence}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Class Performance */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                클래스별 평균 신뢰도 (Top 5)
              </Typography>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={performanceData.class_performance.slice(0, 5)}
                  layout="horizontal"
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 1]} />
                  <YAxis dataKey="class" type="category" width={100} />
                  <Tooltip formatter={(value) => `${(value * 100).toFixed(1)}%`} />
                  <Bar dataKey="average_confidence" fill="#8884d8" name="평균 신뢰도" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Footer Info */}
      <Box sx={{ mt: 4, textAlign: 'center' }}>
        <Typography variant="caption" color="textSecondary">
          마지막 업데이트: {new Date(performanceData.generated_at).toLocaleString('ko-KR')}
        </Typography>
      </Box>
    </Container>
  );
}
