import React, { useState } from 'react';
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
    Alert
} from '@mui/material';
import { ProteinViewer, ErrorBoundary } from '../components';
import DashboardLayout from '../layouts/DashboardLayout';

const CDSSPage = () => {
    const [pdbId, setPdbId] = useState('1UBQ'); // Default PDB ID
    const [inputPdbId, setInputPdbId] = useState('1UBQ');

    const handleSearch = () => {
        if (inputPdbId.trim()) {
            setPdbId(inputPdbId.trim().toUpperCase());
        }
    };

    return (
        <DashboardLayout role="DOCTOR" activePage="cdss" title="AI Protein Analysis (CDSS)">
            <ErrorBoundary>
                <Container maxWidth="lg" sx={{ mt: 0, mb: 4, padding: 0 }}>
                    <Box sx={{ mb: 4 }}>
                        <Typography variant="body1" color="text.secondary">
                            Analyze protein structures for drug discovery and disease mechanism understanding.
                        </Typography>
                    </Box>

                    <Grid container spacing={3}>
                        {/* Control Panel */}
                        <Grid item xs={12} md={4}>
                            <Paper sx={{ p: 3, height: '100%', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    Configuration
                                </Typography>
                                <Box sx={{ mb: 3 }}>
                                    <TextField
                                        fullWidth
                                        label="PDB ID"
                                        value={inputPdbId}
                                        onChange={(e) => setInputPdbId(e.target.value)}
                                        placeholder="e.g., 1UBQ, 4HHB"
                                        helperText="Enter 4-character PDB ID"
                                        sx={{ mb: 2 }}
                                        size="small"
                                    />
                                    <Button
                                        variant="contained"
                                        fullWidth
                                        onClick={handleSearch}
                                        disabled={!inputPdbId}
                                        sx={{ backgroundColor: '#667eea', '&:hover': { backgroundColor: '#5a6fd6' } }}
                                    >
                                        Load Structure
                                    </Button>
                                </Box>

                                <Alert severity="info" sx={{ mb: 2, borderRadius: '8px' }}>
                                    <strong>Analysis Info:</strong><br />
                                    Target: {pdbId}<br />
                                    Method: X-RAY DIFFRACTION<br />
                                    Resolution: 1.8 Å
                                </Alert>

                                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
                                    AI Prediction
                                </Typography>
                                <Card variant="outlined" sx={{ borderRadius: '8px' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary">
                                            Binding Affinity: <strong>High</strong>
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            Confidence: <strong>94.5%</strong>
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Paper>
                        </Grid>

                        {/* Viewer Panel */}
                        <Grid item xs={12} md={8}>
                            <Paper sx={{ p: 2, height: '600px', display: 'flex', flexDirection: 'column', borderRadius: '16px', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
                                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                    3D Structure Viewer ({pdbId})
                                </Typography>
                                <Box sx={{ flex: 1, border: '1px solid #eee', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
                                    <ProteinViewer
                                        pdbId={pdbId}
                                        width="100%"
                                        height="100%"
                                    />
                                </Box>
                                <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: '#666' }}>
                                    Use mouse to rotate (Left), zoom (Scroll), and translate (Right).
                                </Typography>
                            </Paper>
                        </Grid>
                    </Grid>
                </Container>
            </ErrorBoundary>
        </DashboardLayout>
    );
};

export default CDSSPage;
