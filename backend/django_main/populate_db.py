import os
import sys
import django
import random
import pymysql
from datetime import datetime, timedelta
from django.utils import timezone

# PyMySQL setup
pymysql.install_as_MySQLdb()

# Setup Django environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from django.contrib.auth.models import User
from apps.users.models import UserProfile, Department
from apps.emr.models import Patient, Encounter, FormSOAP, FormVitals, MergedDocument
from apps.custom.models import Doctor, PatientDoctor, Appointment, PatientPredictionResult, Prescription
from config.constants import (
    UserRole, Gender, EncounterStatus, BMIStatus, 
    AppointmentStatus, VisitType, TumorType, MedicationRoute,
    DocumentType, DocumentStatus
)

def create_data():
    print("Starting data population...")

    # 1. Create Departments
    neuro_dept, _ = Department.objects.get_or_create(
        name="신경외과",
        defaults={
            "location": "본관 3층",
            "phone_number": "02-123-4567",
            "description": "뇌, 척수, 말초신경 질환 치료"
        }
    )
    print(f"Department created: {neuro_dept.name}")

    # 2. Create Doctors
    doctors_data = [
        {
            "username": "doctor1",
            "name": "김닥터",
            "specialty": "Brain Tumor",
            "license": "DOC-001"
        },
        {
            "username": "doctor2",
            "name": "이교수",
            "specialty": "Neuro-Oncology",
            "license": "DOC-002"
        }
    ]

    doctors = []
    for data in doctors_data:
        user, created = User.objects.get_or_create(username=data["username"])
        if created:
            user.set_password("password123")
            user.first_name = data["name"][0]
            user.last_name = data["name"][1:]
            user.save()
        
        # Check if UserProfile exists
        if not hasattr(user, 'profile'):
            UserProfile.objects.create(
                user=user,
                role=UserRole.DOCTOR,
                department=neuro_dept,
                phone_number="010-1111-2222"
            )
            
        # Check if Doctor profile exists
        if not hasattr(user, 'doctor'):
            doctor = Doctor.objects.create(
                user=user,
                license_number=data["license"],
                specialty=data["specialty"],
                department=neuro_dept.name,
                bio=f"Expert in {data['specialty']}"
            )
            print(f"Doctor created: {data['name']}")
        else:
            doctor = user.doctor
            print(f"Doctor already exists: {data['name']}")
        
        doctors.append(doctor)

    # 3. Create Patients
    patients_data = [
        {
            "username": "patient1",
            "name": "홍길동",
            "dob": "1980-05-15",
            "gender": Gender.MALE,
            "pid": "PT-2024-001"
        },
        {
            "username": "patient2",
            "name": "김영희",
            "dob": "1992-10-20",
            "gender": Gender.FEMALE,
            "pid": "PT-2024-002"
        },
        {
            "username": "patient3",
            "name": "박철수",
            "dob": "1975-03-01",
            "gender": Gender.MALE,
            "pid": "PT-2024-003"
        }
    ]

    patients = []
    for data in patients_data:
        user, created = User.objects.get_or_create(username=data["username"])
        if created:
            user.set_password("password123")
            user.first_name = data["name"][1:] # First name (Gil-dong)
            user.last_name = data["name"][0]   # Last name (Hong)
            user.save()

        if not hasattr(user, 'profile'):
            UserProfile.objects.create(
                user=user,
                role=UserRole.PATIENT,
                phone_number="010-3333-4444"
            )

        if not hasattr(user, 'patient'):
            patient = Patient.objects.create(
                user=user,
                pid=data["pid"],
                first_name=data["name"][1:],
                last_name=data["name"][0],
                date_of_birth=data["dob"],
                gender=data["gender"],
                phone="010-3333-4444",
                email=f"{data['username']}@example.com",
                address="Seoul, Korea"
            )
            print(f"Patient created: {data['name']}")
        else:
            patient = user.patient
            print(f"Patient already exists: {data['name']}")
            
        patients.append(patient)

    # 4. Assign Doctors to Patients
    # Patient 1 -> Doctor 1 (Primary)
    PatientDoctor.objects.get_or_create(
        patient=patients[0],
        doctor=doctors[0],
        defaults={
            "is_primary": True,
            "assigned_date": timezone.now().date()
        }
    )
    
    # Patient 2 -> Doctor 2 (Primary)
    PatientDoctor.objects.get_or_create(
        patient=patients[1],
        doctor=doctors[1],
        defaults={
            "is_primary": True,
            "assigned_date": timezone.now().date()
        }
    )

    # 5. Create Encounters and Medical Records
    # Past encounter for Patient 1 with Doctor 1
    past_date = timezone.now() - timedelta(days=14)
    encounter1, created = Encounter.objects.get_or_create(
        patient=patients[0],
        doctor=doctors[0].user,
        encounter_date=past_date,
        defaults={
            "reason": "Persistent headache and dizziness",
            "facility": "Neurosurgery Outpatient",
            "status": EncounterStatus.COMPLETED
        }
    )
    
    if created:
        # SOAP Note
        FormSOAP.objects.create(
            encounter=encounter1,
            date=past_date,
            subjective="Patient reports severe headaches for 2 weeks. Dizziness upon standing.",
            objective="BP 130/85. Neurological exam normal. MRI scheduled.",
            assessment="Suspected migraine or increased ICP.",
            plan="Prescribe analgesics. Schedule Brain MRI."
        )
        
        # Vitals
        FormVitals.objects.create(
            encounter=encounter1,
            date=past_date,
            bps=130,
            bpd=85,
            weight=75.5,
            height=178.0,
            temperature=36.5,
            pulse=78,
            respiration=18,
            oxygen_saturation=98
        )
        
        # Prescription
        Prescription.objects.create(
            encounter=encounter1,
            medication_code="TYL-500",
            medication_name="Tylenol 500mg",
            dosage="500mg",
            frequency="3 times/day",
            duration="7 days",
            route=MedicationRoute.ORAL,
            instructions="Take after meals."
        )
        print(f"Encounter created for {patients[0].full_name}")

    # 6. Create Appointments (Future)
    # Patient 1 appointment with Doctor 1 (User request example: 12/05, 11:00)
    # Assuming current year is 2025 based on prompt metadata
    appt_date = datetime(2025, 12, 5, 11, 0, 0)
    # Make it timezone aware
    appt_date = timezone.make_aware(appt_date)
    
    Appointment.objects.get_or_create(
        patient=patients[0],
        doctor=doctors[0],
        scheduled_at=appt_date,
        defaults={
            "duration_minutes": 30,
            "status": AppointmentStatus.CONFIRMED,
            "visit_type": VisitType.FIRST_VISIT,
            "reason": "MRI 결과 상담 및 정기 검진",
            "created_by": "DOCTOR_WEB"
        }
    )
    print(f"Appointment created for {patients[0].full_name} at {appt_date}")

    # Patient 2 appointment
    appt_date2 = timezone.now() + timedelta(days=3, hours=2)
    Appointment.objects.get_or_create(
        patient=patients[1],
        doctor=doctors[1],
        scheduled_at=appt_date2,
        defaults={
            "duration_minutes": 20,
            "status": AppointmentStatus.PENDING,
            "visit_type": VisitType.FOLLOW_UP,
            "reason": "Follow-up consultation",
            "created_by": "PATIENT_APP"
        }
    )

    # 7. Create AI Prediction Result
    # For the past encounter of Patient 1
    PatientPredictionResult.objects.get_or_create(
        encounter=encounter1,
        patient=patients[0],
        defaults={
            "doctor": doctors[0],
            "model_name": "NeuroNova_Brain_v2.0",
            "model_version": "2.0.1",
            "prediction_class": TumorType.GLIOMA,
            "confidence_score": 0.87,
            "probabilities": {"glioma": 0.87, "meningioma": 0.10, "pituitary": 0.03},
            "doctor_feedback": "AGREE",
            "doctor_note": "MRI findings consistent with AI prediction.",
            "confirmed_at": timezone.now()
        }
    )
    print("AI Prediction data created.")

    print("Data population completed successfully!")

if __name__ == "__main__":
    create_data()
