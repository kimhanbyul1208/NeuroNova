# NeuroNova API 명세서

**Base URL**: `/api/v1/`
**인증 (Auth)**: Bearer Token (JWT)

---

## 🔐 인증 (Authentication)

### 로그인 (Login)
- **URL**: `/api/v1/users/login/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "doctor_0001",
    "password": "testpass123"
  }
  ```
- **Response**: `access`, `refresh` 토큰

### 토큰 갱신 (Refresh Token)
- **URL**: `/api/v1/users/refresh/`
- **Method**: `POST`
- **Body**: `{"refresh": "..."}`

---

## 👤 사용자 및 프로필 (Users & Profiles)

### 회원가입 (Register)
- **URL**: `/api/v1/users/users/register/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "newuser",
    "password": "testpass123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "PATIENT"  // ADMIN, DOCTOR, NURSE, PATIENT
  }
  ```

### 현재 사용자 정보 (Current User Info)
- **URL**: `/api/v1/users/users/me/`
- **Method**: `GET`

### 현재 사용자 프로필 (Current User Profile)
- **URL**: `/api/v1/users/profiles/me/`
- **Method**: `GET`

### 비밀번호 변경 (Change Password)
- **URL**: `/api/v1/users/users/change_password/`
- **Method**: `POST`
- **Body**: `{"old_password": "...", "new_password": "..."}`

---

## 🏥 EMR (전자의무기록)

### 환자 (Patients)
- **목록 조회**: `GET /api/v1/emr/patients/` (검색 가능: `first_name`, `last_name`, `pid`, `phone`)
- **상세 조회**: `GET /api/v1/emr/patients/{id}/`
- **내원 기록**: `GET /api/v1/emr/patients/{id}/encounters/`
- **진료 이력**: `GET /api/v1/emr/patients/{id}/medical_history/` (내원 기록 + AI 진단 포함)

### 내원 (Encounters)
- **목록 조회**: `GET /api/v1/emr/encounters/`
- **생성**: `POST /api/v1/emr/encounters/`
- **상세 조회**: `GET /api/v1/emr/encounters/{id}/`

### 임상 서식 (Clinical Forms)
- **SOAP 노트**: `/api/v1/emr/soap/`
- **활력 징후 (Vitals)**: `/api/v1/emr/vitals/`
- **문서**: `/api/v1/emr/documents/`

---

## 🧠 커스텀 기능 (NeuroNova 전용)

### 예약 (Appointments)
- **목록 조회**: `GET /api/v1/custom/appointments/`
- **생성**: `POST /api/v1/custom/appointments/`
  - 로그인한 환자의 경우 환자 필드가 자동 채워짐.
- **확정**: `POST /api/v1/custom/appointments/{id}/confirm/` (직원/의사 전용)
- **취소**: `POST /api/v1/custom/appointments/{id}/cancel/`

### AI 예측 (CDSS)
- **목록 조회**: `GET /api/v1/custom/predictions/`
- **검토 대기**: `GET /api/v1/custom/predictions/pending_review/`
- **예측 확정**: `POST /api/v1/custom/predictions/{id}/confirm_prediction/`
  - **Body**:
    ```json
    {
      "doctor_feedback": "Correct",
      "doctor_note": "MRI 스캔과 병변 크기 일치함"
    }
    ```

### 처방전 (Prescriptions)
- **목록/생성**: `/api/v1/custom/prescriptions/`

### 의사 (Doctors)
- **목록 조회**: `GET /api/v1/custom/doctors/`

---

## 🔔 알림 (Notifications)

### 알림 로그 (Notification Logs)
- **목록 조회**: `GET /api/v1/notifications/logs/`
- **필터**: `is_read=false`

---

## 🖼️ Orthanc (DICOM 통합)

- **Study 조회**: `GET /api/v1/orthanc/studies/{study_uid}/`
- **Series 조회**: `GET /api/v1/orthanc/series/{series_uid}/`
- **Instance 미리보기**: `GET /api/v1/orthanc/instances/{instance_id}/preview/`
- **업로드**: `POST /api/v1/orthanc/upload/`

---

## 🤖 Flask AI - 바이오마커 분석 API

> **Base URL**: `http://localhost:5000` (개발) / `http://flask-ai:5000` (Docker)  
> **참고**: Flask 서버는 Django와 별도로 실행됩니다.

### 30개 바이오마커 분석 (질병 분류)

분석 대상 질병: **코로나, 독감, 감기, 정상**

#### Endpoint
- **URL**: `/api/ai/biomarker-analysis`
- **Method**: `POST`
- **Content-Type**: `application/json`
- **Authentication**: Django에서 요청 시 내부 API 토큰 사용 가능 (선택사항)

#### Request Body

```json
{
  "patient_id": "P123456",  // 선택사항 (Django에서 전달)
  "biomarkers": {
    "protein_01": 45.2,      // C-반응성 단백질 (CRP) - mg/L
    "protein_02": 18.5,      // 인터루킨-6 (IL-6) - pg/mL
    // ... (생략)
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
      // ...
    },
    "model_info": {
      "model_name": "BiomarkerNet-v2.0",
      "model_version": "2.0.1",
      "inference_time_ms": 245
    }
  },
  "timestamp": "2025-12-01T20:30:00Z"
}
```

#### Response (Error - 400 Bad Request)

```json
{
  "status": "error",
  "error": {
    "code": "INVALID_INPUT",
    "message": "필수 바이오마커 값이 누락되었습니다",
    "details": {
      "missing_proteins": ["protein_01", "protein_02"]
    }
  }
}
```

#### Response (Error - 500 Internal Server Error)

```json
{
  "status": "error",
  "error": {
    "code": "MODEL_ERROR",
    "message": "AI 모델 추론 중 오류가 발생했습니다"
  }
}
```

---

### 카테고리 정의

| 카테고리 | 영문명 | 우선순위 | 설명 |
|---------|--------|----------|------|
| `COVID` | COVID-19 | 1 (최고) | 코로나19 가능성 높음 - 즉시 격리 및 검사 필요 |
| `FLU` | Influenza | 2 (높음) | 독감 가능성 높음 - 휴식 및 수액 권장 |
| `COLD` | Common Cold | 3 (중간) | 일반 감기 - 충분한 휴식 권장 |
| `NORMAL` | Normal | 4 (정상) | 정상 범위 - 건강 상태 양호 |

---

### Django 통합 예시

Django에서 Flask API 호출:

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
