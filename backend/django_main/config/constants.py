"""
Constants and configuration values for NeuroNova.
Soft-coding approach: All constants defined here for easy maintenance.
"""
from typing import Dict, List, Final

# Project Information
PROJECT_NAME: Final[str] = "NeuroNova"
PROJECT_VERSION: Final[str] = "1.0.0"
API_VERSION: Final[str] = "v1"

# User Roles
class UserRole:
    """User role constants for RBAC."""
    ADMIN: Final[str] = "ADMIN"
    DOCTOR: Final[str] = "DOCTOR"
    NURSE: Final[str] = "NURSE"
    PATIENT: Final[str] = "PATIENT"

    CHOICES: Final[List[tuple]] = [
        (ADMIN, "Administrator"),
        (DOCTOR, "Doctor"),
        (NURSE, "Nurse"),
        (PATIENT, "Patient"),
    ]


# Encounter Status
class EncounterStatus:
    """Encounter (진료) status constants."""
    SCHEDULED: Final[str] = "SCHEDULED"
    IN_PROGRESS: Final[str] = "IN_PROGRESS"
    COMPLETED: Final[str] = "COMPLETED"
    CANCELLED: Final[str] = "CANCELLED"

    CHOICES: Final[List[tuple]] = [
        (SCHEDULED, "Scheduled"),
        (IN_PROGRESS, "In Progress"),
        (COMPLETED, "Completed"),
        (CANCELLED, "Cancelled"),
    ]


# Appointment Status
class AppointmentStatus:
    """Appointment status constants."""
    PENDING: Final[str] = "PENDING"
    CONFIRMED: Final[str] = "CONFIRMED"
    CANCELLED: Final[str] = "CANCELLED"
    NO_SHOW: Final[str] = "NO_SHOW"
    COMPLETED: Final[str] = "COMPLETED"

    CHOICES: Final[List[tuple]] = [
        (PENDING, "Pending"),
        (CONFIRMED, "Confirmed"),
        (CANCELLED, "Cancelled"),
        (NO_SHOW, "No Show"),
        (COMPLETED, "Completed"),
    ]


# Visit Type
class VisitType:
    """Visit type constants."""
    FIRST_VISIT: Final[str] = "FIRST_VISIT"
    FOLLOW_UP: Final[str] = "FOLLOW_UP"
    CHECK_UP: Final[str] = "CHECK_UP"
    EMERGENCY: Final[str] = "EMERGENCY"

    CHOICES: Final[List[tuple]] = [
        (FIRST_VISIT, "First Visit"),
        (FOLLOW_UP, "Follow Up"),
        (CHECK_UP, "Check Up"),
        (EMERGENCY, "Emergency"),
    ]


# Document Type
class DocumentType:
    """Medical document type constants."""
    FINAL_REPORT: Final[str] = "FINAL_REPORT"
    REFERRAL: Final[str] = "REFERRAL"
    DISCHARGE_SUMMARY: Final[str] = "DISCHARGE_SUMMARY"
    LAB_RESULT: Final[str] = "LAB_RESULT"

    CHOICES: Final[List[tuple]] = [
        (FINAL_REPORT, "Final Report"),
        (REFERRAL, "Referral"),
        (DISCHARGE_SUMMARY, "Discharge Summary"),
        (LAB_RESULT, "Lab Result"),
    ]


# Document Status
class DocumentStatus:
    """Document status constants."""
    DRAFT: Final[str] = "DRAFT"
    PENDING_REVIEW: Final[str] = "PENDING_REVIEW"
    APPROVED: Final[str] = "APPROVED"
    REJECTED: Final[str] = "REJECTED"

    CHOICES: Final[List[tuple]] = [
        (DRAFT, "Draft"),
        (PENDING_REVIEW, "Pending Review"),
        (APPROVED, "Approved"),
        (REJECTED, "Rejected"),
    ]


