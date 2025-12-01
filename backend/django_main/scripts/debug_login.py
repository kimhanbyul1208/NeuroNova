from django.contrib.auth.models import User
from apps.users.models import UserProfile

# Check doctor1 account
try:
    user = User.objects.get(username='doctor1')
    print(f'User found: {user.username}')
    print(f'User is_active: {user.is_active}')
    print(f'Has profile attr: {hasattr(user, "profile")}')
    
    # Try to get profile
    try:
        profile = user.profile
        print(f'Profile exists via relation: YES')
        print(f'Profile role: {profile.role}')
        print(f'Profile approval_status: {profile.approval_status}')
    except Exception as e:
        print(f'Profile via relation ERROR: {e}')
        
    # Try direct query
    profile_exists = UserProfile.objects.filter(user=user).exists()
    print(f'Profile exists in DB: {profile_exists}')
    
    if profile_exists:
        p = UserProfile.objects.get(user=user)
        print(f'Direct query - Role: {p.role}')
        
except User.DoesNotExist:
    print('User doctor1 not found!')
except Exception as e:
    print(f'Error: {e}')

# Test login
print('\n--- Testing Authentication ---')
from django.contrib.auth import authenticate
user = authenticate(username='doctor1', password='doctor123')
if user:
    print(f'Authentication SUCCESS: {user.username}')
    print(f'User active: {user.is_active}')
else:
    print('Authentication FAILED')
    # Try with other accounts
    for username in ['admin1', 'nurse1', 'patient1']:
        u = authenticate(username=username, password=f'{username.replace("1", "")}123')
        print(f'{username}: {"SUCCESS" if u else "FAILED"}')
