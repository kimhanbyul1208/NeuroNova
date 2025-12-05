import React, { useState, useEffect, useRef } from 'react';
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
    Divider,
    Tooltip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import ScienceIcon from '@mui/icons-material/Science';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DashboardLayout from '../layouts/DashboardLayout';
import { useAuth } from '../auth/AuthContext';
import { useFocusCleanup } from '../hooks/useFocusCleanup';
import { safeBlur } from '../utils/focusManager';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import ProteinViewer from '../components/ProteinViewer';
import { LoadingSpinner, ErrorAlert } from '../components';
import { getPdbUrl } from '../utils/getPdbUrl';

// Icons for Viewer Controls
const SpinIcon = () => <span>🔄</span>;
const StyleIcon = () => <span>🎨</span>;
const BgIcon = () => <span>🌓</span>;
const SaveIcon = () => <span>💾</span>;
const ResetIcon = () => <span>⏮️</span>;

const CATEGORY_COLORS = {
    Pathogen: '#dc2626',
    'Non-Pathogen': '#16a34a'
};

const PROTEIN_TYPE_COLORS = {
    Nucleocapsid: '#dc2626',
    Hemagglutinin: '#ea580c',
    Neuraminidase: '#d97706',
    Host_Protein: '#16a34a',
    Other: '#6b7280'
};

