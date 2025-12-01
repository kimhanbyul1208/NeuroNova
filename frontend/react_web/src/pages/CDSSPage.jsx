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
import { ProteinViewer, LoadingSpinner } from '../components';

const CDSSPage = () => {
    const [pdbId, setPdbId] = useState('1UBQ'); // Default PDB ID
    const [inputPdbId, setInputPdbId] = useState('1UBQ');
    const [loading, setLoading] = useState(false);

    const handleSearch = () => {
        if (inputPdbId.trim()) {
            setPdbId(inputPdbId.trim().toUpperCase());
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    AI Protein Analysis (CDSS)
                </Typography>
                <Typography variant="body1" color="text.secondary">
                    Analyze protein structures for drug discovery and disease mechanism understanding.
                </Typography>
            </Box>

            <Grid container spacing={3}>
                {/* Control Panel */}
                <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
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
                            />
                            <Button
                                variant="contained"
                                fullWidth
                                onClick={handleSearch}
                                disabled={!inputPdbId}
                            >
                                Load Structure
                            </Button>
                        </Box>

                        <Alert severity="info" sx={{ mb: 2 }}>
                            <strong>Analysis Info:</strong><br />
                            Target: {pdbId}<br />
                            Method: X-RAY DIFFRACTION<br />
                            Resolution: 1.8 Å
                        </Alert>

                        <Typography variant="subtitle2" gutterBottom>
                            AI Prediction
                        </Typography>
                        <Card variant="outlined">
                            <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                    Binding Affinity: High
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    Confidence: 94.5%
                                </Typography>
                            </CardContent>
                        </Card>
                    </Paper>
                </Grid>

                {/* Viewer Panel */}
                <Grid item xs={12} md={8}>
                    <Paper sx={{ p: 2, height: '500px', display: 'flex', flexDirection: 'column' }}>
                        <Typography variant="h6" gutterBottom>
                            3D Structure Viewer ({pdbId})
                        </Typography>
                        <Box sx={{ flex: 1, border: '1px solid #eee', borderRadius: 1, overflow: 'hidden' }}>
                            <ProteinViewer
                                pdbId={pdbId}
                                width="100%"
                                height="100%"
                            />
                        </Box>
                        <Typography variant="caption" sx={{ mt: 1, display: 'block', textAlign: 'center', color: '#666' }}>
                            Use mouse to rotate, scroll to zoom.
                        </Typography>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default CDSSPage;
