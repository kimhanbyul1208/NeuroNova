# NeuroNova Quick Start Guide

## 🚀 서버 실행 순서

### 1. Flask ML 서버 실행 (포트 9000)
```bash
cd backend/flask_inference
python app.py
```

**확인:**
```bash
curl http://127.0.0.1:9000/health
# 응답: {"ok": true, "status": "alive", "model_version": "..."}
```

### 2. Django 백엔드 서버 실행 (포트 8000)
```bash
cd backend/django_main
python manage.py runserver
```

**확인:**
```bash
curl http://localhost:8000/ml/v1/status/
# 응답: {"ok": true, "status": "alive", "model_version": "..."}
```

### 3. React 프론트엔드 실행 (포트 5173)

**Windows CMD/PowerShell:**
```bash
cd frontend\react_web
npm install  # 처음 한 번만
npm run dev
```

**WSL/Linux:**
```bash
cd /mnt/c/Users/302-28/Desktop/final_pr/frontend/react_web
npm install  # 처음 한 번만
npm run dev
```

**접속:** http://localhost:5173

---

## 🧪 API 테스트 (Postman)

### Postman 컬렉션 불러오기
1. Postman 실행
2. Import → File → `django_ml_postman_collection.json` 선택
3. 8개의 API 엔드포인트 사용 가능

### 주요 API 엔드포인트

#### 1. 단일 예측
```bash
POST http://localhost:8000/ml/v1/predict/
Content-Type: application/json

{
  "doctor_name": "doctor_0001",
  "patient_name": "patient_0001",
  "sequence": "MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHS",
  "seq_type": "protein",
  "task3_threshold": 0.5
}
```

#### 2. 배치 예측 (3개 샘플)
```bash
POST http://localhost:8000/ml/v1/predict/
Content-Type: application/json

{
  "doctor_name": "doctor_0001",
  "patient_name": "patient_0002",
  "items": [
    {
      "id": "sample_1",
      "sequence": "MFVFLVLLPL...",  // SARS-CoV-2 Spike
      "seq_type": "protein"
    },
    {
      "id": "sample_2",
      "sequence": "MSDNGPQNQR...",  // Influenza A Nucleocapsid
      "seq_type": "protein"
    },
    {
      "id": "sample_3",
      "sequence": "MKTIIALSYI...",  // Influenza A Hemagglutinin
      "seq_type": "protein"
    }
  ],
  "task3_threshold": 0.5
}
```

#### 3. 추론 이력 조회
```bash
GET http://localhost:8000/ml/v1/history/
GET http://localhost:8000/ml/v1/history/?doctor=doctor_0001
GET http://localhost:8000/ml/v1/history/?patient=patient_0001
```

---

## 🎯 React에서 예시 데이터 사용하기

1. **항원 검사 페이지 접속**
   - 로그인 후 왼쪽 메뉴에서 "항원 검사" 클릭

2. **환자 선택**
   - 검사할 환자 선택 → "검사 시작" 버튼 클릭

3. **예시 데이터 로드**
   - **"예시 데이터 로드" 버튼** 클릭
   - 자동으로 3개의 단백질 서열이 입력됨:
     - SARS-CoV-2 Spike Protein
     - Influenza A Nucleocapsid
     - Influenza A Hemagglutinin

4. **AI 예측 실행**
   - **"AI 예측 실행" 버튼** 클릭
   - 약 5-10초 후 결과 표시

5. **결과 확인**
   - Task 1: Pathogen/Non-Pathogen 분류
   - Task 2: 단백질 타입 (Nucleocapsid, Hemagglutinin 등)
   - Task 3: 상위 예측 결과 (Top 3)
   - "상세보기" 클릭 → 3D 단백질 구조 확인

---

## 📊 응답 형식

### 단일 예측 응답
```json
{
  "ok": true,
  "model_version": "facebook/esm2_t33_650M_UR50D",
  "prediction": {
    "task1": {
      "prediction": "Pathogen",
      "confidence": 0.9998,
      "probabilities": {
        "Host": 0.0002,
        "Pathogen": 0.9998
      }
    },
    "task2": {
      "prediction": "None",
      "confidence": 0.9989,
      "probabilities": {
        "COVID-19": 0.0000,
        "Common_Cold": 0.0009,
        "Influenza": 0.0001,
        "None": 0.9989
      }
    },
    "task3": {
      "top_predictions": [
        ["Other", 0.9999],
        ["Host_Protein", 0.0001],
        ["Spike", 0.0000]
      ]
    }
  },
  "task3_structure": {
    "protein_name": "Other",
    "preferred_3d": null,
    "uniprot_hits": []
  }
}
```

### 배치 예측 응답
```json
{
  "ok": true,
  "batch": true,
  "model_version": "facebook/esm2_t33_650M_UR50D",
  "results": [
    {
      "ok": true,
      "id": "sample_1",
      "index": 0,
      "prediction": { ... },
      "task3_structure": { ... }
    },
    {
      "ok": true,
      "id": "sample_2",
      "index": 1,
      "prediction": { ... },
      "task3_structure": { ... }
    }
  ]
}
```

