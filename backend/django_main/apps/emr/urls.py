"""
EMR app URL configuration
"""
from django.urls import path
from rest_framework.routers import DefaultRouter
from . import views
from apps.emr.views.report_views import PatientReportViewSet
from apps.emr.views.statistics_views import StatisticsViewSet

app_name = "emr"

router = DefaultRouter()
router.register(r'patients', views.PatientViewSet, basename='patient')
router.register(r'encounters', views.EncounterViewSet, basename='encounter')
router.register(r'soap', views.FormSOAPViewSet, basename='soap')
router.register(r'vitals', views.FormVitalsViewSet, basename='vitals')
router.register(r'documents', views.MergedDocumentViewSet, basename='document')
router.register(r'reports', PatientReportViewSet, basename='report')
router.register(r'statistics', StatisticsViewSet, basename='statistics')

urlpatterns = router.urls
