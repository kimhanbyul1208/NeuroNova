"""
Core app views including Orthanc DICOM integration.
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.http import HttpResponse
from apps.core.services.orthanc_service import orthanc_service
import logging

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
