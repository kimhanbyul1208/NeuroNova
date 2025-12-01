# 1. 코드 개선 체크리스트 (React + Django)

본 문서는 **Flask(AI 모델 서버)를 제외한** React 프론트엔드와 Django 백엔드 코드베이스의 개선 포인트를 정리한 체크리스트입니다.

---

## 1️⃣ 폴더 구조 및 아키텍처 개선

### 🔹 React (Frontend)
- [ ] **기능별 폴더 분리**: 현재의 단순 구조를 `features/` (기능별) 또는 `components/` (common, layout, domain) 구조로 세분화
  - 예: `src/features/auth`, `src/features/patient`, `src/features/diagnosis`
- [ ] **비즈니스 로직 분리**: 컴포넌트 내의 복잡한 로직을 `hooks/` (Custom Hooks) 또는 `services/` (API 호출)로 이동
- [ ] **상수 및 유틸 관리**: 하드코딩된 문자열, 설정값은 `constants/`, 공통 함수는 `utils/`로 중앙 관리

### 🔹 Django (Backend)
- [ ] **Apps 분리**: 기능 단위(예: `users`, `patients`, `tasks`)로 Django App을 명확히 분리하여 의존성 최소화
- [ ] **Settings 분리**: `settings.py`를 `base.py`, `dev.py`, `prod.py`로 분리하여 환경별 설정 관리
- [ ] **Service Layer 도입**: ViewSet에 집중된 비즈니스 로직을 `services.py` 또는 `selectors.py`로 분리 (Fat Model/View 방지)

---

## 2️⃣ API 통신 및 데이터 관리

- [ ] **API 클라이언트 모듈화**: `axios` 인스턴스를 생성하여 Base URL, Timeout, Interceptor(토큰 주입, 에러 로깅) 공통 설정
- [ ] **API 명세 상수화**: API 엔드포인트 URL을 별도 파일(`apiConfig.js` 등)에서 관리하여 유지보수성 향상
- [ ] **React Query / SWR 도입**: 서버 상태 관리(캐싱, 재검증, 로딩 상태)를 위해 라이브러리 도입 고려 (Redux/Context API 대체)

---

## 3️⃣ 중복 코드 제거 및 재사용성

- [ ] **공통 컴포넌트 추출**: 버튼, 입력 폼, 모달, 알림창 등 반복되는 UI 요소를 공통 컴포넌트로 제작
- [ ] **Serializer 상속 활용**: Django Serializer에서 중복되는 필드나 검증 로직을 `BaseSerializer`로 정의하여 상속
- [ ] **Mixin / Decorator 활용**: 권한 체크, 로깅 등 반복되는 View 로직을 Mixin이나 Decorator로 처리

---

## 4️⃣ UI/UX 개선

- [ ] **로딩 및 에러 상태 처리**: 모든 비동기 요청에 대해 스피너(Skeleton) 및 에러 메시지(Toast/Alert) UI 구현
- [ ] **반응형 디자인**: Mobile/Tablet/Desktop 환경에 대응하는 Grid 시스템 및 Media Query 적용
- [ ] **사용자 피드백 강화**: 버튼 클릭 시 즉각적인 피드백(Ripple 효과, 비활성화 등) 제공

---

## 5️⃣ 타입 및 모델 구조화

- [ ] **TypeScript 도입 (권장)**: React 프로젝트에 TypeScript를 도입하여 컴파일 단계에서 타입 오류 방지
- [ ] **Django Model 정규화**: 데이터베이스 정규화 원칙에 따라 모델 관계(1:1, 1:N, N:M) 재검토 및 인덱싱 설정
- [ ] **DTO / Interface 정의**: 프론트엔드와 백엔드 간 주고받는 데이터 구조(Interface)를 명확히 정의

---

## 6️⃣ 입력 검증 및 에러 처리

- [ ] **Frontend Validation**: `Yup` + `React Hook Form` 등을 사용하여 클라이언트 측 실시간 유효성 검사 강화
- [ ] **Backend Validation**: Serializer의 `validate_` 메서드를 활용하여 데이터 무결성 검증 철저
- [ ] **Global Error Handling**: 프론트엔드(Error Boundary), 백엔드(Custom Exception Handler) 전역 에러 처리기 구현

