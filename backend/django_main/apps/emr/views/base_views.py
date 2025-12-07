"""
ViewSets for EMR app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from apps.emr.models import Patient, Encounter, FormSOAP, FormVitals, MergedDocument
from apps.emr.serializers import (
    PatientSerializer,
    EncounterSerializer,
    EncounterDetailSerializer,
    FormSOAPSerializer,
    FormVitalsSerializer,
    MergedDocumentSerializer
)
from apps.core.permissions import IsDoctorOrNurse
import logging

logger = logging.getLogger(__name__)


class PatientViewSet(viewsets.ModelViewSet):
    """ViewSet for Patient management."""
    queryset = Patient.objects.all()
    serializer_class = PatientSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['gender']
    search_fields = ['first_name', 'last_name', 'pid', 'phone']
    ordering_fields = ['created_at', 'date_of_birth']

    @action(detail=True, methods=['get'])
    def encounters(self, request, pk=None):
        """Get all encounters for a patient."""
        patient = self.get_object()
        encounters = patient.encounters.all()
        serializer = EncounterSerializer(encounters, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def medical_history(self, request, pk=None):
        """Get patient's complete medical history."""
        from django.db.models import Prefetch
        from apps.custom.serializers import PatientPredictionResultSerializer

        patient = self.get_object()

        # Optimize encounters query with prefetch_related
        encounters = patient.encounters.prefetch_related(
            'soap',
            Prefetch('vitals', queryset=FormVitals.objects.order_by('-date'))
        ).select_related('doctor').all()

        # Optimize predictions query with select_related
        predictions = patient.predictions.select_related(
            'doctor__user'
        ).all()

        return Response({
            'patient': PatientSerializer(patient).data,
            'encounters': EncounterDetailSerializer(encounters, many=True).data,
            'ai_diagnoses': PatientPredictionResultSerializer(predictions, many=True).data,
        })


class EncounterViewSet(viewsets.ModelViewSet):
    """ViewSet for Encounter management."""
    queryset = Encounter.objects.all()
    permission_classes = [IsAuthenticated]
    filterset_fields = ['patient', 'status', 'doctor']
    ordering_fields = ['encounter_date', 'created_at']

    def get_queryset(self):
        """Optimize queryset with select_related and prefetch_related."""
        queryset = Encounter.objects.select_related(
            'patient',
            'doctor'
        )

        # Add prefetch for detail views
        if self.action in ['retrieve', 'list']:
            from django.db.models import Prefetch
            queryset = queryset.prefetch_related(
                'soap',
                Prefetch('vitals', queryset=FormVitals.objects.order_by('-date'))
            )

        return queryset

    def get_serializer_class(self):
        """Use detailed serializer for retrieve action."""
        if self.action == 'retrieve':
            return EncounterDetailSerializer
        return EncounterSerializer

    def perform_create(self, serializer):
        """Set doctor to current user if not specified."""
        if not serializer.validated_data.get('doctor'):
            serializer.save(doctor=self.request.user)
        else:
            serializer.save()

    @action(detail=False, methods=['get'], url_path='my-appointments')
    def my_appointments(self, request):
        """
        환자가 자신의 예약 목록을 조회합니다.
        환자로 로그인한 경우에만 자신의 진료 예약을 볼 수 있습니다.
        """
        try:
            # 현재 로그인한 사용자와 연결된 환자 정보 가져오기
            patient = Patient.objects.get(user=request.user)

            # 해당 환자의 모든 진료 예약(Encounter) 가져오기
            encounters = Encounter.objects.filter(patient=patient).order_by('-encounter_date')

            # 직렬화하여 응답
            serializer = EncounterDetailSerializer(encounters, many=True)

            return Response({
                'success': True,
                'count': encounters.count(),
                'appointments': serializer.data
            }, status=status.HTTP_200_OK)

        except Patient.DoesNotExist:
            # 환자 정보가 없는 경우 (의사나 간호사 등이 접근한 경우)
            logger.warning(f"User {request.user.username} tried to access my-appointments but has no patient profile")
            return Response({
                'success': False,
                'error': '환자 정보를 찾을 수 없습니다. 환자 계정으로 로그인해주세요.',
                'appointments': []
            }, status=status.HTTP_404_NOT_FOUND)

        except Exception as e:
            logger.error(f"Error in my_appointments for user {request.user.username}: {str(e)}")
            return Response({
                'success': False,
                'error': '예약 조회 중 오류가 발생했습니다.',
                'appointments': []
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class FormSOAPViewSet(viewsets.ModelViewSet):
    """ViewSet for SOAP chart management."""
    queryset = FormSOAP.objects.all()
    serializer_class = FormSOAPSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]
    filterset_fields = ['encounter']
    ordering_fields = ['created_at']


class FormVitalsViewSet(viewsets.ModelViewSet):
    """ViewSet for Vital signs management."""
    queryset = FormVitals.objects.all()
    serializer_class = FormVitalsSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]
    filterset_fields = ['encounter']
    ordering_fields = ['created_at']


class MergedDocumentViewSet(viewsets.ModelViewSet):
    """ViewSet for Merged document management."""
    queryset = MergedDocument.objects.all()
    serializer_class = MergedDocumentSerializer
    permission_classes = [IsAuthenticated, IsDoctorOrNurse]
    filterset_fields = ['encounter', 'document_type']
    ordering_fields = ['created_at']
