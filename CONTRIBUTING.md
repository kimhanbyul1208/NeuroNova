# Contributing to NeuroNova

NeuroNova 프로젝트에 기여해주셔서 감사합니다! 이 문서는 프로젝트 기여 가이드라인입니다.

---

## 1. 시작하기 (Getting Started)

### 저장소 클론
```bash
git clone https://github.com/kimhanbyul1208/NeuroNova.git
cd NeuroNova
```

### 개발 환경 설정
각자 담당 분야의 README를 참고하세요:
- [Django Backend](backend/django_main/README.md)
- [React Web](frontend/react_web/README.md)
- [Flutter App](frontend/flutter_app/README.md)

---

## 2. 개발 프로세스 (Development Process)

### Git 워크플로우 & 브랜치 전략
- **Main**: 프로덕션 브랜치
- **Develop**: 개발 브랜치 (선택사항)
- **Feature**: `feature/기능명` (새 기능 개발)
- **Bugfix**: `bugfix/버그명` (버그 수정)
- **Hotfix**: `hotfix/이슈명` (긴급 수정)

### 작업 순서
1. `main` 브랜치에서 최신 코드 Pull
2. `feature/your-feature` 브랜치 생성
3. 작업 및 커밋 (작은 단위로)
4. Push 및 Pull Request (PR) 생성

### 커밋 메시지 규칙
- `feat`: 기능 추가
- `fix`: 버그 수정
- `refactor`: 리팩토링
- `docs`: 문서 작업
- `style`: 코드 포맷팅
- `test`: 테스트 추가
- `chore`: 기타 설정

### Pull Request (PR) 가이드라인
- **하나의 PR은 하나의 목적만** 가집니다.
- **PR 생성 전 체크리스트**:
  - [ ] 코드가 정상 작동하는지 테스트
  - [ ] 타입 힌트 및 로깅 추가
  - [ ] 하드코딩 제거 (환경변수 사용)
  - [ ] 문서 업데이트

### 이슈 관리
- **버그 제보**: 문제 상황과 재현 방법을 명확히 기술
- **기능 요청**: 명확하고 간결한 제목 사용

---

## 3. 공통 코딩 규칙 (General Coding Standards)

### 기본 원칙
- **Single Responsibility**: 함수는 하나의 역할만 수행합니다.
- **DRY (Don't Repeat Yourself)**: 중복 코드를 작성하지 않습니다.
- **Side Effects 최소화**: 예측 가능한 코드를 작성합니다.
- **예외 처리**: 모든 로직은 기본적으로 `try-catch`를 사용하고 명확한 에러 메시지를 설정합니다.

### 네이밍 규칙
- **명확성**: 이름은 의도를 정확히 드러내야 합니다.
- **약어 지양**: 불필요한 줄임말을 피합니다 (URL, ID 등 관용적 약어 제외).
- **Boolean**: `is`, `has`, `can`, `should`로 시작합니다.
- **함수**: 동사로 시작합니다.

### 코드 스타일 & 품질
- **함수 크기**: 30줄 이하, 파라미터 3개 이하 권장.
- **비동기**: `async/await` 패턴 사용.
- **데이터 구조**: 입력/출력 데이터 형식은 **MAP(딕셔너리)** 구조로 통일합니다.
- **비교 연산**: 항상 `===` (Strict Equality) 사용.
- **매직 넘버 금지**: 상수로 분리하여 관리합니다.
- **설정 관리**: 비밀번호, API Key 등은 `.env` 파일로 관리하며 하드코딩을 금지합니다.

---

## 4. 기술 스택별 가이드 (Tech Stack Guidelines)

### Backend (Django/Python)
- **타입 힌트**: 모든 함수에 Type Hint 명시.
- **로깅**: `print` 대신 `logging` 모듈 사용.
- **API 규칙**:
  - RESTful 설계 (명사 기반, 복수형 엔드포인트).
  - 에러 응답 구조 통일: `{ code, message, detail }`.
  - URI는 전역 상수로 관리.
- **Django 데코레이터**:
  - `@transaction.atomic`: 트랜잭션 원자성 보장.
  - `@action`: 추가 Endpoint 정의.
- **보안**: 비밀번호 해싱은 `BCryptSHA256PasswordHasher` 사용.

### Frontend (React/TypeScript)
- **컴포넌트**: 작고 재사용 가능하게 설계.
- **상태 관리**: 상태 최소화, 필요한 경우에만 Lifting State Up.
- **API 호출**: 컴포넌트 내부가 아닌 **Service 레이어**에서 관리.
- **TypeScript**: Props 등 모든 타입 명확히 정의.

### Mobile (Flutter/Dart)
- **레이아웃**: RenderFlex Overflow 방지를 위해 `SingleChildScrollView + Column` 패턴 활용.
- **로깅**: `logging` 패키지 활용.

---

## 5. 데이터 및 연구 (Data & Research)
- **익명화/가명화**: 환자 데이터 저장 시 연구 데이터셋 자동 생성을 위해 적용.
- **XAI**: 임상 의사결정 지원을 위한 설명 가능한 AI 시각화 적용.

---

## 6. 테스트 및 안정성 (Testing)
- **단위 테스트**: 핵심 비즈니스 로직은 반드시 테스트합니다.
- **API 테스트**: 최소한 성공/실패 케이스를 각각 1개 이상 작성합니다.

---

## 문의
질문이나 도움이 필요하면 GitHub Issues 또는 팀 채팅방을 이용해주세요.

**Happy Coding! 🚀**

