import os
import django
from django.utils import timezone
from datetime import timedelta
import random

# Setup Django environment
# Ensure we can import from parent directory if running from scripts/
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from apps.custom.models import Appointment, Doctor
from apps.emr.models import Patient
from apps.users.models import User
from config.constants import AppointmentStatus, VisitType, Gender

def create_appointments():
    try:
        # Define constants for test data
        DOCTOR_USERNAME = 'doctor1'
        PATIENT_USERNAME = 'patient1'
        
        # Doctor Profile Defaults
        DOCTOR_DEFAULTS = {
            'license_number': 'DOC-12345',
            'specialty': 'Neurosurgery',
            'department': 'Neurosurgery Dept',
            'bio': 'Experienced Neurosurgeon'
        }
        
        # Patient Profile Defaults
        PATIENT_DEFAULTS = {
            'pid': 'PT-2025-001',
            'date_of_birth': '1980-01-01',
            'gender': Gender.MALE,
            'phone': '010-1234-5678',
            'address': 'Seoul, Korea'
        }

        # 1. Get or Create Doctor Profile
        try:
            doctor_user = User.objects.get(username=DOCTOR_USERNAME)
        except User.DoesNotExist:
            print(f"Error: User {DOCTOR_USERNAME} does not exist. Please run create_accounts.py first.")
            return

        doctor, created = Doctor.objects.get_or_create(
            user=doctor_user,
            defaults=DOCTOR_DEFAULTS
        )
        if created:
            print(f"Created Doctor profile for {doctor_user.username}")
        else:
            print(f"Found Doctor profile for {doctor_user.username}")

        # 2. Get or Create Patient Profile
        try:
            patient_user = User.objects.get(username=PATIENT_USERNAME)
        except User.DoesNotExist:
            print(f"Error: User {PATIENT_USERNAME} does not exist.")
            return

        # Merge defaults with user data
        patient_data = PATIENT_DEFAULTS.copy()
        patient_data['first_name'] = patient_user.first_name or 'Patient'
        patient_data['last_name'] = patient_user.last_name or 'One'
        patient_data['email'] = patient_user.email or f'{PATIENT_USERNAME}@example.com'

        patient, created = Patient.objects.get_or_create(
            user=patient_user,
            defaults=patient_data
        )
        if created:
            print(f"Created Patient profile for {patient_user.username}")
        else:
            print(f"Found Patient profile for {patient_user.username}")
        
        print(f"Creating appointments for Dr. {doctor_user.get_full_name()}...")
        
        # 3. Create appointments for today
        # Use soft-coded time reference
        start_time = timezone.now().replace(hour=9, minute=0, second=0, microsecond=0)
        
        appointments_data = [
            {
                'time_offset': 0, # minutes from start
                'status': AppointmentStatus.PENDING,
                'visit_type': VisitType.FIRST_VISIT,
                'reason': 'Headache and dizziness'
            },
            {
                'time_offset': 90,
                'status': AppointmentStatus.CONFIRMED,
                'visit_type': VisitType.FOLLOW_UP,
                'reason': 'MRI result review'
            },
            {
                'time_offset': 180,
                'status': AppointmentStatus.COMPLETED,
                'visit_type': VisitType.CHECK_UP,
                'reason': 'Regular checkup'
            },
            {
                'time_offset': 300,
                'status': AppointmentStatus.PENDING,
                'visit_type': VisitType.FOLLOW_UP,
                'reason': 'Surgery consultation'
            }
        ]
        
        for data in appointments_data:
            scheduled_time = start_time + timedelta(minutes=data['time_offset'])
            
            # Check if appointment already exists to avoid duplicates
            if not Appointment.objects.filter(doctor=doctor, patient=patient, scheduled_at=scheduled_time).exists():
                Appointment.objects.create(
                    doctor=doctor,
                    patient=patient,
                    scheduled_at=scheduled_time,
                    status=data['status'],
                    visit_type=data['visit_type'],
                    reason=data['reason'],
                    notes="Created by script"
                )
                print(f"Created appointment at {scheduled_time}")
            else:
                print(f"Appointment at {scheduled_time} already exists")
            
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    create_appointments()
