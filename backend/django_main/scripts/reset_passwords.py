import os
import django
from django.conf import settings

# Setup Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'neuronova.settings')
django.setup()

from django.contrib.auth import get_user_model
User = get_user_model()

def reset_passwords():
    users = {
        'admin1': 'admin1password',
        'doctor1': 'doctor1password',
        'nurse1': 'nurse1password',
        'patient1': 'patient1password'
    }
    
    print("Resetting passwords...")
    for username, password in users.items():
        try:
            user = User.objects.get(username=username)
            user.set_password(password)
            user.save()
            print(f"Password for '{username}' reset successfully.")
        except User.DoesNotExist:
            print(f"User '{username}' not found.")

if __name__ == '__main__':
    reset_passwords()
