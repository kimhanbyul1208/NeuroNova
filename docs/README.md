# NeuroNova 프로젝트 문서 가이드

**버전**: 2.0
**최종 업데이트**: 2025-12-06

---

## 📌 이 문서의 목적

이 README는 NeuroNova 프로젝트의 모든 문서를 체계적으로 정리하여, Claude Code가 프로젝트 작업 시 필요한 정보를 빠르게 찾을 수 있도록 돕습니다.

---

## 📁 문서 구조 개요

```
docs/
├── README.md                           # 이 파일 (문서 네비게이션 가이드)
├── 00_base_txt/                        # 기본 프로젝트 정보
│   ├── TEAM_ROLES.md                  # 팀 역할 및 협업 가이드
│   └── frountend_이전자료.md          # 프론트엔드 레거시 자료
├── 00_PROJECT_ROADMAP.md               # 프로젝트 로드맵 및 개발 계획
├── 01_NeuroNova_Context.md             # 프로젝트 전체 컨텍스트
├── 01_프롬/                            # 발표 자료
│   ├── 프롬8_예측결과.md
│   └── 프롬10.md
├── 02_DB 설명 문서.md                  # 데이터베이스 스키마 상세
├── 04_test_accounts.md                 # 테스트용 계정 정보
├── 09_배포가이드.md                    # 배포 프로세스 가이드
├── 10_django_api.md                    # Django API 엔드포인트 문서
├── 10_배포전_체크리스트.md             # 배포 전 체크리스트
├── 11_DJANGO_FLASK_COMMUNICATION.md    # Django-Flask 통신 구조
├── 12_flask_ai_integration.md          # Flask AI 서버 통합 가이드
├── 13_API_SPECIFICATION.md             # API 명세서 (영문)
├── 13_API_명세서.md                    # API 명세서 (한글)
├── 13_API_통합명세서.md                # API 통합 명세서 (최신)
├── 14_ML_API_예제.md                   # ML API 사용 예제
├── 15_ML_API_통합가이드.md             # ML API 통합 가이드 (최신)
├── 16_DJANGO_설계_가이드.md            # Django 설계 철학 및 보고서 (신규)
├── 17_FLUTTER_설계_가이드.md           # Flutter 설계 철학 및 보고서 (신규)
├── 50_FRONTEND_CHECKLIST.md            # 프론트엔드 개발 체크리스트
├── 51_FRONTEND_IMPLEMENTATION_GUIDE.md # 프론트엔드 구현 가이드
├── 52_REACT_IMPROVEMENTS.md            # React 웹 개선사항
├── 53_protein_viewer_api.md            # Protein Viewer API 문서
├── 54_REACT_설계_보고서.md             # React 설계 철학 및 보고서 (신규)
├── 60_firebase_integration.md          # Firebase FCM 연동 가이드
├── 61_FUTURE_UI_STRUCTURE.md           # 향후 UI 구조 계획
├── 99_시스템_상태_보고서.md             # 시스템 현황 보고서
├── ARCHITECTURE.md                     # 시스템 아키텍처 문서
├── DB_INIT_GUIDE.md                    # 데이터베이스 초기화 가이드
├── ML_API_사용_가이드.md               # ML API 사용법
└── domain/                             # 도메인별 문서
    └── 뇌종양.md
```

---

## 🎯 주요 문서 카테고리

### 1️⃣ 프로젝트 개요 및 기획 (시작 전 필독)

| 문서 | 설명 | 언제 참고? |
|------|------|------------|
| [01_NeuroNova_Context.md](./01_NeuroNova_Context.md) | 프로젝트 전반적인 배경, 목표, 시스템 구성 | **프로젝트 전체 컨텍스트 이해 필요 시** |
| [00_PROJECT_ROADMAP.md](./00_PROJECT_ROADMAP.md) | 개발 로드맵, 마일스톤, 우선순위 | 개발 계획 및 진행 상황 확인 시 |
| [00_base_txt/TEAM_ROLES.md](./00_base_txt/TEAM_ROLES.md) | 팀원 역할 분담, 협업 가이드 | 역할별 작업 확인 및 협업 시 |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | 시스템 아키텍처 다이어그램 및 설명 | **아키텍처 구조 이해 필요 시** |

---

