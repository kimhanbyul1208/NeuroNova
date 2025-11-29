# Django-React API 연동 문서

**작성일**: 2025-11-29  
**버전**: 1.0

---

## 📋 목차

1. [API 기본 설정](#api-기본-설정)
2. [인증 API](#인증-api)
3. [사용자 관리 API](#사용자-관리-api)
4. [EMR (전자의무기록) API](#emr-전자의무기록-api)
5. [Custom (NeuroNova 핵심) API](#custom-neuronova-핵심-api)
6. [Orthanc DICOM API](#orthanc-dicom-api)
7. [알림 API](#알림-api)
8. [문제 해결](#문제-해결)

---

## API 기본 설정

### Base URL

```javascript
// React - src/utils/config.js
API_CONFIG.BASE_URL = 'http://localhost:8000'
API_CONFIG.API_VERSION = 'v1'
```

### 인증 헤더

모든 보호된 엔드포인트는 JWT 토큰이 필요합니다:

```
Authorization: Bearer <access_token>
```

React의 `axiosClient`가 자동으로 추가합니다.

---

## 인증 API

### 1. 로그인

**엔드포인트**: `POST /api/v1/users/login/`

**React 설정**:
```javascript
// config.js
LOGIN: `/api/v1/users/login/`
```

**Request**:
```json
{
  "username": "doctor1",
  "password": "test1234"
}
// AuthContext.jsx - line 57
```

---

### 2. 토큰 갱신

**엔드포인트**: `POST /api/v1/users/refresh/`

**React 설정**:
```javascript
// config.js
REFRESH_TOKEN: `/api/v1/users/refresh/`
```

**Request**:
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Response**:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**자동 처리**: `axios.js` 인터셉터가 401 에러 시 자동 갱신

---

### 3. 회원가입

**엔드포인트**: `POST /api/v1/users/register/`

**React 설정**:
```javascript
// config.js
REGISTER: `/api/v1/users/register/`
```

**Request**:
```json
{
  "username": "testdoctor",
  "email": "doctor@neuronova.com",
  "password": "SecurePass123!",
  "password_confirm": "SecurePass123!",
  "first_name": "홍",
  "last_name": "길동",
  "role": "DOCTOR",
  "phone_number": "010-1234-5678"
}
```

**Response**:
```json
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "testdoctor",
    "email": "doctor@neuronova.com"
  }
}
```

**사용 예시** (React):
```javascript
// RegisterPage.jsx - line 73
await axiosClient.post(API_ENDPOINTS.REGISTER, formData);
```

---

## 사용자 관리 API

### 1. 현재 사용자 프로필 조회

**엔드포인트**: `GET /api/v1/users/profiles/me/`

**React 설정**:
```javascript
// config.js
ME: `/api/v1/users/profiles/me/`
```

**Response**:
```json
{
  "id": 1,
  "user": {
    "id": 1,
    "username": "doctor1",
    "email": "doctor@neuronova.com",
    "first_name": "홍",
    "last_name": "김"
  },
  "role": "DOCTOR",
  "phone_number": "010-1234-5678",
  "fcm_token": "firebase_token..."
}
```

**사용 예시** (React):
```javascript
// AuthContext.jsx - line 37, 69
const response = await axiosClient.get(API_ENDPOINTS.ME);
```

---

### 2. 사용자 목록 조회

**엔드포인트**: `GET /api/v1/users/users/`

**React 설정**:
```javascript
// config.js
USERS: `/api/v1/users/users/`
```

**Django ViewSet**: `UserViewSet` (read-only)

---

### 3. 프로필 목록 조회

**엔드포인트**: `GET /api/v1/users/profiles/`

**React 설정**:
```javascript
// config.js
USER_PROFILES: `/api/v1/users/profiles/`
```

**Django ViewSet**: `UserProfileViewSet`

---

## EMR (전자의무기록) API

### 1. 환자 관리

**Base URL**: `/api/v1/emr/patients/`

**React 설정**:
```javascript
// config.js
PATIENTS: `/api/v1/emr/patients/`
PATIENT_DETAIL: (id) => `/api/v1/emr/patients/${id}/`
```

**Django ViewSet**: `PatientViewSet`

**주요 엔드포인트**:

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v1/emr/patients/` | 환자 목록 |
| POST | `/api/v1/emr/patients/` | 환자 생성 |
| GET | `/api/v1/emr/patients/{id}/` | 환자 상세 |
| GET | `/api/v1/emr/patients/{id}/encounters/` | 환자의 모든 진료 기록 |
| GET | `/api/v1/emr/patients/{id}/medical_history/` | 통합 병력 조회 |

**사용 예시** (React):
```javascript
// PatientListPage.jsx - line 35
const response = await axiosClient.get(API_ENDPOINTS.PATIENTS);

// PatientDetailPage.jsx - line 47
await axiosClient.get(`${API_ENDPOINTS.PATIENTS}${id}/`)
```

**Response 예시** (환자 목록):
```json
[
  {
    "id": 1,
    "pid": "PT-2025-001",
    "first_name": "홍",
    "last_name": "길동",
    "date_of_birth": "1990-01-01",
    "gender": "MALE",
    "phone": "010-1234-5678",
    "address": "서울시 강남구...",
    "created_at": "2025-11-29T10:00:00Z"
  }
]
```

---

### 2. 진료 기록 (Encounter)

**Base URL**: `/api/v1/emr/encounters/`

**React 설정**:
```javascript
// config.js
ENCOUNTERS: `/api/v1/emr/encounters/`
```

**Django ViewSet**: `EncounterViewSet`

**주요 엔드포인트**:

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v1/emr/encounters/` | 진료 기록 목록 |
| POST | `/api/v1/emr/encounters/` | 진료 기록 생성 |
| GET | `/api/v1/emr/encounters/{id}/` | 진료 기록 상세 (SOAP + Vitals 포함) |

**사용 예시** (React):
```javascript
// PatientDetailPage.jsx - line 48
await axiosClient.get(`${API_ENDPOINTS.ENCOUNTERS}?patient_id=${id}`)
```

---

### 3. SOAP 차트

**Base URL**: `/api/v1/emr/soap/`

**React 설정**:
```javascript
// config.js
SOAP_CHARTS: `/api/v1/emr/soap/`
```

**Django ViewSet**: `FormSOAPViewSet`

**주요 엔드포인트**:

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v1/emr/soap/` | SOAP 차트 목록 |
| POST | `/api/v1/emr/soap/` | SOAP 차트 생성 |
| PUT | `/api/v1/emr/soap/{id}/` | SOAP 차트 업데이트 |

**사용 예시** (React):
```javascript
// SOAPChartPage.jsx - line 51, 90
const response = await axiosClient.get(`${API_ENDPOINTS.SOAP_CHARTS}?encounter_id=${encounterId}`);
await axiosClient.post(API_ENDPOINTS.SOAP_CHARTS, soapData);
```

---

### 4. 활력 징후 (Vitals)

**Base URL**: `/api/v1/emr/vitals/`

**React 설정**:
```javascript
// config.js
VITALS: `/api/v1/emr/vitals/`
```

**Django ViewSet**: `FormVitalsViewSet`

---

### 5. 통합 문서 (Merged Documents)

**Base URL**: `/api/v1/emr/documents/`

**React 설정**:
```javascript
// config.js
DOCUMENTS: `/api/v1/emr/documents/`
```

**Django ViewSet**: `MergedDocumentViewSet`

---

## Custom (NeuroNova 핵심) API

### 1. 예약 관리 (Appointments)

**Base URL**: `/api/v1/custom/appointments/`

**React 설정**:
```javascript
// config.js
APPOINTMENTS: `/api/v1/custom/appointments/`
```

**Django ViewSet**: `AppointmentViewSet`

**주요 엔드포인트**:

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v1/custom/appointments/` | 예약 목록 |
| POST | `/api/v1/custom/appointments/` | 예약 생성 |
| POST | `/api/v1/custom/appointments/{id}/confirm/` | 예약 확인 |
| POST | `/api/v1/custom/appointments/{id}/cancel/` | 예약 취소 |

**사용 예시** (React):
```javascript
// AppointmentManagementPage.jsx - line 33
const response = await axiosClient.get(API_ENDPOINTS.APPOINTMENTS);

// line 50 - 예약 확인
await axiosClient.patch(`${API_ENDPOINTS.APPOINTMENTS}${appointmentId}/`, {
  status: 'CONFIRMED'
});
```

**Response 예시**:
```json
{
  "id": 1,
  "patient": {
    "id": 1,
    "full_name": "홍길동"
  },
  "doctor": {
    "id": 1,
    "user": {
      "full_name": "김의사"
    }
  },
  "scheduled_at": "2025-12-01T10:00:00Z",
  "status": "PENDING",
  "visit_type": "CHECKUP",
  "reason": "정기 검진"
}
```

---

### 2. AI 진단 결과 (Predictions)

**Base URL**: `/api/v1/custom/predictions/`

**React 설정**:
```javascript
// config.js
PREDICTIONS: `/api/v1/custom/predictions/`
```

**Django ViewSet**: `PatientPredictionResultViewSet`

**주요 엔드포인트**:

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v1/custom/predictions/` | AI 진단 결과 목록 |
| GET | `/api/v1/custom/predictions/{id}/` | AI 진단 결과 상세 |
| POST | `/api/v1/custom/predictions/{id}/confirm_prediction/` | 의사 피드백 (Human-in-the-loop) |
| GET | `/api/v1/custom/predictions/pending_review/` | 검증 대기 목록 |

**사용 예시** (React):
```javascript
// DiagnosisDetailPage.jsx - line 47
const response = await axiosClient.get(`${API_ENDPOINTS.PREDICTIONS}${id}/`);

// line 65 - 의사 피드백
await axiosClient.patch(`${API_ENDPOINTS.PREDICTIONS}${id}/`, {
  doctor_feedback: 'CORRECT',
  doctor_note: '진단 결과가 정확합니다'
});
```

**Response 예시**:
```json
{
  "id": 1,
  "patient": {
    "id": 1,
    "full_name": "홍길동"
  },
  "encounter": 1,
  "model_name": "ResNet50_v2",
  "model_version": "1.0.0",
  "prediction_class": "MENINGIOMA",
  "confidence_score": 0.94,
  "orthanc_study_uid": "1.2.840.113...",
  "xai_image_path": "/media/xai/gradcam_123.png",
  "doctor_feedback": "CORRECT",
  "confirmed_at": "2025-11-29T15:30:00Z"
}
```

---

### 3. 처방전 관리 (Prescriptions)

**Base URL**: `/api/v1/custom/prescriptions/`

**React 설정**:
```javascript
// config.js
PRESCRIPTIONS: `/api/v1/custom/prescriptions/`
```

**Django ViewSet**: `PrescriptionViewSet`

**사용 예시** (React):
```javascript
// PrescriptionManagementPage.jsx - line 68
const response = await axiosClient.get(API_ENDPOINTS.PRESCRIPTIONS);

// line 117 - 처방전 생성
await axiosClient.post(API_ENDPOINTS.PRESCRIPTIONS, formData);
```

---

### 4. 의사 관리 (Doctors)

**Base URL**: `/api/v1/custom/doctors/`

**Django ViewSet**: `DoctorViewSet`

---

## Orthanc DICOM API

**Base URL**: `/api/v1/orthanc/`

모든 Orthanc API는 `apps/core/urls.py`에 정의되어 있습니다.

**주요 엔드포인트**:

| Method | URL | 설명 |
|--------|-----|------|
| GET | `/api/v1/orthanc/studies/{study_uid}/` | Study 조회 |
| GET | `/api/v1/orthanc/series/{series_uid}/` | Series 조회 |
| GET | `/api/v1/orthanc/instances/{instance_id}/preview/` | 이미지 프리뷰 |
| GET | `/api/v1/orthanc/instances/{instance_id}/file/` | DICOM 파일 다운로드 |
| GET | `/api/v1/orthanc/patients/{patient_id}/studies/` | 환자 Study 목록 |
| POST | `/api/v1/orthanc/upload/` | DICOM 파일 업로드 |
| GET | `/api/v1/orthanc/statistics/` | 서버 통계 |

**Django Service**: `OrthancService` (Singleton Pattern)

---

## 알림 API

**Base URL**: `/api/v1/notifications/`

**React 설정**:
```javascript
// config.js
NOTIFICATIONS: `/api/v1/notifications/`
```

**사용 예시** (React):
```javascript
// NotificationCenterPage.jsx - line 47
const response = await axiosClient.get(API_ENDPOINTS.NOTIFICATIONS);

// line 58 - 읽음 처리
await axiosClient.patch(`${API_ENDPOINTS.NOTIFICATIONS}${id}/`, {
  is_read: true
});
```

---

## ✅ 수정된 사항 (2025-11-29)

### 1. API 엔드포인트 수정

**이전**:
```javascript
LOGIN: '/api/auth/token/'
REGISTER: '/api/auth/register/'
ME: '/api/auth/me/'
```

**현재** (✅ 수정됨):
```javascript
LOGIN: `/api/v1/users/login/`
REGISTER: `/api/v1/users/register/`
ME: `/api/v1/users/profiles/me/`
REFRESH_TOKEN: `/api/v1/users/refresh/`
```

### 2. Django 백엔드 수정

**추가된 엔드포인트**:
1. ✅ `POST /api/v1/users/register/` - 회원가입
2. ✅ `GET /api/v1/users/profiles/me/` - 현재 사용자 프로필

**수정된 파일**:
- ✅ `apps/users/views.py` - `UserProfileViewSet.me()` action 추가
- ✅ `apps/users/urls.py` - `register/` 경로 추가
- ✅ `apps/emr/urls.py` - ViewSet 등록 (patients, encounters, soap, vitals, documents)
- ✅ `apps/custom/urls.py` - ViewSet 등록 (doctors, appointments, predictions, prescriptions)

### 3. React 프론트엔드 수정

**수정된 파일**:
- ✅ `config.js` - API 엔드포인트 전체 업데이트
- ✅ `axios.js` - 토큰 갱신 경로 수정
- ✅ `AuthContext.jsx` - 사용자 프로필 조회 수정, 에러 메시지 한국어화
- ✅ `LoginPage.jsx` - 완전히 재설계 (modern UI)
- ✅ `RegisterPage.jsx` - API 엔드포인트 수정, 역할 옵션 수정 (DOCTOR, NURSE, ADMIN)
- ✅ `HomePage.jsx` - 신규 생성 (랜딩 페이지)

---

## 문제 해결

### 1. 404 Not Found 오류

**증상**: API 호출 시 404 에러

**원인**: 
- ViewSet이 router에 등록되지 않음
- URL 경로 불일치

**해결**:
```python
# urls.py에 ViewSet 등록 확인
router.register(r'patients', views.PatientViewSet)
```

### 2. 401 Unauthorized 오류

**증상**: 인증이 필요한 API 호출 시 401 에러

**원인**: 
- JWT 토큰이 만료됨
- 토큰이 localStorage에 없음

**해결**:
- `axios.js` 인터셉터가 자동으로 토큰 갱신
- 실패 시 로그인 페이지로 리다이렉트

### 3. CORS 오류

**증상**: `Access-Control-Allow-Origin` 에러

**해결**:
```python
# Django settings.py
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
```

---

## 📝 참고 사항

### API 버전 관리

현재 API 버전: `v1`

**변경 시 수정 필요**:
1. `frontend/react_web/src/utils/config.js` - `API_CONFIG.API_VERSION`
2. `backend/django_main/neuronova/settings.py` - `API_VERSION`

### 역할 (Roles)

```python
ADMIN = 'ADMIN'    # 모든 권한
DOCTOR = 'DOCTOR'  # 의료진 권한
NURSE = 'NURSE'    # 간호사 권한
PATIENT = 'PATIENT' # 환자 권한 (읽기만 가능)
```

### 예약 상태 (Appointment Status)

```python
PENDING = 'PENDING'        # 대기 중
CONFIRMED = 'CONFIRMED'    # 확인됨
CANCELLED = 'CANCELLED'    # 취소됨
NO_SHOW = 'NO_SHOW'       # 노쇼
COMPLETED = 'COMPLETED'    # 완료
```

---

**문서 작성일**: 2025-11-29  
**마지막 업데이트**: Django와 React API 완전히 동기화됨 ✅
