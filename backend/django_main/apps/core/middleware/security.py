"""
Security middleware for enhanced protection.
"""
from django.http import JsonResponse
from django.core.cache import cache
from django.conf import settings
import logging
import time

logger = logging.getLogger(__name__)


class RateLimitMiddleware:
    """
    Simple rate limiting middleware using Django cache.
    Limits API requests per IP address.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.rate_limit = getattr(settings, 'API_RATE_LIMIT', 100)  # requests per minute
        self.rate_window = getattr(settings, 'API_RATE_WINDOW', 60)  # seconds

    def __call__(self, request):
        # Skip rate limiting for admin and static files
        if request.path.startswith('/admin/') or request.path.startswith('/static/'):
            return self.get_response(request)

        # Get client IP
        ip_address = self._get_client_ip(request)

        # Rate limit key
        cache_key = f"rate_limit:{ip_address}"

        # Get current request count
        request_count = cache.get(cache_key, 0)

        if request_count >= self.rate_limit:
            logger.warning(f"Rate limit exceeded for IP {ip_address}")
            return JsonResponse({
                'error': 'Rate limit exceeded',
                'message': f'Maximum {self.rate_limit} requests per minute allowed',
                'retry_after': self.rate_window
            }, status=429)

        # Increment request count
        cache.set(cache_key, request_count + 1, self.rate_window)

        response = self.get_response(request)
        return response

    def _get_client_ip(self, request):
        """Get real client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip


class SecurityHeadersMiddleware:
    """
    Add security headers to all responses.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Only add security headers in production
        if not settings.DEBUG:
            # Prevent clickjacking
            response['X-Frame-Options'] = 'DENY'

            # Prevent MIME type sniffing
            response['X-Content-Type-Options'] = 'nosniff'

            # Enable XSS protection
            response['X-XSS-Protection'] = '1; mode=block'

            # Strict-Transport-Security (HSTS)
            response['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

            # Content Security Policy (restrictive for API)
            response['Content-Security-Policy'] = "default-src 'none'; frame-ancestors 'none'"

            # Referrer Policy
            response['Referrer-Policy'] = 'strict-origin-when-cross-origin'

            # Permissions Policy (formerly Feature Policy)
            response['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'

        return response


class AuditLogMiddleware:
    """
    Log all API requests for security audit.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Record start time
        start_time = time.time()

        # Get response
        response = self.get_response(request)

        # Calculate duration
        duration = time.time() - start_time

        # Log API requests (only for API endpoints)
        if request.path.startswith('/api/'):
            user = request.user if request.user.is_authenticated else 'Anonymous'
            ip_address = self._get_client_ip(request)

            logger.info(
                f"API_AUDIT | "
                f"User: {user} | "
                f"IP: {ip_address} | "
                f"Method: {request.method} | "
                f"Path: {request.path} | "
                f"Status: {response.status_code} | "
                f"Duration: {duration:.3f}s"
            )

            # Log sensitive operations
            if request.method in ['POST', 'PUT', 'PATCH', 'DELETE']:
                logger.warning(
                    f"SENSITIVE_OPERATION | "
                    f"User: {user} | "
                    f"IP: {ip_address} | "
                    f"Method: {request.method} | "
                    f"Path: {request.path}"
                )

        return response

    def _get_client_ip(self, request):
        """Get real client IP from request."""
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
