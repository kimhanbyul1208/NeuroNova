"""
Serializers for Users app.
"""
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User
from apps.users.models import UserProfile
from typing import Dict, Any
import logging

logger = logging.getLogger(__name__)


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

    class Meta:
        model = UserProfile
        fields = '__all__'
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


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
