/**
 * NeuroNova - 바이오마커 분석 테마 설정
 * 
 * 우선순위 기반 색상 체계:
 * 1. COVID (최고 우선순위) - Red
 * 2. FLU (높은 우선순위) - Orange  
 * 3. COLD (중간 우선순위) - Amber
 * 4. NORMAL (정상) - Green
 */

export const CATEGORY_COLORS = {
  COVID: {
    primary: '#dc2626',      // Red-600
    secondary: '#fecaca',    // Red-200
    light: '#fee2e2',        // Red-100
    dark: '#991b1b',         // Red-800
    gradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
    shadow: '0 8px 32px rgba(220, 38, 38, 0.3)',
    borderColor: '#dc2626',
    bgAlpha: 'rgba(220, 38, 38, 0.05)',
    icon: '🦠',
    label: '코로나',
    labelEn: 'COVID-19',
    description: '코로나19 가능성 높음 - 즉시 격리 및 검사 필요',
    severity: 4
  },
  FLU: {
    primary: '#ea580c',      // Orange-600
    secondary: '#fed7aa',    // Orange-200
    light: '#ffedd5',        // Orange-100
    dark: '#9a3412',         // Orange-800
    gradient: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
    shadow: '0 8px 32px rgba(234, 88, 12, 0.3)',
    borderColor: '#ea580c',
    bgAlpha: 'rgba(234, 88, 12, 0.05)',
    icon: '🤒',
    label: '독감',
    labelEn: 'Influenza',
    description: '독감 가능성 높음 - 휴식 및 수액 권장',
    severity: 3
  },
  COLD: {
    primary: '#d97706',      // Amber-600
    secondary: '#fde68a',    // Amber-200
    light: '#fef3c7',        // Amber-100
    dark: '#92400e',         // Amber-800
    gradient: 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)',
    shadow: '0 8px 32px rgba(217, 119, 6, 0.3)',
    borderColor: '#d97706',
    bgAlpha: 'rgba(217, 119, 6, 0.05)',
    icon: '🤧',
    label: '감기',
    labelEn: 'Common Cold',
    description: '일반 감기 - 충분한 휴식 권장',
    severity: 2
  },
  NORMAL: {
    primary: '#16a34a',      // Green-600
    secondary: '#bbf7d0',    // Green-200
    light: '#dcfce7',        // Green-100
    dark: '#14532d',         // Green-800
    gradient: 'linear-gradient(135deg, #16a34a 0%, #22c55e 100%)',
    shadow: '0 8px 32px rgba(22, 163, 74, 0.3)',
    borderColor: '#16a34a',
    bgAlpha: 'rgba(22, 163, 74, 0.05)',
    icon: '✅',
    label: '정상',
    labelEn: 'Normal',
    description: '정상 범위 - 건강 상태 양호',
    severity: 1
  }
};

/**
 * 우선순위 순서 (높은 순서대로)
 */
export const CATEGORY_ORDER = ['COVID', 'FLU', 'COLD', 'NORMAL'];

/**
 * 카테고리 키로 색상 정보 가져오기
 */
export const getCategoryColor = (category) => {
  const upperCategory = category?.toUpperCase();
  return CATEGORY_COLORS[upperCategory] || CATEGORY_COLORS.NORMAL;
};

/**
 * 우선순위에 따른 결과 정렬
 */
export const sortByPriority = (results) => {
  return [...results].sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a.category?.toUpperCase());
    const indexB = CATEGORY_ORDER.indexOf(b.category?.toUpperCase());
    return indexA - indexB;
  });
};

/**
 * 신뢰도에 따른 색상 가져오기
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 0.9) return '#16a34a'; // Green
  if (confidence >= 0.7) return '#d97706'; // Amber
  if (confidence >= 0.5) return '#ea580c'; // Orange
  return '#dc2626'; // Red
};

/**
 * 단백질 카테고리 색상
 */
export const PROTEIN_CATEGORY_COLORS = {
  '염증 마커': '#3b82f6',      // Blue
  '사이토카인': '#8b5cf6',      // Purple
  '응고 마커': '#ec4899',       // Pink
  '철 저장 단백질': '#f59e0b',  // Amber
  '면역 단백질': '#10b981',     // Emerald
  '대사 마커': '#f97316',       // Orange
  '호르몬': '#06b6d4',          // Cyan
  '효소': '#84cc16',            // Lime
  '구조 단백질': '#6366f1',     // Indigo
};

/**
 * 프리미엄 UI 스타일
 */
export const PREMIUM_STYLES = {
  cardBorderRadius: '16px',
  buttonBorderRadius: '12px',
  modalBorderRadius: '20px',
  cardShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
  cardShadowHover: '0 12px 24px rgba(0, 0, 0, 0.12)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  glassEffect: 'rgba(255, 255, 255, 0.9)',
  backdropBlur: 'blur(10px)',
};

export default {
  CATEGORY_COLORS,
  CATEGORY_ORDER,
  getCategoryColor,
  sortByPriority,
  getConfidenceColor,
  PROTEIN_CATEGORY_COLORS,
  PREMIUM_STYLES,
};
