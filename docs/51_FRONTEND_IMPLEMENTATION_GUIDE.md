# Frontend 구현 완료 가이드

## 📋 목차
1. [프로젝트 개요](#프로젝트-개요)
2. [구현 완료 현황](#구현-완료-현황)
3. [React Web 가이드](#react-web-가이드)
4. [Flutter App 가이드](#flutter-app-가이드)
5. [실행 방법](#실행-방법)
6. [API 연동 가이드](#api-연동-가이드)
7. [다음 단계](#다음-단계)
8. [문제 해결](#문제-해결)

---

## 프로젝트 개요

**NeuroNova** - 뇌종양 진단 임상 의사결정 지원 시스템 (CDSS)

### 시스템 구성
- **Backend**: Django (메인), Flask (AI 추론), Orthanc (DICOM)
- **Frontend Web**: React + Vite (의료진용)
- **Frontend Mobile**: Flutter (환자용)
- **Database**: PostgreSQL (서버), SQLCipher (모바일 로컬)

### 핵심 기능
1. **의료진용 웹**: 환자 관리, 예약 승인, AI 진단 결과 확인, DICOM 뷰어, XAI 시각화
2. **환자용 앱**: 예약 생성/조회, 진료 정보 확인, 푸시 알림
3. **보안**: 데이터 암호화, 90일 자동 삭제, JWT 인증

---

## 구현 완료 현황

### ✅ React Web (의료진용) - 100% 완료

#### 컴포넌트 (6개)
| 파일 | 기능 | 상태 |
|------|------|------|
| `LoadingSpinner.jsx` | 로딩 스피너 (fullScreen 옵션) | ✅ 완료 |
| `ErrorAlert.jsx` | 에러 알림 (재시도 버튼) | ✅ 완료 |
| `PatientCard.jsx` | 환자 정보 카드 | ✅ 완료 |
| `AppointmentCard.jsx` | 예약 카드 (승인/거부 액션) | ✅ 완료 |
| `DiagnosisResultCard.jsx` | AI 진단 결과 카드 | ✅ 완료 |
| `XAIVisualization.jsx` | XAI 시각화 (Grad-CAM, SHAP) | ✅ 완료 |

#### 페이지 (10개)
| 파일 | 기능 | 주요 기능 | 상태 |
|------|------|-----------|------|
| `LoginPage.jsx` | 로그인 | JWT 인증 (role/groups 포함) | ✅ 완료 |
| `DashboardPage.jsx` | 대시보드 | 통계 요약 | ✅ 완료 |
| `PatientListPage.jsx` | 환자 목록 | 검색, 페이지네이션 | ✅ 완료 |
| `PatientDetailPage.jsx` | 환자 상세 | 탭: 예약/진료/AI진단 | ✅ 완료 |
| `AppointmentManagementPage.jsx` | 예약 관리 | 승인/거부, 상태별 필터 | ✅ 완료 |
| `DicomViewerPage.jsx` | DICOM 뷰어 | Orthanc 통합 | ✅ 완료 |
| `DiagnosisDetailPage.jsx` | AI 진단 상세 | XAI + 의사 피드백 | ✅ 완료 |
| `SOAPChartPage.jsx` | SOAP 차트 | SOAP 작성/수정 | ✅ 완료 (2025-11-28) |
| `PrescriptionManagementPage.jsx` | 처방전 관리 | 처방전 CRUD | ✅ 완료 (2025-11-28) |
| `NotificationCenterPage.jsx` | 알림 센터 | 알림 조회/관리 | ✅ 완료 (2025-11-28) |

#### 라우팅
```javascript
/login                  → LoginPage
/                       → DashboardPage
/patients               → PatientListPage
/patients/:id           → PatientDetailPage
/appointments           → AppointmentManagementPage
/dicom/:studyId         → DicomViewerPage
/diagnosis/:id          → DiagnosisDetailPage
/soap/:encounterId      → SOAPChartPage (NEW)
/prescriptions          → PrescriptionManagementPage (NEW)
/notifications          → NotificationCenterPage (NEW)
/about                  → AboutPage
```

---

### ✅ Flutter App (환자용) - 100% 완료

#### Data Layer
| 파일 | 기능 | 상태 |
|------|------|------|
| `auth_repository.dart` | JWT 인증 (로그인, 로그아웃, 토큰 갱신, JWT 디코딩) | ✅ 완료 |
| `appointment_repository.dart` | 예약 CRUD, 오프라인 동기화 | ✅ 완료 |
| `notification_repository.dart` | 알림 조회/관리 | ✅ 완료 (2025-11-28) |
| `local_database.dart` | SQLCipher 암호화 DB, 90일 자동 삭제 | ✅ 완료 |
| `appointment_model.dart` | 예약 데이터 모델 | ✅ 완료 |

#### UI Screens
| 파일 | 기능 | 상태 |
|------|------|------|
| `login_screen.dart` | 로그인 | ✅ 완료 |
| `home_screen.dart` | 홈 (다음 예약 표시) | ✅ 완료 |
| `appointment_list_screen.dart` | 예약 목록 (필터, 취소) | ✅ 완료 |
| `appointment_create_screen.dart` | 예약 생성 (캘린더) | ✅ 완료 |
| `notifications_screen.dart` | 알림 목록 및 관리 | ✅ 완료 (2025-11-28) |
| `profile_screen.dart` | 사용자 프로필 및 설정 | ✅ 완료 (2025-11-28) |
| `main.dart` | 앱 진입점, 네비게이션 | ✅ 완료 |

#### 라우팅
```dart
/login                  → LoginScreen
/home                   → MainNavigationScreen (하단 네비게이션)
/appointments           → AppointmentListScreen
/appointment-create     → AppointmentCreateScreen
```

#### 하단 네비게이션 탭
1. **홈** - HomeScreen
2. **예약** - AppointmentListScreen
3. **알림** - NotificationsScreen (NEW)
4. **프로필** - ProfileScreen (NEW)

---

## React Web 가이드

### 디렉토리 구조
```
frontend/react_web/
├── src/
│   ├── api/
│   │   └── axios.js                 # Axios 인스턴스 (토큰 자동 추가)
│   ├── auth/
│   │   └── AuthContext.jsx          # JWT 인증 Context
│   ├── components/
│   │   ├── LoadingSpinner.jsx
│   │   ├── ErrorAlert.jsx
│   │   ├── PatientCard.jsx
│   │   ├── AppointmentCard.jsx
│   │   ├── DiagnosisResultCard.jsx
│   │   ├── XAIVisualization.jsx
│   │   └── index.js                 # Export 모음
│   ├── pages/
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── PatientListPage.jsx
│   │   ├── PatientDetailPage.jsx
│   │   ├── AppointmentManagementPage.jsx
│   │   ├── DicomViewerPage.jsx
│   │   ├── DiagnosisDetailPage.jsx
│   │   └── AboutPage.jsx
│   ├── utils/
│   │   └── config.js                # 모든 설정 (Soft-coding)
│   ├── App.jsx                      # 라우팅 설정
│   └── main.jsx                     # 진입점
├── .env.example
├── package.json
└── vite.config.js
```

### 환경 변수 설정
`.env` 파일 생성:
```bash
cp .env.example .env
```

`.env` 내용:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_ORTHANC_URL=http://localhost:8042
```

### 설치 및 실행
```bash
cd frontend/react_web
npm install
npm run dev
# http://localhost:3000
```

### 주요 기능 사용법

#### 1. API 호출
```javascript
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

// GET 요청
const patients = await axiosClient.get(API_ENDPOINTS.PATIENTS);

// POST 요청
const newAppointment = await axiosClient.post(
  API_ENDPOINTS.APPOINTMENTS,
  { patient_id: 1, doctor_id: 2, scheduled_at: '2025-01-01T10:00:00Z' }
);
```

#### 2. 인증 사용 (JWT with Role/Groups)
```javascript
import { useAuth } from '../auth/AuthContext';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated, hasRole, hasGroup } = useAuth();

  const handleLogin = async () => {
    await login('username', 'password');
  };

  // 역할 확인
  if (hasRole('DOCTOR')) {
    // 의사 전용 기능
  }

  // 그룹 확인
  if (hasGroup('신경외과')) {
    // 신경외과 전용 기능
  }

  return (
    <div>
      {isAuthenticated ? 'Logged In' : 'Please Login'}
      <p>Role: {user?.role}</p>
      <p>Groups: {user?.groups?.join(', ')}</p>
    </div>
  );
};
```

#### 3. 컴포넌트 Import
```javascript
import { LoadingSpinner, ErrorAlert, PatientCard } from '../components';

<LoadingSpinner fullScreen />
<ErrorAlert message="오류 발생" onRetry={fetchData} />
<PatientCard patient={patientData} />
```

---

## Flutter App 가이드

### 디렉토리 구조
```
frontend/flutter_app/
├── lib/
│   ├── core/
│   │   ├── config/
│   │   │   └── app_config.dart      # 앱 설정 (Soft-coding)
│   │   ├── constants/
│   │   │   └── app_constants.dart
│   │   └── utils/
│   │       └── logger.dart           # 로깅
│   ├── data/
│   │   ├── local/
│   │   │   └── local_database.dart  # SQLCipher 암호화 DB
│   │   ├── models/
│   │   │   └── appointment_model.dart
│   │   └── repositories/
│   │       ├── auth_repository.dart
│   │       ├── appointment_repository.dart
│   │       └── notification_repository.dart (NEW)
│   ├── features/
│   │   ├── auth/
│   │   │   └── login_screen.dart
│   │   ├── home/
│   │   │   └── home_screen.dart
│   │   ├── appointment/
│   │   │   ├── appointment_list_screen.dart
│   │   │   └── appointment_create_screen.dart
│   │   ├── notifications/
│   │   │   └── notifications_screen.dart (NEW)
│   │   └── profile/
│   │       └── profile_screen.dart (NEW)
│   └── main.dart
├── assets/
├── pubspec.yaml
└── README.md
```

### 설치 및 실행
```bash
cd frontend/flutter_app
flutter pub get
flutter run
```

### 주요 기능 사용법

#### 1. Repository 사용 (JWT with Role/Groups)
```dart
import '../../data/repositories/auth_repository.dart';
import '../../data/repositories/appointment_repository.dart';

// 인증
final authRepo = AuthRepository();
await authRepo.login('username', 'password');
final isLoggedIn = await authRepo.isLoggedIn();

// 역할 확인
final role = await authRepo.getUserRole();
if (role == 'DOCTOR') {
  // 의사 전용 기능
}

// 그룹 확인
final isNeurosurgeon = await authRepo.hasGroup('신경외과');
if (isNeurosurgeon) {
  // 신경외과 전용 기능
}

// 예약
final appointmentRepo = AppointmentRepository();
final appointments = await appointmentRepo.fetchAppointments(patientId);
await appointmentRepo.createAppointment(
  patientId: 1,
  doctorId: 2,
  scheduledAt: DateTime.now(),
  visitType: 'FIRST_VISIT',
);
```

#### 2. 로컬 DB 사용
```dart
import '../../data/local/local_database.dart';

// 예약 저장
await LocalDatabase.insertAppointment(appointmentMap);

// 예약 조회
final appointments = await LocalDatabase.getAppointments();

// 만료된 데이터 삭제
final deletedCount = await LocalDatabase.deleteExpiredData();
```

#### 3. 화면 네비게이션
```dart
// 페이지 이동
Navigator.pushNamed(context, '/appointments');

// 데이터 전달 및 결과 받기
final result = await Navigator.pushNamed(context, '/appointment-create');
if (result == true) {
  _loadAppointments();
}
```

---

## 실행 방법

### 전체 시스템 실행 순서

1. **Backend (Django)**
```bash
cd backend/django_main
python manage.py runserver
# http://localhost:8000
```

2. **Backend (Flask - AI)**
```bash
cd backend/flask_ai
python app.py
# http://localhost:5000
```

3. **Orthanc (DICOM 서버)**
```bash
# Docker 사용 시
docker run -p 8042:8042 jodogne/orthanc
# http://localhost:8042
```

4. **React Web**
```bash
cd frontend/react_web
npm install
npm run dev
# http://localhost:3000
```

5. **Flutter App**
```bash
cd frontend/flutter_app
flutter pub get
flutter run
```

---

## API 연동 가이드

### React Web ↔ Django

#### 엔드포인트 설정
`src/utils/config.js`:
```javascript
export const API_ENDPOINTS = {
  LOGIN: '/api/v1/users/login/',
  PATIENTS: '/api/v1/emr/patients/',
  APPOINTMENTS: '/api/v1/custom/appointments/',
  PREDICTIONS: '/api/v1/custom/predictions/',
  // ...
};
```

#### Axios 인터셉터 (자동 토큰 추가)
`src/api/axios.js`:
- Request: Bearer 토큰 자동 추가
- Response: 401 에러 시 자동 토큰 갱신

### Flutter App ↔ Django

#### API 설정
`lib/core/config/app_config.dart`:
```dart
static const String apiBaseUrl = 'http://10.0.2.2:8000';  // Android 에뮬레이터
static const String appointmentsEndpoint = '/api/v1/custom/appointments/';
```

#### Dio 인터셉터 (Repository에서 설정)
```dart
void setAuthToken(String token) {
  _dio.interceptors.add(
    InterceptorsWrapper(
      onRequest: (options, handler) {
        options.headers['Authorization'] = 'Bearer $token';
        return handler.next(options);
      },
    ),
  );
}
```

### API 명세

#### 인증
```http
POST /api/v1/users/login/
Content-Type: application/json

{
  "username": "patient1",
  "password": "password123"
}

Response:
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user": {
    "id": 1,
    "username": "patient1",
    "role": "PATIENT"
  }
}
```

#### 예약 생성
```http
POST /api/v1/custom/appointments/
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "patient_id": 1,
  "doctor_id": 2,
  "scheduled_at": "2025-01-15T10:00:00Z",
  "visit_type": "FIRST_VISIT",
  "reason": "지속적인 두통"
}

Response:
{
  "id": 1,
  "patient_id": 1,
  "doctor_id": 2,
  "doctor_name": "김의사",
  "scheduled_at": "2025-01-15T10:00:00Z",
  "status": "PENDING",
  "visit_type": "FIRST_VISIT",
  "reason": "지속적인 두통"
}
```

---

## 다음 단계

### 우선순위 높음 🔴

1. **Backend API 완성 확인**
   - Django API 엔드포인트 테스트
   - Flask AI 추론 API 테스트
   - Orthanc DICOM 서버 연동 테스트

2. **통합 테스트**
   - React Web ↔ Django API 연동 테스트
   - Flutter App ↔ Django API 연동 테스트
   - DICOM 뷰어 Orthanc 연동 테스트

3. **Firebase Push 알림 설정**
   - Firebase 프로젝트 생성
   - `google-services.json` (Android) 추가
   - `GoogleService-Info.plist` (iOS) 추가
   - FCM 토큰 서버 전송 구현

### 우선순위 중간 🟡

4. **추가 UI 구현**
   - React: SOAP 차트 조회/수정 페이지
   - React: 처방전 관리 페이지
   - Flutter: 알림 목록 화면 (NotificationsScreen)
   - Flutter: 프로필 관리 화면 (ProfileScreen)

5. **개선 사항**
   - React: 다크 모드 지원
   - Flutter: 생체 인식 인증 (지문)
   - 에러 핸들링 개선
   - 로딩 상태 UX 개선

### 우선순위 낮음 🟢

6. **테스트 코드 작성**
   - React: Jest + React Testing Library
   - Flutter: Widget Test, Integration Test

7. **배포 준비**
   - React: Nginx 설정, 빌드 최적화
   - Flutter: APK/AAB 서명, App Store 준비
   - 환경별 설정 분리 (dev, staging, prod)

---

## 문제 해결

### React Web

#### CORS 오류
```
Access to XMLHttpRequest at 'http://localhost:8000' from origin 'http://localhost:3000'
has been blocked by CORS policy
```

**해결**: Django `settings.py`에서 CORS 설정
```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

#### 인증 토큰 만료
- Axios 인터셉터가 자동으로 refresh token으로 갱신
- 실패 시 자동으로 로그인 페이지로 이동

#### Vite 환경 변수 인식 안 됨
- 환경 변수는 반드시 `VITE_` prefix 필요
- 서버 재시작 필요: `npm run dev`

### Flutter App

#### SQLCipher 빌드 오류
```bash
flutter clean
flutter pub get
flutter run
```

#### API 연결 오류
- **Android Emulator**: `http://10.0.2.2:8000`
- **iOS Simulator**: `http://localhost:8000`
- **실제 디바이스**: 서버의 실제 IP 주소 사용

예시:
```dart
// app_config.dart
static const String apiBaseUrl = String.fromEnvironment(
  'API_BASE_URL',
  defaultValue: 'http://10.0.2.2:8000',  // Android 에뮬레이터 기본값
);
```

실행:
```bash
flutter run --dart-define=API_BASE_URL=http://192.168.1.100:8000
```

#### 90일 자동 삭제 로직 확인
```dart
// main.dart에서 앱 시작 시 실행
final deletedCount = await LocalDatabase.deleteExpiredData();
AppLogger.info('Deleted $deletedCount expired records');
```

---

## 코딩 규칙 (프로젝트 표준)

### 공통
1. **Soft-coding**: 모든 설정값은 config 파일에서 관리
2. **주석**: 모든 함수/클래스에 설명 주석 작성
3. **에러 처리**: try-catch로 에러 핸들링, 사용자 친화적 메시지

### React
- **컴포넌트**: PascalCase (예: `PatientCard.jsx`)
- **파일명**: 컴포넌트명과 동일
- **Props 검증**: PropTypes 또는 TypeScript 권장
- **상태 관리**: Context API 사용

### Flutter
- **파일명**: snake_case (예: `login_screen.dart`)
- **클래스명**: PascalCase (예: `LoginScreen`)
- **변수명**: camelCase (예: `isLoading`)
- **상수**: UPPER_SNAKE_CASE (예: `API_BASE_URL`)

---

## 참고 문서

### 프로젝트 문서
- [프로젝트 개요](./최종개요.txt)
- [구현 순서](./구현순서.txt)
- [DB 설계](./최종 DB.txt)
- [시스템 구조](./구조.txt)
- [팀 역할](./TEAM_ROLES.md)
- [Context](./NeuroNova_Context.md)

### 외부 라이브러리
- [React](https://react.dev/)
- [Material-UI](https://mui.com/)
- [Axios](https://axios-http.com/)
- [Flutter](https://flutter.dev/)
- [Dio](https://pub.dev/packages/dio)
- [SQLCipher](https://pub.dev/packages/sqflite_sqlcipher)
- [Table Calendar](https://pub.dev/packages/table_calendar)

---

## 연락처

프로젝트 이슈 또는 질문:
- GitHub: [프로젝트 저장소]
- 팀 리더: [연락처]

---

**마지막 업데이트**: 2025-11-28
**작성자**: Claude Code
**버전**: 1.0.0