# Gender
class Gender:
    """Gender constants."""
    MALE: Final[str] = "M"
    FEMALE: Final[str] = "F"
    OTHER: Final[str] = "O"

    CHOICES: Final[List[tuple]] = [
        (MALE, "Male"),
        (FEMALE, "Female"),
        (OTHER, "Other"),
    ]


# Doctor Feedback for AI Predictions
class DoctorFeedback:
    """Doctor feedback on AI prediction results."""
    CORRECT: Final[str] = "CORRECT"
    INCORRECT: Final[str] = "INCORRECT"
    AMBIGUOUS: Final[str] = "AMBIGUOUS"
    NEEDS_REVIEW: Final[str] = "NEEDS_REVIEW"

    CHOICES: Final[List[tuple]] = [
        (CORRECT, "Correct"),
        (INCORRECT, "Incorrect"),
        (AMBIGUOUS, "Ambiguous"),
        (NEEDS_REVIEW, "Needs Review"),
    ]


# Brain Tumor Types (AI Prediction Classes)
class TumorType:
    """Brain tumor classification types."""
    GLIOMA: Final[str] = "Glioma"
    MENINGIOMA: Final[str] = "Meningioma"
    PITUITARY: Final[str] = "Pituitary"
    NO_TUMOR: Final[str] = "No Tumor"

    CHOICES: Final[List[tuple]] = [
        (GLIOMA, "Glioma"),
        (MENINGIOMA, "Meningioma"),
        (PITUITARY, "Pituitary"),
        (NO_TUMOR, "No Tumor"),
    ]


# BMI Status
class BMIStatus:
    """BMI status constants."""
    UNDERWEIGHT: Final[str] = "Underweight"
    NORMAL: Final[str] = "Normal"
    OVERWEIGHT: Final[str] = "Overweight"
    OBESE: Final[str] = "Obese"

    CHOICES: Final[List[tuple]] = [
        (UNDERWEIGHT, "Underweight"),
        (NORMAL, "Normal"),
        (OVERWEIGHT, "Overweight"),
        (OBESE, "Obese"),
    ]


# Medication Routes
class MedicationRoute:
    """Medication administration route."""
    ORAL: Final[str] = "Oral"
    IV: Final[str] = "IV"
    IM: Final[str] = "IM"
    TOPICAL: Final[str] = "Topical"
    SUBCUTANEOUS: Final[str] = "Subcutaneous"

    CHOICES: Final[List[tuple]] = [
        (ORAL, "Oral"),
        (IV, "Intravenous"),
        (IM, "Intramuscular"),
        (TOPICAL, "Topical"),
        (SUBCUTANEOUS, "Subcutaneous"),
    ]


# Notification Types
class NotificationType:
    """Notification type constants."""
    APPOINTMENT_REMINDER: Final[str] = "APPOINTMENT_REMINDER"
    APPOINTMENT_CONFIRMED: Final[str] = "APPOINTMENT_CONFIRMED"
    APPOINTMENT_CANCELLED: Final[str] = "APPOINTMENT_CANCELLED"
    DIAGNOSIS_READY: Final[str] = "DIAGNOSIS_READY"
    PRESCRIPTION_READY: Final[str] = "PRESCRIPTION_READY"
    GENERAL: Final[str] = "GENERAL"

    CHOICES: Final[List[tuple]] = [
        (APPOINTMENT_REMINDER, "Appointment Reminder"),
        (APPOINTMENT_CONFIRMED, "Appointment Confirmed"),
        (APPOINTMENT_CANCELLED, "Appointment Cancelled"),
        (DIAGNOSIS_READY, "Diagnosis Ready"),
        (PRESCRIPTION_READY, "Prescription Ready"),
        (GENERAL, "General"),
    ]


# Default Values
DEFAULT_APPOINTMENT_DURATION: Final[int] = 30  # minutes
PATIENT_DATA_EXPIRATION_DAYS: Final[int] = 90  # days
MAX_FILE_UPLOAD_SIZE: Final[int] = 10 * 1024 * 1024  # 10MB
