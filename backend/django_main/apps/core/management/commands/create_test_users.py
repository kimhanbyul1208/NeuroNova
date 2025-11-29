"""
Django management command to create test users with proper passwords.
Usage: python manage.py create_test_users
"""
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.users.models import UserProfile
from config.constants import UserRole


class Command(BaseCommand):
    help = 'Create test users with proper passwords for each role'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('Creating test users...'))

        # Default password for all test users
        default_password = 'test1234'

        users_data = [
            # ADMIN users
            {'username': 'admin1', 'email': 'admin1@neuronova.com', 'first_name': 'Admin', 'last_name': 'One', 'role': UserRole.ADMIN, 'is_staff': True, 'is_superuser': True},
            {'username': 'admin2', 'email': 'admin2@neuronova.com', 'first_name': 'Admin', 'last_name': 'Two', 'role': UserRole.ADMIN, 'is_staff': True, 'is_superuser': False},

            # DOCTOR users
            {'username': 'doctor1', 'email': 'doctor1@neuronova.com', 'first_name': '김', 'last_name': '신경', 'role': UserRole.DOCTOR, 'is_staff': False, 'is_superuser': False},
            {'username': 'doctor2', 'email': 'doctor2@neuronova.com', 'first_name': '이', 'last_name': '뇌외', 'role': UserRole.DOCTOR, 'is_staff': False, 'is_superuser': False},

            # NURSE users
            {'username': 'nurse1', 'email': 'nurse1@neuronova.com', 'first_name': '강', 'last_name': '수진', 'role': UserRole.NURSE, 'is_staff': False, 'is_superuser': False},
            {'username': 'nurse2', 'email': 'nurse2@neuronova.com', 'first_name': '윤', 'last_name': '미영', 'role': UserRole.NURSE, 'is_staff': False, 'is_superuser': False},

            # PATIENT users
            {'username': 'patient1', 'email': 'patient1@example.com', 'first_name': '환자', 'last_name': '일호', 'role': UserRole.PATIENT, 'is_staff': False, 'is_superuser': False},
            {'username': 'patient2', 'email': 'patient2@example.com', 'first_name': '환자', 'last_name': '이호', 'role': UserRole.PATIENT, 'is_staff': False, 'is_superuser': False},
        ]

        created_count = 0
        updated_count = 0

        for user_data in users_data:
            username = user_data['username']
            role = user_data.pop('role')

            # Create or update user
            user, created = User.objects.update_or_create(
                username=username,
                defaults={
                    'email': user_data['email'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'is_staff': user_data['is_staff'],
                    'is_superuser': user_data['is_superuser'],
                    'is_active': True,
                }
            )

            # Set password
            user.set_password(default_password)
            user.save()

            # Create or update user profile
            profile, profile_created = UserProfile.objects.update_or_create(
                user=user,
                defaults={
                    'role': role,
                    'phone_number': f'010-{1000 + created_count:04d}-0001',
                    'bio': f'{role} test user',
                }
            )

            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ Created user: {username} ({role})')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ Updated user: {username} ({role})')
                )

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS(f'Test users created/updated successfully!'))
        self.stdout.write(self.style.SUCCESS(f'  Created: {created_count} users'))
        self.stdout.write(self.style.SUCCESS(f'  Updated: {updated_count} users'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write('')
        self.stdout.write(self.style.WARNING('Login credentials:'))
        self.stdout.write(self.style.WARNING(f'  Username: admin1, doctor1, nurse1, patient1, etc.'))
        self.stdout.write(self.style.WARNING(f'  Password: {default_password}'))
        self.stdout.write('')
