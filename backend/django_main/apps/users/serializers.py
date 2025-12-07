"""
Serializers for Users app.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from apps.users.models import UserProfile, Department
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


class DepartmentSerializer(serializers.ModelSerializer):
    """Department serializer."""
    class Meta:
        model = Department
        fields = ['id', 'name', 'location', 'phone_number', 'description']


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    """
    Custom JWT serializer to include user role and group information in token.
    This reduces the need for additional API calls to fetch user permissions.
    """

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        
        # Add role from UserProfile
        try:
            profile = user.profile
            token['role'] = profile.role
            token['phone_number'] = profile.phone_number
        except UserProfile.DoesNotExist:
            token['role'] = 'PATIENT'  # Default role
            token['phone_number'] = ''

        # Add groups
        token['groups'] = list(user.groups.values_list('name', flat=True))
        
        # Add permissions (optional, can make token large)
        # token['permissions'] = list(user.get_all_permissions())

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        
        # Add user information to response
        data['user'] = {
            'id': self.user.id,
            'username': self.user.username,
            'email': self.user.email,
            'role': getattr(self.user.profile, 'role', 'PATIENT') if hasattr(self.user, 'profile') else 'PATIENT',
            'groups': list(self.user.groups.values_list('name', flat=True)),
        }
        
        return data

class UserProfileSerializer(serializers.ModelSerializer):
    """User profile serializer."""
    username = serializers.CharField(source='user.username', read_only=True)
    email = serializers.EmailField(source='user.email', read_only=True)
    first_name = serializers.CharField(source='user.first_name', read_only=True)
    last_name = serializers.CharField(source='user.last_name', read_only=True)
    full_name = serializers.CharField(source='user.get_full_name', read_only=True)
    department = DepartmentSerializer(read_only=True)

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at', 'role']

    def update(self, instance, validated_data):
        """
        Update user profile.
        Handles:
        1. Local phone number updates -> syncs to username.
        2. Foreigner passport number updates -> syncs to username.
        3. Updates Patient model if exists.
        4. Sends notifications.
        """
        user = instance.user
        old_phone = instance.phone_number
        new_phone = validated_data.get('phone_number', old_phone)
        
        old_passport = instance.passport_number
        new_passport = validated_data.get('passport_number', old_passport)
        
        is_foreigner = validated_data.get('is_foreigner', instance.is_foreigner)
        
        username_changed = False
        new_username = None

        # 1. Determine new username based on Foreigner status
        if is_foreigner:
            # Foreigner: ID = Passport Number
            if new_passport and new_passport != user.username:
                # Check for duplicates
                if User.objects.filter(username=new_passport).exclude(id=user.id).exists():
                    raise serializers.ValidationError({"passport_number": "이미 사용 중인 여권번호입니다."})
                new_username = new_passport
                username_changed = True
        else:
            # Local: ID = Phone Number
            if new_phone:
                from apps.users.utils import normalize_phone_number
                normalized_phone = normalize_phone_number(new_phone)
                
                # Verify format if needed, simplistic check for now
                if not normalized_phone.isdigit():
                     raise serializers.ValidationError({"phone_number": "전화번호 형식이 올바르지 않습니다."})

                if normalized_phone != user.username:
                    # Check for duplicates
                    if User.objects.filter(username=normalized_phone).exclude(id=user.id).exists():
                        raise serializers.ValidationError({"phone_number": "이미 사용 중인 전화번호입니다."})
                    new_username = normalized_phone
                    username_changed = True
                    # Update validated data to normalized form
                    validated_data['phone_number'] = normalized_phone

        # 2. Update UserProfile
        instance = super().update(instance, validated_data)

        # 3. Update User.username if changed
        if username_changed and new_username:
            user.username = new_username
            user.save()
            logger.info(f"User {user.id} username updated to {new_username}")
            
            # Send Notifications
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                subject = "[NeuroNova] 회원 정보 변경 알림"
                message = f"회원님의 정보가 변경되었습니다.\n새로운 로그인 ID: {new_username}\n변경된 정보로 로그인해주시기 바랍니다."
                
                if user.email:
                    send_mail(subject, message, settings.DEFAULT_FROM_EMAIL, [user.email], fail_silently=True)
                
                # Send SMS if phone exists (mock)
                if instance.phone_number:
                     from apps.users.utils import send_sms
                     send_sms(instance.phone_number, f"[NeuroNova] ID 변경: {new_username}. 재로그인 필요.")
                     
            except Exception as e:
                logger.error(f"Failed to send notification: {e}")

        # 4. Sync with Patient model
        if instance.role == 'PATIENT' and hasattr(user, 'patient'):
            patient = user.patient
            if is_foreigner:
                patient.passport_number = instance.passport_number
                patient.phone = instance.phone_number # Optional
            else:
                 patient.phone = instance.phone_number
                 patient.passport_number = None
            
            patient.email = user.email
            patient.save()

        return instance





class UserSerializer(serializers.ModelSerializer):
    """User serializer with profile."""
    profile = UserProfileSerializer(read_only=True)
    role = serializers.CharField(source='profile.role', read_only=True)
    groups = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'is_active', 'date_joined', 'profile', 'role', 'groups']
        read_only_fields = ['id', 'date_joined']

    def get_groups(self, obj):
        """Get user groups."""
        return list(obj.groups.values_list('name', flat=True))


class UserRegistrationSerializer(serializers.ModelSerializer):
    """
    Serializer for user registration.
    Creates both User and UserProfile instances.
    """
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password_confirm = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    role = serializers.ChoiceField(
        choices=[
            ('ADMIN', 'Administrator'),
            ('DOCTOR', 'Doctor'),
            ('NURSE', 'Nurse'),
            ('PATIENT', 'Patient'),
        ],
        default='PATIENT',
        write_only=True
    )
    phone_number = serializers.CharField(
        required=False,
        allow_blank=True,
        write_only=True
    )
    ssn = serializers.CharField(
        write_only=True,
        required=False,
        help_text="주민등록번호 (환자 가입 시 필수)"
    )

    class Meta:
        model = User
        fields = [
            'username',
            'email',
            'password',
            'password_confirm',
            'first_name',
            'last_name',
            'role',
            'phone_number',
            'ssn',
        ]

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        
        # Validate SSN for Patient role
        if attrs.get('role', 'PATIENT') == 'PATIENT' and not attrs.get('ssn'):
            raise serializers.ValidationError({
                'ssn': '환자 가입 시 주민등록번호는 필수입니다.'
            })
            
        return attrs

    def create(self, validated_data: Dict[str, Any]) -> User:
        """Create user and associated profile."""
        # Extract profile fields
        role = validated_data.pop('role', 'PATIENT')
        phone_number = validated_data.pop('phone_number', '')
        validated_data.pop('password_confirm')

        # Check privileged signup settings
        from django.conf import settings
        from config.constants import ApprovalStatus, UserRole

        is_privileged = role in UserRole.PRIVILEGED_ROLES
        allow_privileged = getattr(settings, 'ALLOW_PRIVILEGED_SIGNUP', False)
        require_approval = getattr(settings, 'REQUIRE_PRIVILEGED_APPROVAL', False)

        # Determine active status and approval status
        is_active = True
        approval_status = ApprovalStatus.APPROVED

        if is_privileged:
            if allow_privileged:
                # Allow signup - check if approval is required
                if require_approval:
                    is_active = False
                    approval_status = ApprovalStatus.PENDING
                else:
                    # Allow signup and activate immediately
                    is_active = True
                    approval_status = ApprovalStatus.APPROVED
            else:
                # Should be handled in view, but safety check here
                pass

        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )
        
        # Set active status
        user.is_active = is_active
        user.save()

        # Create user profile
        UserProfile.objects.create(
            user=user,
            role=role,
            phone_number=phone_number,
            approval_status=approval_status
        )

        # Create Patient record if role is PATIENT
        if role == 'PATIENT':
            from apps.emr.models import Patient
            from config.constants import Gender
            from apps.users.utils import normalize_phone_number, decrypt_ssn
            import datetime

            # Check for existing patient by phone
            normalized_phone = normalize_phone_number(phone_number)
            existing_patient = Patient.objects.filter(phone=normalized_phone).first()
            
            linked = False
            if existing_patient:
                # Verify SSN
                input_ssn = validated_data.get('ssn')
                if existing_patient.ssn_encrypted:
                    try:
                        decrypted_ssn = decrypt_ssn(existing_patient.ssn_encrypted)
                        if decrypted_ssn == input_ssn:
                            # Match found! Link account
                            
                            # Check if patient already has a user
                            if existing_patient.user:
                                # If it's a placeholder account (username == phone), delete it
                                if existing_patient.user.username == normalized_phone:
                                    old_user = existing_patient.user
                                    existing_patient.user = None
                                    existing_patient.save()
                                    old_user.delete()
                                    logger.info(f"Deleted placeholder user {old_user.username} for patient {existing_patient.pid}")
                                else:
                                    # Already has a real account
                                    raise serializers.ValidationError(
                                        "이미 등록된 계정이 있습니다. 아이디 찾기를 이용해주세요."
                                    )
                            
                            # Link new user
                            existing_patient.user = user
                            existing_patient.save()
                            linked = True
                            logger.info(f"Linked user {user.username} to existing patient {existing_patient.pid}")
                            
                    except Exception as e:
                        logger.error(f"SSN verification failed: {e}")
                        # Fall through to create new patient if verification fails? 
                        # Or raise error? For security, maybe better to raise error if phone matches but SSN fails?
                        # But for now, let's treat as mismatch -> new patient (or error)
                        pass

            if not linked:
                # Generate unique PID
                pid = f"PT-{datetime.datetime.now().strftime('%Y%m%d')}-{user.id:04d}"

                # Set default date of birth (2000-01-01) and gender (Other)
                # User can update this later via their profile
                Patient.objects.create(
                    user=user,
                    pid=pid,
                    first_name=validated_data.get('first_name', ''),
                    last_name=validated_data.get('last_name', ''),
                    phone=phone_number,
                    email=validated_data['email'],
                    date_of_birth=datetime.date(2000, 1, 1),  # Default DOB, can be updated later
                    gender=Gender.OTHER,  # Default gender, can be updated later
                    address='',  # Can be updated later via profile
                )
                logger.info(f"Patient record created for user: {user.username} with PID: {pid}")

        logger.info(f"New user registered: {user.username} with role {role}. Active: {is_active}, Status: {approval_status}")
        return user


class NursePatientRegistrationSerializer(serializers.Serializer):
    """
    Serializer for nurse-initiated patient registration.
    간호사가 내원 환자를 시스템에 등록할 때 사용.
    """
    first_name = serializers.CharField(max_length=100, required=True)
    last_name = serializers.CharField(max_length=100, required=True)
    ssn = serializers.CharField(
        max_length=14,
        required=True,
        help_text="주민등록번호 (예: 123456-1234567)"
    )
    phone = serializers.CharField(
        max_length=20,
        required=True,
        help_text="전화번호 (예: 010-1234-5678)"
    )
    address = serializers.CharField(required=False, allow_blank=True)
    doctor_id = serializers.IntegerField(
        required=True,
        help_text="담당 의사 ID"
    )
    date_of_birth = serializers.DateField(required=True)
    gender = serializers.ChoiceField(
        choices=[('M', 'Male'), ('F', 'Female'), ('O', 'Other')],
        required=True
    )
    email = serializers.EmailField(required=False, allow_blank=True)
    emergency_contact = serializers.CharField(
        max_length=20,
        required=False,
        allow_blank=True
    )
    insurance_id = serializers.CharField(
        max_length=50,
        required=False,
        allow_blank=True
    )

    def validate_phone(self, value: str) -> str:
        """Validate phone number format."""
        from apps.users.utils import normalize_phone_number

        normalized = normalize_phone_number(value)

        # Check if phone already exists
        if User.objects.filter(username=normalized).exists():
            raise serializers.ValidationError(
                "이 전화번호로 이미 등록된 환자가 있습니다."
            )

        return value

    def validate_doctor_id(self, value: int) -> int:
        """Validate that doctor exists and has DOCTOR role."""
        try:
            doctor = User.objects.get(id=value)
            if not hasattr(doctor, 'profile') or doctor.profile.role != 'DOCTOR':
                raise serializers.ValidationError("선택한 사용자는 의사가 아닙니다.")
        except User.DoesNotExist:
            raise serializers.ValidationError("존재하지 않는 의사 ID입니다.")

        return value

    def create(self, validated_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create User and Patient records.

        Returns:
            Dict with user, patient, and temporary password
        """
        from apps.users.utils import (
            normalize_phone_number,
            encrypt_ssn,
            generate_medical_record_number,
            generate_patient_pid
        )
        from apps.emr.models import Patient

        # Extract data
        phone = validated_data['phone']
        normalized_phone = normalize_phone_number(phone)
        ssn = validated_data['ssn']
        doctor_id = validated_data['doctor_id']

        # Generate credentials
        username = normalized_phone  # Use phone as username
        temp_password = 'testpass123'  # Default password
        medical_record_number = generate_medical_record_number()
        pid = generate_patient_pid()

        # Create User
        user = User.objects.create_user(
            username=username,
            password=temp_password,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            email=validated_data.get('email', ''),
            is_active=True
        )

        # Create UserProfile for PATIENT role
        UserProfile.objects.create(
            user=user,
            role='PATIENT',
            phone_number=phone,
            is_first_login=True  # Force password change on first login
        )

        # Encrypt SSN
        encrypted_ssn = encrypt_ssn(ssn)

        # Create Patient
        patient = Patient.objects.create(
            user=user,
            pid=pid,
            medical_record_number=medical_record_number,
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
            date_of_birth=validated_data['date_of_birth'],
            gender=validated_data['gender'],
            phone=phone,
            email=validated_data.get('email', ''),
            address=validated_data.get('address', ''),
            emergency_contact=validated_data.get('emergency_contact', ''),
            insurance_id=validated_data.get('insurance_id', ''),
            ssn_encrypted=encrypted_ssn,
            doctor_id=doctor_id
        )

        logger.info(
            f"Nurse registered patient: {patient.full_name} (PID: {pid}, "
            f"MRN: {medical_record_number}) with doctor ID: {doctor_id}"
        )

        return {
            'user': user,
            'patient': patient,
            'temp_password': temp_password,
            'medical_record_number': medical_record_number,
            'pid': pid
        }


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change endpoint."""
    old_password = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        required=True,
        write_only=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password_confirm = serializers.CharField(
        required=True,
        write_only=True,
        style={'input_type': 'password'}
    )

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """Validate new password confirmation."""
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError({
                'new_password_confirm': 'New passwords do not match.'
            })
        return attrs

    def validate_old_password(self, value: str) -> str:
        """Verify old password is correct."""
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value
