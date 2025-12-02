# UI/UX 스타일 일관성 작업 가이드

## 📋 목차
1. [작업 개요](#작업-개요)
2. [왜 이 작업이 필요한가?](#왜-이-작업이-필요한가)
3. [진행 상황](#진행-상황)
4. [작업 방법](#작업-방법)
5. [예제](#예제)

---

## 작업 개요

### 목표
Material-UI (MUI) 컴포넌트를 순수 CSS 클래스 기반으로 전환하여 스타일 일관성을 확보하고 성능을 개선합니다.

### 장점
- ✅ **성능 향상**: Material-UI 라이브러리 의존성 제거로 번들 크기 감소
- ✅ **스타일 일관성**: 전체 프로젝트에서 통일된 디자인 시스템 적용
- ✅ **유지보수성**: CSS 클래스 기반으로 더 직관적인 스타일 관리
- ✅ **커스터마이징**: 디자인 변경이 더 쉽고 빠름

---

## 왜 이 작업이 필요한가?

### 현재 문제점
```jsx
// 문제 1: Material-UI 의존성
import { Container, Box, Typography, Button } from '@mui/material';

// 문제 2: sx prop으로 인한 복잡한 스타일
<Box sx={{ mt: 4, mb: 2, display: 'flex', justifyContent: 'center' }}>
  <Typography variant="h4" fontWeight="bold">
    Title
  </Typography>
</Box>

// 문제 3: 일관성 없는 스타일링 (MUI와 일반 CSS 혼재)
```

### 해결 방법
```jsx
// 해결: 순수 CSS 클래스 사용
import './ComponentName.css';

<div className="component-container">
  <h1 className="component-title">
    Title
  </h1>
</div>
```

---

## 진행 상황

### ✅ 완료된 페이지 (4개)

#### 복잡한 페이지 (3개)
1. **BiomarkerAnalysisPage.jsx** + `BiomarkerAnalysisPage.css`
   - 30개 바이오마커 AI 분석 페이지
   - 탭 인터페이스, 프로그레스 바, 그리드 레이아웃

2. **CDSSPage.jsx** + `CDSSPage.css`
   - AI Protein Analysis 페이지
   - 3D 단백질/장기 뷰어, 컨트롤 패널

3. **ProteinViewerPage.jsx** (CDSSPage.css 재사용)
   - 단백질 3D 구조 시각화 페이지

#### 단순 페이지 (1개)
4. **LandingPage.jsx** + `LandingPage.css`
   - 메인 랜딩 페이지
   - Material-UI 아이콘을 SVG로 직접 구현

### 🔄 남은 페이지 (~20개)
- DicomViewerPage.jsx
- DataManagementPage.jsx
- DashboardPage.jsx
- PatientListPage.jsx
- AntigenResultPage.jsx (일부 Material-UI 남아있음)
- 기타 약 15개 페이지

---

## 작업 방법

### Step 1: 현재 페이지 분석
```bash
# 1. 페이지 파일 열기
code src/pages/YourPage.jsx

# 2. Material-UI import 확인
# 다음과 같은 import 문이 있는지 확인:
import { Container, Box, Typography, Button } from '@mui/material';
```

### Step 2: CSS 파일 생성
```bash
# src/pages/YourPage.css 생성
touch src/pages/YourPage.css
```

**CSS 파일 템플릿:**
```css
/* YourPage.css */

.your-page-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

.your-page-title {
    font-size: 2.25rem;
    font-weight: 700;
    color: #1a202c;
    margin-bottom: 16px;
}

.your-page-button {
    padding: 10px 20px;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s;
}

.your-page-button:hover {
    background-color: #1d4ed8;
}
```

### Step 3: JSX 변환

#### Before (Material-UI)
```jsx
import { Container, Typography, Button, Box } from '@mui/material';

function MyPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 2 }}>
        <Typography variant="h4" fontWeight="bold">
          제목
        </Typography>
      </Box>
      <Button variant="contained" color="primary">
        클릭
      </Button>
    </Container>
  );
}
```

#### After (CSS 클래스)
```jsx
import './MyPage.css';

function MyPage() {
  return (
    <div className="my-page-container">
      <div className="my-page-header">
        <h1 className="my-page-title">
          제목
        </h1>
      </div>
      <button className="my-page-button">
        클릭
      </button>
    </div>
  );
}
```

### Step 4: Material-UI 아이콘 처리

#### Option 1: SVG로 직접 구현 (권장)
```jsx
// Before
import { MedicalServices } from '@mui/icons-material';
<MedicalServices sx={{ fontSize: 48 }} />

// After
const MedicalServicesIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.5 3.5L18 2l-1.5 1.5L15 2l-1.5 1.5L12 2l-1.5 1.5L9 2 7.5 3.5 6 2v14H3v3c0 1.66 1.34 3 3 3h12c1.66 0 3-1.34 3-3V2l-1.5 1.5z"/>
  </svg>
);
```

#### Option 2: 유니코드 이모지 사용
```jsx
const icons = {
  save: '💾',
  delete: '🗑️',
  edit: '✏️',
  search: '🔍'
};
```

---

## 예제

### 예제 1: 간단한 페이지 (LandingPage)

#### 파일 구조
```
src/pages/
  ├── LandingPage.jsx
  └── LandingPage.css
```

#### LandingPage.jsx
```jsx
import { Link } from 'react-router-dom';
import './LandingPage.css';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <div className="landing-container">
        <div className="landing-hero">
          <h1 className="landing-title">NeuroNova</h1>
          <p className="landing-subtitle">
            AI 기반 뇌종양 임상 의사결정 지원 시스템
          </p>
          <div className="landing-buttons">
            <Link to="/login" className="landing-button primary">
              로그인
            </Link>
            <Link to="/register" className="landing-button outlined">
              회원가입
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
```

#### LandingPage.css
```css
.landing-page {
    min-height: 100vh;
    background-color: #f9fafb;
}

.landing-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 24px;
}

.landing-hero {
    padding-top: 96px;
    padding-bottom: 64px;
    text-align: center;
}

.landing-title {
    font-size: 3.75rem;
    font-weight: 700;
    background: linear-gradient(45deg, #2196F3 30%, #21CBF3 90%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}

.landing-subtitle {
    font-size: 1.5rem;
    color: #718096;
    margin: 16px 0 32px;
}

.landing-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
}

.landing-button {
    padding: 12px 32px;
    font-size: 1rem;
    font-weight: 600;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s;
}

.landing-button.primary {
    background-color: #2563eb;
    color: white;
    border: none;
}

.landing-button.primary:hover {
    background-color: #1d4ed8;
}

.landing-button.outlined {
    background-color: white;
    color: #2563eb;
    border: 2px solid #2563eb;
}

.landing-button.outlined:hover {
    background-color: #eff6ff;
}
```

### 예제 2: 복잡한 페이지 (BiomarkerAnalysisPage)

#### 특징
- 탭 인터페이스
- 그리드 레이아웃
- 프로그레스 바
- 버튼 상태 (loading, disabled)

#### BiomarkerAnalysisPage.jsx (일부)
```jsx
import './BiomarkerAnalysisPage.css';

const BiomarkerAnalysisPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  return (
    <DashboardLayout>
      <div className="biomarker-container">
        {/* 탭 */}
        <div className="biomarker-tabs-container">
          <div className="biomarker-tabs">
            <button
              className={`biomarker-tab ${activeTab === 0 ? 'active' : ''}`}
              onClick={() => setActiveTab(0)}
            >
              데이터 입력
            </button>
            <button
              className={`biomarker-tab ${activeTab === 1 ? 'active' : ''}`}
              onClick={() => setActiveTab(1)}
            >
              분석 결과
            </button>
          </div>
        </div>

        {/* 버튼 */}
        <button
          className="biomarker-button contained"
          onClick={handleAnalyze}
          disabled={loading}
        >
          {loading ? (
            <div className="biomarker-loading"></div>
          ) : (
            'AI 분석 실행'
          )}
        </button>

        {/* 그리드 */}
        <div className="biomarker-grid">
          <div className="biomarker-grid-item-5">
            {/* 왼쪽 콘텐츠 */}
          </div>
          <div className="biomarker-grid-item-7">
            {/* 오른쪽 콘텐츠 */}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
```

#### BiomarkerAnalysisPage.css (일부)
```css
/* 탭 */
.biomarker-tabs-container {
    border-bottom: 1px solid #e2e8f0;
    margin-bottom: 24px;
}

.biomarker-tabs {
    display: flex;
    gap: 0;
}

.biomarker-tab {
    padding: 12px 24px;
    border: none;
    background: none;
    cursor: pointer;
    color: #718096;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
}

.biomarker-tab.active {
    color: #2563eb;
    border-bottom-color: #2563eb;
}

/* 버튼 */
.biomarker-button {
    padding: 10px 20px;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
}

.biomarker-button.contained {
    background-color: #2563eb;
    color: white;
    border: none;
}

.biomarker-button.contained:disabled {
    background-color: #cbd5e0;
    cursor: not-allowed;
}

/* 로딩 스피너 */
.biomarker-loading {
    width: 24px;
    height: 24px;
    border: 3px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* 반응형 그리드 */
.biomarker-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 24px;
}

.biomarker-grid-item-5 {
    grid-column: span 12;
}

.biomarker-grid-item-7 {
    grid-column: span 12;
}

@media (min-width: 1200px) {
    .biomarker-grid-item-5 {
        grid-column: span 5;
    }
    .biomarker-grid-item-7 {
        grid-column: span 7;
    }
}
```

---

## Material-UI → CSS 변환 치트시트

### 레이아웃
| Material-UI | CSS 클래스 |
|------------|-----------|
| `<Container maxWidth="lg">` | `<div className="container">` + `max-width: 1200px` |
| `<Box sx={{ mt: 4 }}>` | `<div className="box">` + `margin-top: 32px` |
| `<Grid container spacing={3}>` | `<div className="grid">` + CSS Grid |
| `<Stack spacing={2}>` | `<div className="stack">` + `gap: 16px` |

### 타이포그래피
| Material-UI | CSS 클래스 |
|------------|-----------|
| `<Typography variant="h4">` | `<h1 className="title">` + `font-size: 2.25rem` |
| `<Typography variant="body1">` | `<p className="text">` + `font-size: 1rem` |
| `<Typography color="text.secondary">` | `<p className="text-secondary">` + `color: #718096` |

### 버튼
| Material-UI | CSS 클래스 |
|------------|-----------|
| `<Button variant="contained">` | `<button className="button primary">` |
| `<Button variant="outlined">` | `<button className="button outlined">` |
| `<Button disabled>` | `<button className="button" disabled>` |

### 기타
| Material-UI | CSS 클래스 |
|------------|-----------|
| `<Paper sx={{ p: 3 }}>` | `<div className="paper">` + `padding: 24px` |
| `<Card>` | `<div className="card">` |
| `<Alert severity="info">` | `<div className="alert info">` |
| `<Tabs>` | `<div className="tabs">` |

---

## 자주 묻는 질문 (FAQ)

### Q1: 이 작업을 꼭 해야 하나요?
**A:** 선택사항입니다. 하지만 다음과 같은 경우 강력히 권장합니다:
- 프로젝트의 번들 크기를 줄이고 싶을 때
- 일관된 디자인 시스템을 구축하고 싶을 때
- Material-UI 의존성을 제거하고 싶을 때

### Q2: 얼마나 걸리나요?
**A:** 페이지 복잡도에 따라 다릅니다:
- 간단한 페이지: 30분~1시간
- 복잡한 페이지: 1~2시간

### Q3: 기존 기능이 깨지지 않나요?
**A:** 올바르게 작업하면 기능은 그대로 유지됩니다. 오직 스타일만 변경됩니다.

### Q4: 반응형은 어떻게 처리하나요?
**A:** CSS Media Query를 사용합니다:
```css
@media (min-width: 768px) {
    .grid-item {
        grid-column: span 6;
    }
}

@media (min-width: 1200px) {
    .grid-item {
        grid-column: span 4;
    }
}
```

### Q5: 모든 페이지를 한번에 해야 하나요?
**A:** 아니요. 점진적으로 진행할 수 있습니다. 한 페이지씩 완료하면서 진행하세요.

---

## 다음 작업 우선순위

### 높은 우선순위 (사용 빈도 높음)
1. DashboardPage.jsx - 대시보드 메인 페이지
2. PatientListPage.jsx - 환자 목록
3. DicomViewerPage.jsx - DICOM 뷰어

### 중간 우선순위
4. DataManagementPage.jsx
5. AntigenResultPage.jsx (부분 완료)
6. AppointmentManagementPage.jsx

### 낮은 우선순위 (사용 빈도 낮음)
7. AboutPage.jsx
8. NotificationCenterPage.jsx
9. 기타 설정 페이지들

---

## 도움이 필요하면

1. **완료된 예제 참고**:
   - `src/pages/LandingPage.jsx` + `.css`
   - `src/pages/BiomarkerAnalysisPage.jsx` + `.css`
   - `src/pages/CDSSPage.jsx` + `.css`

2. **CSS 클래스 네이밍 규칙**:
   - `{페이지명}-{요소명}` 형식 사용
   - 예: `landing-title`, `biomarker-button`, `cdss-grid`

3. **공통 스타일 재사용**:
   - 비슷한 페이지가 있다면 CSS를 재사용하세요
   - 예: `ProteinViewerPage`는 `CDSSPage.css`를 재사용

---

## 체크리스트

작업 전:
- [ ] 원본 페이지 백업 (git commit)
- [ ] Material-UI import 확인
- [ ] 페이지 복잡도 평가

작업 중:
- [ ] CSS 파일 생성
- [ ] Material-UI 컴포넌트 → HTML 태그 변환
- [ ] sx props → CSS 클래스 변환
- [ ] 아이콘 처리 (SVG 또는 이모지)
- [ ] 반응형 스타일 추가

작업 후:
- [ ] 기능 테스트 (클릭, 입력, 네비게이션)
- [ ] 반응형 테스트 (모바일, 태블릿, 데스크톱)
- [ ] 브라우저 테스트 (Chrome, Firefox, Safari)
- [ ] Material-UI import 완전 제거 확인
- [ ] git commit

---

**작성일**: 2025-12-02
**버전**: 1.0
**작성자**: Claude (AI Assistant)
