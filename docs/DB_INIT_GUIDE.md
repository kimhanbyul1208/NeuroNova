# 테스트 데이터 초기화 가이드
## Django 기본 테이블 (자동 생성, 테스트 데이터 불필요)

| 테이블명                           | 설명                | 비고                    |
|--------------------------------|-------------------|------------------------|
| auth_group                     | 역할 그룹            | ❌ 사용 안 함 (UserProfile.role 사용) |
| auth_group_permissions         | 그룹 ↔ 권한 매핑      | ❌ 사용 안 함              |
| auth_user_user_permissions     | 유저 개별 권한         | ❌ 사용 안 함              |
| auth_user_groups               | 유저 ↔ 그룹 관계      | ❌ 사용 안 함              |
| django_session                 | 세션 정보            | ⚠️ Django Admin용만 (자동 생성) |
| django_content_type            | 모델 메타데이터        | ✅ Django 내부용 (자동 생성)   |
| django_migrations              | 마이그레이션 이력      | ✅ Django 내부용 (자동 생성)   |
| django_admin_log               | Admin 작업 로그      | ✅ Admin 사용 시 자동 생성     |


## 📋 개요

Django의 management command를 사용하여 NeuroNova 데이터베이스에 테스트 데이터를 자동으로 생성합니다.

- **기능**: 모든 모델에 대해 현실적인 테스트 데이터 생성
- **데이터 개수**: 기본 100개 (옵션으로 변경 가능)
- **데이터 품질**: Faker 라이브러리를 사용한 한국어 이름, 주소, 전화번호 등 현실적인 데이터
- **DB 관계**: 모든 Foreign Key 및 OneToOne 관계 자동 처리

## 🗂️ DB 모델 구조

### Core Models
- **User** (Django 기본 모델)
- **Department**: 진료과 정보
- **UserProfile**: 사용자 프로필 (User와 1:1)

### EMR Models
- **Patient**: 환자 기본 정보 (User와 1:1, 선택적 - 앱 미사용 환자 가능)
- **Encounter**: 진료 세션
- **FormSOAP**: SOAP 차트 (Encounter와 1:1)
- **FormVitals**: 활력 징후 (Encounter와 1:N)
- **MergedDocument**: 통합 의료 문서

### Custom Models
- **Doctor**: 의사 상세 정보 (User와 1:1)
- **PatientDoctor**: 환자-의사 관계 (N:M)
- **Appointment**: 예약 관리
- **PatientPredictionResult**: AI 진단 결과
- **Prescription**: 처방전

### Notification Models
- **NotificationLog**: 알림 기록

## 🚀 실행 방법

### 1. 사전 준비

#### Faker 라이브러리 설치
```bash
pip install faker
```

#### 데이터베이스 마이그레이션
```bash
cd backend/django_main
python manage.py makemigrations
python manage.py migrate
```

**최신 마이그레이션 (2025-12-03)**:
- `emr.0002_alter_patient_user`: Patient.user 필드를 nullable로 변경
- 이 마이그레이션은 기존 데이터에 영향을 주지 않으며, 새로운 환자 등록 방식을 지원합니다

### 2. 기본 실행

기본적으로 각 모델당 100개의 데이터를 생성합니다.

```bash
python manage.py init_test_data
```

### 3. 옵션 사용

#### 데이터 개수 변경
```bash
# 각 모델당 50개 생성
python manage.py init_test_data --count 50

# 각 모델당 200개 생성
python manage.py init_test_data --count 200
```

#### 기존 데이터 삭제 후 생성
```bash
python manage.py init_test_data --clear
```

#### 옵션 조합
```bash
python manage.py init_test_data --clear --count 150
```

## 📊 생성되는 데이터

### 1. Department (진료과) - 5개
- 신경외과, 신경과, 영상의학과, 병리과, 재활의학과
- 각 진료과는 위치 및 대표 전화번호 포함

### 2. Users & Profiles
사용자 역할별 분포:
- **환자 (PATIENT)**: 60%
- **의사 (DOCTOR)**: 20%
- **간호사 (NURSE)**: 15%
- **관리자 (ADMIN)**: 5%

기본 계정:
- Username: `patient_0001`, `doctor_0001`, `nurse_0001`, `admin_0001`
- Password: `testpass123`

**자동 환자 레코드 생성**:
- PATIENT 역할로 회원가입 시 자동으로 Patient 레코드가 생성됩니다
- PID는 `PT-YYYYMMDD-XXXX` 형식으로 자동 할당됩니다
- 기본 생년월일: 2000-01-01 (나중에 수정 가능)
- 기본 성별: Other (나중에 수정 가능)

