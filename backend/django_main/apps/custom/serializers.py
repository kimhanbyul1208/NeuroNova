"""
Serializers for Custom app - Brain tumor diagnosis features.
"""
from rest_framework import serializers
from apps.custom.models import (
    Doctor,
    PatientDoctor,
    Appointment,
    PatientPredictionResult,
    Prescription,
    AntigenAnalysisResult
)
from apps.emr.models import Patient, Encounter
from django.contrib.auth.models import User
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class DoctorSerializer(serializers.ModelSerializer):
    """Doctor profile serializer."""
    user_name = serializers.CharField(source='user.username', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Doctor
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientDoctorSerializer(serializers.ModelSerializer):
    """Patient-Doctor relationship serializer."""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)

    class Meta:
        model = PatientDoctor
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class AppointmentSerializer(serializers.ModelSerializer):
    """Appointment serializer."""
    patient = serializers.PrimaryKeyRelatedField(queryset=Patient.objects.all(), required=False)
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True)

    class Meta:
        model = Appointment
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class PatientPredictionResultSerializer(serializers.ModelSerializer):
    """AI prediction result serializer."""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.user.get_full_name', read_only=True, allow_null=True)

    class Meta:
        model = PatientPredictionResult
        fields = '__all__'
        read_only_fields = ['id', 'confirmed_at', 'created_at', 'updated_at']


class PrescriptionSerializer(serializers.ModelSerializer):
    """Prescription serializer."""
    patient_name = serializers.CharField(source='encounter.patient.full_name', read_only=True)

    class Meta:
        model = Prescription
        fields = '__all__'
        read_only_fields = ['id', 'prescribed_at', 'created_at', 'updated_at']


class AntigenAnalysisResultSerializer(serializers.ModelSerializer):
    """Antigen Analysis Result serializer."""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)

    class Meta:
        model = AntigenAnalysisResult
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
