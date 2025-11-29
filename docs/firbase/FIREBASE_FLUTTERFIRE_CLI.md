# Firebase 자동 설정 - FlutterFire CLI

## 개요
FlutterFire CLI를 사용하여 **한 번의 명령어**로 Firebase를 설정합니다.

---

## 사전 준비

### 1. Firebase CLI 설치
```bash
# Windows (npm)
npm install -g firebase-tools

# macOS/Linux
curl -sL https://firebase.tools | bash
```

### 2. Firebase CLI 로그인
```bash
firebase login
```

### 3. FlutterFire CLI 설치
```bash
dart pub global activate flutterfire_cli
```

---

## 자동 설정 (5분)

### 1. Flutter 프로젝트로 이동
```bash
cd frontend/flutter_app
```

### 2. FlutterFire CLI 실행
```bash
flutterfire configure --project=neuronova-cdss
```

### 3. 플랫폼 선택
스페이스바로 선택:
- ✅ android
- ✅ ios

Enter 키 입력

### 4. 완료!
자동으로 생성된 파일:
- ✅ `android/app/google-services.json`
- ✅ `ios/Runner/GoogleService-Info.plist`
- ✅ `lib/firebase_options.dart`

---

## Flutter 코드 수정

`lib/main.dart`:
```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase 초기화
  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  // NotificationService 초기화
  await NotificationService().initialize();

  runApp(MyApp());
}
```

---

## Django Backend 설정

### 1. 서비스 계정 키 다운로드 (수동)
1. https://console.firebase.google.com/project/neuronova-cdss/settings/serviceaccounts
2. "새 비공개 키 생성" → JSON 다운로드
3. 파일명: `firebase-service-account.json`
4. 위치: `backend/django_main/config/`

### 2. firebase-admin 설치
```bash
cd backend/django_main
pip install firebase-admin==6.3.0
```

### 3. settings.py 설정
```python
import firebase_admin
from firebase_admin import credentials

FIREBASE_CREDENTIALS_PATH = BASE_DIR / 'config' / 'firebase-service-account.json'

if FIREBASE_CREDENTIALS_PATH.exists():
    cred = credentials.Certificate(str(FIREBASE_CREDENTIALS_PATH))
    firebase_admin.initialize_app(cred)
```

---

## 테스트

### Flutter 앱 실행
```bash
flutter run
```

### FCM 토큰 확인
```
FCM Token: dXXXXXXXXXXXXXXX...
```

### Django 알림 전송
```python
from apps.core.services.notification_service import NotificationService

service = NotificationService()
result = service.send_notification(
    token="FCM_토큰",
    title="테스트",
    body="푸시 알림!",
    data={'type': 'test'}
)
```

---

## 체크리스트

### 수동 설정으로 완료됨:
- [x] ~~Firebase CLI 설치~~ (수동 설정으로 대체)
- [x] ~~FlutterFire CLI 설치~~ (수동 설정으로 대체)
- [x] ~~`flutterfire configure` 실행~~ (수동 설정으로 대체)
- [x] Firebase Console에서 파일 다운로드 완료
- [x] `google-services.json` 배치 완료
- [x] `GoogleService-Info.plist` 배치 완료
- [x] 서비스 계정 키 다운로드 완료
- [x] Django 설정 완료

### 다음 단계 (테스트):
- [ ] Flutter 앱 실행
- [ ] FCM 토큰 확인
- [ ] Django 알림 전송 테스트

---

## 문제 해결

### Firebase CLI 없음
```bash
npm install -g firebase-tools
firebase --version
```

### FlutterFire CLI 실행 안 됨
```bash
# 전체 경로로 실행
dart pub global run flutterfire_cli:flutterfire configure --project=neuronova-cdss
```

---

**수동 설정이 필요하면**: [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) 참고

**작성일**: 2025-11-29
