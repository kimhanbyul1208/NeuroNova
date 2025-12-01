import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from django.contrib.auth import get_user_model
from apps.users.models import UserProfile

User = get_user_model()

def check_users():
    usernames = ['admin1', 'doctor1', 'nurse1', 'patient1']
    print(f"Checking users: {usernames}")
    
    for username in usernames:
        try:
            user = User.objects.get(username=username)
            print(f"User '{username}' exists. Active: {user.is_active}, Staff: {user.is_staff}, Superuser: {user.is_superuser}")
            
            try:
                profile = user.profile
                print(f"  Role: {profile.role}")
            except UserProfile.DoesNotExist:
                print("  Role: [NO PROFILE FOUND]")
                
            if user.check_password(f"{username}password"):
                print(f"  Password '{username}password': CORRECT")
            else:
                print(f"  Password '{username}password': INCORRECT")
        except User.DoesNotExist:
            print(f"User '{username}' does NOT exist.")

if __name__ == '__main__':
    check_users()
