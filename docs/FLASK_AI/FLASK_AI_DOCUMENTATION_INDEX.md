# Flask AI 추론 엔진 - 문서 인덱스

> NeuroNova Flask AI Inference Engine 완전 가이드

## 📚 문서 개요

Flask AI 추론 엔진은 NeuroNova CDSS 시스템의 핵심 AI 컴포넌트로, 3가지 주요 AI 모델을 제공합니다:

1. **CT 기반 뇌종양 분류** (Classification)
2. **MRI 기반 종양 세분화** (Segmentation)
3. **바이오마커 기반 예측** (Biomarker Prediction)

각 모델은 **설명 가능한 AI(XAI)** 기능을 포함하여 의료진이 AI 예측을 신뢰할 수 있도록 합니다.

---

## 🗺️ 문서 읽기 순서

### 1단계: API 설계 이해하기 (필수)

**📄 [FLASK_AI_API_DESIGN.md](FLASK_AI_API_DESIGN.md)**

- **목적**: Flask AI 서버의 API 명세 이해
- **주요 내용**:
  - 3개 AI 모델별 API 엔드포인트 상세 명세
  - Request/Response 포맷
  - XAI 통합 (Grad-CAM, SHAP)
  - 에러 코드 및 보안 정책
- **대상**: 백엔드 개발자, Django 통합 담당자

**핵심 API 엔드포인트**:
```
POST /predict/ct_classification       # CT 종양 분류 (2-5초)
POST /predict/mri_segmentation        # MRI 종양 분할 (비동기)
POST /predict/biomarker_prediction    # 바이오마커 예측 (1-2초)
GET  /predict/task_status/<task_id>   # 비동기 작업 상태 조회
```

### 2단계: Django-Flask 통신 패턴 학습 (필수)

**📄 [DJANGO_FLASK_COMMUNICATION.md](DJANGO_FLASK_COMMUNICATION.md)**

- **목적**: Django와 Flask 간 통신 방법 이해
- **주요 내용**:
  - 동기 통신 (CT 분류, 바이오마커 예측)
  - 비동기 통신 (MRI 분할)
  - Human-in-the-loop 워크플로우
  - 시퀀스 다이어그램
  - 에러 핸들링 패턴
- **대상**: Full-stack 개발자, 시스템 아키텍트

**통신 패턴 요약**:
- **동기**: Django → Flask (HTTP POST) → 즉시 응답
- **비동기**: Django → Flask (Celery) → Task ID 반환 → 폴링

### 3단계: 구현 가이드 (개발 시 참조)

#### Part 1: 기본 구조 및 AI 코어

**📄 [FLASK_IMPLEMENTATION_GUIDE.md](FLASK_IMPLEMENTATION_GUIDE.md)**

- **목적**: Flask 프로젝트 기본 구조 및 AI 코어 구현
- **주요 내용**:
  - 프로젝트 디렉토리 구조
  - 환경 설정 (config.py)
  - 모델 로딩 및 관리
  - DICOM 이미지 전처리
  - XAI 구현 (Grad-CAM, SHAP)
- **대상**: AI 엔지니어, 머신러닝 개발자

**핵심 구현**:
```python
# 모델 로딩
model_loader = get_model_loader(config)
ct_model = model_loader.load_onnx_model('models/ct_classifier/model.onnx')

# 예측
classifier = CTClassifier(ct_model, config)
result = classifier.predict(preprocessed_image)

# Grad-CAM 생성
grad_cam = GradCAM(model, target_layer='layer4')
heatmap, confidence = grad_cam.generate_cam(input_tensor)
```

#### Part 2: API 및 비동기 처리

**📄 [FLASK_IMPLEMENTATION_GUIDE_PART2.md](FLASK_IMPLEMENTATION_GUIDE_PART2.md)**

- **목적**: REST API 엔드포인트 및 Celery 비동기 작업 구현
- **주요 내용**:
  - Flask Blueprint 기반 API 라우팅
  - CT/MRI/Biomarker 엔드포인트 구현
  - Celery 비동기 태스크
  - Request validation
  - 중앙화된 에러 핸들링
