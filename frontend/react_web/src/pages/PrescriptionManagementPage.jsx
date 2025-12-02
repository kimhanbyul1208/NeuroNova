import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Container,
    Paper,
    Typography,
    Button,
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Grid,
    Chip,
    IconButton,
    MenuItem,
    Card,
    CardContent,
    Alert,
    CircularProgress,
} from '@mui/material';
import {
    Add as AddIcon,
    Edit as EditIcon,
    Delete as DeleteIcon,
    Search as SearchIcon,
    AutoAwesome as AiIcon,
    Psychology as BrainIcon,
} from '@mui/icons-material';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { LoadingSpinner, ErrorAlert } from '../components';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import './DashboardPage.css';

/**
 * Prescription Management Page
 * 처방전 목록 조회, 생성, 수정, 삭제
 */
const PrescriptionManagementPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [prescriptions, setPrescriptions] = useState([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPrescription, setEditingPrescription] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // AI 추천 관련 상태
    const [aiRecommendations, setAiRecommendations] = useState([]);
    const [loadingAi, setLoadingAi] = useState(false);
    const [showAiPanel, setShowAiPanel] = useState(false);

    const [formData, setFormData] = useState({
        patient_id: '',
        encounter_id: '',
        medication_name: '',
        dosage: '',
        frequency: '',
        duration_days: '',
        instructions: '',
        status: 'ACTIVE',
    });

    const location = useLocation();

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    useEffect(() => {
        if (location.state) {
            setFormData(prev => ({
                ...prev,
                ...location.state
            }));
            setEditingPrescription(null); // Ensure it's treated as new
            setDialogOpen(true);

            // Clear state to prevent reopening on refresh
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosClient.get(API_ENDPOINTS.PRESCRIPTIONS);

            // Handle pagination
            const data = response.data;
            setPrescriptions(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            setError(err.response?.data?.message || '처방전 목록을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (prescription = null) => {
        if (prescription) {
            setEditingPrescription(prescription);
            setFormData(prescription);
        } else {
            setEditingPrescription(null);
            setFormData({
                patient_id: '',
                encounter_id: '',
                medication_name: '',
                dosage: '',
                frequency: '',
                duration_days: '',
                instructions: '',
                status: 'ACTIVE',
            });
        }
        setDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setEditingPrescription(null);
    };

    const handleChange = (field) => (event) => {
        setFormData({
            ...formData,
            [field]: event.target.value,
        });
    };

    const handleSave = async () => {
        try {
            if (editingPrescription) {
                await axiosClient.put(
                    `${API_ENDPOINTS.PRESCRIPTIONS}${editingPrescription.id}/`,
                    formData
                );
            } else {
                await axiosClient.post(API_ENDPOINTS.PRESCRIPTIONS, formData);
            }
            handleCloseDialog();
            fetchPrescriptions();
        } catch (err) {
            setError(err.response?.data?.message || '처방전 저장에 실패했습니다.');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('정말 이 처방전을 삭제하시겠습니까?')) {
            return;
        }

        try {
            await axiosClient.delete(`${API_ENDPOINTS.PRESCRIPTIONS}${id}/`);
            fetchPrescriptions();
        } catch (err) {
            setError(err.response?.data?.message || '처방전 삭제에 실패했습니다.');
        }
    };

    /**
     * AI 처방전 추천 요청
     */
    const handleAiRecommendation = async () => {
        if (!formData.patient_id) {
            setError('환자 ID를 먼저 입력해주세요.');
            return;
        }

        try {
            setLoadingAi(true);
            setError(null);

            // AI API 호출
            const response = await axiosClient.post(API_ENDPOINTS.AI_PRESCRIPTION_RECOMMEND, {
                patient_id: formData.patient_id,
                encounter_id: formData.encounter_id,
                symptoms: formData.instructions, // 증상 정보를 instructions에서 가져옴
            });

            setAiRecommendations(response.data.recommendations || []);
            setShowAiPanel(true);
        } catch (err) {
            setError(err.response?.data?.message || 'AI 추천을 불러오는데 실패했습니다.');
            // 백엔드가 준비되지 않은 경우 목업 데이터 사용
            if (err.response?.status === 404 || err.response?.status === 500) {
                setAiRecommendations([
                    {
                        medication_name: '아세트아미노펜',
                        dosage: '500mg',
                        frequency: '1일 3회',
                        duration_days: 7,
                        instructions: '식후 30분에 복용',
                        confidence: 0.95,
                        reason: '발열 및 통증 완화에 효과적입니다.'
                    },
                    {
                        medication_name: '이부프로펜',
                        dosage: '200mg',
                        frequency: '1일 2회',
                        duration_days: 5,
                        instructions: '식후 복용',
                        confidence: 0.87,
                        reason: '항염증 효과가 있습니다.'
                    }
                ]);
                setShowAiPanel(true);
            }
        } finally {
            setLoadingAi(false);
        }
    };

    /**
     * AI 추천 항목 적용
     */
    const handleApplyAiRecommendation = (recommendation) => {
        setFormData({
            ...formData,
            medication_name: recommendation.medication_name,
            dosage: recommendation.dosage,
            frequency: recommendation.frequency,
            duration_days: recommendation.duration_days,
            instructions: recommendation.instructions,
        });
        setShowAiPanel(false);
    };

    const filteredPrescriptions = prescriptions.filter((prescription) =>
        prescription.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status) {
            case 'ACTIVE':
                return 'success';
            case 'COMPLETED':
                return 'default';
            case 'CANCELLED':
                return 'error';
            default:
                return 'default';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'ACTIVE':
                return '활성';
            case 'COMPLETED':
                return '완료';
            case 'CANCELLED':
                return '취소';
            default:
                return status;
        }
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <DashboardLayout role={user?.role} activePage="prescriptions" title="Prescription Management">
            <div className="page-container">
                <div className="page-header">
                    <h1 className="page-title">
                        처방전 관리
                    </h1>
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDialog()}
                    >
                        새 처방전
                    </Button>
                </div>

                {error && <ErrorAlert message={error} onRetry={fetchPrescriptions} sx={{ mb: 3 }} />}

                <div className="search-bar-container">
                    <TextField
                        fullWidth
                        placeholder="약물명 또는 환자명으로 검색..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                            disableUnderline: true
                        }}
                        variant="standard"
                    />
                </div>

                <TableContainer component={Paper} className="content-card">
                    <Table className="results-table">
                        <TableHead>
                            <TableRow className="table-header-row">
                                <TableCell className="table-header-cell">환자명</TableCell>
                                <TableCell className="table-header-cell">약물명</TableCell>
                                <TableCell className="table-header-cell">용량</TableCell>
                                <TableCell className="table-header-cell">복용 빈도</TableCell>
                                <TableCell className="table-header-cell">기간</TableCell>
                                <TableCell className="table-header-cell">상태</TableCell>
                                <TableCell className="table-header-cell">처방일</TableCell>
                                <TableCell className="table-header-cell" align="right">작업</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPrescriptions.length === 0 ? (
                                <TableRow className="table-body-row">
                                    <TableCell colSpan={8} align="center" className="table-body-cell">
                                        <Typography variant="body2" color="text.secondary">
                                            처방전이 없습니다.
                                        </Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPrescriptions.map((prescription) => (
                                    <TableRow key={prescription.id} hover className="table-body-row">
                                        <TableCell className="table-body-cell">{prescription.patient_name || '-'}</TableCell>
                                        <TableCell className="table-body-cell">{prescription.medication_name}</TableCell>
                                        <TableCell className="table-body-cell">{prescription.dosage}</TableCell>
                                        <TableCell className="table-body-cell">{prescription.frequency}</TableCell>
                                        <TableCell className="table-body-cell">{prescription.duration_days}일</TableCell>
                                        <TableCell className="table-body-cell">
                                            <Chip
                                                label={getStatusLabel(prescription.status)}
                                                color={getStatusColor(prescription.status)}
                                                size="small"
                                            />
                                        </TableCell>
                                        <TableCell className="table-body-cell">
                                            {new Date(prescription.created_at).toLocaleDateString('ko-KR')}
                                        </TableCell>
                                        <TableCell className="table-body-cell" align="right">
                                            <IconButton
                                                size="small"
                                                onClick={() => handleOpenDialog(prescription)}
                                                color="primary"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                            <IconButton
                                                size="small"
                                                onClick={() => handleDelete(prescription.id)}
                                                color="error"
                                            >
                                                <DeleteIcon />
                                            </IconButton>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                {/* Create/Edit Dialog */}
                <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
                    <DialogTitle>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                            <span>{editingPrescription ? '처방전 수정' : '새 처방전 작성'}</span>
                            {!editingPrescription && (
                                <Button
                                    variant="outlined"
                                    startIcon={loadingAi ? <CircularProgress size={20} /> : <BrainIcon />}
                                    onClick={handleAiRecommendation}
                                    disabled={loadingAi || !formData.patient_id}
                                    sx={{
                                        borderColor: '#667eea',
                                        color: '#667eea',
                                        '&:hover': {
                                            borderColor: '#5568d3',
                                            backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                        }
                                    }}
                                >
                                    AI 처방 추천
                                </Button>
                            )}
                        </Box>
                    </DialogTitle>
                    <DialogContent>
                        {/* AI 추천 패널 */}
                        {showAiPanel && aiRecommendations.length > 0 && (
                            <Alert
                                severity="info"
                                sx={{ mb: 2 }}
                                onClose={() => setShowAiPanel(false)}
                            >
                                <Typography variant="subtitle2" gutterBottom>
                                    <BrainIcon sx={{ fontSize: 18, verticalAlign: 'middle', mr: 1 }} />
                                    AI 추천 처방
                                </Typography>
                                <Grid container spacing={2} sx={{ mt: 1 }}>
                                    {aiRecommendations.map((rec, index) => (
                                        <Grid item xs={12} key={index}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    cursor: 'pointer',
                                                    '&:hover': {
                                                        backgroundColor: 'rgba(102, 126, 234, 0.04)',
                                                        borderColor: '#667eea'
                                                    }
                                                }}
                                                onClick={() => handleApplyAiRecommendation(rec)}
                                            >
                                                <CardContent>
                                                    <Box display="flex" justifyContent="space-between" alignItems="start">
                                                        <Box flex={1}>
                                                            <Typography variant="h6" gutterBottom>
                                                                {rec.medication_name}
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                용량: {rec.dosage} | 빈도: {rec.frequency} | 기간: {rec.duration_days}일
                                                            </Typography>
                                                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                                                                복용법: {rec.instructions}
                                                            </Typography>
                                                            {rec.reason && (
                                                                <Typography variant="body2" sx={{ mt: 1, fontStyle: 'italic' }}>
                                                                    💡 {rec.reason}
                                                                </Typography>
                                                            )}
                                                        </Box>
                                                        {rec.confidence && (
                                                            <Chip
                                                                label={`신뢰도 ${(rec.confidence * 100).toFixed(0)}%`}
                                                                color="primary"
                                                                size="small"
                                                                sx={{ ml: 2 }}
                                                            />
                                                        )}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            </Alert>
                        )}

                        <Grid container spacing={2} sx={{ mt: 1 }}>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="환자 ID"
                                    type="number"
                                    value={formData.patient_id}
                                    onChange={handleChange('patient_id')}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="진료 ID"
                                    type="number"
                                    value={formData.encounter_id}
                                    onChange={handleChange('encounter_id')}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="약물명"
                                    value={formData.medication_name}
                                    onChange={handleChange('medication_name')}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="용량"
                                    value={formData.dosage}
                                    onChange={handleChange('dosage')}
                                    placeholder="예: 500mg"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="복용 빈도"
                                    value={formData.frequency}
                                    onChange={handleChange('frequency')}
                                    placeholder="예: 1일 3회"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="복용 기간 (일)"
                                    type="number"
                                    value={formData.duration_days}
                                    onChange={handleChange('duration_days')}
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="상태"
                                    value={formData.status}
                                    onChange={handleChange('status')}
                                >
                                    <MenuItem value="ACTIVE">활성</MenuItem>
                                    <MenuItem value="COMPLETED">완료</MenuItem>
                                    <MenuItem value="CANCELLED">취소</MenuItem>
                                </TextField>
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    multiline
                                    rows={3}
                                    label="복용 지시사항"
                                    value={formData.instructions}
                                    onChange={handleChange('instructions')}
                                    placeholder="예: 식후 30분에 복용"
                                />
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={handleCloseDialog}>취소</Button>
                        <Button onClick={handleSave} variant="contained">
                            저장
                        </Button>
                    </DialogActions>
                </Dialog>
            </div>
        </DashboardLayout>
    );
};

export default PrescriptionManagementPage;
