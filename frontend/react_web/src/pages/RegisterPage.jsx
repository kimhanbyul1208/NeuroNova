// Register Page - 의료진 회원가입
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
    role: 'PATIENT',
    phone_number: '',
    department: '',
    license_number: '',
  });

  const roles = [
    { value: 'PATIENT', label: '환자' },
    { value: 'DOCTOR', label: '의사' },
    { value: 'NURSE', label: '간호사' },
    { value: 'ADMIN', label: '관리자' },
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Basic validation
    if (formData.password !== formData.password_confirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    if (formData.password.length < 8) {
      setError('비밀번호는 최소 8자 이상이어야 합니다.');
      return;
    }
    const phoneRegex = /^[0-9]{2,3}-[0-9]{3,4}-[0-9]{4}$/;
    if (!phoneRegex.test(formData.phone_number)) {
      setError('전화번호 형식이 올바르지 않습니다. 예: 010-1234-5678');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        phone_number: formData.phone_number,
      };
      if (formData.role === 'DOCTOR' || formData.role === 'NURSE') {
        payload.department = formData.department;
        payload.license_number = formData.license_number;
      }
      await axiosClient.post(API_ENDPOINTS.REGISTER, payload);
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      if (err.response?.data) {
        const data = err.response.data;
        let message = '회원가입에 실패했습니다.';
        const fieldNames = {
          username: '사용자명',
          email: '이메일',
          password: '비밀번호',
          password_confirm: '비밀번호 확인',
          first_name: '이름',
          last_name: '성',
          role: '직책',
          phone_number: '전화번호',
          department: '부서',
          license_number: '면허번호',
        };
        if (typeof data === 'object') {
          const messages = [];
          if (data.non_field_errors) {
            const nf = Array.isArray(data.non_field_errors) ? data.non_field_errors.join(' ') : data.non_field_errors;
            messages.push(nf);
          }
          for (const key in data) {
            if (key === 'non_field_errors') continue;
            let errContent = Array.isArray(data[key]) ? data[key].join(' ') : data[key];
            if (key === 'role' && errContent.includes('유효하지 않은 선택')) {
              messages.push('"직책"이 유효하지 않은 선택(choice)입니다.');
              continue;
            }
            const fieldName = fieldNames[key] || key;
            messages.push(`${fieldName}: ${errContent}`);
          }
          message = messages.join('\n');
        } else if (typeof data === 'string') {
          message = data;
        }
        setError(message);
      } else if (err.code === 'ERR_NETWORK') {
        setError('서버와의 연결에 실패했습니다. 서버가 실행 중인지 확인해주세요.');
      } else {
        setError('회원가입 중 알 수 없는 오류가 발생했습니다.');
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
            {/* 직책 - 가장 먼저 선택하도록 배치 */}
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
            {/* 부서 & 면허번호 - 의료진 전용 */}
            {(formData.role === 'DOCTOR' || formData.role === 'NURSE') && (
              <>
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
                <Grid item xs={6}>
                  <TextField
                    fullWidth
                    label="면허번호"
                    name="license_number"
                    value={formData.license_number}
                    onChange={handleChange}
                  />
                </Grid>
              </>
            )}
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
