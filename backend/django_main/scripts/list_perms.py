import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from django.contrib.auth.models import Permission

def list_all_permissions():
    permissions = Permission.objects.all().order_by('content_type__app_label', 'codename')
    for perm in permissions:
        print(f"{perm.content_type.app_label} | {perm.codename}")

if __name__ == '__main__':
    list_all_permissions()
