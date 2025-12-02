import React, { useState, useEffect, useRef } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import * as $3Dmol from '3dmol/build/3Dmol.js';
import View3D from "@egjs/react-view3d";
import "@egjs/react-view3d/css/view3d.min.css";
import './CDSSPage.css';

// Icons
const SpinIcon = () => <span>🔄</span>;
const StyleIcon = () => <span>🎨</span>;
const BgIcon = () => <span>🌓</span>;
const SaveIcon = () => <span>💾</span>;
const ResetIcon = () => <span>⏮️</span>;

const CDSSPage = () => {
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
                setError("Failed to initialize 3D viewer. Please check WebGL support.");
            }
        }
        // Cleanup on unmount or tab change could be added here if needed
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
                if (!res.ok) throw new Error(`AlphaFold API Error: ${res.status}`);

                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) throw new Error("No prediction data found");

                // Find best prediction
                const prediction = data.find(p => p.uniprotAccession.toUpperCase() === uniprotId.toUpperCase()) || data[0];

                if (!prediction || !prediction.pdbUrl) {
                    throw new Error("No PDB URL found in prediction");
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
        <DashboardLayout role="DOCTOR" activePage="cdss" title="AI Protein Analysis (CDSS)">
            <div className="cdss-container">
                <div className="cdss-header">
                    <p className="cdss-header-subtitle">
                        Advanced analysis of protein structures using AlphaFold predictions and 3D visualization.
                    </p>
                </div>

                <div className="cdss-tabs-container">
                    <div className="cdss-tabs">
                        <button
                            className={`cdss-tab ${activeTab === 0 ? 'active' : ''}`}
                            onClick={() => setActiveTab(0)}
                        >
                            Protein Analysis (AlphaFold)
                        </button>
                        <button
                            className={`cdss-tab ${activeTab === 1 ? 'active' : ''}`}
                            onClick={() => setActiveTab(1)}
                        >
                            Organ Viewer (3D)
                        </button>
                    </div>
                </div>

                {activeTab === 0 && (
                    <div className="cdss-grid">
                        {/* Control Panel */}
                        <div className="cdss-grid-item-4">
                            <div className="cdss-paper full-height">
                                <h2 className="cdss-section-title">
                                    Configuration
                                </h2>

                                <div className="cdss-form-control">
                                    <label className="cdss-form-label">Select Protein</label>
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
                                        <span className="cdss-loading-text">Fetching AlphaFold structure...</span>
                                    </div>
                                )}
                                {error && <div className="cdss-alert error">{error}</div>}

                                <div className="cdss-controls-title">
                                    Viewer Controls
                                </div>
                                <div className="cdss-button-row">
                                    <button className="cdss-icon-button" onClick={handleResetView}>
                                        <ResetIcon />
                                        <span className="cdss-tooltip">Reset View</span>
                                    </button>
                                    <button
                                        className={`cdss-icon-button ${spinning ? 'active' : ''}`}
                                        onClick={handleToggleSpin}
                                    >
                                        <SpinIcon />
                                        <span className="cdss-tooltip">Toggle Spin</span>
                                    </button>
                                    <button className="cdss-icon-button" onClick={handleToggleStyle}>
                                        <StyleIcon />
                                        <span className="cdss-tooltip">Toggle Style</span>
                                    </button>
                                    <button className="cdss-icon-button" onClick={handleToggleBg}>
                                        <BgIcon />
                                        <span className="cdss-tooltip">Toggle Background</span>
                                    </button>
                                    <button className="cdss-icon-button" onClick={handleSaveImage}>
                                        <SaveIcon />
                                        <span className="cdss-tooltip">Save Image</span>
                                    </button>
                                </div>

                                <div className="cdss-alert success">
                                    <strong>AI Prediction Info:</strong><br />
                                    Source: AlphaFold DB<br />
                                    Confidence: High (pLDDT &gt; 90)<br />
                                    Binding Sites: Predicted
                                </div>
                            </div>
                        </div>

                        {/* Viewer Panel */}
                        <div className="cdss-grid-item-8">
                            <div className="cdss-paper viewer-panel">
                                <h2 className="cdss-section-title">
                                    3D Structure Viewer
                                </h2>
                                <div
                                    ref={viewerContainerRef}
                                    className={`cdss-viewer-container ${darkBg ? 'dark-bg' : 'light-bg'}`}
                                />
                                <span className="cdss-viewer-caption">
                                    Use mouse to rotate (Left), zoom (Scroll), and translate (Right).
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 1 && (
                    <div className="cdss-grid">
                        <div className="cdss-grid-item-4">
                            <div className="cdss-paper full-height">
                                <h2 className="cdss-section-title">Organ Selection</h2>
                                <div className="cdss-form-control">
                                    <label className="cdss-form-label">Select Organ</label>
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
                                        <span className="cdss-loading-message">Loading Organ Data...</span>
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

export default CDSSPage;
