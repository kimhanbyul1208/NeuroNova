"""
단백질 조회 기록 모델
실제 3D 구조 데이터는 저장하지 않음 (트래픽 절감)
"""
from django.db import models
from django.contrib.auth.models import User


class ProteinViewLog(models.Model):
    """
    단백질 구조 조회 기록

    Note: 실제 단백질 구조 데이터는 저장하지 않습니다.
    외부 API에서 직접 가져오므로 서버 트래픽과 저장 공간을 절약합니다.
    """

    # 단백질 정보 (메타데이터만)
    protein_id = models.CharField(
        max_length=50,
        db_index=True,
        help_text="단백질 ID (예: 1HHO, 2GBL)"
    )
    protein_name = models.CharField(
        max_length=200,
        blank=True,
        help_text="단백질 이름 (선택사항)"
    )

    # 사용자 정보
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='protein_views',
        help_text="조회한 사용자"
    )

    # 조회 시간
    viewed_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
        help_text="조회 시각"
    )

    # 추가 메타데이터 (선택사항)
    source = models.CharField(
        max_length=50,
        default='RCSB_PDB',
        help_text="API 소스 (RCSB PDB, AlphaFold 등)"
    )

    class Meta:
        db_table = 'protein_view_logs'
        ordering = ['-viewed_at']
        indexes = [
            models.Index(fields=['user', '-viewed_at']),
            models.Index(fields=['protein_id', '-viewed_at']),
        ]
        verbose_name = '단백질 조회 기록'
        verbose_name_plural = '단백질 조회 기록'

    def __str__(self):
        return f"{self.user.username} viewed {self.protein_id} at {self.viewed_at}"


class ProteinBookmark(models.Model):
    """
    사용자 단백질 북마크
    자주 사용하는 단백질을 저장
    """

    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='protein_bookmarks'
    )
    protein_id = models.CharField(max_length=50)
    protein_name = models.CharField(max_length=200, blank=True)
    note = models.TextField(blank=True, help_text="사용자 메모")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'protein_bookmarks'
        unique_together = ['user', 'protein_id']
        ordering = ['-created_at']
        verbose_name = '단백질 북마크'
        verbose_name_plural = '단백질 북마크'

    def __str__(self):
        return f"{self.user.username}'s bookmark: {self.protein_id}"
