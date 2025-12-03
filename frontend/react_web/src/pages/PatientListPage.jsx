// import { useState, useEffect } from 'react';
// import {
//   Typography,
//   Box,
//   TextField,
//   InputAdornment,
//   Pagination,
//   Button,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Stack,
//   Grid,
//   FormControl,
//   FormLabel,  
//   RadioGroup,
//   FormControlLabel,
//   Radio,
//   MenuItem ,
//   InputLabel ,
//   Select ,
// } from '@mui/material';
// import SearchIcon from '@mui/icons-material/Search';
// import AddIcon from '@mui/icons-material/Add';
// import { PatientCard, LoadingSpinner, ErrorAlert } from '../components';
// import axiosClient from '../api/axios';
// import { API_ENDPOINTS } from '../utils/config';
// import DashboardLayout from '../layouts/DashboardLayout';
// import { useAuth } from '../auth/AuthContext';
// import './DashboardPage.css';
// import './css/PatientList.css';
// import RegisterPatientModal from '../components/RegisterPatientModal';


// /**
//  * 환자 목록 페이지
//  * 환자 검색 및 목록 표시 기능
//  */
// const PatientListPage = () => {
//   const { user } = useAuth();
//   const [patients, setPatients] = useState([]);
//   const [filteredPatients, setFilteredPatients] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [page, setPage] = useState(1);
//   const [openAddDialog, setOpenAddDialog] = useState(false);
//   const [newPatient, setNewPatient] = useState({
//     first_name: '',
//     last_name: '',
//     pid: '',
//     phone: '',
//     gender: 'M',
//     date_of_birth: '',
//     // todo : 담당의 넘길거면 추가 하고 코드 수정
//   });
//   const patientsPerPage = 9;

//   // 환자 목록 불러오기
//   const fetchPatients = async () => {
//     try {
//       setLoading(true);
//       setError(null);
//       const response = await axiosClient.get(API_ENDPOINTS.PATIENTS);

//       // Handle pagination (DRF returns { count, next, previous, results })
//       const data = response.data;
//       const patientList = Array.isArray(data) ? data : data.results || [];

//       setPatients(patientList);
//       setFilteredPatients(patientList);
//     } catch (err) {
//       setError(err.response?.data?.message || '환자 목록을 불러오는데 실패했습니다.');
//       console.error('Error fetching patients:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // 환자 삭제
//   const handleDeletePatient = async (id) => {
//     try {
//       await axiosClient.delete(`${API_ENDPOINTS.PATIENTS}${id}/`);
//       setPatients(patients.filter(p => p.id !== id));
//       setFilteredPatients(filteredPatients.filter(p => p.id !== id));
//     } catch (err) {
//       console.error('Error deleting patient:', err);
//       alert('환자 삭제에 실패했습니다.');
//     }
//   };

//   // 환자 추가
//   const handleAddPatient = async () => {
//     try {
//       await axiosClient.post(API_ENDPOINTS.PATIENTS, newPatient);
//       setOpenAddDialog(false);
//       setNewPatient({ first_name: '', last_name: '', pid: '', phone: '', gender: 'M', date_of_birth: '' });
//       fetchPatients(); // Refresh list
//     } catch (err) {
//       console.error('Error adding patient:', err);
//       alert('환자 추가에 실패했습니다.');
//     }
//   };

//   // 의사 더미 데이터
//   const doctors = [
//     { id: 1, name: "김철수", department: "내과" },
//     { id: 2, name: "이영희", department: "정형외과" },
//     { id: 3, name: "박민수", department: "피부과" },
//   ];

//   useEffect(() => {
//     fetchPatients();
//   }, []);

//   // 검색 필터링
//   useEffect(() => {
//     if (searchTerm.trim() === '') {
//       setFilteredPatients(patients);
//     } else {
//       const filtered = patients.filter((patient) => {
//         const searchLower = searchTerm.toLowerCase();
//         const fullName = `${patient.last_name}${patient.first_name}`.toLowerCase();
//         const pid = patient.pid?.toLowerCase() || '';
//         const phone = patient.phone?.toLowerCase() || '';

//         return (
//           fullName.includes(searchLower) ||
//           pid.includes(searchLower) ||
//           phone.includes(searchLower)
//         );
//       });
//       setFilteredPatients(filtered);
//       setPage(1); // 검색 시 첫 페이지로 이동
//     }
//   }, [searchTerm, patients]);

