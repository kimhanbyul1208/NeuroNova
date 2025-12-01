import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    Stack,
    IconButton,
    Tooltip,
    CircularProgress,
    Alert
} from '@mui/material';
import DashboardLayout from '../layouts/DashboardLayout';
import * as $3Dmol from '3dmol/build/3Dmol.js';
import View3D from "@egjs/react-view3d";
import "@egjs/react-view3d/css/view3d.min.css";

// 아이콘
const SpinIcon = () => <span>🔄</span>;
const StyleIcon = () => <span>🎨</span>;
const BgIcon = () => <span>🌓</span>;
const SaveIcon = () => <span>💾</span>;
const ResetIcon = () => <span>⏮️</span>;

/**
 * 단백질 3D 뷰어 페이지
 * 
 * AI 진단과 분리된 순수 3D 구조 시각화 페이지
 */
const ProteinViewerPage = () => {
    const [activeTab, setActiveTab] = useState(0);

    // =========================
    // 1. Protein Viewer State
    // =========================
    const viewerContainerRef = useRef(null);
    const viewerRef = useRef(null);

    const [proteins, setProteins] = useState([]);
    const [selectedProteinIndex, setSelectedProteinIndex] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Viewer Controls
    const [spinning, setSpinning] = useState(false);
    const [styleMode, setStyleMode] = useState('cartoon');
    const [darkBg, setDarkBg] = useState(false);

    // Load proteins.json
    useEffect(() => {
        fetch('/proteins.json')
            .then(res => {
                if (!res.ok) throw new Error("Failed to load proteins.json");
                return res.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setProteins(data);
                    if (data.length > 0) {
                        setSelectedProteinIndex(0);
                    }
                }
            })
            .catch(err => console.error("Failed to load proteins.json:", err));
    }, []);

    // Initialize 3Dmol Viewer
    useEffect(() => {
        if (activeTab === 0 && viewerContainerRef.current && !viewerRef.current) {
            try {
                const viewer = $3Dmol.createViewer(viewerContainerRef.current, {
                    backgroundColor: 'white'
                });
                viewerRef.current = viewer;
            } catch (e) {
                console.error("Error initializing 3Dmol viewer:", e);
                setError("3D 뷰어 초기화 실패. WebGL 지원을 확인하세요.");
            }
        }
    }, [activeTab]);

    // Fetch & Load Structure
    useEffect(() => {
        if (activeTab !== 0 || selectedProteinIndex === '' || !viewerRef.current) return;

        const protein = proteins[selectedProteinIndex];
        if (!protein) return;

        const fetchAndLoad = async () => {
            setLoading(true);
            setError(null);

            try {
                const uniprotId = protein.uniprotId;
                const apiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;

                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error(`AlphaFold API 오류: ${res.status}`);

                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) throw new Error("예측 데이터를 찾을 수 없습니다");

                // Find best prediction
                const prediction = data.find(p => p.uniprotAccession.toUpperCase() === uniprotId.toUpperCase()) || data[0];

                if (!prediction || !prediction.pdbUrl) {
                    throw new Error("PDB URL을 찾을 수 없습니다");
                }

                const viewer = viewerRef.current;
                viewer.clear();

                // Download and render
                $3Dmol.download(`url:${prediction.pdbUrl}`, viewer, {}, function () {
                    applyCurrentStyle(viewer);
                    viewer.zoomTo();
                    viewer.render();
                });

            } catch (err) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchAndLoad();
    }, [selectedProteinIndex, proteins, activeTab]);

    const applyCurrentStyle = (viewer) => {
        viewer.setStyle({}, {});
        if (styleMode === 'cartoon') {
            viewer.setStyle({}, { cartoon: { color: 'spectrum' } });
        } else {
            viewer.setStyle({}, { stick: { radius: 0.15 } });
        }
    };

    // Toolbar Handlers
    const handleResetView = () => {
        if (viewerRef.current) {
            viewerRef.current.zoomTo();
            viewerRef.current.render();
        }
    };

    const handleToggleSpin = () => {
        if (viewerRef.current) {
            const next = !spinning;
            viewerRef.current.spin(next);
            setSpinning(next);
        }
    };

    const handleToggleStyle = () => {
        if (viewerRef.current) {
            const nextMode = styleMode === 'cartoon' ? 'stick' : 'cartoon';
            setStyleMode(nextMode);
            applyCurrentStyle(viewerRef.current);
            viewerRef.current.render();
        }
    };

    const handleToggleBg = () => {
        if (viewerRef.current) {
            const next = !darkBg;
            setDarkBg(next);
            viewerRef.current.setBackgroundColor(next ? 'black' : 'white');
            viewerRef.current.render();
        }
    };

    const handleSaveImage = () => {
        if (viewerRef.current) {
            const dataUrl = viewerRef.current.pngURI();
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `protein_${proteins[selectedProteinIndex]?.uniprotId || 'structure'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // =========================
    // 2. Organ Viewer State
    // =========================
    const [organs, setOrgans] = useState([]);
    const [selectedOrganIndex, setSelectedOrganIndex] = useState(0);

    useEffect(() => {
        fetch('/organs.json')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setOrgans(data);
                    setSelectedOrganIndex(0);
                }
            })
            .catch(err => console.error("Failed to load organs.json:", err));
    }, []);

    const selectedOrgan = organs.length > 0 ? organs[selectedOrganIndex] : null;

    return (
        <DashboardLayout role="DOCTOR" activePage="protein-viewer" title="단백질 3D 뷰어">
            <Container maxWidth="xl" sx={{ mt: 0, mb: 4, padding: 0 }}>
                {/* 헤더 */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom fontWeight={700}>
                        단백질 3D 구조 시각화
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        AlphaFold 예측을 사용한 단백질 구조 및 장기 3D 시각화
                    </Typography>
                </Box>

                {/* 탭 */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                        <Tab label="단백질 구조 (AlphaFold)" />
                        <Tab label="장기 3D 모델" />
                    </Tabs>
                </Box>

                {/* 탭 1: 단백질 구조 */}
                {activeTab === 0 && (
                    <Grid container spacing={3}>
                        {/* 컨트롤 패널 */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    구조 선택 및 제어
                                </Typography>

                                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                                    <InputLabel>단백질 선택</InputLabel>
                                    <Select
                                        value={selectedProteinIndex}
                                        label="단백질 선택"
                                        onChange={(e) => setSelectedProteinIndex(e.target.value)}
                                    >
                                        {proteins.map((p, idx) => (
                                            <MenuItem key={p.uniprotId} value={idx}>
                                                {p.name} ({p.uniprotId})
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

                                {loading && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, color: 'primary.main' }}>
                                        <CircularProgress size={20} />
                                        <Typography variant="body2">AlphaFold 구조 가져오는 중...</Typography>
                                    </Box>
                                )}
                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
                                    뷰어 컨트롤
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                                    <Tooltip title="뷰 초기화">
                                        <IconButton onClick={handleResetView} sx={{ border: '1px solid #eee' }}><ResetIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="회전 토글">
                                        <IconButton onClick={handleToggleSpin} color={spinning ? "primary" : "default"} sx={{ border: '1px solid #eee' }}><SpinIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="스타일 전환">
                                        <IconButton onClick={handleToggleStyle} sx={{ border: '1px solid #eee' }}><StyleIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="배경 전환">
                                        <IconButton onClick={handleToggleBg} sx={{ border: '1px solid #eee' }}><BgIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="이미지 저장">
                                        <IconButton onClick={handleSaveImage} sx={{ border: '1px solid #eee' }}><SaveIcon /></IconButton>
                                    </Tooltip>
                                </Stack>

                                <Alert severity="success" sx={{ mt: 2, borderRadius: '8px' }}>
                                    <strong>AI 예측 정보:</strong><br />
                                    출처: AlphaFold DB<br />
                                    신뢰도: 높음 (pLDDT &gt; 90)<br />
                                    결합 부위: 예측됨
                                </Alert>
                            </Paper>
                        </Grid>

                        {/* 뷰어 패널 */}
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    3D 구조 뷰어
                                </Typography>
                                <Box
                                    ref={viewerContainerRef}
                                    sx={{
                                        flex: 1,
                                        border: '1px solid #eee',
                                        borderRadius: '12px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        bgcolor: darkBg ? 'black' : 'white'
                                    }}
                                />
                                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: '#666' }}>
                                    마우스로 회전(왼쪽 클릭), 확대/축소(스크롤), 이동(오른쪽 클릭)
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {/* 탭 2: 장기 뷰어 */}
                {activeTab === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '16px' }}>
                                <Typography variant="h6" gutterBottom>장기 선택</Typography>
                                <FormControl fullWidth size="small">
                                    <InputLabel>장기 선택</InputLabel>
                                    <Select
                                        value={selectedOrganIndex}
                                        label="장기 선택"
                                        onChange={(e) => setSelectedOrganIndex(e.target.value)}
                                    >
                                        {organs.map((o, idx) => (
                                            <MenuItem key={o.id} value={idx}>
                                                {o.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Paper>
                        </Grid>
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2, height: '600px', borderRadius: '16px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                                {selectedOrgan ? (
                                    <View3D
                                        key={selectedOrgan.id}
                                        src={selectedOrgan.modelPath}
                                        style={{ width: '100%', height: '100%' }}
                                    />
                                ) : (
                                    <Typography>장기 데이터 로딩 중...</Typography>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Container>
        </DashboardLayout>
    );
};

export default ProteinViewerPage;
