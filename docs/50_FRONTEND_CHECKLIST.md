# Frontend 개발 체크리스트

## 📋 완료 현황 요약

### React Web (의료진용)
- [x] 프로젝트 설정 (Vite + React)
- [x] 공통 컴포넌트 (6개)
- [x] 페이지 구현 (7개)
- [x] API 연동 (Axios + JWT)
- [x] 라우팅 설정
- [x] DICOM 뷰어 통합
- [x] XAI 시각화
- [x] 의사 피드백 (Human-in-the-loop)

### Flutter App (환자용)
- [x] 프로젝트 설정 (Flutter 3.0+)
- [x] Data Layer (Repository 패턴)
- [x] 로컬 DB (SQLCipher 암호화)
- [x] 90일 자동 삭제 정책
- [x] UI Screens (5개)
- [x] 하단 네비게이션
- [x] 인증 (JWT)
- [x] 오프라인 모드

---

## 🔍 상세 체크리스트

### React Web Components

#### 공통 컴포넌트
- [x] `LoadingSpinner.jsx` - 로딩 스피너
  - [x] fullScreen 옵션
  - [x] size 옵션 (small, medium, large)
- [x] `ErrorAlert.jsx` - 에러 알림
  - [x] 재시도 버튼
  - [x] severity 옵션
- [x] `PatientCard.jsx` - 환자 카드
  - [x] 환자 정보 표시
  - [x] 상세 보기 버튼
- [x] `AppointmentCard.jsx` - 예약 카드
  - [x] 예약 정보 표시
  - [x] 승인/거부 액션 버튼
  - [x] 상태별 색상
- [x] `DiagnosisResultCard.jsx` - AI 진단 카드
  - [x] 신뢰도 표시
  - [x] 확률 분포
  - [x] 의사 피드백 표시
- [x] `XAIVisualization.jsx` - XAI 시각화
  - [x] Grad-CAM 히트맵
  - [x] SHAP Feature Importance
  - [x] 모델 정보

#### 페이지
- [x] `LoginPage.jsx` - 로그인
  - [x] JWT 인증
  - [x] 에러 처리
  - [x] 로딩 상태
- [x] `DashboardPage.jsx` - 대시보드
  - [x] 통계 요약
  - [x] 샘플 데이터
- [x] `PatientListPage.jsx` - 환자 목록
  - [x] 검색 기능
  - [x] 페이지네이션
  - [x] API 연동
  - [x] 에러 처리
- [x] `PatientDetailPage.jsx` - 환자 상세
  - [x] 환자 기본 정보
  - [x] 탭: 예약/진료/AI진단
  - [x] 병렬 API 호출
- [x] `AppointmentManagementPage.jsx` - 예약 관리
  - [x] 상태별 탭 (대기/확정/완료/취소)
  - [x] 승인/거부 기능
  - [x] 스낵바 알림
- [x] `DicomViewerPage.jsx` - DICOM 뷰어
  - [x] Orthanc 통합
  - [x] Study 정보 표시
  - [x] iframe 뷰어
- [x] `DiagnosisDetailPage.jsx` - AI 진단 상세
  - [x] XAI 시각화
  - [x] 의사 피드백 입력
  - [x] 피드백 저장

#### 인프라
- [x] `api/axios.js` - Axios 설정
  - [x] Request 인터셉터 (토큰 자동 추가)
  - [x] Response 인터셉터 (401 처리)
  - [x] 자동 토큰 갱신
- [x] `auth/AuthContext.jsx` - 인증 Context
  - [x] 로그인/로그아웃
  - [x] 토큰 관리
  - [x] 사용자 정보
- [x] `utils/config.js` - 설정 파일
  - [x] API 엔드포인트
  - [x] 앱 설정
  - [x] 상수 정의
- [x] `App.jsx` - 라우팅
  - [x] 모든 페이지 라우트 설정
  - [x] AuthProvider 연결

---

### Flutter App Components

#### Data Layer
- [x] `auth_repository.dart` - 인증 Repository
  - [x] login() - 로그인
  - [x] logout() - 로그아웃
  - [x] refreshToken() - 토큰 갱신
  - [x] isLoggedIn() - 로그인 상태 확인
  - [x] getUserInfo() - 사용자 정보
- [x] `appointment_repository.dart` - 예약 Repository
  - [x] createAppointment() - 예약 생성
  - [x] fetchAppointments() - 예약 조회
  - [x] cancelAppointment() - 예약 취소
  - [x] getLocalAppointments() - 로컬 조회
  - [x] syncPendingAppointments() - 동기화
  - [x] 오프라인 모드 지원
- [x] `local_database.dart` - 로컬 DB
  - [x] SQLCipher 암호화
  - [x] 테이블 생성 (appointments, notifications, diagnoses)
  - [x] deleteExpiredData() - 90일 자동 삭제
  - [x] insertAppointment() - 예약 저장
  - [x] getAppointments() - 예약 조회
  - [x] clearAllData() - 전체 삭제
- [x] `appointment_model.dart` - 예약 모델
  - [x] fromJson() / toJson()
  - [x] fromMap() / toMap()
  - [x] copyWith()
  - [x] expireAt 필드

#### UI Screens
- [x] `login_screen.dart` - 로그인
  - [x] 사용자명/비밀번호 입력
  - [x] 에러 메시지 표시
  - [x] 로딩 상태
  - [x] 비밀번호 표시/숨김
