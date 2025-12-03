# Django ML API 예제 (7개 주요 엔드포인트)

Base URL: `http://localhost:8000`

## 1. 예측 (Predict - Proxy)
**POST** `/ml/v1/predict/`

**Body (JSON):**
```json
{
    "doctor_name": "doctor_0001",
    "patient_name": "patient_0001",
    "sequence": "MKTIIALSYIFCLVFADYKDDDDK",
    "seq_type": "protein",
    "task3_threshold": 0.5
}
```
*참고: 이 요청은 Flask 서버로 전달되며 트랜잭션이 기록됩니다.*

---

## 2. 시스템 상태 (System Status)
**GET** `/ml/v1/status/`

Response:
```json
{
    "ok": true,
    "status": "alive",
    "model_version": "v1.0"
}
```

---

## 3. 모델 정보 (Model Info)
**GET** `/ml/v1/model-info/`

Response:
```json
{
    "model_version": "v1.0",
    "loaded_at": "2024-01-01T00:00:00"
}
```

---

## 4. 모델 재학습 (Retrain Model)
**POST** `/ml/v1/retrain/`

**Body (JSON):**
```json
{}
```
*참고: Flask 서버에서 모델 재학습을 트리거합니다.*

---

## 5. 추론 이력 (Inference History)
**GET** `/ml/v1/history/?doctor=doctor_0001`

**Query Params:**
- `doctor`: 의사 이름으로 필터링
- `patient`: 환자 이름으로 필터링

Response:
```json
{
    "count": 10,
    "results": [ ... ]
}
```

---

## 6. 검토 대기 목록 (Pending Reviews)
**GET** `/api/v1/custom/predictions/pending_review/`
*(인증 필요)*

Response:
```json
[
    {
        "id": 1,
        "patient": 101,
        "prediction_class": "Glioma",
        "confidence_score": 0.95,
        "created_at": "..."
    }
]
```

---

## 7. 예측 확정 (Confirm Prediction)
**POST** `/api/v1/custom/predictions/{id}/confirm_prediction/`
*(인증 필요)*

**Body (JSON):**
```json
{
    "doctor_feedback": "Correct",
    "doctor_note": "MRI 스캔을 기반으로 확정함."
}
```
*참고: 의사의 전문 의견으로 예측 기록을 업데이트합니다.*
