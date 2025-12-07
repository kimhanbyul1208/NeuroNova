"""
Core app views including Orthanc DICOM integration.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import HttpResponse, JsonResponse
from django.db import connection
from django.conf import settings
from apps.core.services.orthanc_service import orthanc_service
import logging
import os

logger = logging.getLogger(__name__)


class OrthancStudyView(APIView):
    """
    API endpoint for accessing DICOM studies from Orthanc.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, study_uid=None):
        """
        Get study information by DICOM Study Instance UID.

        Args:
            study_uid: DICOM Study Instance UID (from URL or query param)

        Returns:
            Study metadata
        """
        if not study_uid:
            study_uid = request.query_params.get('uid')

        if not study_uid:
            return Response(
                {'error': 'study_uid parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        study = orthanc_service.get_study_by_uid(study_uid)

        if not study:
            return Response(
                {'error': 'Study not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(study)


class OrthancSeriesView(APIView):
    """
    API endpoint for accessing DICOM series from Orthanc.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, series_uid=None):
        """
        Get series information by DICOM Series Instance UID.

        Args:
            series_uid: DICOM Series Instance UID

        Returns:
            Series metadata
        """
        if not series_uid:
            series_uid = request.query_params.get('uid')

        if not series_uid:
            return Response(
                {'error': 'series_uid parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        series = orthanc_service.get_series_by_uid(series_uid)

        if not series:
            return Response(
                {'error': 'Series not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        return Response(series)


class OrthancInstancePreviewView(APIView):
    """
    API endpoint for getting DICOM instance preview images.
    Proxy for Orthanc preview endpoint.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, instance_id):
        """
        Get preview image (JPEG) for a DICOM instance.

        Args:
            instance_id: Orthanc instance UUID
            quality: JPEG quality (query param, default 90)

        Returns:
            JPEG image
        """
        quality = int(request.query_params.get('quality', 90))

        image_data = orthanc_service.get_instance_preview(instance_id, quality)

        if not image_data:
            return Response(
                {'error': 'Failed to get preview image'},
                status=status.HTTP_404_NOT_FOUND
            )

        return HttpResponse(image_data, content_type='image/jpeg')


class OrthancInstanceFileView(APIView):
    """
    API endpoint for downloading DICOM files.
    Proxy for Orthanc file download.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, instance_id):
        """
        Download DICOM file.

        Args:
            instance_id: Orthanc instance UUID

        Returns:
            DICOM file
        """
        file_data = orthanc_service.get_instance_file(instance_id)

        if not file_data:
            return Response(
                {'error': 'Failed to download DICOM file'},
                status=status.HTTP_404_NOT_FOUND
            )

        response = HttpResponse(file_data, content_type='application/dicom')
        response['Content-Disposition'] = f'attachment; filename="instance_{instance_id}.dcm"'
        return response


class OrthancPatientStudiesView(APIView):
    """
    API endpoint for getting all studies for a patient.
    """
    permission_classes = [IsAuthenticated]

    def _can_access_patient_data(self, user, patient):
        """
        Check if user has permission to access patient's medical data.

        Access is granted if:
        1. User is the patient themselves
        2. User is the patient's primary doctor
        3. User is an assigned doctor (via PatientDoctor relationship)
        4. User is admin

        Args:
            user: Django User object
            patient: Patient object

        Returns:
            bool: True if access is granted, False otherwise
        """
        # Check if user is admin
        if hasattr(user, 'profile') and user.profile.is_admin():
            return True

        # Check if user is the patient themselves
        if hasattr(user, 'patient') and user.patient.id == patient.id:
            return True

        # Check if user is the primary doctor
        if patient.doctor and patient.doctor.id == user.id:
            return True

        # Check if user is an assigned doctor
        from apps.custom.models import PatientDoctor
        is_assigned_doctor = PatientDoctor.objects.filter(
            patient=patient,
            doctor__user=user
        ).exists()

        return is_assigned_doctor

    def get(self, request, patient_id):
        """
        Get all DICOM studies for a patient.

        Args:
            patient_id: Patient ID (from NeuroNova database)

        Returns:
            List of studies
        """
        # Get patient from database
        from apps.emr.models import Patient

        try:
            patient = Patient.objects.get(id=patient_id)
        except Patient.DoesNotExist:
            return Response(
                {'error': 'Patient not found'},
                status=status.HTTP_404_NOT_FOUND
            )

        # Check access permission
        if not self._can_access_patient_data(request.user, patient):
            return Response(
                {'error': 'Permission denied. You do not have access to this patient\'s medical imaging data.'},
                status=status.HTTP_403_FORBIDDEN
            )

        # Get studies from Orthanc using patient ID
        study_ids = orthanc_service.get_patient_studies(patient.pid)

        if not study_ids:
            return Response({'studies': []})

        # Get detailed info for each study
        studies = []
        for study_id in study_ids:
            study = orthanc_service.get_study(study_id)
            if study:
                studies.append(study)

        return Response({'studies': studies})


class OrthancUploadView(APIView):
    """
    API endpoint for uploading DICOM files to Orthanc.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """
        Upload DICOM file to Orthanc.

        Request:
            multipart/form-data with 'file' field

        Returns:
            Upload result
        """
        dicom_file = request.FILES.get('file')

        if not dicom_file:
            return Response(
                {'error': 'No file provided'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Read file content
        file_content = dicom_file.read()

        # Upload to Orthanc
        result = orthanc_service.upload_dicom(file_content)

        if not result:
            return Response(
                {'error': 'Failed to upload DICOM file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        logger.info(f"DICOM file uploaded by {request.user.username}: {result}")

        return Response({
            'message': 'File uploaded successfully',
            'result': result
        }, status=status.HTTP_201_CREATED)


class OrthancStatisticsView(APIView):
    """
    API endpoint for Orthanc server statistics.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """
        Get Orthanc server statistics.

        Returns:
            Statistics (patient count, study count, etc.)
        """
        stats = orthanc_service.get_statistics()

        if not stats:
            return Response(
                {'error': 'Failed to get statistics'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(stats)


def health_check(request):
    """
    헬스 체크 엔드포인트
    시스템 상태 점검 및 응답
    """
    health_status = {
        "status": "healthy",
        "service": "NeuroNova Django API",
        "version": "1.0.0",
        "checks": {}
    }

    # 1. 데이터베이스 연결 확인
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status["checks"]["database"] = "ok"
    except Exception as e:
        health_status["status"] = "unhealthy"
        health_status["checks"]["database"] = f"error: {str(e)}"

    # 2. Flask ML 서버 연결 확인 (선택사항)
    flask_url = os.getenv('FLASK_INFERENCE_URL', 'http://127.0.0.1:9000')
    try:
        import requests
        response = requests.get(f"{flask_url}/health", timeout=5)
        if response.status_code == 200:
            health_status["checks"]["ml_server"] = "ok"
        else:
            health_status["checks"]["ml_server"] = f"status_code: {response.status_code}"
    except Exception as e:
        health_status["checks"]["ml_server"] = f"error: {str(e)}"

    # 3. 디스크 여유 공간 확인
    try:
        import shutil
        total, used, free = shutil.disk_usage("/")
        free_percent = (free / total) * 100
        if free_percent < 10:
            health_status["status"] = "unhealthy"
            health_status["checks"]["disk"] = f"low: {free_percent:.1f}% free"
        else:
            health_status["checks"]["disk"] = f"ok: {free_percent:.1f}% free"
    except Exception as e:
        health_status["checks"]["disk"] = f"error: {str(e)}"

    # 4. 미디어 파일 디렉토리 확인
    media_root = settings.MEDIA_ROOT
    if os.path.exists(media_root) and os.access(media_root, os.W_OK):
        health_status["checks"]["media_storage"] = "ok"
    else:
        health_status["status"] = "unhealthy"
        health_status["checks"]["media_storage"] = "not writable"

    # HTTP 상태 코드 결정
    status_code = 200 if health_status["status"] == "healthy" else 503

    return JsonResponse(health_status, status=status_code)


def system_stats(request):
    """
    시스템 통계 엔드포인트 (관리자 전용)
    """
    try:
        import psutil

        stats = {
            "cpu": {
                "percent": psutil.cpu_percent(interval=1),
                "count": psutil.cpu_count(),
                "load_avg": list(os.getloadavg()) if hasattr(os, 'getloadavg') else None
            },
            "memory": {
                "total": psutil.virtual_memory().total,
                "available": psutil.virtual_memory().available,
                "percent": psutil.virtual_memory().percent
            },
            "disk": {
                "total": psutil.disk_usage('/').total,
                "used": psutil.disk_usage('/').used,
                "free": psutil.disk_usage('/').free,
                "percent": psutil.disk_usage('/').percent
            }
        }

        return JsonResponse(stats)
    except ImportError:
        return JsonResponse(
            {"error": "psutil not installed"},
            status=500
        )
