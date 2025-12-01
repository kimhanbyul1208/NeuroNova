# 🚨 프로젝트 갭 분석 (Gap Analysis)

> **작성일**: 2025-12-01
> **목적**: "이 프로젝트에 정말 결점이 없는가?"라는 질문에 대한 심층 분석 보고서

---

## 1️⃣ 아키텍처 연결성 (Connectivity)

### ✅ React ↔ Django
- **상태**: 연결됨 (REST API)
- **결점**:
  - **JWT 갱신**: `axios.js`에 인터셉터가 구현되어 있으나, **동시 다발적 요청(Race Condition)** 발생 시 중복 갱신 시도 가능성 있음. (`mutex` 처리 부재)
  - **실시간성**: 분석 결과 확인이 **Polling** 방식임. WebSocket(Django Channels) 부재로 인해 "반응이 없다"고 느낄 수 있음.

### ✅ Flutter ↔ Django
- **상태**: 코드 존재 (`frontend/flutter_app`), 연결 의도 확인됨
- **결점 (Critical)**:
  - **API 엔드포인트 불일치 가능성**: React는 `/api/v1/...`을 쓰는데, Flutter의 `AuthService`나 `PatientHomePage`가 동일한 엔드포인트를 바라보고 있는지 검증 필요.
  - **FCM (Push Notification)**: `settings.py`에 `FCM_SERVER_KEY`가 있지만, 실제 알림 발송 로직(`apps.notifications`)이 Flutter의 `NotificationService`와 연동 테스트되었는지 불분명.
  - **상태 관리**: React는 `Context/Redux` 등을 쓸 것으로 보이나, Flutter는 `setState` 위주로 보임. 복잡한 앱 상태 관리(Provider/Riverpod/Bloc) 도입 고려 필요.

---

## 2️⃣ 보안 (Security) 결점

- **CORS**: `settings.py`에 `CORS_ORIGIN_ALLOW_ALL = True`로 설정됨.
  - 🚨 **위험**: 모든 도메인에서 API 접근 가능. 운영 배포 시 반드시 프론트엔드 도메인만 허용하도록 수정해야 함.
- **DEBUG 모드**: `DEBUG = True`가 기본값.
  - 🚨 **위험**: 에러 발생 시 서버 내부 정보(스택 트레이스, 환경 변수 일부)가 노출될 수 있음.
- **DB 접속 정보**: (방금 수정함) `.env`로 분리했으나, 여전히 `default` 값에 비밀번호가 남아있음. 운영 환경에서는 이 default 값을 제거하거나 더 안전한 값으로 변경 권장.

---

## 3️⃣ 기능적 누락 (Missing Features)

### ❌ 실시간 알림 (Real-time Feedback)
- **현상**: 사용자가 "명령어 입력해도 반응 없음"을 호소.
- **원인**: AI 분석 등 긴 작업(Long-running task) 시 UI가 Polling 주기를 기다려야 함.
- **해결책**: **WebSocket** 도입 또는 Polling 주기를 단축하고, UI에 **Progress Bar**를 명확히 표시.

### ❌ 모바일(Flutter) 전용 기능
- **현상**: Flutter 앱 코드는 있으나, 모바일 특화 기능(카메라로 환부 촬영 후 업로드, 생체 인식 로그인) 구현 여부 불투명.
- **해결책**: 모바일 전용 API 엔드포인트(`api/v1/mobile/...`) 검토 필요.

---

## 4️⃣ 결론 및 제언

**"결점이 없는가?" → ❌ 아닙니다. 개선할 점이 분명히 존재합니다.**

1.  **보안 강화**: `CORS`, `DEBUG` 설정을 배포 환경(`prod.py`)에서 엄격하게 분리하십시오.
2.  **실시간성 확보**: WebSocket 도입을 진지하게 고려하십시오. (특히 AI 진단 대기 시간 동안)
3.  **모바일 연동 검증**: Flutter 앱을 실제 기기에서 실행하여 Django API와 정상 통신하는지, FCM 알림이 오는지 확인이 필요합니다.

이 분석을 바탕으로 `Code_Improvement_Checklist.md`를 업데이트하고, 필요한 경우 추가 문서를 작성하겠습니다.
