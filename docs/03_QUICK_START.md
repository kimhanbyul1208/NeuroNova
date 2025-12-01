# NeuroNova Frontend 빠른 시작 가이드

## 🚀 5분 안에 실행하기

### 필수 요구사항
- Node.js 18+
- Flutter 3.0+
- Git

---

## React Web (의료진용) 실행

### 1단계: 설치
```bash
cd frontend/react_web
npm install
```

### 2단계: 환경 설정
```bash
# .env 파일 생성
cp .env.example .env

# .env 내용 (필요시 수정)
# VITE_API_BASE_URL=http://localhost:8000
# VITE_ORTHANC_URL=http://localhost:8042
```

### 3단계: 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 4단계: 테스트 로그인
```
사용자명: (Backend에서 생성한 계정)
비밀번호: (Backend에서 생성한 계정)
```

04_ test_accounts.md
참고

---

## Flutter App (환자용) 실행

### 1단계: 설치
```bash
cd frontend/flutter_app
flutter pub get
```

### 2단계: 실행
```bash
# Android 에뮬레이터 실행 후
flutter run
```

### 3단계: 테스트 로그인
앱에서 로그인 화면이 나타나면 Backend에서 생성한 환자 계정으로 로그인

---

## 전체 시스템 실행 순서

### 1. Backend 서버 실행
```bash
# Terminal 1: Django
cd backend/django_main
python manage.py runserver
# → http://localhost:8000

# Terminal 2: Flask AI (선택)
cd backend/flask_ai
python app.py
# → http://localhost:5000

# Terminal 3: Orthanc (선택)
docker run -p 8042:8042 jodogne/orthanc
# → http://localhost:8042
```

### 2. Frontend 실행
```bash
# Terminal 4: React Web
cd frontend/react_web
npm run dev
# → http://localhost:3000

# Terminal 5: Flutter App
cd frontend/flutter_app
flutter run
```

---

## 주요 기능 테스트

### React Web 기능 테스트

#### 1. 로그인
1. http://localhost:3000/login 접속
2. 의사 계정으로 로그인
3. 대시보드 확인

#### 2. 환자 관리
1. 좌측 메뉴 → "환자 목록" 클릭
2. 검색 기능 테스트
3. 환자 카드 클릭 → 상세 정보 확인

#### 3. 예약 관리
1. 좌측 메뉴 → "예약 관리" 클릭
2. "대기 중" 탭에서 예약 확인
3. "승인" 버튼 클릭 → 예약 확정

#### 4. AI 진단 확인
1. 환자 상세 → "AI 진단" 탭
2. 진단 결과 카드 클릭
3. XAI 시각화 (Grad-CAM, SHAP) 확인
4. 의사 피드백 입력 및 저장

---

### Flutter App 기능 테스트

#### 1. 로그인
1. 앱 실행 → Splash Screen (2초)
2. 로그인 화면에서 환자 계정 입력
3. 로그인 성공 → 홈 화면

#### 2. 홈 화면
1. 사용자 정보 확인
2. 다가오는 예약 확인
3. Pull to Refresh 테스트

#### 3. 예약 생성
1. 하단 네비게이션 → "예약" 탭
2. 우측 상단 "+" 버튼 클릭
3. 캘린더에서 날짜 선택
4. 시간 선택
5. 방문 유형 선택
6. 예약 사유 입력
7. "예약 신청" 버튼 클릭

#### 4. 예약 목록
1. "예약" 탭에서 목록 확인
2. 필터 칩으로 상태별 필터링
3. 예약 카드에서 "예약 취소" 버튼 테스트

---

## 데이터 흐름 이해

### 예약 생성 플로우

```
Flutter App (환자)
  ↓ POST /api/v1/custom/appointments/
Django Backend (저장)
  ↓ status: PENDING
React Web (의료진)
  ↓ 예약 관리 화면에서 확인
의사가 "승인" 클릭
  ↓ PATCH /api/v1/custom/appointments/{id}/
Django Backend (업데이트)
  ↓ status: CONFIRMED
Flutter App (환자)
  ↓ 예약 목록에서 "확정" 상태 확인
```

### AI 진단 플로우

```
React Web (의료진)
  ↓ DICOM 업로드 (Orthanc)
Django Backend
  ↓ Flask AI 서버로 이미지 전송 (익명화)
Flask AI Server
  ↓ 모델 추론 + XAI 생성
Django Backend
  ↓ 결과 저장 (Prediction Result)
React Web (의료진)
  ↓ AI 진단 상세 화면에서 확인
의사가 피드백 입력
  ↓ PATCH /api/v1/custom/predictions/{id}/
Django Backend (Human-in-the-loop)
```

