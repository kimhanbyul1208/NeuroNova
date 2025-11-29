# Django-Flask 통신 시퀀스 다이어그램

## 목차
1. [동기 처리 시나리오](#1-동기-처리-시나리오)
2. [비동기 처리 시나리오](#2-비동기-처리-시나리오)
3. [Human-in-the-Loop 시나리오](#3-human-in-the-loop-시나리오)
4. [에러 처리 시나리오](#4-에러-처리-시나리오)

---

## 1. 동기 처리 시나리오

### 1.1 CT 기반 뇌종양 분류 (실시간)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│의료진 UI│     │ Django  │     │  Flask  │     │  Model  │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ 1. CT 이미지   │               │               │               │
     │   업로드       │               │               │               │
     ├──────────────>│               │               │               │
     │               │               │               │               │
     │               │ 2. 환자 정보   │               │               │
     │               │    조회        │               │               │
     │               ├──────────────────────────────────────────────>│
     │               │<──────────────────────────────────────────────┤
     │               │               │               │               │
     │               │ 3. 익명화 처리 │               │               │
     │               │  (PII 제거)   │               │               │
     │               │               │               │               │
     │               │ 4. POST /predict/ct_classification           │
     │               │    + CT 이미지 │               │               │
     │               │    + patient_id│               │               │
     │               │    + xai=true  │               │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │               │ 5. 이미지     │               │
     │               │               │    전처리     │               │
     │               │               │               │               │
     │               │               │ 6. 모델 추론  │               │
     │               │               ├──────────────>│               │
     │               │               │               │               │
     │               │               │               │ 7. Forward    │
     │               │               │               │    Pass       │
     │               │               │               │               │
     │               │               │<──────────────┤               │
     │               │               │  예측 결과    │               │
     │               │               │               │               │
     │               │               │ 8. Grad-CAM   │               │
     │               │               │    생성       │               │
     │               │               ├──────────────>│               │
     │               │               │<──────────────┤               │
     │               │               │  Heatmap      │               │
     │               │               │               │               │
     │               │<──────────────┤               │               │
     │               │  9. 예측 결과 │               │               │
     │               │     + XAI     │               │               │
     │               │     (JSON)    │               │               │
     │               │               │               │               │
     │               │ 10. 결과 저장 │               │               │
     │               ├──────────────────────────────────────────────>│
     │               │  PatientPredictionResult.create()             │
     │               │<──────────────────────────────────────────────┤
     │               │               │               │               │
     │               │ 11. 의사에게  │               │               │
     │               │     FCM 알림  │               │               │
     │               │  "진단 준비됨"│               │               │
     │               │               │               │               │
     │<──────────────┤               │               │               │
     │ 12. 결과 표시 │               │               │               │
     │   (종양 종류,  │               │               │               │
     │    신뢰도,     │               │               │               │
     │    Grad-CAM)  │               │               │               │
     │               │               │               │               │
```

**시간 흐름**:
- 전체: ~2-5초
- Django 전처리: ~0.5초
- Flask 추론: ~1-2초
- XAI 생성: ~1-2초
- Django 후처리: ~0.5초

---

## 2. 비동기 처리 시나리오

### 2.1 MRI Segmentation (대용량 처리)

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│의료진 UI│     │ Django  │     │ Celery  │     │  Flask  │     │  Model  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │               │
     │ 1. MRI 이미지  │               │               │               │
     │    업로드      │               │               │               │
     ├──────────────>│               │               │               │
     │               │               │               │               │
     │<──────────────┤               │               │               │
     │ 2. Task 생성   │               │               │               │
     │   "처리 중"    │               │               │               │
     │               │               │               │               │
     │               │ 3. Celery Task│               │               │
     │               │    생성        │               │               │
     │               ├──────────────>│               │               │
     │               │               │               │               │
     │               │               │ 4. POST /predict/mri_segmentation/async
     │               │               ├──────────────>│               │
     │               │               │               │               │
     │               │               │<──────────────┤               │
     │               │               │ 5. Task ID    │               │
     │               │               │  반환         │               │
     │               │               │               │               │
     │               │               │ 6. 주기적으로 │               │
     │               │               │    상태 확인  │               │
     │               │               ├──────────────>│               │
     │               │               │ GET /task/{id}│               │
     │               │               │               │               │
     │               │               │<──────────────┤               │
     │               │               │ Status: 진행중│               │
     │               │               │ Progress: 30% │               │
     │               │               │               │               │
     │  (사용자는 다른 작업 가능)     │               │               │
     │               │               │               │               │
     │               │               │               │ 7. 3D 볼륨   │
     │               │               │               │    처리       │
     │               │               │               │    (시간 소요)│
     │               │               │               │               │
     │               │               │               │ 8. Segmentation
     │               │               │               ├──────────────>│
     │               │               │               │               │
     │               │               │               │ 9. Slice-by  │
     │               │               │               │    -slice     │
     │               │               │               │    처리       │
     │               │               │               │               │
     │               │               │<──────────────┤               │
     │               │               │ 10. Mask      │               │
     │               │               │               │               │
     │               │               │ 11. 상태 확인 │               │
     │               │               ├──────────────>│               │
     │               │               │               │               │
     │               │               │<──────────────┤               │
     │               │               │ Status: 완료  │               │
     │               │               │ Result: {...} │               │
     │               │               │               │               │
     │               │<──────────────┤               │               │
     │               │ 12. 결과 저장 │               │               │
     │               │               │               │               │
     │               │ 13. FCM 알림  │               │               │
     │               │ "Segmentation │               │               │
     │               │  완료"        │               │               │
     │               │               │               │               │
     │<──────────────┤               │               │               │
     │ 14. 결과 표시 │               │               │               │
     │   (3D Mask,   │               │               │               │
     │    종양 부피)  │               │               │               │
     │               │               │               │               │
```

**시간 흐름**:
- 전체: ~30-120초 (MRI 크기에 따라)
- Task 생성: ~0.1초 (즉시 반환)
- Flask 처리: ~30-120초
- 상태 확인: 5초마다

---

## 3. Human-in-the-Loop 시나리오

### 3.1 의사 검증 및 피드백

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│  의사   │     │ Django  │     │  Flask  │     │   DB    │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ 1. AI 진단    │               │               │
     │    결과 조회  │               │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │ 2. 예측 결과  │               │
     │               │    조회       │               │
     │               ├──────────────────────────────>│
     │               │<──────────────────────────────┤
     │               │  PatientPredictionResult      │
     │               │  status='PENDING_REVIEW'      │
     │               │               │               │
     │<──────────────┤               │               │
     │ 3. 결과 표시  │               │               │
     │   - 예측: Glioma (92%)                        │
     │   - Grad-CAM                                  │
     │   - 신뢰도                                    │
     │               │               │               │
     │ 4. 의사 검증  │               │               │
     │   - 동의/거부 │               │               │
     │   - 피드백    │               │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │ 5. 검증 저장  │               │
     │               ├──────────────────────────────>│
     │               │  UPDATE PatientPredictionResult
     │               │  verified_by_doctor=True      │
     │               │  doctor_feedback="동의"       │
     │               │  verified_at=NOW()            │
     │               │<──────────────────────────────┤
     │               │               │               │
     │               │ 6. Flask로    │               │
     │               │    피드백 전송│               │
     │               │  (모델 재학습) │               │
     │               ├──────────────>│               │
     │               │ POST /feedback│               │
     │               │ {             │               │
     │               │   "prediction_id": 123,       │
     │               │   "correct": true,            │
     │               │   "actual_class": "Glioma"    │
     │               │ }             │               │
     │               │               │               │
     │               │<──────────────┤               │
     │               │ 7. 피드백     │               │
     │               │    저장됨     │               │
     │               │               │               │
     │               │ 8. 환자에게   │               │
     │               │    알림       │               │
     │               │  "진단 확정됨"│               │
     │               │               │               │
     │<──────────────┤               │               │
     │ 9. 확정 완료  │               │               │
     │               │               │               │
```

---

## 4. 에러 처리 시나리오

### 4.1 Flask 서버 장애

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│의료진 UI│     │ Django  │     │  Flask  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     │ 1. 예측 요청  │               │
     ├──────────────>│               │
     │               │               │
     │               │ 2. POST /predict
     │               ├──────────────>│
     │               │               X (Timeout/Error)
     │               │               │
     │               │ 3. Timeout    │
     │               │    감지       │
     │               │               │
     │               │ 4. 재시도 #1  │
     │               ├──────────────>│
     │               │               X
     │               │               │
     │               │ 5. 재시도 #2  │
     │               ├──────────────>│
     │               │               X
     │               │               │
     │               │ 6. 실패 처리  │
     │               │  - 로그 기록  │
     │               │  - 관리자 알림│
     │               │               │
     │<──────────────┤               │
     │ 7. 에러 메시지│               │
     │   "AI 서버가  │               │
     │    응답하지   │               │
     │    않습니다"  │               │
     │               │               │
```

### 4.2 모델 추론 실패

```
┌─────────┐     ┌─────────┐     ┌─────────┐
│의료진 UI│     │ Django  │     │  Flask  │
└────┬────┘     └────┬────┘     └────┬────┘
     │               │               │
     │ 1. 잘못된 형식│               │
     │    이미지 업로드               │
     ├──────────────>│               │
     │               │               │
     │               │ 2. POST /predict
     │               │  (invalid DICOM)
     │               ├──────────────>│
     │               │               │
     │               │               │ 3. 전처리 실패
     │               │               │  "Invalid format"
     │               │               │
     │               │<──────────────┤
     │               │ 4. 400 Bad    │
     │               │    Request    │
     │               │ {             │
     │               │   "error": {  │
     │               │     "code": "INVALID_IMAGE_FORMAT",
     │               │     "message": "..."
     │               │   }           │
     │               │ }             │
     │               │               │
     │               │ 5. 사용자     │
     │               │    친화적     │
     │               │    메시지 변환│
     │               │               │
     │<──────────────┤               │
     │ 6. "지원하지  │               │
     │    않는 이미지│               │
     │    형식입니다"│               │
     │               │               │
```

---

## 5. 배치 처리 시나리오

### 5.1 다중 환자 예측

```
┌─────────┐     ┌─────────┐     ┌─────────┐     ┌─────────┐
│ 관리자  │     │ Django  │     │ Celery  │     │  Flask  │
└────┬────┘     └────┬────┘     └────┬────┘     └────┬────┘
     │               │               │               │
     │ 1. 배치 작업  │               │               │
     │    요청       │               │               │
     │   (100명 환자)│               │               │
     ├──────────────>│               │               │
     │               │               │               │
     │               │ 2. 배치 Task  │               │
     │               │    생성       │               │
     │               ├──────────────>│               │
     │               │               │               │
     │               │               │ 3. 순차적으로 │
     │               │               │    Flask 호출│
     │               │               │    (Rate Limit)
     │               │               │               │
     │               │               ├─────────────> │
     │               │               │ Patient #1    │
     │               │               │<────────────── │
     │               │               │               │
     │               │               ├─────────────> │
     │               │               │ Patient #2    │
     │               │               │<────────────── │
     │               │               │               │
     │               │               │ ...           │
     │               │               │               │
     │               │               ├─────────────> │
     │               │               │ Patient #100  │
     │               │               │<────────────── │
     │               │               │               │
     │               │<──────────────┤               │
     │               │ 4. 완료 보고  │               │
     │               │               │               │
     │<──────────────┤               │               │
     │ 5. 배치 결과  │               │               │
     │   - 성공: 95  │               │               │
     │   - 실패: 5   │               │               │
     │               │               │               │
```

---

## 6. 모니터링 및 로깅

### 6.1 요청 추적

모든 요청은 `request_id`로 추적됩니다:

```
Django Log:
[2025-11-28 10:30:00] INFO: REQ_20251128_001 - Sending prediction request to Flask
[2025-11-28 10:30:00] DEBUG: REQ_20251128_001 - Patient: P123456, Model: ct_classification

Flask Log:
[2025-11-28 10:30:01] INFO: REQ_20251128_001 - Received prediction request
[2025-11-28 10:30:01] DEBUG: REQ_20251128_001 - Image size: 2.3MB, Format: DICOM
[2025-11-28 10:30:01] INFO: REQ_20251128_001 - Model inference started
[2025-11-28 10:30:02] INFO: REQ_20251128_001 - Inference completed (1.2s)
[2025-11-28 10:30:02] INFO: REQ_20251128_001 - Grad-CAM generation started
[2025-11-28 10:30:03] INFO: REQ_20251128_001 - Grad-CAM completed (0.8s)
[2025-11-28 10:30:03] INFO: REQ_20251128_001 - Response sent to Django

Django Log:
[2025-11-28 10:30:03] INFO: REQ_20251128_001 - Received prediction result from Flask
[2025-11-28 10:30:03] INFO: REQ_20251128_001 - Saved to DB (prediction_id=456)
[2025-11-28 10:30:03] INFO: REQ_20251128_001 - Notification sent to doctor
```

---

## 7. 성능 최적화

### 7.1 연결 풀링

Django에서 Flask로의 연결을 재사용:

```python
# Django settings.py
FLASK_CONNECTION_POOL = {
    'pool_connections': 10,
    'pool_maxsize': 20,
    'max_retries': 3,
    'pool_block': False
}

# Usage
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(
    total=3,
    backoff_factor=1,
    status_forcelist=[500, 502, 503, 504]
)
adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=20)
session.mount('http://', adapter)
session.mount('https://', adapter)
```

### 7.2 캐싱

동일한 이미지에 대한 반복 요청 방지:

```python
# Django에서 캐싱
from django.core.cache import cache

image_hash = hashlib.sha256(image_data).hexdigest()
cache_key = f"prediction:{image_hash}:{model_id}"

# 캐시 확인
cached_result = cache.get(cache_key)
if cached_result:
    return cached_result

# Flask 요청
result = requests.post(flask_url, ...)

# 캐싱 (1시간)
cache.set(cache_key, result, timeout=3600)
```

---

## 8. API 버전 관리

```
현재: /predict/ct_classification
향후: /v1/predict/ct_classification
      /v2/predict/ct_classification
```

Django는 Flask API 버전을 설정에서 관리:

```python
# Django settings.py
FLASK_API_VERSION = 'v1'
FLASK_INFERENCE_URL = f"http://flask:5000/{FLASK_API_VERSION}"
```

---

**작성일**: 2025-11-28
**버전**: 1.0
**작성자**: Claude Code
