# NeuroNova 향후 UI 구조 계획

## OHIF Viewer 기반 의료 영상 인터페이스

참고 문서: `docs/base_txt/React (의료진용).txt`

---

## 현재 상태 (2025-11-29)

✅ **구현 완료**:
- 인증 시스템 (회원가입, 로그인)
- 홈페이지 (랜딩 페이지)
- 대시보드 (기본 레이아웃)
- API 연결 (Django 백엔드와 통신)

⏳ **구현 대기**:
- DICOM 의료 영상 뷰어
- AI 분석 결과 패널
- XAI 시각화 (Grad-CAM, SHAP)

---

## 향후 3단 레이아웃 구조

### 레이아웃 개요

```
┌──────────────┬───────────────────────┬──────────────┐
│              │                       │              │
│  Left Panel  │    Center Panel       │ Right Panel  │
│   (250px)    │       (Flex)          │   (350px)    │
│              │                       │              │
│   Patient    │   DICOM Viewer        │  AI Results  │
│   Series     │   (Cornerstone.js)    │   (CDSS)     │
│              │                       │              │
└──────────────┴───────────────────────┴──────────────┘
```

### Left Panel (좌측 패널)

**역할**: 환자 정보 및 MRI 시퀀스 선택

**주요 컴포넌트**:
- `PatientInfoCard.jsx`: 환자 기본 정보 (이름, 나이, 성별)
- `SeriesSelector.jsx`: MRI 시퀀스 목록 (T1, T2, FLAIR 등)
  - 썸네일 이미지
  - 선택 시 중앙 뷰어에 표시

**참고**: OHIF의 Study Browser와 동일한 역할

### Center Panel (중앙 패널)

**역할**: DICOM 의료 영상 뷰어

**주요 컴포넌트**:
- `Viewport.jsx`: CornerstoneJS 기반 캔버스
  - DICOM 이미지 렌더링
  - Stack Scroll (마우스 휠로 슬라이스 넘기기)
- `Toolbar.jsx`: 영상 조작 도구
  - Zoom, Pan, 밝기/대비 조절 (Window Level)
  - Rotate, Reset
- `OverlayLayer.jsx`: AI Segmentation 마스크
  - 원본 영상 위에 종양 영역을 반투명하게 오버레이

**기술 스택**:
- [CornerstoneJS](https://www.cornerstonejs.org/): 의료 영상 렌더링 라이브러리
- Canvas API

### Right Panel (우측 패널)

**역할**: AI CDSS 분석 결과 표시

**주요 컴포넌트**:
- `PredictionScore.jsx`: AI 확신도 그래프
  - "뇌종양 확률: 98.5%"
  - 진행 바 또는 도넛 차트
- `TumorClassification.jsx`: 종양 분류 결과
  - Glioma, Meningioma, Pituitary 등
- `XAIVisualization.jsx`: 설명 가능한 AI
  - Grad-CAM 히트맵
  - SHAP feature importance
- `ActionButtons.jsx`:
  - "AI 결과 보기/숨기기" 토글
  - "보고서 저장" 버튼

---

## 컴포넌트 계층 구조

```
AnalysisViewerPage
├── LeftPanel
│   ├── PatientInfoCard
│   └── SeriesSelector
│       └── SeriesThumbnail (리스트)
├── CenterPanel
│   ├── Toolbar
│   │   └── ToolButton (여러 개)
│   └── Viewport (Canvas)
│       └── OverlayLayer (AI Mask)
└── RightPanel
    ├── PredictionScore
    ├── TumorClassification
    ├── XAIVisualization
    └── ActionButtons
```

---

## 데이터 흐름

1. **환자 선택** (Left Panel) → API 호출 → MRI 시퀀스 목록 로드
2. **시퀀스 클릭** → Orthanc에서 DICOM 이미지 다운로드 → Canvas 렌더링
3. **AI 분석 요청** → Django → Flask AI 서버 → 결과 반환
4. **AI 결과 표시** (Right Panel) + Segmentation Mask (Center Panel)
5. **의사 피드백** → Django 저장 → Human-in-the-loop

---

## 참고 자료

### 벤치마킹 사이트

1. **OHIF Viewer** (1순위)
   - https://ohif.org/
   - React 기반, 실제 의료 환경에서 사용
   - 3단 레이아웃 구조가 NeuroNova와 정확히 일치

2. **NCI IDC Viewer** (2순위)
   - https://portal.imaging.datacommons.cancer.gov/
   - OHIF 기반, 임상 데이터 통합 표시

3. **MD.ai** (3순위)
   - https://md.ai/
   - AI annotation 플랫폼
   - XAI 표시 방법 참고

### 라이브러리

- **[CornerstoneJS](https://www.cornerstonejs.org/)**: DICOM 렌더링 (핵심)
- **Chart.js / Recharts**: AI 확신도 그래프
- **React DnD**: 드래그 앤 드롭 (선택)

---

## 구현 우선순위

### Phase 1: DICOM 뷰어 기본 (4주)
- [ ] CornerstoneJS 설치 및 초기화
- [ ] Orthanc API 연동 (DICOM 이미지 로드)
- [ ] 기본 뷰어 (Zoom, Pan, Scroll)
- [ ] 3단 레이아웃 구조

### Phase 2: AI 통합 (3주)
- [ ] Flask AI 서버 구현
- [ ] Django-Flask 통신
- [ ] AI 결과 표시 패널
- [ ] Segmentation Mask 오버레이

### Phase 3: XAI 시각화 (2주)
- [ ] Grad-CAM 히트맵 생성
- [ ] SHAP 그래프
- [ ] 토글 기능 (원본 vs AI 결과)

### Phase 4: UX 개선 (2주)
- [ ] 키보드 단축키
- [ ] 마우스 조작 최적화
- [ ] 성능 최적화 (WebGL)

**총 예상 기간**: 11주 (약 3개월)

---

## 현재 작업과의 연관성

현재 완료된 작업:
- ✅ 인증 시스템 → 의료진 로그인 후 뷰어 접근
- ✅ API 연결 → Django 백엔드와 통신 준비 완료
- ✅ 기본 대시보드 → 환자 목록, 예약 관리

다음 단계:
- 🔄 DICOM 뷰어 개발 시작 (별도 작업)
- 🔄 Flask AI 서버 구현 (설계는 완료됨)

---

**마지막 업데이트**: 2025-11-29