---

## 90일 자동 삭제 확인

### Flutter App에서 확인
1. 앱 실행 시 로그 확인 (VS Code Debug Console)
```
[INFO] Starting NeuroNova App v1.0.0
[INFO] Local database initialized
[INFO] Deleted 0 expired records
```

2. 90일 이상된 데이터가 있다면:
```
[INFO] Deleted 5 expired records
```

### 수동 테스트
```dart
// 테스트용: 만료일을 과거로 설정
final testData = {
  'expire_at': DateTime.now().subtract(Duration(days: 100)).toIso8601String(),
  // ...
};
await LocalDatabase.insertAppointment(testData);

// 앱 재시작 → 자동 삭제 확인
```

---

## 보안 기능 확인

### SQLCipher 암호화
```bash
# Android 에뮬레이터에서 DB 파일 확인
adb shell
cd /data/data/com.neuronova.app/app_flutter/
cat neuronova.db
# → 암호화된 바이너리 데이터 출력 (읽을 수 없음)
```

### JWT 토큰 저장
```dart
// Flutter Secure Storage 확인
final token = await storage.read(key: 'access_token');
print(token); // → "eyJ0eXAiOiJKV1QiLCJhbGc..."
```

---

## 문제 해결 (빠른 참조)

### React Web

#### 문제: CORS 오류
```
Access-Control-Allow-Origin 오류
```
**해결**: Django `settings.py`에서 CORS 설정
```python
CORS_ALLOWED_ORIGINS = ["http://localhost:3000"]
```

#### 문제: API 연결 안 됨
**확인**:
1. Django 서버 실행 중인지 확인 (http://localhost:8000)
2. `.env` 파일의 `VITE_API_BASE_URL` 확인
3. 브라우저 개발자 도구 → Network 탭 확인

---

### Flutter App

#### 문제: API 연결 안 됨 (Android 에뮬레이터)
**해결**:
```dart
// app_config.dart
static const String apiBaseUrl = 'http://10.0.2.2:8000';
// (localhost가 아님!)
```

#### 문제: SQLCipher 빌드 오류
```bash
flutter clean
flutter pub get
flutter run
```

#### 문제: 화면이 안 보임
**확인**:
1. `main.dart`에서 라우팅 확인
2. 로그인 상태 확인 (`isLoggedIn()`)
3. VS Code Debug Console에서 에러 로그 확인

---

## 유용한 명령어

### React Web
```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 빌드 미리보기
npm run preview

# Lint 검사
npm run lint
```

### Flutter App
```bash
# 개발 실행
flutter run

# 디바이스 목록
flutter devices

# 로그 확인
flutter logs

# 빌드 (Android APK)
flutter build apk

# 빌드 (Android App Bundle)
flutter build appbundle

# Clean
flutter clean
```

---

## 개발 팁

### React Web
1. **컴포넌트 재사용**: `components/index.js`에서 import
2. **API 호출**: `axiosClient` 사용 (자동 토큰 추가)
3. **설정값**: `utils/config.js`에서 관리
4. **에러 처리**: `<ErrorAlert>` 컴포넌트 사용

### Flutter App
1. **로깅**: `AppLogger.info()`, `AppLogger.error()` 사용
2. **API 호출**: Repository 패턴 사용
3. **로컬 DB**: `LocalDatabase.insertAppointment()` 등 static 메서드
4. **네비게이션**: `Navigator.pushNamed(context, '/route')`

---

## 다음 단계

### 즉시 가능한 작업
1. ✅ Backend API 연동 테스트
2. ✅ 예약 생성 → 승인 → 확정 플로우 테스트
3. ✅ 90일 자동 삭제 로직 확인

### 추가 개발 필요
1. ⏳ Firebase Push 알림 설정
2. ⏳ SOAP 차트 페이지 구현
3. ⏳ 알림 화면 구현
4. ⏳ 프로필 관리 화면 구현

---

## 참고 문서
- [상세 가이드](./FRONTEND_IMPLEMENTATION_GUIDE.md)
- [체크리스트](./FRONTEND_CHECKLIST.md)
- [프로젝트 Context](./NeuroNova_Context.md)

---

**도움이 필요하면**: GitHub Issues 또는 팀 리더에게 연락

**마지막 업데이트**: 2025-11-28