- **대상**: 백엔드 개발자, API 개발자

**핵심 구현**:
```python
# Synchronous API
@ct_bp.route('/ct_classification', methods=['POST'])
@require_jwt
def predict_ct_classification():
    # Validate, preprocess, predict
    result = classifier.predict(image)
    return jsonify({'success': True, 'result': result}), 200

# Asynchronous Task
@celery.task(bind=True, base=InferenceTask)
def async_mri_segmentation(self, image_data, patient_id, options):
    # Long-running segmentation task
    result = segmentor.predict(volume)
    return result
```

#### Part 3: 테스트 및 배포

**📄 [FLASK_IMPLEMENTATION_GUIDE_PART3.md](FLASK_IMPLEMENTATION_GUIDE_PART3.md)**

- **목적**: 테스트 전략 및 프로덕션 배포
- **주요 내용**:
  - pytest 기반 단위 테스트
  - API 통합 테스트
  - Docker 컨테이너화
  - Docker Compose 오케스트레이션
  - Nginx 리버스 프록시
  - Prometheus 모니터링
- **대상**: DevOps 엔지니어, QA 엔지니어

**테스트 실행**:
```bash
# 모든 테스트 실행
pytest

# 커버리지 포함
pytest --cov=app --cov-report=html

# API 테스트만
pytest tests/test_api.py -v
```

**배포**:
```bash
# Docker Compose로 전체 스택 실행
docker-compose -f docker-compose.prod.yml up -d

# 헬스 체크
curl http://localhost:5000/health

# 로그 확인
docker-compose logs -f flask_inference
```

---

## 📊 문서 매트릭스

| 문서 | 읽기 우선순위 | 독자 대상 | 예상 소요 시간 |
|------|--------------|----------|--------------|
| FLASK_AI_API_DESIGN.md | ⭐⭐⭐⭐⭐ | 전체 개발자 | 30분 |
| DJANGO_FLASK_COMMUNICATION.md | ⭐⭐⭐⭐⭐ | 백엔드 개발자 | 25분 |
| FLASK_IMPLEMENTATION_GUIDE.md | ⭐⭐⭐⭐ | AI/ML 개발자 | 60분 |
| FLASK_IMPLEMENTATION_GUIDE_PART2.md | ⭐⭐⭐⭐ | 백엔드 개발자 | 45분 |
| FLASK_IMPLEMENTATION_GUIDE_PART3.md | ⭐⭐⭐ | DevOps 엔지니어 | 40분 |

---

## 🎯 역할별 필독 문서

### 프로젝트 매니저 / 아키텍트
1. ✅ FLASK_AI_API_DESIGN.md (API 개요)
2. ✅ DJANGO_FLASK_COMMUNICATION.md (시스템 통합)

### Django 백엔드 개발자
1. ✅ FLASK_AI_API_DESIGN.md (API 명세)
2. ✅ DJANGO_FLASK_COMMUNICATION.md (통신 패턴)
3. ⚠️ FLASK_IMPLEMENTATION_GUIDE_PART2.md (API 구현 참고)

### Flask/AI 백엔드 개발자
1. ✅ FLASK_AI_API_DESIGN.md (API 명세)
2. ✅ FLASK_IMPLEMENTATION_GUIDE.md (AI 코어)
3. ✅ FLASK_IMPLEMENTATION_GUIDE_PART2.md (API 구현)
4. ⚠️ FLASK_IMPLEMENTATION_GUIDE_PART3.md (테스트/배포)

### AI/ML 엔지니어
1. ✅ FLASK_AI_API_DESIGN.md (모델 요구사항)
2. ✅ FLASK_IMPLEMENTATION_GUIDE.md (모델 로딩, 전처리, XAI)
3. ⚠️ DJANGO_FLASK_COMMUNICATION.md (통합 이해)

