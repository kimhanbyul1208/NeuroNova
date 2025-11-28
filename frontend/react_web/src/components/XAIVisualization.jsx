import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Tabs,
  Tab,
  Card,
  CardMedia,
  CardContent,
  Chip,
  Grid
} from '@mui/material';
import { API_CONFIG } from '../utils/config';

/**
 * XAI 시각화 컴포넌트
 * SHAP, Grad-CAM 등의 설명가능한 AI 결과 표시
 *
 * @param {Object} props
 * @param {Object} props.predictionResult - AI 진단 결과 객체
 */
const XAIVisualization = ({ predictionResult }) => {
  const [activeTab, setActiveTab] = useState(0);

  if (!predictionResult) {
    return (
      <Paper sx={{ padding: 3, textAlign: 'center' }}>
        <Typography variant="body1" color="text.secondary">
          시각화할 데이터가 없습니다.
        </Typography>
      </Paper>
    );
  }

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // XAI 이미지 URL 생성
  const getImageUrl = (path) => {
    if (!path) return null;
    // API 서버의 미디어 URL
    return `${API_CONFIG.BASE_URL}${path}`;
  };

  const xaiImageUrl = getImageUrl(predictionResult.xai_image_path);

  // Feature Importance 데이터
  const featureImportance = predictionResult.feature_importance || {};
  const featureEntries = Object.entries(featureImportance)
    .sort((a, b) => b[1] - a[1]); // 중요도 순으로 정렬

  return (
    <Box>
      <Paper sx={{ marginBottom: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="fullWidth">
          <Tab label="히트맵 (Grad-CAM)" />
          <Tab label="특징 중요도 (SHAP)" />
          <Tab label="모델 정보" />
        </Tabs>
      </Paper>

      {/* 히트맵 탭 */}
      {activeTab === 0 && (
        <Paper sx={{ padding: 3 }}>
          <Typography variant="h6" gutterBottom>
            Gradient-weighted Class Activation Mapping (Grad-CAM)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            모델이 진단을 내릴 때 주목한 영역을 히트맵으로 표시합니다.
            빨간색 영역일수록 더 중요하게 고려된 부분입니다.
          </Typography>

          {xaiImageUrl ? (
            <Card>
              <CardMedia
                component="img"
                image={xaiImageUrl}
                alt="Grad-CAM Heatmap"
                sx={{
                  maxHeight: 600,
                  objectFit: 'contain',
                  backgroundColor: '#000'
                }}
              />
              <CardContent>
                <Typography variant="body2" color="text.secondary">
                  예측 클래스: <strong>{predictionResult.prediction_class}</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  신뢰도: <strong>{Math.round(predictionResult.confidence_score * 100)}%</strong>
                </Typography>
              </CardContent>
            </Card>
          ) : (
            <Box sx={{ padding: 4, textAlign: 'center', bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body1" color="text.secondary">
                히트맵 이미지가 생성되지 않았습니다.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* 특징 중요도 탭 */}
      {activeTab === 1 && (
        <Paper sx={{ padding: 3 }}>
          <Typography variant="h6" gutterBottom>
            SHAP (SHapley Additive exPlanations)
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            각 특징이 예측에 기여한 정도를 나타냅니다.
          </Typography>

          {featureEntries.length > 0 ? (
            <Grid container spacing={2}>
              {featureEntries.map(([feature, importance]) => (
                <Grid item xs={12} key={feature}>
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: 2,
                      bgcolor: 'grey.50',
                      borderRadius: 1,
                      border: '1px solid',
                      borderColor: 'grey.300'
                    }}
                  >
                    <Typography variant="body1">{feature}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box
                        sx={{
                          width: 200,
                          height: 20,
                          bgcolor: 'grey.200',
                          borderRadius: 1,
                          overflow: 'hidden',
                          position: 'relative'
                        }}
                      >
                        <Box
                          sx={{
                            width: `${importance * 100}%`,
                            height: '100%',
                            bgcolor: 'primary.main',
                            transition: 'width 0.3s ease'
                          }}
                        />
                      </Box>
                      <Chip
                        label={`${Math.round(importance * 100)}%`}
                        size="small"
                        color="primary"
                      />
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ padding: 4, textAlign: 'center', bgcolor: 'grey.100', borderRadius: 1 }}>
              <Typography variant="body1" color="text.secondary">
                특징 중요도 데이터가 없습니다.
              </Typography>
            </Box>
          )}
        </Paper>
      )}

      {/* 모델 정보 탭 */}
      {activeTab === 2 && (
        <Paper sx={{ padding: 3 }}>
          <Typography variant="h6" gutterBottom>
            모델 정보
          </Typography>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                모델명
              </Typography>
              <Typography variant="body1">
                {predictionResult.model_name || 'Unknown'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">
                버전
              </Typography>
              <Typography variant="body1">
                {predictionResult.model_version || 'N/A'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Orthanc Study UID
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'grey.100',
                  padding: 1,
                  borderRadius: 1,
                  wordBreak: 'break-all'
                }}
              >
                {predictionResult.orthanc_study_uid || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Orthanc Series UID
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontFamily: 'monospace',
                  bgcolor: 'grey.100',
                  padding: 1,
                  borderRadius: 1,
                  wordBreak: 'break-all'
                }}
              >
                {predictionResult.orthanc_series_uid || '-'}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ marginTop: 3 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              클래스별 확률 분포
            </Typography>
            {predictionResult.probabilities &&
              Object.entries(predictionResult.probabilities).map(([className, prob]) => (
                <Box key={className} sx={{ marginBottom: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 0.5 }}>
                    <Typography variant="body2">{className}</Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {Math.round(prob * 100)}%
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: '100%',
                      height: 8,
                      bgcolor: 'grey.200',
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}
                  >
                    <Box
                      sx={{
                        width: `${prob * 100}%`,
                        height: '100%',
                        bgcolor: prob === predictionResult.confidence_score ? 'success.main' : 'grey.400',
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </Box>
                </Box>
              ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default XAIVisualization;
