"""
URL configuration for Core app (Orthanc integration).
"""
from django.urls import path
from apps.core import views

urlpatterns = [
    # Orthanc DICOM endpoints
    path('orthanc/studies/<str:study_uid>/', views.OrthancStudyView.as_view(), name='orthanc-study'),
    path('orthanc/series/<str:series_uid>/', views.OrthancSeriesView.as_view(), name='orthanc-series'),
    path('orthanc/instances/<str:instance_id>/preview/', views.OrthancInstancePreviewView.as_view(), name='orthanc-preview'),
    path('orthanc/instances/<str:instance_id>/file/', views.OrthancInstanceFileView.as_view(), name='orthanc-file'),
    path('orthanc/patients/<int:patient_id>/studies/', views.OrthancPatientStudiesView.as_view(), name='orthanc-patient-studies'),
    path('orthanc/upload/', views.OrthancUploadView.as_view(), name='orthanc-upload'),
    path('orthanc/statistics/', views.OrthancStatisticsView.as_view(), name='orthanc-statistics'),
]
