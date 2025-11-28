import { Alert, AlertTitle, Button, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * 에러 알림 컴포넌트
 * @param {Object} props
 * @param {string} props.message - 에러 메시지
 * @param {string} props.title - 에러 제목
 * @param {Function} props.onRetry - 재시도 콜백 함수
 * @param {string} props.severity - 알림 심각도 (error, warning, info)
 */
const ErrorAlert = ({
  message = '오류가 발생했습니다.',
  title = '오류',
  onRetry = null,
  severity = 'error'
}) => {
  return (
    <Box sx={{ padding: 2 }}>
      <Alert
        severity={severity}
        action={
          onRetry && (
            <Button
              color="inherit"
              size="small"
              onClick={onRetry}
              startIcon={<RefreshIcon />}
            >
              재시도
            </Button>
          )
        }
      >
        <AlertTitle>{title}</AlertTitle>
        {message}
      </Alert>
    </Box>
  );
};

export default ErrorAlert;
