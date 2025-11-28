import { CircularProgress, Box } from '@mui/material';

/**
 * 로딩 스피너 컴포넌트
 * @param {Object} props
 * @param {string} props.size - 스피너 크기 (small, medium, large)
 * @param {boolean} props.fullScreen - 전체 화면 중앙 표시 여부
 */
const LoadingSpinner = ({ size = 'medium', fullScreen = false }) => {
  const sizeMap = {
    small: 24,
    medium: 40,
    large: 60,
  };

  const spinner = <CircularProgress size={sizeMap[size]} />;

  if (fullScreen) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
          width: '100%',
        }}
      >
        {spinner}
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', padding: 2 }}>
      {spinner}
    </Box>
  );
};

export default LoadingSpinner;