const AntigenResultPage = () => {
    const { patientId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // 포커스 관리 훅 추가
    useFocusCleanup();

    const [patient, setPatient] = useState(null);
    const [inputs, setInputs] = useState([{ type: 'PROTEIN', value: '' }]);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Popup State
    const [openPopup, setOpenPopup] = useState(false);
    const [selectedResult, setSelectedResult] = useState(null);

    // Viewer Controls State
    const [viewerInstance, setViewerInstance] = useState(null);
    const [spinning, setSpinning] = useState(false);
    const [styleMode, setStyleMode] = useState('cartoon');
    const [darkBg, setDarkBg] = useState(false);

    // Example Data Settings State
    const [openExampleSettings, setOpenExampleSettings] = useState(false);
    const [exampleSettings, setExampleSettings] = useState({
        num_people: 1,
        samples_per_person: 2,
        datatype: 'protein'
    });

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

    // 예시 데이터 로드 핸들러 (설정 팝업 열기)
    const handleOpenExampleSettings = () => {
        setOpenExampleSettings(true);
    };

    // 실제 예시 데이터 가져오기
    const handleFetchExampleData = async () => {
        setLoading(true);
        setError(null);
        setOpenExampleSettings(false);

        try {
            const response = await axiosClient.get(API_ENDPOINTS.ML_EXAMPLE_DATA, {
                params: exampleSettings
            });

            if (response.data.ok && response.data.items && response.data.items.length > 0) {
                // 첫 번째 사람의 샘플들을 가져옴
                const samples = response.data.items[0].samples;

                const newInputs = samples.map(sample => ({
                    type: sample.seq_type === 'protein' ? 'PROTEIN' : (sample.seq_type === 'dna' ? 'DNA' : 'RNA'),
                    value: sample.sequence
                }));

                setInputs(newInputs);
            } else {
                setError('예시 데이터를 가져올 수 없습니다.');
            }
        } catch (err) {
            console.error('Failed to fetch example data:', err);
            setError('예시 데이터를 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    // 실제 API 호출
    const handlePredict = async () => {
        setLoading(true);
        setError(null);

        try {
            // 입력 검증
            const validInputs = inputs.filter(input => input.value.trim() !== '');
            if (validInputs.length === 0) {
                setError('최소 하나 이상의 서열을 입력해주세요.');
                setLoading(false);
                return;
            }

            // API 요청 데이터 구성
            const requestData = {
                doctor_name: user?.username || 'Unknown Doctor',
                patient_name: patient ? `${patient.last_name}${patient.first_name}` : 'Unknown Patient',
                items: validInputs.map((input, index) => ({
                    id: `sample_${index + 1}`,
                    sequence: input.value,
                    seq_type: input.type.toLowerCase()
                })),
                task3_threshold: 0.5
            };

            console.log('API Request:', requestData);

            // Django ML Proxy로 요청
            const response = await axiosClient.post(API_ENDPOINTS.ML_PREDICT, requestData);

            console.log('API Response:', response.data);

            // 응답 데이터 파싱
            if (response.data.ok && (response.data.batch || response.data.results)) {
                // 배치 응답
                const predictions = response.data.results.map((result, index) => {
                    if (!result.ok) {
                        return {
                            id: index + 1,
                            inputValue: validInputs[index]?.value || '',
                            inputType: validInputs[index]?.type || '',
                            error: result.error || 'Unknown error',
                            task1: 'Error',
                            task2: 'Error',
                            task3: 'Error',
                            pdbId: null
                        };
                    }

                    const pred = result.prediction || {};
                    const task1 = pred.task1 || {};
                    const task2 = pred.task2 || {};
                    const task3 = pred.task3 || {};
                    const structure = result.task3_structure || {};

                    // PDB ID/URL 추출 (유틸리티 함수 사용)
                    const pdbId = getPdbUrl(structure);

                    return {
                        id: index + 1,
                        inputValue: validInputs[index]?.value || '',
                        inputType: validInputs[index]?.type || '',
                        task1Label: task1.prediction || 'Unknown',
                        task1Confidence: task1.confidence || 0,
                        task2Label: task2.prediction || 'Unknown',
                        task2Confidence: task2.confidence || 0,
                        task3TopPredictions: task3.top_predictions || [],
                        proteinName: structure.protein_name || 'Unknown',
                        pdbId: pdbId,
                        translatedSequence: result.translation?.protein_sequence || ''
                    };
                });

                setResults(predictions);
            } else if (response.data.ok && response.data.prediction) {
                // 단일 응답
                const pred = response.data.prediction || {};
                const task1 = pred.task1 || {};
                const task2 = pred.task2 || {};
                const task3 = pred.task3 || {};
                const structure = response.data.task3_structure || {};

                // PDB ID/URL 추출 (유틸리티 함수 사용)
                const pdbId = getPdbUrl(structure);

                setResults([{
                    id: 1,
                    inputValue: validInputs[0]?.value || '',
                    inputType: validInputs[0]?.type || '',
                    task1Label: task1.prediction || 'Unknown',
                    task1Confidence: task1.confidence || 0,
                    task2Label: task2.prediction || 'Unknown',
                    task2Confidence: task2.confidence || 0,
                    task3TopPredictions: task3.top_predictions || [],
                    proteinName: structure.protein_name || 'Unknown',
                    pdbId: pdbId,
                    translatedSequence: response.data.translation?.protein_sequence || ''
                }]);
            } else {
                throw new Error('예상치 못한 응답 형식입니다.');
            }

        } catch (err) {
            console.error('Prediction Error:', err);
            setError(err.response?.data?.error || err.message || '예측 중 오류가 발생했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleOpenPopup = (result) => {
        setSelectedResult(result);
        setOpenPopup(true);
        // Reset viewer state
        setSpinning(false);
        setStyleMode('cartoon');
        setDarkBg(false);
        setViewerInstance(null);
    };

    const handleCreatePrescription = () => {
        // Navigate to prescription management with pre-filled data
        const instructions = `항원 검사 결과 기반 처방:\n${results.map(r => {
            const category = r.task1Label || 'Unknown';
            const proteinType = r.task2Label || 'Unknown';
            const protein = r.proteinName || 'Unknown';
            return `- [${category}] ${proteinType} → ${protein}`;
        }).join('\n')}`;

        navigate('/prescriptions', {
            state: {
                patient_id: patientId,
                instructions: instructions
            }
        });
    };

    // Viewer Control Handlers
    const handleViewerReady = (viewer) => {
        setViewerInstance(viewer);
    };

    const handleResetView = () => {
        if (viewerInstance) {
            viewerInstance.zoomTo();
            viewerInstance.render();
        }
    };

    const handleToggleSpin = () => {
        if (viewerInstance) {
            const next = !spinning;
            viewerInstance.spin(next);
            setSpinning(next);
        }
    };

    const handleToggleStyle = () => {
        if (viewerInstance) {
            const nextMode = styleMode === 'cartoon' ? 'stick' : 'cartoon';
            setStyleMode(nextMode);

            viewerInstance.setStyle({}, {});
            if (nextMode === 'cartoon') {
                viewerInstance.setStyle({}, { cartoon: { color: 'spectrum' } });
            } else {
                viewerInstance.setStyle({}, { stick: { radius: 0.15 } });
            }
            viewerInstance.render();
        }
    };

    const handleToggleBg = () => {
        if (viewerInstance) {
            const next = !darkBg;
            setDarkBg(next);
            viewerInstance.setBackgroundColor(next ? 'black' : 'white');
            viewerInstance.render();
        }
    };

    const handleSaveImage = () => {
        if (viewerInstance) {
            const dataUrl = viewerInstance.pngURI();
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `protein_${selectedResult?.proteinName || 'structure'}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    // History State
    const [history, setHistory] = useState([]);
    const [checkedItems, setCheckedItems] = useState({});

    useEffect(() => {
        if (patientId) {
            fetchHistory();
        }
    }, [patientId]);

    const fetchHistory = async () => {
        try {
            const response = await axiosClient.get(API_ENDPOINTS.ANTIGEN_RESULTS, {
                params: { patient: patientId }
            });
            setHistory(response.data.results || response.data);
        } catch (err) {
            console.error('Failed to fetch history:', err);
        }
    };

    const handleCheckboxChange = (id, checked) => {
        setCheckedItems(prev => ({
            ...prev,
            [id]: checked
        }));
    };

    const handleSaveSelected = async () => {
        const selectedIds = Object.keys(checkedItems).filter(id => checkedItems[id]);
        if (selectedIds.length === 0) {
            alert('저장할 항목을 선택해주세요.');
            return;
        }

        setLoading(true);
        try {
            const promises = selectedIds.map(id => {
                const result = results.find(r => r.id.toString() === id);
                if (!result) return null;

                return axiosClient.post(API_ENDPOINTS.ANTIGEN_RESULTS, {
                    patient: patientId,
                    input_sequence: result.inputValue,
                    input_type: result.inputType,
                    prediction_result: {
                        task1: { prediction: result.task1Label, confidence: result.task1Confidence },
                        task2: { prediction: result.task2Label, confidence: result.task2Confidence },
                        task3: { top_predictions: result.task3TopPredictions },
                        protein_name: result.proteinName,
                        pdb_id: result.pdbId
                    }
                });
            });

            await Promise.all(promises);
            alert('선택한 항목이 저장되었습니다.');
            setCheckedItems({});
            fetchHistory();
        } catch (err) {
            console.error('Save failed:', err);
            alert('저장에 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteHistory = async (id) => {
        if (!window.confirm('정말 삭제하시겠습니까?')) return;
        try {
            await axiosClient.delete(`${API_ENDPOINTS.ANTIGEN_RESULTS}${id}/`);
            fetchHistory();
        } catch (err) {
            console.error('Delete failed:', err);
            alert('삭제에 실패했습니다.');
        }
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

                            {error && (
                                <Alert severity="error" sx={{ mb: 2 }}>
                                    {error}
                                </Alert>
                            )}

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
                                            placeholder="단백질 서열 입력 (예: MFVFLVLL...)"
                                            value={input.value}
                                            onChange={(e) => handleInputChange(index, 'value', e.target.value)}
                                            multiline
                                            maxRows={2}
                                        />
                                        {inputs.length > 1 && (
                                            <IconButton onClick={() => handleRemoveInput(index)} color="error">
                                                <DeleteIcon />
                                            </IconButton>
                                        )}
                                    </Box>
                                ))}
                            </Stack>

                            <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Button
                                    startIcon={<AddIcon />}
                                    onClick={handleOpenExampleSettings}
                                    fullWidth
                                    variant="outlined"
                                    color="secondary"
                                >
                                    예시 데이터 가져오기
                                </Button>
                                <Box sx={{ display: 'flex', gap: 1 }}>
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
                                        {loading ? '분석 중...' : 'AI 예측 실행'}
                                    </Button>
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Right: Result Section */}
                    <Grid item xs={12} md={7}>
                        <Paper sx={{ p: 3, borderRadius: '16px', minHeight: '400px', mb: 3 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="h6" fontWeight={600}>
                                    예측 결과 분석
                                </Typography>
                                {results.length > 0 && (
                                    <Button
                                        variant="outlined"
                                        startIcon={<SaveIcon />}
                                        onClick={handleSaveSelected}
                                        size="small"
                                    >
                                        선택 항목 저장
                                    </Button>
                                )}
                            </Box>

                            {results.length === 0 ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: 'text.secondary' }}>
                                    <Stack alignItems="center" spacing={2}>
                                        <ScienceIcon sx={{ fontSize: 60, opacity: 0.3 }} />
                                        <Typography>데이터를 입력하고 예측을 실행하세요.</Typography>
                                        <Typography variant="caption">예시 데이터를 로드하면 빠르게 시작할 수 있습니다.</Typography>
                                    </Stack>
                                </Box>
                            ) : (
                                <Stack spacing={2}>
                                    {results.map((result) => {
                                        const isError = result.error;
                                        const task1Color = CATEGORY_COLORS[result.task1Label] || '#6b7280';
                                        const task2Color = PROTEIN_TYPE_COLORS[result.task2Label] || '#6b7280';

                                        return (
                                            <Card
                                                key={result.id}
                                                variant="outlined"
                                                sx={{
                                                    borderColor: isError ? '#f44336' : task1Color,
                                                    borderLeftWidth: 6,
                                                    transition: 'transform 0.2s',
                                                    '&:hover': { transform: 'translateY(-2px)', boxShadow: 2 }
                                                }}
                                            >
                                                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                    {isError ? (
                                                        <Alert severity="error">
                                                            <Typography variant="subtitle2">샘플 #{result.id} 오류</Typography>
                                                            <Typography variant="body2">{result.error}</Typography>
                                                        </Alert>
                                                    ) : (
                                                        <>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={!!checkedItems[result.id]}
                                                                        onChange={(e) => handleCheckboxChange(result.id, e.target.checked)}
                                                                        style={{ width: '18px', height: '18px' }}
                                                                    />
                                                                    <Box>
                                                                        <Typography variant="subtitle2" color="text.secondary">
                                                                            샘플 #{result.id} [{result.inputType}]
                                                                        </Typography>
                                                                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '250px' }}>
                                                                            {result.inputValue.substring(0, 50)}...
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>
                                                                <Box sx={{ textAlign: 'right' }}>
                                                                    <Chip
                                                                        label={`${result.task1Label} (${(result.task1Confidence * 100).toFixed(1)}%)`}
                                                                        size="small"
                                                                        sx={{
                                                                            mr: 1,
                                                                            bgcolor: task1Color,
                                                                            color: 'white'
                                                                        }}
                                                                    />
                                                                    <Chip
                                                                        label={`${result.task2Label} (${(result.task2Confidence * 100).toFixed(1)}%)`}
                                                                        sx={{
                                                                            bgcolor: task2Color,
                                                                            color: 'white',
                                                                            fontWeight: 'bold'
                                                                        }}
                                                                    />
                                                                </Box>
                                                            </Box>
                                                            <Divider sx={{ my: 1.5 }} />
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <Box>
                                                                    <Typography variant="body2">
                                                                        <strong>상위 예측:</strong> {result.proteinName}
                                                                    </Typography>
                                                                    {result.task3TopPredictions.length > 0 && (
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            1위: {result.task3TopPredictions[0][0]} ({(result.task3TopPredictions[0][1] * 100).toFixed(1)}%)
                                                                        </Typography>
                                                                    )}
                                                                </Box>
                                                                <Button
                                                                    size="small"
                                                                    endIcon={<VisibilityIcon />}
                                                                    onClick={() => handleOpenPopup(result)}
                                                                >
                                                                    상세보기
                                                                </Button>
                                                            </Box>
                                                        </>
                                                    )}
                                                </CardContent>
                                            </Card>
                                        );
                                    })}
                                </Stack>
                            )}
                        </Paper>

                        {/* History Section */}
                        <Paper sx={{ p: 3, borderRadius: '16px' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                이전 검사 결과 (History)
                            </Typography>
                            {history.length === 0 ? (
                                <Typography color="text.secondary" align="center" sx={{ py: 3 }}>
                                    저장된 검사 결과가 없습니다.
                                </Typography>
                            ) : (
                                <Stack spacing={2}>
                                    {/* Group history by date */}
                                    {Object.entries(
                                        history.reduce((groups, item) => {
                                            const date = new Date(item.created_at).toLocaleDateString('ko-KR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            });
                                            if (!groups[date]) {
                                                groups[date] = [];
                                            }
                                            groups[date].push(item);
                                            return groups;
                                        }, {})
                                    ).map(([date, items]) => (
                                        <Box key={date}>
                                            {/* Date Header */}
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 1.5,
                                                pb: 1,
                                                borderBottom: '2px solid',
                                                borderColor: 'primary.main'
                                            }}>
                                                <Typography variant="subtitle1" fontWeight={600} color="primary">
                                                    {date}
                                                </Typography>
                                                <Chip
                                                    label={`${items.length}건`}
                                                    size="small"
                                                    color="primary"
                                                    variant="outlined"
                                                />
                                            </Box>

                                            {/* Items for this date */}
                                            <Stack spacing={1.5}>
                                                {items.map((item) => (
                                                    <Card
                                                        key={item.id}
                                                        variant="outlined"
                                                        sx={{
                                                            transition: 'all 0.2s',
                                                            '&:hover': {
                                                                boxShadow: 2,
                                                                transform: 'translateX(4px)',
                                                                borderColor: 'primary.main'
                                                            }
                                                        }}
                                                    >
                                                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <Box sx={{ flex: 1 }}>
                                                                    {/* Time and Result Type */}
                                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {new Date(item.created_at).toLocaleTimeString('ko-KR', {
                                                                                hour: '2-digit',
                                                                                minute: '2-digit'
                                                                            })}
                                                                        </Typography>
                                                                        <Chip
                                                                            label={item.prediction_result?.task1?.prediction || 'Unknown'}
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: item.prediction_result?.task1?.prediction === 'Pathogen'
                                                                                    ? CATEGORY_COLORS['Pathogen']
                                                                                    : CATEGORY_COLORS['Non-Pathogen'],
                                                                                color: 'white',
                                                                                fontWeight: 600
                                                                            }}
                                                                        />
                                                                        <Chip
                                                                            label={item.prediction_result?.task2?.prediction || 'Unknown'}
                                                                            size="small"
                                                                            sx={{
                                                                                bgcolor: PROTEIN_TYPE_COLORS[item.prediction_result?.task2?.prediction] || PROTEIN_TYPE_COLORS['Other'],
                                                                                color: 'white'
                                                                            }}
                                                                        />
                                                                    </Box>

                                                                    {/* Protein Name */}
                                                                    <Typography variant="body2" fontWeight={600} sx={{ mb: 0.5 }}>
                                                                        {item.prediction_result?.protein_name || 'Unknown Protein'}
                                                                    </Typography>

                                                                    {/* Input Type and Sequence Preview */}
                                                                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 0.5 }}>
                                                                        <Chip
                                                                            label={item.input_type}
                                                                            size="small"
                                                                            variant="outlined"
                                                                            sx={{ height: '20px' }}
                                                                        />
                                                                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                                                                            {item.input_sequence?.substring(0, 40)}...
                                                                        </Typography>
                                                                    </Box>

                                                                    {/* Confidence Scores */}
                                                                    <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Task1: <strong>{((item.prediction_result?.task1?.confidence || 0) * 100).toFixed(1)}%</strong>
                                                                        </Typography>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            Task2: <strong>{((item.prediction_result?.task2?.confidence || 0) * 100).toFixed(1)}%</strong>
                                                                        </Typography>
                                                                    </Box>
                                                                </Box>

                                                                {/* Action Buttons */}
                                                                <Box sx={{ display: 'flex', gap: 0.5 }}>
                                                                    <Tooltip title="상세보기">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="primary"
                                                                            onClick={() => {
                                                                                // Convert history item to result format for popup
                                                                                const historyAsResult = {
                                                                                    id: item.id,
                                                                                    inputValue: item.input_sequence,
                                                                                    inputType: item.input_type,
                                                                                    task1Label: item.prediction_result?.task1?.prediction || 'Unknown',
                                                                                    task1Confidence: item.prediction_result?.task1?.confidence || 0,
                                                                                    task2Label: item.prediction_result?.task2?.prediction || 'Unknown',
                                                                                    task2Confidence: item.prediction_result?.task2?.confidence || 0,
                                                                                    task3TopPredictions: item.prediction_result?.task3?.top_predictions || [],
                                                                                    proteinName: item.prediction_result?.protein_name || 'Unknown',
                                                                                    pdbId: item.prediction_result?.pdb_id || null,
                                                                                    translatedSequence: ''
                                                                                };
                                                                                handleOpenPopup(historyAsResult);
                                                                            }}
                                                                        >
                                                                            <VisibilityIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                    <Tooltip title="삭제">
                                                                        <IconButton
                                                                            size="small"
                                                                            color="error"
                                                                            onClick={() => handleDeleteHistory(item.id)}
                                                                        >
                                                                            <DeleteIcon fontSize="small" />
                                                                        </IconButton>
                                                                    </Tooltip>
                                                                </Box>
                                                            </Box>
                                                        </CardContent>
                                                    </Card>
                                                ))}
                                            </Stack>
                                        </Box>
                                    ))}
                                </Stack>
                            )}
                        </Paper>
                    </Grid>
                </Grid>

                {/* Example Data Settings Dialog */}
                <Dialog
                    open={openExampleSettings}
                    onClose={() => {
                        safeBlur();
                        setOpenExampleSettings(false);
                    }}
                >
                    <DialogTitle>예시 데이터 설정</DialogTitle>
                    <DialogContent>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            AI 모델 테스트를 위한 가상 데이터를 생성합니다.
                        </Typography>
                        <Stack spacing={2} sx={{ mt: 1, minWidth: 300 }}>
                            <TextField
                                label="사람 수 (num_people)"
                                type="number"
                                value={exampleSettings.num_people}
                                onChange={(e) => setExampleSettings({ ...exampleSettings, num_people: parseInt(e.target.value) || 1 })}
                                fullWidth
                                size="small"
                            />
                            <TextField
                                label="인당 샘플 수 (samples_per_person)"
                                type="number"
                                value={exampleSettings.samples_per_person}
                                onChange={(e) => setExampleSettings({ ...exampleSettings, samples_per_person: parseInt(e.target.value) || 1 })}
                                fullWidth
                                size="small"
                            />
                            <FormControl fullWidth size="small">
                                <InputLabel>데이터 타입 (datatype)</InputLabel>
                                <Select
                                    value={exampleSettings.datatype}
                                    label="데이터 타입 (datatype)"
                                    onChange={(e) => setExampleSettings({ ...exampleSettings, datatype: e.target.value })}
                                >
                                    <MenuItem value="protein">Protein</MenuItem>
                                    <MenuItem value="dna">DNA</MenuItem>
                                    <MenuItem value="rna">RNA</MenuItem>
                                </Select>
                            </FormControl>
                        </Stack>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            safeBlur();
                            setOpenExampleSettings(false);
                        }}>취소</Button>
                        <Button onClick={handleFetchExampleData} variant="contained" color="primary">
                            데이터 가져오기
                        </Button>
                    </DialogActions>
                </Dialog>

                {/* Detail Popup */}
                <Dialog
                    open={openPopup}
                    onClose={() => {
                        safeBlur();
                        setOpenPopup(false);
                    }}
                    maxWidth="lg"
                    fullWidth
                >
                    <DialogTitle>
                        AI 예측 상세 결과
                        <Typography variant="subtitle2" color="text.secondary">
                            샘플 #{selectedResult?.id} - {selectedResult?.proteinName}
                        </Typography>
                    </DialogTitle>
                    <DialogContent dividers>
                        <Grid container spacing={3}>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight={600}>3D 단백질 구조</Typography>
                                {selectedResult?.pdbId ? (
                                    <Box sx={{
                                        height: '400px',
                                        border: '1px solid #eee',
                                        borderRadius: '8px',
                                        overflow: 'hidden',
                                        position: 'relative',
                                        bgcolor: darkBg ? 'black' : 'white'
                                    }}>
                                        {/* Viewer Controls Toolbar */}
                                        <Box sx={{
                                            position: 'absolute',
                                            top: 10,
                                            right: 10,
                                            zIndex: 10,
                                            display: 'flex',
                                            gap: 1,
                                            bgcolor: 'rgba(255,255,255,0.8)',
                                            borderRadius: '8px',
                                            p: 0.5,
                                            boxShadow: 1
                                        }}>
                                            <Tooltip title="뷰 초기화">
                                                <IconButton size="small" onClick={handleResetView}><ResetIcon /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="회전 토글">
                                                <IconButton size="small" onClick={handleToggleSpin} color={spinning ? 'primary' : 'default'}><SpinIcon /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="스타일 전환 (Cartoon/Stick)">
                                                <IconButton size="small" onClick={handleToggleStyle}><StyleIcon /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="배경 전환 (White/Black)">
                                                <IconButton size="small" onClick={handleToggleBg}><BgIcon /></IconButton>
                                            </Tooltip>
                                            <Tooltip title="이미지 저장">
                                                <IconButton size="small" onClick={handleSaveImage}><SaveIcon /></IconButton>
                                            </Tooltip>
                                        </Box>

                                        {/* Check if pdbId is a URL or PDB ID */}
                                        {selectedResult.pdbId.startsWith('http') ? (
                                            <ProteinViewer
                                                customUrl={selectedResult.pdbId}
                                                height="100%"
                                                onViewerReady={handleViewerReady}
                                            />
                                        ) : (
                                            <ProteinViewer
                                                pdbId={selectedResult.pdbId}
                                                height="100%"
                                                onViewerReady={handleViewerReady}
                                            />
                                        )}
                                    </Box>
                                ) : (
                                    <Box sx={{ height: '400px', border: '1px solid #eee', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <Typography color="text.secondary">3D 구조 정보 없음</Typography>
                                    </Box>
                                )}
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <Typography variant="subtitle1" gutterBottom fontWeight={600}>분석 결과</Typography>
                                <List dense>
                                    <ListItem>
                                        <ListItemText
                                            primary="입력 타입"
                                            secondary={selectedResult?.inputType}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="입력 서열 (처음 100자)"
                                            secondary={selectedResult?.inputValue?.substring(0, 100) + '...'}
                                        />
                                    </ListItem>
                                    <Divider sx={{ my: 1 }} />
                                    <ListItem>
                                        <ListItemText
                                            primary={`Task 1: ${selectedResult?.task1Label}`}
                                            secondary={`신뢰도: ${((selectedResult?.task1Confidence || 0) * 100).toFixed(2)}%`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary={`Task 2: ${selectedResult?.task2Label}`}
                                            secondary={`신뢰도: ${((selectedResult?.task2Confidence || 0) * 100).toFixed(2)}%`}
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary="Task 3: 상위 예측"
                                            secondary={
                                                <Box component="span">
                                                    {selectedResult?.task3TopPredictions?.slice(0, 3).map(([label, prob], idx) => (
                                                        <Typography key={idx} variant="caption" display="block">
                                                            {idx + 1}. {label}: {(prob * 100).toFixed(2)}%
                                                        </Typography>
                                                    ))}
                                                </Box>
                                            }
                                        />
                                    </ListItem>
                                </List>
                                {selectedResult?.pdbId && (
                                    <Alert severity="success" sx={{ mt: 2 }}>
                                        <strong>3D 구조 확인됨</strong><br />
                                        PDB ID: {selectedResult.pdbId}
                                    </Alert>
                                )}
                                <Alert severity="info" sx={{ mt: 2 }}>
                                    AI 모델이 해당 서열을 <strong>{selectedResult?.task1Label}</strong>로 분류하고,
                                    <strong> {selectedResult?.task2Label}</strong> 타입으로 식별했습니다.
                                </Alert>
                            </Grid>
                        </Grid>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => {
                            safeBlur();
                            setOpenPopup(false);
                        }}>닫기</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </DashboardLayout>
    );
};

export default AntigenResultPage;
