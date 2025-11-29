/**
 * HomePage - Landing page for non-authenticated users
 * 로그인하지 않은 사용자를 위한 랜딩 페이지
 */
import { Link } from 'react-router-dom';

const HomePage = () => {
    return (
        <div style={styles.container}>
            {/* Hero Section */}
            <div style={styles.hero}>
                <div style={styles.heroContent}>
                    <h1 style={styles.heroTitle}>NeuroNova</h1>
                    <p style={styles.heroSubtitle}>뇌종양 진단 임상 의사결정 지원 시스템</p>
                    <p style={styles.heroDescription}>
                        AI 기반 뇌종양 진단으로 의료진의 정확한 의사결정을 지원합니다
                    </p>

                    {/* CTA Buttons */}
                    <div style={styles.ctaContainer}>
                        <Link to="/register" style={styles.primaryButton}>
                            회원가입
                        </Link>
                        <Link to="/login" style={styles.secondaryButton}>
                            로그인
                        </Link>
                    </div>
                </div>
            </div>

            {/* Features Section */}
            <div style={styles.features}>
                <h2 style={styles.sectionTitle}>주요 기능</h2>
                <div style={styles.featureGrid}>
                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>🧠</div>
                        <h3 style={styles.featureTitle}>AI 뇌종양 진단</h3>
                        <p style={styles.featureDescription}>
                            CT/MRI 영상을 분석하여 뇌종양을 정확하게 분류합니다
                        </p>
                    </div>

                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>📊</div>
                        <h3 style={styles.featureTitle}>설명 가능한 AI (XAI)</h3>
                        <p style={styles.featureDescription}>
                            Grad-CAM, SHAP을 통해 AI 판단 근거를 시각적으로 제공합니다
                        </p>
                    </div>

                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>🏥</div>
                        <h3 style={styles.featureTitle}>통합 EMR</h3>
                        <p style={styles.featureDescription}>
                            SOAP 차트, 처방전 관리 등 전자의무기록을 통합 관리합니다
                        </p>
                    </div>

                    <div style={styles.featureCard}>
                        <div style={styles.featureIcon}>🔬</div>
                        <h3 style={styles.featureTitle}>DICOM 뷰어</h3>
                        <p style={styles.featureDescription}>
                            Orthanc 기반 의료 영상 뷰어로 정밀한 분석이 가능합니다
                        </p>
                    </div>
                </div>
            </div>

            {/* About Section */}
            <div style={styles.about}>
                <h2 style={styles.sectionTitle}>NeuroNova 소개</h2>
                <div style={styles.aboutContent}>
                    <p style={styles.aboutText}>
                        NeuroNova는 의료진을 위한 뇌종양 진단 임상 의사결정 지원 시스템(CDSS)입니다.
                        최신 AI 기술을 활용하여 뇌종양의 조기 발견과 정확한 진단을 지원하며,
                        의료진의 의사결정을 돕습니다.
                    </p>
                    <div style={styles.aboutFeatures}>
                        <div style={styles.aboutFeature}>✓ Human-in-the-loop 워크플로우</div>
                        <div style={styles.aboutFeature}>✓ 데이터 보안 및 익명화</div>
                        <div style={styles.aboutFeature}>✓ 역할 기반 접근 제어 (RBAC)</div>
                        <div style={styles.aboutFeature}>✓ 실시간 알림 및 협업</div>
                    </div>
                </div>
            </div>

            {/* Patient App Section */}
            <div style={styles.patientApp}>
                <div style={styles.patientAppContent}>
                    <h2 style={styles.sectionTitle}>환자용 모바일 앱</h2>
                    <p style={styles.patientAppDescription}>
                        환자분들은 모바일 앱을 통해 예약, 진료 내역 조회, 알림 수신 등의 서비스를 이용하실 수 있습니다.
                    </p>

                    {/* QR Code Placeholder */}
                    <div style={styles.qrCodeContainer}>
                        <div style={styles.qrCode}>
                            <div style={styles.qrCodePlaceholder}>
                                QR Code
                                <br />
                                <span style={{ fontSize: '12px' }}>환자용 앱 다운로드</span>
                            </div>
                        </div>
                        <p style={styles.qrCodeText}>
                            QR 코드를 스캔하여 환자용 앱을 다운로드하세요
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div style={styles.footer}>
                <p style={styles.footerText}>
                    © 2025 NeuroNova. 뇌종양 진단 CDSS. All rights reserved.
                </p>
            </div>
        </div>
    );
};

