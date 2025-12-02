import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Typography,
    Box,
    Paper,
    Grid,
    TextField,
    Button,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    IconButton,
    Card,
    CardContent,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Chip,
    Stack,
    Alert,
    List,
    ListItem,
    ListItemText,
    Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ScienceIcon from '@mui/icons-material/Science';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import ProteinViewer from '../components/ProteinViewer';

// Mock Prediction Logic (since backend is not ready)
const mockPredict = (inputs) => {
    return inputs.map((input, index) => {
        // Randomly assign categories for demo
        const rand = Math.random();
        let category = 'NORMAL';
        let proteinType = 'Unknown Protein';

        if (rand > 0.8) category = 'COVID';
        else if (rand > 0.6) category = 'FLU';
        else if (rand > 0.4) category = 'COLD';

        if (input.type === 'PROTEIN') proteinType = 'Spike Protein';
        else if (input.type === 'DNA') proteinType = 'Viral DNA Fragment';
        else proteinType = 'Viral RNA Sequence';

        return {
            id: index + 1,
            inputValue: input.value,
            inputType: input.type,
            task1: category === 'NORMAL' ? '정상' : '항원 감지',
            task2: category,
            task3: proteinType,
            pdbId: '1UBQ' // Demo PDB ID
        };
    });
};

const CATEGORY_COLORS = {
    COVID: '#dc2626', // Red
    FLU: '#ea580c',   // Orange
    COLD: '#d97706',  // Amber
    NORMAL: '#16a34a' // Green
};

const CATEGORY_LABELS = {
    COVID: '코로나',
    FLU: '독감',
    COLD: '감기',
    NORMAL: '정상'
};

