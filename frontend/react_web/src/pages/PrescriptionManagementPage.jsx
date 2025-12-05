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

    const [encounters, setEncounters] = useState([]);

    const [formData, setFormData] = useState({
        patient_id: '',
        encounter: '',
        medication_code: 'MED-' + Math.floor(Math.random() * 10000), // Default random code
        medication_name: '',
        dosage: '',
        frequency: '',
        duration: '',
        route: 'Oral',
        instructions: '',
    });

    const location = useLocation();

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    useEffect(() => {
        if (location.state) {
            setFormData(prev => ({
                ...prev,
                ...location.state,
                // Ensure medication_code is set if not provided
                medication_code: location.state.medication_code || ('MED-' + Math.floor(Math.random() * 10000))
            }));
            setEditingPrescription(null);
            setDialogOpen(true);

            // If patient_id is provided, fetch encounters
            if (location.state.patient_id) {
                fetchEncounters(location.state.patient_id);
            }

            window.history.replaceState({}, document.title);
        }
    }, [location]);

    // Fetch encounters when patient_id changes
    useEffect(() => {
        if (formData.patient_id) {
            fetchEncounters(formData.patient_id);
        }
    }, [formData.patient_id]);

    const fetchEncounters = async (patientId) => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.ENCOUNTERS, {
                params: { patient: patientId }
            });
            const data = response.data.results || response.data;
            setEncounters(data);

            // Auto-select latest encounter if not set
            if (data.length > 0 && !formData.encounter) {
                setFormData(prev => ({
                    ...prev,
                    encounter: data[0].id
                }));
            }
        } catch (err) {
            console.error('Failed to fetch encounters:', err);
        }
    };

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
            setFormData({
                ...prescription,
                // Ensure fields match
                duration: prescription.duration || prescription.duration_days,
                encounter: prescription.encounter || prescription.encounter_id
            });
            if (prescription.patient_id) {
                fetchEncounters(prescription.patient_id);
            }
        } else {
            setEditingPrescription(null);
            setFormData({
                patient_id: '',
                encounter: '',
                medication_code: 'MED-' + Math.floor(Math.random() * 10000),
                medication_name: '',
                dosage: '',
                frequency: '',
                duration: '',
                route: 'Oral',
                instructions: '',
            });
            setEncounters([]);
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
            setLoading(true);
            setError(null);

            let encounterId = formData.encounter;

            // If no encounter exists, create one automatically
            if (!encounterId && formData.patient_id) {
                try {
                    // Create a new encounter for this patient with required fields
                    const encounterResponse = await axiosClient.post(API_ENDPOINTS.ENCOUNTERS, {
                        patient: formData.patient_id,
                        doctor: user?.id, // Current logged in doctor
                        encounter_date: new Date().toISOString(),
                        reason: '처방전 발급',
                        facility: '외래',
                        status: 'IN_PROGRESS'
                    });

                    if (encounterResponse.data && encounterResponse.data.id) {
                        encounterId = encounterResponse.data.id;
                        // Update state to reflect the new encounter
                        setFormData(prev => ({
                            ...prev,
                            encounter: encounterId
                        }));
                    } else {
                        throw new Error('진료 기록 생성 후 ID를 반환받지 못했습니다.');
                    }

                    // Refresh encounters list
                    await fetchEncounters(formData.patient_id);
                } catch (encounterErr) {
                    console.error('Failed to create encounter:', encounterErr);
                    const errorMsg = encounterErr.response?.data?.detail ||
                        encounterErr.response?.data?.error ||
                        encounterErr.response?.data?.message ||
                        encounterErr.message ||
                        '진료 기록 생성에 실패했습니다. 환자 ID를 확인해주세요.';
                    setError(errorMsg);
                    setLoading(false);
                    return;
                }
            }

            // Validate required fields
            if (!encounterId) {
                setError('진료 세션(Encounter)이 필요합니다. 환자를 선택하거나 진료 기록을 확인해주세요.');
                setLoading(false);
                return;
            }

            const payload = {
                ...formData,
                // Ensure correct field names for backend
                duration: formData.duration, // Backend expects 'duration'
                encounter: encounterId, // Backend expects 'encounter' ID
                medication_code: formData.medication_code || 'MED-UNKNOWN'
            };

            // Remove fields not in model
            delete payload.patient_id; // Backend uses encounter to link patient
            delete payload.status; // Not in model
            delete payload.duration_days; // Renamed to duration

            if (editingPrescription) {
                await axiosClient.put(
                    `${API_ENDPOINTS.PRESCRIPTIONS}${editingPrescription.id}/`,
                    payload
                );
            } else {
                await axiosClient.post(API_ENDPOINTS.PRESCRIPTIONS, payload);
            }
            handleCloseDialog();
            fetchPrescriptions();
        } catch (err) {
            console.error('Save error:', err);
            setError(err.response?.data?.message || err.response?.data?.error || '처방전 저장에 실패했습니다. 입력 값을 확인해주세요.');
        } finally {
            setLoading(false);
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
                encounter_id: formData.encounter,
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
                        duration_days: '7일',
                        instructions: '식후 30분에 복용',
                        confidence: 0.95,
                        reason: '발열 및 통증 완화에 효과적입니다.'
                    },
                    {
                        medication_name: '이부프로펜',
                        dosage: '200mg',
                        frequency: '1일 2회',
                        duration_days: '5일',
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
            duration: recommendation.duration_days || recommendation.duration, // Handle both formats
            instructions: recommendation.instructions,
        });
        setShowAiPanel(false);
    };

    const filteredPrescriptions = prescriptions.filter((prescription) =>
        prescription.medication_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prescription.patient_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        // Status is not in backend model, but keeping for UI if needed or future use
        return 'default';
    };

    const getStatusLabel = (status) => {
        return status || '-';
    };

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    return (
        <DashboardLayout role={user?.role} activePage="prescriptions" title="Prescription Management">
            <div className="page-container">
                {error && <ErrorAlert message={error} onRetry={fetchPrescriptions} sx={{ mb: 3 }} />}
                <div className="search-actions">
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
                    <div className="add-btn-container">
                        <Button
                            variant="contained"
                            startIcon={<AddIcon />}
                            onClick={() => handleOpenDialog()}
                        >
                            새 처방전
                        </Button>
                    </div>
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
                                <TableCell className="table-header-cell">처방일</TableCell>
                                <TableCell className="table-header-cell" align="right">작업</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {filteredPrescriptions.length === 0 ? (
                                <TableRow className="table-body-row">
                                    <TableCell colSpan={7} align="center" className="table-body-cell">
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
                                        <TableCell className="table-body-cell">{prescription.duration}</TableCell>
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
                                                                용량: {rec.dosage} | 빈도: {rec.frequency} | 기간: {rec.duration_days || rec.duration}
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
                                    helperText="환자 ID를 입력하면 진료 세션이 자동 로드됩니다."
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    select
                                    label="진료 세션 (Encounter)"
                                    value={formData.encounter}
                                    onChange={handleChange('encounter')}
                                    required
                                    disabled={encounters.length === 0}
                                >
                                    {encounters.map((enc) => (
                                        <MenuItem key={enc.id} value={enc.id}>
                                            {new Date(enc.encounter_date).toLocaleDateString()} - {enc.facility || enc.type || '진료'}
                                        </MenuItem>
                                    ))}
                                    {encounters.length === 0 && (
                                        <MenuItem value="" disabled>
                                            진료 기록 없음
                                        </MenuItem>
                                    )}
                                </TextField>
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
                                    label="복용 기간"
                                    value={formData.duration}
                                    onChange={handleChange('duration')}
                                    placeholder="예: 7일"
                                    required
                                />
                            </Grid>
                            <Grid item xs={12} sm={6}>
                                <TextField
                                    fullWidth
                                    label="약물 코드"
                                    value={formData.medication_code}
                                    onChange={handleChange('medication_code')}
                                    disabled
                                />
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
