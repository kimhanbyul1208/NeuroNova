import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  TextField,
  Grid,
  InputAdornment,
  Paper,
  Pagination
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { PatientCard, LoadingSpinner, ErrorAlert } from '../components';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

/**
 * 환자 목록 페이지
 * 환자 검색 및 목록 표시 기능
 */
const PatientListPage = () => {
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const patientsPerPage = 9;

  // 환자 목록 불러오기
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axiosClient.get(API_ENDPOINTS.PATIENTS);

      // Handle pagination (DRF returns { count, next, previous, results })
      const data = response.data;
      const patientList = Array.isArray(data) ? data : data.results || [];

      setPatients(patientList);
      setFilteredPatients(patientList);
    } catch (err) {
      setError(err.response?.data?.message || '환자 목록을 불러오는데 실패했습니다.');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // 검색 필터링
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredPatients(patients);
    } else {
      const filtered = patients.filter((patient) => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${patient.last_name}${patient.first_name}`.toLowerCase();
        const pid = patient.pid?.toLowerCase() || '';
        const phone = patient.phone?.toLowerCase() || '';

        return (
          fullName.includes(searchLower) ||
          pid.includes(searchLower) ||
          phone.includes(searchLower)
        );
      });
      setFilteredPatients(filtered);
      setPage(1); // 검색 시 첫 페이지로 이동
    }
  }, [searchTerm, patients]);

  // 페이지네이션
  const indexOfLastPatient = page * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  const handlePageChange = (event, value) => {
    setPage(value);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Container maxWidth="lg" sx={{ marginTop: 4, marginBottom: 4 }}>
      {/* 헤더 */}
      <Box sx={{ marginBottom: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          환자 목록
        </Typography>
        <Typography variant="body1" color="text.secondary">
          등록된 환자를 조회하고 관리합니다.
        </Typography>
      </Box>

      {/* 검색 바 */}
      <Paper sx={{ padding: 2, marginBottom: 3 }}>
        <TextField
          fullWidth
          placeholder="환자 이름, 환자번호, 전화번호로 검색..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
        <Box sx={{ marginTop: 1 }}>
          <Typography variant="body2" color="text.secondary">
            총 {filteredPatients.length}명의 환자
          </Typography>
        </Box>
      </Paper>

      {/* 에러 표시 */}
      {error && (
        <ErrorAlert
          message={error}
          title="오류 발생"
          onRetry={fetchPatients}
        />
      )}

      {/* 환자 목록 */}
      {!error && filteredPatients.length === 0 && (
        <Box sx={{ textAlign: 'center', padding: 4 }}>
          <Typography variant="body1" color="text.secondary">
            {searchTerm ? '검색 결과가 없습니다.' : '등록된 환자가 없습니다.'}
          </Typography>
        </Box>
      )}

      {!error && currentPatients.length > 0 && (
        <>
          <Grid container spacing={3}>
            {currentPatients.map((patient) => (
              <Grid item xs={12} sm={6} md={4} key={patient.id}>
                <PatientCard patient={patient} />
              </Grid>
            ))}
          </Grid>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="large"
              />
            </Box>
          )}
        </>
      )}
    </Container>
  );
};

export default PatientListPage;
