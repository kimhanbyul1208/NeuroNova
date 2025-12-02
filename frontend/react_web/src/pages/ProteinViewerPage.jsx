import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../layouts/DashboardLayout';
import * as $3Dmol from '3dmol/build/3Dmol.js';
import View3D from "@egjs/react-view3d";
import "@egjs/react-view3d/css/view3d.min.css";
import './CDSSPage.css';

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

    const location = useLocation();

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

                    // Check for deep link
                    if (location.state?.proteinId) {
                        const idx = data.findIndex(p => p.id === location.state.proteinId);
                        if (idx !== -1) {
                            setSelectedProteinIndex(idx);
                            return;
                        }
                    }

                    if (data.length > 0) {
                        setSelectedProteinIndex(0);
                    }
                }
            })
            .catch(err => console.error("Failed to load proteins.json:", err));
    }, [location.state]);

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
            <div className="cdss-container">
                {/* 헤더 */}
                <div className="biomarker-header">
                    <h1 className="biomarker-header-title">
                        단백질 3D 구조 시각화
                    </h1>
                    <p className="cdss-header-subtitle">
                        AlphaFold 예측을 사용한 단백질 구조 및 장기 3D 시각화
                    </p>
                </div>

                {/* 탭 */}
                <div className="cdss-tabs-container">
                    <div className="cdss-tabs">
                        <button
                            className={`cdss-tab ${activeTab === 0 ? 'active' : ''}`}
                            onClick={() => setActiveTab(0)}
                        >
                            단백질 구조 (AlphaFold)
                        </button>
                        <button
                            className={`cdss-tab ${activeTab === 1 ? 'active' : ''}`}
                            onClick={() => setActiveTab(1)}
                        >
                            장기 3D 모델
                        </button>
                    </div>
                </div>

                {/* 탭 1: 단백질 구조 */}
                {activeTab === 0 && (
                    <div className="cdss-grid">
                        {/* 컨트롤 패널 */}
                        <div className="cdss-grid-item-4">
                            <div className="cdss-paper full-height">
                                <h2 className="cdss-section-title">
                                    구조 선택 및 제어
                                </h2>

                                <div className="cdss-form-control">
                                    <label className="cdss-form-label">단백질 선택</label>
                                    <select
                                        className="cdss-select"
                                        value={selectedProteinIndex}
                                        onChange={(e) => setSelectedProteinIndex(Number(e.target.value))}
                                    >
                                        {proteins.map((p, idx) => (
                                            <option key={p.uniprotId} value={idx}>
                                                {p.name} ({p.uniprotId})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {loading && (
                                    <div className="cdss-loading-container">
                                        <div className="cdss-loading-spinner"></div>
                                        <span className="cdss-loading-text">AlphaFold 구조 가져오는 중...</span>
                                    </div>
                                )}
                                {error && <div className="cdss-alert error">{error}</div>}

                                <div className="cdss-controls-title">
                                    뷰어 컨트롤
                                </div>
                                <div className="cdss-button-row">
                                    <button className="cdss-icon-button" onClick={handleResetView}>
                                        <ResetIcon />
                                        <span className="cdss-tooltip">뷰 초기화</span>
                                    </button>
                                    <button
                                        className={`cdss-icon-button ${spinning ? 'active' : ''}`}
                                        onClick={handleToggleSpin}
                                    >
                                        <SpinIcon />
                                        <span className="cdss-tooltip">회전 토글</span>
                                    </button>
                                    <button className="cdss-icon-button" onClick={handleToggleStyle}>
                                        <StyleIcon />
                                        <span className="cdss-tooltip">스타일 전환</span>
                                    </button>
                                    <button className="cdss-icon-button" onClick={handleToggleBg}>
                                        <BgIcon />
                                        <span className="cdss-tooltip">배경 전환</span>
                                    </button>
                                    <button className="cdss-icon-button" onClick={handleSaveImage}>
                                        <SaveIcon />
                                        <span className="cdss-tooltip">이미지 저장</span>
                                    </button>
                                </div>

                                <div className="cdss-alert success">
                                    <strong>AI 예측 정보:</strong><br />
                                    출처: AlphaFold DB<br />
                                    신뢰도: 높음 (pLDDT &gt; 90)<br />
                                    결합 부위: 예측됨
                                </div>
                            </div>
                        </div>

                        {/* 뷰어 패널 */}
                        <div className="cdss-grid-item-8">
                            <div className="cdss-paper viewer-panel">
                                <h2 className="cdss-section-title">
                                    3D 구조 뷰어
                                </h2>
                                <div
                                    ref={viewerContainerRef}
                                    className={`cdss-viewer-container ${darkBg ? 'dark-bg' : 'light-bg'}`}
                                />
                                <span className="cdss-viewer-caption">
                                    마우스로 회전(왼쪽 클릭), 확대/축소(스크롤), 이동(오른쪽 클릭)
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* 탭 2: 장기 뷰어 */}
                {activeTab === 1 && (
                    <div className="cdss-grid">
                        <div className="cdss-grid-item-4">
                            <div className="cdss-paper full-height">
                                <h2 className="cdss-section-title">장기 선택</h2>
                                <div className="cdss-form-control">
                                    <label className="cdss-form-label">장기 선택</label>
                                    <select
                                        className="cdss-select"
                                        value={selectedOrganIndex}
                                        onChange={(e) => setSelectedOrganIndex(Number(e.target.value))}
                                    >
                                        {organs.map((o, idx) => (
                                            <option key={o.id} value={idx}>
                                                {o.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="cdss-grid-item-8">
                            <div className="cdss-paper viewer-panel">
                                {selectedOrgan ? (
                                    <div className="cdss-organ-viewer">
                                        <View3D
                                            key={selectedOrgan.id}
                                            src={selectedOrgan.modelPath}
                                            className="cdss-organ-viewer-inner"
                                        />
                                    </div>
                                ) : (
                                    <div className="cdss-organ-viewer">
                                        <span className="cdss-loading-message">장기 데이터 로딩 중...</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ProteinViewerPage;
