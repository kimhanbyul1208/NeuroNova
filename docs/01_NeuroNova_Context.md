# Project Context: NeuroNova (뇌종양 진단 CDSS)

이 문서는 'NeuroNova' 프로젝트의 기술 명세, 데이터베이스 구조, 아키텍처 및 핵심 비즈니스 로직을 정의한다. 
AI 어시스턴트는 이 컨텍스트를 바탕으로 코드를 생성하고 아키텍처를 제안해야 한다.

---

## 1. 프로젝트 개요
* **팀명:** NeuroNova (Neurology + Nova)
* **목적:** 뇌종양 진단을 위한 임상 의사결정 지원 시스템(CDSS) 개발.
* **핵심 가치:** 병원성 정의, 연구 필요성, 데이터 보안(익명화), 시스템 통합.

---

## 2. 시스템 아키텍처

시스템 아키텍처
[Flutter App (환자)]    [React Web (의료진)]
         ↓                      ↓
           [Nginx + Gunicorn]
         ↓
    [Django 메인 서버] ←→ [Flask AI 추론] + [Orthanc DICOM]
         ↓
  [MySQL + Redis]

======

[Flutter App]       [React Web]
       ↓                 ↓
                 [Nginx]
       ┌───────────┴───────────┐
       │                       │
[Gunicorn - Django]     [Gunicorn - Flask AI]
       │                       │
       └───────────┬───────────┘
                   ↓
            [MySQL + Redis]
                   ↓
           [Orthanc DICOM 서버]

======


* **Frontend:**
    * **Web (React):** 의료진용. 대시보드, 환자 관리, 데이터 분석, Orthanc DICOM 뷰어 통합.
    * **App (Flutter):** 환자용. 예약, 알림, 진료 요약 조회 (로컬 저장소 활용), 블루투스 보안 다운로드.
* **Backend (Main):**
    * **Django:** 메인 컨트롤러. Auth, DB 관리, API Gateway 역할.
    * **Nginx + Gunicorn:** 배포 서버 구조.
* **Backend (AI/Inference):**
    * **Flask:** Stateless 추론 엔진. Django로부터 익명화된 데이터를 받아 ML 모델(GPU)로 분석 후 결과 반환.
    * **Orthanc:** DICOM(의료 영상) 서버.
* **Database & Cache:**
    * **MySQL:** 메인 관계형 데이터베이스.
    * **Redis:** 캐싱 및 세션 저장소. 로그인 세션 관리, API 응답 캐싱, 비동기 작업 큐(Celery 등)의 브로커 역할 수행.

---

## 3. 데이터베이스 설계 (Schema & Permissions)

### 3.1 권한 정책 (RBAC)
* **Admin:** System All Permissions (유일하게 Hard Delete 가능).
* **Doctor:**
    * **Django/Custom:** **CRU (Create, Read, Update)**. 의료 데이터 무결성을 위해 **삭제(Delete)는 허용하지 않음** (Soft Delete 사용).
    * **EMR:** **CRU**. 진료기록(SOAP), 처방 작성 및 수정 필수.
    * **Privileged Role:** 가입 시 즉시 활성화되지 않고 관리자 승인(`approval_status='APPROVED'`)이 필요함.
* **Nurse:** R (EMR), C/U (Vitals). 가입 시 승인 필요.
* **Patient:** R (Self), C/U (Self Profile/Appointment). 가입 시 즉시 활성화.

### 3.2 EMR (OpenEMR 호환 영역)
* **Patient:** 환자 기본 정보 (pid, 이름, 생년월일, 보험번호).
* **Encounter:** 진료 세션 (날짜, 사유, 상태, 담당의).
* **FormSOAP:** SOAP 차트 (Subjective, Objective, Assessment, Plan).
* **FormVitals:** 활력 징후 (혈압, 체온, BMI 자동 계산).
* **MergedDocument:** 통합 진단 보고서. EMR과 Custom 테이블의 ID를 참조하여 문서화.

### 3.3 Custom (NeuroNova Core)
* **Department:** 진료과 정보 (위치, 연락처).
* **Doctor:** 의사 정보 (면허번호, 전문분야).
* **PatientDoctor:** 환자-의사 N:M 관계 (주치의 설정).
* **Appointment:** 예약 관리 (상태, 방문 유형).
* **PatientPredictionResult:** AI 진단 결과.
    * 모델명, 신뢰도, XAI 이미지 경로, 의사 피드백(Human-in-the-loop).
* **Prescription:** 약물 처방 내역.
* **UserProfile:** 확장 유저 프로필 (Role, FCM Token, Approval Status).

---

## 4. 핵심 비즈니스 로직 및 보안

### 4.1 데이터 흐름 및 보안 (De-identification)
1.  **요청:** Client -> Django.
2.  **익명화:** Django가 DB에서 데이터를 꺼낸 후, PII(개인식별정보: 이름, 주민번호 등)를 제거하고 `pid`와 의료 데이터만 Flask로 전송.
    * *Note:* 결과 저장 시 환자 식별을 위해 `pid`는 유지하되, 외부 유출 시 개인을 특정할 수 없도록 최소한의 정보만 사용.
3.  **추론:** Flask(Model) -> 결과 반환 -> Django가 DB에 저장.

### 4.2 환자 앱 데이터 정책 (Local Caching & Expiration)
* **보안 원칙:** 환자의 개인정보 보호 최우선.
* **저장 방식:** Flutter 내부 DB(SQLite)에 암호화(SQLCipher)하여 저장.
* **자동 삭제:** 생성일로부터 90일(`expire_at`) 경과 시 로컬에서 영구 삭제.
* **위치 기반 보안:** 의료 기록 다운로드는 병원 내 블루투스 비콘이 감지될 때만 허용.

