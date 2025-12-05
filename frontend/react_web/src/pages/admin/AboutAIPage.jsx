import React from 'react';
import {
    Container,
    Typography,
    Box,
    Grid,
    Card,
    CardContent,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    LinearProgress,
    Divider
} from '@mui/material';
import {
    TrendingUp,
    Assessment,
    Speed,
    CheckCircle
} from '@mui/icons-material';

/**
 * About AI 페이지
 * AI 모델의 성능 지표 및 정보 표시
 */
const AboutAIPage = () => {
    // 모델 성능 지표
    const modelPerformance = {
        modelName: 'ProteinClassifier-ESM2',
        modelVersion: 'facebook/esm2_t33_650M_UR50D',
        lastUpdated: '2025-12-05',
        trainingDataset: 'Protein sequence data',
        testDataset: '1,200 samples',
        inferenceSpeed: '18.06 ms/sample',
        modelFile: 'model.pt',
    };

    // 전체 성능 지표 - 3개 Task 요약
    const overallMetrics = [
        { name: 'Task1 Accuracy', value: 0.9975, description: 'Host vs Pathogen 분류', icon: <CheckCircle /> },
        { name: 'Task2 Accuracy', value: 0.9975, description: 'Pathogen Type 분류 (4-class)', icon: <TrendingUp /> },
        { name: 'Task3 F1 (micro)', value: 0.9808, description: 'Protein Multi-label', icon: <Assessment /> },
        { name: 'Inference Speed', value: 0.01806, description: '18.06 ms/sample', icon: <Speed />, isSpeed: true },
    ];

    // Task1: Host vs Pathogen 성능
    const task1Performance = [
        {
            className: 'Host',
            precision: 1.00,
            recall: 0.99,
            f1Score: 0.99,
            support: 300,
            color: '#16a34a'
        },
        {
            className: 'Pathogen',
            precision: 1.00,
            recall: 1.00,
            f1Score: 1.00,
            support: 900,
            color: '#dc2626'
        },
    ];

    // Task2: Pathogen Type 성능 (4-class)
    const task2Performance = [
        {
            className: 'Type 0',
            precision: 0.99,
            recall: 1.00,
            f1Score: 1.00,
            support: 300,
            color: '#3b82f6'
        },
        {
            className: 'Type 1',
            precision: 1.00,
            recall: 1.00,
            f1Score: 1.00,
            support: 300,
            color: '#8b5cf6'
        },
        {
            className: 'Type 2',
            precision: 1.00,
            recall: 1.00,
            f1Score: 1.00,
            support: 300,
            color: '#ec4899'
        },
        {
            className: 'Type 3',
            precision: 1.00,
            recall: 0.99,
            f1Score: 0.99,
            support: 300,
            color: '#f59e0b'
        },
    ];

    // Task3: Protein Multi-label 성능
    const task3Performance = {
        threshold: 0.5,
        f1Micro: 0.9808,
        f1Macro: 0.9175,
        truePositives: 1175,
        predPositives: 1196,
        actualPositives: 1200,
    };



    return (
        <Container maxWidth="lg" sx={{ py: 6 }}>
            {/* Header */}
            <Box sx={{ textAlign: 'center', mb: 6 }}>
                <Typography
                    variant="h3"
                    fontWeight="bold"
                    gutterBottom
                    sx={{
                        background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                    }}
                >
                    About AI Model
                </Typography>
                <Typography variant="h6" color="text.secondary">
                    단백질 시퀀스 기반 Multi-Task 분류 AI 모델
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    ESM2 기반 Host/Pathogen 분류 및 단백질 타입 분류
                </Typography>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* 모델 정보 */}
            <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ color: 'white' }}>
                    모델 정보
                </Typography>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ color: 'white' }}>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>모델명</Typography>
                            <Typography variant="h6" fontWeight="600">{modelPerformance.modelName}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ color: 'white' }}>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>버전</Typography>
                            <Typography variant="h6" fontWeight="600">{modelPerformance.modelVersion}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ color: 'white' }}>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>마지막 업데이트</Typography>
                            <Typography variant="h6" fontWeight="600">{modelPerformance.lastUpdated}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ color: 'white' }}>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>학습 데이터</Typography>
                            <Typography variant="h6" fontWeight="600">{modelPerformance.trainingDataset}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ color: 'white' }}>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>테스트 데이터</Typography>
                            <Typography variant="h6" fontWeight="600">{modelPerformance.testDataset}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ color: 'white' }}>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>추론 속도</Typography>
                            <Typography variant="h6" fontWeight="600">{modelPerformance.inferenceSpeed}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ color: 'white' }}>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>모델 파일</Typography>
                            <Typography variant="h6" fontWeight="600">{modelPerformance.modelFile}</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {/* 전체 성능 지표 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    전체 성능 지표
                </Typography>
                <Grid container spacing={3}>
                    {overallMetrics.map((metric, index) => (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card sx={{ height: '100%' }}>
                                <CardContent>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <Box sx={{ color: 'primary.main', mr: 1 }}>{metric.icon}</Box>
                                        <Typography variant="h6" fontWeight="bold">
                                            {metric.name}
                                        </Typography>
                                    </Box>
                                    <Typography variant="h3" fontWeight="700" color="primary" gutterBottom>
                                        {metric.isSpeed ? metric.description : `${(metric.value * 100).toFixed(2)}%`}
                                    </Typography>
                                    {!metric.isSpeed && (
                                        <LinearProgress
                                            variant="determinate"
                                            value={metric.value * 100}
                                            sx={{ mb: 1, height: 8, borderRadius: 2 }}
                                        />
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                        {metric.description}
                                    </Typography>
                                </CardContent>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* Task1: Host vs Pathogen 성능 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    Task 1: Host vs Pathogen 분류 (Accuracy: 99.75%)
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>Class</strong></TableCell>
                                <TableCell align="center"><strong>Precision</strong></TableCell>
                                <TableCell align="center"><strong>Recall</strong></TableCell>
                                <TableCell align="center"><strong>F1-Score</strong></TableCell>
                                <TableCell align="center"><strong>Support</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {task1Performance.map((cls, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>
                                        <Chip
                                            label={cls.className}
                                            sx={{ bgcolor: cls.color, color: 'white', fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">{(cls.precision * 100).toFixed(0)}%</TableCell>
                                    <TableCell align="center">{(cls.recall * 100).toFixed(0)}%</TableCell>
                                    <TableCell align="center">{(cls.f1Score * 100).toFixed(0)}%</TableCell>
                                    <TableCell align="center">{cls.support}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell><strong>Accuracy</strong></TableCell>
                                <TableCell align="center" colSpan={3}><strong>100%</strong></TableCell>
                                <TableCell align="center"><strong>1200</strong></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* Task2: Pathogen Type 성능 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    Task 2: Pathogen Type 분류 (Accuracy: 99.75%)
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>Class</strong></TableCell>
                                <TableCell align="center"><strong>Precision</strong></TableCell>
                                <TableCell align="center"><strong>Recall</strong></TableCell>
                                <TableCell align="center"><strong>F1-Score</strong></TableCell>
                                <TableCell align="center"><strong>Support</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {task2Performance.map((cls, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>
                                        <Chip
                                            label={cls.className}
                                            sx={{ bgcolor: cls.color, color: 'white', fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">{(cls.precision * 100).toFixed(0)}%</TableCell>
                                    <TableCell align="center">{(cls.recall * 100).toFixed(0)}%</TableCell>
                                    <TableCell align="center">{(cls.f1Score * 100).toFixed(0)}%</TableCell>
                                    <TableCell align="center">{cls.support}</TableCell>
                                </TableRow>
                            ))}
                            <TableRow sx={{ bgcolor: 'grey.50' }}>
                                <TableCell><strong>Accuracy</strong></TableCell>
                                <TableCell align="center" colSpan={3}><strong>100%</strong></TableCell>
                                <TableCell align="center"><strong>1200</strong></TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* Task3: Protein Multi-label 성능 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    Task 3: Protein Multi-label 분류
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    F1 Scores
                                </Typography>
                                <Box sx={{ mb: 2 }}>
                                    <Typography variant="body2" color="text.secondary">F1 (micro)</Typography>
                                    <Typography variant="h4" fontWeight="700" color="primary">
                                        {(task3Performance.f1Micro * 100).toFixed(2)}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={task3Performance.f1Micro * 100}
                                        sx={{ mt: 1, height: 8, borderRadius: 2 }}
                                    />
                                </Box>
                                <Box>
                                    <Typography variant="body2" color="text.secondary">F1 (macro)</Typography>
                                    <Typography variant="h4" fontWeight="700" color="secondary">
                                        {(task3Performance.f1Macro * 100).toFixed(2)}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={task3Performance.f1Macro * 100}
                                        color="secondary"
                                        sx={{ mt: 1, height: 8, borderRadius: 2 }}
                                    />
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card>
                            <CardContent>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    상세 통계 (Threshold: {task3Performance.threshold})
                                </Typography>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">True Positives</Typography>
                                        <Typography variant="h5" fontWeight="600">{task3Performance.truePositives}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Predicted Positives</Typography>
                                        <Typography variant="h5" fontWeight="600">{task3Performance.predPositives}</Typography>
                                    </Box>
                                    <Box>
                                        <Typography variant="body2" color="text.secondary">Actual Positives</Typography>
                                        <Typography variant="h5" fontWeight="600">{task3Performance.actualPositives}</Typography>
                                    </Box>
                                </Box>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Box>


            {/* 추가 정보 */}
            <Paper elevation={2} sx={{ p: 4, bgcolor: 'grey.50' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    모델 설명
                </Typography>
                <Typography variant="body1" paragraph>
                    ProteinClassifier-ESM2는 Facebook의 ESM2 (Evolutionary Scale Modeling) 사전학습 모델을 기반으로 한
                    단백질 시퀀스 분류 모델입니다. Host vs Pathogen 분류, Pathogen 타입 분류,
                    그리고 Protein Multi-label 분류의 3가지 Task를 수행합니다.
                </Typography>
                <Typography variant="body1" paragraph>
                    <strong>주요 특징:</strong>
                </Typography>
                <ul>
                    <li><Typography variant="body2">ESM2-650M 파라미터 기반 Transformer 모델</Typography></li>
                    <li><Typography variant="body2">3-Task Multi-task Learning: Host/Pathogen, Pathogen Type, Protein Classification</Typography></li>
                    <li><Typography variant="body2">1,200개 테스트 샘플에서 99.75% 이상의 높은 정확도</Typography></li>
                    <li><Typography variant="body2">평균 추론 속도: 18.06ms/샘플 (초고속 추론)</Typography></li>
                    <li><Typography variant="body2">단백질 시퀀스 기반 직접 분석 (Feature Engineering 불필요)</Typography></li>
                </ul>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    * 모델 성능 지표는 테스트 데이터셋 (1,200 samples) 기준입니다.
                </Typography>
            </Paper>
        </Container>
    );
};

export default AboutAIPage;
