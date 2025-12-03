"""
Custom app URL configuration
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "custom"

router = DefaultRouter()
router.register(r'doctors', views.DoctorViewSet, basename='doctor')
router.register(r'patient-doctors', views.PatientDoctorViewSet, basename='patient-doctor')
router.register(r'appointments', views.AppointmentViewSet, basename='appointment')
router.register(r'predictions', views.PatientPredictionResultViewSet, basename='prediction')
router.register(r'prescriptions', views.PrescriptionViewSet, basename='prescription')
router.register(r'antigen-results', views.AntigenAnalysisResultViewSet, basename='antigen-result')

urlpatterns = router.urls
