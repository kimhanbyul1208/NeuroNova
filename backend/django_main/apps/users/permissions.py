"""
Custom permissions for Users app.
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """
    Permission class to check if user is an admin.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        # Check if user has admin profile
        if hasattr(request.user, 'profile'):
            return request.user.profile.is_admin()

        # Fallback to is_staff or is_superuser
        return request.user.is_staff or request.user.is_superuser


class IsDoctor(BasePermission):
    """
    Permission class to check if user is a doctor.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, 'profile'):
            return request.user.profile.is_doctor()

        return False


class IsNurse(BasePermission):
    """
    Permission class to check if user is a nurse.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, 'profile'):
            return request.user.profile.is_nurse()

        return False


class IsDoctorOrNurse(BasePermission):
    """
    Permission class to check if user is a doctor or nurse.
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False

        if hasattr(request.user, 'profile'):
            return request.user.profile.is_doctor() or request.user.profile.is_nurse()

        return False
