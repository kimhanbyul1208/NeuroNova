"""
외부 API 통합 서비스
API 키 관리 및 요청을 중앙에서 처리
"""

import os
import requests
import logging
from typing import Optional, Dict, Any
from django.core.cache import cache
from django.utils import timezone
from ..models import APIUsageLog

logger = logging.getLogger(__name__)


class APIKeyNotConfiguredError(Exception):
    """API 키가 설정되지 않음"""
    pass


class APIAuthenticationError(Exception):
    """API 인증 실패"""
    pass


class APIRateLimitError(Exception):
    """API rate limit 초과"""
    def __init__(self, message, retry_after=None):
        super().__init__(message)
        self.retry_after = retry_after


class ExternalAPIService:
    """
    외부 API 통합 서비스

    사용 예:
        from apps.core.services.external_api import external_api

        # DrugBank API 호출
        data = external_api.call_drugbank('/drugs/DB00001')

        # PubChem API 호출
        data = external_api.call_pubchem('aspirin')
    """

    def __init__(self):
        # API 키 로드
        self.drugbank_key = os.getenv('DRUGBANK_API_KEY')
        self.alphafold_key = os.getenv('ALPHAFOLD_API_KEY')
        self.pubchem_key = os.getenv('PUBCHEM_API_KEY')

        # API 엔드포인트
        self.drugbank_base_url = 'https://api.drugbank.com/v1'
        self.pubchem_base_url = 'https://pubchem.ncbi.nlm.nih.gov/rest/pug'
        self.alphafold_base_url = 'https://alphafold.ebi.ac.uk/api'

    def call_drugbank(
        self,
        endpoint: str,
        params: Optional[Dict] = None,
        user=None
    ) -> Dict[Any, Any]:
        """
        DrugBank API 호출

        Args:
            endpoint: API 엔드포인트 (예: '/drugs/DB00001')
            params: 쿼리 파라미터
            user: 요청 사용자 (로깅용)

        Returns:
            API 응답 데이터

        Raises:
            APIKeyNotConfiguredError: API 키 미설정
            APIAuthenticationError: 인증 실패
            APIRateLimitError: Rate limit 초과
        """
        if not self.drugbank_key:
            raise APIKeyNotConfiguredError("DRUGBANK_API_KEY not configured")

        # 캐시 확인 (1시간)
        cache_key = f'drugbank:{endpoint}:{params}'
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"DrugBank cache hit: {endpoint}")
            self._log_usage(
                service='drugbank',
                endpoint=endpoint,
                status_code=200,
                cached=True,
                user=user
            )
            return cached

        headers = {
            'Authorization': f'Bearer {self.drugbank_key}',
            'Content-Type': 'application/json'
        }

        url = f'{self.drugbank_base_url}{endpoint}'

        start_time = timezone.now()

        try:
            response = requests.get(
                url,
                headers=headers,
                params=params,
                timeout=10
            )

            response_time = (timezone.now() - start_time).total_seconds() * 1000

            # 인증 실패
            if response.status_code == 401:
                logger.error("DrugBank API authentication failed")
                self._log_usage(
                    service='drugbank',
                    endpoint=endpoint,
                    status_code=401,
                    error_message="Authentication failed",
                    response_time_ms=int(response_time),
                    user=user
                )
                raise APIAuthenticationError("Invalid DrugBank API key")

            # Rate limit
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                logger.warning(f"DrugBank API rate limit exceeded. Retry after {retry_after}s")
                self._log_usage(
                    service='drugbank',
                    endpoint=endpoint,
                    status_code=429,
                    error_message="Rate limit exceeded",
                    response_time_ms=int(response_time),
                    user=user
                )
                raise APIRateLimitError(
                    "DrugBank API rate limit exceeded",
                    retry_after=retry_after
                )

            response.raise_for_status()

            data = response.json()

            # 캐시 저장 (1시간)
            cache.set(cache_key, data, 3600)

            # 사용량 로깅
            self._log_usage(
                service='drugbank',
                endpoint=endpoint,
                status_code=200,
                response_time_ms=int(response_time),
                user=user
            )

            logger.info(f"DrugBank API success: {endpoint} ({int(response_time)}ms)")
            return data

        except requests.Timeout:
            logger.error(f"DrugBank API timeout: {endpoint}")
            self._log_usage(
                service='drugbank',
                endpoint=endpoint,
                status_code=504,
                error_message="Timeout",
                user=user
            )
            raise
        except requests.RequestException as e:
            logger.error(f"DrugBank API error: {e}")
            self._log_usage(
                service='drugbank',
                endpoint=endpoint,
                status_code=500,
                error_message=str(e),
                user=user
            )
            raise

    def call_pubchem(
        self,
        compound_name: str,
        user=None
    ) -> Dict[Any, Any]:
        """
        PubChem API 호출 (키 선택적)

        Args:
            compound_name: 화합물 이름
            user: 요청 사용자 (로깅용)

        Returns:
            화합물 정보
        """
        # 캐시 확인 (24시간)
        cache_key = f'pubchem:{compound_name}'
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"PubChem cache hit: {compound_name}")
            self._log_usage(
                service='pubchem',
                endpoint=f'/compound/{compound_name}',
                status_code=200,
                cached=True,
                user=user
            )
            return cached

        headers = {}
        if self.pubchem_key:
            headers['X-API-Key'] = self.pubchem_key

        url = f'{self.pubchem_base_url}/compound/name/{compound_name}/JSON'

        start_time = timezone.now()

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response_time = (timezone.now() - start_time).total_seconds() * 1000

            # Rate limit (키 없을 때 더 엄격)
            if response.status_code == 429:
                retry_after = int(response.headers.get('Retry-After', 60))
                logger.warning(f"PubChem rate limit. Retry after {retry_after}s")
                self._log_usage(
                    service='pubchem',
                    endpoint=f'/compound/{compound_name}',
                    status_code=429,
                    error_message="Rate limit exceeded",
                    response_time_ms=int(response_time),
                    user=user
                )
                raise APIRateLimitError(
                    "PubChem API rate limit exceeded",
                    retry_after=retry_after
                )

            response.raise_for_status()

            data = response.json()

            # 캐시 저장 (24시간)
            cache.set(cache_key, data, 86400)

            # 사용량 로깅
            self._log_usage(
                service='pubchem',
                endpoint=f'/compound/{compound_name}',
                status_code=200,
                response_time_ms=int(response_time),
                user=user
            )

            logger.info(f"PubChem API success: {compound_name} ({int(response_time)}ms)")
            return data

        except requests.RequestException as e:
            logger.error(f"PubChem API error: {e}")
            self._log_usage(
                service='pubchem',
                endpoint=f'/compound/{compound_name}',
                status_code=500,
                error_message=str(e),
                user=user
            )
            raise

    def call_alphafold(
        self,
        uniprot_id: str,
        user=None
    ) -> Dict[Any, Any]:
        """
        AlphaFold API 호출

        Args:
            uniprot_id: UniProt ID (예: 'P12345')
            user: 요청 사용자

        Returns:
            단백질 구조 정보
        """
        # 캐시 확인 (24시간)
        cache_key = f'alphafold:{uniprot_id}'
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"AlphaFold cache hit: {uniprot_id}")
            self._log_usage(
                service='alphafold',
                endpoint=f'/prediction/{uniprot_id}',
                status_code=200,
                cached=True,
                user=user
            )
            return cached

        headers = {}
        if self.alphafold_key:
            headers['Authorization'] = f'Bearer {self.alphafold_key}'

        url = f'{self.alphafold_base_url}/prediction/{uniprot_id}'

        start_time = timezone.now()

        try:
            response = requests.get(url, headers=headers, timeout=15)
            response_time = (timezone.now() - start_time).total_seconds() * 1000

            response.raise_for_status()

            data = response.json()

            # 캐시 저장 (24시간)
            cache.set(cache_key, data, 86400)

            # 사용량 로깅
            self._log_usage(
                service='alphafold',
                endpoint=f'/prediction/{uniprot_id}',
                status_code=200,
                response_time_ms=int(response_time),
                user=user
            )

            logger.info(f"AlphaFold API success: {uniprot_id} ({int(response_time)}ms)")
            return data

        except requests.RequestException as e:
            logger.error(f"AlphaFold API error: {e}")
            self._log_usage(
                service='alphafold',
                endpoint=f'/prediction/{uniprot_id}',
                status_code=500,
                error_message=str(e),
                user=user
            )
            raise

    def _log_usage(
        self,
        service: str,
        endpoint: str,
        status_code: int,
        response_time_ms: int = None,
        cached: bool = False,
        error_message: str = '',
        user=None
    ):
        """API 사용량 로깅"""
        try:
            APIUsageLog.objects.create(
                user=user,
                service=service,
                endpoint=endpoint,
                status_code=status_code,
                response_time_ms=response_time_ms,
                cached=cached,
                error_message=error_message
            )
        except Exception as e:
            logger.error(f"Failed to log API usage: {e}")


# 싱글톤 인스턴스
external_api = ExternalAPIService()