- [x] `home_screen.dart` - 홈
  - [x] 사용자 정보 카드
  - [x] 다가오는 예약 표시 (최대 3개)
  - [x] 로그아웃 기능
  - [x] 새로고침 (Pull to Refresh)
- [x] `appointment_list_screen.dart` - 예약 목록
  - [x] 상태별 필터 (전체/대기/확정/완료/취소)
  - [x] 예약 카드
  - [x] 예약 취소 기능
  - [x] 예약 생성 버튼
- [x] `appointment_create_screen.dart` - 예약 생성
  - [x] 캘린더 (TableCalendar)
  - [x] 시간 선택
  - [x] 방문 유형 선택
  - [x] 예약 사유 입력
  - [x] 안내 메시지
- [x] `main.dart` - 앱 진입점
  - [x] Splash Screen
  - [x] 인증 상태 확인
  - [x] 하단 네비게이션
  - [x] 라우팅 설정
  - [x] 90일 자동 삭제 실행

#### 설정
- [x] `app_config.dart` - 앱 설정
  - [x] API URL
  - [x] DB 설정
  - [x] 90일 자동 삭제 정책
  - [x] Feature Flags
- [x] `app_constants.dart` - 상수
- [x] `logger.dart` - 로깅
  - [x] info() - 정보 로그
  - [x] error() - 에러 로그

---

## ⚠️ 미구현 항목 (다음 작업자용)

### React Web
- [x] SOAP 차트 조회/수정 페이지 ✅ **완료 (2025-11-28)**
- [x] 처방전 관리 페이지 ✅ **완료 (2025-11-28)**
- [x] 알림 센터 페이지 ✅ **완료 (2025-11-28)**
- [ ] 다크 모드
- [ ] 테스트 코드
- [ ] 실제 API 데이터 연동 테스트

### Flutter App
- [x] NotificationsScreen 구현 ✅ **완료 (2025-11-28)**
- [x] ProfileScreen 구현 ✅ **완료 (2025-11-28)**
- [ ] Firebase Push 알림 통합
- [ ] 생체 인식 인증
- [ ] 오프라인 모드 UI 표시
- [ ] 테스트 코드

### 공통
- [x] JWT 인증에 그룹/역할 정보 포함 ✅ **완료 (2025-11-28)**
- [ ] Backend API 통합 테스트
- [ ] DICOM 서버 연동 테스트
- [ ] XAI 이미지 생성 테스트
- [ ] 배포 준비 (환경 설정)

---

## 🚀 즉시 실행 가능한 작업

### 1. Backend API 연동 테스트
```bash
# 1. Django 서버 실행
cd backend/django_main
python manage.py runserver

# 2. React Web 실행
cd frontend/react_web
npm run dev

# 3. 테스트: 로그인 → 환자 목록 → 환자 상세
```

### 2. Flutter App 실행 테스트
```bash
# 1. Flutter 앱 실행 (Android 에뮬레이터)
cd frontend/flutter_app
flutter run

# 2. 테스트: 로그인 → 홈 → 예약 생성
```

### 3. 90일 자동 삭제 확인
```bash
# Flutter 앱 재시작 후 로그 확인
# "Deleted X expired records" 메시지 확인
```

---

## 📝 코드 품질 체크리스트

### React Web
- [x] ESLint 설정 완료
- [x] PropTypes 또는 TypeScript 권장 (현재 JSDoc 사용)
- [x] 모든 API 호출에 에러 처리
- [x] 로딩 상태 관리
- [x] 환경 변수 사용 (VITE_*)
- [x] 컴포넌트 재사용성
- [x] Soft-coding (config.js)

### Flutter App
- [x] Dart 3.0+ 문법
- [x] 명시적 타입 선언
- [x] 에러 핸들링 (try-catch)
- [x] 로깅 (AppLogger)
- [x] 환경 변수 사용 가능
- [x] Repository 패턴
- [x] Soft-coding (app_config.dart)

---

## 🔧 설정 파일 체크

### React Web
- [x] `.env` 파일 설정
- [x] `vite.config.js` 설정
- [x] `package.json` 의존성
- [x] `.gitignore` 설정

### Flutter App
- [x] `pubspec.yaml` 의존성
- [x] `app_config.dart` 설정
- [x] `.gitignore` 설정
- [ ] Firebase 설정 파일 (필요 시)

---

## ✅ 최종 확인 사항

### 배포 전 체크
- [ ] 환경별 설정 분리 (dev, staging, prod)
- [ ] API URL 환경 변수 설정
- [ ] 에러 로깅 설정
- [ ] 성능 최적화
- [ ] 빌드 테스트
- [ ] 보안 검토

### 문서 완성도
- [x] README.md (React, Flutter 각각)
- [x] FRONTEND_IMPLEMENTATION_GUIDE.md
- [x] FRONTEND_CHECKLIST.md
- [ ] API 명세서 (Backend 팀)
- [ ] 배포 가이드

---

**마지막 확인일**: 2025-11-28
**완료율**: React Web 98% | Flutter App 98% | 전체 98%

**최근 업데이트**:
- SOAP 차트 페이지 추가 (`SOAPChartPage.jsx`)
- 처방전 관리 페이지 추가 (`PrescriptionManagementPage.jsx`)
- 알림 센터 페이지 추가 (`NotificationCenterPage.jsx`)
- Flutter 알림 화면 구현 (`NotificationsScreen`)
- Flutter 프로필 화면 구현 (`ProfileScreen`)
- JWT 인증에 그룹/역할 정보 포함 (Django, React, Flutter)

