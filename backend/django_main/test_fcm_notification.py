"""
Test script for sending FCM notifications using Firebase Admin SDK.

Usage:
    python test_fcm_notification.py <FCM_TOKEN>

Example:
    python test_fcm_notification.py "dXXXXXXXXXXXXXXXXXX..."
"""
import os
import sys
import django

# Django setup
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from apps.core.services.notification_service import NotificationService


def test_notification(fcm_token: str):
    """
    Send a test notification to the specified FCM token.

    Args:
        fcm_token: Firebase Cloud Messaging token from the Flutter app
    """
    print(f"\n{'='*60}")
    print("Firebase Cloud Messaging (FCM) Test")
    print(f"{'='*60}\n")

    # Initialize notification service
    service = NotificationService()

    # Test notification data
    title = "NeuroNova Test Notification"
    body = "Firebase Admin SDK integration successful!"
    data = {
        'type': 'TEST',
        'timestamp': '2025-11-29',
        'version': '1.0.0'
    }

    print(f"Sending notification...")
    print(f"  Title: {title}")
    print(f"  Body: {body}")
    print(f"  Data: {data}")
    print(f"  Token: {fcm_token[:20]}...\n")

    # Send notification
    result = service.send_push_notification(
        fcm_token=fcm_token,
        title=title,
        body=body,
        data=data
    )

    # Display result
    print(f"\n{'='*60}")
    if result.get('success'):
        print("[SUCCESS] Notification sent successfully!")
        print(f"Message ID: {result.get('message_id')}")
    else:
        print("[FAILED] Notification failed!")
        print(f"Error: {result.get('error')}")
    print(f"{'='*60}\n")

    return result


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print(__doc__)
        print("\n[ERROR] Please provide FCM token as argument")
        print("\nTo get your FCM token:")
        print("  1. Run the Flutter app")
        print("  2. Check the console output for 'FCM Token: ...'")
        print("  3. Copy the token and run this script again\n")
        sys.exit(1)

    fcm_token = sys.argv[1]

    if not fcm_token or len(fcm_token) < 50:
        print("\n[ERROR] Invalid FCM token (too short)")
        print("Please provide a valid token from the Flutter app\n")
        sys.exit(1)

    test_notification(fcm_token)
