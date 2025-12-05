import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Avatar,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    Divider,
    Stack,
    Button,
    TextField,
    InputAdornment,
} from '@mui/material';
import {
    ExpandMore as ExpandMoreIcon,
    Person as PersonIcon,
    LocalHospital as HospitalIcon,
    Search as SearchIcon,
    CalendarToday as CalendarIcon,
    Assignment as AssignmentIcon,
} from '@mui/icons-material';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { LoadingSpinner, ErrorAlert } from '../components';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import './DashboardPage.css';

/**
 * Doctor-Patient Relationship Dashboard
 * Shows doctors and their assigned patients with relationship details
 */
const DoctorPatientRelationshipPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [doctors, setDoctors] = useState([]);
    const [relationships, setRelationships] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedDoctor, setExpandedDoctor] = useState(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch doctors and patient-doctor relationships in parallel
            const [doctorsRes, relationshipsRes] = await Promise.all([
                axiosClient.get(API_ENDPOINTS.DOCTORS),
                axiosClient.get(API_ENDPOINTS.PATIENT_DOCTORS)
            ]);

            const doctorsList = Array.isArray(doctorsRes.data) ? doctorsRes.data : doctorsRes.data.results || [];
            const relationshipsList = Array.isArray(relationshipsRes.data) ? relationshipsRes.data : relationshipsRes.data.results || [];

            setDoctors(doctorsList);
            setRelationships(relationshipsList);
        } catch (err) {
            console.error('Failed to fetch data:', err);
            setError(err.response?.data?.message || '데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // Group relationships by doctor
    const groupedData = doctors.map(doctor => {
        const doctorRelationships = relationships.filter(rel => rel.doctor === doctor.id);

        return {
            doctor,
            relationships: doctorRelationships,
            patientCount: doctorRelationships.length,
            primaryPatientCount: doctorRelationships.filter(rel => rel.is_primary).length
        };
    });

    // Filter by search term
    const filteredData = groupedData.filter(data => {
        const searchLower = searchTerm.toLowerCase();
        const doctorName = data.doctor.user_name?.toLowerCase() || '';
        const specialty = data.doctor.specialty?.toLowerCase() || '';
        const department = data.doctor.department?.toLowerCase() || '';

        return doctorName.includes(searchLower) ||
               specialty.includes(searchLower) ||
               department.includes(searchLower);
    });

    const handleAccordionChange = (doctorId) => (event, isExpanded) => {
        setExpandedDoctor(isExpanded ? doctorId : null);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <DashboardLayout role={user?.role} activePage="doctor-patient-relations" title="Doctor-Patient Relationships">
            <Container maxWidth="xl" sx={{ py: 4 }}>
                {error && <ErrorAlert message={error} onRetry={fetchData} sx={{ mb: 3 }} />}

                {/* Header Section */}
                <Box sx={{ mb: 4 }}>
                    <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: '#2f3542' }}>
                        <HospitalIcon sx={{ fontSize: 36, verticalAlign: 'middle', mr: 1, color: '#667eea' }} />
                        의사-환자 관계 관리
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                        담당의와 담당환자의 관계를 확인하고 관리합니다
                    </Typography>
                </Box>

                {/* Summary Cards */}
                <Grid container spacing={3} sx={{ mb: 4 }}>
                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            color: 'white',
                            boxShadow: '0 4px 20px rgba(102, 126, 234, 0.3)'
                        }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                            {doctors.length}
                                        </Typography>
                                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                            총 의사 수
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                        <PersonIcon sx={{ fontSize: 36 }} />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                            color: 'white',
                            boxShadow: '0 4px 20px rgba(240, 147, 251, 0.3)'
                        }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                            {relationships.length}
                                        </Typography>
                                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                            총 관계 수
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                        <AssignmentIcon sx={{ fontSize: 36 }} />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>

                    <Grid item xs={12} md={4}>
                        <Card sx={{
                            background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                            color: 'white',
                            boxShadow: '0 4px 20px rgba(79, 172, 254, 0.3)'
                        }}>
                            <CardContent>
                                <Box display="flex" alignItems="center" justifyContent="space-between">
                                    <Box>
                                        <Typography variant="h3" sx={{ fontWeight: 700 }}>
                                            {(relationships.length / (doctors.length || 1)).toFixed(1)}
                                        </Typography>
                                        <Typography variant="body1" sx={{ opacity: 0.9 }}>
                                            평균 환자/의사
                                        </Typography>
                                    </Box>
                                    <Avatar sx={{ width: 64, height: 64, bgcolor: 'rgba(255,255,255,0.2)' }}>
                                        <HospitalIcon sx={{ fontSize: 36 }} />
                                    </Avatar>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>

                {/* Search Bar */}
                <Paper sx={{ p: 2, mb: 3 }}>
                    <TextField
                        fullWidth
                        placeholder="의사명, 전문분야, 부서로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon color="action" />
                                </InputAdornment>
                            ),
                        }}
                    />
                </Paper>

                {/* Doctor List with Patient Relationships */}
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                        의사 목록 및 담당 환자
                    </Typography>

                    {filteredData.length === 0 ? (
                        <Box sx={{ textAlign: 'center', py: 8 }}>
                            <Typography variant="body1" color="text.secondary">
                                {searchTerm ? '검색 결과가 없습니다.' : '등록된 의사가 없습니다.'}
                            </Typography>
                        </Box>
                    ) : (
                        filteredData.map(({ doctor, relationships, patientCount, primaryPatientCount }) => (
                            <Accordion
                                key={doctor.id}
                                expanded={expandedDoctor === doctor.id}
                                onChange={handleAccordionChange(doctor.id)}
                                sx={{
                                    mb: 2,
                                    '&:before': { display: 'none' },
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    borderRadius: 2,
                                    overflow: 'hidden'
                                }}
                            >
                                <AccordionSummary
                                    expandIcon={<ExpandMoreIcon />}
                                    sx={{
                                        bgcolor: expandedDoctor === doctor.id ? '#f8f9fa' : 'white',
                                        '&:hover': { bgcolor: '#f8f9fa' },
                                        borderRadius: 2
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', pr: 2 }}>
                                        <Avatar sx={{
                                            bgcolor: '#667eea',
                                            mr: 2,
                                            width: 56,
                                            height: 56
                                        }}>
                                            <PersonIcon />
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                                {doctor.user_name || `Doctor ${doctor.id}`}
                                            </Typography>
                                            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                                <Chip
                                                    label={doctor.specialty || '전문분야 미지정'}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                                <Chip
                                                    label={doctor.department || '부서 미지정'}
                                                    size="small"
                                                    variant="outlined"
                                                />
                                            </Stack>
                                        </Box>
                                        <Box sx={{ textAlign: 'right', mr: 2 }}>
                                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#667eea' }}>
                                                {patientCount}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                담당 환자
                                            </Typography>
                                        </Box>
                                        <Box sx={{ textAlign: 'right' }}>
                                            <Typography variant="h5" sx={{ fontWeight: 700, color: '#f093fb' }}>
                                                {primaryPatientCount}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                주치의
                                            </Typography>
                                        </Box>
                                    </Box>
                                </AccordionSummary>
                                <AccordionDetails sx={{ bgcolor: '#fafbfc', p: 0 }}>
                                    {relationships.length === 0 ? (
                                        <Box sx={{ textAlign: 'center', py: 4 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                담당 환자가 없습니다.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        <TableContainer>
                                            <Table>
                                                <TableHead>
                                                    <TableRow sx={{ bgcolor: '#e9ecef' }}>
                                                        <TableCell sx={{ fontWeight: 600 }}>환자 ID</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>환자명</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>주치의 여부</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>관계 생성일</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }}>최근 진료일</TableCell>
                                                        <TableCell sx={{ fontWeight: 600 }} align="right">작업</TableCell>
                                                    </TableRow>
                                                </TableHead>
                                                <TableBody>
                                                    {relationships.map((rel) => (
                                                        <TableRow
                                                            key={rel.id}
                                                            hover
                                                            sx={{ '&:last-child td': { border: 0 } }}
                                                        >
                                                            <TableCell>#{rel.patient}</TableCell>
                                                            <TableCell>
                                                                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                                                    {rel.patient_name || '-'}
                                                                </Typography>
                                                            </TableCell>
                                                            <TableCell>
                                                                {rel.is_primary ? (
                                                                    <Chip
                                                                        label="주치의"
                                                                        color="primary"
                                                                        size="small"
                                                                        sx={{ fontWeight: 600 }}
                                                                    />
                                                                ) : (
                                                                    <Chip
                                                                        label="협진의"
                                                                        variant="outlined"
                                                                        size="small"
                                                                    />
                                                                )}
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center">
                                                                    <CalendarIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                                    <Typography variant="body2">
                                                                        {formatDate(rel.assigned_date)}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell>
                                                                <Box display="flex" alignItems="center">
                                                                    <AssignmentIcon sx={{ fontSize: 16, mr: 0.5, color: 'text.secondary' }} />
                                                                    <Typography variant="body2">
                                                                        {formatDate(rel.last_visit_date)}
                                                                    </Typography>
                                                                </Box>
                                                            </TableCell>
                                                            <TableCell align="right">
                                                                <Button
                                                                    size="small"
                                                                    variant="outlined"
                                                                    onClick={() => navigate(`/patients/${rel.patient}`)}
                                                                >
                                                                    상세보기
                                                                </Button>
                                                            </TableCell>
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </TableContainer>
                                    )}
                                </AccordionDetails>
                            </Accordion>
                        ))
                    )}
                </Paper>
            </Container>
        </DashboardLayout>
    );
};

export default DoctorPatientRelationshipPage;