const AntigenResultPage = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const [patient, setPatient] = useState(null);
    const [inputs, setInputs] = useState([{ type: 'DNA', value: '' }]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);

    // Popup State
    const [openPopup, setOpenPopup] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);

    useEffect(() => {
        const fetchPatient = async () => {
            try {
                const res = await axiosClient.get(`${API_ENDPOINTS.PATIENTS}${patientId}/`);
                setPatient(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchPatient();
    }, [patientId]);

    const handleAddInput = () => {
        setInputs([...inputs, { type: 'DNA', value: '' }]);
    };

    const handleRemoveInput = (index) => {
        const newInputs = inputs.filter((_, i) => i !== index);
        setInputs(newInputs);
    };

    const handleInputChange = (index, field, value) => {
        const newInputs = [...inputs];
        newInputs[index][field] = value;
        setInputs(newInputs);
    };

    const handlePredict = async () => {
        setLoading(true);
        // Simulate API delay
        setTimeout(() => {
            const predictions = mockPredict(inputs);

            // Sort: COVID -> FLU -> COLD -> NORMAL
            const priority = { 'COVID': 0, 'FLU': 1, 'COLD': 2, 'NORMAL': 3 };
            predictions.sort((a, b) => priority[a.task2] - priority[b.task2]);

            setResults(predictions);
            setLoading(false);
        }, 1000);
    };

    const handleOpenPopup = (result) => {
        setSelectedResult(result);
        setOpenPopup(true);
    };

    const handleCreatePrescription = () => {
        // Navigate to prescription management with pre-filled data (if implemented)
        // For now, just go to the list
        navigate('/prescriptions', {
            state: {
                patient_id: patientId,
                instructions: `항원 검사 결과 기반 처방:\n${results.map(r => `- ${r.task2}: ${r.task3}`).join('\n')}`
            }
        });
    };

    return (
        <DashboardLayout role={user?.role} activePage="antigen-test" title="항원 검사 결과">
            <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/antigen-test')}>
                        환자 선택으로
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<ReceiptLongIcon />}
                        onClick={handleCreatePrescription}
                        disabled={results.length === 0}
                    >
                        최종 처방전 생성
                    </Button>
                </Box>

                <Grid container spacing={3}>
                    {/* Left: Input Section */}
                    <Grid item xs={12} md={5}>
                        <Paper sx={{ p: 3, borderRadius: '16px', height: '100%' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                검사 데이터 입력
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                환자: {patient?.last_name}{patient?.first_name} ({patient?.pid})
                            </Typography>

                            <Stack spacing={2}>
                                {inputs.map((input, index) => (
                                    <Box key={index} sx={{ display: 'flex', gap: 1 }}>
                                        <FormControl size="small" sx={{ minWidth: 100 }}>
                                            <Select
                                                value={input.type}
                                                onChange={(e) => handleInputChange(index, 'type', e.target.value)}
                                            >
                                                <MenuItem value="DNA">DNA</MenuItem>
                                                <MenuItem value="RNA">RNA</MenuItem>
                                                <MenuItem value="PROTEIN">PROTEIN</MenuItem>
                                            </Select>
                                        </FormControl>
                                        <TextField
                                            fullWidth
                                            size="small"
                                            placeholder="값 입력"
                                            value={input.value}
                                            onChange={(e) => handleInputChange(index, 'value', e.target.value)}
                                        />
                                        {inputs.length > 1 && (
                                            <IconButton onClick={() => handleRemoveInput(index)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                            </Stack>

                            <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                                <Button startIcon={<AddIcon />} onClick={handleAddInput} fullWidth variant="outlined">
                                    항목 추가
                                </Button>
                                <Button
                                    startIcon={<ScienceIcon />}
                                    onClick={handlePredict}
                                    fullWidth
                                    variant="contained"
                                    disabled={loading}
                                >
                                    {loading ? '분석 중...' : '예측 실행'}
                                </Button>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right: Result Section */}
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3, borderRadius: '16px', minHeight: '400px' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                예측 결과 분석
                            </Typography>

                            {results.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'text.secondary' }}>
                                    데이터를 입력하고 예측을 실행하세요.
                                </Box>
                            ) : (
                                <Stack spacing={2}>
                                    {results.map((result) => (
                                        <Card
                                            key={result.id}
                                            variant="outlined"
                                            sx={{
                                                borderColor: CATEGORY_COLORS[result.task2],
                                                borderLeftWidth: 6,
                                                transition: 'transform 0.2s',
                                                '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                                            }}
                                        >
                                            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Box>
                                                        <Typography variant="subtitle2" color="text.secondary">
                                                            #{result.id} [{result.inputType}]
                                                        </Typography>
                                                        <Typography variant="body1" fontWeight={600} noWrap sx={{ maxWidth: '200px' }}>
                                                            {result.inputValue}
                                                        </Typography>
                                                    </Box>
                                                    <Box sx={{ textAlign: 'right' }}>
                                                        <Chip
                                                            label={result.task1}
                                                            size="small"
                                                            sx={{ mr: 1, bgcolor: '#f3f4f6' }}
                                                        />
                                                        <Chip
                                                            label={CATEGORY_LABELS[result.task2]}
                                                            sx={{
                                                                bgcolor: CATEGORY_COLORS[result.task2],
                                                                color: 'white',
                                                                fontWeight: 'bold'
                                                            }}
                                                        />
                                                    </Box>
                                                </Box>
                                                <Divider sx={{ my: 1.5 }} />
                                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <Typography variant="body2">
                                                        <strong>단백질 분류:</strong> {result.task3}
                                                    </Typography>
                                                    <Button
                                                        size="small"
                                                        endIcon={<VisibilityIcon />}
                                                        onClick={() => handleOpenPopup(result)}
                                                    >
                                                        더보기
                                                    </Button>
                                                </Box>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Detail Popup */}
                <Dialog open={openPopup} onClose={() => setOpenPopup(false)} maxWidth="md" fullWidth>
                    <DialogTitle>
                        상세 분석 결과
                        <Typography variant="subtitle2" color="text.secondary">
                            {selectedResult?.task3} ({selectedResult?.task2})
                        </Typography>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight={600}>3D 구조 시각화</Typography>
                                <Box sx={{ height: '300px', border: '1px solid #eee', borderRadius: '8px', overflow: 'hidden' }}>
                                    <ProteinViewer pdbId={selectedResult?.pdbId} height="100%" />
                                </Box>
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight={600}>분석 상세</Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemText primary="입력 서열" secondary={selectedResult?.inputValue} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="1차 분류" secondary={selectedResult?.task1} />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="2차 분류 (질병)"
                                            secondary={
                                                <span style={{ color: CATEGORY_COLORS[selectedResult?.task2], fontWeight: 'bold' }}>
                                                    {CATEGORY_LABELS[selectedResult?.task2]}
                                                </span>
                                            }
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText primary="3차 분류 (단백질)" secondary={selectedResult?.task3} />
                                    </ListItem>
                                </List>
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    AI 모델이 해당 서열을 <strong>{CATEGORY_LABELS[selectedResult?.task2]}</strong>와 연관된 <strong>{selectedResult?.task3}</strong>로 식별했습니다.
                                </Alert>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setOpenPopup(false)}>닫기</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </DashboardLayout>
    );
};

export default AntigenResultPage;
