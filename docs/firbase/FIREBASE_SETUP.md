# Firebase 설정 가이드

## 현재 상태
- ✅ Flutter 프로젝트: Firebase 패키지 설치 완료
- ✅ Android 설정: Gradle 파일 설정 완료
- ✅ NotificationService: FCM 처리 로직 구현 완료
- ❌ **Firebase Console 작업 필요** (아래 진행)

---

## 방법 선택

### 🚀 방법 1: 수동 설정 (권장)
- 각 단계를 명확히 이해 가능
- Firebase CLI 설치 불필요
- 15분 소요

👉 **[1단계: Firebase Console 설정](#1단계-firebase-console-설정)으로 이동**

### ⚡ 방법 2: FlutterFire CLI 자동 설정
- 한 번의 명령어로 완료
- Firebase CLI + FlutterFire CLI 설치 필요
- 5분 소요

👉 **[FlutterFire CLI 설정 가이드](./FIREBASE_FLUTTERFIRE_CLI.md)로 이동**

---

## 1단계: Firebase Console 설정

### 1-1. Android 앱 등록

#### Firebase Console 접속
https://console.firebase.google.com/project/neuronova-cdss

#### 앱 추가
1. **Android 아이콘** (로봇 모양) 클릭
2. 패키지명 입력: `com.neuronova.app`
3. 앱 닉네임: `NeuroNova App` (선택)
4. **"앱 등록"** 클릭

#### google-services.json 다운로드
1. **"google-services.json 다운로드"** 클릭
2. 파일 저장 위치:
```
frontend/flutter_app/android/app/google-services.json
```
3. **"다음"** → **"건너뛰기"** → **"콘솔로 이동"**

---

### 1-2. iOS 앱 등록

#### 앱 추가
1. Firebase Console → **iOS 아이콘** (Apple 로고) 클릭
2. Bundle ID 입력: `com.neuronova.app`
3. 앱 닉네임: `NeuroNova App` (선택)
4. **"앱 등록"** 클릭

#### GoogleService-Info.plist 다운로드
1. **"GoogleService-Info.plist 다운로드"** 클릭
2. 파일 저장 위치:
```
frontend/flutter_app/ios/Runner/GoogleService-Info.plist
```
3. **"다음"** → **"건너뛰기"** → **"콘솔로 이동"**

---

### 1-3. 서비스 계정 키 다운로드 (Django용)

#### 서비스 계정 키 생성
1. Firebase Console → 톱니바퀴(⚙️) → **"프로젝트 설정"**
2. **"서비스 계정"** 탭
3. **"새 비공개 키 생성"** → **"키 생성"**
4. JSON 파일 다운로드

#### 파일 저장
1. 파일 이름: `firebase-service-account.json`
2. 저장 위치:
```
backend/django_main/config/firebase-service-account.json
```

⚠️ **보안**: 이 파일은 절대 Git에 커밋하지 말 것! (`.gitignore`에 이미 추가됨)

---

## 2단계: Django Backend 설정

### 2-1. firebase-admin 설치
```bash
cd backend/django_main
pip install firebase-admin==6.3.0
```

### 2-2. settings.py 설정
`backend/django_main/config/settings.py`에 추가:

```python
import firebase_admin
from firebase_admin import credentials

# Firebase Admin SDK 초기화
FIREBASE_CREDENTIALS_PATH = BASE_DIR / 'config' / 'firebase-service-account.json'

if FIREBASE_CREDENTIALS_PATH.exists():
    cred = credentials.Certificate(str(FIREBASE_CREDENTIALS_PATH))
    firebase_admin.initialize_app(cred)
    print("✅ Firebase Admin SDK initialized")
else:
    print("⚠️ Warning: Firebase credentials not found")
```

---

## 3단계: 테스트

### 3-1. Flutter 앱 실행
```bash
cd frontend/flutter_app
flutter pub get
flutter run
```

### 3-2. FCM 토큰 확인
앱 실행 시 콘솔에서 확인:
```
[INFO] Firebase initialized
[INFO] Notification service initialized
FCM Token: dXXXXXXXXXXXXXXXXXX...
```

**이 토큰을 복사하세요!**

### 3-3. Django에서 테스트 알림 전송
```bash
python manage.py shell
```

```python
from apps.core.services.notification_service import NotificationService

service = NotificationService()
token = "위에서_복사한_FCM_토큰"

result = service.send_notification(
    token=token,
    title="NeuroNova 테스트",
    body="푸시 알림 테스트!",
    data={'type': 'test'}
)

print(result)
# {'success': True, 'message_id': 'projects/...'}
```

---

## 완료 체크리스트

### Firebase Console:
- [ ] Android 앱 등록 (`com.neuronova.app`)
- [ ] `google-services.json` 다운로드 및 배치
- [ ] iOS 앱 등록 (`com.neuronova.app`)
- [ ] `GoogleService-Info.plist` 다운로드 및 배치
- [ ] Firebase Admin SDK 키 다운로드

### 로컬 설정:
- [ ] 파일 배치 완료 (3개 파일)
- [ ] `pip install firebase-admin` 실행
- [ ] Django `settings.py` 수정

### 테스트:
- [ ] Flutter 앱 실행 성공
- [ ] FCM 토큰 출력 확인
- [ ] Django 알림 전송 성공
- [ ] 앱에서 알림 수신 확인

---

## 문제 해결

### Google Services 플러그인 에러
```bash
cd frontend/flutter_app
flutter clean
flutter pub get
```

### FCM 토큰이 null
1. `google-services.json` 경로 확인
2. 앱 재시작
3. Firebase Console에서 앱 등록 확인

### Django 알림 전송 실패
1. `firebase-service-account.json` 경로 확인
2. settings.py 초기화 로그 확인
3. Django 서버 재시작

---

## FAQ

**Q: Flutter는 크로스 플랫폼인데 왜 Android/iOS를 따로 설정하나요?**
A: Flutter 코드는 공유되지만, Firebase는 각 플랫폼의 네이티브 푸시 시스템(Android: GCM, iOS: APNs)을 사용하므로 각각 설정이 필요합니다.

**Q: iOS 설정을 나중에 해도 되나요?**
A: 네, Android만 먼저 하고 나중에 iOS를 추가할 수 있습니다.

**Q: FlutterFire CLI가 더 쉽지 않나요?**
A: 네, 하지만 Firebase CLI 추가 설치가 필요합니다. [FlutterFire CLI 가이드](./FIREBASE_FLUTTERFIRE_CLI.md) 참고

---

## 빠른 참조: 클릭 순서

1. Android 아이콘 → 패키지명 입력 → 앱 등록
2. google-services.json 다운로드 → 건너뛰기
3. iOS 아이콘 → Bundle ID 입력 → 앱 등록
4. GoogleService-Info.plist 다운로드 → 건너뛰기
5. 프로젝트 설정 → 서비스 계정 → 새 비공개 키 생성

**파일 3개 다운로드 완료 → 테스트 시작!**

---

**작성일**: 2025-11-29
