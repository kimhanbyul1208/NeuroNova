"""
Orthanc DICOM Server Integration Service.
Handles communication with Orthanc REST API.
"""
import requests
from requests.auth import HTTPBasicAuth
from typing import Dict, List, Optional, Any
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class OrthancService:
    """
    Service class for interacting with Orthanc DICOM server.
    Implements connection pooling and error handling.
    """

    def __init__(self):
        self.base_url = settings.ORTHANC_URL
        self.auth = HTTPBasicAuth(
            settings.ORTHANC_USERNAME,
            settings.ORTHANC_PASSWORD
        )
        self.session = requests.Session()
        self.session.auth = self.auth

    def _make_request(
        self,
        method: str,
        endpoint: str,
        **kwargs
    ) -> Optional[Dict[str, Any]]:
        """
        Make HTTP request to Orthanc API with error handling.

        Args:
            method: HTTP method (GET, POST, DELETE, etc.)
            endpoint: API endpoint (e.g., '/studies')
            **kwargs: Additional arguments for requests

        Returns:
            JSON response or None if error
        """
        url = f"{self.base_url}{endpoint}"

        try:
            response = self.session.request(method, url, **kwargs)
            response.raise_for_status()

            # Some endpoints return empty response
            if response.status_code == 204 or not response.content:
                return {}

            return response.json()

        except requests.exceptions.RequestException as e:
            logger.error(f"Orthanc API error ({method} {endpoint}): {e}")
            return None

    # ==================== Studies ====================

    def get_studies(self) -> Optional[List[str]]:
        """
        Get list of all study IDs.

        Returns:
            List of study UUIDs
        """
        return self._make_request('GET', '/studies')

    def get_study(self, study_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a study.

        Args:
            study_id: Orthanc study UUID

        Returns:
            Study metadata
        """
        return self._make_request('GET', f'/studies/{study_id}')

    def get_study_by_uid(self, study_uid: str) -> Optional[Dict[str, Any]]:
        """
        Get study by DICOM Study Instance UID.

        Args:
            study_uid: DICOM Study Instance UID (e.g., 1.2.840...)

        Returns:
            Study metadata
        """
        # Search using DICOM tags
        result = self._make_request('POST', '/tools/find', json={
            'Level': 'Study',
            'Query': {
                'StudyInstanceUID': study_uid
            }
        })

        if result and len(result) > 0:
            return self.get_study(result[0])
        return None

    def delete_study(self, study_id: str) -> bool:
        """
        Delete a study from Orthanc.

        Args:
            study_id: Orthanc study UUID

        Returns:
            True if successful
        """
        result = self._make_request('DELETE', f'/studies/{study_id}')
        return result is not None

    # ==================== Series ====================

    def get_series(self, series_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about a series.

        Args:
            series_id: Orthanc series UUID

        Returns:
            Series metadata
        """
        return self._make_request('GET', f'/series/{series_id}')

    def get_series_by_uid(self, series_uid: str) -> Optional[Dict[str, Any]]:
        """
        Get series by DICOM Series Instance UID.

        Args:
            series_uid: DICOM Series Instance UID

        Returns:
            Series metadata
        """
        result = self._make_request('POST', '/tools/find', json={
            'Level': 'Series',
            'Query': {
                'SeriesInstanceUID': series_uid
            }
        })

        if result and len(result) > 0:
            return self.get_series(result[0])
        return None

    # ==================== Instances ====================

    def get_instance(self, instance_id: str) -> Optional[Dict[str, Any]]:
        """
        Get detailed information about an instance.

        Args:
            instance_id: Orthanc instance UUID

        Returns:
            Instance metadata
        """
        return self._make_request('GET', f'/instances/{instance_id}')

    def get_instance_file(self, instance_id: str) -> Optional[bytes]:
        """
        Download DICOM file for an instance.

        Args:
            instance_id: Orthanc instance UUID

        Returns:
            DICOM file bytes
        """
        url = f"{self.base_url}/instances/{instance_id}/file"

        try:
            response = self.session.get(url)
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download DICOM file: {e}")
            return None

    def get_instance_preview(
        self,
        instance_id: str,
        quality: int = 90
    ) -> Optional[bytes]:
        """
        Get preview image (JPEG) of an instance.

        Args:
            instance_id: Orthanc instance UUID
            quality: JPEG quality (1-100)

        Returns:
            JPEG image bytes
        """
        url = f"{self.base_url}/instances/{instance_id}/preview"

        try:
            response = self.session.get(url, params={'quality': quality})
            response.raise_for_status()
            return response.content
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get preview image: {e}")
            return None

    # ==================== Patient ====================

    def get_patient_studies(self, patient_id: str) -> Optional[List[str]]:
        """
        Get all studies for a patient.

        Args:
            patient_id: DICOM Patient ID

        Returns:
            List of study UUIDs
        """
        result = self._make_request('POST', '/tools/find', json={
            'Level': 'Study',
            'Query': {
                'PatientID': patient_id
            }
        })

        return result if result else []

    # ==================== Upload ====================

    def upload_dicom(self, file_content: bytes) -> Optional[Dict[str, Any]]:
        """
        Upload DICOM file to Orthanc.

        Args:
            file_content: DICOM file bytes

        Returns:
            Upload result with IDs
        """
        return self._make_request(
            'POST',
            '/instances',
            data=file_content,
            headers={'Content-Type': 'application/dicom'}
        )

    # ==================== Statistics ====================

    def get_statistics(self) -> Optional[Dict[str, Any]]:
        """
        Get Orthanc server statistics.

        Returns:
            Statistics (patient count, study count, etc.)
        """
        return self._make_request('GET', '/statistics')

    def get_system_info(self) -> Optional[Dict[str, Any]]:
        """
        Get Orthanc system information.

        Returns:
            System info (version, plugins, etc.)
        """
        return self._make_request('GET', '/system')


# Singleton instance
orthanc_service = OrthancService()
