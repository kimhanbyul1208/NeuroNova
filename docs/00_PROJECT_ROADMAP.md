# 프로젝트 평가 및 향후 로드맵 (Project Evaluation & Roadmap)

**마지막 업데이트**: 2025-11-30

---

## 1. 현재 상태 평가 (Current Status Evaluation)

### 🏆 성과 (Achievements)
*   **문서화 (Documentation)**: 프로젝트 전반, API, Firebase, AI에 대한 문서가 체계적으로 정리되고 한글화되었습니다.
*   **Backend (Django)**: 사용자 관리, 권한 제어, EMR 시스템 등 핵심 기능 구현 완료.
*   **Frontend (Flutter)**: 환자용 앱의 기본 구조, UI, Firebase 연동, 블루투스 비콘 보안 구현 완료.
*   **Frontend (React)**: 의료진용 대시보드 및 환자 관리 기능 구현 완료.

### ⚠️ 부족한 점 & 과제 (Gaps & Challenges)
*   **Flask AI 미구현**: AI 추론 엔진에 대한 설계와 가이드는 완성되었으나, 실제 코드 구현은 다른 개발자에게 할당됨.
*   **서비스 간 통합 미비**: Django와 Flask 간의 통신, Flutter와 백엔드 API 간의 연동 테스트 필요.

---

## 2. 향후 파이프라인 (Future Pipeline)

### Phase 1: Flask AI 서버 구현 (우선순위: 높음) 🔜
> **담당**: 다른 개발자
> **목표**: `docs/12_flask_ai_integration.md` 가이드를 기반으로 실제 작동하는 AI 추론 서버 구축

1.  **환경 설정**: `backend/flask_inference`에 가상환경 및 패키지 설치 (`requirements.txt` 작성).
2.  **기본 구조 구현**: `create_app`, 설정(`config.py`), 로깅 설정.
3.  **모델 로더 & 전처리**: `ModelLoader`, `DICOMProcessor` 구현.
4.  **API 엔드포인트**: `/predict/ct_classification` 등 실제 API 구현 (일단 더미 모델로라도 응답 확인).
5.  **Docker 설정**: `Dockerfile` 및 `docker-compose` 연동 확인.

### Phase 2: Django-Flask 통합 (우선순위: 중간)
> **목표**: Django에서 이미지를 업로드하면 Flask로 분석 요청을 보내고 결과를 저장

1.  **Django View 구현**: `requests` 라이브러리를 사용하여 Flask API 호출 로직 작성.
2.  **결과 저장**: 분석 결과를 DB(`PatientPredictionResult` 모델 등)에 저장하는 로직 구현.
3.  **예외 처리**: 타임아웃, 서버 다운 시 처리 로직 추가.

### Phase 4: 전체 시스템 통합 테스트 (우선순위: 낮음)
> **목표**: 모든 서비스가 유기적으로 작동하는지 확인

1.  **E2E 시나리오 테스트**:
    *   환자 회원가입 → (의료진 승인) → 로그인 → 진료 예약 → (의료진) CT 촬영 → (AI) 분석 → (의료진) 결과 확인 → (환자) 결과 알림 수신.
2.  **배포 준비**: 프로덕션 환경(`docker-compose.prod.yml`)에서의 안정성 확인.

---

## 4. 추천하는 다음 작업 (Next Action)

**Phase 1: Flask AI 서버 구현**을 다른 개발자와 협업하여 시작하는 것을 추천합니다. 현재 문서화가 완벽하게 되어 있으므로, 이를 코드로 옮기는 작업만 수행하면 됩니다.

**Phase 4: E2E 테스트**를 통해 현재 구현된 기능들(Django, Flutter, Firebase)이 정상 작동하는지 확인하는 것도 좋은 선택입니다.

