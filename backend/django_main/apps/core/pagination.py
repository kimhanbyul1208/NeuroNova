"""
Custom pagination classes for NeuroNova.
"""
from rest_framework.pagination import PageNumberPagination


class StandardResultsSetPagination(PageNumberPagination):
    """
    Standard pagination class that allows clients to specify page size.
    Default: 20 items per page
    Max: 1000 items per page
    Query parameter: ?page_size=100
    """
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 1000