### 2️⃣ 데이터베이스 및 데이터 모델

| 문서 | 설명 | 언제 참고? |
|------|------|------------|
| [02_DB 설명 문서.md](./02_DB%20설명%20문서%20.md) | 데이터베이스 스키마, 테이블 구조 상세 | **DB 스키마 이해 또는 마이그레이션 시** |
| [DB_INIT_GUIDE.md](./DB_INIT_GUIDE.md) | 데이터베이스 초기화 및 마이그레이션 절차 | DB 초기 설정 또는 리셋 필요 시 |

---

### 3️⃣ 백엔드 (Django & Flask)

| 문서 | 설명 | 언제 참고? |
|------|------|------------|
| [**16_DJANGO_설계_가이드.md**](./16_DJANGO_설계_가이드.md) | **Django 설계 철학 및 모범 사례 (신규)** | **Django 설계 원칙 및 리팩토링 시** |
| [10_django_api.md](./10_django_api.md) | Django REST API 엔드포인트 전체 목록 | **API 엔드포인트 확인 시** |
| [**13_API_통합명세서.md**](./13_API_통합명세서.md) | **Django + Flask API 통합 명세서 (최신)** | **API 통합 개발 시 (권장)** |
| [**15_ML_API_통합가이드.md**](./15_ML_API_통합가이드.md) | **ML API 사용 가이드 (최신 통합)** | **ML API 사용 시 (권장)** |
| [11_DJANGO_FLASK_COMMUNICATION.md](./11_DJANGO_FLASK_COMMUNICATION.md) | Django와 Flask 간 통신 방법 | Django-Flask 연동 작업 시 |
| [12_flask_ai_integration.md](./12_flask_ai_integration.md) | Flask AI 서버 통합 가이드 | AI 추론 서버 연동 시 |

**📦 이전 버전 (참고용)**:
- `13_API_SPECIFICATION.md` → `13_API_통합명세서.md`로 대체
- `13_API_명세서.md` → `13_API_통합명세서.md`로 대체
- `14_ML_API_예제.md` → `15_ML_API_통합가이드.md`로 대체
- `ML_API_사용_가이드.md` → `15_ML_API_통합가이드.md`로 대체

---

### 4️⃣ 프론트엔드 (React Web & Flutter App)

| 문서 | 설명 | 언제 참고? |
|------|------|------------|
| [51_FRONTEND_IMPLEMENTATION_GUIDE.md](./51_FRONTEND_IMPLEMENTATION_GUIDE.md) | **프론트엔드 구현 전체 가이드 (React + Flutter)** | **프론트엔드 작업 시작 전 필독** |
| [**54_REACT_설계_보고서.md**](./54_REACT_설계_보고서.md) | **React 설계 철학 및 모범 사례 (신규)** | **React 설계 원칙 및 리팩토링 시** |
| [**17_FLUTTER_설계_가이드.md**](./17_FLUTTER_설계_가이드.md) | **Flutter 설계 철학 및 모범 사례 (신규)** | **Flutter 설계 원칙 및 리팩토링 시** |
| [50_FRONTEND_CHECKLIST.md](./50_FRONTEND_CHECKLIST.md) | 프론트엔드 개발 체크리스트 | 프론트엔드 작업 진행 상황 확인 시 |
| [52_REACT_IMPROVEMENTS.md](./52_REACT_IMPROVEMENTS.md) | React 웹 애플리케이션 개선 사항 | React 웹 기능 추가/수정 시 |
| [61_FUTURE_UI_STRUCTURE.md](./61_FUTURE_UI_STRUCTURE.md) | 향후 UI 구조 개선 계획 | UI/UX 개선 작업 시 |

---

### 5️⃣ Firebase & 알림

| 문서 | 설명 | 언제 참고? |
|------|------|------------|
| [60_firebase_integration.md](./60_firebase_integration.md) | **Firebase Cloud Messaging 연동 가이드** | **푸시 알림 기능 구현 시** |

---

### 6️⃣ 배포 및 운영

