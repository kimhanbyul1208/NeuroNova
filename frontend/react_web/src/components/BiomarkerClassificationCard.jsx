import React from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Stack,
    Button
} from '@mui/material';
import { getCategoryColor } from '../utils/theme';

/**
 * 바이오마커 분류 결과 카드
 * 
 * AI가 판정한 질병 범주를 우선순위 기반 색상으로 표시
 * 
 * @param {Object} props
 * @param {string} props.category - 분류 카테고리 (COVID, FLU, COLD, NORMAL)
 * @param {number} props.confidence - 신뢰도 (0.0 ~ 1.0)
 * @param {Object} props.probabilities - 각 카테고리별 확률 { COVID: 0.8, FLU: 0.1, ... }
 * @param {Function} props.onViewDetails - 상세 보기 버튼 클릭 핸들러
 * @param {Function} props.onDownloadReport - 보고서 다운로드 핸들러
 */
const BiomarkerClassificationCard = ({
    category = 'NORMAL',
    confidence = 0.0,
    probabilities = {},
    onViewDetails,
    onDownloadReport
}) => {
    const colors = getCategoryColor(category);
    const confidencePercent = Math.round(confidence * 100);

    return (
        <Card
            sx={{
                background: colors.gradient,
                borderRadius: '20px',
                boxShadow: colors.shadow,
                overflow: 'hidden',
                position: 'relative',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: `0 16px 48px ${colors.primary}40`,
                }
            }}
        >
            <CardContent sx={{ p: 4 }}>
                {/* 아이콘과 카테고리 */}
                <Stack direction="row" alignItems="center" spacing={2} mb={3}>
                    <Box
                        sx={{
                            fontSize: '48px',
                            lineHeight: 1,
                        }}
                    >
                        {colors.icon}
                    </Box>
                    <Box>
                        <Typography
                            variant="h3"
                            sx={{
                                color: 'white',
                                fontWeight: 700,
                                textShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                        >
                            {colors.label}
                        </Typography>
                        <Typography
                            variant="body2"
                            sx={{
                                color: 'rgba(255,255,255,0.9)',
                                mt: 0.5,
                            }}
                        >
                            {colors.labelEn}
                        </Typography>
                    </Box>
                </Stack>

                {/* 신뢰도 */}
                <Box sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body1" sx={{ color: 'white', fontWeight: 600 }}>
                            신뢰도
                        </Typography>
                        <Typography variant="h4" sx={{ color: 'white', fontWeight: 700 }}>
                            {confidencePercent}%
                        </Typography>
                    </Stack>

                    {/* 진행 바 */}
                    <Box
                        sx={{
                            width: '100%',
                            height: 12,
                            bgcolor: 'rgba(255,255,255,0.3)',
                            borderRadius: 2,
                            overflow: 'hidden',
                            position: 'relative',
                        }}
                    >
                        <Box
                            sx={{
                                width: `${confidencePercent}%`,
                                height: '100%',
                                bgcolor: 'white',
                                borderRadius: 2,
                                transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 0 10px rgba(255,255,255,0.5)',
                            }}
                        />
                    </Box>
                </Box>

                {/* 설명 */}
                <Box
                    sx={{
                        bgcolor: 'rgba(255,255,255,0.2)',
                        borderRadius: 2,
                        p: 2,
                        mb: 3,
                        backdropFilter: 'blur(10px)',
                    }}
                >
                    <Typography
                        variant="body2"
                        sx={{
                            color: 'white',
                            lineHeight: 1.6,
                        }}
                    >
                        {colors.description}
                    </Typography>
                </Box>

                {/* 확률 분포 */}
                {Object.keys(probabilities).length > 0 && (
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="body2" sx={{ color: 'white', mb: 1, opacity: 0.9 }}>
                            범주별 확률 분포
                        </Typography>
                        <Stack spacing={1}>
                            {Object.entries(probabilities).map(([cat, prob]) => {
                                const catColors = getCategoryColor(cat);
                                const probPercent = Math.round(prob * 100);

                                return (
                                    <Box key={cat}>
                                        <Stack direction="row" justifyContent="space-between" mb={0.5}>
                                            <Typography variant="caption" sx={{ color: 'white' }}>
                                                {catColors.label}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'white', fontWeight: 600 }}>
                                                {probPercent}%
                                            </Typography>
                                        </Stack>
                                        <Box
                                            sx={{
                                                width: '100%',
                                                height: 6,
                                                bgcolor: 'rgba(255,255,255,0.2)',
                                                borderRadius: 1,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: `${probPercent}%`,
                                                    height: '100%',
                                                    bgcolor: 'white',
                                                    borderRadius: 1,
                                                    transition: 'width 0.6s ease',
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                );
                            })}
                        </Stack>
                    </Box>
                )}

                {/* 액션 버튼 */}
                <Stack direction="row" spacing={2}>
                    <Button
                        variant="contained"
                        fullWidth
                        onClick={onViewDetails}
                        sx={{
                            bgcolor: 'white',
                            color: colors.primary,
                            fontWeight: 600,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '16px',
                            '&:hover': {
                                bgcolor: 'rgba(255,255,255,0.9)',
                                transform: 'translateY(-2px)',
                                boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        상세 보기
                    </Button>
                    <Button
                        variant="outlined"
                        fullWidth
                        onClick={onDownloadReport}
                        sx={{
                            borderColor: 'white',
                            color: 'white',
                            fontWeight: 600,
                            py: 1.5,
                            borderRadius: 2,
                            textTransform: 'none',
                            fontSize: '16px',
                            borderWidth: 2,
                            '&:hover': {
                                borderColor: 'white',
                                bgcolor: 'rgba(255,255,255,0.1)',
                                borderWidth: 2,
                                transform: 'translateY(-2px)',
                            },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        보고서 다운로드
                    </Button>
                </Stack>
            </CardContent>
        </Card>
    );
};

export default BiomarkerClassificationCard;
