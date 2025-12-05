from rest_framework.pagination import PageNumberPagination, CursorPagination
from rest_framework.response import Response

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        return Response({
            'total_count': self.page.paginator.count,
            'current_page': self.page.number,
            'page_size': self.page_size,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })

class CursorSetPagination(CursorPagination):
    page_size = 20
    ordering = '-created_at'  # Default ordering
    cursor_query_param = 'cursor'

    def get_paginated_response(self, data):
        return Response({
            'cursor_next': self.get_next_link(),
            'cursor_previous': self.get_previous_link(),
            'results': data
        })