//   // 페이지네이션
//   const indexOfLastPatient = page * patientsPerPage;
//   const indexOfFirstPatient = indexOfLastPatient - patientsPerPage;
//   const currentPatients = filteredPatients.slice(indexOfFirstPatient, indexOfLastPatient);
//   const totalPages = Math.ceil(filteredPatients.length / patientsPerPage);

//   const handlePageChange = (event, value) => {
//     setPage(value);
//     window.scrollTo({ top: 0, behavior: 'smooth' });
//   };

//   if (loading) {
//     return <LoadingSpinner fullScreen />;
//   }

//   return (
//     <DashboardLayout role={user?.role} activePage="patients" title="Patient Management">
//       {/* 에러 표시 */}
//       {error && (
//         <ErrorAlert
//           message={error}
//           title="오류 발생"
//           onRetry={fetchPatients}
//         />
//       )}

//       <div className="page-container">
//         {/* 검색 바 & 환자추가 버튼 */}
//         <div className="search-actions">
//           <div className="search-bar-container">
//             <TextField
//               fullWidth
//               placeholder="환자 이름, 환자번호, 전화번호로 검색..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               InputProps={{
//                 startAdornment: (
//                   <InputAdornment position="start">
//                     <SearchIcon />
//                   </InputAdornment>
//                 ),
//                 disableUnderline: true,
//               }}
//               variant="standard"
//             />
//           </div>

//           <div className="add-btn-container">
//             <Button
//               variant="contained"
//               startIcon={<AddIcon />}
//               onClick={() => setOpenAddDialog(true)}
//             >
//               환자 추가
//             </Button>
//           </div>
//         </div>
        
        
//         <div className="patient-header">
//           <div className="patient-header-left">
//             <Box>
//               <h3 className="patient-title">환자 목록</h3>
//             </Box>
//             <p className="patient-subtitle">
//               등록된 환자를 조회하고 관리합니다.
//             </p>
//           </div>

//           <Box sx={{ marginTop: 1 }} className="patient-header-right">
//             <p className="cntPatient">
//               총 {filteredPatients.length}명의 환자
//             </p>
//           </Box>
//       </div>
//         {/* 환자 목록 */}
//         {!error && filteredPatients.length === 0 && (
//           <Box sx={{ textAlign: 'center', padding: 4 }}>
//             <Typography variant="body1" color="text.secondary">
//               {searchTerm ? '검색 결과가 없습니다.' : '등록된 환자가 없습니다.'}
//             </Typography>
//           </Box>
//         )}

//         {!error && currentPatients.length > 0 && (
//           <>
//             <div className="patient-grid">
//               {currentPatients.map((patient) => (
//                 <PatientCard 
//                   key={patient.id} 
//                   patient={patient} 
//                   onDelete={handleDeletePatient} 
//                   className="patient-card"
//                 />
//               ))}
//             </div>

//             {/* 페이지네이션 */}
//             {totalPages > 1 && (
//               <Box sx={{ display: 'flex', justifyContent: 'center', marginTop: 4 }}>
//                 <Pagination
//                   count={totalPages}
//                   page={page}
//                   onChange={handlePageChange}
//                   color="primary"
//                   size="large"
//                 />
//               </Box>
//             )}
//           </>
//         )}
//         {/* 환자 추가 다이얼로그 */}
//         <Dialog 
//   open={openAddDialog} 
//   onClose={() => setOpenAddDialog(false)} 
//   fullWidth
//   maxWidth="sm"
// >
//   <DialogTitle sx={{ fontWeight: 700 }}>
//     새 환자 추가
//   </DialogTitle>
//   <div></div>
//   <DialogContent sx={{ pt: 1 }}>
//     <Grid container spacing={2}>
//   <Grid item xs={12} sm={6}>
//     <TextField
//       fullWidth
//       label="성 (Last Name)"      
//       value={newPatient.last_name}
//       onChange={(e) =>
//         setNewPatient({ ...newPatient, last_name: e.target.value })
//       }
//     />
//   </Grid>

//   <Grid item xs={12} sm={6}>
//     <TextField
//       fullWidth
//       label="이름 (First Name)"
//       value={newPatient.first_name}
//       onChange={(e) =>
//         setNewPatient({ ...newPatient, first_name: e.target.value })
//       }
//     />
//   </Grid>

