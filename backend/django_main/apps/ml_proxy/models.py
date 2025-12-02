from django.db import models


class InferenceLog(models.Model):
    """
    ML 추론 결과 저장 모델
    Flask ML 서버로의 추론 요청 및 결과를 기록합니다.
    """
    doctor_name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="담당 의사 이름",
        help_text="추론을 요청한 의사의 이름"
    )
    patient_name = models.CharField(
        max_length=100,
        db_index=True,
        verbose_name="환자 이름",
        help_text="추론 대상 환자의 이름"
    )
    input_data = models.JSONField(
        verbose_name="입력 데이터",
        help_text="Flask ML 서버로 전송한 추론 요청 데이터 (전체 Payload)"
    )
    output_data = models.JSONField(
        verbose_name="출력 데이터",
        help_text="Flask ML 서버로부터 받은 추론 결과 데이터"
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="생성 일시",
        help_text="추론 기록이 생성된 시간"
    )

    class Meta:
        db_table = 'ml_inference_log'
        verbose_name = 'ML 추론 로그'
        verbose_name_plural = 'ML 추론 로그'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['doctor_name', 'patient_name']),
            models.Index(fields=['-created_at']),
        ]

    def __str__(self):
        return f"{self.doctor_name} - {self.patient_name} ({self.created_at.strftime('%Y-%m-%d %H:%M')})"
