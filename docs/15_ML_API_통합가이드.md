# NeuroNova ML API 통합 가이드

**버전**: 2.0
**최종 업데이트**: 2025-12-05

Django에서 Flask ML 서버를 프록시하여 AI 추론을 수행하는 방법을 설명합니다.

---

## 📋 목차

1. [전체 구조](#전체-구조)
2. [주요 API 엔드포인트 (빠른 참조)](#주요-api-엔드포인트-빠른-참조)
3. [API 상세 가이드](#api-상세-가이드)
4. [Django 뷰에서 ML API 호출](#django-뷰에서-ml-api-호출)
5. [React/Flutter 통합](#reactflutter-통합)
6. [에러 처리](#에러-처리)
7. [테스트](#테스트)

---

## 전체 구조

```
클라이언트 (React/Flutter) → Django (ml_proxy) → Flask ML Server
```

Django의 `ml_proxy` 앱이 Flask ML 서버로 요청을 프록시하며, 다음 기능을 제공합니다:
- 요청 검증 및 로깅
- 추론 결과 DB 저장 (`InferenceLog` 모델)
- 인증/인가
- 에러 핸들링

---

## 주요 API 엔드포인트 (빠른 참조)

**Base URL**: `http://localhost:8000` (Django 프록시)

| 엔드포인트 | 메서드 | 설명 | 인증 필요 |
|-----------|--------|------|----------|
| `/ml/v1/status/` | GET | 시스템 상태 확인 | ❌ |
| `/ml/v1/model-info/` | GET | 모델 정보 조회 | ❌ |
| `/ml/v1/predict/` | POST | AI 추론 (단일/배치) | ✅ (권장) |
| `/ml/v1/history/` | GET | 추론 이력 조회 | ✅ |
| `/ml/v1/retrain/` | POST | 모델 재학습 | ✅ |
| `/api/v1/custom/predictions/pending_review/` | GET | 검토 대기 목록 | ✅ |
| `/api/v1/custom/predictions/{id}/confirm_prediction/` | POST | 예측 확정 | ✅ |

---

## API 상세 가이드

### 1. 헬스 체크 (Health Check)

**엔드포인트**: `GET /ml/v1/status/`

Flask ML 서버의 상태를 확인합니다.

#### 요청 예시 (cURL)
```bash
curl -X GET http://localhost:8000/ml/v1/status/
```

#### 요청 예시 (Python requests)
```python
import requests

response = requests.get('http://localhost:8000/ml/v1/status/')
print(response.json())
```

#### 응답 예시
```json
{
  "ok": true,
  "status": "alive",
  "model_version": "1.0.0"
}
```

---

### 2. 모델 정보 조회 (Model Info)

**엔드포인트**: `GET /ml/v1/model-info/`

Flask ML 서버의 모델 정보를 조회합니다.

#### 요청 예시 (cURL)
```bash
curl -X GET http://localhost:8000/ml/v1/model-info/
```

#### 요청 예시 (Python requests)
```python
import requests

response = requests.get('http://localhost:8000/ml/v1/model-info/')
model_info = response.json()
print(f"Model Version: {model_info.get('model_version')}")
print(f"Loaded At: {model_info.get('loaded_at')}")
```

#### 응답 예시
```json
{
  "model_version": "v1.0",
  "loaded_at": "2025-01-01T00:00:00"
}
```

---

### 3. AI 추론 - 단일 샘플 (Single Prediction)

**엔드포인트**: `POST /ml/v1/predict/`

단백질 서열을 분석하여 AI 추론 결과를 반환합니다.

#### 요청 Body
```json
{
  "doctor_name": "doctor_0001",
  "patient_name": "patient_0001",
  "sequence": "MKTIIALSYIFCLVFADYKDDDDK",
  "seq_type": "protein",
  "task3_threshold": 0.5
}
```

#### 요청 예시 (cURL)
```bash
curl -X POST http://localhost:8000/ml/v1/predict/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "doctor_name": "doctor_0001",
    "patient_name": "patient_0001",
    "sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
    "seq_type": "protein",
    "task3_threshold": 0.5
  }'
```

#### 요청 예시 (Python requests)
```python
import requests

url = 'http://localhost:8000/ml/v1/predict/'
headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer YOUR_ACCESS_TOKEN'
}
data = {
    "doctor_name": "doctor_0001",
    "patient_name": "patient_0001",
    "sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
    "seq_type": "protein",
    "task3_threshold": 0.5,
    "organism_hint": "Influenza A virus"
}

response = requests.post(url, json=data, headers=headers, timeout=30)

if response.status_code == 200:
    result = response.json()
    print("추론 성공!")
    print(f"Model Version: {result.get('model_version')}")
    print(f"Prediction: {result.get('prediction')}")
else:
    print(f"추론 실패: {response.status_code}")
    print(response.json())
```

#### 응답 예시
```json
{
  "ok": true,
  "model_version": "1.0.0",
  "translation": {
    "protein_sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
    "info": {
      "input_type": "protein",
      "length": 52
    }
  },
  "prediction": {
    "task1": {
      "is_pathogen": true,
      "probability": 0.95
    },
    "task2": {
      "protein_type": "Hemagglutinin",
      "probability": 0.88
    },
    "task3": {
      "top_predictions": [
        ["HA_H1N1", 0.92],
        ["HA_H3N2", 0.05],
        ["Other", 0.03]
      ]
    }
  },
  "task3_structure": {
    "protein_name": "HA_H1N1",
    "top1_probability": 0.92,
    "uniprot_hits": [
      {
        "uniprot_id": "P03452",
        "protein_name": "Hemagglutinin",
        "organism": "Influenza A virus",
        "preferred_3d": "https://alphafold.ebi.ac.uk/files/AF-P03452-F1-model_v4.pdb"
      }
    ]
  }
}
```

---

### 4. AI 추론 - 배치 처리 (Batch Prediction)

**엔드포인트**: `POST /ml/v1/predict/`

여러 샘플을 한 번에 처리합니다.

#### 요청 Body
```json
{
  "doctor_name": "doctor_0001",
  "patient_name": "patient_0001",
  "items": [
    {
      "id": "sample1",
      "sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
      "seq_type": "protein"
    },
    {
      "id": "sample2",
      "sequence": "ATGGCTGCAGATGGTGCAATGCCA",
      "seq_type": "dna",
      "frame": 0
    }
  ],
  "task3_threshold": 0.5
}
```

#### 요청 예시 (Python requests)
```python
import requests

url = 'http://localhost:8000/ml/v1/predict/'
data = {
    "doctor_name": "doctor_0001",
    "patient_name": "patient_0001",
    "items": [
        {
            "id": "sample1",
            "sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
            "seq_type": "protein"
        },
        {
            "id": "sample2",
            "sequence": "ATGGCTGCAGATGGTGCAATGCCA",
            "seq_type": "dna",
            "frame": 0
        }
    ],
    "task3_threshold": 0.5
}

response = requests.post(url, json=data, timeout=60)

if response.status_code == 200:
    result = response.json()
    print(f"배치 처리 완료! 총 {len(result['results'])}개 샘플")

    for idx, res in enumerate(result['results']):
        if res['ok']:
            print(f"샘플 {idx+1}: {res['prediction']['task2']['protein_type']}")
        else:
            print(f"샘플 {idx+1}: 실패 - {res['error']}")
else:
    print(f"배치 처리 실패: {response.status_code}")
```

#### 응답 예시
```json
{
  "ok": true,
  "batch": true,
  "model_version": "1.0.0",
  "results": [
    {
      "ok": true,
      "index": 0,
      "id": "sample1",
      "translation": { },
      "prediction": { }
    },
    {
      "ok": true,
      "index": 1,
      "id": "sample2",
      "translation": { },
      "prediction": { }
    }
  ]
}
```

---

### 5. 추론 이력 조회 (Inference History)

**엔드포인트**: `GET /ml/v1/history/`

Django DB에 저장된 추론 이력을 조회합니다.

#### 쿼리 파라미터
- `doctor`: 의사 이름 (선택)
- `patient`: 환자 이름 (선택)

#### 요청 예시 (cURL)
```bash
# 전체 이력 조회
curl -X GET http://localhost:8000/ml/v1/history/

# 특정 의사의 이력 조회
curl -X GET "http://localhost:8000/ml/v1/history/?doctor=doctor_0001"

# 특정 환자의 이력 조회
curl -X GET "http://localhost:8000/ml/v1/history/?patient=patient_0001"
```

#### 요청 예시 (Python requests)
```python
import requests

url = 'http://localhost:8000/ml/v1/history/'
params = {
    'doctor': 'doctor_0001'
}

response = requests.get(url, params=params)

if response.status_code == 200:
    data = response.json()
    print(f"총 {data['count']}개의 이력 발견")

    for log in data['results']:
        print(f"\n=== 추론 ID: {log['id']} ===")
        print(f"의사: {log['doctor_name']}")
        print(f"환자: {log['patient_name']}")
        print(f"시간: {log['created_at']}")
        print(f"결과: {log['output_data']}")
else:
    print(f"조회 실패: {response.status_code}")
```

#### 응답 예시
```json
{
  "count": 10,
  "results": [
    {
      "id": 1,
      "doctor_name": "doctor_0001",
      "patient_name": "patient_0001",
      "input_data": {
        "sequence": "MFVFL...",
        "seq_type": "protein"
      },
      "output_data": {
        "ok": true,
        "prediction": { }
      },
      "created_at": "2025-12-02T10:30:00Z"
    }
  ]
}
```

---

### 6. 모델 재학습 (Retrain Model)

**엔드포인트**: `POST /ml/v1/retrain/`

Flask ML 서버에 모델 재학습을 요청합니다.

#### 요청 Body
```json
{}
```

*참고: Flask 서버에서 모델 재학습을 트리거합니다. 별도 파라미터가 필요한 경우 추가 가능.*

#### 요청 예시 (cURL)
```bash
curl -X POST http://localhost:8000/ml/v1/retrain/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{}'
```

---

### 7. 검토 대기 목록 (Pending Reviews)

**엔드포인트**: `GET /api/v1/custom/predictions/pending_review/`

의사 검토가 필요한 AI 진단 목록을 조회합니다.

#### 요청 예시
```bash
curl -X GET http://localhost:8000/api/v1/custom/predictions/pending_review/ \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 응답 예시
```json
[
  {
    "id": 1,
    "patient": 101,
    "prediction_class": "Glioma",
    "confidence_score": 0.95,
    "created_at": "2025-12-05T10:00:00Z"
  }
]
```

---

### 8. 예측 확정 (Confirm Prediction)

**엔드포인트**: `POST /api/v1/custom/predictions/{id}/confirm_prediction/`

의사의 전문 의견으로 예측 기록을 업데이트합니다.

#### 요청 Body
```json
{
  "doctor_feedback": "Correct",
  "doctor_note": "MRI 스캔을 기반으로 확정함."
}
```

#### 요청 예시 (cURL)
```bash
curl -X POST http://localhost:8000/api/v1/custom/predictions/1/confirm_prediction/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "doctor_feedback": "Correct",
    "doctor_note": "MRI 스캔을 기반으로 확정함."
  }'
```

---

## Django 뷰에서 ML API 호출

### 예제 1: 간단한 추론 요청

```python
# apps/emr/views.py
from django.conf import settings
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
def diagnose_patient(request):
    """
    환자 진단을 위한 AI 추론 요청
    """
    # 요청 데이터 가져오기
    patient_id = request.data.get('patient_id')
    doctor_id = request.data.get('doctor_id')
    sequence_data = request.data.get('sequence')

    # 필수 필드 검증
    if not all([patient_id, doctor_id, sequence_data]):
        return Response(
            {'error': 'patient_id, doctor_id, sequence가 필요합니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Flask ML 서버로 요청 전달
    ml_url = f"{settings.FLASK_INFERENCE_URL}/api/v1/predict"

    payload = {
        "doctor_name": f"Doctor_{doctor_id}",
        "patient_name": f"Patient_{patient_id}",
        "sequence": sequence_data,
        "seq_type": request.data.get('seq_type', 'protein'),
        "task3_threshold": 0.5
    }

    try:
        response = requests.post(
            ml_url,
            json=payload,
            timeout=30
        )
        response.raise_for_status()

        # ML 서버 응답을 클라이언트에게 반환
        ml_result = response.json()

        return Response({
            'success': True,
            'patient_id': patient_id,
            'diagnosis': ml_result
        }, status=status.HTTP_200_OK)

    except requests.exceptions.Timeout:
        return Response(
            {'error': 'ML 서버 응답 시간 초과'},
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except requests.exceptions.RequestException as e:
        return Response(
            {'error': f'ML 서버 오류: {str(e)}'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
```

### 예제 2: 배치 처리

```python
# apps/emr/views.py
from django.conf import settings
import requests
from rest_framework.decorators import api_view
from rest_framework.response import Response

@api_view(['POST'])
def batch_diagnose(request):
    """
    여러 환자의 샘플을 한 번에 분석
    """
    samples = request.data.get('samples', [])

    if not samples:
        return Response(
            {'error': 'samples 배열이 필요합니다.'},
            status=400
        )

    # Flask ML 서버로 배치 요청
    ml_url = f"{settings.FLASK_INFERENCE_URL}/api/v1/predict"

    payload = {
        "doctor_name": request.user.username,
        "patient_name": "Batch Analysis",
        "items": samples,
        "task3_threshold": 0.5
    }

    try:
        response = requests.post(
            ml_url,
            json=payload,
            timeout=60  # 배치는 시간이 더 걸릴 수 있음
        )
        response.raise_for_status()

        ml_result = response.json()

        # 결과 요약
        success_count = sum(1 for r in ml_result['results'] if r['ok'])
        fail_count = len(ml_result['results']) - success_count

        return Response({
            'success': True,
            'total': len(ml_result['results']),
            'success_count': success_count,
            'fail_count': fail_count,
            'results': ml_result['results']
        })

    except requests.exceptions.RequestException as e:
        return Response(
            {'error': f'ML 서버 오류: {str(e)}'},
            status=503
        )
```

### 예제 3: 추론 이력 조회

```python
# apps/ml_proxy/views.py (이미 구현됨)
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import InferenceLog

@require_http_methods(["GET"])
def history_view(request):
    """
    저장된 추론 이력 조회
    """
    doctor_name = request.GET.get('doctor')
    patient_name = request.GET.get('patient')

    queryset = InferenceLog.objects.all().order_by('-created_at')

    if doctor_name:
        queryset = queryset.filter(doctor_name=doctor_name)
    if patient_name:
        queryset = queryset.filter(patient_name=patient_name)

    results = []
    for log in queryset[:100]:  # 최근 100개만
        results.append({
            'id': log.id,
            'doctor_name': log.doctor_name,
            'patient_name': log.patient_name,
            'input_data': log.input_data,
            'output_data': log.output_data,
            'created_at': log.created_at.isoformat()
        })

    return JsonResponse({
        'count': len(results),
        'results': results
    })
```

---

## React/Flutter 통합

### React (Axios)

```javascript
// src/services/mlService.js
import axios from 'axios';

const ML_API_BASE = '/ml/v1';

export const mlService = {
  // 헬스 체크
  async checkHealth() {
    const response = await axios.get(`${ML_API_BASE}/status/`);
    return response.data;
  },

  // AI 추론 (단일)
  async predict(sequenceData) {
    const response = await axios.post(`${ML_API_BASE}/predict/`, {
      doctor_name: 'doctor_0001',
      patient_name: 'patient_0001',
      sequence: sequenceData.sequence,
      seq_type: sequenceData.seqType || 'protein',
      task3_threshold: 0.5
    }, {
      timeout: 30000  // 30초
    });
    return response.data;
  },

  // AI 추론 (배치)
  async batchPredict(samples) {
    const response = await axios.post(`${ML_API_BASE}/predict/`, {
      doctor_name: 'doctor_0001',
      patient_name: 'Batch',
      items: samples,
      task3_threshold: 0.5
    }, {
      timeout: 60000  // 60초
    });
    return response.data;
  },

  // 추론 이력 조회
  async getHistory(filters = {}) {
    const params = new URLSearchParams(filters);
    const response = await axios.get(`${ML_API_BASE}/history/?${params}`);
    return response.data;
  }
};
```

### Flutter (Dart)

```dart
// lib/services/ml_service.dart
import 'dart:convert';
import 'package:http/http.dart' as http;

class MLService {
  static const String baseUrl = 'http://your-domain.com/ml/v1';

  // 헬스 체크
  static Future<Map<String, dynamic>> checkHealth() async {
    final response = await http.get(
      Uri.parse('$baseUrl/status/'),
    );

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to check ML server health');
    }
  }

  // AI 추론 (단일)
  static Future<Map<String, dynamic>> predict({
    required String doctorName,
    required String patientName,
    required String sequence,
    String seqType = 'protein',
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/predict/'),
      headers: {'Content-Type': 'application/json'},
      body: json.encode({
        'doctor_name': doctorName,
        'patient_name': patientName,
        'sequence': sequence,
        'seq_type': seqType,
        'task3_threshold': 0.5,
      }),
    ).timeout(Duration(seconds: 30));

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('ML prediction failed: ${response.body}');
    }
  }

  // 추론 이력 조회
  static Future<Map<String, dynamic>> getHistory({
    String? doctor,
    String? patient,
  }) async {
    var uri = Uri.parse('$baseUrl/history/');

    if (doctor != null || patient != null) {
      uri = uri.replace(queryParameters: {
        if (doctor != null) 'doctor': doctor,
        if (patient != null) 'patient': patient,
      });
    }

    final response = await http.get(uri);

    if (response.statusCode == 200) {
      return json.decode(response.body);
    } else {
      throw Exception('Failed to get ML history');
    }
  }
}
```

---

## 에러 처리

### 주요 에러 코드

| 상태 코드 | 의미 | 원인 |
|----------|------|------|
| 400 | Bad Request | 잘못된 요청 데이터 (필수 필드 누락, 형식 오류 등) |
| 503 | Service Unavailable | Flask 서버 연결 실패 (서버 다운, 네트워크 오류) |
| 504 | Gateway Timeout | Flask 서버 응답 시간 초과 (처리 시간 과다) |
| 502 | Bad Gateway | Flask 서버 응답 오류 (잘못된 응답 형식) |
| 500 | Internal Server Error | Django 내부 오류 (코드 에러, DB 오류) |

### 에러 응답 예시

```json
{
  "error": "Cannot connect to Flask server: Connection refused"
}
```

---

## 테스트

### Django Shell에서 테스트

```bash
# Django 컨테이너 접속
docker exec -it django bash

# Django shell 실행
python manage.py shell
```

```python
import requests

# Flask 서버 상태 확인
response = requests.get('http://127.0.0.1:9000/health')
print(response.json())

# Django를 통한 프록시 테스트
response = requests.get('http://127.0.0.1:8000/ml/v1/status/')
print(response.json())

# 추론 테스트
data = {
    "doctor_name": "doctor_0001",
    "patient_name": "patient_0001",
    "sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
    "seq_type": "protein"
}
response = requests.post('http://127.0.0.1:8000/ml/v1/predict/', json=data)
print(response.json())
```

### cURL로 테스트

```bash
# Flask 직접 호출 (로컬 전용)
curl http://127.0.0.1:9000/health

# Django를 통한 프록시 호출
curl http://localhost:8000/ml/v1/status/

# 추론 요청
curl -X POST http://localhost:8000/ml/v1/predict/ \
  -H "Content-Type: application/json" \
  -d '{
    "doctor_name": "doctor_0001",
    "patient_name": "patient_0001",
    "sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
    "seq_type": "protein"
  }'
```

---

## 주의사항

1. **Flask는 로컬 전용**
   - Flask는 `127.0.0.1:9000`에서만 동작
   - 외부에서 Flask로 직접 접근 불가
   - 반드시 Django를 통해 접근

2. **타임아웃 설정**
   - 단일 추론: 30초
   - 배치 추론: 60초
   - 재학습: 300초 (5분)

3. **보안**
   - 프로덕션에서는 JWT 인증 추가 권장
   - API 키 검증 구현 고려

4. **로깅**
   - 모든 추론 요청/응답은 Django DB에 자동 저장
   - `InferenceLog` 모델 참고

---

## 참고 문서

- [API 통합 명세서](./13_API_통합명세서.md)
- [배포 가이드](./09_배포가이드.md)
- [시스템 아키텍처](./ARCHITECTURE.md)
- [Flask AI 통합](./12_flask_ai_integration.md)
- [Django-Flask 통신](./11_DJANGO_FLASK_COMMUNICATION.md)

---

**작성자**: Claude Code
**버전**: 2.0
**라이선스**: NeuroNova 프로젝트 내부 문서