//   <Grid item xs={12}>
//     <TextField
//       fullWidth
//       label="생년월일"
//       type="date"
//       value={newPatient.date_of_birth}
//       onChange={(e) =>
//         setNewPatient({ ...newPatient, date_of_birth: e.target.value })
//       }
//       InputLabelProps={{ shrink: true }}
//     />
//   </Grid>

//   <Grid item xs={12} sm={6}>
//     <TextField
//       fullWidth
//       label="환자 번호 (PID)"
//       value={newPatient.pid}
//       onChange={(e) =>
//         setNewPatient({ ...newPatient, pid: e.target.value })
//       }
//     />
//   </Grid>

//   <Grid item xs={12} sm={6}>
//     <TextField
//       fullWidth
//       label="전화번호"
//       value={newPatient.phone}
//       onChange={(e) =>
//         setNewPatient({ ...newPatient, phone: e.target.value })
//       }
//     />
//   </Grid>

//   <Grid item xs={12}>
//     <FormControl fullWidth>
//       <InputLabel id="doctor-label">담당 의사 선택</InputLabel>
//       <Select
//         labelId="doctor-label"
//         label="담당 의사 선택"
//         value={newPatient.doctorId}
//         // onChange={(e) =>
//         //   setNewPatient({ ...newPatient, doctorId: e.target.value })
//         // }
//       >
//         {doctors.map((doc) => (
//           <MenuItem key={doc.id} value={doc.id}>
//             {doc.name}
//           </MenuItem>
//         ))}
//       </Select>
//     </FormControl>
//   </Grid>

//   <Grid item xs={12}>
//     <FormControl component="fieldset">
//       <FormLabel>성별</FormLabel>
//       <RadioGroup
//         row
//         value={newPatient.gender}
//         onChange={(e) =>
//           setNewPatient({ ...newPatient, gender: e.target.value })
//         }
//       >
//         <FormControlLabel value="M" control={<Radio />} label="남성" />
//         <FormControlLabel value="F" control={<Radio />} label="여성" />
//       </RadioGroup>
//     </FormControl>
//   </Grid>
// </Grid>

//   </DialogContent>

//   <DialogActions sx={{ p: 2 }}>
//     <Button onClick={() => setOpenAddDialog(false)}>취소</Button>
//     <Button variant="contained" color="primary" onClick={handleAddPatient}>
//       추가
//     </Button>
//   </DialogActions>
// </Dialog>

//         {/* <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
//           <DialogTitle>새 환자 추가</DialogTitle>
//           <DialogContent>
//             <Stack spacing={2} sx={{ marginTop: 1, minWidth: 300 }}>
//               <TextField
//                 label="성 (Last Name)"
//                 value={newPatient.last_name}
//                 onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
//                 fullWidth
//               />
//               <TextField
//                 label="이름 (First Name)"
//                 value={newPatient.first_name}
//                 onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
//                 fullWidth
//               />
//               <TextField
//                 label="환자 번호 (PID)"
//                 value={newPatient.pid}
//                 onChange={(e) => setNewPatient({ ...newPatient, pid: e.target.value })}
//                 fullWidth
//               />
//               <TextField
//                 label="전화번호"
//                 value={newPatient.phone}
//                 onChange={(e) => setNewPatient({ ...newPatient, phone: e.target.value })}
//                 fullWidth
//               />
//               <TextField
//                 label="생년월일"
//                 type="date"
//                 value={newPatient.date_of_birth}
//                 onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
//                 fullWidth
//                 InputLabelProps={{ shrink: true }}
//               />
//               <TextField
//                 select
//                 label="성별"
//                 value={newPatient.gender}
//                 onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value })}
//                 SelectProps={{ native: true }}
//                 fullWidth
//               >
//                 <option value="M">남성</option>
//                 <option value="F">여성</option>
//               </TextField>
//             </Stack>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setOpenAddDialog(false)}>취소</Button>
//             <Button onClick={handleAddPatient} variant="contained">추가</Button>
//           </DialogActions>
//         </Dialog> */}
//       </div>
//     </DashboardLayout>
//   );
// };

// export default PatientListPage;

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

const PatientListPage = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [openAddDialog, setOpenAddDialog] = useState(false);

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
