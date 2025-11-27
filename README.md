# NeuroNova - 뇌종양 진단 CDSS

**팀명**: NeuroNova (Neurology + Nova - 뇌과학의 새로운 별)

## 프로젝트 개요

뇌종양 진단을 위한 임상 의사결정 지원 시스템(Clinical Decision Support System)

### 핵심 가치
- 병원성 정의
- 연구 필요성
- 데이터 보안 (익명화)
- 시스템 통합 (EMR Integration)

## 시스템 아키텍처

```
[Flutter App, React Web]
        ↓
   [Nginx - Gunicorn]
        ↓
    [Django] ←→ [Flask (AI), PostgreSQL, Orthanc (DICOM)]
```

## 기술 스택

### Frontend
- **React**: 의료진용 웹 대시보드
- **Flutter**: 환자용 모바일 앱

### Backend
- **Django**: 메인 API 서버, Auth, DB 관리
- **Flask**: AI 추론 엔진 (GPU)
- **Nginx + Gunicorn**: 배포 서버

### Database & Storage
- **PostgreSQL**: 메인 데이터베이스
- **Redis**: 캐싱 및 큐
- **Orthanc**: DICOM 의료 영상 서버

### AI/ML
- **Google Colab**: 모델 학습 및 튜닝
- **ONNX**: 모델 배포 포맷

## 프로젝트 구조

```
final_pr/
├── backend/
│   ├── django_main/          # Django 메인 서버
│   └── flask_inference/      # Flask AI 추론 서버
├── frontend/
│   ├── react_web/            # React 의료진 웹
│   └── flutter_app/          # Flutter 환자 앱
├── config/                   # 설정 파일 (Nginx, Docker 등)
├── docs/                     # 프로젝트 문서
└── README.md
```

## 주요 기능

### 의료진 (React Web)
- 환자 진료 기록 관리 (SOAP 차트)
- AI 진단 결과 확인 및 검증
- DICOM 영상 뷰어 (Orthanc 통합)
- 예약 관리 및 처방전 발급

### 환자 (Flutter App)
- 병원 예약 및 알림
- 진료 요약 조회
- 암호화된 로컬 저장 (90일 자동 삭제)
- Push Notification

### AI 진단
- 뇌종양 분류 (Glioma, Meningioma, Pituitary)
- 설명가능한 AI (XAI) - SHAP, Grad-CAM
- Human-in-the-loop (의사 피드백)

## 보안 정책

- **데이터 익명화**: PII 제거 후 AI 서버 전송
- **암호화**: 환자 앱 데이터 SQLCipher 암호화
- **자동 삭제**: 환자 로컬 데이터 90일 후 자동 삭제
- **RBAC**: 역할 기반 접근 제어 (Admin, Doctor, Nurse, Patient)

## 설치 및 실행

### 필수 요구사항
- Python 3.9+
- Node.js 18+
- Flutter 3.0+
- PostgreSQL 14+
- Redis 6+

### 백엔드 설치
```bash
# Django 서버
cd backend/django_main
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# Flask AI 서버
cd backend/flask_inference
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python app.py
```

### 프론트엔드 설치
```bash
# React 웹
cd frontend/react_web
npm install
npm start

# Flutter 앱
cd frontend/flutter_app
flutter pub get
flutter run
```

## 개발 가이드라인

### Design Patterns
1. **Factory Pattern**: AI 모델 로딩
2. **Strategy Pattern**: 알림 발송 방식 (Email/Push)
3. **DTO/Serializer**: Django-Flask 간 데이터 검증

### Coding Standards
- **Soft-coding**: 환경변수 사용 (.env)
- **변수명**: `base_url`, `api_key`, `project_name_ver0`
- **보안**: 하드코딩 금지, 설정 파일 분리

## 팀원 및 업무 분담

TBD

## 라이선스

TBD

## 참고 문서

- [프로젝트 상세 명세](docs/NeuroNova_Context.md)
- [데이터베이스 설계](docs/최종%20DB.txt)
- [구현 순서](docs/구현순서.txt)
