"""
ASGI config for NeuroNova project.
"""
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')

application = get_asgi_application()
