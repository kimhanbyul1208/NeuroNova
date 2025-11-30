import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Grid,
    MenuItem,
    TextField,
    FormControlLabel,
    Checkbox,
    Alert,
    CircularProgress,
    Autocomplete
} from '@mui/material';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

const AssignDoctorModal = ({ open, onClose, patient, onAssignSuccess }) => {
    const [doctors, setDoctors] = useState([]);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [isPrimary, setIsPrimary] = useState(false);
    const [loading, setLoading] = useState(false);
    const [fetchingDoctors, setFetchingDoctors] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (open) {
            fetchDoctors();
            setSelectedDoctor(null);
            setIsPrimary(false);
            setError(null);
        }
    }, [open]);

    const fetchDoctors = async () => {
        try {
            setFetchingDoctors(true);
            const response = await axiosClient.get(API_ENDPOINTS.DOCTORS || '/api/custom/doctors/');
            setDoctors(response.data);
        } catch (err) {
            console.error("Error fetching doctors:", err);
            setError("의사 목록을 불러오는데 실패했습니다.");
        } finally {
            setFetchingDoctors(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedDoctor || !patient) {
            setError("의사를 선택해주세요.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            const payload = {
                patient: patient.id,
                doctor: selectedDoctor.id,
                is_primary: isPrimary,
                assigned_date: new Date().toISOString().split('T')[0]
            };

            // Assuming endpoint is /api/custom/patient-doctors/
            // We might need to check if API_ENDPOINTS has this, if not use direct path or add to config later.
            // Using direct path for now as it might not be in config yet.
            await axiosClient.post('/api/custom/patient-doctors/', payload);

            onAssignSuccess();
            onClose();
        } catch (err) {
            console.error("Assignment error:", err);
            setError(err.response?.data?.message || err.response?.data?.detail || '담당의 배정에 실패했습니다. 이미 배정된 의사일 수 있습니다.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>담당의 배정</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={12}>
                        <TextField
                            label="환자"
                            fullWidth
                            value={patient ? `${patient.last_name}${patient.first_name} (${patient.pid})` : ''}
                            disabled
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <Autocomplete
                            options={doctors}
                            getOptionLabel={(option) => `Dr. ${option.full_name} (${option.specialty})`}
                            value={selectedDoctor}
                            onChange={(event, newValue) => setSelectedDoctor(newValue)}
                            loading={fetchingDoctors}
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="의사 선택"
                                    required
                                    fullWidth
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <React.Fragment>
                                                {fetchingDoctors ? <CircularProgress color="inherit" size={20} /> : null}
                                                {params.InputProps.endAdornment}
                                            </React.Fragment>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <FormControlLabel
                            control={
                                <Checkbox
                                    checked={isPrimary}
                                    onChange={(e) => setIsPrimary(e.target.checked)}
                                    color="primary"
                                />
                            }
                            label="주치의로 지정 (Primary Doctor)"
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">취소</Button>
                <Button
                    onClick={handleSubmit}
                    variant="contained"
                    color="primary"
                    disabled={loading || !selectedDoctor}
                >
                    {loading ? <CircularProgress size={24} /> : '배정'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default AssignDoctorModal;
