import os
import sys
import django

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from django.contrib.auth.models import User
from apps.users.models import UserProfile
from config.constants import UserRole

def create_admin():
    username = 'admin1'
    email = 'admin1@neuronova.com'
    password = 'admin123'

    if not User.objects.filter(username=username).exists():
        u = User.objects.create_superuser(username, email, password)
        print(f"Superuser '{username}' created.")
    else:
        u = User.objects.get(username=username)
        print(f"Superuser '{username}' already exists.")

    if not hasattr(u, 'profile'):
        UserProfile.objects.create(user=u, role=UserRole.ADMIN, phone_number="010-1234-5678")
        print("Admin profile created.")
    else:
        print("Admin profile already exists.")

if __name__ == "__main__":
    create_admin()
