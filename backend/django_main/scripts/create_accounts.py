from django.contrib.auth.models import User
from apps.users.models import UserProfile
from config.constants import UserRole, ApprovalStatus

# Create Admin account
try:
    admin_user = User.objects.create_user(
        username='admin',
        email='admin@neuronova.com',
        password='admin123',
        first_name='관리자',
        last_name='시스템',
        is_staff=True,
        is_superuser=True
    )
    admin_profile = UserProfile.objects.create(
        user=admin_user,
        role=UserRole.ADMIN,
        phone_number='010-0000-0000',
        approval_status=ApprovalStatus.APPROVED,
        bio='시스템 관리자'
    )
    print('[OK] Admin account created')
    print('    Username: admin')
    print('    Password: admin123')
    print('    Role: ADMIN')
except Exception as e:
    print(f'[ERROR] Admin: {e}')

# Create Nurse account
try:
    nurse_user = User.objects.create_user(
        username='nurse',
        email='nurse@neuronova.com',
        password='nurse123',
        first_name='간호사',
        last_name='박'
    )
    nurse_profile = UserProfile.objects.create(
        user=nurse_user,
        role=UserRole.NURSE,
        phone_number='010-5555-6666',
        approval_status=ApprovalStatus.APPROVED,
        bio='신경외과 전담 간호사'
    )
    print('[OK] Nurse account created')
    print('    Username: nurse')
    print('    Password: nurse123')
    print('    Role: NURSE')
except Exception as e:
    print(f'[ERROR] Nurse: {e}')

print('\n' + '='*50)
print('ALL TEST ACCOUNTS')
print('='*50)
print('\n[ADMIN]')
print('Username: admin')
print('Password: admin123')
print('\n[DOCTOR]')
print('Username: doctor')
print('Password: doctor123')
print('\n[NURSE]')
print('Username: nurse')
print('Password: nurse123')
print('\n[PATIENT]')
print('Username: patient')
print('Password: patient123')
print('='*50)
