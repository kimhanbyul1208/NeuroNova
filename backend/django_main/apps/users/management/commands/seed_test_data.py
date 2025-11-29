"""
Script to seed database with test data for role-based dashboards.
Creates test users (Admin, Doctor, Staff) and sample data.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from apps.users.models import UserProfile
from apps.emr.models import Patient, Encounter, FormSOAP, FormVitals
from apps.custom.models import Doctor, Appointment, PatientPredictionResult
from datetime import datetime, timedelta
import random


class Command(BaseCommand):
    help = 'Seed database with test data for role-based dashboards'

    def handle(self, *args, **kwargs):
        self.stdout.write('🌱 Starting database seeding...')

        # Create groups
        admin_group, _ = Group.objects.get_or_create(name='administrators')
        doctor_group, _ = Group.objects.get_or_create(name='doctors')
        nurse_group, _ = Group.objects.get_or_create(name='nurses')

        # Create Admin users (5)
        self.stdout.write('\n📋 Creating Admin users...')
        for i in range(1, 6):
            self.create_user_simple(
                username=f'admin{i}',
                email=f'admin{i}@neuronova.com',
                password=f'admin{i}1234',
                first_name='시스템',
                last_name=f'관리자{i}',
                role='ADMIN',
                groups=[admin_group]
            )

        # Create Doctor users (5)
        self.stdout.write('\n📋 Creating Doctor users...')
        doctors = []
        departments = ['신경외과', '영상의학과', '신경과', '종양내과', '방사선종양학과']
        specialties = ['뇌종양', 'MRI판독', '치매/뇌전증', '항암치료', '방사선수술']
        
        for i in range(1, 6):
            doc_user = self.create_user_simple(
                username=f'doctor{i}',
                email=f'doctor{i}@neuronova.com',
                password=f'doctor{i}1234',
                first_name=departments[i-1],
                last_name=f'의사{i}',
                role='DOCTOR',
                groups=[doctor_group]
            )
            
            if doc_user:
                doctors.append(doc_user)
                try:
                    Doctor.objects.create(
                        user=doc_user,
                        specialty=specialties[i-1],
                        license_number=f'DOC-2025-{str(i).zfill(3)}',
                        department=departments[i-1],
                        bio=f'{departments[i-1]} 전문의입니다.'
                    )
                    self.stdout.write(f'  ✅ Created Doctor profile: {doc_user.get_full_name()}')
                except Exception as e:
                    if 'Duplicate entry' in str(e):
                        self.stdout.write(f'  ℹ️  Doctor profile already exists: {doc_user.username}')
                    else:
                        self.stdout.write(f'  ❌ Failed to create Doctor profile: {e}')

        # Create Staff (Nurse) users (5)
        self.stdout.write('\n📋 Creating Nurse users...')
        for i in range(1, 6):
            self.create_user_simple(
                username=f'nurse{i}',
                email=f'nurse{i}@neuronova.com',
                password=f'nurse{i}1234',
                first_name='간호사',
                last_name=f'{i}',
                role='NURSE',
                groups=[nurse_group]
            )

        # Create sample patients
        self.stdout.write('\n📋 Creating sample patients...')
        patients = []
        patient_names = ['홍길동', '김영희', '이철수', '박민지', '정대한', '최수진', '강민호', '윤서연', '임준호', '송미라']
        
        for i, name in enumerate(patient_names):
            try:
                # Create User for Patient
                patient_username = f'patient{i+1}'
                patient_user = self.create_user_simple(
                    username=patient_username,
                    email=f'patient{i+1}@neuronova.com',
                    password=f'patient{i+1}1234',
                    first_name=name[:-1] if len(name) > 2 else name[0],
                    last_name=name[-1],
                    role='PATIENT'
                )

                # Check if patient profile already exists
                if hasattr(patient_user, 'patient'):
                    patient = patient_user.patient
                    self.stdout.write(f'  ℹ️  Patient profile already exists: {patient.full_name}')
                    patients.append(patient)
                    continue

                patient = Patient.objects.create(
                    user=patient_user,
                    pid=f'PT-2025-{str(i+1).zfill(3)}',
                    first_name=name[:-1] if len(name) > 2 else name[0],
                    last_name=name[-1],
                    date_of_birth=datetime(1950 + i*5, (i % 12) + 1, (i % 28) + 1).date(),
                    gender='M' if i % 2 == 0 else 'F',
                    phone=f'010-{random.randint(1000,9999)}-{random.randint(1000,9999)}',
                    address=f'서울시 강남구 테헤란로 {random.randint(100,500)}',
                    emergency_contact=f'010-{random.randint(1000,9999)}-{random.randint(1000,9999)}'
                )
                patients.append(patient)
                self.stdout.write(f'  ✅ Created patient: {patient.full_name}')
            except Exception as e:
                self.stdout.write(f'  ❌ Failed to create patient {name}: {e}')

        # Create sample encounters
        self.stdout.write('\n📋 Creating sample encounters...')
        encounter_count = 0
        today = datetime.now().date()
        
        if doctors and patients:
            for i, patient in enumerate(patients[:7]):
                try:
                    encounter_date = today - timedelta(days=random.randint(0, 14))
                    doctor_user = random.choice(doctors)
                    
                    encounter = Encounter.objects.create(
                        patient=patient,
                        encounter_date=encounter_date,
                        doctor=doctor_user,
                        reason=random.choice([
                            '두통 및 어지러움',
                            '기억력 저하',
                            '손떨림 증상',
                            '수면장애',
                            '집중력 저하',
                            '두부 외상 후 통증',
                            '시력 저하'
                        ]),
                        status=random.choice(['IN_PROGRESS', 'COMPLETED', 'COMPLETED']),
                        facility='신경외과 외래'
                    )
                    
                    FormSOAP.objects.create(
                        encounter=encounter,
                        subjective=f'{patient.full_name} 님이 {encounter.reason} 증상 호소',
                        objective='신경학적 검사 시행, 주요 vital signs 정상',
                        assessment='추가 정밀 검사 필요',
                        plan='Brain MRI 촬영 예정, 2주 후 재방문'
                    )

                    FormVitals.objects.create(
                        encounter=encounter,
                        temperature=36.0 + random.random() * 1.5,
                        pulse=65 + random.randint(0, 40),
                        blood_pressure_systolic=115 + random.randint(-10, 25),
                        blood_pressure_diastolic=75 + random.randint(-10, 15),
                        respiratory_rate=14 + random.randint(0, 6),
                        oxygen_saturation=97 + random.randint(0, 3)
                    )
                    
                    encounter_count += 1
                    self.stdout.write(f'  ✅ Created encounter for: {patient.full_name}')
                except Exception as e:
                    self.stdout.write(f'  ❌ Failed to create encounter: {e}')

        # Create appointments
        self.stdout.write('\n📋 Creating sample appointments...')
        appt_count = 0
        
        if doctors and patients:
            for i in range(10):
                try:
                    patient = random.choice(patients)
                    doctor_user = random.choice(doctors)
                    
                    # Ensure doctor has profile
                    if hasattr(doctor_user, 'doctor'):
                        # Refresh doctor user to ensure relationships are loaded
                        doctor_profile = Doctor.objects.get(user=doctor_user)
                        scheduled_time = datetime.now() + timedelta(hours=i*2, minutes=random.randint(0, 30))
                        
                        Appointment.objects.create(
                            patient=patient,
                            doctor=doctor_profile,
                            scheduled_at=scheduled_time,
                            status=random.choice(['PENDING', 'CONFIRMED', 'PENDING']),
                            visit_type=random.choice(['CHECKUP', 'FOLLOWUP', 'CONSULTATION']),
                            reason=random.choice(['정기 검진', '추적 관찰', '신규 상담', '검사 결과 확인'])
                        )
                        appt_count += 1
                except Exception as e:
                    self.stdout.write(f'  ❌ Failed to create appointment: {e}')

        self.stdout.write(f'  ✅ Created {appt_count} appointments')

        # Create AI predictions
        self.stdout.write('\n📋 Creating sample AI predictions...')
        pred_count = 0
        
        try:
            for encounter in Encounter.objects.filter(status='COMPLETED')[:5]:
                doctor_user = encounter.doctor
                if hasattr(doctor_user, 'doctor'):
                    doctor_profile = Doctor.objects.get(user=doctor_user)
                    
                    PatientPredictionResult.objects.create(
                        patient=encounter.patient,
                        encounter=encounter,
                        doctor=doctor_profile if random.random() > 0.5 else None,
                        model_name='ResNet50_v2',
                        model_version='1.0.0',
                        prediction_class=random.choice(['GLIOMA', 'MENINGIOMA', 'PITUITARY', 'NO_TUMOR']),
                        confidence_score=random.uniform(0.82, 0.98),
                        orthanc_study_uid=f'1.2.840.113.{random.randint(10000, 99999)}',
                        probabilities={
                            'GLIOMA': random.uniform(0.1, 0.4),
                            'MENINGIOMA': random.uniform(0.1, 0.4),
                            'PITUITARY': random.uniform(0.1, 0.4),
                            'NO_TUMOR': random.uniform(0.05, 0.15)
                        },
                        doctor_feedback=random.choice(['', 'CORRECT', 'INCORRECT', '']) if random.random() > 0.3 else ''
                    )
                    pred_count += 1
        except Exception as e:
            self.stdout.write(f'  ❌ Failed to create prediction: {e}')

        self.stdout.write(f'  ✅ Created {pred_count} AI predictions')

        self.stdout.write(self.style.SUCCESS('\n\n🎉 Database seeding completed successfully!'))
        self.stdout.write('\n📋 Test Accounts Created (5 per role):')
        self.stdout.write(self.style.SUCCESS('  ═══════════════════════════════════'))
        self.stdout.write('  👤 Admin:  admin1..5   / admin{N}1234')
        self.stdout.write('  👨‍⚕️ Doctor: doctor1..5  / doctor{N}1234')
        self.stdout.write('  👩‍⚕️ Nurse:  nurse1..5   / nurse{N}1234')
        self.stdout.write(self.style.SUCCESS('  ═══════════════════════════════════'))

    def create_user_simple(self, username, email, password, first_name, last_name, role, groups=None):
        """Simple user creation without get_or_create complexity"""
        try:
            # Check if user exists
            if User.objects.filter(username=username).exists():
                self.stdout.write(f'ℹ️  User already exists: {username}')
                return User.objects.get(username=username)

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name
            )
            self.stdout.write(f'✅ Created user: {username} ({first_name} {last_name})')
            
            UserProfile.objects.create(
                user=user,
                role=role,
                phone_number=f'010-{random.randint(1000,9999)}-{random.randint(1000,9999)}'
            )
            
            if groups:
                user.groups.set(groups)
                
            return user
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'❌ Failed to create user {username}: {str(e)}'))
            return None
