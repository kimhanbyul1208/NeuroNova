"""
Check which users have patient profiles.
"""
import os
import sys
import django

# Add project root to path
project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, project_root)

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from apps.emr.models import Patient
from apps.users.models import UserProfile
from config.constants import UserRole


def check_patient_users():
    """Check which users have patient profiles."""
    print("\n" + "="*80)
    print("사용자 및 환자 프로필 확인")
    print("="*80 + "\n")

    # Get all users with PATIENT role
    patient_role_users = User.objects.filter(profile__role=UserRole.PATIENT)
    print(f"환자 역할(PATIENT role)을 가진 사용자: {patient_role_users.count()}명\n")

    for user in patient_role_users:
        has_patient = hasattr(user, 'patient')
        try:
            patient = user.patient
            patient_info = f"✓ Patient 프로필 있음 (PID: {patient.pid}, 이름: {patient.full_name})"
        except Patient.DoesNotExist:
            patient_info = "✗ Patient 프로필 없음"

        print(f"Username: {user.username:20} | {patient_info}")

    # Get all patients
    all_patients = Patient.objects.all()
    print(f"\n전체 Patient 레코드: {all_patients.count()}개")

    # Patients without user accounts
    patients_without_user = Patient.objects.filter(user__isnull=True)
    print(f"User 계정 없는 환자: {patients_without_user.count()}명")

    # Patients with user accounts
    patients_with_user = Patient.objects.filter(user__isnull=False)
    print(f"User 계정 있는 환자: {patients_with_user.count()}명\n")

    if patients_with_user.exists():
        print("User 계정과 연결된 환자 목록:")
        for patient in patients_with_user:
            print(f"  - Username: {patient.user.username:20} | PID: {patient.pid} | 이름: {patient.full_name}")

    print("\n" + "="*80 + "\n")


if __name__ == '__main__':
    check_patient_users()
