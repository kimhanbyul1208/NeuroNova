"""
ViewSets for Custom app - Brain tumor diagnosis features.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.custom.models import (
    Doctor,
    PatientDoctor,
    Appointment,
    PatientPredictionResult,
    Prescription,
    AntigenAnalysisResult
)
from apps.emr.models import Patient
from apps.custom.serializers import (
    DoctorSerializer,
    PatientDoctorSerializer,
    AppointmentSerializer,
    PatientPredictionResultSerializer,
    PrescriptionSerializer,
    AntigenAnalysisResultSerializer
)
from apps.custom.permissions import (
    IsDoctorOrAdmin,
    CanAccessAppointments,
    CanManageAppointments,
    CanAccessPredictionResults,
    CanAccessPrescriptions
)
import logging

logger = logging.getLogger(__name__)


class DoctorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Doctor management.
    """
    queryset = Doctor.objects.all()
    serializer_class = DoctorSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrAdmin]
    filterset_fields = ['specialty', 'department']
    search_fields = ['user__username', 'user__first_name', 'user__last_name', 'specialty']
    ordering_fields = ['created_at', 'specialty']


class PatientDoctorViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Patient-Doctor relationship management.
    """
    queryset = PatientDoctor.objects.all()
    serializer_class = PatientDoctorSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['patient', 'doctor', 'is_primary']
    ordering_fields = ['assigned_date', 'created_at']


class AppointmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Appointment management.
    """
    queryset = Appointment.objects.all()
    serializer_class = AppointmentSerializer
    permission_classes = [IsAuthenticated, CanAccessAppointments]
    filterset_fields = ['patient', 'doctor', 'status', 'visit_type']
    search_fields = ['patient__full_name', 'reason']
    ordering_fields = ['scheduled_at', 'created_at']

    def get_queryset(self):
        """Filter appointments based on user role."""
        queryset = super().get_queryset()
        user = self.request.user

        # If user is a patient, show only their appointments
        try:
            patient = user.patient
            return queryset.filter(patient=patient).order_by('-scheduled_at')
        except Patient.DoesNotExist:
            pass

        # If user is a doctor, show their appointments
        try:
            doctor = user.doctor
            return queryset.filter(doctor=doctor).order_by('-scheduled_at')
        except Doctor.DoesNotExist:
            pass

        # For staff/admin, show all appointments
        return queryset.order_by('-scheduled_at')

    def perform_create(self, serializer):
        """Set patient to current user if user is a patient."""
        try:
            # Check if user has a patient profile
            patient = self.request.user.patient
            serializer.save(patient=patient)
        except Patient.DoesNotExist:
            # If patient field is not provided and user is not a patient, raise error
            if 'patient' not in serializer.validated_data:
                from rest_framework.exceptions import ValidationError
                raise ValidationError({
                    "patient": "환자 프로필을 찾을 수 없습니다. 환자 계정으로 로그인했는지 확인해주세요."
                })
            serializer.save()

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanManageAppointments])
    def confirm(self, request, pk=None):
        """Confirm an appointment."""
        appointment = self.get_object()
        appointment.confirm()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, CanManageAppointments])
    def cancel(self, request, pk=None):
        """Cancel an appointment."""
        appointment = self.get_object()
        appointment.cancel()
        serializer = self.get_serializer(appointment)
        return Response(serializer.data)


class PatientPredictionResultViewSet(viewsets.ModelViewSet):
    """
    ViewSet for AI Prediction Results.
    """
    queryset = PatientPredictionResult.objects.all()
    serializer_class = PatientPredictionResultSerializer
    permission_classes = [IsAuthenticated, CanAccessPredictionResults]
    filterset_fields = ['patient', 'encounter', 'prediction_class', 'doctor_feedback']
    ordering_fields = ['created_at', 'confidence_score']

    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated, IsDoctorOrAdmin])
    def confirm_prediction(self, request, pk=None):
        """
        Doctor confirms AI prediction with feedback.
        Human-in-the-loop pattern implementation.
        """
        prediction = self.get_object()
        feedback = request.data.get('doctor_feedback')
        note = request.data.get('doctor_note', '')

        if not feedback:
            return Response(
                {'error': 'doctor_feedback is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get doctor profile
        try:
            doctor = request.user.doctor
        except Doctor.DoesNotExist:
            return Response(
                {'error': 'User is not a doctor'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Confirm prediction
        prediction.confirm_by_doctor(doctor, feedback, note)
        serializer = self.get_serializer(prediction)

        logger.info(
            f"Prediction {prediction.id} confirmed by Dr. {request.user.get_full_name()}: {feedback}"
        )

        return Response({
            'message': 'Prediction confirmed successfully',
            'prediction': serializer.data
        })

    @action(detail=False, methods=['get'])
    def pending_review(self, request):
        """Get predictions pending doctor review."""
        pending = self.queryset.filter(doctor_feedback='').order_by('-created_at')
        serializer = self.get_serializer(pending, many=True)
        return Response(serializer.data)


class PrescriptionViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Prescription management.
    """
    queryset = Prescription.objects.all()
    serializer_class = PrescriptionSerializer
    permission_classes = [IsAuthenticated, CanAccessPrescriptions]
    filterset_fields = ['encounter']
    ordering_fields = ['prescribed_at', 'created_at']

    def get_queryset(self):
        """Filter prescriptions based on user role."""
        queryset = super().get_queryset()
        user = self.request.user

        # If user is a patient, show only their prescriptions
        try:
            patient = user.patient
            return queryset.filter(encounter__patient=patient).order_by('-prescribed_at')
        except Patient.DoesNotExist:
            pass

        # For doctors/staff/admin, show all prescriptions
        return queryset.order_by('-prescribed_at')


class AntigenAnalysisResultViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Antigen Analysis Result management.
    """
    queryset = AntigenAnalysisResult.objects.all()
    serializer_class = AntigenAnalysisResultSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['patient']
    ordering_fields = ['created_at']
