/**
 * About Page with QR Code for app download.
 */
import { useEffect, useRef } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Chip,
  Divider,
  Paper,
} from '@mui/material';
import {
  Psychology,
  Visibility,
  MedicalInformation,
  CalendarToday,
  Notifications,
  Android,
  Apple,
} from '@mui/icons-material';
import QRCode from 'qrcode';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';

const AboutPage = () => {
  const { user } = useAuth();
  const qrCanvasRef = useRef(null);

  useEffect(() => {
    // QR 코드 생성 (실제 앱 다운로드 URL로 변경 필요)
    if (qrCanvasRef.current) {
      const appDownloadUrl = 'https://github.com/kimhanbyul1208/NeuroNova/releases'; // 실제 앱 다운로드 URL
      QRCode.toCanvas(qrCanvasRef.current, appDownloadUrl, {
        width: 200,
        margin: 2,
        color: {
          dark: '#2196F3',
          light: '#FFFFFF',
        },
      });
    }
  }, []);

  const features = [
    {
      icon: <Psychology />,
      title: 'AI 기반 뇌종양 진단',
      description: 'Glioma, Meningioma, Pituitary 3가지 뇌종양 자동 분류',
    },
    {
      icon: <Visibility />,
      title: '설명가능한 AI (XAI)',
      description: 'SHAP, Grad-CAM을 통한 AI 판단 근거 시각화',
    },
    {
      icon: <MedicalInformation />,
      title: 'DICOM 뷰어',
      description: 'MRI/CT 의료 영상 조회 및 3D 렌더링',
    },
    {
      icon: <CalendarToday />,
      title: '진료 예약 시스템',
      description: '환자 진료 예약 및 일정 관리',
    },
    {
      icon: <Notifications />,
      title: 'FCM 푸시 알림',
      description: '진료 일정, 검사 결과 실시간 알림',
    },
    {
      icon: <MedicalInformation />,
      title: 'EMR 통합',
      description: 'SOAP 차트, 처방전 관리',
    },
  ];

  const techStack = {
    'Frontend': ['React (웹)', 'Flutter (모바일)', 'Material-UI'],
    'Backend': ['Django REST API', 'Flask (AI 추론)', 'Celery'],
    'Database': ['MySQL', 'Redis', 'SQLCipher'],
    'AI/ML': ['TensorFlow', 'ONNX Runtime', 'SHAP'],
    'Infrastructure': ['Docker', 'Nginx', 'Firebase'],
    'Medical Imaging': ['Orthanc DICOM Server', 'CornerstoneJS'],
  };

  return (
    <DashboardLayout role={user?.role} activePage="about" title="About Us">
      <Container maxWidth="lg" sx={{ py: 6 }}>
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography
            variant="h3"
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
          <Typography variant="h6" color="text.secondary">
            Neurology + Nova - 뇌과학의 새로운 별
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
            AI 기반 뇌종양 임상 의사결정 지원 시스템 (CDSS)
          </Typography>
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* 주요 기능 */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            주요 기능
          </Typography>
          <Grid container spacing={3}>
            {features.map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Box sx={{ color: 'primary.main', mr: 1 }}>{feature.icon}</Box>
                      <Typography variant="h6" fontWeight="bold">
                        {feature.title}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* 앱 다운로드 섹션 */}
        <Paper
          elevation={3}
          sx={{
            p: 4,
            mb: 6,
            textAlign: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
          }}
        >
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            환자용 모바일 앱
          </Typography>
          <Typography variant="body1" sx={{ mb: 3 }}>
            QR 코드를 스캔하여 NeuroNova 앱을 다운로드하세요
          </Typography>

          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: 4,
              flexWrap: 'wrap',
            }}
          >
            {/* QR 코드 */}
            <Box>
              <Paper
                elevation={6}
                sx={{
                  p: 2,
                  bgcolor: 'white',
                  borderRadius: 2,
                  display: 'inline-block',
                }}
              >
                <canvas ref={qrCanvasRef} />
              </Paper>
              <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                스마트폰 카메라로 스캔하세요
              </Typography>
            </Box>

            {/* 앱 정보 */}
            <Box sx={{ textAlign: 'left' }}>
              <Box sx={{ mb: 2 }}>
                <Chip
                  icon={<Android />}
                  label="Android"
                  sx={{ bgcolor: 'white', color: 'primary.main', mr: 1 }}
                />
                <Chip
                  icon={<Apple />}
                  label="iOS"
                  sx={{ bgcolor: 'white', color: 'primary.main' }}
                />
              </Box>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✓ 진료 예약 및 일정 확인
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✓ 검사 결과 조회
              </Typography>
              <Typography variant="body2" sx={{ mb: 1 }}>
                ✓ 실시간 알림 수신
              </Typography>
              <Typography variant="body2">
                ✓ 처방전 및 진료 요약
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Divider sx={{ mb: 6 }} />

        {/* 기술 스택 */}
        <Box sx={{ mb: 6 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
            기술 스택
          </Typography>
          <Grid container spacing={2}>
            {Object.entries(techStack).map(([category, items]) => (
              <Grid item xs={12} sm={6} md={4} key={category}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                      {category}
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {items.map((item) => (
                        <Chip
                          key={item}
                          label={item}
                          size="small"
                          variant="outlined"
                        />
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        <Divider sx={{ mb: 6 }} />

        {/* 팀 정보 */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Team NeuroNova
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            뇌과학과 인공지능의 융합으로 더 나은 의료 서비스를 제공합니다
          </Typography>
          <Typography variant="body2" color="text.secondary">
            GitHub:{' '}
            <a
              href="https://github.com/kimhanbyul1208/NeuroNova"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#2196F3', textDecoration: 'none' }}
            >
              https://github.com/kimhanbyul1208/NeuroNova
            </a>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            © 2025 NeuroNova. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </DashboardLayout>
  );
};

export default AboutPage;
