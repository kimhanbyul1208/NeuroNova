import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Grid,
  MenuItem,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment,
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  ContentCopy as CopyIcon,
  Print as PrintIcon,
} from '@mui/icons-material';
import axiosInstance from '../../api/axiosConfig';

/**
 * 간호사용 환자 등록 페이지
 * 간호사가 내원 환자를 시스템에 등록
 */
const PatientRegistration = () => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    ssn: '',
    phone: '',
    date_of_birth: '',
    gender: 'M',
    doctor_id: '',
    address: '',
    email: '',
    emergency_contact: '',
    insurance_id: '',
  });

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [registrationResult, setRegistrationResult] = useState(null);
  const [showResultDialog, setShowResultDialog] = useState(false);

  // 의사 목록 불러오기
  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        const response = await axiosInstance.get('/api/v1/users/profiles/', {
          params: { role: 'DOCTOR' },
        });
        setDoctors(response.data.results || response.data);
      } catch (err) {
        console.error('의사 목록 조회 실패:', err);
        setError('의사 목록을 불러오는데 실패했습니다.');
      }
    };

    fetchDoctors();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 전화번호 포맷팅 (010-1234-5678)
  const handlePhoneChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 11) {
      if (value.length > 3 && value.length <= 7) {
        value = `${value.slice(0, 3)}-${value.slice(3)}`;
      } else if (value.length > 7) {
        value = `${value.slice(0, 3)}-${value.slice(3, 7)}-${value.slice(7)}`;
      }
      setFormData((prev) => ({ ...prev, phone: value }));
    }
  };

  // 주민등록번호 포맷팅 (123456-1234567)
  const handleSsnChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, '');
    if (value.length <= 13) {
      if (value.length > 6) {
        value = `${value.slice(0, 6)}-${value.slice(6)}`;
      }
      setFormData((prev) => ({ ...prev, ssn: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await axiosInstance.post(
        '/api/v1/users/nurse/register_patient/',
        formData
      );

      setSuccess('환자 등록이 완료되었습니다!');
      setRegistrationResult(response.data);
      setShowResultDialog(true);

      // 폼 초기화
      setFormData({
        first_name: '',
        last_name: '',
        ssn: '',
        phone: '',
        date_of_birth: '',
        gender: 'M',
        doctor_id: '',
        address: '',
        email: '',
        emergency_contact: '',
        insurance_id: '',
      });
    } catch (err) {
      console.error('환자 등록 실패:', err);
      if (err.response?.data) {
        const errorData = err.response.data;
        if (typeof errorData === 'object') {
          const errorMessages = Object.entries(errorData)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ');
          setError(errorMessages);
        } else {
          setError(errorData.message || '환자 등록에 실패했습니다.');
        }
      } else {
        setError('환자 등록에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 4 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <PersonAddIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h1">
            환자 등록
          </Typography>
        </Box>

        <Typography variant="body2" color="text.secondary" mb={3}>
          내원 환자 정보를 등록하고 담당 의사를 지정합니다.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* 이름 */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="성"
                name="last_name"
                value={formData.last_name}
                onChange={handleChange}
                placeholder="홍"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="이름"
                name="first_name"
                value={formData.first_name}
                onChange={handleChange}
                placeholder="길동"
              />
            </Grid>

            {/* 주민등록번호 */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="주민등록번호"
                name="ssn"
                value={formData.ssn}
                onChange={handleSsnChange}
                placeholder="123456-1234567"
                helperText="형식: 123456-1234567"
              />
            </Grid>

            {/* 생년월일 */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                type="date"
                label="생년월일"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* 성별 */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                select
                label="성별"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
              >
                <MenuItem value="M">남성</MenuItem>
                <MenuItem value="F">여성</MenuItem>
                <MenuItem value="O">기타</MenuItem>
              </TextField>
            </Grid>

            {/* 전화번호 */}
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="전화번호"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                placeholder="010-1234-5678"
                helperText="로그인 ID로 사용됩니다"
              />
            </Grid>

            {/* 담당 의사 */}
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                select
                label="담당 의사"
                name="doctor_id"
                value={formData.doctor_id}
                onChange={handleChange}
                helperText="환자를 담당할 의사를 선택하세요"
              >
                {doctors.map((doctor) => (
                  <MenuItem key={doctor.user?.id || doctor.id} value={doctor.user?.id || doctor.id}>
                    {doctor.user?.last_name}{doctor.user?.first_name}
                    {doctor.department && ` - ${doctor.department.name}`}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            {/* 주소 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="주소"
                name="address"
                value={formData.address}
                onChange={handleChange}
                multiline
                rows={2}
                placeholder="서울시 강남구..."
              />
            </Grid>

            {/* 이메일 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="email"
                label="이메일"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="example@email.com"
              />
            </Grid>

            {/* 비상 연락처 */}
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="비상 연락처"
                name="emergency_contact"
                value={formData.emergency_contact}
                onChange={handleChange}
                placeholder="010-9876-5432"
              />
            </Grid>

            {/* 건강보험 번호 */}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="건강보험 번호"
                name="insurance_id"
                value={formData.insurance_id}
                onChange={handleChange}
                placeholder="1234567890"
              />
            </Grid>

            {/* 제출 버튼 */}
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={<PersonAddIcon />}
              >
                {loading ? '등록 중...' : '환자 등록'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* 등록 결과 다이얼로그 */}
      <Dialog
        open={showResultDialog}
        onClose={() => setShowResultDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center">
            <PersonAddIcon sx={{ mr: 1, color: 'success.main' }} />
            환자 등록 완료
          </Box>
        </DialogTitle>
        <DialogContent>
          {registrationResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                환자가 성공적으로 등록되었습니다!
              </Alert>

              <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  환자 정보
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>환자 ID:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {registrationResult.pid}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(registrationResult.pid)}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>진료기록번호:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {registrationResult.medical_record_number}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() =>
                          handleCopy(registrationResult.medical_record_number)
                        }
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, bgcolor: 'primary.50' }}>
                <Typography variant="subtitle2" color="primary" gutterBottom>
                  로그인 정보 (환자에게 안내)
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>로그인 ID:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1 }}>
                        {registrationResult.username}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(registrationResult.username)}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>

                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>임시 비밀번호:</strong>
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Box display="flex" alignItems="center">
                      <Typography variant="body2" sx={{ mr: 1, color: 'error.main' }}>
                        {registrationResult.temp_password}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleCopy(registrationResult.temp_password)}
                      >
                        <CopyIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </Grid>
                </Grid>

                <Alert severity="warning" sx={{ mt: 2 }}>
                  환자에게 로그인 정보를 안내하고, 첫 로그인 시 비밀번호를 변경하도록 안내하세요.
                </Alert>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePrint} startIcon={<PrintIcon />}>
            인쇄
          </Button>
          <Button onClick={() => setShowResultDialog(false)} variant="contained">
            확인
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PatientRegistration;
