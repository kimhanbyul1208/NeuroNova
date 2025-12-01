import os
import django
from django.conf import settings

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from django.contrib.auth.models import Group, Permission
from django.contrib.contenttypes.models import ContentType

def check_groups_and_permissions():
    print("--- Groups ---")
    groups = Group.objects.all()
    if not groups:
        print("No groups found.")
    else:
        for group in groups:
            print(f"- {group.name}")
            for perm in group.permissions.all():
                print(f"  - {perm.codename}")

    print("\n--- Permissions (Sample) ---")
    permissions = Permission.objects.all()
    print(f"Total permissions: {permissions.count()}")
    if permissions.exists():
        print("First 10 permissions:")
        for perm in permissions[:10]:
            print(f"- {perm.content_type.app_label} | {perm.codename}")

if __name__ == '__main__':
    check_groups_and_permissions()
