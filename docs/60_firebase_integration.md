# NeuroNova Firebase 연동 가이드

**버전**: v1.0
**마지막 업데이트**: 2025-11-30

---

## 📋 목차
1. [연동 개요](#연동-개요)
2. [현재 설정 상태](#현재-설정-상태)
3. [설정 가이드](#설정-가이드)
4. [백엔드 설정 (Django)](#백엔드-설정-django)
5. [프론트엔드 설정 (Flutter)](#프론트엔드-설정-flutter)
6. [테스트 가이드](#테스트-가이드)
7. [문제 해결](#문제-해결)

---

## 연동 개요

NeuroNova는 **Firebase Cloud Messaging (FCM)**을 사용하여 실시간 푸시 알림을 전송합니다.
*   **플랫폼**: Android & iOS (Flutter 기반)
*   **발송 이벤트**:
    *   예약 확정 및 취소
    *   AI 진단 완료
    *   처방전 발급

---

## 현재 설정 상태

### ✅ 완료됨
*   **Firebase 프로젝트**: `neuronova-cdss` 생성 완료.
*   **앱 등록**: Android (`com.neuronova.app`) 및 iOS (`com.neuronova.app`).
*   **설정 파일**:
    *   `google-services.json` (Android) -> `frontend/flutter_app/android/app/` 위치함
    *   `GoogleService-Info.plist` (iOS) -> `frontend/flutter_app/ios/Runner/` 위치함
    *   `firebase-service-account.json` (Backend) -> `backend/django_main/config/` 위치함
*   **라이브러리**:
    *   Django: `firebase-admin` 설치됨.
    *   Flutter: `firebase_core`, `firebase_messaging` 설치됨.

---

## 설정 가이드

### 방법 1: 수동 설정 (권장)
현재 프로젝트는 이 방식으로 설정되었습니다.

1.  **콘솔 설정**:
    *   [Firebase Console](https://console.firebase.google.com/) 접속.
    *   Android 앱 추가 -> `google-services.json` 다운로드.
    *   iOS 앱 추가 -> `GoogleService-Info.plist` 다운로드.
    *   프로젝트 설정 -> 서비스 계정 -> 새 비공개 키 생성 (`firebase-service-account.json`).

2.  **파일 배치**:
    *   `google-services.json`을 `frontend/flutter_app/android/app/`에 배치.
    *   `GoogleService-Info.plist`를 `frontend/flutter_app/ios/Runner/`에 배치.
    *   `firebase-service-account.json`을 `backend/django_main/config/`에 배치.

### 방법 2: FlutterFire CLI (자동)
CLI를 사용하는 대체 방법입니다.

1.  CLI 설치: `npm install -g firebase-tools` 및 `dart pub global activate flutterfire_cli`.
2.  로그인: `firebase login`.
3.  설정 실행: `flutterfire configure --project=neuronova-cdss`.

---

## 백엔드 설정 (Django)

### 1. 설치
```bash
pip install firebase-admin==6.3.0
```

### 2. 초기화 (`settings.py`)
```python
import firebase_admin
from firebase_admin import credentials

FIREBASE_CREDENTIALS_PATH = BASE_DIR / 'config' / 'firebase-service-account.json'

if FIREBASE_CREDENTIALS_PATH.exists():
    cred = credentials.Certificate(str(FIREBASE_CREDENTIALS_PATH))
    firebase_admin.initialize_app(cred)
```

### 3. 알림 서비스
`apps/core/services/notification_service.py`에 Strategy 패턴으로 구현되어 있습니다.

---

## 프론트엔드 설정 (Flutter)

### 1. 초기화 (`main.dart`)
```dart
await Firebase.initializeApp();
await NotificationService().initialize();
```

### 2. 알림 서비스 (`lib/core/services/notification_service.dart`)
*   권한 요청 (iOS).
*   FCM 토큰 획득.
*   토큰을 백엔드로 전송 (`PATCH /api/v1/users/profiles/me/`).
*   포그라운드/백그라운드 메시지 처리.

---

## 테스트 가이드

### 1. FCM 토큰 확인
Flutter 앱을 실행하고 디버그 콘솔을 확인하세요:
```
[INFO] Firebase initialized
FCM Token: dXXXXXXXXXXXXXXXXXX...
```

### 2. 테스트 알림 전송 (Django)
제공된 테스트 스크립트나 Django 쉘을 사용하세요:

```bash
# 방법 1: 스크립트 사용
python backend/django_main/test_fcm_notification.py "FCM_토큰_입력"

# 방법 2: 쉘 사용
python manage.py shell
>>> from apps.core.services.notification_service import NotificationService
>>> service = NotificationService()
>>> service.send_push_notification(token="FCM_토큰_입력", title="테스트", body="안녕하세요")
```

---

## 문제 해결

### 1. FCM 토큰이 NULL일 때
*   `google-services.json`이 올바른 위치에 있는지 확인하세요.
*   앱 패키지명이 Firebase 콘솔과 일치하는지 확인하세요 (`com.neuronova.app`).
*   앱을 완전히 재시작하세요 (Hot Restart로는 부족할 수 있음).

### 2. 알림이 오지 않을 때
*   앱이 백그라운드에 있는지 확인하세요 (포그라운드 알림은 별도 처리가 필요함).
*   Django 설정에서 `firebase-service-account.json` 경로가 맞는지 확인하세요.
*   Django 로그에서 `firebase_admin` 초기화 오류가 없는지 확인하세요.

### 3. 빌드 에러 (Android)
*   `flutter clean` 후 `flutter pub get`을 실행하세요.
*   `android/build.gradle`에 `classpath 'com.google.gms:google-services:4.3.15'`가 있는지 확인하세요.
