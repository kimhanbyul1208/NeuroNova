import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  LinearProgress,
  Avatar
} from '@mui/material';
import BrainIcon from '@mui/icons-material/Psychology';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import { format } from 'date-fns';
import { TUMOR_TYPES } from '../utils/config';

/**
 * AI 진단 결과 카드 컴포넌트
 * @param {Object} props
 * @param {Object} props.result - 진단 결과 객체
 * @param {Function} props.onClick - 클릭 이벤트 핸들러
 */
const DiagnosisResultCard = ({ result, onClick = null }) => {
  // 신뢰도에 따른 색상
  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'error';
  };

  // 의사 피드백 아이콘 및 색상
  const getFeedbackConfig = (feedback) => {
    const configs = {
      'CORRECT': { icon: <CheckCircleIcon />, color: 'success', label: '정확함' },
      'INCORRECT': { icon: <ErrorIcon />, color: 'error', label: '부정확함' },
      'AMBIGUOUS': { icon: <HelpIcon />, color: 'warning', label: '애매함' },
    };
    return configs[feedback] || null;
  };

  const confidencePercent = Math.round(result.confidence_score * 100);
  const confidenceColor = getConfidenceColor(result.confidence_score);
  const feedbackConfig = result.doctor_feedback ? getFeedbackConfig(result.doctor_feedback) : null;

  // 날짜 포맷팅
  const confirmedDate = result.confirmed_at
    ? format(new Date(result.confirmed_at), 'yyyy-MM-dd HH:mm')
    : '검토 대기 중';

  return (
    <Card
      sx={{
        minWidth: 275,
        marginBottom: 2,
        cursor: onClick ? 'pointer' : 'default',
        '&:hover': onClick ? { boxShadow: 4 } : {}
      }}
      onClick={onClick}
    >
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
          <Avatar sx={{ marginRight: 2, bgcolor: 'primary.main' }}>
            <BrainIcon />
          </Avatar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6" component="div">
              {result.prediction_class}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              모델: {result.model_name || 'Unknown'} v{result.model_version || '1.0'}
            </Typography>
          </Box>
          {feedbackConfig && (
            <Chip
              icon={feedbackConfig.icon}
              label={feedbackConfig.label}
              color={feedbackConfig.color}
              size="small"
            />
          )}
        </Box>

        {/* 신뢰도 표시 */}
        <Box sx={{ marginBottom: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              신뢰도
            </Typography>
            <Typography variant="body2" color={`${confidenceColor}.main`} fontWeight="bold">
              {confidencePercent}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={confidencePercent}
            color={confidenceColor}
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* 확률 분포 */}
        {result.probabilities && (
          <Box sx={{ marginBottom: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              클래스별 확률:
            </Typography>
            {Object.entries(result.probabilities).map(([className, prob]) => (
              <Box key={className} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography variant="body2">{className}</Typography>
                <Typography variant="body2">{Math.round(prob * 100)}%</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* 의사 소견 */}
        {result.doctor_note && (
          <Box sx={{
            padding: 1,
            bgcolor: 'grey.100',
            borderRadius: 1,
            marginBottom: 1
          }}>
            <Typography variant="body2" color="text.secondary">
              의사 소견:
            </Typography>
            <Typography variant="body2">
              {result.doctor_note}
            </Typography>
          </Box>
        )}

        {/* 검토 일시 */}
        <Typography variant="caption" color="text.secondary">
          검토: {confirmedDate}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default DiagnosisResultCard;
