"""
Tests for Users app views and authentication.
"""
from django.test import TestCase
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from apps.users.models import UserProfile
from config.constants import UserRole


class UserRegistrationTestCase(APITestCase):
    """Test user registration endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = reverse('user-register')

    def test_register_patient_success(self):
        """Test successful patient registration."""
        data = {
            'username': 'patient01',
            'email': 'patient@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
            'first_name': '8Ù',
            'last_name': 'M',
            'role': 'PATIENT',
            'phone_number': '010-1234-5678',
        }

        response = self.client.post(self.register_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['username'], 'patient01')

        # Verify user and profile created
        user = User.objects.get(username='patient01')
        self.assertTrue(hasattr(user, 'profile'))
        self.assertEqual(user.profile.role, UserRole.PATIENT)

    def test_register_password_mismatch(self):
        """Test registration with mismatched passwords."""
        data = {
            'username': 'patient02',
            'email': 'patient2@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'DifferentPass123!',
            'first_name': 'l',
            'last_name': '@',
        }

        response = self.client.post(self.register_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('password_confirm', response.data)

    def test_register_duplicate_username(self):
        """Test registration with existing username."""
        # Create first user
        User.objects.create_user(
            username='existing',
            email='existing@test.com',
            password='TestPass123!'
        )

        data = {
            'username': 'existing',
            'email': 'new@test.com',
            'password': 'TestPass123!',
            'password_confirm': 'TestPass123!',
        }

        response = self.client.post(self.register_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserAuthenticationTestCase(APITestCase):
    """Test user authentication (login/logout)."""

    def setUp(self):
        self.client = APIClient()
        self.login_url = reverse('token_obtain_pair')

        # Create test user
        self.user = User.objects.create_user(
            username='testuser',
            email='test@test.com',
            password='TestPass123!',
            first_name='Test',
            last_name='User'
        )
        UserProfile.objects.create(
            user=self.user,
            role=UserRole.PATIENT,
            phone_number='010-1111-2222'
        )

    def test_login_success(self):
        """Test successful login."""
        data = {
            'username': 'testuser',
            'password': 'TestPass123!',
        }

        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertIn('user', response.data)
        self.assertEqual(response.data['user']['role'], UserRole.PATIENT)

    def test_login_invalid_credentials(self):
        """Test login with invalid credentials."""
        data = {
            'username': 'testuser',
            'password': 'WrongPassword',
        }

        response = self.client.post(self.login_url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class UserProfileTestCase(APITestCase):
    """Test user profile endpoints."""

    def setUp(self):
        self.client = APIClient()

        # Create test patient
        self.patient_user = User.objects.create_user(
            username='patient',
            email='patient@test.com',
            password='TestPass123!'
        )
        self.patient_profile = UserProfile.objects.create(
            user=self.patient_user,
            role=UserRole.PATIENT
        )

        # Create test doctor
        self.doctor_user = User.objects.create_user(
            username='doctor',
            email='doctor@test.com',
            password='TestPass123!'
        )
        self.doctor_profile = UserProfile.objects.create(
            user=self.doctor_user,
            role=UserRole.DOCTOR
        )

    def test_get_current_user(self):
        """Test /users/me/ endpoint."""
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('user-me')

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'patient')
        self.assertEqual(response.data['role'], UserRole.PATIENT)

    def test_change_password_success(self):
        """Test successful password change."""
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('user-change-password')

        data = {
            'old_password': 'TestPass123!',
            'new_password': 'NewPass456!',
            'new_password_confirm': 'NewPass456!',
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Verify password changed
        self.patient_user.refresh_from_db()
        self.assertTrue(self.patient_user.check_password('NewPass456!'))

    def test_change_password_wrong_old_password(self):
        """Test password change with wrong old password."""
        self.client.force_authenticate(user=self.patient_user)
        url = reverse('user-change-password')

        data = {
            'old_password': 'WrongOldPass!',
            'new_password': 'NewPass456!',
            'new_password_confirm': 'NewPass456!',
        }

        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserPermissionTestCase(APITestCase):
    """Test user permissions and access control."""

    def setUp(self):
        self.client = APIClient()

        # Create patient
        self.patient = User.objects.create_user(
            username='patient',
            password='TestPass123!'
        )
        UserProfile.objects.create(user=self.patient, role=UserRole.PATIENT)

        # Create doctor
        self.doctor = User.objects.create_user(
            username='doctor',
            password='TestPass123!'
        )
        UserProfile.objects.create(user=self.doctor, role=UserRole.DOCTOR)

        # Create admin
        self.admin = User.objects.create_user(
            username='admin',
            password='TestPass123!',
            is_staff=True
        )
        UserProfile.objects.create(user=self.admin, role=UserRole.ADMIN)

    def test_patient_cannot_see_all_profiles(self):
        """Test that patients can only see their own profile."""
        self.client.force_authenticate(user=self.patient)
        url = reverse('userprofile-list')

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should only see 1 profile (their own)
        self.assertEqual(len(response.data['results']), 1)

    def test_doctor_can_see_all_profiles(self):
        """Test that doctors can see all profiles."""
        self.client.force_authenticate(user=self.doctor)
        url = reverse('userprofile-list')

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should see all profiles
        self.assertGreaterEqual(len(response.data['results']), 3)

    def test_admin_can_see_all_profiles(self):
        """Test that admins can see all profiles."""
        self.client.force_authenticate(user=self.admin)
        url = reverse('userprofile-list')

        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data['results']), 3)
