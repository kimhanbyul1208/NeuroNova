import { useState, useEffect } from 'react';
import {
  Typography,
  Box,
  TextField,
  InputAdornment,
  Pagination,
  Button,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import { PatientCard, LoadingSpinner, ErrorAlert } from '../components';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import './DashboardPage.css';
import './css/PatientList.css';
import RegisterPatientModal from '../components/RegisterPatientModal';
import PatientDetailPage from "./PatientDetailPage";

const PatientListPage = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  
  const [selectedPatientId, setSelectedPatientId] = useState(null);

  const patientsPerPage = 9;

  // 환자 목록 불러오기
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const url = `${API_ENDPOINTS.PATIENTS}?page_size=100`;
      console.log('🔍 Fetching patients from:', url);
      const response = await axiosClient.get(url);
      const data = response.data;
      console.log('✅ Received data:', data);

      const patientList = Array.isArray(data) ? data : data.results || [];
      console.log('📊 Patient list length:', patientList.length);

      setPatients(patientList);
      setFilteredPatients(patientList);
    } catch (err) {
      setError(err.response?.data?.message || '환자 목록을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 환자 삭제
  const handleDeletePatient = async (id) => {
    try {
      await axiosClient.delete(`${API_ENDPOINTS.PATIENTS}${id}/`);
      setPatients(patients.filter((p) => p.id !== id));
      setFilteredPatients(filteredPatients.filter((p) => p.id !== id));
    } catch (err) {
      alert('환자 삭제에 실패했습니다.');
    }
  };

  // 환자 상세 조회
  const handleViewDetail = (id) => {
    setSelectedPatientId(id);
  };

  // 뒤로가기
  const handleBack = () => {
    setSelectedPatientId(null);
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // 검색 필터링
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredPatients(patients);
    } else {
      const search = searchTerm.toLowerCase();
      const filtered = patients.filter((patient) => {
        const fullName = `${patient.last_name}${patient.first_name}`.toLowerCase();
        const pid = patient.pid?.toLowerCase() || '';
        const phone = patient.phone?.toLowerCase() || '';

        return (
          fullName.includes(search) ||
          pid.includes(search) ||
          phone.includes(search)
        );
      });
      setFilteredPatients(filtered);
      setPage(1);
    }
  }, [searchTerm, patients]);

  // 페이지네이션 계산
  const indexOfLastPatient = page * patientsPerPage;
  const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
  const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
  const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

  if (loading) return <LoadingSpinner fullScreen />;

  return (
    <DashboardLayout role={user?.role} activePage="patients" title="Patient Management">
      {error && (
        <ErrorAlert
          message={error}
          title="오류 발생"
          onRetry={fetchPatients}
        />
      )}

      <div className="page-container">
        {!selectedPatientId ? (
        <>
        {/* 검색 바 + 환자 추가 버튼 */}
        <div className="search-actions">
          <div className="search-bar-container">
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
                disableUnderline: true,
              }}
              variant="standard"
            />
          </div>

          <div className="add-btn-container">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => setOpenAddDialog(true)}
            >
              환자 추가
            </Button>
          </div>
        </div>

        {/* 제목 */}
        <div className="patient-header">
          <div className="patient-header-left">
            <h3 className="patient-title">환자 목록</h3>
            <p className="patient-subtitle">등록된 환자를 조회하고 관리합니다.</p>
          </div>

          <Box className="patient-header-right">
            <p className="cntPatient">총 {filteredPatients.length}명의 환자</p>
          </Box>
        </div>


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
            <div className="patient-grid">
              
                {currentPatients.map((patient) => (
                  <PatientCard
                    key={patient.id}
                    patient={patient}
                    onDelete={handleDeletePatient}
                    onViewDetail={handleViewDetail}
                  />
                ))}
            </div>
           
            {totalPages > 1 && (
              <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(e, value) => setPage(value)}
                  color="primary"
                  size="large"
                />
              </Box>
            )}
          </>
        )}
        </>
        ) : (
          <PatientDetailPage
            id={selectedPatientId}
            onClose={handleBack}
          />
        )}
        

        

        

        <RegisterPatientModal
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          onRegisterSuccess={() => {
            fetchPatients();
            setOpenAddDialog(false);
          }}
        />
      </div>
    </DashboardLayout>
  );
};

export default PatientListPage;
