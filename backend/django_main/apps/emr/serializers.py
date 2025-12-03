"""
Serializers for EMR app.
"""
from rest_framework import serializers
from apps.emr.models import Patient, Encounter, FormSOAP, FormVitals, MergedDocument
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class PatientSerializer(serializers.ModelSerializer):
    """Patient serializer."""

    full_name = serializers.CharField(read_only=True)
    age = serializers.IntegerField(source='get_age', read_only=True)
    doctor_name = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = Patient
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
        extra_kwargs = {
            'pid': {'required': False, 'allow_blank': True},
            'doctor': {'required': False, 'allow_null': True},
            'email': {'required': False, 'allow_blank': True},
            'address': {'required': False, 'allow_blank': True},
            'insurance_id': {'required': False, 'allow_blank': True},
            'emergency_contact': {'required': False, 'allow_blank': True},
        }

    def get_doctor_name(self, obj):
        if obj.doctor and hasattr(obj.doctor, "get_full_name"):
            return obj.doctor.get_full_name()
        return None

    def create(self, validated_data):
        """Override create to auto-generate PID if not provided."""
        if not validated_data.get('pid'):
            # Generate PID in format PT-YYYY-NNNN
            from datetime import datetime
            import random
            year = datetime.now().year
            max_attempts = 10

            for _ in range(max_attempts):
                random_num = random.randint(1, 9999)
                pid = f"PT-{year}-{random_num:04d}"

                # Check if PID already exists
                if not Patient.objects.filter(pid=pid).exists():
                    validated_data['pid'] = pid
                    break
            else:
                # If all attempts failed, use timestamp-based PID
                import time
                pid = f"PT-{year}-{int(time.time()) % 10000:04d}"
                validated_data['pid'] = pid

        return super().create(validated_data)


class EncounterSerializer(serializers.ModelSerializer):
    """Encounter serializer."""
    patient_name = serializers.CharField(source='patient.full_name', read_only=True)
    doctor_name = serializers.CharField(source='doctor.get_full_name', read_only=True)

    class Meta:
        model = Encounter
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class EncounterDetailSerializer(serializers.ModelSerializer):
    """Detailed encounter serializer with related data."""
    patient = PatientSerializer(read_only=True)
    soap = serializers.SerializerMethodField()
    vitals = serializers.SerializerMethodField()

    class Meta:
        model = Encounter
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_soap(self, obj):
        """Get SOAP chart if exists."""
        try:
            soap = obj.soap
            return FormSOAPSerializer(soap).data
        except FormSOAP.DoesNotExist:
            return None

    def get_vitals(self, obj):
        """Get latest vitals."""
        vitals = obj.vitals.first()
        if vitals:
            return FormVitalsSerializer(vitals).data
        return None


class FormSOAPSerializer(serializers.ModelSerializer):
    """SOAP chart serializer."""
    
    class Meta:
        model = FormSOAP
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']


class FormVitalsSerializer(serializers.ModelSerializer):
    """Vital signs serializer."""
    
    class Meta:
        model = FormVitals
        fields = '__all__'
        read_only_fields = ['id', 'bmi', 'bmi_status', 'created_at', 'updated_at']


class MergedDocumentSerializer(serializers.ModelSerializer):
    """Merged document serializer."""
    
    class Meta:
        model = MergedDocument
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'updated_at']