| 문서 | 설명 | 언제 참고? |
|------|------|------------|
| [09_배포가이드.md](./09_배포가이드.md) | **Docker Compose 기반 배포 프로세스** | **배포 작업 시** |
| [10_배포전_체크리스트.md](./10_배포전_체크리스트.md) | 배포 전 확인 사항 체크리스트 | 배포 전 점검 시 |
| [99_시스템_상태_보고서.md](./99_시스템_상태_보고서.md) | 현재 시스템 상태 및 이슈 리스트 | 시스템 현황 파악 시 |

---

### 7️⃣ 테스트 및 품질 관리

| 문서 | 설명 | 언제 참고? |
|------|------|------------|
| [04_test_accounts.md](./04_test_accounts.md) | 테스트용 계정 정보 (의사, 환자, 관리자 등) | **테스트 로그인 필요 시** |

---

### 8️⃣ 기타

| 문서 | 설명 | 언제 참고? |
|------|------|------------|
| [53_protein_viewer_api.md](./53_protein_viewer_api.md) | Protein Viewer API 문서 | Protein 시각화 기능 구현 시 |
| [domain/뇌종양.md](./domain/뇌종양.md) | 뇌종양 도메인 지식 | 의료 도메인 이해 필요 시 |

---

## 🚀 빠른 시작 가이드 (Claude Code용)

### 시나리오별 참고 문서

#### 📌 새로운 기능 개발 시작 전
1. [01_NeuroNova_Context.md](./01_NeuroNova_Context.md) - 프로젝트 컨텍스트 확인
2. [ARCHITECTURE.md](./ARCHITECTURE.md) - 시스템 아키텍처 이해
3. [02_DB 설명 문서.md](./02_DB%20설명%20문서%20.md) - 필요한 DB 테이블 확인

#### 📌 API 엔드포인트 작업 시
1. [10_django_api.md](./10_django_api.md) - 전체 API 엔드포인트 목록
2. [**13_API_통합명세서.md**](./13_API_통합명세서.md) - **API 통합 명세서 (최신, 권장)**

#### 📌 프론트엔드 개발 시
1. [51_FRONTEND_IMPLEMENTATION_GUIDE.md](./51_FRONTEND_IMPLEMENTATION_GUIDE.md) - 프론트엔드 전체 가이드
2. [**54_REACT_설계_보고서.md**](./54_REACT_설계_보고서.md) - **React 설계 원칙 (최신)**
3. [**17_FLUTTER_설계_가이드.md**](./17_FLUTTER_설계_가이드.md) - **Flutter 설계 원칙 (최신)**
4. [52_REACT_IMPROVEMENTS.md](./52_REACT_IMPROVEMENTS.md) - React 개선사항
5. [60_firebase_integration.md](./60_firebase_integration.md) - Firebase 연동 (푸시 알림 등)

#### 📌 AI/ML 기능 개발 시
1. [**15_ML_API_통합가이드.md**](./15_ML_API_통합가이드.md) - **ML API 사용 가이드 (최신, 권장)**
2. [12_flask_ai_integration.md](./12_flask_ai_integration.md) - Flask AI 서버 통합
3. [11_DJANGO_FLASK_COMMUNICATION.md](./11_DJANGO_FLASK_COMMUNICATION.md) - Django-Flask 통신

#### 📌 배포 및 운영 작업 시
1. [09_배포가이드.md](./09_배포가이드.md) - 배포 프로세스
2. [10_배포전_체크리스트.md](./10_배포전_체크리스트.md) - 배포 전 체크리스트
3. [DB_INIT_GUIDE.md](./DB_INIT_GUIDE.md) - DB 초기화
4. [99_시스템_상태_보고서.md](./99_시스템_상태_보고서.md) - 현재 시스템 상태

#### 📌 테스트 작업 시
1. [04_test_accounts.md](./04_test_accounts.md) - 테스트 계정 정보

---

## 🔍 핵심 개념 및 용어

### 프로젝트 정보
- **프로젝트명**: NeuroNova (Neurology + Nova)
- **목적**: 뇌종양 진단 임상 의사결정 지원 시스템 (CDSS)
- **주요 기능**:
  - AI 기반 뇌종양 분류 (Glioma, Meningioma, Pituitary)
  - 설명 가능한 AI (XAI) - SHAP, Grad-CAM
  - DICOM 의료 영상 뷰어
  - EMR (전자 의무 기록) 통합
  - 진료 예약 시스템
  - FCM 푸시 알림

