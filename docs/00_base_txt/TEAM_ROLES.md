# NeuroNova 팀원 역할 분담

## 팀 정보
- **팀명**: NeuroNova (Neurology + Nova)
- **프로젝트**: 뇌종양 진단 CDSS (Clinical Decision Support System)
- **GitHub**: https://github.com/kimhanbyul1208/NeuroNova

---

## 역할 분담

### 1. 백엔드 (Backend) 담당자

**담당 기술**:
- Django REST API
- PostgreSQL 데이터베이스
- JWT 인증 시스템
- RBAC 권한 관리

**주요 작업**:
- [ ] Django 모델 마이그레이션 및 데이터베이스 구축
- [ ] REST API 엔드포인트 구현 (Serializers, Views)
- [ ] 사용자 인증 및 권한 시스템 (JWT)
- [ ] EMR 데이터 관리 API
- [ ] 예약 시스템 API
- [ ] 알림 시스템 (FCM 통합)
- [ ] API 문서화 (Swagger/Redoc)
- [ ] 단위 테스트 작성

**파일 위치**: `backend/django_main/`

**브랜치 전략**: `feature/backend-*`

---

### 2. AI/ML (인공지능) 담당자

**담당 기술**:
- Flask 추론 서버
- Google Colab (모델 학습)
- ONNX (모델 배포)
- XAI (설명가능한 AI)
- Orthanc (DICOM 서버)

**주요 작업**:
- [ ] 뇌종양 분류 모델 학습 (Glioma, Meningioma, Pituitary)
- [ ] 모델 성능 튜닝 및 최적화
- [ ] XAI 구현 (SHAP, Grad-CAM)
- [ ] ONNX 모델 변환
- [ ] Flask 추론 API 구현
- [ ] Orthanc DICOM 서버 통합
- [ ] 익명화 모듈 구현
- [ ] 모델 성능 평가 및 문서화

**파일 위치**:
- `backend/flask_inference/`
- Google Colab 노트북

**브랜치 전략**: `feature/ml-*`, `feature/flask-*`

---

### 3. 프론트엔드 웹 (React) 담당자

**담당 기술**:
- React.js
- TypeScript
- Material-UI / Ant Design
- Chart.js / Recharts
- Orthanc Web Viewer

**주요 작업**:
- [ ] 의료진용 대시보드 UI/UX 설계
- [ ] 환자 목록 및 검색 기능
- [ ] 진료 기록 (SOAP) 입력/조회 화면
- [ ] AI 진단 결과 시각화
- [ ] DICOM 이미지 뷰어 통합
- [ ] 예약 관리 화면
- [ ] 처방전 작성 화면
- [ ] 통합 문서 (MergedDocument) 뷰어
- [ ] 반응형 디자인 구현
- [ ] "About Us" 페이지에 앱 설치 QR 코드 추가

**파일 위치**: `frontend/react_web/`

**브랜치 전략**: `feature/web-*`

**디자인 참고**:
- 의료진이 많은 데이터를 한눈에 볼 수 있는 대시보드 형태
- 차트와 그래프로 데이터 시각화
- CDSS 결과를 직관적으로 표시

---

### 4. 모바일 앱 (Flutter) 담당자

**담당 기술**:
- Flutter / Dart
- SQLCipher (암호화 로컬 DB)
- Firebase Cloud Messaging (FCM)
- Provider / Riverpod (상태 관리)

**주요 작업**:
- [ ] 환자용 앱 UI/UX 설계
- [ ] 로그인 / 회원가입 화면
- [ ] 병원 예약 기능
- [ ] 예약 조회 및 관리
- [ ] 진료 요약 조회
- [ ] Push 알림 수신
- [ ] 로컬 데이터 암호화 저장 (SQLCipher)
- [ ] 90일 자동 삭제 로직
- [ ] 프로필 관리
- [ ] QR 코드 스캔 (웹에서 앱 설치)

**파일 위치**: `frontend/flutter_app/`

**브랜치 전략**: `feature/app-*`

**중요 사항**:
- 무거운 의료 영상 처리보다는 "예약 + 알림"에 집중
- 텍스트 기반 진단 요약 제공
- 보안 최우선: 암호화 저장소, 90일 자동 삭제

---

### 5. DevOps / 배포 담당자

**담당 기술**:
- Docker / Docker Compose
- Nginx
- Gunicorn
- PostgreSQL
- Redis
- CI/CD (GitHub Actions)

**주요 작업**:
- [ ] Docker 컨테이너화
- [ ] Docker Compose 설정
- [ ] Nginx 리버스 프록시 설정
- [ ] 데이터베이스 백업 전략
- [ ] 환경 변수 관리
- [ ] CI/CD 파이프라인 구축
- [ ] 서버 모니터링
- [ ] SSL 인증서 설정

**파일 위치**: `config/`, `docker-compose.yml`

**브랜치 전략**: `feature/devops-*`

---

## 협업 가이드

### Git 워크플로우

1. **새 작업 시작**:
```bash
git checkout main
git pull origin main
git checkout -b feature/your-feature-name
```

2. **작업 중**:
```bash
git add .
git commit -m "작업 내용 설명"
```

3. **GitHub에 푸시**:
```bash
git push origin feature/your-feature-name
```

4. **Pull Request 생성**:
- GitHub에서 Pull Request 생성
- 코드 리뷰 요청
- 승인 후 main에 병합

### 커밋 메시지 규칙

```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 업무, 패키지 매니저 설정 등
```

**예시**:
```
feat: Add appointment API endpoint
fix: Fix patient date calculation bug
docs: Update README with installation guide
```

### 코드 리뷰 체크리스트

- [ ] 타입 힌트 사용 여부
- [ ] 로깅 적용 여부
- [ ] 환경변수 사용 (하드코딩 금지)
- [ ] 주석 작성 (복잡한 로직)
- [ ] 테스트 코드 작성
- [ ] 문서 업데이트

---

## 개발 환경 설정

### Backend (Django)
```bash
cd backend/django_main
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # 환경변수 설정
python manage.py migrate
python manage.py runserver
```

### Frontend (React)
```bash
cd frontend/react_web
npm install
npm start
```

### Mobile (Flutter)
```bash
cd frontend/flutter_app
flutter pub get
flutter run
```

---

## 주간 회의

**시간**: 매주 월요일 오후 2시
**장소**: 온라인 (Zoom/Discord)

**안건**:
1. 지난주 작업 리뷰
2. 이번주 목표 설정
3. 문제점 공유 및 해결
4. 코드 리뷰

---

## 참고 자료

- [프로젝트 상세 명세](NeuroNova_Context.md)
- [데이터베이스 설계](최종%20DB.txt)
- [구현 순서](구현순서.txt)
- [GitHub Repository](https://github.com/kimhanbyul1208/NeuroNova)

---

## 연락처

| 역할 | 이름 | GitHub | 이메일 |
|:---:|:---:|:---:|:---:|
| 백엔드 | [이름] | [@username] | email@example.com |
| AI/ML | [이름] | [@username] | email@example.com |
| 웹 프론트엔드 | [이름] | [@username] | email@example.com |
| 모바일 앱 | [이름] | [@username] | email@example.com |
| DevOps | [이름] | [@username] | email@example.com |

---

**마지막 업데이트**: 2025-11-27
