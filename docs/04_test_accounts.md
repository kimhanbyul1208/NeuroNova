# NeuroNova Test Accounts

## 📋 개요

`python manage.py init_test_data` 명령어를 통해 생성되는 테스트 계정 정보입니다.
기본적으로 각 역할별로 다수의 계정이 생성되며, 아래는 대표적인 테스트 계정 목록입니다.

---

## 🔐 Administrator Accounts (관리자)

| Username | Password | Email | Role |
|----------|----------|-------|------|
| `admin_0001` | `testpass123` | admin_0001@neuronova.com | ADMIN |
| `admin_0002` | `testpass123` | admin_0002@neuronova.com | ADMIN |
| `admin_0003` | `testpass123` | admin_0003@neuronova.com | ADMIN |

**권한**: 시스템 관리자 (is_staff=True, is_superuser=True)

### Admin 기능
- **Debug Views**: Admin 대시보드에서 다른 역할(의사, 간호사, 환자)의 대시보드로 즉시 전환 가능
- **시스템 관리**: 사용자 승인, 시스템 설정 변경 가능

---

## 👨‍⚕️ Doctor Accounts (의사)

| Username | Password | Email | Role | Specialty |
|----------|----------|-------|------|-----------|
| `doctor_0001` | `testpass123` | doctor_0001@neuronova.com | DOCTOR | Neurosurgery |
| `doctor_0002` | `testpass123` | doctor_0002@neuronova.com | DOCTOR | Neurology |
| `doctor_0003` | `testpass123` | doctor_0003@neuronova.com | DOCTOR | Radiology |

**권한**: 의료진 (진단, 처방, AI 결과 검토)

---

## 👩‍⚕️ Nurse Accounts (간호사)

| Username | Password | Email | Role |
|----------|----------|-------|------|
| `nurse_0001` | `testpass123` | nurse_0001@neuronova.com | NURSE |
| `nurse_0002` | `testpass123` | nurse_0002@neuronova.com | NURSE |
| `nurse_0003` | `testpass123` | nurse_0003@neuronova.com | NURSE |

**권한**: 간호사 (환자 관리, 예약 관리, 바이탈 입력)

---

## 🧑‍🦱 Patient Accounts (환자)

| Username | Password | Email | Role | PID |
|----------|----------|-------|------|-----|
| `patient_0001` | `testpass123` | patient_0001@neuronova.com | PATIENT | PT-2025-1000 |
| `patient_0002` | `testpass123` | patient_0002@neuronova.com | PATIENT | PT-2025-1001 |
| `patient_0003` | `testpass123` | patient_0003@neuronova.com | PATIENT | PT-2025-1002 |

**권한**: 환자 (예약, 진료 기록 조회)

---

## 🚀 빠른 로그인 가이드

### Django Admin 접속
```
URL: http://localhost:8000/admin
Username: admin_0001
Password: testpass123
```

### React Web (의료진용)
```
URL: http://localhost:3000
Username: doctor_0001 (또는 nurse_0001)
Password: testpass123
```

### Flutter App (환자용)
```
Username: patient_0001
Password: testpass123
```

---

## 🛠️ 계정 생성 및 초기화

계정을 다시 생성하거나 데이터를 초기화하려면 다음 명령어를 사용하세요:

```bash
cd backend/django_main
# 기존 데이터 삭제 후 새로 생성 (각 모델당 100개)
python manage.py init_test_data --clear --count 100
```

> [!WARNING]
> `--clear` 옵션은 데이터베이스의 모든 데이터를 삭제합니다. 개발 환경에서만 사용하세요.

---

## 🔑 비밀번호 규칙

모든 자동 생성 계정의 비밀번호는 **`testpass123`** 으로 통일되어 있습니다.

---

## 📊 역할별 권한 (RBAC) 요약

### ADMIN
- ✅ 모든 시스템 기능 접근 및 사용자 관리
- ✅ Django Admin 접근

### DOCTOR
- ✅ 환자 진료 기록 조회/작성
- ✅ AI 진단 결과 검토 및 피드백
- ✅ 처방전 작성 및 예약 승인

### NURSE
- ✅ 환자 정보 조회 및 예약 관리
- ✅ 바이탈 사인 입력
- ❌ 처방전 작성 불가

### PATIENT
- ✅ 본인 진료 기록 및 처방전 조회
- ✅ 예약 신청/취소
- ❌ 타인 정보 조회 불가

