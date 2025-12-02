/**
 * About Page with QR Code for app download.
 */
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import './DashboardPage.css';

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
      icon: '🧠',
      title: 'AI 기반 뇌종양 진단',
      description: 'Glioma, Meningioma, Pituitary 3가지 뇌종양 자동 분류',
    },
    {
      icon: '👁️',
      title: '설명가능한 AI (XAI)',
      description: 'SHAP, Grad-CAM을 통한 AI 판단 근거 시각화',
    },
    {
      icon: '🏥',
      title: 'DICOM 뷰어',
      description: 'MRI/CT 의료 영상 조회 및 3D 렌더링',
    },
    {
      icon: '📅',
      title: '진료 예약 시스템',
      description: '환자 진료 예약 및 일정 관리',
    },
    {
      icon: '🔔',
      title: 'FCM 푸시 알림',
      description: '진료 일정, 검사 결과 실시간 알림',
    },
    {
      icon: '📋',
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
      <div className="page-container">
        {/* Header */}
        <div className="about-header">
          <h1 className="about-title-gradient">NeuroNova</h1>
          <h3 className="text-secondary" style={{ fontWeight: 400 }}>
            Neurology + Nova - 뇌과학의 새로운 별
          </h3>
          <p className="text-secondary" style={{ marginTop: '1rem', fontSize: '1rem' }}>
            AI 기반 뇌종양 임상 의사결정 지원 시스템 (CDSS)
          </p>
        </div>

        <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

        {/* 주요 기능 */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>주요 기능</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="flex" style={{ alignItems: 'center', marginBottom: '1rem' }}>
                  <div className="feature-icon">{feature.icon}</div>
                  <h3 style={{ fontWeight: 'bold', margin: 0 }}>{feature.title}</h3>
                </div>
                <p className="text-secondary" style={{ fontSize: '0.875rem', margin: 0 }}>
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

        {/* 앱 다운로드 섹션 */}
        <div className="app-download-section">
          <h2 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>환자용 모바일 앱</h2>
          <p style={{ marginBottom: '2rem' }}>QR 코드를 스캔하여 NeuroNova 앱을 다운로드하세요</p>

          <div className="flex-center" style={{ gap: '2rem', flexWrap: 'wrap' }}>
            {/* QR 코드 */}
            <div className="text-center">
              <div className="qr-code-box">
                <canvas ref={qrCanvasRef} />
              </div>
              <small style={{ display: 'block', marginTop: '0.5rem', color: '#666' }}>
                스마트폰 카메라로 스캔하세요
              </small>
            </div>

            {/* 앱 정보 */}
            <div style={{ textAlign: 'left' }}>
              <div style={{ marginBottom: '1rem' }}>
                <span style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  color: '#667eea',
                  borderRadius: '16px',
                  marginRight: '0.5rem',
                  fontSize: '0.875rem',
                  border: '1px solid #667eea'
                }}>
                  📱 Android
                </span>
                <span style={{
                  display: 'inline-block',
                  padding: '0.5rem 1rem',
                  backgroundColor: '#fff',
                  color: '#667eea',
                  borderRadius: '16px',
                  fontSize: '0.875rem',
                  border: '1px solid #667eea'
                }}>
                  🍎 iOS
                </span>
              </div>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>✓ 진료 예약 및 일정 확인</p>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>✓ 검사 결과 조회</p>
              <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>✓ 실시간 알림 수신</p>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>✓ 처방전 및 진료 요약</p>
            </div>
          </div>
        </div>

        <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

        {/* 기술 스택 */}
        <div style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontWeight: 'bold', marginBottom: '1.5rem' }}>기술 스택</h2>
          <div className="features-grid">
            {Object.entries(techStack).map(([category, items]) => (
              <div key={category} className="feature-card">
                <h3 style={{ fontWeight: 'bold', marginBottom: '1rem', color: '#667eea' }}>
                  {category}
                </h3>
                <div className="flex flex-wrap" style={{ gap: '0.5rem' }}>
                  {items.map((item) => (
                    <span
                      key={item}
                      style={{
                        padding: '0.25rem 0.75rem',
                        fontSize: '0.75rem',
                        border: '1px solid #ddd',
                        borderRadius: '12px',
                        backgroundColor: '#fff',
                      }}
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr style={{ margin: '3rem 0', border: 'none', borderTop: '1px solid #e0e0e0' }} />

        {/* 팀 정보 */}
        <div className="text-center">
          <h2 style={{ fontWeight: 'bold', marginBottom: '1rem' }}>Team NeuroNova</h2>
          <p className="text-secondary" style={{ marginBottom: '1rem' }}>
            뇌과학과 인공지능의 융합으로 더 나은 의료 서비스를 제공합니다
          </p>
          <p className="text-secondary" style={{ fontSize: '0.875rem' }}>
            GitHub:{' '}
            <a
              href="https://github.com/kimhanbyul1208/NeuroNova"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              https://github.com/kimhanbyul1208/NeuroNova
            </a>
          </p>
          <p className="text-secondary" style={{ fontSize: '0.875rem', marginTop: '1rem' }}>
            © 2025 NeuroNova. All rights reserved.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AboutPage;
