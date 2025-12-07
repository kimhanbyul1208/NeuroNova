"""
Core models for NeuroNova.
Base abstract models for inheritance.
"""
from django.db import models
from django.utils import timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class TimeStampedModel(models.Model):
    """
    Abstract base model with timestamp fields.
    All models should inherit from this for audit trail.
    """

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="생성일시",
        help_text="레코드가 생성된 시간",
        db_index=True
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="수정일시",
        help_text="레코드가 마지막으로 수정된 시간"
    )

    class Meta:
        abstract = True
        ordering = ['-created_at']

    def save(self, *args, **kwargs) -> None:
        """Override save to add logging."""
        is_new: bool = self.pk is None
        super().save(*args, **kwargs)

        action: str = "created" if is_new else "updated"
        logger.info(
            f"{self.__class__.__name__} {action}: ID={self.pk}"
        )


class SoftDeleteModel(models.Model):
    """
    Abstract base model with soft delete functionality.
    Important for medical data: never hard delete.
    """

    is_active = models.BooleanField(
        default=True,
        verbose_name="활성 상태",
        help_text="False인 경우 소프트 삭제된 상태"
    )
    deleted_at = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name="삭제일시",
        help_text="소프트 삭제된 시간"
    )

    class Meta:
        abstract = True

    def soft_delete(self) -> None:
        """
        Soft delete the record instead of hard delete.
        Medical data integrity: Never permanently delete.
        """
        self.is_active = False
        self.deleted_at = timezone.now()
        self.save()
        logger.warning(
            f"{self.__class__.__name__} soft deleted: ID={self.pk}"
        )

    def restore(self) -> None:
        """Restore a soft-deleted record."""
        self.is_active = True
        self.deleted_at = None
        self.save()
        logger.info(
            f"{self.__class__.__name__} restored: ID={self.pk}"
        )


class BaseModel(TimeStampedModel, SoftDeleteModel):
    """
    Base model combining timestamp and soft delete.
    Most models in NeuroNova should inherit from this.
    """

    class Meta:
        abstract = True


class APIUsageLog(models.Model):
    """
    외부 API 사용량 추적
    트래픽, 비용, 성능 모니터링을 위한 로그
    """

    SERVICE_CHOICES = [
        ('drugbank', 'DrugBank'),
        ('alphafold', 'AlphaFold'),
        ('pubchem', 'PubChem'),
        ('rcsb_pdb', 'RCSB PDB'),
        ('firebase', 'Firebase FCM'),
    ]

    user = models.ForeignKey(
        'auth.User',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='api_usage_logs',
        help_text="API를 호출한 사용자 (내부 서비스 호출 시 null)"
    )

    service = models.CharField(
        max_length=50,
        choices=SERVICE_CHOICES,
        db_index=True,
        help_text="외부 API 서비스 이름"
    )

    endpoint = models.CharField(
        max_length=500,
        help_text="호출한 API 엔드포인트"
    )

    method = models.CharField(
        max_length=10,
        default='GET',
        help_text="HTTP 메소드"
    )

    status_code = models.IntegerField(
        null=True,
        help_text="HTTP 응답 상태 코드"
    )

    response_time_ms = models.IntegerField(
        null=True,
        help_text="응답 시간 (밀리초)"
    )

    cached = models.BooleanField(
        default=False,
        help_text="캐시에서 반환됨"
    )

    error_message = models.TextField(
        blank=True,
        help_text="에러 메시지 (실패 시)"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="API 호출 시각"
    )

    class Meta:
        db_table = 'api_usage_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['service', '-created_at']),
            models.Index(fields=['user', '-created_at']),
            models.Index(fields=['status_code', '-created_at']),
        ]
        verbose_name = 'API 사용 로그'
        verbose_name_plural = 'API 사용 로그'

    def __str__(self):
        status = f"{self.status_code}" if self.status_code else "pending"
        cached_str = " (cached)" if self.cached else ""
        return f"{self.service} - {self.endpoint} [{status}]{cached_str}"
