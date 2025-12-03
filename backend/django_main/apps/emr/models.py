"""
EMR models for NeuroNova.
OpenEMR compatible medical record models.
"""
from django.db import models
from django.contrib.auth.models import User
from apps.core.models import BaseModel
from config.constants import Gender, EncounterStatus, BMIStatus, DocumentType, DocumentStatus
from typing import Optional, Dict, Any
import logging
import json

logger = logging.getLogger(__name__)


class Patient(BaseModel):
    """
    Patient basic information (EMR standard).
    Compatible with OpenEMR patient table.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='patient',
        null=True,
        blank=True,
        verbose_name="사용자 계정",
        help_text="Django User와 1:1 관계 (앱 로그인용, 선택 사항)"
    )
    
    doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="patients",
        verbose_name="담당 의사"
    )


    pid = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="환자 고유 번호",
        help_text="병원 고유 환자 식별 번호 (예: PT-2025-1001)"
    )

    first_name = models.CharField(
        max_length=100,
        verbose_name="이름"
    )

    last_name = models.CharField(
        max_length=100,
        verbose_name="성"
    )

    date_of_birth = models.DateField(
        verbose_name="생년월일"
    )

    gender = models.CharField(
        max_length=1,
        choices=Gender.CHOICES,
        verbose_name="성별"
    )

    phone = models.CharField(
        max_length=20,
        verbose_name="전화번호"
    )

    email = models.EmailField(
        blank=True,
        verbose_name="이메일"
    )

    address = models.TextField(
        blank=True,
        verbose_name="주소"
    )

    insurance_id = models.CharField(
        max_length=50,
        blank=True,
        verbose_name="건강보험 번호"
    )

    emergency_contact = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="비상 연락처"
    )

    class Meta:
        db_table = 'emr_patient'
        verbose_name = '환자'
        verbose_name_plural = '환자 목록'
        indexes = [
            models.Index(fields=['pid']),
            models.Index(fields=['last_name', 'first_name']),
        ]

    def __str__(self) -> str:
        return f"{self.last_name}{self.first_name} ({self.pid})"

    @property
    def full_name(self) -> str:
        """Return patient's full name."""
        return f"{self.last_name}{self.first_name}"

    def get_age(self) -> int:
        """Calculate patient's age."""
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - (
            (today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day)
        )


class Encounter(BaseModel):
    """
    Patient encounter (진료 세션).
    Represents a single visit or medical session.
    """

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='encounters',
        verbose_name="환자"
    )

    doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='encounters_as_doctor',
        verbose_name="담당 의사"
    )

    encounter_date = models.DateTimeField(
        verbose_name="진료 일시"
    )

    reason = models.TextField(
        verbose_name="내원 사유",
        help_text="환자의 주 증상 또는 방문 이유"
    )

    facility = models.CharField(
        max_length=200,
        verbose_name="진료 부서",
        help_text="예: 신경외과 외래"
    )

    status = models.CharField(
        max_length=20,
        choices=EncounterStatus.CHOICES,
        default=EncounterStatus.SCHEDULED,
        verbose_name="진료 상태"
    )

    class Meta:
        db_table = 'emr_encounter'
        verbose_name = '진료 기록'
        verbose_name_plural = '진료 기록 목록'
        ordering = ['-encounter_date']
        indexes = [
            models.Index(fields=['patient', '-encounter_date']),
            models.Index(fields=['doctor', '-encounter_date']),
            models.Index(fields=['status']),
        ]

    def __str__(self) -> str:
        return f"{self.patient.full_name} - {self.encounter_date.strftime('%Y-%m-%d')}"


class FormSOAP(BaseModel):
    """
    SOAP Chart (Subjective, Objective, Assessment, Plan).
    Standard medical documentation format.
    """

    encounter = models.OneToOneField(
        Encounter,
        on_delete=models.CASCADE,
        related_name='soap',
        verbose_name="진료 세션"
    )

    date = models.DateTimeField(
        verbose_name="작성 일시"
    )

    subjective = models.TextField(
        verbose_name="주관적 소견 (S)",
        help_text="환자가 호소하는 증상"
    )

    objective = models.TextField(
        verbose_name="객관적 소견 (O)",
        help_text="의사의 관찰 및 검사 결과"
    )

    assessment = models.TextField(
        verbose_name="평가 (A)",
        help_text="1차 진단 또는 평가"
    )

    plan = models.TextField(
        verbose_name="계획 (P)",
        help_text="향후 치료 계획"
    )

    class Meta:
        db_table = 'emr_form_soap'
        verbose_name = 'SOAP 차트'
        verbose_name_plural = 'SOAP 차트 목록'
        indexes = [
            models.Index(fields=['encounter']),
            models.Index(fields=['-date']),
        ]

    def __str__(self) -> str:
        return f"SOAP - {self.encounter.patient.full_name} ({self.date.strftime('%Y-%m-%d')})"


