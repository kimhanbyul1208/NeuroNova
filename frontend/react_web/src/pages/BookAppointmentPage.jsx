import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, MenuItem, Alert, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import DashboardLayout from '../layouts/DashboardLayout';

const BookAppointmentPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        scheduled_at: '',
        visit_type: 'FIRST_VISIT',
        reason: '',
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await axiosClient.post(API_ENDPOINTS.APPOINTMENTS, formData);
            alert('진료 예약 신청이 완료되었습니다. 메인화면으로 돌아갑니다.');
            navigate('/patient/dashboard');
        } catch (err) {
            console.error('예약 실패:', err);

            // Extract error message from various possible response formats
            let errorMessage = '진료 예약에 실패하였습니다.';

            if (err.response?.data) {
                const data = err.response.data;
                if (data.patient) {
                    errorMessage = Array.isArray(data.patient) ? data.patient[0] : data.patient;
                } else if (data.message) {
                    errorMessage = data.message;
                } else if (data.detail) {
                    errorMessage = data.detail;
                } else if (typeof data === 'string') {
                    errorMessage = data;
                }
            }

            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        
        <DashboardLayout role="PATIENT" activePage="dashboard" title="진료 예약">
            <Paper sx={{ p: 4, borderRadius: '16px' }}>
                {/* <Typography variant="h4" gutterBottom>Book Appointment</Typography> */}
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    예약 일정을 확인하시고 진료를 예약하세요.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                    <TextField
                        fullWidth
                        label="Date & Time"
                        type="datetime-local"
                        name="scheduled_at"
                        value={formData.scheduled_at}
                        onChange={handleChange}
                        InputLabelProps={{ shrink: true }}
                        required
                        sx={{ mb: 3 }}
                    />
                    <TextField
                        select
                        fullWidth
                        label="방문 방법"
                        name="visit_type"
                        value={formData.visit_type}
                        onChange={handleChange}
                        sx={{ mb: 3 }}
                    >
                        <MenuItem value="FIRST_VISIT">첫 방문</MenuItem>
                        <MenuItem value="FOLLOW_UP">재방문</MenuItem>
                        <MenuItem value="CHECK_UP">검진</MenuItem>
                        <MenuItem value="EMERGENCY">응급</MenuItem>
                    </TextField>
                    <TextField
                        fullWidth
                        label="필요하신 진료과와 아프신 곳을 입력해주세요."
                        name="reason"
                        multiline
                        rows={4}
                        value={formData.reason}
                        onChange={handleChange}
                        required
                        sx={{ mb: 3 }}
                        placeholder="필요하신 진료과와 아프신 곳을 입력해주세요"
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                    >
                        {loading ? '예약중...' : '예약하기'}
                    </Button>
                </Box>
            </Paper>
           
        </DashboardLayout>
    );
};

export default BookAppointmentPage;