### DevOps 엔지니어
1. ⚠️ FLASK_AI_API_DESIGN.md (시스템 개요)
2. ✅ FLASK_IMPLEMENTATION_GUIDE_PART3.md (배포/모니터링)
3. 📄 [PRODUCTION_DEPLOYMENT_GUIDE.md](PRODUCTION_DEPLOYMENT_GUIDE.md) (전체 시스템 배포)

### QA 엔지니어
1. ✅ FLASK_AI_API_DESIGN.md (API 명세)
2. ✅ FLASK_IMPLEMENTATION_GUIDE_PART3.md (테스트 전략)
3. 📄 [TESTING_GUIDE.md](TESTING_GUIDE.md) (전체 테스트 가이드)

---

## 🔗 관련 문서

### 전체 시스템
- 📘 [README.md](../README.md) - 프로젝트 개요
- 🏗️ [프로젝트 상세 명세](NeuroNova_Context.md)
- 💾 [데이터베이스 설계](최종%20DB.txt)

### 다른 컴포넌트
- ⚛️ [Frontend 구현 가이드](FRONTEND_IMPLEMENTATION_GUIDE.md) - React/Flutter
- 🐍 Django Backend (참조: `backend/django_main/apps/`)
- 📦 [프로덕션 배포 가이드](PRODUCTION_DEPLOYMENT_GUIDE.md)
- 🧪 [테스트 가이드](TESTING_GUIDE.md)

### Firebase & 알림
- 🔥 [Firebase 설정 가이드](FIREBASE_SETUP_GUIDE.md) - FCM 푸시 알림
- 📊 [Firebase 설정 진행 상황](../FIREBASE_SETUP_STATUS.md)

---

## 🚀 빠른 시작 (Quick Start)

### 1. API 명세 확인 (5분)
```bash
# API 설계 문서 읽기
cat docs/FLASK_AI_API_DESIGN.md | grep "POST /predict"
```

**결과**: 3개 API 엔드포인트 이해

### 2. Django 통합 코드 작성 (10분)

[DJANGO_FLASK_COMMUNICATION.md](DJANGO_FLASK_COMMUNICATION.md) 참조

```python
# backend/django_main/apps/emr/views.py

@api_view(['POST'])
def predict_ct_tumor(request):
    flask_url = f"{settings.FLASK_INFERENCE_URL}/predict/ct_classification"

    response = requests.post(flask_url,
                           files={'image': dicom_file},
                           data={'patient_id': patient_id},
                           timeout=30)

    result = response.json()
    # Save to PatientPredictionResult model
    return Response(result)
```

### 3. Flask 프로젝트 구조 생성 (15분)

[FLASK_IMPLEMENTATION_GUIDE.md](FLASK_IMPLEMENTATION_GUIDE.md) - 프로젝트 구조 참조

```bash
mkdir -p backend/flask_inference/app/{models,api,preprocessing,xai,tasks,utils}
cd backend/flask_inference
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 4. 테스트 실행 (5분)

```bash
# 단위 테스트
pytest tests/test_models.py -v

