"""
Tests for Custom app views (Appointment, Prediction, Prescription).
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.users.models import UserProfile
from apps.emr.models import Patient, Encounter
from apps.custom.models import Doctor, Appointment, PatientPredictionResult, Prescription
from config.constants import (
    UserRole,
    Gender,
    AppointmentStatus,
    VisitType,
    EncounterStatus,
    TumorType,
    DoctorFeedback
)
from datetime import date, timedelta


class AppointmentViewSetTestCase(APITestCase):
    """Test Appointment CRUD and actions."""

    def setUp(self):
        self.client = APIClient()

        # Create doctor
        self.doctor_user = User.objects.create_user(
            username='doctor',
            password='TestPass123!',
            first_name='Doctor',
            last_name='Kim'
        )
        UserProfile.objects.create(user=self.doctor_user, role=UserRole.DOCTOR)
        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            license_number='DOC-12345',
            specialty='Neurosurgery',
            department='Ì…‘ <0'
        )

        # Create patient
        self.patient_user = User.objects.create_user(
            username='patient',
            password='TestPass123!'
        )
        UserProfile.objects.create(
            user=self.patient_user,
            role=UserRole.PATIENT,
            fcm_token='test-fcm-token'
        )
        self.patient = Patient.objects.create(
            user=self.patient_user,
            pid='PT-2025-001',
            first_name='8Ù',
            last_name='M',
            date_of_birth=date(1990, 1, 1),
            gender=Gender.MALE,
            phone='010-1234-5678',
            email='patient@test.com'
        )

    def test_create_appointment(self):
        """Test creating an appointment."""
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('appointment-list')

        scheduled_time = timezone.now() + timedelta(days=7)
        data = {
            'patient': self.patient.id,
            'doctor': self.doctor.id,
            'scheduled_at': scheduled_time.isoformat(),
            'duration_minutes': 30,
            'visit_type': VisitType.FIRST_VISIT,
            'reason': 'MRI °ü Áô',
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['status'], AppointmentStatus.PENDING)

    def test_confirm_appointment(self):
        """Test confirming an appointment (doctor action)."""
        # Create appointment
        scheduled_time = timezone.now() + timedelta(days=7)
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            scheduled_at=scheduled_time,
            duration_minutes=30,
            visit_type=VisitType.FIRST_VISIT,
            reason='ÄÌ',
            status=AppointmentStatus.PENDING
        )

        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('appointment-confirm', kwargs={'pk': appointment.id})

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, AppointmentStatus.CONFIRMED)

    def test_cancel_appointment(self):
        """Test cancelling an appointment."""
        scheduled_time = timezone.now() + timedelta(days=7)
        appointment = Appointment.objects.create(
            patient=self.patient,
            doctor=self.doctor,
            scheduled_at=scheduled_time,
            duration_minutes=30,
            visit_type=VisitType.FIRST_VISIT,
            reason='ÄÌ',
            status=AppointmentStatus.CONFIRMED
        )

        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('appointment-cancel', kwargs={'pk': appointment.id})

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        appointment.refresh_from_db()
        self.assertEqual(appointment.status, AppointmentStatus.CANCELLED)


class PatientPredictionResultTestCase(APITestCase):
    """Test AI Prediction results and Human-in-the-loop."""

    def setUp(self):
        self.client = APIClient()

        # Create doctor
        self.doctor_user = User.objects.create_user(
            username='doctor',
            password='TestPass123!'
        )
        UserProfile.objects.create(user=self.doctor_user, role=UserRole.DOCTOR)
        self.doctor = Doctor.objects.create(
            user=self.doctor_user,
            license_number='DOC-12345',
            specialty='Neurosurgery',
            department='Ì…‘ <0'
        )

        # Create patient
        patient_user = User.objects.create_user(
            username='patient',
            password='TestPass123!'
        )
        UserProfile.objects.create(user=patient_user, role=UserRole.PATIENT)
        self.patient = Patient.objects.create(
            user=patient_user,
            pid='PT-2025-001',
            first_name='8Ù',
            last_name='M',
            date_of_birth=date(1990, 1, 1),
            gender=Gender.MALE,
            phone='010-1234-5678',
            email='patient@test.com'
        )

        # Create encounter
        self.encounter = Encounter.objects.create(
            patient=self.patient,
            doctor=self.doctor_user,
            encounter_date=timezone.now(),
            reason='MRI „',
            facility='à½xü',
            status=EncounterStatus.IN_PROGRESS
        )

    def test_create_prediction(self):
        """Test creating AI prediction result."""
        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('patientpredictionresult-list')

        data = {
            'encounter': self.encounter.id,
            'patient': self.patient.id,
            'model_name': 'NeuroNova_Brain_v2.1',
            'model_version': '2.1.0',
            'orthanc_study_uid': '1.2.840.113...',
            'prediction_class': TumorType.MENINGIOMA,
            'confidence_score': 0.94,
            'probabilities': {
                'Glioma': 0.02,
                'Meningioma': 0.94,
                'Pituitary': 0.04
            },
            'xai_image_path': '/media/xai/shap_100.png',
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['prediction_class'], TumorType.MENINGIOMA)

    def test_confirm_prediction_with_feedback(self):
        """Test Human-in-the-loop: Doctor confirms AI prediction."""
        # Create prediction
        prediction = PatientPredictionResult.objects.create(
            encounter=self.encounter,
            patient=self.patient,
            model_name='NeuroNova_Brain_v2.1',
            model_version='2.1.0',
            prediction_class=TumorType.MENINGIOMA,
            confidence_score=0.94,
            probabilities={'Meningioma': 0.94}
        )

        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('patientpredictionresult-confirm-prediction', kwargs={'pk': prediction.id})

        data = {
            'doctor_feedback': DoctorFeedback.CORRECT,
            'doctor_note': 'x É… Œ¬ü |Xh'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        prediction.refresh_from_db()
        self.assertEqual(prediction.doctor_feedback, DoctorFeedback.CORRECT)
        self.assertEqual(prediction.doctor.id, self.doctor.id)
        self.assertIsNotNone(prediction.confirmed_at)

    def test_confirm_prediction_without_feedback_fails(self):
        """Test that confirmation requires feedback."""
        prediction = PatientPredictionResult.objects.create(
            encounter=self.encounter,
            patient=self.patient,
            model_name='NeuroNova_Brain_v2.1',
            model_version='2.1.0',
            prediction_class=TumorType.GLIOMA,
            confidence_score=0.85,
            probabilities={'Glioma': 0.85}
        )

        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('patientpredictionresult-confirm-prediction', kwargs={'pk': prediction.id})

        data = {}  # No feedback provided

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_get_pending_review_predictions(self):
        """Test getting predictions pending doctor review."""
        # Create prediction without doctor feedback
        PatientPredictionResult.objects.create(
            encounter=self.encounter,
            patient=self.patient,
            model_name='NeuroNova_Brain_v2.1',
            model_version='2.1.0',
            prediction_class=TumorType.PITUITARY,
            confidence_score=0.88,
            probabilities={'Pituitary': 0.88}
        )

        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('patientpredictionresult-pending-review')

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)


class PrescriptionTestCase(APITestCase):
    """Test Prescription operations."""

    def setUp(self):
        self.client = APIClient()

        # Create doctor
        self.doctor_user = User.objects.create_user(
            username='doctor',
            password='TestPass123!'
        )
        UserProfile.objects.create(user=self.doctor_user, role=UserRole.DOCTOR)

        # Create patient
        patient_user = User.objects.create_user(
            username='patient',
            password='TestPass123!'
        )
        self.patient = Patient.objects.create(
            user=patient_user,
            pid='PT-2025-001',
            first_name='8Ù',
            last_name='M',
            date_of_birth=date(1990, 1, 1),
            gender=Gender.MALE,
            phone='010-1234-5678',
            email='patient@test.com'
        )

        # Create encounter
        self.encounter = Encounter.objects.create(
            patient=self.patient,
            doctor=self.doctor_user,
            encounter_date=timezone.now(),
            reason='ÄÌ',
            facility='à½xü',
            status=EncounterStatus.COMPLETED
        )

    def test_create_prescription(self):
        """Test creating a prescription."""
        self.client.force_authenticate(user=self.doctor_user)
        url = reverse('prescription-list')

        data = {
            'encounter': self.encounter.id,
            'medication_code': 'TYLENOL_500',
            'medication_name': 'Tylenol 500mg',
            'dosage': '1 tablet',
            'frequency': '3 times/day',
            'duration': '7 days',
            'route': 'Oral',
            'instructions': 'ÝÄ 30„ õ©'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['medication_name'], 'Tylenol 500mg')


class DoctorViewSetTestCase(APITestCase):
    """Test Doctor operations."""

    def setUp(self):
        self.client = APIClient()

        # Create admin user
        self.admin = User.objects.create_user(
            username='admin',
            password='TestPass123!',
            is_staff=True
        )
        UserProfile.objects.create(user=self.admin, role=UserRole.ADMIN)

    def test_create_doctor(self):
        """Test creating a doctor profile."""
        self.client.force_authenticate(user=self.admin)

        # First create user
        doctor_user = User.objects.create_user(
            username='newdoctor',
            password='TestPass123!',
            first_name='New',
            last_name='Doctor'
        )
        UserProfile.objects.create(user=doctor_user, role=UserRole.DOCTOR)

        url = reverse('doctor-list')
        data = {
            'user': doctor_user.id,
            'license_number': 'DOC-99999',
            'specialty': 'Neurology',
            'department': 'à½ü',
            'bio': 'Ì…‘ 8X'
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['license_number'], 'DOC-99999')
