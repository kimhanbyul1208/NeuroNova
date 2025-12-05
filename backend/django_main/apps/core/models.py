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
