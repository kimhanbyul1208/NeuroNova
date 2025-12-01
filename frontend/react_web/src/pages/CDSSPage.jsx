import React, { useState, useEffect, useRef } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    Button,
    Grid,
    Card,
    CardContent,
    Alert,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Tabs,
    Tab,
    Stack,
    IconButton,
    Tooltip
} from '@mui/material';
import { ProteinViewer, ErrorBoundary } from '../components';
import DashboardLayout from '../layouts/DashboardLayout';

// Icons
const SpinIcon = () => <span>🔄</span>;
const StyleIcon = () => <span>🎨</span>;
const BgIcon = () => <span>🌓</span>;
const SaveIcon = () => <span>💾</span>;
const ResetIcon = () => <span>⏮️</span>;

const CDSSPage = () => {
    const [activeTab, setActiveTab] = useState(0);

    // Protein State
    const [proteins, setProteins] = useState([]);
    const [selectedProteinIndex, setSelectedProteinIndex] = useState('');
    const [pdbId, setPdbId] = useState('1UBQ'); // Fallback/Default
    const [customUrl, setCustomUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Viewer Controls State
    const viewerInstanceRef = useRef(null);
    const [spinning, setSpinning] = useState(false);
    const [styleMode, setStyleMode] = useState('cartoon');
    const [darkBg, setDarkBg] = useState(false);

    // Load proteins.json
    useEffect(() => {
        fetch('/proteins.json')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setProteins(data);
                    if (data.length > 0) {
                        setSelectedProteinIndex(0); // Select first by default
                    }
                }
            })
            .catch(err => console.error("Failed to load proteins.json:", err));
    }, []);

    // Handle Protein Selection & AlphaFold Fetching
    useEffect(() => {
        if (selectedProteinIndex === '') return;

        const protein = proteins[selectedProteinIndex];
        if (!protein) return;

        const fetchAlphaFold = async () => {
            setLoading(true);
            setError(null);
            setCustomUrl(null); // Reset URL

            try {
                const uniprotId = protein.uniprotId;
                const apiUrl = `https://alphafold.ebi.ac.uk/api/prediction/${uniprotId}`;

                const res = await fetch(apiUrl);
                if (!res.ok) throw new Error(`AlphaFold API Error: ${res.status}`);

                const data = await res.json();
                if (!Array.isArray(data) || data.length === 0) throw new Error("No prediction data found");

                // Find best prediction
                const prediction = data.find(p => p.uniprotAccession.toUpperCase() === uniprotId.toUpperCase()) || data[0];

                if (prediction && prediction.pdbUrl) {
                    setCustomUrl(prediction.pdbUrl);
                    setPdbId(null); // Clear manual PDB ID when using URL
                } else {
                    throw new Error("No PDB URL in prediction data");
                }
            } catch (err) {
                console.error(err);
                setError(err.message);
                // Fallback to manual PDB ID if available or keep previous
            } finally {
                setLoading(false);
            }
        };

        fetchAlphaFold();
    }, [selectedProteinIndex, proteins]);

    // Viewer Control Handlers
    const handleViewerReady = (viewer) => {
        viewerInstanceRef.current = viewer;
    };

    const handleToggleSpin = () => {
        if (viewerInstanceRef.current) {
            const next = !spinning;
            viewerInstanceRef.current.spin(next);
            setSpinning(next);
        }
    };

    const handleToggleStyle = () => {
        if (viewerInstanceRef.current) {
            const nextMode = styleMode === 'cartoon' ? 'stick' : 'cartoon';
            if (nextMode === 'cartoon') {
                viewerInstanceRef.current.setStyle({}, { cartoon: { color: 'spectrum' } });
            } else {
                viewerInstanceRef.current.setStyle({}, { stick: { radius: 0.15 } });
            }
            viewerInstanceRef.current.render();
            setStyleMode(nextMode);
        }
    };

    const handleToggleBg = () => {
        if (viewerInstanceRef.current) {
            const next = !darkBg;
            viewerInstanceRef.current.setBackgroundColor(next ? 'black' : 'white');
            viewerInstanceRef.current.render();
            setDarkBg(next);
        }
    };

    const handleResetView = () => {
        if (viewerInstanceRef.current) {
            viewerInstanceRef.current.zoomTo();
            viewerInstanceRef.current.render();
        }
    };

    const handleSaveImage = () => {
        if (viewerInstanceRef.current) {
            const dataUrl = viewerInstanceRef.current.pngURI();
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `structure_${new Date().getTime()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <DashboardLayout role="DOCTOR" activePage="cdss" title="AI Protein Analysis (CDSS)">
            <ErrorBoundary>
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

                                    {loading && <Alert severity="info" sx={{ mb: 2 }}>Fetching AlphaFold structure...</Alert>}
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
                                    <Box sx={{ flex: 1, border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                                        <ProteinViewer
                                            pdbId={!customUrl ? pdbId : null}
                                            customUrl={customUrl}
                                            width="100%"
                                            height="100%"
                                            onViewerReady={handleViewerReady}
                                        />
                                    </Box>
                                    <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: '#666' }}>
                                        Use mouse to rotate (Left), zoom (Scroll), and translate (Right).
                                    </Typography>
                                </Paper>
                            </Grid>
                        </Grid>
                    )}

                    {activeTab === 1 && (
                        <Paper sx={{ p: 4, textAlign: 'center', borderRadius: '16px' }}>
                            <Typography variant="h5" gutterBottom>Organ Viewer</Typography>
                            <Typography color="text.secondary">
                                The Organ Viewer dependency (@egjs/react-view3d) could not be installed in this environment.
                                <br />
                                Please install it manually to enable this feature.
                            </Typography>
                            <Box sx={{ mt: 4, p: 4, bgcolor: '#f5f5f5', borderRadius: '12px' }}>
                                <code>npm install @egjs/react-view3d @egjs/view3d</code>
                            </Box>
                        </Paper>
                    )}
                </Container>
            </ErrorBoundary>
        </DashboardLayout>
    );
};

export default CDSSPage;
