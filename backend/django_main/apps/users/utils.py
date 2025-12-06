"""
Utility functions for Users app.
"""
from cryptography.fernet import Fernet
from django.conf import settings
import random
import string
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def get_encryption_key() -> bytes:
    """
    Get encryption key from settings.
    For production, this should be stored in environment variables.
    """
    key = getattr(settings, 'ENCRYPTION_KEY', None)
    if not key:
        # Generate a new key for development (DO NOT use in production)
        logger.warning("ENCRYPTION_KEY not found in settings. Generating a temporary key for development.")
        key = Fernet.generate_key()

    if isinstance(key, str):
        key = key.encode()

    return key


def encrypt_ssn(ssn: str) -> bytes:
    """
    Encrypt SSN (주민등록번호) using Fernet symmetric encryption.

    Args:
        ssn: SSN string (e.g., "123456-1234567")

    Returns:
        Encrypted bytes
    """
    key = get_encryption_key()
    f = Fernet(key)
    return f.encrypt(ssn.encode())


def decrypt_ssn(encrypted_ssn: bytes) -> str:
    """
    Decrypt SSN from encrypted bytes.

    Args:
        encrypted_ssn: Encrypted SSN bytes

    Returns:
        Decrypted SSN string
    """
    key = get_encryption_key()
    f = Fernet(key)
    return f.decrypt(encrypted_ssn).decode()


def generate_sms_code(length: int = 6) -> str:
    """
    Generate random SMS verification code.

    Args:
        length: Length of the code (default 6)

    Returns:
        Random numeric string
    """
    return ''.join(random.choices(string.digits, k=length))


def send_sms(phone_number: str, message: str) -> bool:
    """
    Send SMS to phone number.

    This is a placeholder function. In production, integrate with:
    - AWS SNS
    - Twilio
    - Korean SMS services (Aligo, NHN Cloud SMS, etc.)

    Args:
        phone_number: Phone number to send to
        message: Message content

    Returns:
        True if successful, False otherwise
    """
    # TODO: Implement actual SMS sending logic
    logger.info(f"[SMS] To: {phone_number}, Message: {message}")

    # For development, always return True
    return True


def normalize_phone_number(phone: str) -> str:
    """
    Normalize phone number by removing hyphens and spaces.

    Args:
        phone: Phone number string (e.g., "010-1234-5678")

    Returns:
        Normalized phone number (e.g., "01012345678")
    """
    return phone.replace('-', '').replace(' ', '').strip()


def generate_medical_record_number() -> str:
    """
    Generate unique medical record number.
    Format: MR-YYYYMMDD-NNNN

    Returns:
        Medical record number string
    """
    from datetime import datetime
    from apps.emr.models import Patient

    today = datetime.now()
    date_str = today.strftime('%Y%m%d')

    # Find the last patient registered today
    prefix = f"MR-{date_str}-"
    last_patient = Patient.objects.filter(
        medical_record_number__startswith=prefix
    ).order_by('-medical_record_number').first()

    if last_patient and last_patient.medical_record_number:
        # Extract the sequence number and increment
        last_seq = int(last_patient.medical_record_number.split('-')[-1])
        new_seq = last_seq + 1
    else:
        new_seq = 1

    return f"{prefix}{new_seq:04d}"


def generate_patient_pid() -> str:
    """
    Generate unique patient ID.
    Format: PT-YYYYMMDD-NNNN

    Returns:
        Patient ID string
    """
    from datetime import datetime
    from apps.emr.models import Patient

    today = datetime.now()
    date_str = today.strftime('%Y%m%d')

    # Find the last patient registered today
    prefix = f"PT-{date_str}-"
    last_patient = Patient.objects.filter(
        pid__startswith=prefix
    ).order_by('-pid').first()

    if last_patient and last_patient.pid:
        # Extract the sequence number and increment
        last_seq = int(last_patient.pid.split('-')[-1])
        new_seq = last_seq + 1
    else:
        new_seq = 1

    return f"{prefix}{new_seq:04d}"
