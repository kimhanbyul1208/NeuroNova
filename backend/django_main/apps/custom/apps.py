"""
Custom app configuration.
"""
from django.apps import AppConfig


class CustomConfig(AppConfig):
    """Configuration for Custom app."""

    default_auto_field: str = 'django.db.models.BigAutoField'
    name: str = 'apps.custom'
    verbose_name: str = 'NeuroNova Custom Features'
