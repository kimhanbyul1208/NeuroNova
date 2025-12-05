from django.test import TestCase
from rest_framework.test import APIRequestFactory
from rest_framework.views import APIView
from rest_framework.settings import api_settings
from apps.core.pagination import StandardResultsSetPagination, CursorSetPagination
from apps.core.models import BaseModel
from django.db import models

# Mock Model for testing
class MockItem(BaseModel):
    name = models.CharField(max_length=100)
    class Meta:
        app_label = 'core'

class PaginationTestCase(TestCase):
    def setUp(self):
        self.factory = APIRequestFactory()
        # Create dummy data
        # Note: Since MockItem is not in actual migrations, we might need to rely on existing models or mock the queryset differently.
        # For simplicity in this environment, I will test the pagination class logic with a list or mock queryset if possible,
        # but DRF pagination usually requires a queryset.
        # Let's use User model which is guaranteed to exist.
        from django.contrib.auth.models import User
        for i in range(25):
            User.objects.create_user(username=f'user_{i}', password='password')
        self.queryset = User.objects.all().order_by('-date_joined')

    def test_standard_pagination(self):
        view = APIView()
        view.pagination_class = StandardResultsSetPagination
        paginator = StandardResultsSetPagination()
        
        request = self.factory.get('/?page=1')
        page = paginator.paginate_queryset(self.queryset, request, view=view)
        
        self.assertEqual(len(page), 20) # Default page size
        
        response = paginator.get_paginated_response(page)
        self.assertEqual(response.data['total_count'], 25)
        self.assertEqual(response.data['current_page'], 1)
        self.assertIsNotNone(response.data['next'])
        self.assertIsNone(response.data['previous'])

    def test_cursor_pagination(self):
        view = APIView()
        view.pagination_class = CursorSetPagination
        paginator = CursorSetPagination()
        paginator.ordering = '-date_joined' # User model has date_joined
        
        request = self.factory.get('/')
        page = paginator.paginate_queryset(self.queryset, request, view=view)
        
        self.assertEqual(len(page), 20)
        
        response = paginator.get_paginated_response(page)
        self.assertIn('cursor_next', response.data)
        self.assertIn('cursor_previous', response.data)
        self.assertIn('results', response.data)
