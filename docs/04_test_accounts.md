# NeuroNova Test Accounts

## 전체 계정 목록 (Total: 12 accounts)

각 역할별로 3개씩 총 12개의 테스트 계정이 생성되었습니다.

---

## 🔐 Administrator Accounts (관리자)

| Username | Password | Email | Role | Phone |
|----------|----------|-------|------|-------|

| `admin1` | `admin123` | admin1@neuronova.com | ADMIN | 010-1000-0001 |
| `admin2` | `admin123` | admin2@neuronova.com | ADMIN | 010-1000-0002 |
| `admin3` | `admin123` | admin3@neuronova.com | ADMIN | 010-1000-0003 |

**권한**: 시스템 관리자 (is_staff=True, is_superuser=True)

Admin 디버깅 뷰 구현 완료 🛠️
관리자 대시보드에서 다른 역할의 화면으로 바로 이동할 수 있는 기능을 추가했습니다.

🛠️ 구현 내역
권한 확장: App.jsx를 수정하여 ADMIN 권한을 가진 사용자가 /doctor/dashboard, /staff/dashboard, /patient/dashboard 등 모든 대시보드 경로에 접근할 수 있도록 허용했습니다.
Debug Views 섹션 추가: AdminDashboard.jsx 하단에 주황색 테두리로 구분된 Debug Views 섹션을 추가했습니다.
👨‍⚕️ View as Doctor: 의사 대시보드로 이동
👩‍⚕️ View as Nurse: 간호사 대시보드로 이동
🏥 View as Patient: 환자 대시보드로 이동
🚀 테스트 방법
Admin 계정(admin1)으로 로그인합니다.
대시보드 스크롤을 내려 하단의 Debug Views 섹션을 확인합니다.
각 버튼을 클릭하여 해당 역할의 대시보드로 정상적으로 이동하는지 확인합니다.
각 대시보드에서 뒤로가기 또는 로그아웃 등을 통해 다시 Admin 대시보드로 돌아올 수 있습니다.

---

## 👨‍⚕️ Doctor Accounts (의사)

| Username | Password | Email | Role | Specialty |
|----------|----------|-------|------|-----------|
| `doctor1` | `doctor123` | doctor1@neuronova.com | DOCTOR | Neurosurgeon |
| `doctor2` | `doctor123` | doctor2@neuronova.com | DOCTOR | Neurologist |
| `doctor3` | `doctor123` | doctor3@neuronova.com | DOCTOR | Radiologist |

**권한**: 의료진 (진단, 처방, AI 결과 검토)

---

## 👩‍⚕️ Nurse Accounts (간호사)

| Username | Password | Email | Role | Department |
|----------|----------|-------|------|------------|
| `nurse1` | `nurse123` | nurse1@neuronova.com | NURSE | Head Nurse |
| `nurse2` | `nurse123` | nurse2@neuronova.com | NURSE | ICU |
| `nurse3` | `nurse123` | nurse3@neuronova.com | NURSE | ER |

**권한**: 간호사 (환자 관리, 예약 관리)

---

## 🧑‍🦱 Patient Accounts (환자)

| Username | Password | Email | Role | Name |
|----------|----------|-------|------|------|
| `patient1` | `patient123` | patient1@neuronova.com | PATIENT | John Doe |
| `patient2` | `patient123` | patient2@neuronova.com | PATIENT | Jane Smith |
| `patient3` | `patient123` | patient3@neuronova.com | PATIENT | Bob Johnson |

**권한**: 환자 (예약, 진료 기록 조회)

---

## 빠른 로그인 가이드

### Django Admin 접속
```
URL: http://localhost:8000/admin
Username: admin1 (또는 admin2, admin3)
Password: admin123
```

### React Web (의료진용)
```
URL: http://localhost:3000
Username: doctor1 (또는 nurse1)
Password: doctor123 (또는 nurse123)
```

### Flutter App (환자용)
```
Username: patient1
Password: patient123
```

---

## 계정 생성 스크립트

계정을 다시 생성하거나 추가 계정이 필요한 경우:

```bash
cd backend/django_main
python manage.py shell < create_all_accounts.py
```

---

## 비밀번호 규칙

모든 테스트 계정은 다음 패턴을 따릅니다:
- **Admin**: `admin123`
- **Doctor**: `doctor123`
- **Nurse**: `nurse123`
- **Patient**: `patient123`

> [!WARNING]
> 이 계정들은 **개발/테스트 전용**입니다. 프로덕션 환경에서는 절대 사용하지 마세요!

---

## 역할별 권한 (RBAC)

### ADMIN
- ✅ 모든 시스템 기능 접근
- ✅ 사용자 관리 (승인/거부)
- ✅ Django Admin 접근
- ✅ 시스템 설정 변경

### DOCTOR
- ✅ 환자 진료 기록 조회/작성
- ✅ AI 진단 결과 검토 및 피드백
- ✅ 처방전 작성
- ✅ 예약 승인/거부
- ❌ 시스템 설정 변경

### NURSE
- ✅ 환자 정보 조회
- ✅ 예약 관리
- ✅ 바이탈 사인 입력
- ❌ 처방전 작성
- ❌ AI 진단 결과 수정

### PATIENT
- ✅ 본인 진료 기록 조회
- ✅ 예약 신청/취소
- ✅ 처방전 조회
- ❌ 타인 정보 조회
- ❌ 의료진 기능 접근

---

## 데이터베이스 확인

생성된 계정을 확인하려면:

```bash
cd backend/django_main
python manage.py shell
```

```python
from django.contrib.auth.models import User
from apps.users.models import UserProfile

# 모든 사용자 조회
users = User.objects.all()
for user in users:
    profile = user.profile
    print(f"{user.username} - {profile.role} - {user.email}")

# 역할별 조회
doctors = UserProfile.objects.filter(role='DOCTOR')
print(f"Total Doctors: {doctors.count()}")
```

---

**생성일**: 2025-12-01  
**총 계정 수**: 12개 (ADMIN: 3, DOCTOR: 3, NURSE: 3, PATIENT: 3)  
**상태**: ✅ 모두 APPROVED
