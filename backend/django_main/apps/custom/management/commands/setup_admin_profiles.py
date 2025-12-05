"""
Create default Patient and Doctor profiles for Admin users.
This allows admins to access patient and doctor dashboards without errors.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.emr.models import Patient
from apps.custom.models import Doctor
from apps.users.models import UserProfile
from config.constants import UserRole, Gender
from datetime import date, timedelta
import random


class Command(BaseCommand):
    help = 'Create default Patient and Doctor profiles for Admin users'

    def handle(self, *args, **kwargs):
        self.stdout.write("\n" + "="*80)
        self.stdout.write("Setting up Admin Profiles")
        self.stdout.write("="*80 + "\n")

        # Get all admin users
        admin_users = User.objects.filter(profile__role=UserRole.ADMIN)
        self.stdout.write(f"Found {admin_users.count()} admin users\n")

        # Find reference profiles to copy from
        reference_patient = Patient.objects.filter(pid='PT-2025-1000').first()
        reference_doctor = Doctor.objects.first()

        if not reference_patient:
            self.stdout.write(self.style.ERROR("No reference patient found (PT-2025-1000)"))
            return

        if not reference_doctor:
            self.stdout.write(self.style.ERROR("No reference doctor found"))
            return

        for admin_user in admin_users:
            self.stdout.write(f"\nProcessing admin: {admin_user.username}")

            # Create Patient profile if doesn't exist
            try:
                patient = admin_user.patient
                self.stdout.write(f"  [OK] Patient profile already exists (PID: {patient.pid})")
            except Patient.DoesNotExist:
                # Extract number from username
                username_parts = admin_user.username.split('_')
                if len(username_parts) == 2 and username_parts[0] == 'admin':
                    admin_num = int(username_parts[1])
                else:
                    admin_num = random.randint(8000, 8999)

                # Generate unique PID
                pid = f'PT-2025-{8000 + admin_num:04d}'

                # Check if PID exists, if so, find a unique one
                while Patient.objects.filter(pid=pid).exists():
                    admin_num += 1
                    pid = f'PT-2025-{8000 + admin_num:04d}'

                # Create Patient profile based on reference
                patient = Patient.objects.create(
                    user=admin_user,
                    pid=pid,
                    first_name=admin_user.first_name or reference_patient.first_name,
                    last_name=admin_user.last_name or reference_patient.last_name,
                    date_of_birth=reference_patient.date_of_birth,
                    gender=reference_patient.gender,
                    phone=reference_patient.phone,
                    email=admin_user.email or reference_patient.email,
                    address=reference_patient.address,
                    insurance_id=f'INS-ADMIN-{admin_num:04d}',
                    emergency_contact=reference_patient.emergency_contact
                )
                self.stdout.write(self.style.SUCCESS(f"  [OK] Created Patient profile (PID: {pid})"))

            # Create Doctor profile if doesn't exist
            try:
                doctor = admin_user.doctor
                self.stdout.write(f"  [OK] Doctor profile already exists (License: {doctor.license_number})")
            except Doctor.DoesNotExist:
                # Extract number from username
                username_parts = admin_user.username.split('_')
                if len(username_parts) == 2 and username_parts[0] == 'admin':
                    admin_num = int(username_parts[1])
                else:
                    admin_num = random.randint(8000, 8999)

                # Generate unique license number
                license_number = f'LIC-ADMIN-{admin_num:04d}'

                # Check if license exists, if so, find a unique one
                while Doctor.objects.filter(license_number=license_number).exists():
                    admin_num += 1
                    license_number = f'LIC-ADMIN-{admin_num:04d}'

                # Create Doctor profile based on reference
                doctor = Doctor.objects.create(
                    user=admin_user,
                    license_number=license_number,
                    specialty=reference_doctor.specialty,
                    department=reference_doctor.department,
                    bio=f'Admin user with doctor privileges'
                )
                self.stdout.write(self.style.SUCCESS(f"  [OK] Created Doctor profile (License: {license_number})"))

        self.stdout.write("\n" + "="*80)
        self.stdout.write(self.style.SUCCESS("[SUCCESS] Admin profiles setup complete!"))
        self.stdout.write("="*80 + "\n")

        # Verification
        admin_users_count = User.objects.filter(profile__role=UserRole.ADMIN).count()
        admins_with_patient = 0
        admins_with_doctor = 0

        for admin in admin_users:
            try:
                _ = admin.patient
                admins_with_patient += 1
            except Patient.DoesNotExist:
                pass

            try:
                _ = admin.doctor
                admins_with_doctor += 1
            except Doctor.DoesNotExist:
                pass

        self.stdout.write(f"Admin users: {admin_users_count}")
        self.stdout.write(f"Admins with Patient profile: {admins_with_patient}")
        self.stdout.write(f"Admins with Doctor profile: {admins_with_doctor}")

        if admins_with_patient == admin_users_count and admins_with_doctor == admin_users_count:
            self.stdout.write(self.style.SUCCESS("\n[SUCCESS] All admin users have both Patient and Doctor profiles!"))
        else:
            missing_patient = admin_users_count - admins_with_patient
            missing_doctor = admin_users_count - admins_with_doctor
            if missing_patient > 0:
                self.stdout.write(self.style.WARNING(f"[WARNING] {missing_patient} admins still missing Patient profiles"))
            if missing_doctor > 0:
                self.stdout.write(self.style.WARNING(f"[WARNING] {missing_doctor} admins still missing Doctor profiles"))
