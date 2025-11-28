# Firebase 설정 진행 상황

## ✅ 완료된 작업

### 1. Flutter 프로젝트 재생성
- ✅ Android 폴더 생성 완료
- ✅ iOS 폴더 생성 완료
- ✅ 기존 `lib` 폴더 복원 완료
- ✅ `pubspec.yaml` 복원 완료

### 2. Android 설정
- ✅ `build.gradle.kts` - Google Services 플러그인 추가
- ✅ `app/build.gradle.kts`
  - Google Services 플러그인 적용
  - applicationId: `com.neuronova.app`
  - minSdk: 21 (FCM 요구사항)
  - Firebase BOM 및 Messaging 의존성 추가
- ✅ `AndroidManifest.xml`
  - FCM 권한 추가
  - FCM Service 추가
  - 앱 이름: "NeuroNova"

### 3. Flutter 패키지
- ✅ `flutter pub get` 성공
- ✅ 73개 패키지 설치 완료
- ✅ Firebase Core, Firebase Messaging 설치 완료

### 4. .gitignore 업데이트
- ✅ Firebase 설정 파일 제외 추가
  - `google-services.json`
  - `GoogleService-Info.plist`
  - `firebase-service-account.json`

---

## ⏳ 사용자 작업 필요

### 🔴 중요: Firebase Console 작업 (직접 진행 필요)

이제 Firebase Console에서 다음 작업을 진행해주세요:

#### 1. Android 앱 추가

**단계**:
1. Firebase Console 접속: https://console.firebase.google.com/
2. 생성한 프로젝트 (NeuroNova) 선택
3. "앱 추가" → Android 아이콘 클릭
4. 패키지 이름 입력: **`com.neuronova.app`** (정확히 입력!)
5. 앱 닉네임: `NeuroNova App` (선택사항)
6. "앱 등록" 클릭
7. **`google-services.json` 다운로드** ⬇️
8. 다운로드한 파일을 다음 위치로 복사:
   ```
   c:\2025_12\NeuroNova\frontend\flutter_app\android\app\google-services.json
   ```

#### 2. iOS 앱 추가

**단계**:
1. Firebase Console → 같은 프로젝트
2. "앱 추가" → iOS 아이콘 클릭
3. iOS 번들 ID 입력: **`com.neuronova.app`** (정확히 입력!)
4. 앱 닉네임: `NeuroNova App` (선택사항)
5. "앱 등록" 클릭
6. **`GoogleService-Info.plist` 다운로드** ⬇️
7. 다운로드한 파일을 다음 위치로 복사:
   ```
   c:\2025_12\NeuroNova\frontend\flutter_app\ios\Runner\GoogleService-Info.plist
   ```

#### 3. Django Backend용 서비스 계정 키

**단계**:
1. Firebase Console → 프로젝트 설정 (톱니바퀴 아이콘)
2. "서비스 계정" 탭 클릭
3. "새 비공개 키 생성" 클릭
4. JSON 파일 다운로드 ⬇️
5. 파일 이름을 `firebase-service-account.json`으로 변경
6. 다음 위치로 복사:
   ```
   c:\2025_12\NeuroNova\backend\django_main\config\firebase-service-account.json
   ```

---

## 📋 다음 단계

Firebase 설정 파일 다운로드 후:

### 1. 파일 배치 확인

```bash
# Android
ls c:\2025_12\NeuroNova\frontend\flutter_app\android\app\google-services.json

# iOS
ls c:\2025_12\NeuroNova\frontend\flutter_app\ios\Runner\GoogleService-Info.plist

# Django
ls c:\2025_12\NeuroNova\backend\django_main\config\firebase-service-account.json
```

### 2. Flutter 앱 실행 및 FCM 토큰 확인

```bash
cd c:\2025_12\NeuroNova\frontend\flutter_app

# Android 에뮬레이터 또는 기기 연결 후
flutter run

# 또는 빌드
flutter build apk --debug
```

### 3. FCM 토큰 확인

앱 실행 시 콘솔에서 다음과 같은 로그 확인:
```
FCM Token: dXXXXXXXXXXXXXXXXXXXXXX...
```

이 토큰을 복사해두세요 (테스트 시 사용).

### 4. Django Backend FCM 설정

`backend/django_main/requirements.txt`에 추가:
```bash
cd c:\2025_12\NeuroNova\backend\django_main
pip install firebase-admin==6.3.0
```

### 5. Django에서 테스트 알림 전송

```bash
cd c:\2025_12\NeuroNova\backend\django_main
python manage.py shell
```

Python shell에서:
```python
from apps.core.services.notification_service import NotificationService

service = NotificationService()
token = "여기에_위에서_복사한_FCM_토큰_입력"

result = service.send_notification(
    token=token,
    title="NeuroNova 테스트",
    body="푸시 알림이 성공적으로 작동합니다! 🎉",
    data={'type': 'test'}
)

print(result)
```

---

## 📚 참고 문서

- [Firebase 설정 가이드](docs/FIREBASE_SETUP_GUIDE.md) - 상세한 단계별 가이드
- [Flutter 프로젝트 재생성 가이드](frontend/flutter_app/REGENERATE_PROJECT.md)
- [Firebase 설정 체크리스트](frontend/flutter_app/FIREBASE_SETUP_CHECKLIST.md)

---

## 🚨 문제 발생 시

### google-services.json 오류
- 파일 위치 확인: `android/app/google-services.json`
- 패키지 이름 일치 확인: `com.neuronova.app`

### Gradle 빌드 실패
```bash
cd c:\2025_12\NeuroNova\frontend\flutter_app\android
./gradlew clean
cd ..
flutter clean
flutter pub get
```

### FCM 토큰이 null
- Firebase Console에서 앱이 올바르게 등록되었는지 확인
- `google-services.json` 파일 위치 확인
- 앱 재시작

---

**현재 상태**: 설정 파일 다운로드 대기 중 ⏳

Firebase Console에서 위 3개 파일을 다운로드하면 모든 설정이 완료됩니다!