---

## 7️⃣ 보안 강화 (Critical)

- [ ] **CORS 설정**: `CORS_ORIGIN_ALLOW_ALL = True` 제거하고, `CORS_ALLOWED_ORIGINS`에 프론트엔드 도메인만 명시
- [ ] **DEBUG 모드**: 운영 환경(`prod.py`)에서는 반드시 `DEBUG = False` 설정
- [ ] **DB/Secret 관리**: `settings.py`의 default 값 제거하고, `.env` 누락 시 서버 실행 차단하도록 변경

---

## 8️⃣ 모바일(Flutter) 연동 및 최적화

- [ ] **API 호환성 검증**: React와 동일한 엔드포인트 사용 시, 모바일 환경(쿠키 vs 토큰)에 맞는 인증 방식 확인
- [ ] **FCM 연동**: Django `apps.notifications`와 Flutter `NotificationService` 간의 실제 알림 발송/수신 테스트
- [ ] **상태 관리 고도화**: `setState` 대신 `Provider` 또는 `Riverpod` 도입하여 복잡한 앱 상태 관리

---

## 9️⃣ 실시간성 확보 (Real-time)

- [ ] **WebSocket 도입**: Django Channels를 설치하여 AI 분석 진행률을 실시간으로 푸시 (Polling 대체)
- [ ] **UI 피드백 강화**: 긴 작업 시 단순 로딩 스피너 대신 **Progress Bar** 또는 **Step Indicator** 표시

---

## 🔟 설정 파일 및 환경 변수 관리

- [ ] **Environment Variables**: API Key, DB 접속 정보 등 민감 정보는 `.env` 파일로 관리하고 Git 추적 제외
- [ ] **Config Validation**: 서버 시작 시 필수 환경 변수 로드 여부를 체크하는 로직 추가

---

## 8️⃣ Django API 스펙 명확화

- [ ] **Swagger / OpenAPI 적용**: `drf-spectacular` 등을 사용하여 API 문서를 자동화하고 최신 상태 유지
- [ ] **명확한 Status Code**: 성공(200, 201), 실패(400, 401, 403, 404, 500)에 대한 적절한 HTTP 상태 코드 반환

---

## 9️⃣ 비동기 처리 (Task ID 기반)

- [ ] **Polling / WebSocket**: AI 분석 등 긴 작업에 대해 `task_id`를 발급받고, 프론트엔드에서 주기적 조회(Polling) 또는 소켓 수신 구현
- [ ] **Celery 설정 최적화**: Worker Concurrency, Task Time Limit, Retry 정책 설정
- [ ] **Task 상태 관리**: `PENDING`, `PROCESSING`, `SUCCESS`, `FAILURE` 상태를 명확히 정의하고 DB에 기록

---

## 🔟 예외 처리 및 의존성 정리

- [ ] **Custom Exception**: 비즈니스 로직에 맞는 커스텀 예외 클래스 정의 (예: `PatientNotFoundError`, `AIModelConnectionError`)
- [ ] **Requirements 정리**: `requirements.txt` 또는 `Pipfile`에 실제 사용되는 패키지만 명시 (버전 고정)

---

## 1️⃣1️⃣ 테스트 코드

- [ ] **Unit Test**: Django Model, Serializer, Utility 함수에 대한 단위 테스트 작성
- [ ] **Integration Test**: 주요 API 흐름(회원가입 -> 로그인 -> 환자 등록 -> 진단 요청)에 대한 통합 테스트
- [ ] **Frontend Test**: `Jest` + `React Testing Library`를 이용한 주요 컴포넌트 및 훅 테스트

---

## 1️⃣2️⃣ AI 모델 I/O 문서화 (Interface)

- [ ] **Input Schema**: React에서 Django로 보낼 데이터 포맷 정의 (예: MRI 이미지 규격, 환자 메타데이터 JSON 구조)
- [ ] **Output Schema**: Django가 React로 반환할 분석 결과 포맷 정의 (예: 예측 확률, Heatmap 이미지 URL, 소견 텍스트)

