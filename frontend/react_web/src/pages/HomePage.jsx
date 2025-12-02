/**
 * HomePage - Landing page for non-authenticated users
 * 로그인하지 않은 사용자를 위한 랜딩 페이지
 */
import { Link } from 'react-router-dom';
import './HomePage.css';

const HomePage = () => {
    return (
        <div className="home-container">
            {/* Hero Section */}
            <div className="home-hero">
                <div className="home-hero-content">
                    <h1 className="home-hero-title">NeuroNova</h1>
                    <p className="home-hero-subtitle">뇌종양 진단 임상 의사결정 지원 시스템</p>
                    <p className="home-hero-description">
                        AI 기반 뇌종양 진단으로 의료진의 정확한 의사결정을 지원합니다
                    </p>

                    {/* CTA Buttons */}
                    <div className="home-cta-container">
                        <Link to="/register" className="home-button-primary">
                            회원가입
                        </Link>
                        <Link to="/login" className="home-button-secondary">
                            로그인
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div className="home-features">
                <h2 className="home-section-title">주요 기능</h2>
                <div className="home-feature-grid">
                    <div className="home-feature-card">
                        <div className="home-feature-icon">🧠</div>
                        <h3 className="home-feature-title">AI 뇌종양 진단</h3>
                        <p className="home-feature-description">
                            CT/MRI 영상을 분석하여 뇌종양을 정확하게 분류합니다
                        </p>
                    </div>

                    <div className="home-feature-card">
                        <div className="home-feature-icon">📊</div>
                        <h3 className="home-feature-title">설명 가능한 AI (XAI)</h3>
                        <p className="home-feature-description">
                            Grad-CAM, SHAP을 통해 AI 판단 근거를 시각적으로 제공합니다
                        </p>
                    </div>

                    <div className="home-feature-card">
                        <div className="home-feature-icon">🏥</div>
                        <h3 className="home-feature-title">통합 EMR</h3>
                        <p className="home-feature-description">
                            SOAP 차트, 처방전 관리 등 전자의무기록을 통합 관리합니다
                        </p>
                    </div>

                    <div className="home-feature-card">
                        <div className="home-feature-icon">🔬</div>
                        <h3 className="home-feature-title">DICOM 뷰어</h3>
                        <p className="home-feature-description">
                            Orthanc 기반 의료 영상 뷰어로 정밀한 분석이 가능합니다
                        </p>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div className="home-about">
                <h2 className="home-section-title">NeuroNova 소개</h2>
                <div className="home-about-content">
                    <p className="home-about-text">
                        NeuroNova는 의료진을 위한 뇌종양 진단 임상 의사결정 지원 시스템(CDSS)입니다.
                        최신 AI 기술을 활용하여 뇌종양의 조기 발견과 정확한 진단을 지원하며,
                        의료진의 의사결정을 돕습니다.
                    </p>
                    <div className="home-about-features">
                        <div className="home-about-feature">✓ Human-in-the-loop 워크플로우</div>
                        <div className="home-about-feature">✓ 데이터 보안 및 익명화</div>
                        <div className="home-about-feature">✓ 역할 기반 접근 제어 (RBAC)</div>
                        <div className="home-about-feature">✓ 실시간 알림 및 협업</div>
                    </div>
                </div>
            </div>

            {/* Patient App Section */}
            <div className="home-patient-app">
                <div className="home-patient-app-content">
                    <h2 className="home-section-title">환자용 모바일 앱</h2>
                    <p className="home-patient-app-description">
                        환자분들은 모바일 앱을 통해 예약, 진료 내역 조회, 알림 수신 등의 서비스를 이용하실 수 있습니다.
                    </p>

                    {/* QR Code Placeholder */}
                    <div className="home-qr-container">
                        <div className="home-qr-code">
                            <div className="home-qr-placeholder">
                                QR Code
                                <br />
                                <span style={{ fontSize: '12px' }}>환자용 앱 다운로드</span>
                            </div>
                        </div>
                        <p className="home-qr-text">
                            QR 코드를 스캔하여 환자용 앱을 다운로드하세요
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="home-footer">
                <p className="home-footer-text">
                    © 2025 NeuroNova. 뇌종양 진단 CDSS. All rights reserved.
                </p>
            </div>
        </div>
    );
};

export default HomePage;
