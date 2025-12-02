# Django ML API Examples (7 Key Endpoints)

Base URL: `http://localhost:8000`

## 1. Predict (Proxy)
**POST** `/ml/v1/predict/`

**Body (JSON):**
```json
{
    "doctor_name": "Dr. Kim",
    "patient_name": "John Doe",
    "sequence": "MKTIIALSYIFCLVFADYKDDDDK",
    "seq_type": "protein",
    "task3_threshold": 0.5
}
```
*Note: This forwards the request to the Flask server and logs the transaction.*

---

## 2. System Status
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

## 3. Model Info
**GET** `/ml/v1/model-info/`

Response:
```json
{
    "model_version": "v1.0",
    "loaded_at": "2024-01-01T00:00:00"
}
```

---

## 4. Retrain Model
**POST** `/ml/v1/retrain/`

**Body (JSON):**
```json
{}
```
*Note: Triggers model retraining on the Flask server.*

---

## 5. Inference History
**GET** `/ml/v1/history/?doctor=Dr. Kim`

**Query Params:**
- `doctor`: Filter by doctor name
- `patient`: Filter by patient name

Response:
```json
{
    "count": 10,
    "results": [ ... ]
}
```

---

## 6. Pending Reviews
**GET** `/api/v1/custom/predictions/pending_review/`
*(Requires Authentication)*

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

## 7. Confirm Prediction
**POST** `/api/v1/custom/predictions/{id}/confirm_prediction/`
*(Requires Authentication)*

**Body (JSON):**
```json
{
    "doctor_feedback": "Correct",
    "doctor_note": "Confirmed based on MRI scan."
}
```
*Note: Updates the prediction record with the doctor's expert opinion.*