// Styles
const styles = {
    container: {
        width: '100%',
        minHeight: '100vh',
    },
    hero: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: '#fff',
        padding: '80px 20px',
        textAlign: 'center',
    },
    heroContent: {
        maxWidth: '800px',
        margin: '0 auto',
    },
    heroTitle: {
        fontSize: '48px',
        fontWeight: 'bold',
        margin: '0 0 20px 0',
    },
    heroSubtitle: {
        fontSize: '24px',
        margin: '0 0 15px 0',
        opacity: 0.95,
    },
    heroDescription: {
        fontSize: '18px',
        margin: '0 0 40px 0',
        opacity: 0.9,
    },
    ctaContainer: {
        display: 'flex',
        gap: '20px',
        justifyContent: 'center',
        flexWrap: 'wrap',
    },
    primaryButton: {
        display: 'inline-block',
        padding: '16px 40px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#667eea',
        backgroundColor: '#fff',
        border: 'none',
        borderRadius: '8px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    secondaryButton: {
        display: 'inline-block',
        padding: '16px 40px',
        fontSize: '18px',
        fontWeight: '600',
        color: '#fff',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        border: '2px solid #fff',
        borderRadius: '8px',
        textDecoration: 'none',
        cursor: 'pointer',
        transition: 'transform 0.2s',
    },
    features: {
        padding: '80px 20px',
        backgroundColor: '#f9f9f9',
    },
    sectionTitle: {
        fontSize: '36px',
        fontWeight: 'bold',
        textAlign: 'center',
        margin: '0 0 50px 0',
        color: '#333',
    },
    featureGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    featureCard: {
        backgroundColor: '#fff',
        padding: '30px',
        borderRadius: '12px',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        textAlign: 'center',
    },
    featureIcon: {
        fontSize: '48px',
        marginBottom: '20px',
    },
    featureTitle: {
        fontSize: '20px',
        fontWeight: '600',
        margin: '0 0 15px 0',
        color: '#333',
    },
    featureDescription: {
        fontSize: '16px',
        color: '#666',
        lineHeight: '1.6',
    },
    about: {
        padding: '80px 20px',
        backgroundColor: '#fff',
    },
    aboutContent: {
        maxWidth: '800px',
        margin: '0 auto',
    },
    aboutText: {
        fontSize: '18px',
        color: '#555',
        lineHeight: '1.8',
        marginBottom: '30px',
        textAlign: 'center',
    },
    aboutFeatures: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '15px',
    },
    aboutFeature: {
        fontSize: '16px',
        color: '#667eea',
        fontWeight: '500',
        textAlign: 'center',
    },
    patientApp: {
        padding: '80px 20px',
        backgroundColor: '#f0f4ff',
    },
    patientAppContent: {
        maxWidth: '600px',
        margin: '0 auto',
        textAlign: 'center',
    },
    patientAppDescription: {
        fontSize: '16px',
        color: '#666',
        marginBottom: '40px',
        lineHeight: '1.6',
    },
    qrCodeContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
    },
    qrCode: {
        marginBottom: '20px',
    },
    qrCodePlaceholder: {
        width: '200px',
        height: '200px',
        backgroundColor: '#fff',
        border: '3px dashed #667eea',
        borderRadius: '12px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        fontWeight: '600',
        color: '#667eea',
    },
    qrCodeText: {
        fontSize: '14px',
        color: '#666',
    },
    footer: {
        padding: '30px 20px',
        backgroundColor: '#333',
        textAlign: 'center',
    },
    footerText: {
        color: '#fff',
        margin: 0,
        fontSize: '14px',
    },
};

export default HomePage;
