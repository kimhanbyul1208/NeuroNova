// Register Patient Modal - 환자 등록
import React, { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    MenuItem, 
    
} from '@mui/material';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

const RegisterPatientModal = ({ open, onClose, onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'M',
        phone: '',
        email: '',
        address: '',
        pid: '', // optional, will be generated if empty
        insurance_id: '',
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    // Helper to generate PID
    const generatePID = () =>
        `PT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, '0')}`;

    const handleSubmit = async () => {
        // Basic validation
        if (!formData.first_name || !formData.last_name || !formData.date_of_birth || !formData.phone) {
            setError('필수 정보를 모두 입력해주세요.');
            return;
        }
        // Phone format validation
        const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
        if (!phoneRegex.test(formData.phone)) {
            setError('전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678');
            return;
        }

        setLoading(true);
        setError(null);
        let attempts = 0;
        const maxAttempts = 3;
        let dataToSend = { ...formData };
        if (!dataToSend.pid) dataToSend.pid = generatePID();

        while (attempts < maxAttempts) {
            try {
                await axiosClient.post(API_ENDPOINTS.PATIENTS, dataToSend);
                // Success
                onRegisterSuccess();
                onClose();
                // Reset form
                setFormData({
                    first_name: '',
                    last_name: '',
                    date_of_birth: '',
                    gender: 'M',
                    phone: '',
                    email: '',
                    address: '',
                    pid: '',
                    insurance_id: '',
                });
                return; // exit after success
            } catch (err) {
                // Check for PID uniqueness error (assume backend returns 400 with pid field error)
                if (err.response?.data && err.response.data.pid) {
                    // Regenerate PID and retry
                    attempts += 1;
                    dataToSend.pid = generatePID();
                    continue;
                }
                // General error handling
                const message =
                    err.response?.data?.message ||
                    err.response?.data?.detail ||
                    '환자 등록에 실패했습니다. 입력 정보를 확인해주세요.';
                setError(message);
                break;
            }
        }
        setLoading(false);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>신규 환자 등록</DialogTitle>
            <DialogContent>
                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid item xs={6}>
                        <TextField
                            name="last_name"
                            label="성"
                            fullWidth
                            required
                            value={formData.last_name}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            name="first_name"
                            label="이름"
                            fullWidth
                            required
                            value={formData.first_name}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            name="date_of_birth"
                            label="생년월일"
                            type="date"
                            fullWidth
                            required
                            InputLabelProps={{ shrink: true }}
                            value={formData.date_of_birth}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            name="gender"
                            label="성별"
                            select
                            fullWidth
                            value={formData.gender}
                            onChange={handleChange}
                        >
                            <MenuItem value="M">남성</MenuItem>
                            <MenuItem value="F">여성</MenuItem>
                        </TextField>
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="phone"
                            label="전화번호"
                            fullWidth
                            required
                            placeholder="010-1234-5678"
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="email"
                            label="이메일"
                            type="email"
                            fullWidth
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={12}>
                        <TextField
                            name="address"
                            label="주소"
                            fullWidth
                            multiline
                            rows={2}
                            value={formData.address}
                            onChange={handleChange}
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            name="pid"
                            label="환자번호 (PID)"
                            fullWidth
                            placeholder="자동 생성 (입력 시 수동)"
                            value={formData.pid}
                            onChange={handleChange}
                            helperText="비워두면 자동 생성됩니다."
                        />
                    </Grid>
                    <Grid item xs={6}>
                        <TextField
                            name="insurance_id"
                            label="보험번호"
                            fullWidth
                            value={formData.insurance_id}
                            onChange={handleChange}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} color="inherit">취소</Button>
                <Button onClick={handleSubmit} variant="contained" color="primary" disabled={loading}>
                    {loading ? <CircularProgress size={24} /> : '등록'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RegisterPatientModal;
