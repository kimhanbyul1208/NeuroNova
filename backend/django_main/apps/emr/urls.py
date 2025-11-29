"""
EMR app URL configuration
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views

app_name = "emr"

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'encounters', views.EncounterViewSet, basename='encounter')
router.register(r'soap', views.FormSOAPViewSet, basename='soap')
router.register(r'vitals', views.FormVitalsViewSet, basename='vitals')
router.register(r'documents', views.MergedDocumentViewSet, basename='document')

urlpatterns = router.urls