### 기술 스택
- **Backend**: Django REST API, Flask (AI 추론), Celery (비동기 작업)
- **Frontend**: React (의료진용 웹), Flutter (환자용 모바일 앱)
- **Database**: PostgreSQL (메인), Redis (캐싱), SQLCipher (모바일 암호화 DB)
- **AI/ML**: TensorFlow, ONNX Runtime, SHAP, Grad-CAM
- **Infrastructure**: Docker, Nginx, Firebase
- **Medical Imaging**: Orthanc (DICOM 서버), CornerstoneJS (뷰어)

### 주요 엔드포인트 (요약)
- **인증**: `/api/v1/users/login/`, `/api/v1/users/register/`
- **환자**: `/api/v1/emr/patients/`
- **예약**: `/api/v1/custom/appointments/`
- **진단**: `/api/v1/custom/predictions/`
- **DICOM**: `/api/v1/orthanc/studies/`

---

## 📝 문서 작성 규칙

새로운 문서를 작성할 때는 다음 규칙을 따라주세요:

1. **파일명 규칙**:
   - 카테고리 번호 + 설명 (예: `10_django_api.md`)
   - 영문 또는 한글 사용 가능
   - 띄어쓰기는 언더스코어(`_`) 사용

2. **문서 구조**:
   - 제목, 버전, 최종 업데이트 날짜 포함
   - 목차 작성 (5개 이상 섹션일 경우)
   - 명확한 섹션 구분 (`##`, `###` 사용)

3. **카테고리 번호 체계**:
   - `00-09`: 프로젝트 개요 및 기획
   - `10-19`: 백엔드 (Django, Flask)
   - `20-29`: 데이터베이스
   - `50-59`: 프론트엔드 (React, Flutter)
   - `60-69`: Firebase 및 알림
   - `70-79`: 배포 및 운영
   - `99`: 시스템 상태 보고서

---

## 🔄 문서 업데이트 가이드

이 README.md 파일은 새로운 문서가 추가되거나 변경될 때 함께 업데이트해야 합니다.

### 업데이트 체크리스트:
- [ ] 새 문서를 적절한 카테고리 표에 추가
- [ ] 문서 구조 다이어그램 업데이트 (필요 시)
- [ ] 빠른 시작 가이드에 새 시나리오 추가 (필요 시)
- [ ] 최종 업데이트 날짜 변경

---

## 📌 최근 변경사항 (2025-12-06)

### 추가된 문서
- **54_REACT_설계_보고서.md**: React 설계 철학, 컴포넌트 분리, 상태 관리, 성능 최적화, 접근성 등 상세한 설계 가이드
- **16_DJANGO_설계_가이드.md**: Django MTV 패턴, Models, ViewSets, Serializers, 성능 최적화, 보안, 테스트 전략 등 상세한 설계 가이드
- **17_FLUTTER_설계_가이드.md**: Flutter 위젯 설계, 상태 관리(Provider), SQLCipher 데이터베이스, 보안, 성능 최적화, 접근성 등 상세한 설계 가이드

### 삭제된 문서
- `Signup_Design_Guidelines.md`: 통합된 문서로 대체
- `Code_Improvement_Checklist.md`: 개발 완료로 불필요
- `Presentation_Overview.md`: 발표 완료로 불필요
- `Project_Gap_Analysis.md`: 프로젝트 진행으로 불필요
- `ACCESSIBILITY_ISSUE_ANALYSIS.md`: 54번 문서에 통합
- `STYLE_MIGRATION_GUIDE.md`: 마이그레이션 완료로 불필요

---

## 🤝 기여 가이드

문서 개선 제안이나 오류 발견 시:
1. [GitHub Repository](https://github.com/kimhanbyul1208/NeuroNova)에 이슈 등록
2. 팀 리더에게 직접 연락

---

## 📞 연락처

문서 관련 문의:
- **GitHub**: [NeuroNova Repository](https://github.com/kimhanbyul1208/NeuroNova)
- **팀 리더**: [연락처 정보는 TEAM_ROLES.md 참조](./00_base_txt/TEAM_ROLES.md)

---

**작성자**: Claude Code
**버전**: 2.0
**최종 업데이트**: 2025-12-06
**라이선스**: NeuroNova 프로젝트 내부 문서
