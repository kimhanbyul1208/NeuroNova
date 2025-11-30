# Flask AI 추론 엔진 API 설계 문서

## 목차
1. [개요](#1-개요)
2. [시스템 아키텍처](#2-시스템-아키텍처)
3. [기본 구조 API](#3-기본-구조-api)
4. [예측 API](#4-예측-api)
5. [XAI API](#5-xai-api)
6. [비동기 처리](#6-비동기-처리)
7. [에러 처리](#7-에러-처리)
8. [Django-Flask 통신](#8-django-flask-통신)
9. [보안 및 인증](#9-보안-및-인증)

---

## 1. 개요

### 1.1 목적
NeuroNova AI 추론 엔진은 뇌종양 진단을 위한 3가지 AI 모델을 제공하며, Django Backend와 RESTful API를 통해 통신합니다.

### 1.2 제공 모델

| 모델 ID | 모델명 | 입력 | 출력 | 용도 |
|---------|--------|------|------|------|
| `ct_classification` | 뇌종양 종류 예측 | CT 이미지 | 종양 종류 (Glioma/Meningioma/Pituitary) | Classification |
| `mri_segmentation` | 뇌종양 Segmentation | MRI 이미지 | Segmentation Mask | Image-to-Image |
| `biomarker_prediction` | 바이오마커 기반 예측 | 바이오마커 데이터 | 종양 종류 + 전이 조직 + 전이 정도 | Classification |

### 1.3 XAI (설명 가능 AI)
- **SHAP (SHapley Additive exPlanations)**: Feature importance
- **Grad-CAM (Gradient-weighted Class Activation Mapping)**: 이미지 영역 중요도

---

## 2. 시스템 아키텍처

### 2.1 통신 구조

```
[Django Backend] ←→ [Flask AI Server] ←→ [GPU/ML Models]
      ↓                     ↓                    ↓
  PostgreSQL           Celery Queue         ONNX Models
  MySQL                Redis                PyTorch
```

### 2.2 배포 환경

**개발 환경**:
- Flask: `http://localhost:5000`
- Django: `http://localhost:8000`

**프로덕션 환경**:
- Flask: `http://flask:5000` (Docker 내부)
- Django: `http://django:8000`

---

## 3. 기본 구조 API

### 3.1 서버 상태 확인

**엔드포인트**: `GET /health`

**목적**: AI 서버 및 모델 로딩 상태 확인

**요청**:
```http
GET /health HTTP/1.1
Host: flask:5000
```

**응답**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models": {
    "ct_classification": {
      "loaded": true,
      "version": "v2.1.0",
      "last_updated": "2025-11-20T10:30:00Z"
    },
    "mri_segmentation": {
      "loaded": true,
      "version": "v1.5.0",
      "last_updated": "2025-11-15T14:20:00Z"
    },
    "biomarker_prediction": {
      "loaded": true,
      "version": "v1.0.0",
      "last_updated": "2025-11-10T09:00:00Z"
    }
  },
  "gpu_available": true,
  "gpu_devices": ["NVIDIA GeForce RTX 3090"],
  "memory_usage_mb": 2048,
  "uptime_seconds": 86400
}
```

**응답 코드**:
- `200 OK`: 서버 정상
- `503 Service Unavailable`: 모델 로딩 실패

---

### 3.2 모델 버전 조회

**엔드포인트**: `GET /model_info`

**목적**: 각 모델의 상세 정보 조회

**요청**:
```http
GET /model_info HTTP/1.1
Host: flask:5000
```

**응답**:
```json
{
  "models": [
    {
      "model_id": "ct_classification",
      "name": "CT 기반 뇌종양 분류",
      "version": "v2.1.0",
      "type": "classification",
      "input_format": "image/dicom, image/jpeg, image/png",
      "output_classes": ["Glioma", "Meningioma", "Pituitary", "No Tumor"],
      "accuracy": 0.95,
      "training_date": "2025-11-20",
      "model_size_mb": 150,
      "avg_inference_time_ms": 120,
      "xai_supported": ["grad_cam", "shap"]
    },
    {
      "model_id": "mri_segmentation",
      "name": "MRI 기반 뇌종양 세그멘테이션",
      "version": "v1.5.0",
      "type": "segmentation",
      "input_format": "image/dicom, image/nifti",
      "output_format": "image/png (mask)",
      "dice_coefficient": 0.88,
      "training_date": "2025-11-15",
      "model_size_mb": 250,
      "avg_inference_time_ms": 500,
      "xai_supported": ["grad_cam"]
    },
    {
      "model_id": "biomarker_prediction",
      "name": "바이오마커 기반 종양 예측",
      "version": "v1.0.0",
      "type": "classification",
      "input_format": "application/json",
      "output_classes": {
        "tumor_type": ["Glioma", "Meningioma", "Pituitary"],
        "metastasis_organ": ["Brain", "Lung", "Liver", "Bone", "None"],
        "metastasis_stage": ["T1", "T2", "T3", "T4", "None"]
      },
      "accuracy": 0.92,
      "training_date": "2025-11-10",
      "model_size_mb": 50,
      "avg_inference_time_ms": 50,
      "xai_supported": ["shap"]
    }
  ]
}
```

---

### 3.3 모델 업데이트

**엔드포인트**: `POST /update_model`

**목적**: 새로운 모델 버전 배포

**요청**:
```http
POST /update_model HTTP/1.1
Host: flask:5000
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "model_id": "ct_classification",
  "version": "v2.2.0",
  "source_type": "url",  // "url" or "file"
  "source": "https://storage.example.com/models/ct_v2.2.0.onnx",
  "checksum": "sha256:abcd1234...",
  "hot_reload": true  // 서버 재시작 없이 모델 교체
}
```

**응답**:
```json
{
  "success": true,
  "model_id": "ct_classification",
  "old_version": "v2.1.0",
  "new_version": "v2.2.0",
  "reload_time_ms": 3500,
  "message": "Model updated successfully"
}
```

**응답 코드**:
- `200 OK`: 업데이트 성공
- `400 Bad Request`: 잘못된 요청
- `401 Unauthorized`: 인증 실패
- `500 Internal Server Error`: 모델 로딩 실패

---

## 4. 예측 API

### 4.1 CT 기반 뇌종양 분류

**엔드포인트**: `POST /predict/ct_classification`

**목적**: CT 이미지에서 뇌종양 종류 예측

#### 4.1.1 동기 처리 (실시간)

**요청**:
```http
POST /predict/ct_classification HTTP/1.1
Host: flask:5000
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

{
  "image": <file>,  // CT DICOM or PNG/JPEG
  "patient_id": "P123456",  // 익명화된 ID
  "request_id": "REQ_20251128_001",
  "xai": true,  // Grad-CAM 요청
  "xai_methods": ["grad_cam"],
  "metadata": {
    "slice_thickness": 2.5,
    "kvp": 120,
    "study_date": "2025-11-28"
  }
}
```

**응답** (성공):
```json
{
  "success": true,
  "request_id": "REQ_20251128_001",
  "model_id": "ct_classification",
  "model_version": "v2.1.0",
  "inference_time_ms": 125,
  "result": {
    "predicted_class": "Glioma",
    "confidence": 0.92,
    "probabilities": {
      "Glioma": 0.92,
      "Meningioma": 0.05,
      "Pituitary": 0.02,
      "No Tumor": 0.01
    }
  },
  "xai": {
    "grad_cam": {
      "heatmap_base64": "data:image/png;base64,iVBORw0KGgo...",
      "overlay_base64": "data:image/png;base64,iVBORw0KGgo...",
      "important_regions": [
        {
          "x": 120,
          "y": 140,
          "width": 50,
          "height": 50,
          "importance": 0.95
        }
      ]
    }
  },
  "metadata": {
    "timestamp": "2025-11-28T10:30:45Z",
    "processing_node": "gpu-node-01"
  }
}
```

**응답 코드**:
- `200 OK`: 예측 성공
- `400 Bad Request`: 잘못된 이미지 형식
- `413 Payload Too Large`: 파일 크기 초과 (>100MB)
- `500 Internal Server Error`: 모델 추론 실패

#### 4.1.2 비동기 처리

**요청**:
```http
POST /predict/ct_classification/async HTTP/1.1
Host: flask:5000
Content-Type: multipart/form-data

{
  "image": <file>,
  "patient_id": "P123456",
  "xai": true
}
```

**응답** (Task 생성):
```json
{
  "success": true,
  "task_id": "TASK_550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "estimated_time_seconds": 10,
  "status_url": "/task/TASK_550e8400-e29b-41d4-a716-446655440000"
}
```

---

### 4.2 MRI 기반 뇌종양 Segmentation

**엔드포인트**: `POST /predict/mri_segmentation`

**목적**: MRI 이미지에서 종양 영역 세그멘테이션

**요청**:
```http
POST /predict/mri_segmentation HTTP/1.1
Host: flask:5000
Content-Type: multipart/form-data

{
  "image": <file>,  // MRI DICOM or NIfTI
  "patient_id": "P123456",
  "request_id": "REQ_20251128_002",
  "sequence_type": "T1",  // T1, T2, FLAIR
  "xai": true,
  "xai_methods": ["grad_cam"],
  "post_processing": {
    "remove_small_objects": true,
    "min_area_pixels": 100,
    "smooth_boundaries": true
  }
}
```

**응답**:
```json
{
  "success": true,
  "request_id": "REQ_20251128_002",
  "model_id": "mri_segmentation",
  "model_version": "v1.5.0",
  "inference_time_ms": 520,
  "result": {
    "mask_base64": "data:image/png;base64,iVBORw0KGgo...",
    "mask_url": "/download/mask/REQ_20251128_002.png",  // 임시 URL (1시간 유효)
    "tumor_detected": true,
    "tumor_volume_ml": 12.5,
    "tumor_location": {
      "centroid_x": 128,
      "centroid_y": 150,
      "centroid_z": 75
    },
    "bounding_box": {
      "min_x": 100,
      "min_y": 120,
      "min_z": 60,
      "max_x": 156,
      "max_y": 180,
      "max_z": 90
    },
    "dice_score": 0.88
  },
  "xai": {
    "grad_cam": {
      "attention_map_base64": "data:image/png;base64,iVBORw0KGgo...",
      "overlay_base64": "data:image/png;base64,iVBORw0KGgo..."
    }
  },
  "metadata": {
    "timestamp": "2025-11-28T10:31:00Z",
    "processing_node": "gpu-node-01"
  }
}
```

---

### 4.3 바이오마커 기반 종양 예측

**엔드포인트**: `POST /predict/biomarker_prediction`

**목적**: 바이오마커 데이터로 종양 종류, 전이 조직, 전이 정도 예측

**요청**:
```http
POST /predict/biomarker_prediction HTTP/1.1
Host: flask:5000
Content-Type: application/json

{
  "patient_id": "P123456",
  "request_id": "REQ_20251128_003",
  "biomarkers": {
    "age": 55,
    "gender": "M",
    "tumor_markers": {
      "CEA": 5.2,
      "CA125": 35.0,
      "AFP": 10.5,
      "PSA": 4.0
    },
    "blood_test": {
      "WBC": 7500,
      "RBC": 4.5,
      "hemoglobin": 14.2,
      "platelet": 250000
    },
    "genetic_markers": {
      "EGFR_mutation": true,
      "TP53_mutation": false,
      "KRAS_mutation": false
    },
    "imaging_features": {
      "tumor_size_mm": 35,
      "tumor_shape": "irregular",
      "necrosis_present": true
    }
  },
  "xai": true,
  "xai_methods": ["shap"]
}
```

**응답**:
```json
{
  "success": true,
  "request_id": "REQ_20251128_003",
  "model_id": "biomarker_prediction",
  "model_version": "v1.0.0",
  "inference_time_ms": 45,
  "result": {
    "tumor_type": {
      "predicted_class": "Glioma",
      "confidence": 0.89,
      "probabilities": {
        "Glioma": 0.89,
        "Meningioma": 0.08,
        "Pituitary": 0.03
      }
    },
    "metastasis": {
      "detected": true,
      "organ": {
        "predicted_class": "Lung",
        "confidence": 0.76,
        "probabilities": {
          "Lung": 0.76,
          "Liver": 0.15,
          "Bone": 0.07,
          "Brain": 0.02
        }
      },
      "stage": {
        "predicted_class": "T3",
        "confidence": 0.82,
        "probabilities": {
          "T1": 0.05,
          "T2": 0.10,
          "T3": 0.82,
          "T4": 0.03
        }
      }
    }
  },
  "xai": {
    "shap": {
      "feature_importance": [
        {
          "feature": "EGFR_mutation",
          "importance": 0.35,
          "value": true
        },
        {
          "feature": "tumor_size_mm",
          "importance": 0.28,
          "value": 35
        },
        {
          "feature": "CEA",
          "importance": 0.15,
          "value": 5.2
        },
        {
          "feature": "age",
          "importance": 0.12,
          "value": 55
        },
        {
          "feature": "necrosis_present",
          "importance": 0.10,
          "value": true
        }
      ],
      "shap_plot_base64": "data:image/png;base64,iVBORw0KGgo...",
      "waterfall_plot_base64": "data:image/png;base64,iVBORw0KGgo..."
    }
  },
  "metadata": {
    "timestamp": "2025-11-28T10:31:15Z",
    "processing_node": "cpu-node-02"
  }
}
```

---

## 5. XAI API

### 5.1 별도 XAI 요청

**엔드포인트**: `POST /xai/explain`

**목적**: 이미 수행된 예측에 대해 XAI 생성 (추가 요청)

**요청**:
```http
POST /xai/explain HTTP/1.1
Host: flask:5000
Content-Type: application/json

{
  "request_id": "REQ_20251128_001",
  "model_id": "ct_classification",
  "xai_methods": ["grad_cam", "shap"],
  "options": {
    "grad_cam": {
      "layer_name": "conv5",
      "colormap": "jet"
    },
    "shap": {
      "num_samples": 1000
    }
  }
}
```

**응답**:
```json
{
  "success": true,
  "request_id": "REQ_20251128_001",
  "xai": {
    "grad_cam": { ... },
    "shap": { ... }
  }
}
```

---

## 6. 비동기 처리

### 6.1 Task 상태 조회

**엔드포인트**: `GET /task/<task_id>`

**요청**:
```http
GET /task/TASK_550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: flask:5000
```

**응답** (진행 중):
```json
{
  "task_id": "TASK_550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "progress": 65,
  "current_step": "Generating Grad-CAM",
  "estimated_remaining_seconds": 3
}
```

**응답** (완료):
```json
{
  "task_id": "TASK_550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "progress": 100,
  "result": {
    // 예측 결과 (위와 동일)
  },
  "completed_at": "2025-11-28T10:30:55Z"
}
```

**응답** (실패):
```json
{
  "task_id": "TASK_550e8400-e29b-41d4-a716-446655440000",
  "status": "failed",
  "error": {
    "code": "MODEL_INFERENCE_ERROR",
    "message": "Failed to process image: Invalid DICOM format",
    "details": "..."
  },
  "failed_at": "2025-11-28T10:30:50Z"
}
```

---

### 6.2 Task 취소

**엔드포인트**: `DELETE /task/<task_id>`

**요청**:
```http
DELETE /task/TASK_550e8400-e29b-41d4-a716-446655440000 HTTP/1.1
Host: flask:5000
```

**응답**:
```json
{
  "success": true,
  "task_id": "TASK_550e8400-e29b-41d4-a716-446655440000",
  "status": "cancelled"
}
```

---

## 7. 에러 처리

### 7.1 에러 응답 형식

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "details": "Detailed error information for debugging",
    "timestamp": "2025-11-28T10:30:00Z"
  }
}
```

### 7.2 에러 코드

| 코드 | 의미 | HTTP 상태 |
|------|------|-----------|
| `INVALID_REQUEST` | 잘못된 요청 형식 | 400 |
| `INVALID_IMAGE_FORMAT` | 지원하지 않는 이미지 형식 | 400 |
| `IMAGE_TOO_LARGE` | 이미지 크기 초과 | 413 |
| `MODEL_NOT_LOADED` | 모델 로딩 실패 | 503 |
| `MODEL_INFERENCE_ERROR` | 모델 추론 오류 | 500 |
| `XAI_GENERATION_ERROR` | XAI 생성 실패 | 500 |
| `UNAUTHORIZED` | 인증 실패 | 401 |
| `RATE_LIMIT_EXCEEDED` | 요청 제한 초과 | 429 |
| `INTERNAL_SERVER_ERROR` | 서버 내부 오류 | 500 |

---

## 8. Django-Flask 통신

### 8.1 Django에서 Flask 호출 예시

**Django View**:
```python
# apps/custom/views.py

import requests
from django.conf import settings
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def predict_ct_tumor(request):
    """
    CT 이미지 업로드 받아 Flask AI 서버로 전송
    """
    # 1. Django에서 환자 정보 익명화
    patient = request.user.patient
    anonymized_id = f"P{patient.id}"

    # 2. 이미지 파일 받기
    image_file = request.FILES.get('ct_image')

    # 3. Flask AI 서버로 요청
    flask_url = f"{settings.FLASK_INFERENCE_URL}/predict/ct_classification"

    files = {'image': image_file}
    data = {
        'patient_id': anonymized_id,
        'request_id': f"REQ_{timezone.now().strftime('%Y%m%d_%H%M%S')}",
        'xai': True,
        'xai_methods': ['grad_cam']
    }

    try:
        response = requests.post(
            flask_url,
            files=files,
            data=data,
            timeout=30
        )
        response.raise_for_status()

        result = response.json()

        # 4. 결과를 Django DB에 저장
        prediction = PatientPredictionResult.objects.create(
            patient=patient,
            doctor=request.user.userprofile.doctor,
            model_type='CT_CLASSIFICATION',
            model_version=result['model_version'],
            predicted_class=result['result']['predicted_class'],
            confidence=result['result']['confidence'],
            probabilities=result['result']['probabilities'],
            xai_data=result.get('xai'),
            inference_time_ms=result['inference_time_ms'],
            status='PENDING_REVIEW'
        )

        # 5. 의사에게 알림 전송
        from apps.core.services.notification_service import NotificationService
        NotificationService().send_diagnosis_ready_notification(
            doctor=request.user.userprofile.doctor,
            patient=patient,
            prediction=prediction
        )

        return Response({
            'success': True,
            'prediction_id': prediction.id,
            'result': result
        })

    except requests.exceptions.Timeout:
        return Response({
            'success': False,
            'error': 'AI server timeout'
        }, status=504)
    except requests.exceptions.RequestException as e:
        return Response({
            'success': False,
            'error': str(e)
        }, status=500)
```

### 8.2 비동기 처리 (Celery 사용)

**Celery Task**:
```python
# apps/custom/tasks.py

from celery import shared_task
import requests
from django.conf import settings

@shared_task(bind=True, max_retries=3)
def process_mri_segmentation(self, patient_id, image_path, request_id):
    """
    MRI Segmentation 비동기 처리
    """
    try:
        flask_url = f"{settings.FLASK_INFERENCE_URL}/predict/mri_segmentation/async"

        with open(image_path, 'rb') as f:
            files = {'image': f}
            data = {
                'patient_id': f"P{patient_id}",
                'request_id': request_id,
                'xai': True
            }

            response = requests.post(flask_url, files=files, data=data, timeout=60)
            response.raise_for_status()

            result = response.json()
            task_id = result['task_id']

            # Flask Task 상태 폴링
            while True:
                status_response = requests.get(
                    f"{settings.FLASK_INFERENCE_URL}/task/{task_id}",
                    timeout=10
                )
                status_data = status_response.json()

                if status_data['status'] == 'completed':
                    # 결과 저장
                    save_segmentation_result(patient_id, status_data['result'])
                    break
                elif status_data['status'] == 'failed':
                    raise Exception(status_data['error']['message'])

                time.sleep(5)  # 5초마다 상태 확인

    except Exception as exc:
        raise self.retry(exc=exc, countdown=60)
```

---

## 9. 보안 및 인증

### 9.1 JWT 토큰 인증

Flask는 Django에서 발급한 JWT 토큰을 검증합니다.

**요청 헤더**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Flask JWT 검증**:
```python
from flask import request, jsonify
from functools import wraps
import jwt

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            data = jwt.decode(
                token,
                app.config['JWT_SECRET_KEY'],
                algorithms=['HS256']
            )
            request.user = data
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(*args, **kwargs)

    return decorated
```

### 9.2 Rate Limiting

```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/predict/ct_classification', methods=['POST'])
@limiter.limit("10 per minute")
@token_required
def predict_ct():
    # ...
```

### 9.3 데이터 익명화

Django에서 Flask로 전송 시 개인정보는 제거:
- 환자 ID는 익명화된 ID로 변환 (`P123456`)
- 이름, 생년월일, 주민번호 등 PII 제거
- 이미지에서 DICOM 메타데이터 정리

---

## 10. 구현 우선순위

### Phase 1: 기본 인프라 (1주)
- [x] Flask 서버 기본 구조
- [ ] Health check API
- [ ] Model loading 시스템
- [ ] 에러 처리

### Phase 2: CT Classification (1주)
- [ ] CT 이미지 전처리
- [ ] 모델 추론
- [ ] Grad-CAM 구현
- [ ] Django 통합

### Phase 3: MRI Segmentation (1주)
- [ ] MRI 이미지 처리
- [ ] Segmentation 모델 추론
- [ ] Post-processing
- [ ] 비동기 처리 (Celery)

### Phase 4: Biomarker Prediction (3일)
- [ ] JSON 입력 처리
- [ ] 모델 추론
- [ ] SHAP 구현

### Phase 5: XAI 고도화 (3일)
- [ ] SHAP 최적화
- [ ] Grad-CAM 시각화 개선
- [ ] XAI 별도 API

---

## 11. 테스트 시나리오

### 11.1 CT Classification 테스트

```bash
# 1. Health check
curl http://localhost:5000/health

# 2. CT 예측
curl -X POST http://localhost:5000/predict/ct_classification \
  -H "Authorization: Bearer <token>" \
  -F "image=@test_ct.dcm" \
  -F "patient_id=P123456" \
  -F "xai=true"

# 3. 결과 확인
# Expected: 200 OK with prediction result
```

### 11.2 비동기 처리 테스트

```bash
# 1. 비동기 요청
curl -X POST http://localhost:5000/predict/mri_segmentation/async \
  -F "image=@test_mri.nii"

# Response: {"task_id": "TASK_xxx", "status": "pending"}

# 2. 상태 확인
curl http://localhost:5000/task/TASK_xxx

# 3. 완료 대기 후 결과 확인
```

---

## 부록 A: 데이터 형식

### A.1 지원 이미지 형식

| 모델 | 형식 | 확장자 | 최대 크기 |
|------|------|--------|----------|
| CT Classification | DICOM, PNG, JPEG | .dcm, .png, .jpg | 50MB |
| MRI Segmentation | DICOM, NIfTI | .dcm, .nii, .nii.gz | 100MB |

### A.2 DICOM 메타데이터

필수 태그:
- `(0010,0020)` - Patient ID (익명화)
- `(0008,0060)` - Modality (CT/MRI)
- `(0018,0050)` - Slice Thickness

---

**작성일**: 2025-11-28
**버전**: 1.0
**작성자**: Claude Code
