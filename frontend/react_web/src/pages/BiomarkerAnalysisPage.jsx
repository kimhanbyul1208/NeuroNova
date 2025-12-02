import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import BiomarkerClassificationCard from '../components/BiomarkerClassificationCard';
import ProteinButtonGrid from '../components/ProteinButtonGrid';
import ProteinDetailModal from '../components/ProteinDetailModal';
import XAIVisualization from '../components/XAIVisualization';
import './DashboardPage.css';
import './BiomarkerAnalysisPage.css';

/**
 * 바이오마커 분석 페이지
 * 
 * 30개 단백질 바이오마커를 분석하여 [코로나, 독감, 감기, 정상] 분류
 */
const BiomarkerAnalysisPage = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState(0);
    const [biomarkers, setBiomarkers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedProtein, setSelectedProtein] = useState(null);
    const [modalOpen, setModalOpen] = useState(false);

    // 목업 분석 결과 (실제로는 Flask API에서 가져옴)
    const [analysisResult, setAnalysisResult] = useState({
        category: 'COVID',
        confidence: 0.87,
        probabilities: {
            COVID: 0.87,
            FLU: 0.08,
            COLD: 0.03,
            NORMAL: 0.02
        },
        xai: {
            feature_importance: {
                'C-반응성 단백질 (CRP)': 0.92,
                '인터루킨-6 (IL-6)': 0.85,
                '페리틴 (Ferritin)': 0.78,
                'D-이량체 (D-Dimer)': 0.65
            }
        }
    });

    // 목업 단백질 측정값
    const [proteinValues, setProteinValues] = useState({
        protein_01: 45.2,  // CRP - 비정상 높음
        protein_02: 18.5,  // IL-6 - 비정상 높음
        protein_03: 12.3,  // TNF-α
        protein_04: 820,   // D-Dimer - 비정상 높음
        protein_05: 520,   // Ferritin - 비정상 높음
        protein_06: 8.2,
        protein_07: 45,
        protein_08: 5.5,
        protein_09: 1.8,   // PCT - 비정상 높음
        protein_10: 320,
        protein_11: 3.8,
        protein_12: 150,
        protein_13: 0.02,
        protein_14: 85,
        protein_15: 32,
        protein_16: 25,
        protein_17: 35,
        protein_18: 42,
        protein_19: 1100,
        protein_20: 180,
        protein_21: 15,
        protein_22: 1.0,
        protein_23: 95,
        protein_24: 14.5,
        protein_25: 9500,
        protein_26: 72,
        protein_27: 18,
        protein_28: 280000,
        protein_29: 35,
        protein_30: 12.5
    });

    // 바이오마커 데이터 로드
    useEffect(() => {
        fetch('/biomarkers.json')
            .then(res => res.json())
            .then(data => setBiomarkers(data))
            .catch(err => console.error('바이오마커 데이터 로드 실패:', err));
    }, []);

    // 단백질 버튼 클릭 핸들러
    const handleProteinClick = (protein) => {
        setSelectedProtein(protein);
        setModalOpen(true);
    };

    // 분석 실행 (목업)
    const handleAnalyze = () => {
        setLoading(true);
        // 실제로는 Flask API 호출
        // const response = await fetch('/api/ai/biomarker-analysis', { method: 'POST', body: proteinValues });

        setTimeout(() => {
            setLoading(false);
            setActiveTab(1); // 결과 탭으로 전환
        }, 2000);
    };

    // 상세 보기
    const handleViewDetails = () => {
        setActiveTab(2); // XAI 탭으로 전환
    };

    // 보고서 다운로드
    const handleDownloadReport = () => {
        alert('보고서 다운로드 기능은 추후 구현 예정입니다');
    };

    // 처방전 생성 페이지로 이동
    const handleGeneratePrescription = () => {
        navigate('/prescriptions', {
            state: {
                patient_id: 1, // 임시 환자 ID (실제 연동 시 변경 필요)
                medication_name: analysisResult.category === 'COVID' ? 'Paxlovid' :
                    analysisResult.category === 'FLU' ? 'Tamiflu' :
                        analysisResult.category === 'COLD' ? 'Tylenol' : '',
                instructions: `AI 진단 결과 (${analysisResult.category})에 따른 처방`,
                diagnosis_category: analysisResult.category
            }
        });
    };

    return (
        <DashboardLayout role="DOCTOR" activePage="biomarker" title="바이오마커 AI 진단">
            <div className="biomarker-container">
                {/* 헤더 */}
                <div className="biomarker-header">
                    <h1 className="biomarker-header-title">
                        30개 바이오마커 AI 분석
                    </h1>
                    <p className="biomarker-header-subtitle">
                        30개 단백질 바이오마커를 분석하여 코로나, 독감, 감기, 정상 중 하나로 분류합니다.
                    </p>
                </div>

                {/* 탭 */}
                <div className="biomarker-tabs-container">
                    <div className="biomarker-tabs">
                        <button
                            className={`biomarker-tab ${activeTab === 0 ? 'active' : ''}`}
                            onClick={() => setActiveTab(0)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                <polyline points="14 2 14 8 20 8"></polyline>
                                <line x1="12" y1="18" x2="12" y2="12"></line>
                                <line x1="9" y1="15" x2="15" y2="15"></line>
                            </svg>
                            데이터 입력
                        </button>
                        <button
                            className={`biomarker-tab ${activeTab === 1 ? 'active' : ''}`}
                            onClick={() => setActiveTab(1)}
                        >
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                <line x1="6" y1="20" x2="6" y2="14"></line>
                            </svg>
                            분석 결과
                        </button>
                        <button
                            className={`biomarker-tab ${activeTab === 2 ? 'active' : ''}`}
                            onClick={() => setActiveTab(2)}
                        >
                            XAI 설명
                        </button>
                    </div>
                </div>

                {/* 탭 1: 데이터 입력 */}
                {activeTab === 0 && (
                    <div>
                        <div className="biomarker-alert">
                            <strong>안내:</strong> 30개 바이오마커 데이터를 입력하거나 CSV 파일을 업로드하세요.
                            현재는 샘플 데이터가 자동으로 입력되어 있습니다.
                        </div>

                        <div className="biomarker-paper">
                            <div className="biomarker-button-row">
                                <button className="biomarker-button outlined">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                        <polyline points="14 2 14 8 20 8"></polyline>
                                        <line x1="12" y1="18" x2="12" y2="12"></line>
                                        <line x1="9" y1="15" x2="15" y2="15"></line>
                                    </svg>
                                    CSV 파일 업로드
                                </button>
                                <button
                                    className="biomarker-button contained"
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="biomarker-loading"></div>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <line x1="18" y1="20" x2="18" y2="10"></line>
                                                <line x1="12" y1="20" x2="12" y2="4"></line>
                                                <line x1="6" y1="20" x2="6" y2="14"></line>
                                            </svg>
                                            AI 분석 실행
                                        </>
                                    )}
                                </button>
                            </div>

                            <ProteinButtonGrid
                                proteins={biomarkers}
                                onProteinClick={handleProteinClick}
                                proteinValues={proteinValues}
                            />
                        </div>
                    </div>
                )}

                {/* 탭 2: 분석 결과 */}
                {activeTab === 1 && (
                    <div className="biomarker-grid">
                        <div className="biomarker-grid-item-5">
                            <BiomarkerClassificationCard
                                category={analysisResult.category}
                                confidence={analysisResult.confidence}
                                probabilities={analysisResult.probabilities}
                                onViewDetails={handleViewDetails}
                                onDownloadReport={handleDownloadReport}
                            />
                            <button
                                className="biomarker-prescription-button"
                                onClick={handleGeneratePrescription}
                            >
                                💊 처방전 생성 (Generate Prescription)
                            </button>
                        </div>
                        <div className="biomarker-grid-item-7">
                            <div className="biomarker-paper full-height">
                                <h2 className="biomarker-section-title">
                                    주요 바이오마커
                                </h2>
                                <p className="biomarker-section-subtitle">
                                    진단에 가장 큰 영향을 준 바이오마커들입니다.
                                </p>

                                <div className="biomarker-feature-list">
                                    {Object.entries(analysisResult.xai.feature_importance)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 8)
                                        .map(([name, importance]) => (
                                            <div key={name} className="biomarker-feature-item">
                                                <div className="biomarker-feature-header">
                                                    <span className="biomarker-feature-name">
                                                        {name}
                                                    </span>
                                                    <span className="biomarker-feature-value">
                                                        {Math.round(importance * 100)}%
                                                    </span>
                                                </div>
                                                <div className="biomarker-progress-bar">
                                                    <div
                                                        className="biomarker-progress-fill"
                                                        style={{ width: `${importance * 100}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))}
                                </div>

                                <button
                                    className="biomarker-button outlined full-width"
                                    onClick={() => setActiveTab(2)}
                                    style={{ marginTop: '24px' }}
                                >
                                    전체 XAI 설명 보기
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* 탭 3: XAI 설명 */}
                {activeTab === 2 && (
                    <div>
                        <XAIVisualization
                            predictionResult={{
                                prediction_class: analysisResult.category,
                                confidence_score: analysisResult.confidence,
                                probabilities: analysisResult.probabilities,
                                feature_importance: analysisResult.xai.feature_importance,
                                model_name: 'BiomarkerNet-v2.0',
                                model_version: '2.0.1',
                            }}
                        />
                    </div>
                )}
            </div>

            {/* 단백질 상세 모달 */}
            <ProteinDetailModal
                open={modalOpen}
                onClose={() => setModalOpen(false)}
                protein={selectedProtein}
                value={selectedProtein ? proteinValues[selectedProtein.id] : null}
                shapValue={
                    selectedProtein
                        ? analysisResult.xai.feature_importance[selectedProtein.name]
                        : null
                }
            />
        </DashboardLayout>
    );
};

export default BiomarkerAnalysisPage;
