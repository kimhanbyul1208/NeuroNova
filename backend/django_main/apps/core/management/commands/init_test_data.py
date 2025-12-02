"""
Django management command to initialize test data.
Generates 100 items per model with realistic data.

Usage: python manage.py init_test_data
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from django.utils import timezone
from django.db import transaction
from faker import Faker
import random
from datetime import timedelta

# Import all models
from apps.users.models import Department, UserProfile
from apps.emr.models import Patient, Encounter, FormSOAP, FormVitals, MergedDocument
from apps.custom.models import (
    Doctor, PatientDoctor, Appointment, PatientPredictionResult, Prescription
)
from apps.notifications.models import NotificationLog
from config.constants import (
    UserRole, ApprovalStatus, Gender, EncounterStatus, BMIStatus,
    DocumentType, DocumentStatus, AppointmentStatus, VisitType,
    DoctorFeedback, TumorType, MedicationRoute, NotificationType
)


class Command(BaseCommand):
    help = 'Initialize database with test data (100 items per model)'

    def __init__(self):
        super().__init__()
        self.fake = Faker('ko_KR')  # Korean locale for realistic Korean names
        Faker.seed(42)  # For reproducibility
        random.seed(42)

        # Store created objects for relationships
        self.departments = []
        self.users = []
        self.patients = []
        self.doctors = []
        self.encounters = []

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before loading new data'
        )
        parser.add_argument(
            '--count',
            type=int,
            default=100,
            help='Number of items to create per model (default: 100)'
        )

    def handle(self, *args, **options):
        count = options['count']
        clear = options['clear']

        if clear:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            self.clear_database()

        self.stdout.write(self.style.SUCCESS(f'Starting data generation ({count} items per model)...'))

        try:
            with transaction.atomic():
                # Follow dependency order
                self.stdout.write('Creating Departments...')
                self.create_departments()

                self.stdout.write('Creating Users and UserProfiles...')
                self.create_users_and_profiles(count)

                self.stdout.write('Creating Doctors...')
                self.create_doctors(min(count, len([u for u in self.users if u.profile.role == UserRole.DOCTOR])))

                self.stdout.write('Creating Patients...')
                self.create_patients(min(count, len([u for u in self.users if u.profile.role == UserRole.PATIENT])))

                self.stdout.write('Creating PatientDoctor relationships...')
                self.create_patient_doctor_relationships(count)

                self.stdout.write('Creating Encounters...')
                self.create_encounters(count)

                self.stdout.write('Creating FormSOAP records...')
                self.create_form_soap(min(count, len(self.encounters)))

                self.stdout.write('Creating FormVitals records...')
                self.create_form_vitals(count)

                self.stdout.write('Creating Appointments...')
                self.create_appointments(count)

                self.stdout.write('Creating PatientPredictionResults...')
                self.create_prediction_results(count)

                self.stdout.write('Creating Prescriptions...')
                self.create_prescriptions(count)

                self.stdout.write('Creating MergedDocuments...')
                self.create_merged_documents(count)

                self.stdout.write('Creating NotificationLogs...')
                self.create_notifications(count)

            self.stdout.write(self.style.SUCCESS('\n✓ Test data initialization completed successfully!'))
            self.print_summary()

        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error during data generation: {str(e)}'))
            raise

    def clear_database(self):
        """Clear all existing data (in reverse dependency order)."""
        NotificationLog.objects.all().delete()
        MergedDocument.objects.all().delete()
        Prescription.objects.all().delete()
        PatientPredictionResult.objects.all().delete()
        Appointment.objects.all().delete()
        FormVitals.objects.all().delete()
        FormSOAP.objects.all().delete()
        Encounter.objects.all().delete()
        PatientDoctor.objects.all().delete()
        Patient.objects.all().delete()
        Doctor.objects.all().delete()
        UserProfile.objects.all().delete()
        User.objects.all().delete()
        Department.objects.all().delete()
        self.stdout.write(self.style.SUCCESS('  Database cleared'))

    def create_departments(self):
        """Create realistic departments."""
        departments_data = [
            {'name': '신경외과', 'location': '본관 3층 301호', 'phone': '02-1234-5601'},
            {'name': '신경과', 'location': '본관 3층 302호', 'phone': '02-1234-5602'},
            {'name': '영상의학과', 'location': '본관 2층 201호', 'phone': '02-1234-5603'},
            {'name': '병리과', 'location': '본관 지하 1층', 'phone': '02-1234-5604'},
            {'name': '재활의학과', 'location': '별관 1층 101호', 'phone': '02-1234-5605'},
        ]

        for dept_data in departments_data:
            dept = Department.objects.create(
                name=dept_data['name'],
                location=dept_data['location'],
                phone_number=dept_data['phone'],
                description=f"{dept_data['name']} 진료 및 검사를 담당합니다."
            )
            self.departments.append(dept)

    def create_users_and_profiles(self, count):
        """Create users with profiles (distributed across roles)."""
        roles_distribution = {
            UserRole.PATIENT: int(count * 0.6),  # 60% patients
            UserRole.DOCTOR: int(count * 0.2),   # 20% doctors
            UserRole.NURSE: int(count * 0.15),   # 15% nurses
            UserRole.ADMIN: int(count * 0.05),   # 5% admins
        }

        for role, role_count in roles_distribution.items():
            for i in range(role_count):
                # Create User
                username = f"{role.lower()}_{i+1:04d}"
                email = f"{username}@neuronova.hospital"

                user = User.objects.create_user(
                    username=username,
                    email=email,
                    password='testpass123',
                    first_name=self.fake.first_name(),
                    last_name=self.fake.last_name(),
                    is_active=True
                )

                # Create UserProfile
                profile = UserProfile.objects.create(
                    user=user,
                    role=role,
                    approval_status=ApprovalStatus.APPROVED,
                    phone_number=self.fake.phone_number(),
                    department=random.choice(self.departments) if role != UserRole.PATIENT else None,
                    bio=self.fake.text(max_nb_chars=200) if role != UserRole.PATIENT else ""
                )

                self.users.append(user)

    def create_doctors(self, count):
        """Create Doctor records for users with DOCTOR role."""
        doctor_users = [u for u in self.users if u.profile.role == UserRole.DOCTOR]
        specialties = ['Neurosurgery', 'Neurology', 'Radiology', 'Oncology', 'Pathology']

        for i, user in enumerate(doctor_users[:count]):
            doctor = Doctor.objects.create(
                user=user,
                license_number=f"DOC-{2024000 + i}",
                specialty=random.choice(specialties),
                department=user.profile.department.name if user.profile.department else '신경외과',
                bio=self.fake.text(max_nb_chars=300)
            )
            self.doctors.append(doctor)

    def create_patients(self, count):
        """Create Patient records for users with PATIENT role."""
        patient_users = [u for u in self.users if u.profile.role == UserRole.PATIENT]

        for i, user in enumerate(patient_users[:count]):
            patient = Patient.objects.create(
                user=user,
                pid=f"PT-2025-{1000 + i}",
                first_name=user.first_name,
                last_name=user.last_name,
                date_of_birth=self.fake.date_of_birth(minimum_age=18, maximum_age=85),
                gender=random.choice([Gender.MALE, Gender.FEMALE]),
                phone=self.fake.phone_number(),
                email=user.email,
                address=self.fake.address(),
                insurance_id=f"INS-{random.randint(100000, 999999)}",
                emergency_contact=self.fake.phone_number()
            )
            self.patients.append(patient)

    def create_patient_doctor_relationships(self, count):
        """Create PatientDoctor relationships."""
        if not self.patients or not self.doctors:
            return

        for _ in range(min(count, len(self.patients) * 2)):
            patient = random.choice(self.patients)
            doctor = random.choice(self.doctors)

            # Avoid duplicates
            if PatientDoctor.objects.filter(patient=patient, doctor=doctor).exists():
                continue

            # Check if patient already has a primary doctor
            has_primary = PatientDoctor.objects.filter(patient=patient, is_primary=True).exists()

            PatientDoctor.objects.create(
                patient=patient,
                doctor=doctor,
                is_primary=not has_primary and random.random() > 0.5,
                assigned_date=self.fake.date_between(start_date='-2y', end_date='today')
            )

    def create_encounters(self, count):
        """Create Encounter records."""
        if not self.patients or not self.doctors:
            return

        facilities = ['신경외과 외래', '신경과 외래', '응급실', '입원병동 3A', '영상의학과']
        reasons = [
            '두통 및 어지러움증',
            '시력 저하 및 시야 결손',
            '보행 장애',
            '기억력 감퇴',
            '간질 발작',
            '정기 검진',
            '뇌종양 의심 소견 재검',
        ]

        for _ in range(count):
            patient = random.choice(self.patients)
            doctor_user = random.choice(self.doctors).user

            encounter = Encounter.objects.create(
                patient=patient,
                doctor=doctor_user,
                encounter_date=self.fake.date_time_between(start_date='-1y', end_date='now', tzinfo=timezone.get_current_timezone()),
                reason=random.choice(reasons),
                facility=random.choice(facilities),
                status=random.choice([s[0] for s in EncounterStatus.CHOICES])
            )
            self.encounters.append(encounter)

    def create_form_soap(self, count):
        """Create SOAP charts (one per encounter)."""
        for encounter in self.encounters[:count]:
            FormSOAP.objects.create(
                encounter=encounter,
                date=encounter.encounter_date,
                subjective=self.fake.text(max_nb_chars=200),
                objective=self.fake.text(max_nb_chars=200),
                assessment=self.fake.text(max_nb_chars=150),
                plan=self.fake.text(max_nb_chars=150)
            )

    def create_form_vitals(self, count):
        """Create vital signs records."""
        for _ in range(count):
            if not self.encounters:
                break

            encounter = random.choice(self.encounters)

            FormVitals.objects.create(
                encounter=encounter,
                date=self.fake.date_time_between(
                    start_date=encounter.encounter_date,
                    end_date=encounter.encounter_date + timedelta(hours=2),
                    tzinfo=timezone.get_current_timezone()
                ),
                bps=random.randint(100, 160),
                bpd=random.randint(60, 100),
                weight=round(random.uniform(45.0, 95.0), 2),
                height=round(random.uniform(150.0, 190.0), 2),
                temperature=round(random.uniform(36.0, 37.5), 1),
                pulse=random.randint(60, 100),
                respiration=random.randint(12, 20),
                oxygen_saturation=random.randint(95, 100)
            )

    def create_appointments(self, count):
        """Create appointments."""
        if not self.patients or not self.doctors:
            return

        for _ in range(count):
            patient = random.choice(self.patients)
            doctor = random.choice(self.doctors)

            scheduled_at = self.fake.date_time_between(
                start_date='now',
                end_date='+60d',
                tzinfo=timezone.get_current_timezone()
            )

            Appointment.objects.create(
                patient=patient,
                doctor=doctor,
                scheduled_at=scheduled_at,
                duration_minutes=random.choice([15, 30, 45, 60]),
                status=random.choice([s[0] for s in AppointmentStatus.CHOICES]),
                visit_type=random.choice([v[0] for v in VisitType.CHOICES]),
                reason=self.fake.sentence(),
                created_by=random.choice(['PATIENT_APP', 'DOCTOR_WEB', 'NURSE_STATION']),
                notes=self.fake.text(max_nb_chars=100) if random.random() > 0.5 else ""
            )

    def create_prediction_results(self, count):
        """Create AI prediction results."""
        if not self.encounters or not self.patients or not self.doctors:
            return

        for _ in range(count):
            encounter = random.choice(self.encounters)
            patient = encounter.patient
            doctor = random.choice(self.doctors)

            tumor_type = random.choice([t[0] for t in TumorType.CHOICES])
            confidence = random.uniform(0.65, 0.99)

            # Generate probability distribution
            probs = {t[0]: random.uniform(0.01, 0.30) for t in TumorType.CHOICES}
            probs[tumor_type] = confidence

            PatientPredictionResult.objects.create(
                encounter=encounter,
                patient=patient,
                doctor=doctor,
                model_name='NeuroNova_Brain_v2.1',
                model_version='2.1.0',
                orthanc_study_uid=f"1.2.840.{random.randint(100000, 999999)}",
                orthanc_series_uid=f"1.2.840.{random.randint(100000, 999999)}",
                prediction_class=tumor_type,
                confidence_score=confidence,
                probabilities=probs,
                xai_image_path=f"/media/xai/prediction_{random.randint(1000, 9999)}.png",
                feature_importance={'region_1': 0.45, 'region_2': 0.30, 'region_3': 0.25},
                doctor_feedback=random.choice([f[0] for f in DoctorFeedback.CHOICES]) if random.random() > 0.3 else "",
                doctor_note=self.fake.sentence() if random.random() > 0.5 else "",
                confirmed_at=timezone.now() if random.random() > 0.5 else None
            )

    def create_prescriptions(self, count):
        """Create prescriptions."""
        if not self.encounters:
            return

        medications = [
            ('M001', 'Dexamethasone 4mg', '4mg', '3 times/day', '7 days'),
            ('M002', 'Levetiracetam 500mg', '500mg', '2 times/day', '30 days'),
            ('M003', 'Phenytoin 100mg', '100mg', '3 times/day', '30 days'),
            ('M004', 'Temozolomide 100mg', '100mg', '1 time/day', '5 days'),
            ('M005', 'Mannitol 20%', '100ml', 'as needed', ''),
        ]

        for _ in range(count):
            encounter = random.choice(self.encounters)
            med = random.choice(medications)

            Prescription.objects.create(
                encounter=encounter,
                medication_code=med[0],
                medication_name=med[1],
                dosage=med[2],
                frequency=med[3],
                duration=med[4],
                route=random.choice([r[0] for r in MedicationRoute.CHOICES]),
                instructions=self.fake.sentence()
            )

    def create_merged_documents(self, count):
        """Create merged medical documents."""
        if not self.patients or not self.encounters:
            return

        for _ in range(count):
            encounter = random.choice(self.encounters)
            patient = encounter.patient

            MergedDocument.objects.create(
                patient=patient,
                encounter=encounter,
                title=f"{patient.full_name} - {self.fake.sentence(nb_words=4)}",
                document_type=random.choice([d[0] for d in DocumentType.CHOICES]),
                status=random.choice([s[0] for s in DocumentStatus.CHOICES]),
                references={
                    'emr': {'soap_id': random.randint(1, 100)},
                    'ai': {'prediction_id': random.randint(1, 100)}
                },
                snapshot_data={
                    'patient_name': patient.full_name,
                    'encounter_date': encounter.encounter_date.isoformat(),
                    'summary': self.fake.text(max_nb_chars=200)
                },
                signed_by=encounter.doctor if random.random() > 0.5 else None
            )

    def create_notifications(self, count):
        """Create notification logs."""
        if not self.users:
            return

        for _ in range(count):
            user = random.choice(self.users)
            notif_type = random.choice([n[0] for n in NotificationType.CHOICES])

            NotificationLog.objects.create(
                recipient=user,
                notification_type=notif_type,
                title=self.fake.sentence(nb_words=5),
                message=self.fake.text(max_nb_chars=150),
                is_read=random.random() > 0.5,
                read_at=timezone.now() if random.random() > 0.5 else None,
                metadata={'appointment_id': random.randint(1, 100)} if 'APPOINTMENT' in notif_type else {},
                push_sent=random.random() > 0.2,
                push_error="" if random.random() > 0.9 else self.fake.sentence()
            )

    def print_summary(self):
        """Print summary of created data."""
        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS('DATA GENERATION SUMMARY'))
        self.stdout.write('='*60)

        models_count = {
            'Departments': Department.objects.count(),
            'Users': User.objects.count(),
            'UserProfiles': UserProfile.objects.count(),
            'Doctors': Doctor.objects.count(),
            'Patients': Patient.objects.count(),
            'PatientDoctor Relationships': PatientDoctor.objects.count(),
            'Encounters': Encounter.objects.count(),
            'FormSOAP': FormSOAP.objects.count(),
            'FormVitals': FormVitals.objects.count(),
            'Appointments': Appointment.objects.count(),
            'Prediction Results': PatientPredictionResult.objects.count(),
            'Prescriptions': Prescription.objects.count(),
            'Merged Documents': MergedDocument.objects.count(),
            'Notifications': NotificationLog.objects.count(),
        }

        for model_name, count in models_count.items():
            self.stdout.write(f'  {model_name:<30}: {count:>5}')

        self.stdout.write('='*60)
        self.stdout.write(self.style.SUCCESS('\n✓ All test data has been initialized successfully!'))
        self.stdout.write('\nDefault credentials for testing:')
        self.stdout.write('  Username: patient_0001, doctor_0001, nurse_0001, admin_0001')
        self.stdout.write('  Password: testpass123')
        self.stdout.write('')