### 3. Patient (환자)
- 고유 환자 번호 (PID): `PT-2025-1000` ~ `PT-2025-1099`
- 한국어 이름 (성, 이름)
- 생년월일 (18~85세)
- 성별, 전화번호, 이메일
- 주소 (한국 주소 형식)
- 건강보험 번호
- 비상 연락처

**중요 변경사항 (2025-12-03)**:
- Patient의 `user` 필드가 **nullable**로 변경되었습니다
- 두 가지 환자 등록 방식을 지원합니다:
  1. **환자 앱 회원가입**: User + UserProfile + Patient 모두 자동 생성 (user 필드 연결됨)
  2. **의료진 직접 등록**: Patient만 생성 (user 필드 null, 나중에 앱 계정 연결 가능)

**테스트 데이터 생성 시**:
- 전체 환자의 70%는 User 계정과 연결되어 생성됩니다 (앱 사용자)
- 전체 환자의 30%는 User 계정 없이 생성됩니다 (의료진이 직접 등록)

### 4. Doctor (의사)
- 의사 면허 번호: `DOC-2024000` ~
- 전문 분야: Neurosurgery, Neurology, Radiology, Oncology, Pathology
- 소속 부서 및 경력 정보

### 5. Encounter (진료 기록)
- 환자-의사 매칭
- 진료 일시 (최근 1년)
- 내원 사유 (두통, 시력저하, 보행장애 등)
- 진료 부서
- 진료 상태 (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED)

### 6. FormSOAP (SOAP 차트)
각 Encounter마다 하나씩 생성:
- Subjective (주관적 소견)
- Objective (객관적 소견)
- Assessment (평가)
- Plan (계획)

### 7. FormVitals (활력 징후)
- 혈압 (수축기/이완기)
- 체중, 신장
- 체온, 맥박, 호흡수
- 산소 포화도
- BMI 자동 계산

### 8. Appointment (예약)
- 향후 60일 이내의 예약 생성
- 예약 상태: PENDING, CONFIRMED, CANCELLED, NO_SHOW, COMPLETED
- 방문 유형: FIRST_VISIT, FOLLOW_UP, CHECK_UP, EMERGENCY
- 예약 시간: 15/30/45/60분

### 9. PatientPredictionResult (AI 진단 결과)
- AI 모델 정보: NeuroNova_Brain_v2.1
- 예측 클래스: Glioma, Meningioma, Pituitary, No Tumor
- 신뢰도 점수 (0.65 ~ 0.99)
- 클래스별 확률 분포
- XAI 이미지 경로
- 의사 피드백: CORRECT, INCORRECT, AMBIGUOUS, NEEDS_REVIEW

### 10. Prescription (처방전)
약물 예시:
- Dexamethasone 4mg
- Levetiracetam 500mg
- Phenytoin 100mg
- Temozolomide 100mg
- Mannitol 20%

투여 경로: Oral, IV, IM, Topical, Subcutaneous

### 11. MergedDocument (통합 문서)
- 문서 유형: FINAL_REPORT, REFERRAL, DISCHARGE_SUMMARY, LAB_RESULT
- 문서 상태: DRAFT, PENDING_REVIEW, APPROVED, REJECTED
- 참조 데이터 (references JSON)
- 스냅샷 데이터 (snapshot_data JSON)

### 12. NotificationLog (알림)
- 알림 유형: 예약 알림, 진단 결과, 처방전 등
- 읽음 여부
- 푸시 발송 상태 및 오류 메시지

## 🔍 데이터 확인

### Django Admin
```bash
python manage.py createsuperuser
python manage.py runserver
# http://localhost:8000/admin 접속
```

### Django Shell
```bash
python manage.py shell
```

```python
from apps.users.models import UserProfile
from apps.emr.models import Patient, Encounter
from apps.custom.models import Doctor, Appointment

# 전체 환자 수
print(f"Total Patients: {Patient.objects.count()}")

# 의사별 진료 건수
for doctor in Doctor.objects.all()[:5]:
    encounter_count = Encounter.objects.filter(doctor=doctor.user).count()
    print(f"Dr. {doctor.user.get_full_name()}: {encounter_count} encounters")

# 예약 현황
for status in ['PENDING', 'CONFIRMED', 'CANCELLED']:
    count = Appointment.objects.filter(status=status).count()
    print(f"{status}: {count}")
```

### MySQL 직접 확인
```sql
-- 데이터베이스 연결
mysql -u root -p neuronova_1_db

-- 테이블별 레코드 수 확인
SELECT
    TABLE_NAME,
    TABLE_ROWS
FROM
    information_schema.TABLES
WHERE
    TABLE_SCHEMA = 'neuronova_1_db'
ORDER BY
    TABLE_ROWS DESC;

-- 환자 목록 확인
SELECT pid, first_name, last_name, gender, phone
FROM emr_patient
LIMIT 10;

-- 진료 기록 확인
SELECT
    e.id,
    CONCAT(p.last_name, p.first_name) as patient_name,
    e.encounter_date,
    e.status
FROM
    emr_encounter e
JOIN
    emr_patient p ON e.patient_id = p.id
LIMIT 10;
```

