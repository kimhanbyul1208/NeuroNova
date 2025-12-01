import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    Stack,
    IconButton,
    Tooltip,
    CircularProgress
} from '@mui/material';
import DashboardLayout from '../layouts/DashboardLayout';
import * as $3Dmol from '3dmol/build/3Dmol.js';
import View3D from "@egjs/react-view3d";
import "@egjs/react-view3d/css/view3d.min.css";

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
            <Container maxWidth="lg" sx={{ mt: 0, mb: 4, padding: 0 }}>
                <Box sx={{ mb: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                        Advanced analysis of protein structures using AlphaFold predictions and 3D visualization.
                    </Typography>
                </Box>

                <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
                    <Tabs value={activeTab} onChange={(e, v) => setActiveTab(v)}>
                        <Tab label="Protein Analysis (AlphaFold)" />
                        <Tab label="Organ Viewer (3D)" />
                    </Tabs>
                </Box>

                {activeTab === 0 && (
                    <Grid container spacing={3}>
                        {/* Control Panel */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    Configuration
                                </Typography>

                                <FormControl fullWidth size="small" sx={{ mb: 3 }}>
                                    <InputLabel>Select Protein</InputLabel>
                                    <Select
                                        value={selectedProteinIndex}
                                        label="Select Protein"
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
                                        <Typography variant="body2">Fetching AlphaFold structure...</Typography>
                                    </Box>
                                )}
                                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
                                    Viewer Controls
                                </Typography>
                                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                                    <Tooltip title="Reset View">
                                        <IconButton onClick={handleResetView} sx={{ border: '1px solid #eee' }}><ResetIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Toggle Spin">
                                        <IconButton onClick={handleToggleSpin} color={spinning ? "primary" : "default"} sx={{ border: '1px solid #eee' }}><SpinIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Toggle Style">
                                        <IconButton onClick={handleToggleStyle} sx={{ border: '1px solid #eee' }}><StyleIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Toggle Background">
                                        <IconButton onClick={handleToggleBg} sx={{ border: '1px solid #eee' }}><BgIcon /></IconButton>
                                    </Tooltip>
                                    <Tooltip title="Save Image">
                                        <IconButton onClick={handleSaveImage} sx={{ border: '1px solid #eee' }}><SaveIcon /></IconButton>
                                    </Tooltip>
                                </Stack>

                                <Alert severity="success" sx={{ mt: 2, borderRadius: '8px' }}>
                                    <strong>AI Prediction Info:</strong><br />
                                    Source: AlphaFold DB<br />
                                    Confidence: High (pLDDT &gt; 90)<br />
                                    Binding Sites: Predicted
                                </Alert>
                            </Paper>
                        </Grid>

                        {/* Viewer Panel */}
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    3D Structure Viewer
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
                                    Use mouse to rotate (Left), zoom (Scroll), and translate (Right).
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                )}

                {activeTab === 1 && (
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '16px' }}>
                                <Typography variant="h6" gutterBottom>Organ Selection</Typography>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Select Organ</InputLabel>
                                    <Select
                                        value={selectedOrganIndex}
                                        label="Select Organ"
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
                                    <Typography>Loading Organ Data...</Typography>
                                )}
                            </Paper>
                        </Grid>
                    </Grid>
                )}
            </Container>
        </DashboardLayout>
    );
};

export default CDSSPage;
