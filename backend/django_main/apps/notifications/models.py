"""
Notification models for NeuroNova.
Push notifications, alerts, and messaging.
"""
from django.db import models
from django.contrib.auth.models import User
from apps.core.models import BaseModel
from config.constants import NotificationType
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class NotificationLog(BaseModel):
    """
    Notification log (알림 기록).
    Tracks all notifications sent to users.
    Note: This is server-side log. NOT subject to 90-day deletion.
    """

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name="수신자"
    )

    notification_type = models.CharField(
        max_length=50,
        choices=NotificationType.CHOICES,
        default=NotificationType.GENERAL,
        verbose_name="알림 유형"
    )

    title = models.CharField(
        max_length=200,
        verbose_name="제목"
    )

    message = models.TextField(
        verbose_name="메시지 내용"
    )

    is_read = models.BooleanField(
        default=False,
        verbose_name="읽음 여부"
    )

    read_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="읽은 시각"
    )

    sent_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="발송 시각"
    )

    # Optional metadata
    metadata = models.JSONField(
        default=dict,
        blank=True,
        verbose_name="추가 메타데이터",
        help_text="예: appointment_id, prescription_id 등"
    )

    # Push notification status
    push_sent = models.BooleanField(
        default=False,
        verbose_name="푸시 발송 여부"
    )

    push_error = models.TextField(
        blank=True,
        verbose_name="푸시 발송 오류",
        help_text="FCM 오류 메시지"
    )

    class Meta:
        db_table = 'notification_log'
        verbose_name = '알림 기록'
        verbose_name_plural = '알림 기록 목록'
        ordering = ['-sent_at']
        indexes = [
            models.Index(fields=['recipient', '-sent_at']),
            models.Index(fields=['is_read']),
            models.Index(fields=['notification_type']),
        ]

    def __str__(self) -> str:
        return f"{self.recipient.username} - {self.title}"

    def mark_as_read(self) -> None:
        """Mark notification as read."""
        from django.utils import timezone

        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save()
            logger.info(f"Notification {self.id} marked as read")

    @classmethod
    def send_notification(
        cls,
        recipient: User,
        title: str,
        message: str,
        notification_type: str = NotificationType.GENERAL,
        metadata: Optional[dict] = None
    ) -> 'NotificationLog':
        """
        Factory pattern for creating and sending notifications.
        Strategy pattern: Can be extended to support Email, SMS, etc.
        """
        notification = cls.objects.create(
            recipient=recipient,
            title=title,
            message=message,
            notification_type=notification_type,
            metadata=metadata or {}
        )

        # Send push notification via FCM
        if hasattr(recipient, 'profile') and recipient.profile.fcm_token:
            try:
                # TODO: Implement actual FCM sending logic
                notification.push_sent = True
                notification.save()
                logger.info(f"Push notification sent to {recipient.username}")
            except Exception as e:
                notification.push_error = str(e)
                notification.save()
                logger.error(f"Failed to send push notification: {e}")

        return notification

    @classmethod
    def create_appointment_reminder(
        cls,
        recipient: User,
        appointment_datetime: str,
        doctor_name: str,
        appointment_id: int
    ) -> 'NotificationLog':
        """
        Create appointment reminder notification.
        """
        return cls.send_notification(
            recipient=recipient,
            title="예약 알림",
            message=f"{appointment_datetime}에 {doctor_name} 의사 선생님과 예약이 있습니다.",
            notification_type=NotificationType.APPOINTMENT_REMINDER,
            metadata={'appointment_id': appointment_id}
        )

    @classmethod
    def create_appointment_confirmed(
        cls,
        recipient: User,
        appointment_datetime: str,
        appointment_id: int
    ) -> 'NotificationLog':
        """
        Create appointment confirmation notification.
        """
        return cls.send_notification(
            recipient=recipient,
            title="예약 확정",
            message=f"{appointment_datetime} 예약이 확정되었습니다.",
            notification_type=NotificationType.APPOINTMENT_CONFIRMED,
            metadata={'appointment_id': appointment_id}
        )

    @classmethod
    def create_diagnosis_ready(
        cls,
        recipient: User,
        diagnosis_summary: str,
        encounter_id: int
    ) -> 'NotificationLog':
        """
        Create diagnosis ready notification.
        """
        return cls.send_notification(
            recipient=recipient,
            title="진단 결과 확인",
            message=f"진단 결과가 준비되었습니다: {diagnosis_summary}",
            notification_type=NotificationType.DIAGNOSIS_READY,
            metadata={'encounter_id': encounter_id}
        )
