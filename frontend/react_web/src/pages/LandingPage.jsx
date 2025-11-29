/**
 * Landing Page - 로그인 전 메인 화면
 */
import { Link } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
} from '@mui/material';
import {
  MedicalServices,
  Security,
  Speed,
  CloudQueue,
} from '@mui/icons-material';

const LandingPage = () => {
  const features = [
    {
      icon: <MedicalServices sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: 'AI 기반 뇌종양 진단',
      description: 'MRI 영상을 분석하여 뇌종양을 자동으로 감지하고 분류합니다.',
    },
    {
      icon: <Speed sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: '빠른 진단 결과',
      description: '기존 대비 50% 빠른 진단으로 신속한 치료 계획 수립을 지원합니다.',
    },
    {
      icon: <Security sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: '의료 데이터 보안',
      description: 'HIPAA 준수 및 엔드투엔드 암호화로 환자 정보를 안전하게 보호합니다.',
    },
    {
      icon: <CloudQueue sx={{ fontSize: 48, color: 'primary.main' }} />,
      title: '클라우드 기반 시스템',
      description: '언제 어디서나 접근 가능한 클라우드 PACS 및 EMR 통합.',
    },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Hero Section */}
      <Container maxWidth="lg">
        <Box
          sx={{
            pt: 12,
            pb: 8,
            textAlign: 'center',
          }}
        >
          <Typography
            component="h1"
            variant="h2"
            fontWeight="bold"
            gutterBottom
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            NeuroNova
          </Typography>

          <Typography
            variant="h5"
            color="text.secondary"
            paragraph
            sx={{ mt: 2, mb: 4 }}
          >
            AI 기반 뇌종양 임상 의사결정 지원 시스템 (CDSS)
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            인공지능이 MRI 영상을 분석하여 뇌종양을 조기 발견하고,
            <br />
            의료진의 정확하고 신속한 진단을 지원합니다.
          </Typography>

          <Box sx={{ mt: 4 }}>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              size="large"
              sx={{ mr: 2, px: 4, py: 1.5 }}
            >
              의료진 로그인
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="outlined"
              size="large"
              sx={{ px: 4, py: 1.5 }}
            >
              회원가입
            </Button>
          </Box>
        </Box>

        {/* Features Section */}
        <Box sx={{ py: 8 }}>
          <Typography
            variant="h4"
            align="center"
            fontWeight="bold"
            gutterBottom
            sx={{ mb: 6 }}
          >
            주요 기능
          </Typography>

          <Grid container spacing={4}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    p: 3,
                    transition: 'transform 0.3s',
                    '&:hover': {
                      transform: 'translateY(-8px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box sx={{ mb: 2 }}>{feature.icon}</Box>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* CTA Section */}
        <Box
          sx={{
            py: 8,
            textAlign: 'center',
            bgcolor: 'primary.main',
            color: 'white',
            borderRadius: 2,
            my: 8,
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            환자를 위한 모바일 앱
          </Typography>
          <Typography variant="body1" paragraph sx={{ mt: 2 }}>
            진료 예약, 결과 조회, 알림 수신 등 편리한 기능을
            <br />
            모바일 앱에서 이용하실 수 있습니다.
          </Typography>
          <Button
            component={Link}
            to="/about"
            variant="contained"
            color="secondary"
            size="large"
            sx={{ mt: 2 }}
          >
            앱 다운로드 안내
          </Button>
        </Box>

        {/* Footer */}
        <Box
          sx={{
            py: 4,
            textAlign: 'center',
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Typography variant="body2" color="text.secondary">
            © 2025 NeuroNova. All rights reserved.
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Link
              to="/about"
              style={{ margin: '0 16px', color: 'inherit', textDecoration: 'none' }}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              style={{ margin: '0 16px', color: 'inherit', textDecoration: 'none' }}
            >
              Contact
            </Link>
            <Link
              to="/privacy"
              style={{ margin: '0 16px', color: 'inherit', textDecoration: 'none' }}
            >
              Privacy Policy
            </Link>
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default LandingPage;
