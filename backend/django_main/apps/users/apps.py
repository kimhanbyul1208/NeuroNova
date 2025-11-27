"""
Users app configuration.
"""
from django.apps import AppConfig


class UsersConfig(AppConfig):
    """Configuration for Users app."""

    default_auto_field: str = 'django.db.models.BigAutoField'
    name: str = 'apps.users'
    verbose_name: str = 'Users'
