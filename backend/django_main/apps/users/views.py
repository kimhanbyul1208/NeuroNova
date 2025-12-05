"""
ViewSets for Users app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from apps.users.models import UserProfile
from apps.users.serializers import (
    UserSerializer,
    UserProfileSerializer,
    UserRegistrationSerializer,
    ChangePasswordSerializer
)
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def ping(request):
    return Response({"message": "pong"})

class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User management."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    search_fields = ['username', 'email', 'first_name', 'last_name']
    filterset_fields = ['is_active', 'is_staff']

    def get_queryset(self):
        """Filter users based on permissions."""
        user = self.request.user
        # Admin can see all users
        if hasattr(user, 'profile') and user.profile.is_admin():
            return User.objects.all().select_related('profile')
        # Non-admin users can only see themselves
        return User.objects.filter(id=user.id)

    def get_permissions(self):
        """Set permissions based on action."""
        from apps.users.permissions import IsAdmin

        if self.action in ['me']:
            # Any authenticated user can access 'me' endpoint
            return [IsAuthenticated()]
        elif self.action in ['list', 'retrieve']:
            # Only admin can list/retrieve users
            return [IsAuthenticated(), IsAdmin()]
        elif self.action in ['update', 'partial_update', 'destroy', 'activate', 'deactivate']:
            # Only admin can modify users
            return [IsAuthenticated(), IsAdmin()]
        return super().get_permissions()

    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        """
        Register a new user.
        Public endpoint - no authentication required.
        """
        from django.conf import settings
        from django.template.loader import render_to_string
        from config.constants import UserRole
        
        # Check if privileged signup is allowed for privileged roles
        role = request.data.get('role', 'PATIENT')
        
        # Define pending message data
        pending_message_data = {
            "status": "pending_approval",
            "message": "admin 관리자의 허가가 있어야합니다. 허가를 기다리는 중입니다. 보통 6시간 정도 소요됩니다.",
            "contact": "담당자 전화 번호 : 010-1234-5678"
        }

        def get_pending_response(status_code):
            """Helper to return JSON or HTML response based on Accept header."""
            if 'text/html' in request.META.get('HTTP_ACCEPT', ''):
                html_content = render_to_string('signup_pending.html', pending_message_data)
                return Response(html_content, status=status_code, content_type='text/html')
            return Response(pending_message_data, status=status_code)

        # 1. Check if privileged signup is completely disabled
        if role in UserRole.PRIVILEGED_ROLES and not getattr(settings, 'ALLOW_PRIVILEGED_SIGNUP', False):
            return get_pending_response(status.HTTP_200_OK)

        # 2. Proceed with registration
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            user_data = UserSerializer(user).data
            
            # 3. Check if user was created but is pending approval (ALLOW_PRIVILEGED_SIGNUP = True case)
            if not user.is_active:
                return get_pending_response(status.HTTP_202_ACCEPTED)

            return Response(
                {
                    'message': 'User registered successfully',
                    'user': user_data
                },
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user information."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password."""
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        if serializer.is_valid():
            # Update password
            request.user.set_password(serializer.validated_data['new_password'])
            request.user.save()
            logger.info(f"Password changed for user: {request.user.username}")
            return Response(
                {'message': 'Password changed successfully'},
                status=status.HTTP_200_OK
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """Activate a user account (Admin only)."""
        user = self.get_object()
        user.is_active = True
        user.save()

        # Update approval status if profile exists
        if hasattr(user, 'profile'):
            from config.constants import ApprovalStatus
            user.profile.approval_status = ApprovalStatus.APPROVED
            user.profile.save()

        logger.info(f"User activated: {user.username} by admin: {request.user.username}")
        return Response(
            {'message': f'User {user.username} has been activated'},
            status=status.HTTP_200_OK
        )

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        """Deactivate a user account (Admin only)."""
        user = self.get_object()

        # Prevent deactivating self
        if user.id == request.user.id:
            return Response(
                {'error': 'Cannot deactivate your own account'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user.is_active = False
        user.save()

        # Update approval status if profile exists
        if hasattr(user, 'profile'):
            from config.constants import ApprovalStatus
            user.profile.approval_status = ApprovalStatus.REJECTED
            user.profile.save()

        logger.info(f"User deactivated: {user.username} by admin: {request.user.username}")
        return Response(
            {'message': f'User {user.username} has been deactivated'},
            status=status.HTTP_200_OK
        )


class UserProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for UserProfile management."""
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['role']
    search_fields = ['user__username', 'phone_number']

    def get_queryset(self):
        """Filter profiles based on user role."""
        user = self.request.user
        if hasattr(user, 'profile') and user.profile.is_admin():
            # Admin can see all profiles
            return UserProfile.objects.all()
        elif hasattr(user, 'profile') and user.profile.is_doctor():
            # Doctor can see all profiles
            return UserProfile.objects.all()
        else:
            # Others can only see their own profile
            return UserProfile.objects.filter(user=user)

    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def me(self, request):
        """Get current user's profile."""
        try:
            profile = request.user.profile
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except UserProfile.DoesNotExist:
            return Response(
                {'error': 'Profile not found for this user'},
                status=status.HTTP_404_NOT_FOUND
            )
