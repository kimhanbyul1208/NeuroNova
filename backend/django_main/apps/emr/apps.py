"""
EMR app configuration.
"""
from django.apps import AppConfig


class EmrConfig(AppConfig):
    """Configuration for EMR app."""

    default_auto_field: str = 'django.db.models.BigAutoField'
    name: str = 'apps.emr'
    verbose_name: str = 'Electronic Medical Records'