## 🧹 데이터 초기화

### 전체 데이터 삭제 후 재생성
```bash
python manage.py init_test_data --clear --count 100
```

### 수동 데이터 삭제 (Django Shell)
```python
from django.contrib.auth.models import User
from apps.users.models import Department, UserProfile
from apps.emr.models import Patient, Encounter
from apps.custom.models import Doctor, Appointment
from apps.notifications.models import NotificationLog

# 모든 데이터 삭제 (역순)
NotificationLog.objects.all().delete()
Appointment.objects.all().delete()
Encounter.objects.all().delete()
Patient.objects.all().delete()
Doctor.objects.all().delete()
UserProfile.objects.all().delete()
User.objects.all().delete()
Department.objects.all().delete()
```

## ⚠️ 주의사항

1. **개발 환경에서만 사용**: 이 커맨드는 테스트 및 개발 목적으로만 사용하세요.
2. **프로덕션 주의**: `--clear` 옵션은 모든 데이터를 삭제합니다. 프로덕션 환경에서는 절대 사용하지 마세요.
3. **Faker 의존성**: `pip install faker` 실행 필수
4. **DB 백업**: 중요한 데이터가 있다면 실행 전 백업하세요.
5. **마이그레이션**: 최신 마이그레이션이 적용된 상태에서 실행하세요.

## 🐛 트러블슈팅

### 1. Faker 설치 오류
```bash
# 가상환경 활성화 확인
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Faker 재설치
pip install --upgrade faker
```

### 2. Foreign Key 오류
```bash
# 마이그레이션 재실행
python manage.py makemigrations
python manage.py migrate --run-syncdb
```

### 3. 메모리 부족
```bash
# 데이터 개수 줄이기
python manage.py init_test_data --count 50
```

### 4. 기존 데이터 충돌
```bash
# 기존 데이터 삭제 후 재생성
python manage.py init_test_data --clear
```

## 📝 추가 정보

### 코드 위치
- Command 파일: `backend/django_main/apps/core/management/commands/init_test_data.py`
- 모델 정의:
  - `backend/django_main/apps/users/models.py`
  - `backend/django_main/apps/emr/models.py`
  - `backend/django_main/apps/custom/models.py`
  - `backend/django_main/apps/notifications/models.py`

### 데이터 일관성
- 모든 관계형 데이터는 자동으로 연결됩니다
- Soft delete 필드 (`is_active`, `deleted_at`)는 활성 상태로 생성됩니다
- Timestamp 필드 (`created_at`, `updated_at`)는 자동 생성됩니다

### 재현성
- Random seed가 고정되어 있어 동일한 데이터 생성 가능
- Seed 변경: `init_test_data.py`의 `Faker.seed(42)` 및 `random.seed(42)` 수정

## 🔄 최근 변경사항 (2025-12-03)

### Patient 모델 업데이트
**변경 내용**: Patient.user 필드를 nullable로 변경

**마이그레이션**:
```bash
python manage.py migrate emr 0002_alter_patient_user
```

**영향**:
1. **기존 데이터**: 영향 없음. 기존 Patient 레코드는 그대로 유지됩니다.
2. **새로운 기능**:
   - 환자 앱 회원가입 시 자동으로 Patient 레코드 생성
   - 의료진이 앱 계정 없는 환자 직접 등록 가능
   - 나중에 환자가 앱 가입 시 기존 Patient 레코드와 연결 가능

**테스트 데이터**:
- `init_test_data` 명령어가 두 가지 유형의 환자를 생성합니다:
  - 70%: User 계정이 있는 환자 (앱 사용자)
  - 30%: User 계정이 없는 환자 (의료진 등록)

**회원가입 자동화**:
- UserRegistrationSerializer가 PATIENT 역할 생성 시 자동으로 Patient 레코드 생성
- 자동 생성 필드:
  - PID: `PT-YYYYMMDD-XXXX` 형식
  - 생년월일: 2000-01-01 (기본값)
  - 성별: Other (기본값)
  - 이름, 전화번호, 이메일: User 정보에서 복사

**API 변경사항**:
- `/api/v1/users/register/` - PATIENT 역할 회원가입 시 Patient 자동 생성
- `/api/v1/emr/patients/` - POST 요청 시 user 필드 선택 사항

## 📞 문의

문제가 발생하거나 추가 기능이 필요한 경우 개발팀에 문의하세요.
