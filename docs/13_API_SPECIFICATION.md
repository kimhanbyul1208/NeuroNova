# NeuroNova API Specification

**Base URL**: `/api/v1/`
**Auth**: Bearer Token (JWT)

---

## 🔐 Authentication (Auth)

### Login
- **URL**: `/api/v1/users/login/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "doctor1",
    "password": "password123"
  }
  ```
- **Response**: `access`, `refresh` tokens

### Refresh Token
- **URL**: `/api/v1/users/refresh/`
- **Method**: `POST`
- **Body**: `{"refresh": "..."}`

---

## 👤 Users & Profiles

### Register
- **URL**: `/api/v1/users/users/register/`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "username": "newuser",
    "password": "password123",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "PATIENT"  // ADMIN, DOCTOR, NURSE, PATIENT
  }
  ```

### Current User Info
- **URL**: `/api/v1/users/users/me/`
- **Method**: `GET`

### Current User Profile
- **URL**: `/api/v1/users/profiles/me/`
- **Method**: `GET`

### Change Password
- **URL**: `/api/v1/users/users/change_password/`
- **Method**: `POST`
- **Body**: `{"old_password": "...", "new_password": "..."}`

---

## 🏥 EMR (Electronic Medical Records)

### Patients
- **List**: `GET /api/v1/emr/patients/` (Searchable: `first_name`, `last_name`, `pid`, `phone`)
- **Detail**: `GET /api/v1/emr/patients/{id}/`
- **Encounters**: `GET /api/v1/emr/patients/{id}/encounters/`
- **Medical History**: `GET /api/v1/emr/patients/{id}/medical_history/` (Includes encounters + AI diagnoses)

### Encounters
- **List**: `GET /api/v1/emr/encounters/`
- **Create**: `POST /api/v1/emr/encounters/`
- **Detail**: `GET /api/v1/emr/encounters/{id}/`

### Clinical Forms
- **SOAP Notes**: `/api/v1/emr/soap/`
- **Vitals**: `/api/v1/emr/vitals/`
- **Documents**: `/api/v1/emr/documents/`

---

## 🧠 Custom Features (NeuroNova Specific)

### Appointments
- **List**: `GET /api/v1/custom/appointments/`
- **Create**: `POST /api/v1/custom/appointments/`
  - Patient field is auto-filled for logged-in patients.
- **Confirm**: `POST /api/v1/custom/appointments/{id}/confirm/` (Staff/Doctor only)
- **Cancel**: `POST /api/v1/custom/appointments/{id}/cancel/`

### AI Predictions (CDSS)
- **List**: `GET /api/v1/custom/predictions/`
- **Pending Review**: `GET /api/v1/custom/predictions/pending_review/`
- **Confirm Prediction**: `POST /api/v1/custom/predictions/{id}/confirm_prediction/`
  - **Body**:
    ```json
    {
      "doctor_feedback": "Correct",
      "doctor_note": "Lesion size matches MRI"
    }
    ```

### Prescriptions
- **List/Create**: `/api/v1/custom/prescriptions/`

### Doctors
- **List**: `GET /api/v1/custom/doctors/`

---

## 🔔 Notifications

### Notification Logs
- **List**: `GET /api/v1/notifications/logs/`
- **Filter**: `is_read=false`

---

## 🖼️ Orthanc (DICOM Integration)

- **Study**: `GET /api/v1/orthanc/studies/{study_uid}/`
- **Series**: `GET /api/v1/orthanc/series/{series_uid}/`
- **Instance Preview**: `GET /api/v1/orthanc/instances/{instance_id}/preview/`
- **Upload**: `POST /api/v1/orthanc/upload/`

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
      "프로칼시토닌 (PCT)": 0.58,
      "락테이트 탈수소효소 (LDH)": 0.52,
      "백혈구 수 (WBC)": 0.48,
      "호중구 비율 (Neutrophil %)": 0.45
      // ... 상위 중요도 순으로 정렬
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

### 바이오마커 ID 매핑

전체 30개 바이오마커 목록:

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

상세 정보는 `/biomarkers.json` 참조

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

---

### React 통합 예시

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

---

### 추가 예정 API (Phase 2)

- `/api/ai/image-classification` - CT/MRI 이미지 분류
- `/api/ai/segmentation` - 종양 영역 분할
- `/api/ai/risk-prediction` - 장기 예후 예측

