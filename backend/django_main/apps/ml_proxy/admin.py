from django.contrib import admin
from .models import InferenceLog


@admin.register(InferenceLog)
class InferenceLogAdmin(admin.ModelAdmin):
    """
    ML 추론 로그 관리자 페이지 설정
    """
    list_display = [
        'id',
        'doctor_name',
        'patient_name',
        'created_at'
    ]
    list_filter = [
        'doctor_name',
        'patient_name',
        'created_at'
    ]
    search_fields = [
        'doctor_name',
        'patient_name'
    ]
    readonly_fields = [
        'id',
        'doctor_name',
        'patient_name',
        'input_data',
        'output_data',
        'created_at'
    ]
    ordering = ['-created_at']
    date_hierarchy = 'created_at'

    # 상세 페이지에서 필드 그룹화
    fieldsets = (
        ('기본 정보', {
            'fields': ('id', 'doctor_name', 'patient_name', 'created_at')
        }),
        ('입력 데이터', {
            'fields': ('input_data',),
            'classes': ('collapse',)
        }),
        ('출력 데이터', {
            'fields': ('output_data',),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        """관리자 페이지에서 직접 추가 불가"""
        return False

    def has_change_permission(self, request, obj=None):
        """관리자 페이지에서 수정 불가 (읽기 전용)"""
        return False

    def has_delete_permission(self, request, obj=None):
        """관리자 페이지에서 삭제 가능"""
        return True
