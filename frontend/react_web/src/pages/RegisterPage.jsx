/**
 * Register Page - 회원가입 (의료진용)
 */
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Alert,
  Paper,
  Grid,
} from '@mui/material';
import { PersonAdd } from '@mui/icons-material';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'doctor',
    phone_number: '',
    department: '',
    license_number: '',
  });

  const roles = [
    { value: 'DOCTOR', label: '의사' },
    { value: 'NURSE', label: '간호사' },
    { value: 'ADMIN', label: '관리자' },
  ];

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (formData.password !== formData.password_confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }

    setLoading(true);

    try {
      // Use axiosClient and correct endpoint
      const response = await axiosClient.post(API_ENDPOINTS.REGISTER, {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        password_confirm: formData.password_confirm,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        phone_number: formData.phone_number,
      });

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      if (err.response?.data) {
        const errorMessages = Object.values(err.response.data).flat().join(' ');
        setError(errorMessages || '회원가입에 실패했습니다.');
      } else if (err.code === 'ERR_NETWORK') {
        setError('서버와의 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError('회원가입에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 8 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
          <PersonAdd sx={{ fontSize: 48, color: 'primary.main', mb: 1 }} />
          <Typography component="h1" variant="h4" fontWeight="bold">
            NeuroNova
          </Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 1 }}>
            의료진 회원가입
          </Typography>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            회원가입이 완료되었습니다! 로그인 페이지로 이동합니다...
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            {/* 사용자명 */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="사용자명"
                name="username"
                value={formData.username}
                onChange={handleChange}
                autoComplete="username"
              />
            </Grid>

            {/* 이메일 */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="이메일"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                autoComplete="email"
              />
            </Grid>

            {/* 성 */}
            <Grid item xs={6}>
              <TextField
                required
                fullWidth
                label="성"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                autoComplete="family-name"
              />
            </Grid>

            {/* 이름 */}
            <Grid item xs={6}>
              <TextField
                required
                fullWidth
                label="이름"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                autoComplete="given-name"
              />
            </Grid>

            {/* 비밀번호 */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="비밀번호"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                autoComplete="new-password"
                helperText="최소 8자 이상"
              />
            </Grid>

            {/* 비밀번호 확인 */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="비밀번호 확인"
                name="password_confirm"
                type="password"
                value={formData.password_confirm}
                onChange={handleChange}
                autoComplete="new-password"
              />
            </Grid>

            {/* 직책 */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                select
                label="직책"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                {roles.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* 전화번호 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="전화번호"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleChange}
                autoComplete="tel"
                placeholder="010-1234-5678"
              />
            </Grid>

            {/* 부서 */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="부서"
                name="department"
                value={formData.department}
                onChange={handleChange}
                placeholder="신경외과"
              />
            </Grid>

            {/* 면허번호 */}
            <Grid item xs={6}>
              <TextField
                fullWidth
                label="면허번호"
                name="license_number"
                value={formData.license_number}
                onChange={handleChange}
              />
            </Grid>
          </Grid>

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, mb: 2, py: 1.5 }}
          >
            {loading ? '가입 중...' : '회원가입'}
          </Button>

          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2">
              이미 계정이 있으신가요?{' '}
              <Link to="/login" style={{ color: '#2196F3', textDecoration: 'none' }}>
                로그인
              </Link>
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default RegisterPage;
