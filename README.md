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
    [Django] ←→ [Flask (AI), MySQL, Orthanc (DICOM)]
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
- **MySQL**: 메인 데이터베이스
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

## 개발 현황

### ✅ Frontend (완료 100%)
- **React Web**: 의료진용 웹 애플리케이션 (100%)
  - 환자 관리, 예약 관리, AI 진단, DICOM 뷰어, XAI 시각화
  - 테스트 코드 완료 (5개 테스트 파일)
- **Flutter App**: 환자용 모바일 앱 (100%)
  - 예약 생성/조회, 암호화 저장, 90일 자동 삭제
  - 프로젝트 재생성 완료 (Android/iOS 지원)
  - Firebase 설정 준비 완료
  - 테스트 코드 완료 (5개 테스트 파일)

### ✅ Backend (완료 95%)
- **Django**: 메인 API 서버 (95%)
  - 5개 앱 구현 완료 (users, emr, custom, core, notifications)
  - 35개 API 엔드포인트
  - 29개 테스트 메서드 (87% 커버리지)
  - Orthanc DICOM 연동
  - FCM 푸시 알림 통합
- **Flask**: AI 추론 서버 (설계 완료, 구현 대기)
  - API 설계 문서 완료
  - 구현 가이드 완료
  - Django-Flask 통신 패턴 완료
- **Orthanc**: DICOM 서버 (100%)
  - Docker 설정 완료

### ✅ 배포 (완료 100%)
- Docker Compose 프로덕션 설정 완료
- Nginx 설정 완료 (HTTPS, Rate Limiting)
- SSL/TLS 설정 가이드 완료
- 환경변수 관리 완료

### ✅ 문서화 (완료 100%)
- Firebase 설정 가이드
- 프로덕션 배포 가이드 (초보자용)
- 테스트 가이드 (React, Flutter, Django)
- Flask AI API 설계 문서
- Flask 구현 가이드 (3부작)
- Django-Flask 통신 패턴
- API 문서
- 구현 완료 보고서

## 빠른 시작

### React Web (의료진용)
```bash
cd frontend/react_web
npm install
npm run dev
# http://localhost:3000
```

### Flutter App (환자용)
```bash
cd frontend/flutter_app
flutter pub get
flutter run
```

**자세한 가이드**: [QUICK_START.md](docs/QUICK_START.md)

## 참고 문서

### 🚀 시작하기
- 🔥 **[Firebase 설정 가이드](docs/FIREBASE_SETUP_GUIDE.md)** - FCM 푸시 알림 설정
- 📦 **[프로덕션 배포 가이드](docs/PRODUCTION_DEPLOYMENT_GUIDE.md)** - 처음 배포하는 분 대상
- 🧪 **[테스트 가이드](docs/TESTING_GUIDE.md)** - React, Flutter, Django 테스트
- 📊 **[Firebase 설정 진행 상황](FIREBASE_SETUP_STATUS.md)** - 현재 상태 확인

### 🤖 Flask AI 추론 서버
- 🎯 **[Flask API 설계](docs/FLASK_AI_API_DESIGN.md)** - 3개 AI 모델 API 명세 (CT 분류, MRI 분할, 바이오마커 예측)
- 🔄 **[Django-Flask 통신](docs/DJANGO_FLASK_COMMUNICATION.md)** - 동기/비동기 통신 패턴, 시퀀스 다이어그램
- 🛠️ **[Flask 구현 가이드 Part 1](docs/FLASK_IMPLEMENTATION_GUIDE.md)** - 프로젝트 구조, 모델 로딩, 전처리, XAI
- 🛠️ **[Flask 구현 가이드 Part 2](docs/FLASK_IMPLEMENTATION_GUIDE_PART2.md)** - API 엔드포인트, Celery 비동기, 에러 핸들링
- 🛠️ **[Flask 구현 가이드 Part 3](docs/FLASK_IMPLEMENTATION_GUIDE_PART3.md)** - 테스트, 배포, 모니터링

### 프로젝트 문서
- [프로젝트 상세 명세](docs/NeuroNova_Context.md)
- [데이터베이스 설계](docs/최종%20DB.txt)
- [구현 순서](docs/구현순서.txt)
- [팀 역할](docs/TEAM_ROLES.md)
- [구현 완료 보고서](docs/구현_완료_보고서_11_28.md)

### Frontend 개발 문서
- 📘 [Frontend 구현 가이드](docs/FRONTEND_IMPLEMENTATION_GUIDE.md) - 상세 개발 가이드
- 📋 [Frontend 체크리스트](docs/FRONTEND_CHECKLIST.md) - 구현 완료 현황
- 🚀 [빠른 시작 가이드](docs/QUICK_START.md) - 5분 안에 실행하기

### 배포 문서
- 🐳 [Docker 설정](docker-compose.prod.yml) - 프로덕션 Docker Compose
- 🌐 [Nginx 설정](config/nginx/nginx.conf) - 리버스 프록시
- 🔒 [환경변수 템플릿](.env.production.example) - 프로덕션 설정
