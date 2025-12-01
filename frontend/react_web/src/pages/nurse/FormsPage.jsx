import React, { useState } from 'react';
import {
    Container,
    Typography,
    Paper,
    Tabs,
    Tab,
    Box,
    Button,
    TextField,
    Grid
} from '@mui/material';

const FormsPage = () => {
    const [tabValue, setTabValue] = useState(0);

    const handleTabChange = (event, newValue) => {
        setTabValue(newValue);
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Medical Forms
            </Typography>

            <Paper sx={{ mb: 3 }}>
                <Tabs value={tabValue} onChange={handleTabChange} indicatorColor="primary" textColor="primary">
                    <Tab label="Vitals Recording" />
                    <Tab label="Document Upload" />
                </Tabs>
            </Paper>

            {tabValue === 0 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Record Vitals</Typography>
                    <Grid container spacing={3}>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Patient ID" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={6}>
                            <TextField label="Encounter ID" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Blood Pressure (Systolic)" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Blood Pressure (Diastolic)" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Heart Rate (bpm)" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Temperature (°C)" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="Respiratory Rate" fullWidth />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                            <TextField label="SpO2 (%)" fullWidth />
                        </Grid>
                        <Grid item xs={12}>
                            <Button variant="contained" color="primary">Save Vitals</Button>
                        </Grid>
                    </Grid>
                </Paper>
            )}

            {tabValue === 1 && (
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Upload Documents</Typography>
                    <Box sx={{ border: '2px dashed #ccc', p: 4, textAlign: 'center', mb: 2 }}>
                        <Typography>Drag and drop files here or click to select</Typography>
                        <Button variant="outlined" sx={{ mt: 2 }}>Select Files</Button>
                    </Box>
                    <TextField label="Document Type" select SelectProps={{ native: true }} fullWidth sx={{ mb: 2 }}>
                        <option>Lab Result</option>
                        <option>Imaging Report</option>
                        <option>Consent Form</option>
                    </TextField>
                    <Button variant="contained" color="primary">Upload</Button>
                </Paper>
            )}
        </Container>
    );
};

export default FormsPage;