# API 테스트
pytest tests/test_api.py -v
```

---

## 💡 주요 개념 정리

### XAI (Explainable AI)

**Grad-CAM** (CT 이미지):
- CNN 모델의 특정 레이어 활성화 맵 시각화
- 어느 영역이 분류에 중요했는지 히트맵으로 표시
- 의료진이 AI 판단 근거 확인 가능

**SHAP** (바이오마커 데이터):
- 각 feature가 예측에 미친 영향 정량화
- Feature importance 순위 제공
- 긍정적/부정적 기여도 분석

### 동기 vs 비동기

| 모델 | 처리 방식 | 소요 시간 | 이유 |
|-----|----------|----------|-----|
| CT 분류 | 동기 | 2-5초 | 실시간 응답 가능 |
| MRI 분할 | 비동기 | 30-120초 | 3D 볼륨 처리 무거움 |
| 바이오마커 | 동기 | 1-2초 | 단순 ML 모델 |

### Human-in-the-Loop

1. AI가 자동 예측
2. 의사가 검토 및 수정
3. 수정 사항이 Django DB에 저장
4. 추후 모델 재학습에 활용

---

## 📝 체크리스트

### Flask AI 서버 개발 체크리스트

#### Phase 1: 설계 (완료 ✅)
- [x] API 명세 작성
- [x] Django-Flask 통신 패턴 정의
- [x] 프로젝트 구조 설계
- [x] 구현 가이드 작성

#### Phase 2: 개발 (대기 중 ⏳)
- [ ] 프로젝트 구조 생성
- [ ] 모델 로더 구현
- [ ] 이미지 전처리 파이프라인 구현
- [ ] XAI 모듈 구현 (Grad-CAM, SHAP)
- [ ] API 엔드포인트 구현
- [ ] Celery 비동기 작업 구현

#### Phase 3: 테스트 (대기 중 ⏳)
- [ ] 단위 테스트 작성 (목표: >90% 커버리지)
- [ ] API 통합 테스트
- [ ] Django-Flask 통합 테스트
- [ ] 부하 테스트

#### Phase 4: 배포 (대기 중 ⏳)
- [ ] Dockerfile 작성
- [ ] Docker Compose 설정
- [ ] Nginx 설정
- [ ] 모니터링 구성 (Prometheus)
- [ ] 로깅 구성
- [ ] 프로덕션 배포

---

## 🆘 문제 해결

### 자주 묻는 질문 (FAQ)

**Q: Flask AI 서버는 어디서 실행되나요?**
- A: 별도의 GPU 서버에서 실행됩니다. Django와는 독립적인 서비스입니다.

**Q: Django에서 Flask API를 어떻게 호출하나요?**
- A: [DJANGO_FLASK_COMMUNICATION.md](DJANGO_FLASK_COMMUNICATION.md) 참조. `requests` 라이브러리 사용.

**Q: MRI 분할은 왜 비동기인가요?**
- A: 3D 볼륨 처리에 30초~2분 소요. 동기로 하면 Django 요청이 타임아웃됩니다.

**Q: XAI는 모든 예측에 필수인가요?**
- A: 아니요. Request에서 `xai=true` 파라미터로 선택적 활성화 가능합니다.

**Q: 모델 파일은 어디에 저장하나요?**
- A: `backend/flask_inference/models/` 디렉토리. Git에는 업로드하지 않습니다 (.gitignore).

### 오류 해결

**ImportError: No module named 'app'**
```bash
# 해결: PYTHONPATH 설정
export PYTHONPATH="${PYTHONPATH}:/path/to/backend/flask_inference"
```

**Celery 작업이 실행되지 않음**
```bash
# Redis 연결 확인
redis-cli ping

# Celery worker 로그 확인
celery -A app.tasks.celery_app worker --loglevel=debug
```

**GPU 메모리 부족**
- 해결 1: `config.py`에서 `BATCH_SIZE` 줄이기
- 해결 2: Mixed precision 사용 (FP16)
- 해결 3: 모델 경량화 (ONNX 최적화)

---

## 📞 지원

- **문서 관련 이슈**: [docs/README.md](README.md)
- **코드 관련 이슈**: `backend/flask_inference/README.md` (작성 예정)
- **전체 프로젝트**: [README.md](../README.md)

---

**마지막 업데이트**: 2025-11-28
**문서 버전**: 1.0.0
**작성자**: Claude Code

---

## 다음 단계

1. ✅ **문서 검토 완료** - 모든 Flask AI 문서 작성 완료
2. ⏳ **AI 모델 학습** - Google Colab에서 3개 모델 학습
3. ⏳ **Flask 서버 구현** - 이 가이드를 따라 구현
4. ⏳ **Django 통합** - Django에서 Flask API 호출 구현
5. ⏳ **통합 테스트** - End-to-end 테스트
6. ⏳ **프로덕션 배포** - GPU 서버에 배포

**현재 상태**: API 설계 및 구현 가이드 완료. 모델 학습 및 구현 대기 중. ✅
