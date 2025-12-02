/**
 * Landing Page - 로그인 전 메인 화면
 */
import { Link } from 'react-router-dom';
import './LandingPage.css';

// Simple icon components
const MedicalServicesIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5zM19 19c0 .55-.45 1-1 1s-1-.45-1-1v-3H8V5h11v14z"/>
    <path d="M9 7h6v2H9zm7 0h2v2h-2zm-7 3h6v2H9zm7 0h2v2h-2z"/>
  </svg>
);

const SpeedIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.38 8.57l-1.23 1.85a8 8 0 0 1-.22 7.58H5.07A8 8 0 0 1 15.58 6.85l1.85-1.23A10 10 0 0 0 3.35 19a2 2 0 0 0 1.72 1h13.85a2 2 0 0 0 1.74-1 10 10 0 0 0-.27-10.44z"/>
    <path d="M10.59 15.41a2 2 0 0 0 2.83 0l5.66-8.49-8.49 5.66a2 2 0 0 0 0 2.83z"/>
  </svg>
);

const SecurityIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
  </svg>
);

const CloudQueueIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"/>
  </svg>
);

const LandingPage = () => {
  const features = [
    {
      icon: <MedicalServicesIcon />,
      title: 'AI 기반 뇌종양 진단',
      description: 'MRI 영상을 분석하여 뇌종양을 자동으로 감지하고 분류합니다.',
    },
    {
      icon: <SpeedIcon />,
      title: '빠른 진단 결과',
      description: '기존 대비 50% 빠른 진단으로 신속한 치료 계획 수립을 지원합니다.',
    },
    {
      icon: <SecurityIcon />,
      title: '의료 데이터 보안',
      description: 'HIPAA 준수 및 엔드투엔드 암호화로 환자 정보를 안전하게 보호합니다.',
    },
    {
      icon: <CloudQueueIcon />,
      title: '클라우드 기반 시스템',
      description: '언제 어디서나 접근 가능한 클라우드 PACS 및 EMR 통합.',
    },
  ];

  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Hero Section */}
        <div className="landing-hero">
          <h1 className="landing-title">
            NeuroNova
          </h1>

          <p className="landing-subtitle">
            AI 기반 뇌종양 임상 의사결정 지원 시스템 (CDSS)
          </p>

          <p className="landing-description">
            인공지능이 MRI 영상을 분석하여 뇌종양을 조기 발견하고,
            <br />
            의료진의 정확하고 신속한 진단을 지원합니다.
          </p>

          <div className="landing-buttons">
            <Link to="/login" className="landing-button primary">
              의료진 로그인
            </Link>
            <Link to="/register" className="landing-button outlined">
              회원가입
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="landing-features">
          <h2 className="landing-features-title">
            주요 기능
          </h2>

          <div className="landing-features-grid">
            {features.map((feature, index) => (
              <div className="landing-feature-card" key={index}>
                <div className="landing-feature-icon">{feature.icon}</div>
                <h3 className="landing-feature-title">
                  {feature.title}
                </h3>
                <p className="landing-feature-description">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="landing-cta">
          <h2 className="landing-cta-title">
            환자를 위한 모바일 앱
          </h2>
          <p className="landing-cta-description">
            진료 예약, 결과 조회, 알림 수신 등 편리한 기능을
            <br />
            모바일 앱에서 이용하실 수 있습니다.
          </p>
          <Link to="/about" className="landing-cta-button">
            앱 다운로드 안내
          </Link>
        </div>

        {/* Footer */}
        <div className="landing-footer">
          <p className="landing-footer-text">
            © 2025 NeuroNova. All rights reserved.
          </p>
          <div className="landing-footer-links">
            <Link to="/about" className="landing-footer-link">
              About Us
            </Link>
            <Link to="/contact" className="landing-footer-link">
              Contact
            </Link>
            <Link to="/privacy" className="landing-footer-link">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
