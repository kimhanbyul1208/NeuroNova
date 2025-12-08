# -*- coding: utf-8 -*-
"""
Notification Service for Push Notifications (Firebase FCM).
Strategy Pattern implementation for different notification types.
"""
from typing import Optional, Dict, Any
from abc import ABC, abstractmethod
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class NotificationStrategy(ABC):
    """Abstract base class for notification strategies."""

    @abstractmethod
    def send(self, recipient: str, title: str, body: str, data: Optional[Dict] = None) -> bool:
        """Send notification."""
        pass


class FCMNotificationStrategy(NotificationStrategy):
    """
    Firebase Cloud Messaging notification strategy using Firebase Admin SDK.
    Sends push notifications to mobile devices.
    """

    def send(
        self,
        fcm_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send FCM push notification using Firebase Admin SDK.

        Args:
            fcm_token: Firebase Cloud Messaging token
            title: Notification title
            body: Notification message body
            data: Additional data payload

        Returns:
            Dictionary with success status and message_id or error
        """
        if not fcm_token:
            logger.warning("No FCM token provided")
            return {'success': False, 'error': 'No FCM token provided'}

        try:
            from firebase_admin import messaging

            # Build notification message
            message = messaging.Message(
                notification=messaging.Notification(
                    title=title,
                    body=body,
                ),
                data=data if data else {},
                token=fcm_token,
                android=messaging.AndroidConfig(
                    priority='high',
                    notification=messaging.AndroidNotification(
                        sound='default',
                    ),
                ),
                apns=messaging.APNSConfig(
                    payload=messaging.APNSPayload(
                        aps=messaging.Aps(
                            sound='default',
                            badge=1,
                        ),
                    ),
                ),
            )

            # Send message
            response = messaging.send(message)
            logger.info(f"FCM notification sent: {title} (message_id: {response})")
            return {'success': True, 'message_id': response}

        except Exception as e:
            logger.error(f"FCM send error: {e}")
            return {'success': False, 'error': str(e)}


class EmailNotificationStrategy(NotificationStrategy):
    """
    Email notification strategy.
    (Placeholder for future implementation)
    """

    def send(self, email: str, title: str, body: str, data: Optional[Dict] = None) -> bool:
        """Send email notification."""
        # TODO: Implement email sending
        logger.info(f"Email notification (not implemented): {email} - {title}")
        return True


class NotificationService:
    """
    Main notification service using Strategy Pattern.
    Handles different notification types based on strategy.
    """

    def __init__(self):
        self.fcm_strategy = FCMNotificationStrategy()
        self.email_strategy = EmailNotificationStrategy()

    def send_push_notification(
        self,
        fcm_token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Send push notification via FCM.

        Args:
            fcm_token: User's FCM token
            title: Notification title
            body: Notification body
            data: Additional data

        Returns:
            Dictionary with success status and message_id or error
        """
        return self.fcm_strategy.send(fcm_token, title, body, data)

    def send_email_notification(
        self,
        email: str,
        title: str,
        body: str,
        data: Optional[Dict] = None
    ) -> bool:
        """
        Send email notification.

        Args:
            email: Recipient email
            title: Email subject
            body: Email body
            data: Additional data

        Returns:
            True if successful
        """
        return self.email_strategy.send(email, title, body, data)

    def notify_appointment_confirmed(self, appointment) -> bool:
        """
        Send notification when appointment is confirmed.

        Args:
            appointment: Appointment instance

        Returns:
            True if successful
        """
        from apps.custom.models import Appointment
        from apps.notifications.models import Notification
        from apps.users.utils import send_sms

        patient_user = appointment.patient.user

        # Create DB Notification
        if patient_user:
            message = f"예약이 확정되었습니다. ({appointment.scheduled_at.strftime('%Y-%m-%d %H:%M')})"
            Notification.objects.create(
                recipient=patient_user,
                title="예약 확정 알림",
                message=message,
                notification_type='APPOINTMENT',
                related_object_id=appointment.id
            )

            # Send SMS
            if appointment.patient.phone:
                send_sms(appointment.patient.phone, f"[NeuroNova] {message}")

        if not hasattr(patient_user, 'profile'):
            return False

        fcm_token = patient_user.profile.fcm_token

        if not fcm_token:
            logger.warning(f"No FCM token for patient {patient_user.username}")
            return False

        title = "예약 확정"
        body = f"{appointment.scheduled_at.strftime('%Y년 %m월 %d일 %H:%M')} 예약이 확정되었습니다."
        data = {
            'type': 'APPOINTMENT_CONFIRMED',
            'appointment_id': str(appointment.id),
            'scheduled_at': appointment.scheduled_at.isoformat(),
        }

        result = self.send_push_notification(fcm_token, title, body, data)
        return result.get('success', False)

    def notify_appointment_cancelled(self, appointment) -> bool:
        """
        Send notification when appointment is cancelled.
        """
        from apps.notifications.models import Notification
        from apps.users.utils import send_sms

        patient_user = appointment.patient.user

        # Create DB Notification
        if patient_user:
            message = f"예약이 취소되었습니다. ({appointment.scheduled_at.strftime('%Y-%m-%d %H:%M')})"
            Notification.objects.create(
                recipient=patient_user,
                title="예약 취소 알림",
                message=message,
                notification_type='APPOINTMENT',
                related_object_id=appointment.id
            )

            # Send SMS
            if appointment.patient.phone:
                send_sms(appointment.patient.phone, f"[NeuroNova] {message}")

        if not hasattr(patient_user, 'profile'):
            return False

        fcm_token = patient_user.profile.fcm_token

        if not fcm_token:
            return False

        title = "예약 취소"
        body = f"{appointment.scheduled_at.strftime('%Y년 %m월 %d일 %H:%M')} 예약이 취소되었습니다."
        data = {
            'type': 'APPOINTMENT_CANCELLED',
            'appointment_id': str(appointment.id),
        }

        result = self.send_push_notification(fcm_token, title, body, data)
        return result.get('success', False)

    def notify_diagnosis_ready(self, prediction_result) -> bool:
        """
        Send notification when AI diagnosis is ready.

        Args:
            prediction_result: PatientPredictionResult instance

        Returns:
            True if successful
        """
        patient_user = prediction_result.patient.user

        if not hasattr(patient_user, 'profile'):
            return False

        fcm_token = patient_user.profile.fcm_token

        if not fcm_token:
            return False

        title = "AI 진단 완료"
        body = f"진단 결과가 준비되었습니다. ({prediction_result.prediction_class})"
        data = {
            'type': 'DIAGNOSIS_READY',
            'prediction_id': str(prediction_result.id),
            'prediction_class': prediction_result.prediction_class,
        }

        result = self.send_push_notification(fcm_token, title, body, data)
        return result.get('success', False)

    def notify_prescription_ready(self, prescription) -> bool:
        """
        Send notification when prescription is ready.

        Args:
            prescription: Prescription instance

        Returns:
            True if successful
        """
        patient_user = prescription.encounter.patient.user

        if not hasattr(patient_user, 'profile'):
            return False

        fcm_token = patient_user.profile.fcm_token

        if not fcm_token:
            return False

        title = "처방전 발급"
        body = f"{prescription.medication_name} 처방전이 발급되었습니다."
        data = {
            'type': 'PRESCRIPTION_READY',
            'prescription_id': str(prescription.id),
        }

        result = self.send_push_notification(fcm_token, title, body, data)
        return result.get('success', False)


# Singleton instance
notification_service = NotificationService()
