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
    ChangePasswordSerializer,
    NursePatientRegistrationSerializer
)
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([AllowAny])
def ping(request):
    return Response({"message": "pong"})


@api_view(['POST'])
@permission_classes([AllowAny])
def sms_request_code(request):
    """
    Request SMS verification code.
    전화번호로 SMS 인증 코드 요청.

    Request body:
        - phone: 전화번호 (예: 010-1234-5678 또는 01012345678)

    Response:
        - message: 성공 메시지
        - expires_in: 코드 유효 시간 (초)
    """
    from apps.users.utils import normalize_phone_number, generate_sms_code, send_sms
    from django.core.cache import cache

    phone = request.data.get('phone')
    if not phone:
        return Response(
            {'error': '전화번호를 입력해주세요.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Normalize phone number
    normalized_phone = normalize_phone_number(phone)

    # Check if user exists with this phone number
    try:
        user = User.objects.get(username=normalized_phone)
    except User.DoesNotExist:
        return Response(
            {'error': '등록되지 않은 전화번호입니다.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Generate 6-digit code
    code = generate_sms_code(6)

    # Store code in cache (5 minutes expiration)
    cache_key = f"sms_code:{normalized_phone}"
    cache.set(cache_key, code, timeout=300)  # 5 minutes

    # Send SMS
    message = f"[NeuroNova] 인증 코드: {code}\n5분 이내에 입력해주세요."
    send_sms(normalized_phone, message)

    logger.info(f"SMS code sent to {normalized_phone}: {code}")

    return Response(
        {
            'message': 'SMS 인증 코드가 전송되었습니다.',
            'expires_in': 300
        },
        status=status.HTTP_200_OK
    )


@api_view(['POST'])
@permission_classes([AllowAny])
def sms_verify_and_login(request):
    """
    Verify SMS code and login.
    SMS 코드 검증 및 로그인.

    Request body:
        - phone: 전화번호
        - code: 6자리 인증 코드

    Response:
        - access: JWT access token
        - refresh: JWT refresh token
        - user: 사용자 정보
        - is_first_login: 첫 로그인 여부
    """
    from apps.users.utils import normalize_phone_number
    from django.core.cache import cache
    from rest_framework_simplejwt.tokens import RefreshToken

    phone = request.data.get('phone')
    code = request.data.get('code')

    if not phone or not code:
        return Response(
            {'error': '전화번호와 인증 코드를 모두 입력해주세요.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Normalize phone number
    normalized_phone = normalize_phone_number(phone)

    # Get code from cache
    cache_key = f"sms_code:{normalized_phone}"
    stored_code = cache.get(cache_key)

    if not stored_code:
        return Response(
            {'error': '인증 코드가 만료되었습니다. 다시 요청해주세요.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    if stored_code != code:
        return Response(
            {'error': '인증 코드가 일치하지 않습니다.'},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Get user
    try:
        user = User.objects.get(username=normalized_phone)
    except User.DoesNotExist:
        return Response(
            {'error': '등록되지 않은 전화번호입니다.'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Delete used code
    cache.delete(cache_key)

    # Check if user is active
    if not user.is_active:
        return Response(
            {'error': '비활성화된 계정입니다. 관리자에게 문의하세요.'},
            status=status.HTTP_403_FORBIDDEN
        )

    # Generate JWT tokens
    refresh = RefreshToken.for_user(user)

    # Get is_first_login flag
    is_first_login = False
    if hasattr(user, 'profile'):
        is_first_login = user.profile.is_first_login

    logger.info(f"User logged in via SMS: {user.username}")

    return Response(
        {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserSerializer(user).data,
            'is_first_login': is_first_login
        },
        status=status.HTTP_200_OK
    )

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

            # Update is_first_login flag
            if hasattr(request.user, 'profile'):
                request.user.profile.is_first_login = False
                request.user.profile.save()

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


class NursePatientViewSet(viewsets.ViewSet):
    """
    ViewSet for nurse-initiated patient registration.
    간호사가 내원 환자를 시스템에 등록.
    """
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        """Only NURSE and ADMIN can register patients."""
        from apps.users.permissions import IsNurseOrAdmin
        return [IsAuthenticated(), IsNurseOrAdmin()]

    @action(detail=False, methods=['post'])
    def register_patient(self, request):
        """
        간호사가 내원 환자를 등록하는 엔드포인트.

        Request body:
            - first_name: 이름
            - last_name: 성
            - ssn: 주민등록번호 (예: 123456-1234567)
            - phone: 전화번호 (예: 010-1234-5678)
            - address: 주소
            - doctor_id: 담당 의사 ID
            - date_of_birth: 생년월일
            - gender: 성별 (M/F/O)
            - email: 이메일 (선택)
            - emergency_contact: 비상 연락처 (선택)
            - insurance_id: 건강보험 번호 (선택)

        Response:
            - message: 성공 메시지
            - patient_id: 환자 ID
            - pid: 환자 고유 번호 (예: PT-20250101-0001)
            - medical_record_number: 진료기록번호 (예: MR-20250101-0001)
            - username: 로그인 ID (전화번호)
            - temp_password: 임시 비밀번호 (testpass123)
        """
        serializer = NursePatientRegistrationSerializer(data=request.data)

        if serializer.is_valid():
            result = serializer.save()

            # Send SMS notification (optional)
            from apps.users.utils import send_sms, normalize_phone_number
            phone = normalize_phone_number(request.data['phone'])
            message = (
                f"[NeuroNova] 환자 등록이 완료되었습니다.\n"
                f"병원 등록번호: {result['medical_record_number']}\n"
                f"로그인 ID: {phone}\n"
                f"임시 비밀번호: {result['temp_password']}\n"
                f"첫 로그인 시 비밀번호를 변경해주세요."
            )
            send_sms(phone, message)

            return Response(
                {
                    'message': '환자 등록이 완료되었습니다.',
                    'patient_id': result['patient'].id,
                    'pid': result['pid'],
                    'medical_record_number': result['medical_record_number'],
                    'username': result['user'].username,
                    'temp_password': result['temp_password']
                },
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


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
