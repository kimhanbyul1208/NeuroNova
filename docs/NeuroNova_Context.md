# Project Context: NeuroNova (뇌종양 진단 CDSS)

이 문서는 'NeuroNova' 프로젝트의 기술 명세, 데이터베이스 구조, 아키텍처 및 핵심 비즈니스 로직을 정의한다. 
AI 어시스턴트는 이 컨텍스트를 바탕으로 코드를 생성하고 아키텍처를 제안해야 한다.

---

## 1. 프로젝트 개요
* **팀명:** NeuroNova (Neurology + Nova)
* **목적:** 뇌종양 진단을 위한 임상 의사결정 지원 시스템(CDSS) 개발.
* **핵심 가치:** 병원성 정의, 연구 필요성, 데이터 보안(익명화), 시스템 통합.

## 2. 시스템 아키텍처
* **Frontend:**
    * **Web (React):** 의료진용. 대시보드, 데이터 분석, Orthanc DICOM 뷰어 통합.
    * **App (Flutter):** 환자용. 예약, 알림, 진료 요약 조회 (로컬 저장소 활용).
* **Backend (Main):**
    * **Django:** 메인 컨트롤러. Auth, DB 관리, API Gateway 역할.
    * **Nginx + Gunicorn:** 배포 서버 구조.
* **Backend (AI/Inference):**
    * **Flask:** Stateless 추론 엔진. Django로부터 익명화된 데이터를 받아 ML 모델(GPU)로 분석 후 결과 반환.
    * **Orthanc:** DICOM(의료 영상) 서버.
* **Database:** PostgreSQL (권장), Redis (캐싱/큐).

---

## 3. 데이터베이스 설계 (Schema & Permissions)

### 3.1 권한 정책 (RBAC)
* **Admin:** System All Permissions (유일하게 Hard Delete 가능).
* **Doctor:**
    * **Django/Custom:** **CRU (Create, Read, Update)**
        * *주의:* 의료 데이터 무결성을 위해 **삭제(Delete)는 허용하지 않음.**
        * 삭제가 필요한 경우 `status=CANCELLED` 또는 `is_active=False`로 처리하는 **Soft Delete(Update)** 방식을 사용.
    * **EMR:** **CRU (Create, Read, Update)**
        * 진료기록(SOAP), 처방 작성 및 수정 필수.
* **Nurse:** R (EMR), C/U (Vitals).
* **Patient:** R (Self), C/U (Self Profile/Appointment).



### 3.2 EMR (OpenEMR 호환 영역)
* **Patient:** 환자 기본 정보 (pid, name, birth, insurance 등).
* **Encounter:** 진료 세션 (date, reason, doctor_id, patient_id).
* **FormSOAP:** SOAP 차트 (Subjective, Objective, Assessment, Plan).
* **FormVitals:** 활력 징후 (혈압, 체온, BMI 등).
* **MergedDocument (핵심):** * 통합 진단 보고서.
    * `references` 필드(JSON)를 통해 EMR(SOAP, Vitals)과 Custom(Prediction, Prescription) 테이블의 ID를 동적으로 참조한다.

### 3.3 Custom (NeuroNova Core)
* **Appointment (New):** 병원 예약 관리.
    * Fields: `scheduled_at`, `status` (PENDING, CONFIRMED...), `visit_type`, `doctor_id`, `patient_id`.
* **Patient_Prediction_Result:** AI 진단 결과.
    * Fields: `model_name`, `confidence_score`, `xai_image_path`, `doctor_feedback` (Human-in-the-loop).
* **Prescription:** 약물 처방 내역.
* **UserProfile:** 확장 유저 프로필 (Role, FCM Token 등).

---

## 4. 핵심 비즈니스 로직 및 보안

### 4.1 데이터 흐름 및 보안 (De-identification)
1.  **요청:** Client -> Django.
2.  **익명화:** Django가 DB에서 데이터를 꺼낸 후, PII(개인식별정보)를 제거하고 `pid`와 의료 데이터만 Flask로 전송.
3.  **추론:** Flask(Model) -> 결과 반환 -> Django가 DB에 저장.

### 4.2 환자 앱 데이터 정책 (Local Caching & Expiration)
* **보안 원칙:** 환자의 개인정보 보호를 최우선으로 한다.
* **저장 방식:** Flutter 내부 DB(SQLite)에 데이터를 저장하되, **반드시 암호화(SQLCipher)** 되어야 한다.
* **자동 삭제:**
    * 모든 로컬 데이터는 `expire_at` 필드를 가진다 (생성일 + 90일).
    * 앱 실행 시(Splash Screen) 만료된 데이터를 검사하여 로컬에서 **영구 삭제**한다.
    * API 호출 최소화를 위해 유효 기간 내 데이터는 로컬 DB에서 불러온다.

### 4.3 예약 시스템 (Appointment)
* 환자는 앱에서 예약을 신청(Create)하고 상태를 조회(Read)한다.
* 의사는 웹에서 예약을 확정(Update Status)하거나 일정을 변경한다.

---

## 5. 개발 가이드라인
* **Coding Standard:** 변수명, API Key, 설정값은 하드코딩하지 않고 환경변수(.env)나 설정 파일로 분리한다 (Soft-coding).
* **Design Patterns:**
    * **Factory Pattern:** 다양한 AI 모델 로딩 시 사용.
    * **Strategy Pattern:** 알림 발송 방식(Email vs Push) 등에 사용.
    * **DTO/Serializer:** Django와 Flask 간 통신 시 데이터 검증 엄격화.