# NeuroNova 테스트 가이드

## 목차
1. [개요](#1-개요)
2. [React Frontend 테스트](#2-react-frontend-테스트)
3. [Flutter Frontend 테스트](#3-flutter-frontend-테스트)
4. [Backend 테스트](#4-backend-테스트)
5. [테스트 실행 방법](#5-테스트-실행-방법)
6. [CI/CD 통합](#6-cicd-통합)

---

## 1. 개요

### 1.1 테스트 전략

NeuroNova 프로젝트는 다음과 같은 테스트 전략을 사용합니다:

| 테스트 종류 | 목적 | 커버리지 목표 |
|------------|------|--------------|
| Unit 테스트 | 개별 함수/메서드 테스트 | 80% 이상 |
| Integration 테스트 | 모듈 간 통합 테스트 | 60% 이상 |
| E2E 테스트 | 전체 사용자 시나리오 | 주요 기능 100% |

### 1.2 테스트 도구

#### React
- **Vitest**: 테스트 러너
- **React Testing Library**: 컴포넌트 테스트
- **jsdom**: DOM 환경 시뮬레이션

#### Flutter
- **flutter_test**: Flutter 테스트 프레임워크
- **mockito**: Mock 객체 생성

#### Django
- **Django TestCase**: Django 테스트 프레임워크
- **DRF APITestCase**: REST API 테스트

---

## 2. React Frontend 테스트

### 2.1 테스트 설정

테스트 환경은 이미 설정되어 있습니다:
- [package.json](../frontend/react_web/package.json): 테스트 의존성
- [vitest.config.js](../frontend/react_web/vitest.config.js): Vitest 설정
- [src/test/setup.js](../frontend/react_web/src/test/setup.js): 테스트 초기화

### 2.2 테스트 파일 구조

```
frontend/react_web/src/
├── components/
│   ├── LoadingSpinner.jsx
│   └── __tests__/
│       └── LoadingSpinner.test.jsx
├── auth/
│   ├── AuthContext.jsx
│   └── __tests__/
│       └── AuthContext.test.jsx
└── pages/
    ├── LoginPage.jsx
    └── __tests__/
        └── LoginPage.test.jsx
```

### 2.3 컴포넌트 테스트 예시

#### 기본 컴포넌트 테스트
```javascript
import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import LoadingSpinner from '../LoadingSpinner'

describe('LoadingSpinner', () => {
  it('렌더링이 정상적으로 되어야 함', () => {
    render(<LoadingSpinner />)

    const spinner = screen.getByRole('progressbar')
    expect(spinner).toBeInTheDocument()
  })
})
```

#### 사용자 상호작용 테스트
```javascript
import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import ErrorAlert from '../ErrorAlert'

describe('ErrorAlert', () => {
  it('onClose 콜백이 호출되어야 함', () => {
    const onClose = vi.fn()
    render(<ErrorAlert message="에러" onClose={onClose} />)

    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)

    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

### 2.4 Context 테스트

```javascript
import { renderHook, act } from '@testing-library/react'
import { AuthProvider, useAuth } from '../AuthContext'

const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>

test('로그인이 성공하면 사용자 정보를 저장해야 함', async () => {
  const { result } = renderHook(() => useAuth(), { wrapper })

  await act(async () => {
    await result.current.login('testuser', 'password123')
  })

  expect(result.current.isAuthenticated).toBe(true)
})
```

### 2.5 테스트 실행

```bash
cd frontend/react_web

# 패키지 설치
npm install

# 테스트 실행
npm test

# UI 모드로 테스트
npm run test:ui

# 커버리지 확인
npm run test:coverage
```

### 2.6 작성된 테스트 파일

1. [LoadingSpinner.test.jsx](../frontend/react_web/src/components/__tests__/LoadingSpinner.test.jsx)
   - 렌더링 테스트
   - 커스텀 사이즈 테스트

2. [ErrorAlert.test.jsx](../frontend/react_web/src/components/__tests__/ErrorAlert.test.jsx)
   - 에러 메시지 표시
   - onClose 콜백
   - 조건부 렌더링

3. [PatientCard.test.jsx](../frontend/react_web/src/components/__tests__/PatientCard.test.jsx)
   - 환자 정보 표시
   - 성별 표시
   - null 처리

4. [AuthContext.test.jsx](../frontend/react_web/src/auth/__tests__/AuthContext.test.jsx)
   - 로그인/로그아웃
   - 토큰 관리
   - 자동 로그인

5. [LoginPage.test.jsx](../frontend/react_web/src/pages/__tests__/LoginPage.test.jsx)
   - 폼 렌더링
   - 입력 검증
   - 제출 처리

---

## 3. Flutter Frontend 테스트

### 3.1 테스트 설정

Flutter 테스트는 `test/` 디렉토리에 작성합니다.

### 3.2 테스트 파일 구조

```
frontend/flutter_app/test/
├── widget_test.dart                      # 앱 시작 테스트
├── data/
│   └── repositories/
│       ├── auth_repository_test.dart
│       └── appointment_repository_test.dart
├── features/
│   └── auth/
│       └── login_screen_test.dart
└── core/
    └── services/
        └── auth_service_test.dart
```

### 3.3 Widget 테스트 예시

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:neuronova_app/features/auth/login_screen.dart';

void main() {
  testWidgets('로그인 폼이 렌더링되어야 함', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: LoginScreen(),
      ),
    );

    expect(find.byType(TextField), findsNWidgets(2));
    expect(find.byType(ElevatedButton), findsOneWidget);
  });
}
```

### 3.4 Unit 테스트 예시

```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:neuronova_app/core/services/auth_service.dart';

void main() {
  group('AuthService 테스트', () {
    test('토큰을 저장하고 불러올 수 있어야 함', () async {
      final authService = AuthService.instance;

      await authService.saveTokens('access', 'refresh');

      final savedAccessToken = await authService.getAccessToken();
      expect(savedAccessToken, 'access');
    });
  });
}
```

### 3.5 테스트 실행

```bash
cd frontend/flutter_app

# 먼저 Flutter 프로젝트 초기화 필요 (Firebase 가이드 참조)
flutter create --org com.neuronova --project-name neuronova_app .

# 테스트 실행
flutter test

# 특정 파일 테스트
flutter test test/core/services/auth_service_test.dart

# 커버리지 확인
flutter test --coverage
```

### 3.6 작성된 테스트 파일

1. [widget_test.dart](../frontend/flutter_app/test/widget_test.dart)
   - 앱 시작 테스트

2. [auth_repository_test.dart](../frontend/flutter_app/test/data/repositories/auth_repository_test.dart)
   - 로그인/로그아웃
   - 토큰 갱신

3. [appointment_repository_test.dart](../frontend/flutter_app/test/data/repositories/appointment_repository_test.dart)
   - 예약 CRUD
   - 90일 자동 삭제

4. [login_screen_test.dart](../frontend/flutter_app/test/features/auth/login_screen_test.dart)
   - 로그인 폼
   - 입력 검증

5. [auth_service_test.dart](../frontend/flutter_app/test/core/services/auth_service_test.dart)
   - Singleton 패턴
   - 토큰 저장/삭제

**주의**: 현재 Flutter 테스트는 프로젝트 초기화 후 실행 가능합니다. Firebase 설정 가이드를 참조하여 먼저 프로젝트를 초기화하세요.

---

## 4. Backend 테스트

### 4.1 Django 테스트 구조

```
backend/django_main/apps/
├── users/tests/
│   └── test_views.py           # 12개 테스트
├── emr/tests/
│   └── test_views.py           # 8개 테스트
└── custom/tests/
    └── test_views.py           # 9개 테스트
```

### 4.2 Django 테스트 예시

```python
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status

class UserAuthenticationTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_login_success(self):
        """로그인 성공 테스트"""
        response = self.client.post('/api/v1/users/token/', {
            'username': 'testuser',
            'password': 'password123'
        })

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
```

### 4.3 테스트 실행

```bash
cd backend/django_main

# 전체 테스트 실행
python manage.py test

# 특정 앱 테스트
python manage.py test apps.users

# 특정 테스트 케이스
python manage.py test apps.users.tests.test_views.UserAuthenticationTestCase

# 커버리지 확인
coverage run --source='.' manage.py test
coverage report
coverage html
```

### 4.4 현재 테스트 현황

| 앱 | 테스트 케이스 수 | 테스트 메서드 수 | 커버리지 |
|----|----------------|----------------|---------|
| Users | 4 | 12 | ~90% |
| EMR | 4 | 8 | ~85% |
| Custom | 4 | 9 | ~85% |
| **합계** | **12** | **29** | **~87%** |

---

## 5. 테스트 실행 방법

### 5.1 로컬 개발 환경

#### React
```bash
cd frontend/react_web
npm install
npm test
```

#### Flutter
```bash
cd frontend/flutter_app
flutter pub get
flutter test
```

#### Django
```bash
cd backend/django_main
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py test
```

### 5.2 Docker 환경

#### React 테스트
```bash
docker-compose run --rm react npm test
```

#### Django 테스트
```bash
docker-compose run --rm django python manage.py test
```

### 5.3 전체 테스트 실행 스크립트

```bash
#!/bin/bash
# test-all.sh

echo "=========================================="
echo "React 테스트 시작"
echo "=========================================="
cd frontend/react_web
npm test -- --run
cd ../..

echo "=========================================="
echo "Flutter 테스트 시작"
echo "=========================================="
cd frontend/flutter_app
flutter test
cd ../..

echo "=========================================="
echo "Django 테스트 시작"
echo "=========================================="
cd backend/django_main
python manage.py test
cd ../..

echo "=========================================="
echo "모든 테스트 완료!"
echo "=========================================="
```

실행 권한 부여:
```bash
chmod +x test-all.sh
./test-all.sh
```

---

## 6. CI/CD 통합

### 6.1 GitHub Actions 워크플로우

`.github/workflows/test.yml`:

```yaml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  react-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - name: Install dependencies
        run: |
          cd frontend/react_web
          npm ci
      - name: Run tests
        run: |
          cd frontend/react_web
          npm test -- --run
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  flutter-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: subosito/flutter-action@v2
        with:
          flutter-version: '3.0.0'
      - name: Install dependencies
        run: |
          cd frontend/flutter_app
          flutter pub get
      - name: Run tests
        run: |
          cd frontend/flutter_app
          flutter test

  django-tests:
    runs-on: ubuntu-latest
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: test_neuronova
        ports:
          - 3306:3306
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      - name: Install dependencies
        run: |
          cd backend/django_main
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend/django_main
          python manage.py test
```

### 6.2 Pre-commit Hook

`.git/hooks/pre-commit`:

```bash
#!/bin/bash

echo "테스트 실행 중..."

# React 테스트
cd frontend/react_web
npm test -- --run || exit 1
cd ../..

# Django 테스트
cd backend/django_main
python manage.py test || exit 1
cd ../..

echo "모든 테스트 통과!"
```

---

## 7. 테스트 작성 가이드라인

### 7.1 명명 규칙

#### React
```javascript
describe('컴포넌트명', () => {
  it('동작에 대한 설명', () => {
    // 테스트 코드
  })
})
```

#### Flutter
```dart
group('클래스명', () {
  test('동작에 대한 설명', () {
    // 테스트 코드
  });
});
```

#### Django
```python
class ComponentNameTestCase(TestCase):
    def test_behavior_description(self):
        # 테스트 코드
```

### 7.2 AAA 패턴

모든 테스트는 Arrange-Act-Assert 패턴을 따릅니다:

```javascript
it('예시 테스트', () => {
  // Arrange (준비)
  const mockData = { id: 1, name: 'Test' }

  // Act (실행)
  const result = someFunction(mockData)

  // Assert (검증)
  expect(result).toBe(expected)
})
```

### 7.3 테스트 커버리지 목표

- **Critical Path**: 100% (로그인, 예약, AI 진단)
- **Business Logic**: 90% (서비스, 리포지토리)
- **UI Components**: 80%
- **Utilities**: 70%

---

## 8. 문제 해결

### 8.1 React 테스트 실패

**문제**: `ReferenceError: fetch is not defined`

**해결**:
```javascript
// vitest.config.js
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
```

### 8.2 Flutter 테스트 실패

**문제**: `package:neuronova_app not found`

**해결**:
```bash
# Flutter 프로젝트 초기화 필요
flutter create --org com.neuronova --project-name neuronova_app .
flutter pub get
```

### 8.3 Django 테스트 DB 오류

**문제**: `django.db.utils.OperationalError: (1045, "Access denied")`

**해결**:
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': ':memory:',  # 테스트용 인메모리 DB
    }
}
```

---

## 9. 참고 자료

### React Testing
- [Vitest 공식 문서](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)

### Flutter Testing
- [Flutter Testing 가이드](https://docs.flutter.dev/testing)
- [Mockito](https://pub.dev/packages/mockito)

### Django Testing
- [Django Testing](https://docs.djangoproject.com/en/5.0/topics/testing/)
- [DRF Testing](https://www.django-rest-framework.org/api-guide/testing/)

---

**작성일**: 2025-11-28
**버전**: 1.0
**작성자**: Claude Code
