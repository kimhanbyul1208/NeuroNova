import React, { useState } from 'react';
import { Container, Typography, TextField, Button, Box, MenuItem, Alert, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

const BookAppointmentPage = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        scheduled_at: '',
        visit_type: 'CHECK_UP',
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
            alert('Appointment booked successfully!');
            navigate('/patient/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to book appointment');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="sm" sx={{ mt: 4 }}>
            <Paper sx={{ p: 4, borderRadius: '16px' }}>
                <Typography variant="h4" gutterBottom>Book Appointment</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Schedule a new appointment with our specialists.
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
                        label="Visit Type"
                        name="visit_type"
                        value={formData.visit_type}
                        onChange={handleChange}
                        sx={{ mb: 3 }}
                    >
                        <MenuItem value="FIRST_VISIT">First Visit</MenuItem>
                        <MenuItem value="FOLLOW_UP">Follow Up</MenuItem>
                        <MenuItem value="CHECK_UP">Check Up</MenuItem>
                        <MenuItem value="EMERGENCY">Emergency</MenuItem>
                    </TextField>
                    <TextField
                        fullWidth
                        label="Reason for Visit"
                        name="reason"
                        multiline
                        rows={4}
                        value={formData.reason}
                        onChange={handleChange}
                        required
                        sx={{ mb: 3 }}
                        placeholder="Please describe your symptoms or reason for visit..."
                    />
                    <Button
                        type="submit"
                        variant="contained"
                        fullWidth
                        size="large"
                        disabled={loading}
                    >
                        {loading ? 'Booking...' : 'Book Appointment'}
                    </Button>
                </Box>
            </Paper>
        </Container>
    );
};

export default BookAppointmentPage;
