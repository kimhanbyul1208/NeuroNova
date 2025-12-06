"""
Custom permissions for brain tumor diagnosis features.
Extended permissions specific to custom app models.
"""
from rest_framework import permissions
from rest_framework.request import Request
from rest_framework.views import APIView
from config.constants import UserRole
from typing import Any
import logging

logger = logging.getLogger(__name__)


class CanManagePatientDoctor(permissions.BasePermission):
    """
    Permission: Only admins and doctors can manage patient-doctor relationships.
    Patients cannot modify these relationships.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        """
        Check if user has permission to manage patient-doctor relationships.
        """
        if not request.user or not request.user.is_authenticated:
            return False

        # Only admins and doctors can manage relationships
        if hasattr(request.user, 'profile'):
            role = request.user.profile.role
            # Admin has full access
            if role == UserRole.ADMIN:
                return True
            # Doctors can view but not create/delete
            if role == UserRole.DOCTOR:
                return request.method in permissions.SAFE_METHODS

        return False

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        """
        Check if user can access/modify specific patient-doctor relationship.
        """
        if hasattr(request.user, 'profile'):
            role = request.user.profile.role

            # Admins can do anything
            if role == UserRole.ADMIN:
                return True

            # Doctors can only view their own patient relationships
            if role == UserRole.DOCTOR:
                return (
                    request.method in permissions.SAFE_METHODS and
                    obj.doctor.user == request.user
                )

        return False


class CanAccessAppointments(permissions.BasePermission):
    """
    Permission: Patients can view their own appointments.
    Doctors and nurses can view appointments assigned to them.
    Admins can view all appointments.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        # Admins have full access
        if hasattr(request.user, 'profile'):
            role = request.user.profile.role
            if role == UserRole.ADMIN:
                return True
            # Doctors, nurses, and patients can access appointments
            return role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT]

        return False

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        """
        Check if user can access specific appointment.
        """
        if hasattr(request.user, 'profile'):
            role = request.user.profile.role

            # Admins can access all
            if role == UserRole.ADMIN:
                return True

            # Patients can only access their own appointments
            if role == UserRole.PATIENT:
                return obj.patient.user == request.user

            # Doctors can access their assigned appointments
            if role == UserRole.DOCTOR:
                return obj.doctor and obj.doctor.user == request.user

            # Nurses can view appointments (read-only in most cases)
            if role == UserRole.NURSE:
                return request.method in permissions.SAFE_METHODS

        return False


class CanManageAppointments(permissions.BasePermission):
    """
    Permission: Only doctors and admins can confirm/cancel appointments.
    Patients can only create and cancel their own.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, 'profile'):
            role = request.user.profile.role
            # Doctors, nurses, patients, and admins can manage appointments
            return role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT, UserRole.ADMIN]

        return False

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        if hasattr(request.user, 'profile'):
            role = request.user.profile.role

            # Admins, doctors, and nurses can manage any appointment
            if role in [UserRole.ADMIN, UserRole.DOCTOR, UserRole.NURSE]:
                return True

            # Patients can only cancel their own pending appointments
            if role == UserRole.PATIENT:
                if request.method in ['PATCH', 'PUT', 'DELETE']:
                    return obj.patient.user == request.user
                return obj.patient.user == request.user

        return False


class CanAccessPredictionResults(permissions.BasePermission):
    """
    Permission: AI prediction results access control.
    Critical medical data with strict access rules.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, 'profile'):
            role = request.user.profile.role
            # Only doctors and admins can access AI predictions
            # Patients should access through their encounter/medical records
            return role in [UserRole.DOCTOR, UserRole.ADMIN]

        return False

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        """
        Doctors can only access predictions for their patients.
        """
        if hasattr(request.user, 'profile'):
            role = request.user.profile.role

            if role == UserRole.ADMIN:
                return True

            if role == UserRole.DOCTOR:
                # Check if doctor is assigned to this patient
                from apps.custom.models import PatientDoctor
                return PatientDoctor.objects.filter(
                    patient=obj.patient,
                    doctor__user=request.user
                ).exists()

        return False


class CanConfirmPrediction(permissions.BasePermission):
    """
    Permission: Only doctors can confirm and provide feedback on AI predictions.
    Human-in-the-loop pattern enforcement.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, 'profile'):
            # Only doctors can confirm predictions
            return request.user.profile.role == UserRole.DOCTOR

        return False

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        """
        Doctor must be assigned to the patient to confirm prediction.
        """
        from apps.custom.models import PatientDoctor

        return PatientDoctor.objects.filter(
            patient=obj.patient,
            doctor__user=request.user
        ).exists()


class CanAccessPrescriptions(permissions.BasePermission):
    """
    Permission: Prescription access control.
    Only doctors can create, patients can view their own.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, 'profile'):
            role = request.user.profile.role

            # Doctors can create prescriptions
            if request.method == 'POST':
                return role in [UserRole.DOCTOR, UserRole.ADMIN]

            # Doctors, nurses, patients, and admins can view
            return role in [UserRole.DOCTOR, UserRole.NURSE, UserRole.PATIENT, UserRole.ADMIN]

        return False

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        if hasattr(request.user, 'profile'):
            role = request.user.profile.role

            # Admins can access all
            if role == UserRole.ADMIN:
                return True

            # Patients can only view their own prescriptions
            if role == UserRole.PATIENT:
                return obj.encounter.patient.user == request.user and request.method in permissions.SAFE_METHODS

            # Doctors can access prescriptions for their patients
            if role == UserRole.DOCTOR:
                from apps.custom.models import PatientDoctor
                return PatientDoctor.objects.filter(
                    patient=obj.encounter.patient,
                    doctor__user=request.user
                ).exists()

            # Nurses can view prescriptions
            if role == UserRole.NURSE:
                return request.method in permissions.SAFE_METHODS

        return False


class IsDoctorOrAdmin(permissions.BasePermission):
    """
    Permission: Only doctors or admins can access.
    Used for doctor-specific resources.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, 'profile'):
            role = request.user.profile.role
            return role in [UserRole.DOCTOR, UserRole.ADMIN]

        return request.user.is_staff or request.user.is_superuser


class CanModifyPatientDoctorRelation(permissions.BasePermission):
    """
    Permission: Only admins and doctors can manage patient-doctor assignments.
    Critical for medical data access control.
    """

    def has_permission(self, request: Request, view: APIView) -> bool:
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, 'profile'):
            role = request.user.profile.role
            # Only admins can assign doctors to patients
            # This is a critical security control
            return role == UserRole.ADMIN

        return request.user.is_staff or request.user.is_superuser

    def has_object_permission(self, request: Request, view: APIView, obj: Any) -> bool:
        """
        Admin-only for modifications to maintain data integrity.
        """
        if hasattr(request.user, 'profile'):
            return request.user.profile.role == UserRole.ADMIN

        return request.user.is_staff or request.user.is_superuser
