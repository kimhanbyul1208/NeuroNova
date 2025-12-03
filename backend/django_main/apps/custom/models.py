"""
Custom models for NeuroNova.
Brain tumor diagnosis specific features.
"""
from django.db import models
from django.contrib.auth.models import User
from apps.core.models import BaseModel
from apps.emr.models import Patient, Encounter
from config.constants import (
    AppointmentStatus,
    VisitType,
    DoctorFeedback,
    TumorType,
    MedicationRoute
)
from typing import Optional, Dict, Any
import logging

logger = logging.getLogger(__name__)


class Doctor(BaseModel):
    """
    Doctor detailed information.
    Extends user profile specifically for doctors.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='doctor',
        verbose_name="사용자 계정"
    )

    license_number = models.CharField(
        max_length=50,
        unique=True,
        verbose_name="의사 면허 번호"
    )

    specialty = models.CharField(
        max_length=100,
        verbose_name="전문 분야",
        help_text="예: Neurology, Neurosurgery"
    )

    department = models.CharField(
        max_length=100,
        verbose_name="소속 부서"
    )

    bio = models.TextField(
        blank=True,
        verbose_name="경력 및 소개"
    )

    class Meta:
        db_table = 'custom_doctor'
        verbose_name = '의사'
        verbose_name_plural = '의사 목록'
        indexes = [
            models.Index(fields=['license_number']),
            models.Index(fields=['specialty']),
        ]

    def __str__(self) -> str:
        return f"Dr. {self.user.get_full_name()} ({self.specialty})"


class PatientDoctor(BaseModel):
    """
    Patient-Doctor relationship mapping (N:M).
    Tracks primary and secondary doctors for patients.
    """

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='patient_doctors',
        verbose_name="환자"
    )

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.CASCADE,
        related_name='doctor_patients',
        verbose_name="의사"
    )

    is_primary = models.BooleanField(
        default=False,
        verbose_name="주치의 여부"
    )

    assigned_date = models.DateField(
        verbose_name="배정 날짜"
    )

    class Meta:
        db_table = 'custom_patient_doctor'
        verbose_name = '환자-의사 관계'
        verbose_name_plural = '환자-의사 관계 목록'
        unique_together = ['patient', 'doctor']
        indexes = [
            models.Index(fields=['patient', 'is_primary']),
            models.Index(fields=['doctor']),
        ]

    def __str__(self) -> str:
        primary = "주치의" if self.is_primary else "협진"
        return f"{self.patient.full_name} - {self.doctor.user.get_full_name()} ({primary})"


class Appointment(BaseModel):
    """
    Appointment management (예약 관리).
    NEW feature for patient app integration.
    """

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='appointments',
        verbose_name="환자"
    )

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.SET_NULL,
        null=True,
        related_name='appointments',
        verbose_name="담당 의사"
    )

    scheduled_at = models.DateTimeField(
        verbose_name="예약 일시"
    )

    duration_minutes = models.IntegerField(
        default=30,
        verbose_name="예상 진료 시간 (분)"
    )

    status = models.CharField(
        max_length=20,
        choices=AppointmentStatus.CHOICES,
        default=AppointmentStatus.PENDING,
        verbose_name="예약 상태"
    )

    visit_type = models.CharField(
        max_length=20,
        choices=VisitType.CHOICES,
        verbose_name="방문 유형"
    )

    reason = models.TextField(
        blank=True,
        verbose_name="예약 사유",
        help_text="환자가 입력한 방문 사유"
    )

    created_by = models.CharField(
        max_length=50,
        default="PATIENT_APP",
        verbose_name="생성 경로",
        help_text="PATIENT_APP, DOCTOR_WEB, NURSE_STATION"
    )

    notes = models.TextField(
        blank=True,
        verbose_name="의사 메모",
        help_text="의사가 추가한 예약 관련 메모"
    )

    class Meta:
        db_table = 'custom_appointment'
        verbose_name = '예약'
        verbose_name_plural = '예약 목록'
        ordering = ['-scheduled_at']
        indexes = [
            models.Index(fields=['patient', '-scheduled_at']),
            models.Index(fields=['doctor', '-scheduled_at']),
            models.Index(fields=['status']),
            models.Index(fields=['scheduled_at']),
        ]

    def __str__(self) -> str:
        return f"{self.patient.full_name} - {self.scheduled_at.strftime('%Y-%m-%d %H:%M')}"

    def confirm(self) -> None:
        """Confirm the appointment."""
        self.status = AppointmentStatus.CONFIRMED
        self.save()
        logger.info(f"Appointment confirmed: {self.id}")

        # Send notification to patient
        from apps.core.services.notification_service import notification_service
        notification_service.notify_appointment_confirmed(self)

    def cancel(self) -> None:
        """Cancel the appointment."""
        self.status = AppointmentStatus.CANCELLED
        self.save()
        logger.info(f"Appointment cancelled: {self.id}")

        # Send notification to patient
        from apps.core.services.notification_service import notification_service
        notification_service.notify_appointment_cancelled(self)


class PatientPredictionResult(BaseModel):
    """
    AI prediction result for brain tumor diagnosis.
    Core feature of NeuroNova CDSS.
    """

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name='predictions',
        verbose_name="진료 세션"
    )

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='predictions',
        verbose_name="환자"
    )

    doctor = models.ForeignKey(
        Doctor,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reviewed_predictions',
        verbose_name="검토 의사"
    )

    # Model Information
    model_name = models.CharField(
        max_length=100,
        verbose_name="모델명",
        help_text="예: NeuroNova_Brain_v2.1"
    )

    model_version = models.CharField(
        max_length=20,
        verbose_name="모델 버전"
    )

    # DICOM/Orthanc Integration
    orthanc_study_uid = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Orthanc Study UID",
        help_text="DICOM Study Instance UID"
    )

    orthanc_series_uid = models.CharField(
        max_length=200,
        blank=True,
        verbose_name="Orthanc Series UID",
        help_text="DICOM Series Instance UID"
    )

    # Prediction Results
    prediction_class = models.CharField(
        max_length=50,
        choices=TumorType.CHOICES,
        verbose_name="예측 클래스",
        help_text="AI가 예측한 종양 유형"
    )

    confidence_score = models.FloatField(
        verbose_name="신뢰도 점수",
        help_text="예측 확률 (0~1)"
    )

    probabilities = models.JSONField(
        default=dict,
        verbose_name="클래스별 확률",
        help_text="모든 클래스에 대한 확률 분포"
    )

    # Explainable AI (XAI)
    xai_image_path = models.CharField(
        max_length=500,
        blank=True,
        verbose_name="XAI 이미지 경로",
        help_text="SHAP/Grad-CAM 히트맵 이미지 경로"
    )

    feature_importance = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="특성 중요도",
        help_text="모델이 중요하게 본 특징들"
    )

    # Human-in-the-loop
    doctor_feedback = models.CharField(
        max_length=20,
        choices=DoctorFeedback.CHOICES,
        blank=True,
        verbose_name="의사 피드백",
        help_text="AI 예측에 대한 의사의 평가"
    )

    doctor_note = models.TextField(
        blank=True,
        verbose_name="의사 소견",
        help_text="의사의 추가 코멘트"
    )

    confirmed_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="확정 일시",
        help_text="의사가 검토 완료한 시간"
    )

    class Meta:
        db_table = 'custom_prediction_result'
        verbose_name = 'AI 진단 결과'
        verbose_name_plural = 'AI 진단 결과 목록'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', '-created_at']),
            models.Index(fields=['encounter']),
            models.Index(fields=['prediction_class']),
            models.Index(fields=['doctor_feedback']),
        ]

    def __str__(self) -> str:
        return f"{self.patient.full_name} - {self.prediction_class} ({self.confidence_score:.2%})"

    def is_high_confidence(self, threshold: float = 0.8) -> bool:
        """Check if prediction confidence is above threshold."""
        return self.confidence_score >= threshold

    def confirm_by_doctor(self, doctor: Doctor, feedback: str, note: str = "") -> None:
        """
        Doctor confirms and provides feedback on the prediction.
        Human-in-the-loop pattern.
        """
        from django.utils import timezone

        self.doctor = doctor
        self.doctor_feedback = feedback
        self.doctor_note = note
        self.confirmed_at = timezone.now()
        self.save()

        logger.info(
            f"Prediction {self.id} confirmed by Dr. {doctor.user.get_full_name()}: {feedback}"
        )


class Prescription(BaseModel):
    """
    Prescription record (처방전).
    Links to encounter and can be referenced in MergedDocument.
    """

    encounter = models.ForeignKey(
        Encounter,
        on_delete=models.CASCADE,
        related_name='prescriptions',
        verbose_name="진료 세션"
    )

    medication_code = models.CharField(
        max_length=50,
        verbose_name="약물 코드",
        help_text="표준 약물 코드"
    )

    medication_name = models.CharField(
        max_length=200,
        verbose_name="약물명"
    )

    dosage = models.CharField(
        max_length=100,
        verbose_name="용량",
        help_text="1회 투여량"
    )

    frequency = models.CharField(
        max_length=100,
        verbose_name="투여 빈도",
        help_text="예: 3 times/day"
    )

    duration = models.CharField(
        max_length=50,
        verbose_name="투여 기간",
        help_text="예: 7 days"
    )

    route = models.CharField(
        max_length=50,
        choices=MedicationRoute.CHOICES,
        verbose_name="투여 경로"
    )

    instructions = models.TextField(
        blank=True,
        verbose_name="복용 지시사항",
        help_text="예: 식후 30분 복용"
    )

    prescribed_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="처방 일시"
    )

    class Meta:
        db_table = 'custom_prescription'
        verbose_name = '처방전'
        verbose_name_plural = '처방전 목록'
        ordering = ['-prescribed_at']
        indexes = [
            models.Index(fields=['encounter']),
            models.Index(fields=['-prescribed_at']),
        ]

    def __str__(self) -> str:
        return f"{self.medication_name} - {self.dosage} ({self.frequency})"


class AntigenAnalysisResult(BaseModel):
    """
    Antigen Test Analysis Result.
    Stores user-selected analysis results from the Antigen Result Page.
    """

    patient = models.ForeignKey(
        Patient,
        on_delete=models.CASCADE,
        related_name='antigen_results',
        verbose_name="환자"
    )

    input_sequence = models.TextField(
        verbose_name="입력 서열",
        help_text="분석된 단백질/DNA/RNA 서열"
    )

    input_type = models.CharField(
        max_length=20,
        verbose_name="입력 타입",
        help_text="PROTEIN, DNA, RNA"
    )

    prediction_result = models.JSONField(
        verbose_name="예측 결과",
        help_text="Task1, Task2, Task3 결과 포함"
    )

    class Meta:
        db_table = 'custom_antigen_result'
        verbose_name = '항원 분석 결과'
        verbose_name_plural = '항원 분석 결과 목록'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['patient', '-created_at']),
        ]

    def __str__(self) -> str:
        return f"{self.patient.full_name} - {self.input_type} ({self.created_at.strftime('%Y-%m-%d')})"
