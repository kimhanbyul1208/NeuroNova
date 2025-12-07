"""
커스텀 미들웨어
"""

from django.http import JsonResponse
from django.core.cache import cache
import time
import logging

logger = logging.getLogger(__name__)


class APIErrorMiddleware:
    """
    외부 API 에러를 일관되게 처리하는 미들웨어
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        """예외 발생 시 처리"""
        from apps.core.services.external_api import (
            APIKeyNotConfiguredError,
            APIAuthenticationError,
            APIRateLimitError
        )

        # API 키 미설정
        if isinstance(exception, APIKeyNotConfiguredError):
            logger.error(f"API key not configured: {exception}")
            return JsonResponse({
                'error': 'Service temporarily unavailable',
                'detail': 'External API not configured',
                'code': 'API_NOT_CONFIGURED'
            }, status=503)

        # API 인증 실패
        elif isinstance(exception, APIAuthenticationError):
            logger.error(f"API authentication failed: {exception}")
            return JsonResponse({
                'error': 'Service authentication failed',
                'detail': 'Invalid API credentials',
                'code': 'API_AUTH_FAILED'
            }, status=503)

        # API Rate Limit
        elif isinstance(exception, APIRateLimitError):
            retry_after = getattr(exception, 'retry_after', 60)
            logger.warning(f"API rate limit: {exception}")
            return JsonResponse({
                'error': 'Too many requests',
                'detail': 'API rate limit exceeded',
                'retry_after': retry_after,
                'code': 'RATE_LIMIT_EXCEEDED'
            }, status=429)

        # 다른 예외는 기본 처리
        return None


class RateLimitMiddleware:
    """
    사용자별 API rate limiting 미들웨어
    특정 엔드포인트에 대한 요청 빈도를 제한
    """

    def __init__(self, get_response):
        self.get_response = get_response

        # Rate limit 설정 (경로: (요청수, 시간(초)))
        self.limits = {
            '/api/drug/': (20, 60),  # 분당 20 요청
            '/api/ml/': (10, 60),    # 분당 10 요청
            '/api/emr/': (100, 60),  # 분당 100 요청
        }

    def __call__(self, request):
        # Rate limit 체크
        if not self._check_rate_limit(request):
            return JsonResponse({
                'error': 'Too many requests',
                'detail': 'Please slow down your requests',
                'code': 'USER_RATE_LIMIT'
            }, status=429)

        response = self.get_response(request)
        return response

    def _check_rate_limit(self, request):
        """Rate limit 체크"""

        # 적용 대상 경로 확인
        limit_config = None
        for path_prefix, config in self.limits.items():
            if request.path.startswith(path_prefix):
                limit_config = config
                break

        if not limit_config:
            return True  # Rate limit 적용 안 함

        max_requests, time_window = limit_config

        # 사용자 식별 (인증된 사용자 또는 IP)
        if request.user.is_authenticated:
            user_id = f'user:{request.user.id}'
        else:
            user_id = f'ip:{self._get_client_ip(request)}'

        cache_key = f'rate_limit:{request.path}:{user_id}'

        # 현재 시간
        now = time.time()

        # 캐시에서 요청 기록 가져오기
        requests = cache.get(cache_key, [])

        # 시간 윈도우 내 요청만 유지
        requests = [req_time for req_time in requests if now - req_time < time_window]

        # Rate limit 초과 체크
        if len(requests) >= max_requests:
            logger.warning(f"Rate limit exceeded for {user_id} on {request.path}")
            return False

        # 요청 기록 추가
        requests.append(now)
        cache.set(cache_key, requests, time_window)

        return True

    def _get_client_ip(self, request):
        """클라이언트 IP 가져오기"""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0]
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class RequestLoggingMiddleware:
    """
    모든 API 요청을 로깅하는 미들웨어
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # 요청 시작 시간
        start_time = time.time()

        # 요청 처리
        response = self.get_response(request)

        # 응답 시간 계산
        duration_ms = int((time.time() - start_time) * 1000)

        # API 요청만 로깅
        if request.path.startswith('/api/'):
            user = request.user.username if request.user.is_authenticated else 'anonymous'
            logger.info(
                f"{request.method} {request.path} - {response.status_code} - "
                f"{duration_ms}ms - User: {user}"
            )

        return response
