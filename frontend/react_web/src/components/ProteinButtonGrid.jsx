import React, { useState } from 'react';
import {
    Grid,
    Button,
    Typography,
    Box,
    Chip,
    Stack,
    TextField,
    InputAdornment,
    Tooltip,
    Badge
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { PROTEIN_CATEGORY_COLORS } from '../utils/theme';

/**
 * 30개 단백질 바이오마커 버튼 그리드
 * 
 * @param {Object} props
 * @param {Array} props.proteins - 단백질 배열
 * @param {Function} props.onProteinClick - 단백질 클릭 핸들러
 * @param {Object} props.proteinValues - 단백질별 측정값 { protein_01: 15.2, ... }
 */
const ProteinButtonGrid = ({
    proteins = [],
    onProteinClick,
    proteinValues = {}
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');

    // 카테고리 목록 추출
    const categories = ['all', ...new Set(proteins.map(p => p.category))];

    // 필터링된 단백질
    const filteredProteins = proteins.filter(protein => {
        const matchesSearch =
            protein.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            protein.nameEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
            protein.uniprotId.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory =
            selectedCategory === 'all' || protein.category === selectedCategory;

        return matchesSearch && matchesCategory;
    });

    // 단백질 값이 정상 범위인지 확인
    const isAbnormal = (protein) => {
        const value = proteinValues[protein.id];
        if (!value) return false;

        // 간단한 범위 체크 (실제로는 더 복잡한 로직 필요)
        const range = protein.normalRange;
        if (range.includes('-')) {
            const [min, max] = range.split('-').map(s => parseFloat(s.match(/[\d.]+/)?.[0] || 0));
            return value < min || value > max;
        } else if (range.includes('<')) {
            const max = parseFloat(range.match(/[\d.]+/)?.[0] || 0);
            return value >= max;
        }
        return false;
    };

    return (
        <Box>
            {/* 검색 및 필터 */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={3}>
                <TextField
                    placeholder="단백질 이름, UniProt ID 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                    fullWidth
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon />
                            </InputAdornment>
                        ),
                    }}
                    sx={{
                        '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                        }
                    }}
                />
            </Stack>

            {/* 카테고리 필터 칩 */}
            <Stack direction="row" spacing={1} mb={3} flexWrap="wrap" useFlexGap>
                {categories.map(cat => (
                    <Chip
                        key={cat}
                        label={cat === 'all' ? '전체' : cat}
                        onClick={() => setSelectedCategory(cat)}
                        color={selectedCategory === cat ? 'primary' : 'default'}
                        variant={selectedCategory === cat ? 'filled' : 'outlined'}
                        sx={{
                            borderRadius: 2,
                            fontWeight: selectedCategory === cat ? 600 : 400,
                            transition: 'all 0.3s ease',
                            ...(cat !== 'all' && {
                                borderColor: PROTEIN_CATEGORY_COLORS[cat],
                                color: selectedCategory === cat ? 'white' : PROTEIN_CATEGORY_COLORS[cat],
                                bgcolor: selectedCategory === cat ? PROTEIN_CATEGORY_COLORS[cat] : 'transparent',
                                '&:hover': {
                                    bgcolor: selectedCategory === cat
                                        ? PROTEIN_CATEGORY_COLORS[cat]
                                        : `${PROTEIN_CATEGORY_COLORS[cat]}20`,
                                }
                            })
                        }}
                    />
                ))}
            </Stack>

            {/* 단백질 그리드 */}
            <Grid container spacing={2}>
                {filteredProteins.map((protein) => {
                    const abnormal = isAbnormal(protein);
                    const categoryColor = PROTEIN_CATEGORY_COLORS[protein.category] || '#666';
                    const value = proteinValues[protein.id];

                    return (
                        <Grid item xs={6} sm={4} md={2.4} key={protein.id}>
                            <Tooltip
                                title={
                                    <Box sx={{ p: 1 }}>
                                        <Typography variant="body2" fontWeight={600} gutterBottom>
                                            {protein.nameEn}
                                        </Typography>
                                        <Typography variant="caption" display="block" gutterBottom>
                                            {protein.description}
                                        </Typography>
                                        <Typography variant="caption" display="block" color="primary.light">
                                            정상 범위: {protein.normalRange}
                                        </Typography>
                                        {value && (
                                            <Typography
                                                variant="caption"
                                                display="block"
                                                sx={{ mt: 1, fontWeight: 600 }}
                                                color={abnormal ? 'error.light' : 'success.light'}
                                            >
                                                측정값: {value}
                                            </Typography>
                                        )}
                                    </Box>
                                }
                                arrow
                                placement="top"
                            >
                                <Badge
                                    badgeContent={abnormal ? '!' : 0}
                                    color="error"
                                    sx={{
                                        width: '100%',
                                        '& .MuiBadge-badge': {
                                            fontSize: '14px',
                                            fontWeight: 700,
                                        }
                                    }}
                                >
                                    <Button
                                        variant="outlined"
                                        onClick={() => onProteinClick(protein)}
                                        sx={{
                                            width: '100%',
                                            minHeight: '120px',
                                            borderRadius: '12px',
                                            borderWidth: 2,
                                            borderColor: abnormal ? '#dc2626' : categoryColor,
                                            bgcolor: abnormal ? 'rgba(220, 38, 38, 0.05)' : 'transparent',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            gap: 1,
                                            p: 2,
                                            '&:hover': {
                                                borderColor: categoryColor,
                                                bgcolor: `${categoryColor}15`,
                                                transform: 'translateY(-4px)',
                                                boxShadow: `0 8px 16px ${categoryColor}30`,
                                                borderWidth: 2,
                                            },
                                        }}
                                    >
                                        {/* 단백질 번호 */}
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: categoryColor,
                                                color: 'white',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '12px',
                                                fontWeight: 700,
                                            }}
                                        >
                                            {protein.id.split('_')[1]}
                                        </Box>

                                        {/* 단백질 이름 */}
                                        <Typography
                                            variant="body2"
                                            align="center"
                                            sx={{
                                                fontWeight: 600,
                                                color: 'text.primary',
                                                lineHeight: 1.2,
                                                fontSize: '13px',
                                            }}
                                        >
                                            {protein.name}
                                        </Typography>

                                        {/* UniProt ID */}
                                        <Chip
                                            label={protein.uniprotId}
                                            size="small"
                                            sx={{
                                                height: 20,
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                bgcolor: `${categoryColor}20`,
                                                color: categoryColor,
                                                border: 'none',
                                            }}
                                        />

                                        {/* 측정값 표시 */}
                                        {value && (
                                            <Typography
                                                variant="caption"
                                                sx={{
                                                    fontWeight: 700,
                                                    color: abnormal ? '#dc2626' : '#16a34a',
                                                    fontSize: '11px',
                                                }}
                                            >
                                                {value}
                                            </Typography>
                                        )}
                                    </Button>
                                </Badge>
                            </Tooltip>
                        </Grid>
                    );
                })}
            </Grid>

            {/* 결과 없음 */}
            {filteredProteins.length === 0 && (
                <Box
                    sx={{
                        textAlign: 'center',
                        py: 8,
                        color: 'text.secondary',
                    }}
                >
                    <Typography variant="body1">
                        검색 결과가 없습니다
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                        다른 검색어를 입력하거나 필터를 변경해보세요
                    </Typography>
                </Box>
            )}

            {/* 하단 정보 */}
            <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary">
                    총 {proteins.length}개 바이오마커 중 {filteredProteins.length}개 표시
                </Typography>
            </Box>
        </Box>
    );
};

export default ProteinButtonGrid;
