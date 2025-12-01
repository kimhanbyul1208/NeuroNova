import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    Stack,
    Chip,
    Divider,
    Grid,
    Paper,
    IconButton
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { PROTEIN_CATEGORY_COLORS } from '../utils/theme';

/**
 * 단백질 상세 정보 모달
 * 
 * @param {Object} props
 * @param {boolean} props.open - 모달 열림 상태
 * @param {Function} props.onClose - 모달 닫기 핸들러
 * @param {Object} props.protein - 단백질 데이터
 * @param {number} props.value - 측정값
 * @param {number} props.shapValue - SHAP 기여도 값
 */
const ProteinDetailModal = ({
    open,
    onClose,
    protein,
    value,
    shapValue
}) => {
    if (!protein) return null;

    const categoryColor = PROTEIN_CATEGORY_COLORS[protein.category] || '#666';

    // 정상 범위 체크
    const checkRange = () => {
        if (!value) return { status: 'unknown', message: '측정값 없음', color: '#666' };

        const range = protein.normalRange;
        if (range.includes('-')) {
            const [min, max] = range.split('-').map(s => parseFloat(s.match(/[\d.]+/)?.[0] || 0));
            if (value < min) return { status: 'low', message: '정상 범위 미만', color: '#ea580c' };
            if (value > max) return { status: 'high', message: '정상 범위 초과', color: '#dc2626' };
            return { status: 'normal', message: '정상 범위', color: '#16a34a' };
        } else if (range.includes('<')) {
            const max = parseFloat(range.match(/[\d.]+/)?.[0] || 0);
            if (value >= max) return { status: 'high', message: '정상 범위 초과', color: '#dc2626' };
            return { status: 'normal', message: '정상 범위', color: '#16a34a' };
        }
        return { status: 'unknown', message: '범위 확인 불가', color: '#666' };
    };

    const rangeStatus = checkRange();

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '20px',
                    boxShadow: '0 24px 48px rgba(0,0,0,0.2)',
                }
            }}
        >
            {/* 헤더 */}
            <DialogTitle
                sx={{
                    bgcolor: `${categoryColor}15`,
                    borderBottom: `3px solid ${categoryColor}`,
                    position: 'relative',
                    pb: 2,
                }}
            >
                <Stack direction="row" alignItems="flex-start" spacing={2}>
                    <Box
                        sx={{
                            width: 48,
                            height: 48,
                            borderRadius: '50%',
                            bgcolor: categoryColor,
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '18px',
                            fontWeight: 700,
                            flexShrink: 0,
                        }}
                    >
                        {protein.id.split('_')[1]}
                    </Box>
                    <Box flex={1}>
                        <Typography variant="h5" fontWeight={700} gutterBottom>
                            {protein.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {protein.nameEn}
                        </Typography>
                    </Box>
                    <IconButton
                        onClick={onClose}
                        sx={{
                            position: 'absolute',
                            right: 8,
                            top: 8,
                        }}
                    >
                        <CloseIcon />
                    </IconButton>
                </Stack>

                {/* 카테고리와 UniProt ID */}
                <Stack direction="row" spacing={1} mt={2}>
                    <Chip
                        label={protein.category}
                        size="small"
                        sx={{
                            bgcolor: categoryColor,
                            color: 'white',
                            fontWeight: 600,
                        }}
                    />
                    <Chip
                        label={`UniProt: ${protein.uniprotId}`}
                        variant="outlined"
                        size="small"
                        sx={{
                            borderColor: categoryColor,
                            color: categoryColor,
                            fontWeight: 600,
                        }}
                    />
                </Stack>
            </DialogTitle>

            {/* 본문 */}
            <DialogContent sx={{ p: 3 }}>
                <Grid container spacing={3}>
                    {/* 측정값 정보 */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                bgcolor: `${rangeStatus.color}10`,
                                border: `2px solid ${rangeStatus.color}`,
                                borderRadius: 3,
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                측정값
                            </Typography>
                            <Typography variant="h3" fontWeight={700} color={rangeStatus.color}>
                                {value || 'N/A'}
                            </Typography>
                            <Chip
                                label={rangeStatus.message}
                                size="small"
                                sx={{
                                    mt: 1,
                                    bgcolor: rangeStatus.color,
                                    color: 'white',
                                    fontWeight: 600,
                                }}
                            />
                        </Paper>
                    </Grid>

                    {/* 정상 범위 */}
                    <Grid item xs={12} md={6}>
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                bgcolor: '#f3f4f6',
                                border: '2px solid #e5e7eb',
                                borderRadius: 3,
                            }}
                        >
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                정상 범위
                            </Typography>
                            <Typography variant="h4" fontWeight={700}>
                                {protein.normalRange}
                            </Typography>
                        </Paper>
                    </Grid>

                    {/* SHAP 기여도 (있는 경우) */}
                    {shapValue !== undefined && (
                        <Grid item xs={12}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    bgcolor: '#eff6ff',
                                    border: '2px solid #3b82f6',
                                    borderRadius: 3,
                                }}
                            >
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    AI 진단 기여도 (SHAP Value)
                                </Typography>
                                <Stack direction="row" alignItems="center" spacing={2}>
                                    <Typography variant="h4" fontWeight={700} color="#3b82f6">
                                        {Math.round(shapValue * 100)}%
                                    </Typography>
                                    <Box flex={1}>
                                        <Box
                                            sx={{
                                                width: '100%',
                                                height: 12,
                                                bgcolor: '#dbeafe',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: `${Math.abs(shapValue) * 100}%`,
                                                    height: '100%',
                                                    bgcolor: shapValue > 0 ? '#3b82f6' : '#dc2626',
                                                    borderRadius: 2,
                                                }}
                                            />
                                        </Box>
                                    </Box>
                                </Stack>
                                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                    {shapValue > 0
                                        ? '이 바이오마커는 질병 가능성을 높이는 방향으로 작용합니다'
                                        : '이 바이오마커는 질병 가능성을 낮추는 방향으로 작용합니다'}
                                </Typography>
                            </Paper>
                        </Grid>
                    )}

                    {/* 설명 */}
                    <Grid item xs={12}>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                            설명
                        </Typography>
                        <Typography variant="body2" color="text.secondary" paragraph>
                            {protein.description}
                        </Typography>

                        <Typography variant="subtitle1" fontWeight={600} gutterBottom sx={{ mt: 2 }}>
                            기능
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {protein.function}
                        </Typography>
                    </Grid>
                </Grid>
            </DialogContent>

            {/* 푸터 */}
            <DialogActions sx={{ p: 3, pt: 0 }}>
                <Button
                    onClick={onClose}
                    variant="outlined"
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                    }}
                >
                    닫기
                </Button>
                <Button
                    variant="contained"
                    sx={{
                        borderRadius: 2,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        bgcolor: categoryColor,
                        '&:hover': {
                            bgcolor: categoryColor,
                            opacity: 0.9,
                        },
                    }}
                >
                    3D 구조 보기
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ProteinDetailModal;
