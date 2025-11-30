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
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']

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
        ]

    def validate(self, attrs: Dict[str, Any]) -> Dict[str, Any]:
        """Validate password confirmation."""
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({
                'password_confirm': 'Passwords do not match.'
            })
        return attrs

    def create(self, validated_data: Dict[str, Any]) -> User:
        """Create user and associated profile."""
        # Extract profile fields
        role = validated_data.pop('role', 'PATIENT')
        phone_number = validated_data.pop('phone_number', '')
        validated_data.pop('password_confirm')

        # Create user
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', ''),
        )

        # Create user profile
        UserProfile.objects.create(
            user=user,
            role=role,
            phone_number=phone_number,
        )

        logger.info(f"New user registered: {user.username} with role {role}")
        return user


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
