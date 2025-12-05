"""
Management command to check patient profiles.
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.emr.models import Patient
from apps.users.models import UserProfile
from config.constants import UserRole


class Command(BaseCommand):
    help = 'Check which users have patient profiles'

    def handle(self, *args, **kwargs):
        self.stdout.write("\n" + "="*80)
        self.stdout.write("User and Patient Profile Check")
        self.stdout.write("="*80 + "\n")

        # Get all users with PATIENT role
        patient_role_users = User.objects.filter(profile__role=UserRole.PATIENT)
        self.stdout.write(f"Users with PATIENT role: {patient_role_users.count()}\n")

        for user in patient_role_users:
            try:
                patient = user.patient
                patient_info = f"Has Patient profile (PID: {patient.pid}, Name: {patient.full_name})"
                self.stdout.write(self.style.SUCCESS(f"Username: {user.username:20} | {patient_info}"))
            except Patient.DoesNotExist:
                patient_info = "NO Patient profile"
                self.stdout.write(self.style.ERROR(f"Username: {user.username:20} | {patient_info}"))

        # Get all patients
        all_patients = Patient.objects.all()
        self.stdout.write(f"\nTotal Patient records: {all_patients.count()}")

        # Patients without user accounts
        patients_without_user = Patient.objects.filter(user__isnull=True)
        self.stdout.write(f"Patients without User account: {patients_without_user.count()}")

        # Patients with user accounts
        patients_with_user = Patient.objects.filter(user__isnull=False)
        self.stdout.write(f"Patients with User account: {patients_with_user.count()}\n")

        if patients_with_user.exists():
            self.stdout.write("Patients linked to User accounts:")
            for patient in patients_with_user[:10]:  # Show first 10
                self.stdout.write(f"  - Username: {patient.user.username:20} | PID: {patient.pid} | Name: {patient.full_name}")

        self.stdout.write("\n" + "="*80 + "\n")
