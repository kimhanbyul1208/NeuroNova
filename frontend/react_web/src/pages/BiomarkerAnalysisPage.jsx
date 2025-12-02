import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import BiomarkerClassificationCard from '../components/BiomarkerClassificationCard';
import ProteinButtonGrid from '../components/ProteinButtonGrid';
import ProteinDetailModal from '../components/ProteinDetailModal';
import XAIVisualization from '../components/XAIVisualization';
import './DashboardPage.css';

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
            <Container maxWidth="xl" sx={{ mt: 0, mb: 4, padding: 0 }}>
                {/* 헤더 */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom fontWeight={700}>
                        30개 바이오마커 AI 분석
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        30개 단백질 바이오마커를 분석하여 코로나, 독감, 감기, 정상 중 하나로 분류합니다.
                    </Typography>
                </Box>

                {/* 탭 */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                        <Tab label="데이터 입력" icon={<UploadFileIcon />} iconPosition="start" />
                        <Tab label="분석 결과" icon={<AnalyticsIcon />} iconPosition="start" />
                        <Tab label="XAI 설명" />
                    </Tabs>
                </Box>

                {/* 탭 1: 데이터 입력 */}
                {activeTab === 0 && (
                    <Box>
                        <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                            <strong>안내:</strong> 30개 바이오마커 데이터를 입력하거나 CSV 파일을 업로드하세요.
                            현재는 샘플 데이터가 자동으로 입력되어 있습니다.
                        </Alert>

                        <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
                            <Stack direction="row" spacing={2} mb={3}>
                                <Button
                                    variant="outlined"
                                    startIcon={<UploadFileIcon />}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    CSV 파일 업로드
                                </Button>
                                <Button
                                    variant="contained"
                                    startIcon={<AnalyticsIcon />}
                                    onClick={handleAnalyze}
                                    disabled={loading}
                                    sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    {loading ? <CircularProgress size={24} /> : 'AI 분석 실행'}
                                </Button>
                            </Stack>

                            <ProteinButtonGrid
                                proteins={biomarkers}
                                onProteinClick={handleProteinClick}
                                proteinValues={proteinValues}
                            />
                        </Paper>
                    </Box>
                )}

                {/* 탭 2: 분석 결과 */}
                {activeTab === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} lg={5}>
                            <BiomarkerClassificationCard
                                category={analysisResult.category}
                                confidence={analysisResult.confidence}
                                probabilities={analysisResult.probabilities}
                                onViewDetails={handleViewDetails}
                                onDownloadReport={handleDownloadReport}
                            />
                            <Button
                                variant="contained"
                                color="primary"
                                fullWidth
                                size="large"
                                sx={{ mt: 2, borderRadius: 3, py: 1.5, fontWeight: 700, fontSize: '1.1rem' }}
                                onClick={handleGeneratePrescription}
                            >
                                💊 처방전 생성 (Generate Prescription)
                            </Button>
                        </Grid>
                        <Grid item xs={12} lg={7}>
                            <Paper sx={{ p: 3, borderRadius: 3, height: '100%' }}>
                                <Typography variant="h6" gutterBottom fontWeight={600}>
                                    주요 바이오마커
                                </Typography>
                                <Typography variant="body2" color="text.secondary" paragraph>
                                    진단에 가장 큰 영향을 준 바이오마커들입니다.
                                </Typography>

                                <Stack spacing={2}>
                                    {Object.entries(analysisResult.xai.feature_importance)
                                        .sort((a, b) => b[1] - a[1])
                                        .slice(0, 8)
                                        .map(([name, importance]) => (
                                            <Box key={name}>
                                                <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                                    <Typography variant="body2" fontWeight={600}>
                                                        {name}
                                                    </Typography>
                                                    <Typography variant="body2" color="primary.main" fontWeight={700}>
                                                        {Math.round(importance * 100)}%
                                                    </Typography>
                                                </Stack>
                                                <Box
                                                    sx={{
                                                        width: '100%',
                                                        height: 8,
                                                        bgcolor: '#f3f4f6',
                                                        borderRadius: 1,
                                                        overflow: 'hidden',
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            width: `${importance * 100}%`,
                                                            height: '100%',
                                                            bgcolor: 'primary.main',
                                                            borderRadius: 1,
                                                            transition: 'width 0.6s ease',
                                                        }}
                                                    />
                                                </Box>
                                            </Box>
                                        ))}
                                </Stack>

                                <Button
                                    variant="outlined"
                                    fullWidth
                                    onClick={() => setActiveTab(2)}
                                    sx={{ mt: 3, borderRadius: 2, textTransform: 'none', fontWeight: 600 }}
                                >
                                    전체 XAI 설명 보기
                                </Button>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* 탭 3: XAI 설명 */}
                {activeTab === 2 && (
                    <Box>
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
                    </Box>
                )}
            </Container>

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
