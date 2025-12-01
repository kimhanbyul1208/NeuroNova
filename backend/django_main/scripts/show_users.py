from django.contrib.auth.models import User

users = User.objects.all()
print("=" * 50)
print("LOGIN CREDENTIALS")
print("=" * 50)

for user in users:
    print(f"\nUsername: {user.username}")
    if hasattr(user, 'userprofile'):
        print(f"Role: {user.userprofile.role}")
    print(f"Email: {user.email}")

print("\n" + "=" * 50)
print("Test Accounts:")
print("=" * 50)
print("\n[DOCTOR ACCOUNT]")
print("Username: doctor")
print("Password: doctor123")
print("\n[PATIENT ACCOUNT]")
print("Username: patient")
print("Password: patient123")
print("=" * 50)
