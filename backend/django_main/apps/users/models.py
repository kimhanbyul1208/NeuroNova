"""
User models for NeuroNova.
Extends Django's default User model with UserProfile.
"""
from django.contrib.auth.models import User
from django.db import models
from apps.core.models import BaseModel
from config.constants import UserRole
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class Department(BaseModel):
    """
    Medical Department (진료과).
    Stores location and contact info.
    """
    name = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="진료과명"
    )

    location = models.CharField(
        max_length=200,
        verbose_name="위치",
        help_text="예: 본관 3층 301호"
    )

    phone_number = models.CharField(
        max_length=20,
        verbose_name="대표 전화번호"
    )

    description = models.TextField(
        blank=True,
        verbose_name="설명"
    )

    class Meta:
        db_table = 'department'
        verbose_name = '진료과'
        verbose_name_plural = '진료과 목록'

    def __str__(self) -> str:
        return self.name


class UserProfile(BaseModel):
    """
    Extended user profile for NeuroNova.
    OneToOne relationship with Django's User model.
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name="사용자",
        help_text="Django User 모델과 1:1 관계"
    )

    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='members',
        verbose_name="소속 진료과"
    )

    role = models.CharField(
        max_length=20,
        choices=UserRole.CHOICES,
        default=UserRole.PATIENT,
        verbose_name="역할",
        help_text="시스템 내 사용자 역할 (RBAC)"
    )

    phone_number = models.CharField(
        max_length=20,
        blank=True,
        verbose_name="전화번호",
        help_text="연락처"
    )

    profile_image = models.ImageField(
        upload_to='profiles/',
        null=True,
        blank=True,
        verbose_name="프로필 이미지",
        help_text="사용자 프로필 사진"
    )

    fcm_token = models.CharField(
        max_length=255,
        blank=True,
        verbose_name="FCM 토큰",
        help_text="Firebase Cloud Messaging 토큰 (Push 알림용)"
    )

    bio = models.TextField(
        blank=True,
        verbose_name="소개",
        help_text="사용자 소개 또는 경력"
    )

    class Meta:
        db_table = 'user_profile'
        verbose_name = '사용자 프로필'
        verbose_name_plural = '사용자 프로필 목록'
        indexes = [
            models.Index(fields=['user']),
            models.Index(fields=['role']),
        ]

    def __str__(self) -> str:
        return f"{self.user.username} ({self.get_role_display()})"

    def is_doctor(self) -> bool:
        """Check if user is a doctor."""
        return self.role == UserRole.DOCTOR

    def is_patient(self) -> bool:
        """Check if user is a patient."""
        return self.role == UserRole.PATIENT

    def is_nurse(self) -> bool:
        """Check if user is a nurse."""
        return self.role == UserRole.NURSE

    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN

    def send_notification(self, title: str, message: str) -> bool:
        """
        Send push notification to user via FCM.
        Factory Pattern: Can be extended to support multiple notification services.
        """
        if not self.fcm_token:
            logger.warning(f"No FCM token for user {self.user.username}")
            return False

        # TODO: Implement FCM notification logic
        logger.info(f"Sending notification to {self.user.username}: {title}")
        return True
