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
    // 모델 성능 지표 (예시 데이터 - 실제 모델 학습 후 업데이트)
    const modelPerformance = {
        modelName: 'BiomarkerNet-v2.0',
        modelVersion: '2.0.1',
        lastUpdated: '2025-11-28',
        trainingDataset: '15,000 samples',
        validationDataset: '3,000 samples',
        testDataset: '3,000 samples',
    };

    // 전체 성능 지표
    const overallMetrics = [
        { name: 'Accuracy', value: 0.91, description: '전체 정확도', icon: <CheckCircle /> },
        { name: 'Precision', value: 0.89, description: '정밀도 (양성 예측의 정확도)', icon: <TrendingUp /> },
        { name: 'Recall', value: 0.90, description: '재현율 (실제 양성의 검출률)', icon: <Assessment /> },
        { name: 'F1-Score', value: 0.895, description: 'Precision과 Recall의 조화 평균', icon: <Speed /> },
    ];

    // 클래스별 성능 (4개 질병 분류)
    const classPerformance = [
        {
            className: 'COVID-19',
            accuracy: 0.93,
            precision: 0.91,
            recall: 0.94,
            f1Score: 0.925,
            samples: 5000,
            color: '#dc2626'
        },
        {
            className: 'Influenza (독감)',
            accuracy: 0.90,
            precision: 0.88,
            recall: 0.89,
            f1Score: 0.885,
            samples: 4000,
            color: '#ea580c'
        },
        {
            className: 'Common Cold (감기)',
            accuracy: 0.88,
            precision: 0.86,
            recall: 0.87,
            f1Score: 0.865,
            samples: 3500,
            color: '#d97706'
        },
        {
            className: 'Normal (정상)',
            accuracy: 0.92,
            precision: 0.90,
            recall: 0.93,
            f1Score: 0.915,
            samples: 8500,
            color: '#16a34a'
        },
    ];

    // Confusion Matrix (예시)
    const confusionMatrix = [
        ['COVID', 470, 15, 10, 5],
        ['Flu', 12, 445, 30, 13],
        ['Cold', 8, 25, 435, 32],
        ['Normal', 3, 8, 15, 874],
    ];

    // 입력 특징 (30개 바이오마커)
    const inputFeatures = 30;
    const topFeatures = [
        { name: 'C-반응성 단백질 (CRP)', importance: 0.92 },
        { name: '인터루킨-6 (IL-6)', importance: 0.85 },
        { name: '페리틴 (Ferritin)', importance: 0.78 },
        { name: 'D-이량체 (D-Dimer)', importance: 0.65 },
        { name: '프로칼시토닌 (PCT)', importance: 0.58 },
    ];

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
                    바이오마커 기반 질병 분류 AI 모델
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                    30개 바이오마커 분석을 통한 코로나, 독감, 감기, 정상 분류
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
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>검증 데이터</Typography>
                            <Typography variant="h6" fontWeight="600">{modelPerformance.validationDataset}</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={6} md={4}>
                        <Box sx={{ color: 'white' }}>
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>테스트 데이터</Typography>
                            <Typography variant="h6" fontWeight="600">{modelPerformance.testDataset}</Typography>
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
                                        {(metric.value * 100).toFixed(1)}%
                                    </Typography>
                                    <LinearProgress
                                        variant="determinate"
                                        value={metric.value * 100}
                                        sx={{ mb: 1, height: 8, borderRadius: 2 }}
                                    />
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

            {/* 클래스별 성능 */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    클래스별 성능
                </Typography>
                <TableContainer component={Paper}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>질병</strong></TableCell>
                                <TableCell align="center"><strong>Accuracy</strong></TableCell>
                                <TableCell align="center"><strong>Precision</strong></TableCell>
                                <TableCell align="center"><strong>Recall</strong></TableCell>
                                <TableCell align="center"><strong>F1-Score</strong></TableCell>
                                <TableCell align="center"><strong>샘플 수</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {classPerformance.map((cls, index) => (
                                <TableRow key={index} hover>
                                    <TableCell>
                                        <Chip
                                            label={cls.className}
                                            sx={{ bgcolor: cls.color, color: 'white', fontWeight: 600 }}
                                        />
                                    </TableCell>
                                    <TableCell align="center">{(cls.accuracy * 100).toFixed(1)}%</TableCell>
                                    <TableCell align="center">{(cls.precision * 100).toFixed(1)}%</TableCell>
                                    <TableCell align="center">{(cls.recall * 100).toFixed(1)}%</TableCell>
                                    <TableCell align="center">{(cls.f1Score * 100).toFixed(1)}%</TableCell>
                                    <TableCell align="center">{cls.samples.toLocaleString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* Confusion Matrix */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    Confusion Matrix
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    행: 실제 클래스 / 열: 예측 클래스
                </Typography>
                <TableContainer component={Paper}>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: 'grey.100' }}>
                                <TableCell><strong>실제 \ 예측</strong></TableCell>
                                <TableCell align="center"><strong>COVID</strong></TableCell>
                                <TableCell align="center"><strong>Flu</strong></TableCell>
                                <TableCell align="center"><strong>Cold</strong></TableCell>
                                <TableCell align="center"><strong>Normal</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {confusionMatrix.map((row, index) => (
                                <TableRow key={index}>
                                    <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                                        {row[0]}
                                    </TableCell>
                                    {row.slice(1).map((cell, cellIndex) => (
                                        <TableCell
                                            key={cellIndex}
                                            align="center"
                                            sx={{
                                                bgcolor: cellIndex === index ? 'success.light' : 'inherit',
                                                fontWeight: cellIndex === index ? 'bold' : 'normal',
                                                color: cellIndex === index ? 'white' : 'text.primary',
                                            }}
                                        >
                                            {cell}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* 주요 특징 (Top Features) */}
            <Box sx={{ mb: 6 }}>
                <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
                    주요 바이오마커 (Feature Importance)
                </Typography>
                <Typography variant="body2" color="text.secondary" paragraph>
                    모델 예측에 가장 큰 영향을 미치는 상위 5개 바이오마커
                </Typography>
                <Grid container spacing={2}>
                    {topFeatures.map((feature, index) => (
                        <Grid item xs={12} key={index}>
                            <Paper sx={{ p: 2 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                    <Typography variant="body1" fontWeight={600}>
                                        {index + 1}. {feature.name}
                                    </Typography>
                                    <Typography variant="body1" color="primary" fontWeight={700}>
                                        {(feature.importance * 100).toFixed(1)}%
                                    </Typography>
                                </Box>
                                <LinearProgress
                                    variant="determinate"
                                    value={feature.importance * 100}
                                    sx={{ height: 10, borderRadius: 2 }}
                                />
                            </Paper>
                        </Grid>
                    ))}
                </Grid>
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                        총 {inputFeatures}개 바이오마커 사용
                    </Typography>
                </Box>
            </Box>

            <Divider sx={{ mb: 6 }} />

            {/* 추가 정보 */}
            <Paper elevation={2} sx={{ p: 4, bgcolor: 'grey.50' }}>
                <Typography variant="h5" fontWeight="bold" gutterBottom>
                    모델 설명
                </Typography>
                <Typography variant="body1" paragraph>
                    BiomarkerNet-v2.0은 30개의 혈액 바이오마커를 분석하여 코로나19, 독감, 감기, 정상 상태를
                    분류하는 딥러닝 모델입니다.
                </Typography>
                <Typography variant="body1" paragraph>
                    <strong>주요 특징:</strong>
                </Typography>
                <ul>
                    <li><Typography variant="body2">30개 바이오마커 기반 multi-class 분류</Typography></li>
                    <li><Typography variant="body2">SHAP (SHapley Additive exPlanations)를 통한 설명가능한 AI</Typography></li>
                    <li><Typography variant="body2">21,000개 임상 샘플 데이터로 학습</Typography></li>
                    <li><Typography variant="body2">평균 추론 시간: 245ms</Typography></li>
                    <li><Typography variant="body2">정기적인 재학습을 통한 성능 개선</Typography></li>
                </ul>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    * 모델 성능 지표는 테스트 데이터셋 기준이며, 실제 임상 환경에서는 다를 수 있습니다.
                </Typography>
            </Paper>
        </Container>
    );
};

export default AboutAIPage;
