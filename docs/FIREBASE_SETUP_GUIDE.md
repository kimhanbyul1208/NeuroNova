# Firebase 설정 가이드 - NeuroNova FCM 푸시 알림

## 목차
1. [Firebase 프로젝트 생성](#1-firebase-프로젝트-생성)
2. [Android 앱 추가](#2-android-앱-추가)
3. [iOS 앱 추가](#3-ios-앱-추가)
4. [Flutter 프로젝트 초기화](#4-flutter-프로젝트-초기화)
5. [Django Backend FCM 설정](#5-django-backend-fcm-설정)
6. [테스트](#6-테스트)

---

## 1. Firebase 프로젝트 생성

### 1.1 Firebase Console 접속
1. [Firebase Console](https://console.firebase.google.com/) 접속
2. Google 계정으로 로그인
3. "프로젝트 추가" 클릭

### 1.2 프로젝트 생성
```
프로젝트 이름: NeuroNova
프로젝트 ID: neuronova-cdss (자동 생성, 변경 가능)
Google Analytics: 활성화 (선택사항)
```

### 1.3 프로젝트 생성 완료
- 프로젝트 대시보드로 이동

---

## 2. Android 앱 추가

### 2.1 Android 앱 등록
1. Firebase Console에서 "Android 앱에 Firebase 추가" 클릭
2. 패키지 이름 입력:
   ```
   com.neuronova.app
   ```
3. 앱 닉네임: `NeuroNova App` (선택사항)
4. SHA-1 디버그 서명 인증서 (선택사항, 나중에 추가 가능):
   ```bash
   # Windows (Git Bash)
   keytool -list -v -keystore "%USERPROFILE%\.android\debug.keystore" -alias androiddebugkey -storepass android -keypass android

   # Linux/macOS
   keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android -keypass android
   ```

### 2.2 google-services.json 다운로드
1. "google-services.json 다운로드" 클릭
2. 다운로드한 파일을 다음 경로에 저장:
   ```
   frontend/flutter_app/android/app/google-services.json
   ```

### 2.3 Android 프로젝트 설정

#### android/build.gradle (프로젝트 레벨)
```gradle
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.1.0'
        classpath 'com.google.gms:google-services:4.4.0'  // 추가
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
```

#### android/app/build.gradle (앱 레벨)
```gradle
apply plugin: 'com.android.application'
apply plugin: 'com.google.gms.google-services'  // 추가 (파일 끝부분)

android {
    compileSdkVersion 34

    defaultConfig {
        applicationId "com.neuronova.app"
        minSdkVersion 21  // FCM 요구사항
        targetSdkVersion 34
        versionCode 1
        versionName "1.0.0"
        multiDexEnabled true
    }
}

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

#### android/app/src/main/AndroidManifest.xml
```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.neuronova.app">

    <!-- 권한 추가 -->
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <uses-permission android:name="android.permission.VIBRATE"/>

    <application
        android:label="NeuroNova"
        android:icon="@mipmap/ic_launcher">

        <!-- FCM 서비스 -->
        <service
            android:name="com.google.firebase.messaging.FirebaseMessagingService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT"/>
            </intent-filter>
        </service>

        <!-- 기본 알림 채널 -->
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="neuronova_default_channel"/>

        <activity
            android:name=".MainActivity"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>
```

---

## 3. iOS 앱 추가

### 3.1 iOS 앱 등록
1. Firebase Console에서 "iOS 앱에 Firebase 추가" 클릭
2. Bundle ID 입력:
   ```
   com.neuronova.app
   ```
3. 앱 닉네임: `NeuroNova App` (선택사항)

### 3.2 GoogleService-Info.plist 다운로드
1. "GoogleService-Info.plist 다운로드" 클릭
2. 다운로드한 파일을 다음 경로에 저장:
   ```
   frontend/flutter_app/ios/Runner/GoogleService-Info.plist
   ```

### 3.3 iOS 프로젝트 설정

#### ios/Runner/Info.plist
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- 기존 설정 유지 -->

    <!-- FCM 권한 추가 -->
    <key>UIBackgroundModes</key>
    <array>
        <string>fetch</string>
        <string>remote-notification</string>
    </array>
</dict>
</plist>
```

#### ios/Runner/AppDelegate.swift
```swift
import UIKit
import Flutter
import FirebaseCore
import FirebaseMessaging

@UIApplicationMain
@objc class AppDelegate: FlutterAppDelegate {
  override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    FirebaseApp.configure()

    if #available(iOS 10.0, *) {
      UNUserNotificationCenter.current().delegate = self
      let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
      UNUserNotificationCenter.current().requestAuthorization(
        options: authOptions,
        completionHandler: { _, _ in }
      )
    } else {
      let settings: UIUserNotificationSettings =
        UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
      application.registerUserNotificationSettings(settings)
    }

    application.registerForRemoteNotifications()

    GeneratedPluginRegistrant.register(with: self)
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
```

---

## 4. Flutter 프로젝트 초기화

### 4.1 Flutter 프로젝트 재생성
현재 `lib` 폴더만 존재하므로 Android/iOS 네이티브 폴더 생성 필요:

```bash
cd frontend/flutter_app

# 기존 프로젝트 백업
mkdir ../flutter_app_backup
cp -r lib ../flutter_app_backup/
cp pubspec.yaml ../flutter_app_backup/
cp README.md ../flutter_app_backup/

# Flutter 프로젝트 재생성
cd ..
flutter create --org com.neuronova --project-name neuronova_app flutter_app_new

# lib 폴더 복원
rm -rf flutter_app_new/lib
cp -r flutter_app_backup/lib flutter_app_new/
cp flutter_app_backup/pubspec.yaml flutter_app_new/
cp flutter_app_backup/README.md flutter_app_new/

# 기존 폴더 삭제 및 이름 변경
rm -rf flutter_app
mv flutter_app_new flutter_app
rm -rf flutter_app_backup
```

### 4.2 패키지 설치
```bash
cd frontend/flutter_app
flutter pub get
```

### 4.3 Firebase 설정 파일 배치

**Android**:
- `google-services.json` → `android/app/google-services.json`

**iOS**:
- `GoogleService-Info.plist` → `ios/Runner/GoogleService-Info.plist`

### 4.4 Flutter Firebase 초기화 확인

`lib/main.dart`에 이미 Firebase 초기화 코드가 있는지 확인:

```dart
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';

// Background message handler (최상위 함수)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print('Background message: ${message.notification?.title}');
}

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Firebase 초기화
  await Firebase.initializeApp();

  // Background handler 등록
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);

  // FCM 토큰 가져오기
  String? token = await FirebaseMessaging.instance.getToken();
  print('FCM Token: $token');

  runApp(MyApp());
}
```

---

## 5. Django Backend FCM 설정

### 5.1 Firebase Admin SDK 서비스 계정 키 다운로드

1. Firebase Console → 프로젝트 설정 (톱니바퀴) → 서비스 계정
2. "새 비공개 키 생성" 클릭
3. JSON 파일 다운로드
4. 파일 이름을 `firebase-service-account.json`으로 변경
5. 저장 위치:
   ```
   backend/django_main/config/firebase-service-account.json
   ```

### 5.2 .gitignore에 추가
```gitignore
# Firebase 설정 파일
**/google-services.json
**/GoogleService-Info.plist
**/firebase-service-account.json
```

### 5.3 Django requirements.txt 업데이트

`backend/django_main/requirements.txt`에 추가:
```txt
firebase-admin==6.3.0
```

설치:
```bash
cd backend/django_main
pip install firebase-admin==6.3.0
```

### 5.4 Django settings.py 설정

```python
import firebase_admin
from firebase_admin import credentials

# Firebase Admin SDK 초기화
FIREBASE_CREDENTIALS_PATH = BASE_DIR / 'config' / 'firebase-service-account.json'

if FIREBASE_CREDENTIALS_PATH.exists():
    cred = credentials.Certificate(str(FIREBASE_CREDENTIALS_PATH))
    firebase_admin.initialize_app(cred)
else:
    print("Warning: Firebase credentials not found")
```

### 5.5 NotificationService 확인

`backend/django_main/apps/core/services/notification_service.py`:

```python
from firebase_admin import messaging

class FCMNotificationStrategy:
    def send(self, token, title, body, data=None):
        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )

        try:
            response = messaging.send(message)
            return {'success': True, 'message_id': response}
        except Exception as e:
            return {'success': False, 'error': str(e)}
```

---

## 6. 테스트

### 6.1 Flutter 앱 실행
```bash
cd frontend/flutter_app

# Android 에뮬레이터 또는 실제 기기
flutter run

# 빌드 (디버그)
flutter build apk --debug

# 빌드 (릴리즈)
flutter build apk --release
```

### 6.2 FCM 토큰 확인
앱 실행 시 콘솔에서 FCM 토큰 확인:
```
FCM Token: dXXXXXXXXXXXXXXXXXXXXXX...
```

### 6.3 Django에서 테스트 알림 전송

Django shell에서:
```python
python manage.py shell

from apps.core.services.notification_service import NotificationService

service = NotificationService()
token = "여기에_FCM_토큰_입력"

result = service.send_notification(
    token=token,
    title="NeuroNova 테스트",
    body="푸시 알림 테스트 메시지입니다.",
    data={'type': 'test'}
)

print(result)
```

### 6.4 Firebase Console에서 테스트 전송
1. Firebase Console → Cloud Messaging
2. "첫 번째 캠페인 보내기" 또는 "새 알림"
3. 알림 제목/본문 입력
4. 테스트 메시지 전송
5. FCM 토큰 입력 후 테스트

---

## 7. 문제 해결

### 7.1 Android 빌드 실패
```bash
# Gradle 캐시 삭제
cd frontend/flutter_app/android
./gradlew clean

# Flutter 캐시 삭제
flutter clean
flutter pub get
```

### 7.2 FCM 토큰이 null
- `google-services.json` 파일 위치 확인
- AndroidManifest.xml 권한 확인
- Firebase Console에서 앱이 올바르게 등록되었는지 확인

### 7.3 iOS 빌드 실패
```bash
cd frontend/flutter_app/ios
pod install --repo-update
```

### 7.4 알림이 수신되지 않음
- FCM 토큰이 올바른지 확인
- Django Firebase Admin SDK 초기화 확인
- 앱이 포그라운드/백그라운드 상태 확인
- 알림 권한 허용 여부 확인

---

## 8. 보안 주의사항

### 8.1 민감 파일 관리
**절대 Git에 커밋하지 말 것**:
- `google-services.json`
- `GoogleService-Info.plist`
- `firebase-service-account.json`

### 8.2 .gitignore 확인
```gitignore
# Firebase
**/google-services.json
**/GoogleService-Info.plist
**/firebase-service-account.json

# Android
android/app/google-services.json

# iOS
ios/Runner/GoogleService-Info.plist
```

### 8.3 환경 변수 사용 (프로덕션)
프로덕션에서는 서비스 계정 JSON 파일 대신 환경 변수 사용:

```python
# settings.py
import json
import os

FIREBASE_CREDENTIALS = os.getenv('FIREBASE_CREDENTIALS')
if FIREBASE_CREDENTIALS:
    cred_dict = json.loads(FIREBASE_CREDENTIALS)
    cred = credentials.Certificate(cred_dict)
    firebase_admin.initialize_app(cred)
```

---

## 9. 참고 자료

- [Firebase Console](https://console.firebase.google.com/)
- [FlutterFire 공식 문서](https://firebase.flutter.dev/)
- [Firebase Admin SDK for Python](https://firebase.google.com/docs/admin/setup)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

---

## 10. 체크리스트

### Firebase 프로젝트
- [ ] Firebase 프로젝트 생성 완료
- [ ] Android 앱 등록 완료
- [ ] iOS 앱 등록 완료

### Android 설정
- [ ] `google-services.json` 다운로드 및 배치
- [ ] `android/build.gradle` 수정
- [ ] `android/app/build.gradle` 수정
- [ ] `AndroidManifest.xml` 권한 추가

### iOS 설정
- [ ] `GoogleService-Info.plist` 다운로드 및 배치
- [ ] `ios/Runner/Info.plist` 수정
- [ ] `ios/Runner/AppDelegate.swift` 수정

### Flutter 설정
- [ ] `pubspec.yaml` Firebase 패키지 확인
- [ ] `flutter pub get` 실행
- [ ] `main.dart` Firebase 초기화 확인

### Django 설정
- [ ] Firebase Admin SDK JSON 다운로드
- [ ] `firebase-admin` 패키지 설치
- [ ] `settings.py` Firebase 초기화
- [ ] NotificationService 동작 확인

### 테스트
- [ ] Flutter 앱에서 FCM 토큰 출력 확인
- [ ] Django에서 테스트 알림 전송 성공
- [ ] 앱에서 알림 수신 확인

### 보안
- [ ] `.gitignore`에 Firebase 설정 파일 추가
- [ ] 민감 정보 커밋되지 않았는지 확인

---

**작성일**: 2025-11-28
**버전**: 1.0
**작성자**: Claude Code
