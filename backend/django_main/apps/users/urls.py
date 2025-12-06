"""
URL configuration for Users app.
"""
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from apps.users import views
from apps.users.serializers import CustomTokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView

router = DefaultRouter()
router.register(r'', views.UserViewSet, basename='user')
router.register(r'profiles', views.UserProfileViewSet, basename='userprofile')
router.register(r'nurse', views.NursePatientViewSet, basename='nurse')

from rest_framework.permissions import AllowAny

# Custom JWT view using our custom serializer
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

urlpatterns = [
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('ping/', views.ping, name='ping'),
    path('sms/request/', views.sms_request_code, name='sms_request_code'),
    path('sms/verify/', views.sms_verify_and_login, name='sms_verify_and_login'),
    path('', include(router.urls)),
]
