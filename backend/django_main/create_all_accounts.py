from django.contrib.auth.models import User
from apps.users.models import UserProfile
from config.constants import UserRole, ApprovalStatus

accounts = []

# ADMIN accounts (3)
admin_data = [
    {'username': 'admin1', 'email': 'admin1@neuronova.com', 'first_name': 'Admin', 'last_name': 'One', 'phone': '010-1000-0001', 'bio': 'System Administrator'},
    {'username': 'admin2', 'email': 'admin2@neuronova.com', 'first_name': 'Admin', 'last_name': 'Two', 'phone': '010-1000-0002', 'bio': 'System Administrator'},
    {'username': 'admin3', 'email': 'admin3@neuronova.com', 'first_name': 'Admin', 'last_name': 'Three', 'phone': '010-1000-0003', 'bio': 'System Administrator'},
]

for data in admin_data:
    try:
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password='admin123',
            first_name=data['first_name'],
            last_name=data['last_name'],
            is_staff=True,
            is_superuser=True
        )
        profile = UserProfile.objects.create(
            user=user,
            role=UserRole.ADMIN,
            phone_number=data['phone'],
            approval_status=ApprovalStatus.APPROVED,
            bio=data['bio']
        )
        accounts.append({'username': data['username'], 'password': 'admin123', 'role': 'ADMIN'})
    except Exception as e:
        print(f'Skip {data["username"]}: already exists')

# DOCTOR accounts (3)
doctor_data = [
    {'username': 'doctor1', 'email': 'doctor1@neuronova.com', 'first_name': 'Dr.Kim', 'last_name': 'Neurosurgeon', 'phone': '010-2000-0001', 'bio': 'Neurosurgery Specialist'},
    {'username': 'doctor2', 'email': 'doctor2@neuronova.com', 'first_name': 'Dr.Lee', 'last_name': 'Neurologist', 'phone': '010-2000-0002', 'bio': 'Neurology Specialist'},
    {'username': 'doctor3', 'email': 'doctor3@neuronova.com', 'first_name': 'Dr.Park', 'last_name': 'Radiologist', 'phone': '010-2000-0003', 'bio': 'Radiology Specialist'},
]

for data in doctor_data:
    try:
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password='doctor123',
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        profile = UserProfile.objects.create(
            user=user,
            role=UserRole.DOCTOR,
            phone_number=data['phone'],
            approval_status=ApprovalStatus.APPROVED,
            bio=data['bio']
        )
        accounts.append({'username': data['username'], 'password': 'doctor123', 'role': 'DOCTOR'})
    except Exception as e:
        print(f'Skip {data["username"]}: already exists')

# NURSE accounts (3)
nurse_data = [
    {'username': 'nurse1', 'email': 'nurse1@neuronova.com', 'first_name': 'Nurse', 'last_name': 'Choi', 'phone': '010-3000-0001', 'bio': 'Head Nurse'},
    {'username': 'nurse2', 'email': 'nurse2@neuronova.com', 'first_name': 'Nurse', 'last_name': 'Jung', 'phone': '010-3000-0002', 'bio': 'ICU Nurse'},
    {'username': 'nurse3', 'email': 'nurse3@neuronova.com', 'first_name': 'Nurse', 'last_name': 'Kang', 'phone': '010-3000-0003', 'bio': 'ER Nurse'},
]

for data in nurse_data:
    try:
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password='nurse123',
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        profile = UserProfile.objects.create(
            user=user,
            role=UserRole.NURSE,
            phone_number=data['phone'],
            approval_status=ApprovalStatus.APPROVED,
            bio=data['bio']
        )
        accounts.append({'username': data['username'], 'password': 'nurse123', 'role': 'NURSE'})
    except Exception as e:
        print(f'Skip {data["username"]}: already exists')

# PATIENT accounts (3)
patient_data = [
    {'username': 'patient1', 'email': 'patient1@neuronova.com', 'first_name': 'John', 'last_name': 'Doe', 'phone': '010-4000-0001', 'bio': 'Patient'},
    {'username': 'patient2', 'email': 'patient2@neuronova.com', 'first_name': 'Jane', 'last_name': 'Smith', 'phone': '010-4000-0002', 'bio': 'Patient'},
    {'username': 'patient3', 'email': 'patient3@neuronova.com', 'first_name': 'Bob', 'last_name': 'Johnson', 'phone': '010-4000-0003', 'bio': 'Patient'},
]

for data in patient_data:
    try:
        user = User.objects.create_user(
            username=data['username'],
            email=data['email'],
            password='patient123',
            first_name=data['first_name'],
            last_name=data['last_name']
        )
        profile = UserProfile.objects.create(
            user=user,
            role=UserRole.PATIENT,
            phone_number=data['phone'],
            approval_status=ApprovalStatus.APPROVED,
            bio=data['bio']
        )
        accounts.append({'username': data['username'], 'password': 'patient123', 'role': 'PATIENT'})
    except Exception as e:
        print(f'Skip {data["username"]}: already exists')

print('='*60)
print('NEURONOVA TEST ACCOUNTS - ALL ROLES (3 each)')
print('='*60)
print()
print('[ADMIN ACCOUNTS - 3]')
print('Username: admin1    | Password: admin123 | Role: ADMIN')
print('Username: admin2    | Password: admin123 | Role: ADMIN')
print('Username: admin3    | Password: admin123 | Role: ADMIN')
print()
print('[DOCTOR ACCOUNTS - 3]')
print('Username: doctor1   | Password: doctor123 | Role: DOCTOR')
print('Username: doctor2   | Password: doctor123 | Role: DOCTOR')
print('Username: doctor3   | Password: doctor123 | Role: DOCTOR')
print()
print('[NURSE ACCOUNTS - 3]')
print('Username: nurse1    | Password: nurse123 | Role: NURSE')
print('Username: nurse2    | Password: nurse123 | Role: NURSE')
print('Username: nurse3    | Password: nurse123 | Role: NURSE')
print()
print('[PATIENT ACCOUNTS - 3]')
print('Username: patient1  | Password: patient123 | Role: PATIENT')
print('Username: patient2  | Password: patient123 | Role: PATIENT')
print('Username: patient3  | Password: patient123 | Role: PATIENT')
print()
print('='*60)
print(f'Total: {len(accounts)} new accounts created')
print('='*60)
