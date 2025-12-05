import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    TextField,
    InputAdornment,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    Avatar,
    Button,
    Divider,
    Chip
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import ScienceIcon from '@mui/icons-material/Science';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import { useFocusCleanup } from '../hooks/useFocusCleanup';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { LoadingSpinner, ErrorAlert } from '../components';

const AntigenTestPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    // 포커스 관리 훅 추가
    useFocusCleanup();

    const [searchTerm, setSearchTerm] = useState('');
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        try {
            setLoading(true);
            const response = await axiosClient.get(API_ENDPOINTS.PATIENTS);
            const data = response.data;
            setPatients(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error("Error fetching patients:", err);
            setError("환자 목록을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    // const filteredPatients = patients.filter(patient =>
    //     `${patient.first_name} ${patient.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    //     patient.pid?.toLowerCase().includes(searchTerm.toLowerCase())
    // );

    // 환자 이름 검색
    const filteredPatients = patients.filter(patient => {
        const first = patient.first_name ?? patient.firstName ?? "";
        const last = patient.last_name ?? patient.lastName ?? "";
        const pid = patient.pid ?? patient.patient_id ?? "";

        // ✔ 성 + 이름 붙여서 (김철수)
        const fullName = `${last}${first}`.toLowerCase();  
        const term = searchTerm.toLowerCase();

        return fullName.includes(term) || pid.toLowerCase().includes(term);
    });


    const handlePatientSelect = (patientId) => {
        navigate(`/antigen-test/${patientId}`);
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <DashboardLayout role={user?.role} activePage="antigen-test" title="항원 검사">
            {/* <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}> */}
                <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                    <TextField
                        fullWidth
                        placeholder="환자 이름 또는 환자 번호(PID)로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                            sx: { borderRadius: '12px' }
                        }}
                        sx={{ mb: 3 }}
                    />

                    <Typography variant="body1" color="text.secondary">
                        항원 검사를 진행할 환자를 검색 후 검사를 시작해주세요.
                    </Typography>

                    {error && <ErrorAlert message={error} sx={{ mb: 2 }} />}

                    <List sx={{ maxHeight: '500px', overflow: 'auto' }}>
                        {filteredPatients.length === 0 ? (
                            <Box sx={{ py: 4, textAlign: 'center' }}>
                                <Typography color="text.secondary">검색 결과가 없습니다.</Typography>
                            </Box>
                        ) : (
                            filteredPatients.map((patient, index) => (
                                <React.Fragment key={patient.id}>
                                    <ListItem
                                        alignItems="center"
                                        secondaryAction={
                                            <Button
                                                variant="contained"
                                                startIcon={<ScienceIcon />}
                                                onClick={() => handlePatientSelect(patient.id)}
                                                sx={{ borderRadius: '8px' }}
                                            >
                                                검사 시작
                                            </Button>
                                        }
                                        sx={{
                                            py: 2,
                                            '&:hover': { bgcolor: 'rgba(0,0,0,0.02)' }
                                        }}
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: patient.gender === 'M' ? 'primary.light' : 'secondary.light' }}>
                                                <PersonIcon />
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <Typography variant="subtitle1" fontWeight={600}>
                                                        {patient.last_name}{patient.first_name}
                                                    </Typography>
                                                    <Chip
                                                        label={patient.gender === 'M' ? '남성' : '여성'}
                                                        size="small"
                                                        color={patient.gender === 'M' ? 'primary' : 'secondary'}
                                                        variant="outlined"
                                                    />
                                                </Box>
                                            }
                                            secondary={
                                                <React.Fragment>
                                                    <Typography component="span" variant="body2" color="text.primary">
                                                        PID: {patient.pid}
                                                    </Typography>
                                                    {` — ${patient.date_of_birth || '생년월일 미상'}`}
                                                </React.Fragment>
                                            }
                                        />
                                    </ListItem>
                                    {index < filteredPatients.length - 1 && <Divider variant="inset" component="li" />}
                                </React.Fragment>
                            ))
                        )}
                    </List>
                </Paper>
            {/* </Container> */}
        </DashboardLayout>
    );
};

export default AntigenTestPage;