class FormVitals(BaseModel):
    """
    Vital signs form (활력 징후).
    Measured by nurses or automated devices.
    """

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name='vitals',
        verbose_name="진료 세션"
    )

    date = models.DateTimeField(
        verbose_name="측정 일시"
    )

    # Blood Pressure
    bps = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="수축기 혈압 (mmHg)",
        help_text="Systolic Blood Pressure"
    )

    bpd = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="이완기 혈압 (mmHg)",
        help_text="Diastolic Blood Pressure"
    )

    # Body Metrics
    weight = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="체중 (kg)"
    )

    height = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name="신장 (cm)"
    )

    temperature = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name="체온 (°C)"
    )

    pulse = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="맥박 (bpm)",
        help_text="Heart rate"
    )

    respiration = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="호흡수 (회/분)"
    )

    oxygen_saturation = models.IntegerField(
        null=True,
        blank=True,
        verbose_name="산소 포화도 (%)",
        help_text="SpO2"
    )

    bmi = models.DecimalField(
        max_digits=4,
        decimal_places=1,
        null=True,
        blank=True,
        verbose_name="BMI",
        help_text="Body Mass Index (자동 계산)"
    )

    bmi_status = models.CharField(
        max_length=20,
        choices=BMIStatus.CHOICES,
        blank=True,
        verbose_name="BMI 상태"
    )

    class Meta:
        db_table = 'emr_form_vitals'
        verbose_name = '활력 징후'
        verbose_name_plural = '활력 징후 목록'
        ordering = ['-date']
        indexes = [
            models.Index(fields=['encounter', '-date']),
        ]

    def __str__(self) -> str:
        return f"Vitals - {self.encounter.patient.full_name} ({self.date.strftime('%Y-%m-%d')})"

    def calculate_bmi(self) -> Optional[float]:
        """Calculate BMI from height and weight."""
        if self.weight and self.height:
            height_m = float(self.height) / 100
            bmi_value = float(self.weight) / (height_m ** 2)
            return round(bmi_value, 1)
        return None

    def determine_bmi_status(self) -> str:
        """Determine BMI status category."""
        if not self.bmi:
            return ""

        bmi_float = float(self.bmi)
        if bmi_float < 18.5:
            return BMIStatus.UNDERWEIGHT
        elif 18.5 <= bmi_float < 25:
            return BMIStatus.NORMAL
        elif 25 <= bmi_float < 30:
            return BMIStatus.OVERWEIGHT
        else:
            return BMIStatus.OBESE

    def save(self, *args, **kwargs) -> None:
        """Override save to auto-calculate BMI."""
        if self.weight and self.height:
            self.bmi = self.calculate_bmi()
            self.bmi_status = self.determine_bmi_status()
        super().save(*args, **kwargs)


class MergedDocument(BaseModel):
    """
    Merged medical document.
    Consolidates data from multiple sources (SOAP, Vitals, AI predictions, etc.)
    Uses JSON references for data lineage.
    """

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name="환자"
    )

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name='documents',
        verbose_name="진료 세션"
    )

    title = models.CharField(
        max_length=200,
        verbose_name="문서 제목"
    )

    document_type = models.CharField(
        max_length=50,
        choices=DocumentType.CHOICES,
        verbose_name="문서 유형"
    )

    status = models.CharField(
        max_length=20,
        choices=DocumentStatus.CHOICES,
        default=DocumentStatus.DRAFT,
        verbose_name="문서 상태"
    )

    references = models.JSONField(
        default=dict,
        verbose_name="참조 데이터",
        help_text="원본 데이터 ID 참조 (Data Lineage)"
    )

    snapshot_data = models.JSONField(
        default=dict,
        verbose_name="스냅샷 데이터",
        help_text="기록 당시의 데이터 스냅샷"
    )

    signed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='signed_documents',
        verbose_name="서명 의사"
    )

    class Meta:
        db_table = 'emr_merged_document'
        verbose_name = '통합 문서'
        verbose_name_plural = '통합 문서 목록'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', '-created_at']),
            models.Index(fields=['encounter']),
            models.Index(fields=['status']),
        ]

    def __str__(self) -> str:
        return f"{self.title} - {self.patient.full_name}"

    def get_reference_ids(self) -> Dict[str, Any]:
        """Get all reference IDs from the document."""
        return self.references

    def add_reference(self, category: str, key: str, value: int) -> None:
        """
        Add a reference ID to the document.
        Example: add_reference('emr', 'form_soap_id', 123)
        """
        if category not in self.references:
            self.references[category] = {}
        self.references[category][key] = value
        logger.info(f"Added reference: {category}.{key} = {value}")
