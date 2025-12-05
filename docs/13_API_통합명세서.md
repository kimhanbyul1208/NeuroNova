# NeuroNova API 통합 명세서

**버전**: 2.0
**최종 업데이트**: 2025-12-05
**Base URL**: `/api/v1/`
**인증 (Auth)**: Bearer Token (JWT)

---

## 📋 목차

1. [인증 (Authentication)](#-authentication)
2. [사용자 및 프로필 (Users & Profiles)](#-users--profiles)
3. [EMR (전자의무기록)](#-emr-electronic-medical-records)
4. [커스텀 기능 (NeuroNova 전용)](#-custom-features-neuronova-specific)
5. [알림 (Notifications)](#-notifications)
6. [Orthanc (DICOM 통합)](#%EF%B8%8F-orthanc-dicom-integration)
7. [Flask AI 서버](#-flask-ai-server)

---

## 🔐 Authentication

### 로그인 (Login)
- **URL**: `/api/v1/users/login/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "doctor_0001",
    "password": "testpass123"
  }
  ```
- **Response**:
  ```json
  {
    "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc...",
    "user": {
      "id": 1,
      "username": "doctor_0001",
      "role": "DOCTOR",
      "groups": ["신경외과"]
    }
  }
  ```

### 토큰 갱신 (Refresh Token)
- **URL**: `/api/v1/users/refresh/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
  }
  ```
- **Response**:
  ```json
  {
    "access": "new_access_token..."
  }
  ```

---

## 👤 Users & Profiles

### 회원가입 (Register)
- **URL**: `/api/v1/users/users/register/`
- **Method**: `POST`
- **Request Body**:
  ```json
  {
    "username": "newuser",
    "password": "testpass123",
    "email": "user@example.com",
    "first_name": "홍",
    "last_name": "길동",
    "role": "PATIENT"  // ADMIN, DOCTOR, NURSE, PATIENT
  }
  ```
- **Response**: 사용자 정보 및 토큰

### 현재 사용자 정보 (Current User Info)
- **URL**: `/api/v1/users/users/me/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**: 현재 로그인한 사용자 정보

### 현재 사용자 프로필 (Current User Profile)
- **URL**: `/api/v1/users/profiles/me/`
- **Method**: `GET`
- **Headers**: `Authorization: Bearer {access_token}`
- **Response**: 현재 사용자의 상세 프로필 (전화번호, 주소, FCM 토큰 등)

### 프로필 업데이트 (Update Profile)
- **URL**: `/api/v1/users/profiles/me/`
- **Method**: `PATCH`
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:
  ```json
  {
    "phone_number": "010-1234-5678",
    "fcm_token": "firebase_device_token..."
  }
  ```

### 비밀번호 변경 (Change Password)
- **URL**: `/api/v1/users/users/change_password/`
- **Method**: `POST`
- **Headers**: `Authorization: Bearer {access_token}`
- **Request Body**:
  ```json
  {
    "old_password": "oldpass123",
    "new_password": "newpass456"
  }
  ```

---

## 🏥 EMR (Electronic Medical Records)

### 환자 (Patients)

#### 환자 목록 조회 (List Patients)
- **URL**: `GET /api/v1/emr/patients/`
- **Query Parameters**:
  - `search`: 검색어 (이름, PID, 전화번호)
  - `first_name`: 이름으로 필터
  - `last_name`: 성으로 필터
  - `pid`: 환자 ID로 필터
  - `phone`: 전화번호로 필터
- **Example**: `GET /api/v1/emr/patients/?search=홍길동`

#### 환자 상세 조회 (Patient Detail)
- **URL**: `GET /api/v1/emr/patients/{id}/`

#### 환자 내원 기록 (Patient Encounters)
- **URL**: `GET /api/v1/emr/patients/{id}/encounters/`
- **Response**: 해당 환자의 모든 내원 기록 리스트

#### 환자 진료 이력 (Medical History)
- **URL**: `GET /api/v1/emr/patients/{id}/medical_history/`
- **Response**: 내원 기록 + AI 진단 결과를 포함한 종합 진료 이력

### 내원 (Encounters)

#### 내원 목록 조회 (List Encounters)
- **URL**: `GET /api/v1/emr/encounters/`

#### 내원 생성 (Create Encounter)
- **URL**: `POST /api/v1/emr/encounters/`
- **Request Body**:
  ```json
  {
    "patient_id": 1,
    "doctor_id": 2,
    "encounter_type": "OUTPATIENT",
    "chief_complaint": "두통"
  }
  ```

#### 내원 상세 조회 (Encounter Detail)
- **URL**: `GET /api/v1/emr/encounters/{id}/`

### 임상 서식 (Clinical Forms)

#### SOAP 노트 (SOAP Notes)
- **List/Create**: `/api/v1/emr/soap/`
- **Detail/Update**: `/api/v1/emr/soap/{id}/`

#### 활력 징후 (Vitals)
- **List/Create**: `/api/v1/emr/vitals/`
- **Detail/Update**: `/api/v1/emr/vitals/{id}/`

#### 문서 (Documents)
- **List/Create**: `/api/v1/emr/documents/`
- **Detail/Update**: `/api/v1/emr/documents/{id}/`

---

## 🧠 Custom Features (NeuroNova Specific)

### 예약 (Appointments)

#### 예약 목록 조회 (List Appointments)
- **URL**: `GET /api/v1/custom/appointments/`
- **Query Parameters**:
  - `status`: 상태별 필터 (PENDING, CONFIRMED, CANCELLED, COMPLETED)
  - `patient_id`: 환자별 필터
  - `doctor_id`: 의사별 필터

#### 예약 생성 (Create Appointment)
- **URL**: `POST /api/v1/custom/appointments/`
- **Request Body**:
  ```json
  {
    "patient_id": 1,
    "doctor_id": 2,
    "scheduled_at": "2025-01-15T10:00:00Z",
    "visit_type": "FIRST_VISIT",
    "reason": "지속적인 두통"
  }
  ```
- **Note**: 로그인한 환자의 경우 `patient_id` 자동 채움

#### 예약 확정 (Confirm Appointment)
- **URL**: `POST /api/v1/custom/appointments/{id}/confirm/`
- **Permission**: 의사 또는 직원만 가능

#### 예약 취소 (Cancel Appointment)
- **URL**: `POST /api/v1/custom/appointments/{id}/cancel/`

### AI 예측 (CDSS - Clinical Decision Support System)

#### AI 예측 목록 조회 (List Predictions)
- **URL**: `GET /api/v1/custom/predictions/`
- **Query Parameters**:
  - `patient_id`: 환자별 필터
  - `status`: 상태별 필터

#### 검토 대기 목록 (Pending Review)
- **URL**: `GET /api/v1/custom/predictions/pending_review/`
- **Response**: 의사 검토가 필요한 AI 진단 목록

#### 예측 확정 (Confirm Prediction)
- **URL**: `POST /api/v1/custom/predictions/{id}/confirm_prediction/`
- **Request Body**:
  ```json
  {
    "doctor_feedback": "Correct",
    "doctor_note": "MRI 스캔 결과와 병변 크기 일치함"
  }
  ```
- **Permission**: 의사만 가능

### 처방전 (Prescriptions)

#### 처방전 목록/생성 (List/Create)
- **URL**: `/api/v1/custom/prescriptions/`
- **Method**: `GET` (목록), `POST` (생성)

### 의사 목록 (Doctors)

#### 의사 목록 조회 (List Doctors)
- **URL**: `GET /api/v1/custom/doctors/`
- **Response**: 시스템에 등록된 모든 의사 목록

---

## 🔔 Notifications

### 알림 로그 (Notification Logs)

#### 알림 목록 조회 (List Notifications)
- **URL**: `GET /api/v1/notifications/logs/`
- **Query Parameters**:
  - `is_read`: `true` 또는 `false` (읽음/안읽음 필터)
- **Example**: `GET /api/v1/notifications/logs/?is_read=false`

#### 알림 읽음 처리 (Mark as Read)
- **URL**: `PATCH /api/v1/notifications/logs/{id}/`
- **Request Body**:
  ```json
  {
    "is_read": true
  }
  ```

---

## 🖼️ Orthanc (DICOM Integration)

### Study (검사)

#### Study 조회 (Get Study)
- **URL**: `GET /api/v1/orthanc/studies/{study_uid}/`
- **Response**: DICOM Study 메타데이터 및 Series 목록

### Series (시리즈)

#### Series 조회 (Get Series)
- **URL**: `GET /api/v1/orthanc/series/{series_uid}/`
- **Response**: DICOM Series 메타데이터 및 Instance 목록

### Instance (인스턴스)

#### Instance 미리보기 (Preview Instance)
- **URL**: `GET /api/v1/orthanc/instances/{instance_id}/preview/`
- **Response**: PNG 이미지 (미리보기용)

### 업로드 (Upload)

#### DICOM 파일 업로드 (Upload DICOM)
- **URL**: `POST /api/v1/orthanc/upload/`
- **Content-Type**: `multipart/form-data`
- **Request Body**: DICOM 파일 (.dcm)

---

## 🤖 Flask AI Server

> **Base URL**: `http://localhost:5000` (개발) / `http://flask-ai:5000` (Docker)
> **참고**: Flask 서버는 Django와 별도로 실행되며, 일반적으로 Django를 통해 프록시로 접근합니다.

### 1. 바이오마커 분석 API (30개 바이오마커)

분석 대상 질병: **COVID-19, 독감(Influenza), 감기(Common Cold), 정상(Normal)**

#### Endpoint
- **URL**: `/api/ai/biomarker-analysis`
- **Method**: `POST`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "patient_id": "P123456",  // 선택사항
  "biomarkers": {
    "protein_01": 45.2,      // C-반응성 단백질 (CRP) - mg/L
    "protein_02": 18.5,      // 인터루킨-6 (IL-6) - pg/mL
    "protein_03": 12.3,      // 종양 괴사 인자 알파 (TNF-α) - pg/mL
    "protein_04": 820,       // D-이량체 (D-Dimer) - ng/mL
    "protein_05": 520,       // 페리틴 (Ferritin) - ng/mL
    "protein_06": 8.2,       // 인터루킨-1β (IL-1β) - pg/mL
    "protein_07": 45,        // 인터루킨-8 (IL-8) - pg/mL
    "protein_08": 5.5,       // 인터루킨-10 (IL-10) - pg/mL
    "protein_09": 1.8,       // 프로칼시토닌 (PCT) - ng/mL
    "protein_10": 320,       // 락테이트 탈수소효소 (LDH) - U/L
    "protein_11": 3.8,       // 알부민 (Albumin) - g/dL
    "protein_12": 150,       // 크레아틴 키나제 (CK) - U/L
    "protein_13": 0.02,      // 트로포닌 I (Troponin I) - ng/mL
    "protein_14": 85,        // B형 나트륨이뇨 펩타이드 (BNP) - pg/mL
    "protein_15": 32,        // 인터페론 감마 (IFN-γ) - pg/mL
    "protein_16": 25,        // 혈청 아밀로이드 A (SAA) - mg/L
    "protein_17": 35,        // 아스파르테이트 아미노전이효소 (AST) - U/L
    "protein_18": 42,        // 알라닌 아미노전이효소 (ALT) - U/L
    "protein_19": 1100,      // 면역글로불린 G (IgG) - mg/dL
    "protein_20": 180,       // 면역글로불린 M (IgM) - mg/dL
    "protein_21": 15,        // 요소 질소 (BUN) - mg/dL
    "protein_22": 1.0,       // 크레아티닌 (Creatinine) - mg/dL
    "protein_23": 95,        // 글루코스 (Glucose) - mg/dL
    "protein_24": 14.5,      // 헤모글로빈 (Hemoglobin) - g/dL
    "protein_25": 9500,      // 백혈구 수 (WBC) - /μL
    "protein_26": 72,        // 호중구 비율 (Neutrophil %) - %
    "protein_27": 18,        // 림프구 비율 (Lymphocyte %) - %
    "protein_28": 280000,    // 혈소판 수 (Platelet) - /μL
    "protein_29": 35,        // 적혈구 침강 속도 (ESR) - mm/hr
    "protein_30": 12.5       // 프로트롬빈 시간 (PT) - 초
  }
}
```

#### Response (Success - 200 OK)
```json
{
  "status": "success",
  "result": {
    "category": "COVID",              // "COVID", "FLU", "COLD", "NORMAL"
    "confidence": 0.87,               // 0.0 ~ 1.0
    "probabilities": {
      "COVID": 0.87,
      "FLU": 0.08,
      "COLD": 0.03,
      "NORMAL": 0.02
    },
    "feature_importance": {
      "C-반응성 단백질 (CRP)": 0.92,
      "인터루킨-6 (IL-6)": 0.85,
      "페리틴 (Ferritin)": 0.78,
      "D-이량체 (D-Dimer)": 0.65,
      "프로칼시토닌 (PCT)": 0.58
      // ... 상위 중요도 순으로 정렬
    },
    "model_info": {
      "model_name": "BiomarkerNet-v2.0",
      "model_version": "2.0.1",
      "inference_time_ms": 245
    }
  },
  "timestamp": "2025-12-05T20:30:00Z"
}
```

#### 카테고리 정의

| 카테고리 | 영문명 | 우선순위 | 설명 |
|---------|--------|----------|------|
| `COVID` | COVID-19 | 1 (최고) | 코로나19 가능성 높음 - 즉시 격리 및 검사 필요 |
| `FLU` | Influenza | 2 (높음) | 독감 가능성 높음 - 휴식 및 수액 권장 |
| `COLD` | Common Cold | 3 (중간) | 일반 감기 - 충분한 휴식 권장 |
| `NORMAL` | Normal | 4 (정상) | 정상 범위 - 건강 상태 양호 |

#### 30개 바이오마커 ID 매핑

```
protein_01  - C-반응성 단백질 (CRP)
protein_02  - 인터루킨-6 (IL-6)
protein_03  - 종양 괴사 인자 알파 (TNF-α)
protein_04  - D-이량체 (D-Dimer)
protein_05  - 페리틴 (Ferritin)
protein_06  - 인터루킨-1β (IL-1β)
protein_07  - 인터루킨-8 (IL-8)
protein_08  - 인터루킨-10 (IL-10)
protein_09  - 프로칼시토닌 (PCT)
protein_10  - 락테이트 탈수소효소 (LDH)
protein_11  - 알부민 (Albumin)
protein_12  - 크레아틴 키나제 (CK)
protein_13  - 트로포닌 I (Troponin I)
protein_14  - B형 나트륨이뇨 펩타이드 (BNP)
protein_15  - 인터페론 감마 (IFN-γ)
protein_16  - 혈청 아밀로이드 A (SAA)
protein_17  - 아스파르테이트 아미노전이효소 (AST)
protein_18  - 알라닌 아미노전이효소 (ALT)
protein_19  - 면역글로불린 G (IgG)
protein_20  - 면역글로불린 M (IgM)
protein_21  - 요소 질소 (BUN)
protein_22  - 크레아티닌 (Creatinine)
protein_23  - 글루코스 (Glucose)
protein_24  - 헤모글로빈 (Hemoglobin)
protein_25  - 백혈구 수 (WBC)
protein_26  - 호중구 비율 (Neutrophil %)
protein_27  - 림프구 비율 (Lymphocyte %)
protein_28  - 혈소판 수 (Platelet)
protein_29  - 적혈구 침강 속도 (ESR)
protein_30  - 프로트롬빈 시간 (PT)
```

### 2. Django 통합 예시

Django에서 Flask API를 호출하는 방법:

```python
import requests
from django.conf import settings

def analyze_biomarkers(biomarker_data):
    """
    30개 바이오마커 데이터를 Flask AI 서버로 전송하여 분석
    """
    flask_url = settings.FLASK_AI_URL  # http://localhost:5000

    response = requests.post(
        f"{flask_url}/api/ai/biomarker-analysis",
        json={"biomarkers": biomarker_data},
        timeout=30
    )

    if response.status_code == 200:
        return response.json()['result']
    else:
        raise Exception(f"Flask AI Error: {response.json()}")
```

### 3. React 통합 예시

React에서 Django를 통해 Flask API 간접 호출:

```javascript
// Django API 엔드포인트 사용 (Django가 Flask로 전달)
const analyzeBiomarkers = async (proteinValues) => {
  const response = await fetch('/api/v1/custom/biomarker-analysis/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({ biomarkers: proteinValues })
  });

  return await response.json();
};
```

### 4. 추가 예정 API (Phase 2)

- `/api/ai/image-classification` - CT/MRI 이미지 분류 (뇌종양 진단)
- `/api/ai/segmentation` - 종양 영역 분할
- `/api/ai/xai-analysis` - XAI 설명 생성 (SHAP, Grad-CAM)
- `/api/ai/risk-prediction` - 장기 예후 예측

---

## 🔧 에러 응답 형식

모든 API는 에러 발생 시 다음 형식으로 응답합니다:

```json
{
  "error": "에러 메시지",
  "detail": "상세 정보 (선택사항)",
  "code": "ERROR_CODE (선택사항)"
}
```

### 주요 HTTP 상태 코드

| 코드 | 의미 | 설명 |
|------|------|------|
| 200 | OK | 요청 성공 |
| 201 | Created | 리소스 생성 성공 |
| 400 | Bad Request | 잘못된 요청 |
| 401 | Unauthorized | 인증 필요 |
| 403 | Forbidden | 권한 없음 |
| 404 | Not Found | 리소스 없음 |
| 500 | Internal Server Error | 서버 오류 |
| 503 | Service Unavailable | 서비스 이용 불가 (Flask 서버 다운 등) |

---

## 📚 관련 문서

- [Django API 상세 문서](./10_django_api.md)
- [Flask AI 통합 가이드](./12_flask_ai_integration.md)
- [ML API 사용 가이드](./ML_API_사용_가이드.md)
- [프론트엔드 구현 가이드](./51_FRONTEND_IMPLEMENTATION_GUIDE.md)
- [테스트 계정 정보](./04_test_accounts.md)

---

**작성자**: Claude Code
**버전**: 2.0
**라이선스**: NeuroNova 프로젝트 내부 문서
