"""
Notifications app configuration.
"""
from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    """Configuration for Notifications app."""

    default_auto_field: str = 'django.db.models.BigAutoField'
    name: str = 'apps.notifications'
    verbose_name: str = 'Notifications'
