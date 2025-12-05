"""
Create Patient profiles for users with PATIENT role but no Patient record.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.emr.models import Patient
from apps.users.models import UserProfile
from config.constants import UserRole, Gender
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = 'Create Patient profiles for users with PATIENT role but no Patient record'

    def handle(self, *args, **kwargs):
        self.stdout.write("\n" + "="*80)
        self.stdout.write("Creating Missing Patient Profiles")
        self.stdout.write("="*80 + "\n")

        # Find users with PATIENT role but no Patient profile
        patient_role_users = User.objects.filter(profile__role=UserRole.PATIENT)

        created_count = 0
        for user in patient_role_users:
            try:
                # Try to access patient - this will raise DoesNotExist if no profile
                patient = user.patient
                # Patient exists, skip
                continue
            except Patient.DoesNotExist:
                # Create Patient profile for this user
                # Extract number from username (e.g., patient_0043 -> 43)
                username_parts = user.username.split('_')
                if len(username_parts) == 2 and username_parts[0] == 'patient':
                    patient_num = int(username_parts[1])
                else:
                    patient_num = created_count + 1000

                # Generate PID
                # Find the highest existing PID number
                last_patient = Patient.objects.order_by('-pid').first()
                if last_patient and last_patient.pid.startswith('PT-2025-'):
                    last_num = int(last_patient.pid.split('-')[-1])
                    new_pid = f'PT-2025-{last_num + 1:04d}'
                else:
                    new_pid = f'PT-2025-{2000 + patient_num:04d}'

                # Random date of birth (between 20 and 80 years old)
                age_days = random.randint(20*365, 80*365)
                dob = date.today() - timedelta(days=age_days)

                # Random gender
                gender = random.choice([Gender.MALE, Gender.FEMALE])

                # Create Patient record
                patient = Patient.objects.create(
                    user=user,
                    pid=new_pid,
                    first_name=user.first_name or f'Patient{patient_num}',
                    last_name=user.last_name or 'Test',
                    date_of_birth=dob,
                    gender=gender,
                    phone=f'010-{random.randint(1000,9999)}-{random.randint(1000,9999)}',
                    email=user.email or f'{user.username}@example.com',
                    address=f'Seoul, South Korea - Test Address {patient_num}',
                    insurance_id=f'INS-{random.randint(100000,999999)}',
                    emergency_contact=f'010-{random.randint(1000,9999)}-{random.randint(1000,9999)}'
                )

                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Created Patient profile for {user.username} (PID: {new_pid})"
                    )
                )

        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS(f"Total Patient profiles created: {created_count}"))
        self.stdout.write("="*80 + "\n")

        # Verify
        patient_role_users_count = User.objects.filter(profile__role=UserRole.PATIENT).count()
        patients_with_user_count = Patient.objects.filter(user__isnull=False).count()

        self.stdout.write(f"Users with PATIENT role: {patient_role_users_count}")
        self.stdout.write(f"Patients with User accounts: {patients_with_user_count}")

        if patient_role_users_count == patients_with_user_count:
            self.stdout.write(self.style.SUCCESS("All PATIENT users now have Patient profiles!"))
        else:
            missing = patient_role_users_count - patients_with_user_count
            self.stdout.write(self.style.WARNING(f"Still missing {missing} Patient profiles"))
