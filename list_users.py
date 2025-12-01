import os
import django
import sys

# Setup Django environment
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'django_main'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from django.contrib.auth.models import User
from apps.users.models import UserProfile

def list_accounts():
    print(f"{'Username':<15} | {'Email':<30} | {'Role':<10} | {'Name':<20}")
    print("-" * 80)
    
    users = User.objects.all().order_by('username')
    for user in users:
        role = "N/A"
        if hasattr(user, 'profile'):
            role = user.profile.role
        elif user.is_superuser:
            role = "SUPERUSER"
            
        name = user.get_full_name()
        print(f"{user.username:<15} | {user.email:<30} | {role:<10} | {name:<20}")

if __name__ == "__main__":
    list_accounts()
