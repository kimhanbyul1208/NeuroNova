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
        patient = self.get_object()
        encounters = patient.encounters.all()
        predictions = patient.predictions.all()

        from apps.custom.serializers import PatientPredictionResultSerializer

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
