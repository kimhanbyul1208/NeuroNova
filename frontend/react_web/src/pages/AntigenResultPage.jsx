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

// 예시 데이터 (QUICK_START.md 기반)
const EXAMPLE_SEQUENCES = [
    {
        type: 'PROTEIN',
        value: 'MEEPQSDPSVEPPLSQETFSDLWKLLPENNVLSPLPSQAMDDLMLSPDDIEQWFTEDPGPDEAPRMPEAAPPVAPAPAAPTPAAPAPAPSWPLSSSVPSQKTYQGSYGFRLGFLHSGTAKSVTCTYSPALNKMFCQLAKTCPVQLWVDSTPPPGTRVRAMAIYKQSQHMTEVVRRCPHHERCSDSDGLAPPQHLIRVEGNLRVEYLDDRNTFRHSVVVPYEPPEVGSDCTTIHYNYMCNSSCMGGMNRRPILTIITLEDSSGNLLGRNSFEVRVCACPGRDRRTEEENLRKKGEPHHELPPGSTKRALPNNTSSSPQPKKKPLDGEYFTLQIRGRERFEMFRELNEALELKDAQAGKEPGGSRAHSSHLKSKKGQSTSRHKKLMFKTEGPDSD',
        description: 'p53 Tumor Suppressor (Protein Viewer Example)'
    },
    {
        type: 'PROTEIN',
        value: 'MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHSTQDLFLPFFSNVTWFHAIHVSGTNGTKRFDNPVLPFNDGVYFASTEKSNIIRGWIFGTTLDSKTQSLLIVNNATNVVIKVCEFQFCNDPFLGVYYHKNNKSWMESEFRVYSSANNCTFEYVSQPFLMDLEGKQGNFKNLREFVFKNIDGYFKIYSKHTPINLVRDLPQGFSALEPLVDLPIGINITRFQTLLALHRSYLTPGDSSSGWTAGAAAYYVGYLQPRTFLLKYNENGTITDAVDCALDPLSETKCTLKSFTVEKGIYQTSNFRVQPTESIVRFPNITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYNYLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPLQSYGFQPTNGVGYQPYRVVVLSFELLHAPATVCGPKKSTNLVKNKCVNF',
        description: 'SARS-CoV-2 Spike Protein'
    },
    {
        type: 'PROTEIN',
        value: 'MSDNGPQNQRNAPRITFGGPSDSTGSNQNGERSGARSKQRRPQGLPNNTASWFTALTQHGKEDLKFPRGQGVPINTNSSPDDQIGYYRRATRRIRGGDGKMKDLSPRWYFYYLGTGPEAGLPYGANKDGIIWVATEGALNTPKDHIGTRNPANNAAIVLQLPQGTTLPKGFYAEGSRGGSQASSRSSSRSRNSSRNSTPGSSRGTSPARMAGNGGDAALALLLLDRLNQLESKMSGKGQQQQGQTVTKKSAAEASKKPRQKRTATKAYNVTQAFGRRGPEQTQGNFGDQELIRQGTDYKHWPQIAQFAPSASAFFGMSRIGMEVTPSGTWLTYTGAIKLDDKDPNFKDQVILLNKHIDAYKTFPPTEPKKDKKKKADETQALPQRQKKQQTVTLLPAADLDDFSKQLQQSMSSADSTQA',
        description: 'Influenza A Nucleocapsid'
    }
];

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

    // 예시 데이터 로드
    const handleLoadExample = () => {
        setInputs(EXAMPLE_SEQUENCES.map(ex => ({
            type: ex.type,
            value: ex.value
        })));
        setError(null);
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
                                    onClick={handleLoadExample}
                                    fullWidth
                                    variant="outlined"
                                    color="secondary"
                                >
                                    예시 데이터 입력
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
                        <Paper sx={{ p: 3, borderRadius: '16px', minHeight: '400px' }}>
                            <Typography variant="h6" gutterBottom fontWeight={600}>
                                예측 결과 분석
                            </Typography>

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
                                                                <Box>
                                                                    <Typography variant="subtitle2" color="text.secondary">
                                                                        샘플 #{result.id} [{result.inputType}]
                                                                    </Typography>
                                                                    <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: '300px' }}>
                                                                        {result.inputValue.substring(0, 50)}...
                                                                    </Typography>
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
                    </Grid>
                </Grid>

                {/* Detail Popup */}
                <Dialog open={openPopup} onClose={() => setOpenPopup(false)} maxWidth="lg" fullWidth>
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
                        <Button onClick={() => setOpenPopup(false)}>닫기</Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </DashboardLayout>
    );
};

export default AntigenResultPage;