---

## 🐛 트러블슈팅

### Flask 서버 연결 오류
```bash
# Flask 서버가 실행 중인지 확인
curl http://127.0.0.1:9000/health

# 포트 9000이 사용 중인지 확인 (Windows)
netstat -ano | findstr :9000

# 포트 9000이 사용 중인지 확인 (Linux)
lsof -i :9000
```

### Django 마이그레이션 오류
```bash
cd backend/django_main
python manage.py migrate
```

### React 빌드 오류
```bash
cd frontend/react_web
rm -rf node_modules package-lock.json
npm install
npm run dev
```

### CORS 오류
Django `settings.py`에서 CORS 설정 확인:
```python
CORS_ALLOW_ALL_ORIGINS = True  # 개발 환경에서만
```

---

## 📝 주요 파일 위치

### Backend
- Flask 서버: `backend/flask_inference/app.py`
- Django Proxy: `backend/django_main/apps/ml_proxy/views.py`
- API 라우트: `backend/flask_inference/api/routes.py`
- ML 모델: `backend/flask_inference/ml/model.py`

### Frontend
- 항원 검사 페이지: `frontend/react_web/src/pages/AntigenResultPage.jsx`
- API 설정: `frontend/react_web/src/utils/config.js`
- Axios 클라이언트: `frontend/react_web/src/api/axios.js`

### 데이터베이스
- 추론 이력 모델: `backend/django_main/apps/ml_proxy/models.py`
- 테이블: `ml_inference_log` (Django DB)

---

## 🎓 예시 서열 데이터

### SARS-CoV-2 Spike Protein (1273 aa)
```
MFVFLVLLPLVSSQCVNLTTRTQLPPAYTNSFTRGVYYPDKVFRSSVLHSTQDLFLPFFSNVTWFHAIHVSGTNGTKRFDNPVLPFNDGVYFASTEKSNIIRGWIFGTTLDSKTQSLLIVNNATNVVIKVCEFQFCNDPFLGVYYHKNNKSWMESEFRVYSSANNCTFEYVSQPFLMDLEGKQGNFKNLREFVFKNIDGYFKIYSKHTPINLVRDLPQGFSALEPLVDLPIGINITRFQTLLALHRSYLTPGDSSSGWTAGAAAYYVGYLQPRTFLLKYNENGTITDAVDCALDPLSETKCTLKSFTVEKGIYQTSNFRVQPTESIVRFPNITNLCPFGEVFNATRFASVYAWNRKRISNCVADYSVLYNSASFSTFKCYGVSPTKLNDLCFTNVYADSFVIRGDEVRQIAPGQTGKIADYNYKLPDDFTGCVIAWNSNNLDSKVGGNYNYLYRLFRKSNLKPFERDISTEIYQAGSTPCNGVEGFNCYFPLQSYGFQPTNGVGYQPYRVVVLSFELLHAPATVCGPKKSTNLVKNKCVNF
```

### Influenza A Nucleocapsid (498 aa)
```
MSDNGPQNQRNAPRITFGGPSDSTGSNQNGERSGARSKQRRPQGLPNNTASWFTALTQHGKEDLKFPRGQGVPINTNSSPDDQIGYYRRATRRIRGGDGKMKDLSPRWYFYYLGTGPEAGLPYGANKDGIIWVATEGALNTPKDHIGTRNPANNAAIVLQLPQGTTLPKGFYAEGSRGGSQASSRSSSRSRNSSRNSTPGSSRGTSPARMAGNGGDAALALLLLDRLNQLESKMSGKGQQQQGQTVTKKSAAEASKKPRQKRTATKAYNVTQAFGRRGPEQTQGNFGDQELIRQGTDYKHWPQIAQFAPSASAFFGMSRIGMEVTPSGTWLTYTGAIKLDDKDPNFKDQVILLNKHIDAYKTFPPTEPKKDKKKKADETQALPQRQKKQQTVTLLPAADLDDFSKQLQQSMSSADSTQA
```

### Influenza A Hemagglutinin (329 aa)
```
MKTIIALSYIFCLVLGQDLPGNDNSTATLCLGHHAVPNGTLVKTITDDQIEVTNATELVQSSSTGKICNNPHRILDGIDCTLIDALLGDPHCDVFQNETWDLFVERSKAFSNCYPYDVPDYASLRSLVASSGTLEFITEGFTWTGVTQNGGSNACKRGPGSGFFSRLNWLTKSGSTYPVLNVTMPNNDNFDKLYIWGIHHPSTNQEQTSLYVQASGRVTVSTRRSQQTIIPNIGSRPWVRGLSSRISIYWTIVKPGDVLVINSNGNLIAPRGYFKMRTGKSSIMRSDAPIDTCISECITPNGSIPNDKPFQNVNKITYGACPKYVKQNTLKLATGMRNVPEKQT
```

---

## 📧 문의
문제가 발생하면 GitHub Issues에 등록하거나 개발팀에 문의하세요.