### 4.3 예약 및 환자 관리
* **환자:** 앱에서 예약 신청, 조회.
* **의료진 (Web):**
    * **환자 등록:** 신규 환자 정보 입력 및 등록.
    * **담당의 배정:** 환자에게 주치의 배정.
    * **예약 관리:** 예약 확정, 변경, 취소.

---

## 5. 프로젝트 파일 구조 (Current Status)

```
final_pr/
├── backend/
│   └── django_main/              ✅ 기본 구조 완료
│       ├── apps/
│       │   ├── core/             (BaseModel, permissions)
│       │   ├── users/            (UserProfile, Department, Auth)
│       │   ├── emr/              (Patient, Encounter, SOAP, Vitals, Document)
│       │   ├── custom/           (Doctor, Appointment, Prediction, Prescription)
│       │   └── notifications/    (알림 로직)
│       ├── config/constants.py   ✅ 상수 정의 (Roles, Status 등)
│       ├── neuronova/
│       │   ├── settings.py       ✅ 환경변수, Redis, 권한 설정
│       │   └── urls.py           ✅ API 라우팅
│       └── requirements.txt
│
├── frontend/
│   ├── react_web/                ✅ 의료진용 웹 (Dashboard, Patient Management)
│   │   └── src/
│   │       ├── pages/            (Dashboard, PatientList, PatientDetail 등)
│   │       ├── components/       (Modals, Cards, Charts)
│   │       └── auth/             (AuthContext)
│   │
│   └── flutter_app/              ✅ 환자용 앱 (Profile, Records, Bluetooth Security)
│       └── lib/
│           ├── features/         (login, patient, appointment, medication, records, profile)
│           ├── data/             (models, repositories)
│           └── core/             (config, services - Bluetooth/Notification)
│
├── docker-compose.yml            ✅ MySQL, Redis, Orthanc, App Services
└── docs/                         ✅ 상세 명세 문서
```

---

## 6. 개발 가이드라인
* **Coding Standard:** 변수명, API Key, 설정값은 하드코딩하지 않고 환경변수(.env)나 설정 파일로 분리 (Soft-coding).
* **Design Patterns:** Factory (AI 모델), Strategy (알림), DTO/Serializer (데이터 검증).
* **Permission Control:** 특수 권한(의사 등)은 `ALLOW_PRIVILEGED_SIGNUP` 플래그에 따라 승인 대기 처리.

---

## 7. 보안 체크리스트 (Security Checklist)

### 7.1 완료된 보안 조치
* **민감 정보 제거:** `settings.py`의 DB 정보, Secret Key 등을 `.env`로 이관.
* **Git 보안:** `.gitignore`에 `.env`, `*.log`, `db.sqlite3`, `media/` 등 포함.
* **Docker 보안:** 로컬 DB 컨테이너 제거 (원격 DB 사용), Redis/Django/Flask/React 컨테이너 구성.

### 7.2 배포 전 필수 체크
* [ ] `.env` 파일 생성 및 `SECRET_KEY`, `DB_PASSWORD`, `JWT_SECRET_KEY` 변경 (강력한 비밀번호 사용).
* [ ] `DEBUG=False` 설정 및 `ALLOWED_HOSTS` 도메인 추가.
* [ ] Git 히스토리에 민감 정보가 없는지 재확인 (`git log` 검사).
* [ ] Firebase `service-account.json` 파일 권한 확인 및 `.gitignore` 포함 여부 확인.

### 7.3 권장 보안 조치
* **HTTPS/SSL:** Let's Encrypt 인증서 적용 및 Nginx SSL 설정.
* **DB 보안:** SSL/TLS 연결 사용, 최소 권한 원칙 적용.
* **API 보안:** CORS 설정(`ALLOWED_HOSTS`), JWT 만료 시간 설정, Rate Limiting 구현.

---

## 8. 테스트 전략 (Testing Strategy)

### 8.1 테스트 개요
| 종류 | 목적 | 목표 커버리지 |
|------|------|--------------|
| **Unit** | 개별 함수/메서드 검증 | 80% 이상 |
| **Integration** | 모듈 간 연동 검증 | 60% 이상 |
| **E2E** | 전체 사용자 시나리오 검증 | 주요 기능 100% |

### 8.2 Backend (Django) 테스트
* **도구:** `Django TestCase`, `DRF APITestCase`.
* **실행:** `python manage.py test`
* **주요 테스트 대상:**
    * **Users:** 회원가입, 로그인, 권한 제어 (RBAC).
    * **EMR:** 환자 생성, 진료 기록 조회, SOAP/Vitals 생성.
    * **Custom:** 예약 생성/확인/취소, AI 진단 결과 검증(Human-in-the-loop).

### 8.3 Frontend (React) 테스트
* **도구:** `Vitest`, `React Testing Library`.
* **실행:** `npm test`
* **주요 테스트 대상:**
    * **Components:** 렌더링, 사용자 상호작용 (버튼 클릭 등).
    * **Context:** AuthContext (로그인 상태 관리).
    * **Pages:** 로그인 페이지, 환자 목록 페이지 등 주요 화면.

### 8.4 Frontend (Flutter) 테스트
* **도구:** `flutter_test`, `mockito`.
* **실행:** `flutter test`
* **주요 테스트 대상:**
    * **Widgets:** 앱 시작, 로그인 폼 렌더링.
    * **Repositories:** AuthRepository (토큰 관리), AppointmentRepository.
    * **Services:** AuthService (Singleton 패턴).