# Django 설계 가이드 및 Best Practices

**버전**: 1.0
**최종 업데이트**: 2025-12-06
**프로젝트**: NeuroNova CDSS

---

## 📋 목차

1. [Django 아키텍처 철학](#django-아키텍처-철학)
2. [프로젝트 구조](#프로젝트-구조)
3. [Models 설계 원칙](#models-설계-원칙)
4. [Views 및 ViewSets](#views-및-viewsets)
5. [Serializers 최적화](#serializers-최적화)
6. [인증 및 권한](#인증-및-권한)
7. [성능 최적화](#성능-최적화)
8. [보안 Best Practices](#보안-best-practices)
9. [테스트 전략](#테스트-전략)
10. [에러 처리](#에러-처리)

---

## Django 아키텍처 철학

### MTV (Model-Template-View) 패턴

Django는 MTV 패턴을 따르지만, REST API에서는 다음과 같이 변형됩니다:

```
Model (M) → 데이터베이스 구조
Serializer → 데이터 직렬화/역직렬화
ViewSet (V) → 비즈니스 로직 및 API 엔드포인트
```

### DRY 원칙 (Don't Repeat Yourself)

```python
# ✅ Good: 재사용 가능한 BaseModel
class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True

# 모든 모델이 상속
class Patient(BaseModel):
    name = models.CharField(max_length=100)
    # created_at, updated_at 자동 포함
```

---

## 프로젝트 구조

### Django App 구조

```
backend/django_main/
├── apps/                           # Django Apps (기능별 분리)
│   ├── users/                     # 사용자 관리
│   │   ├── models.py              # User, UserProfile, Department
│   │   ├── views.py               # UserViewSet
│   │   ├── serializers.py         # UserSerializer
│   │   ├── permissions.py         # IsAdmin, IsDoctor
│   │   ├── urls.py               # URL 라우팅
│   │   └── tests/                # 테스트
│   ├── emr/                      # 전자의무기록
│   ├── custom/                   # 예약, 진단
│   ├── notifications/            # 알림
│   └── ml_proxy/                 # AI 프록시
├── config/                        # 전역 설정
│   ├── constants.py              # 상수 정의
│   └── settings.py               # Django 설정
└── neuronova/                    # 프로젝트 설정
    ├── settings.py
    ├── urls.py
    └── wsgi.py
```

### App 분리 원칙

#### ✅ Good: 기능별 명확한 분리
```
users/       - 사용자 인증, 프로필
emr/         - 환자, 내원, SOAP
custom/      - 예약, 진단, 처방
notifications/ - 푸시 알림
```

#### ❌ Bad: 모든 기능을 하나의 App에
```
main/        - 모든 모델과 뷰가 혼재
```

---

## Models 설계 원칙

### 1. 모델 설계

#### 1.1 BaseModel 활용

```python
from django.db import models

class BaseModel(models.Model):
    """모든 모델의 기본 클래스"""
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="생성일시")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="수정일시")

    class Meta:
        abstract = True
        ordering = ['-created_at']  # 기본 정렬
```

#### 1.2 필드 정의 Best Practices

```python
class UserProfile(BaseModel):
    """사용자 프로필 모델"""

    # ✅ Good: verbose_name, help_text 명시
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name="사용자",
        help_text="Django User 모델과 1:1 관계"
    )

    role = models.CharField(
        max_length=20,
        choices=UserRole.CHOICES,
        default=UserRole.PATIENT,
        verbose_name="역할",
        help_text="시스템 내 사용자 역할 (RBAC)",
        db_index=True  # 자주 필터링되는 필드는 인덱스 추가
    )

    # ✅ Good: null=True와 blank=True 구분
    department = models.ForeignKey(
        Department,
        on_delete=models.SET_NULL,
        null=True,  # DB 레벨: NULL 허용
        blank=True,  # 폼 레벨: 빈 값 허용
        related_name='members'
    )

    class Meta:
        db_table = 'user_profile'
        verbose_name = '사용자 프로필'
        verbose_name_plural = '사용자 프로필 목록'
        indexes = [
            models.Index(fields=['role', 'created_at']),  # 복합 인덱스
        ]
```

#### 1.3 관계 설정

```python
# ✅ Good: related_name 명시
class Appointment(BaseModel):
    patient = models.ForeignKey(
        'emr.Patient',
        on_delete=models.CASCADE,
        related_name='appointments'  # patient.appointments.all()로 역참조
    )

    doctor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='doctor_appointments'  # 명확한 related_name
    )

# ❌ Bad: related_name 누락
class Appointment(BaseModel):
    patient = models.ForeignKey('emr.Patient', on_delete=models.CASCADE)
    # appointment_set으로 역참조 - 의미 불명확
```

### 2. 모델 메서드

```python
class UserProfile(BaseModel):
    # ✅ Good: 비즈니스 로직을 모델 메서드로
    def is_admin(self) -> bool:
        """관리자 여부 확인"""
        return self.role == UserRole.ADMIN

    def is_medical_staff(self) -> bool:
        """의료진 여부 확인"""
        return self.role in [UserRole.DOCTOR, UserRole.NURSE]

    def can_approve_appointments(self) -> bool:
        """예약 승인 권한 확인"""
        return self.role in [UserRole.ADMIN, UserRole.DOCTOR]

    def __str__(self) -> str:
        """Admin 및 로그에서 표시될 문자열"""
        return f"{self.user.username} ({self.get_role_display()})"
```

### 3. Managers와 QuerySets

```python
# ✅ Good: 커스텀 Manager로 재사용 가능한 쿼리
class AppointmentQuerySet(models.QuerySet):
    def pending(self):
        """승인 대기 중인 예약"""
        return self.filter(status='PENDING')

    def for_doctor(self, doctor):
        """특정 의사의 예약"""
        return self.filter(doctor=doctor)

    def today(self):
        """오늘의 예약"""
        from django.utils import timezone
        today = timezone.now().date()
        return self.filter(scheduled_at__date=today)

class AppointmentManager(models.Manager):
    def get_queryset(self):
        return AppointmentQuerySet(self.model, using=self._db)

    def pending(self):
        return self.get_queryset().pending()

    def for_doctor(self, doctor):
        return self.get_queryset().for_doctor(doctor)

class Appointment(BaseModel):
    objects = AppointmentManager()

    # 사용:
    # Appointment.objects.pending()
    # Appointment.objects.for_doctor(doctor).today()
```

---

## Views 및 ViewSets

### 1. ViewSet 구조

```python
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

class UserViewSet(viewsets.ModelViewSet):
    """사용자 관리 ViewSet"""

    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    # ✅ Good: 검색 및 필터링 설정
    search_fields = ['username', 'email', 'first_name', 'last_name']
    filterset_fields = ['is_active', 'is_staff']
    ordering_fields = ['username', 'created_at']

    def get_queryset(self):
        """권한에 따른 쿼리셋 필터링"""
        user = self.request.user

        # ✅ Good: select_related로 N+1 문제 방지
        queryset = User.objects.select_related('profile')

        if hasattr(user, 'profile') and user.profile.is_admin():
            return queryset  # 관리자는 모든 사용자 조회

        return queryset.filter(id=user.id)  # 일반 사용자는 자신만

    def get_permissions(self):
        """액션별 권한 설정"""
        from apps.users.permissions import IsAdmin

        if self.action in ['me']:
            return [IsAuthenticated()]
        elif self.action in ['list', 'retrieve', 'update', 'destroy']:
            return [IsAuthenticated(), IsAdmin()]

        return super().get_permissions()

    def get_serializer_class(self):
        """액션별 Serializer 분리"""
        if self.action == 'create':
            return UserRegistrationSerializer
        elif self.action == 'change_password':
            return ChangePasswordSerializer
        return UserSerializer

    @action(detail=False, methods=['get'])
    def me(self, request):
        """현재 로그인한 사용자 정보"""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def activate(self, request, pk=None):
        """사용자 활성화"""
        user = self.get_object()
        user.is_active = True
        user.save()
        return Response({'status': 'user activated'})
```

### 2. 에러 처리

```python
from rest_framework import status
from rest_framework.response import Response
from django.core.exceptions import ValidationError

class AppointmentViewSet(viewsets.ModelViewSet):

    def create(self, request, *args, **kwargs):
        """예약 생성"""
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            # ✅ Good: 비즈니스 로직 검증
            self._validate_appointment_time(serializer.validated_data)

            self.perform_create(serializer)
            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        except ValidationError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            logger.error(f'Failed to create appointment: {e}', exc_info=True)
            return Response(
                {'error': '예약 생성 중 오류가 발생했습니다.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def _validate_appointment_time(self, data):
        """예약 시간 검증 (비즈니스 로직)"""
        from django.utils import timezone

        scheduled_at = data.get('scheduled_at')
        if scheduled_at < timezone.now():
            raise ValidationError('과거 시간으로 예약할 수 없습니다.')

        # 중복 예약 확인
        doctor = data.get('doctor')
        existing = Appointment.objects.filter(
            doctor=doctor,
            scheduled_at=scheduled_at,
            status__in=['PENDING', 'CONFIRMED']
        ).exists()

        if existing:
            raise ValidationError('해당 시간에 이미 예약이 있습니다.')
```

---

## Serializers 최적화

### 1. 기본 Serializer

```python
class UserSerializer(serializers.ModelSerializer):
    """사용자 Serializer"""

    # ✅ Good: 읽기 전용 필드 명시
    profile = UserProfileSerializer(read_only=True)
    role = serializers.CharField(source='profile.role', read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_active', 'profile', 'role']
        read_only_fields = ['id', 'is_active']

        # ✅ Good: password는 write_only
        extra_kwargs = {
            'password': {'write_only': True}
        }
```

### 2. 중첩 Serializer 최적화

```python
# ❌ Bad: N+1 문제 발생
class AppointmentSerializer(serializers.ModelSerializer):
    patient = PatientSerializer()  # 각 Appointment마다 Patient 조회
    doctor = UserSerializer()      # 각 Appointment마다 User 조회

    class Meta:
        model = Appointment
        fields = '__all__'

# ✅ Good: select_related 사용
class AppointmentViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        return Appointment.objects.select_related(
            'patient',
            'doctor',
            'doctor__profile'
        ).prefetch_related(
            'patient__medical_records'  # Many-to-Many는 prefetch_related
        )
```

### 3. SerializerMethodField 최적화

```python
class PatientSerializer(serializers.ModelSerializer):
    # ❌ Bad: 매번 DB 쿼리
    appointment_count = serializers.SerializerMethodField()

    def get_appointment_count(self, obj):
        return obj.appointments.count()  # N+1 문제!

# ✅ Good: annotate로 미리 계산
class PatientViewSet(viewsets.ModelViewSet):
    def get_queryset(self):
        from django.db.models import Count
        return Patient.objects.annotate(
            appointment_count=Count('appointments')
        )

class PatientSerializer(serializers.ModelSerializer):
    appointment_count = serializers.IntegerField(read_only=True)
```

---

## 인증 및 권한

### 1. JWT 인증

```python
# settings.py
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
}

# ✅ Good: 커스텀 JWT Claims
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # 사용자 정보 추가
        token['username'] = user.username
        token['role'] = user.profile.role if hasattr(user, 'profile') else None
        token['is_staff'] = user.is_staff

        return token
```

### 2. 커스텀 권한 클래스

```python
from rest_framework.permissions import BasePermission

class IsAdmin(BasePermission):
    """관리자 권한"""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'profile') and
            request.user.profile.is_admin()
        )

class IsDoctor(BasePermission):
    """의사 권한"""

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            hasattr(request.user, 'profile') and
            request.user.profile.role == UserRole.DOCTOR
        )

class IsOwnerOrReadOnly(BasePermission):
    """소유자만 수정 가능"""

    def has_object_permission(self, request, view, obj):
        from rest_framework import permissions

        # GET, HEAD, OPTIONS는 모두 허용
        if request.method in permissions.SAFE_METHODS:
            return True

        # 소유자만 수정 가능
        return obj.user == request.user
```

---

## 성능 최적화

### 1. 쿼리 최적화

```python
# ✅ Good: select_related (1:1, ForeignKey)
User.objects.select_related('profile').all()

# ✅ Good: prefetch_related (Many-to-Many, reverse ForeignKey)
Patient.objects.prefetch_related('appointments').all()

# ✅ Good: 복합 쿼리
Appointment.objects.select_related(
    'patient',
    'doctor__profile'
).prefetch_related(
    'patient__medical_records'
).all()

# ✅ Good: only() - 필요한 필드만 조회
User.objects.only('id', 'username', 'email')

# ✅ Good: defer() - 특정 필드 제외
Patient.objects.defer('notes', 'medical_history')  # 큰 텍스트 필드 제외
```

### 2. 페이지네이션

```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20
}

# ✅ Good: 커스텀 페이지네이션
from rest_framework.pagination import PageNumberPagination

class CustomPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'count': self.page.paginator.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'total_pages': self.page.paginator.num_pages,
            'results': data
        })
```

### 3. 캐싱

```python
from django.core.cache import cache
from django.views.decorators.cache import cache_page
from django.utils.decorators import method_decorator

class DepartmentViewSet(viewsets.ReadOnlyModelViewSet):
    """진료과 목록 (자주 변경되지 않음)"""

    @method_decorator(cache_page(60 * 15))  # 15분 캐싱
    def list(self, request, *args, **kwargs):
        return super().list(request, *args, **kwargs)

# ✅ Good: Low-level 캐싱
def get_user_profile(user_id):
    cache_key = f'user_profile_{user_id}'
    profile = cache.get(cache_key)

    if profile is None:
        profile = UserProfile.objects.select_related('user').get(user_id=user_id)
        cache.set(cache_key, profile, timeout=300)  # 5분

    return profile
```

---

## 보안 Best Practices

### 1. 환경 변수 사용

```python
# ❌ Bad: 하드코딩된 비밀키
SECRET_KEY = 'django-insecure-xyz123'
DEBUG = True

# ✅ Good: 환경 변수 사용
import os
from pathlib import Path

SECRET_KEY = os.environ.get('DJANGO_SECRET_KEY')
DEBUG = os.environ.get('DEBUG', 'False') == 'True'
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', 'localhost').split(',')

DATABASE_PASSWORD = os.environ.get('DB_PASSWORD')
```

### 2. CORS 설정

```python
# settings.py
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",  # React 개발 서버
    "https://neuronova.example.com",  # 프로덕션
]

# ❌ Bad: 모든 출처 허용
CORS_ALLOW_ALL_ORIGINS = True  # 절대 사용 금지!
```

### 3. SQL Injection 방지

```python
# ✅ Good: ORM 사용
User.objects.filter(username=username)

# ✅ Good: 파라미터화된 쿼리
from django.db import connection
cursor = connection.cursor()
cursor.execute("SELECT * FROM users WHERE username = %s", [username])

# ❌ Bad: 직접 문자열 조합
cursor.execute(f"SELECT * FROM users WHERE username = '{username}'")  # SQL Injection 위험!
```

### 4. XSS 방지

```python
# Django 템플릿은 자동 이스케이프
# {{ user.name }}  → 자동으로 HTML 이스케이프

# Serializer에서도 검증
from django.utils.html import escape

class CommentSerializer(serializers.ModelSerializer):
    def validate_content(self, value):
        # XSS 방지
        return escape(value)
```

---

## 테스트 전략

### 1. Model 테스트

```python
from django.test import TestCase
from apps.users.models import UserProfile, Department

class UserProfileTestCase(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123'
        )
        self.department = Department.objects.create(
            name='Neurology',
            location='Building A, 3F',
            phone_number='02-1234-5678'
        )

    def test_is_admin(self):
        """관리자 권한 확인"""
        profile = UserProfile.objects.create(
            user=self.user,
            role='ADMIN',
            department=self.department
        )
        self.assertTrue(profile.is_admin())

    def test_is_medical_staff(self):
        """의료진 여부 확인"""
        profile = UserProfile.objects.create(
            user=self.user,
            role='DOCTOR'
        )
        self.assertTrue(profile.is_medical_staff())
```

### 2. API 테스트

```python
from rest_framework.test import APITestCase
from rest_framework import status

class AppointmentAPITestCase(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username='admin',
            password='admin123'
        )
        UserProfile.objects.create(user=self.admin_user, role='ADMIN')

        self.client.force_authenticate(user=self.admin_user)

    def test_create_appointment(self):
        """예약 생성 테스트"""
        data = {
            'patient_id': 1,
            'doctor_id': 2,
            'scheduled_at': '2025-12-10T10:00:00Z',
            'visit_type': 'CONSULTATION'
        }

        response = self.client.post('/api/v1/appointments/', data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['visit_type'], 'CONSULTATION')
```

---

## 에러 처리

### 1. 커스텀 Exception Handler

```python
# config/exception_handlers.py
from rest_framework.views import exception_handler
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """커스텀 예외 처리"""
    response = exception_handler(exc, context)

    if response is not None:
        # 표준화된 에러 응답
        response.data = {
            'error': {
                'code': response.status_code,
                'message': str(exc),
                'details': response.data
            }
        }
    else:
        # 처리되지 않은 예외 로깅
        logger.error(f'Unhandled exception: {exc}', exc_info=True)
        response = Response(
            {
                'error': {
                    'code': 500,
                    'message': '서버 오류가 발생했습니다.'
                }
            },
            status=500
        )

    return response

# settings.py
REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'config.exception_handlers.custom_exception_handler'
}
```

---

## 참고 자료

- [Django 공식 문서](https://docs.djangoproject.com/)
- [Django REST Framework](https://www.django-rest-framework.org/)
- [Django Best Practices](https://django-best-practices.readthedocs.io/)
- [Two Scoops of Django](https://www.feldroy.com/books/two-scoops-of-django-3-x)

---

**작성자**: Claude Code
**버전**: 1.0
**최종 업데이트**: 2025-12-06
