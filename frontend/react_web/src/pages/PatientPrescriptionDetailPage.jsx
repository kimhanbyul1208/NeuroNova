import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Button,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PrintIcon from '@mui/icons-material/Print';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { LoadingSpinner, ErrorAlert } from '../components';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';

const PatientPrescriptionDetailPage = () => {
    const { patientId, date } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [patient, setPatient] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                // Fetch patient info
                const patientRes = await axiosClient.get(`${API_ENDPOINTS.PATIENTS}${patientId}/`);
                setPatient(patientRes.data);

                // Fetch prescriptions
                const prescriptionsRes = await axiosClient.get(`${API_ENDPOINTS.PRESCRIPTIONS}?patient_id=${patientId}`);
                const allPrescriptions = Array.isArray(prescriptionsRes.data)
                    ? prescriptionsRes.data
                    : prescriptionsRes.data.results || [];

                // Filter by date
                const filtered = allPrescriptions.filter(p =>
                    p.created_at && p.created_at.startsWith(date)
                );
                setPrescriptions(filtered);

            } catch (err) {
                console.error("Error fetching data:", err);
                setError("데이터를 불러오는데 실패했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [patientId, date]);

    if (loading) return <LoadingSpinner fullScreen />;
    if (error) return <ErrorAlert message={error} onRetry={() => window.location.reload()} />;

    return (
        <DashboardLayout role={user?.role} activePage="patients" title="처방전 상세">
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate(-1)}
                    sx={{ mb: 2 }}
                >
                    뒤로 가기
                </Button>

                <Paper sx={{ p: 4, borderRadius: '16px' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                        <Box>
                            <Typography variant="h4" gutterBottom fontWeight={700}>
                                처방전 상세 내역
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                환자: {patient?.last_name}{patient?.first_name} ({patient?.pid})
                            </Typography>
                            <Typography variant="subtitle1" color="text.secondary">
                                처방 일자: {date}
                            </Typography>
                        </Box>
                        <Button
                            variant="outlined"
                            startIcon={<PrintIcon />}
                            onClick={() => window.print()}
                        >
                            인쇄
                        </Button>
                    </Box>

                    <Divider sx={{ mb: 4 }} />

                    <Typography variant="h6" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                        처방 의약품 목록
                    </Typography>

                    <TableContainer component={Paper} variant="outlined">
                        <Table>
                            <TableHead sx={{ bgcolor: '#f8f9fa' }}>
                                <TableRow>
                                    <TableCell><strong>약물명</strong></TableCell>
                                    <TableCell><strong>용량</strong></TableCell>
                                    <TableCell><strong>복용 빈도</strong></TableCell>
                                    <TableCell><strong>투약 기간</strong></TableCell>
                                    <TableCell><strong>복용법</strong></TableCell>
                                    <TableCell><strong>상태</strong></TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {prescriptions.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} align="center">
                                            처방 내역이 없습니다.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    prescriptions.map((p) => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.medication_name}</TableCell>
                                            <TableCell>{p.dosage}</TableCell>
                                            <TableCell>{p.frequency}</TableCell>
                                            <TableCell>{p.duration_days}일</TableCell>
                                            <TableCell>{p.instructions || '-'}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={p.status}
                                                    size="small"
                                                    color={p.status === 'ACTIVE' ? 'success' : 'default'}
                                                />
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </TableContainer>

                    <Box sx={{ mt: 4, p: 2, bgcolor: '#f8f9fa', borderRadius: '8px' }}>
                        <Typography variant="subtitle2" gutterBottom>
                            <strong>참고사항</strong>
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            * 본 처방전은 항원 검사 결과에 기반하여 작성되었습니다.<br />
                            * 약물 복용 중 이상 반응이 있을 경우 즉시 내원하시기 바랍니다.
                        </Typography>
                    </Box>
                </Paper>
            </Container>
        </DashboardLayout>
    );
};

export default PatientPrescriptionDetailPage;
