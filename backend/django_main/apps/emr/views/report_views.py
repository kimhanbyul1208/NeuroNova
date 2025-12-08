from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.shortcuts import get_object_or_404
from django.utils import timezone
from apps.emr.models import Patient
from apps.custom.models import PatientPredictionResult
from apps.ml_proxy.models import InferenceLog
import logging

logger = logging.getLogger(__name__)


class PatientReportViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get the latest multi-modal report for a patient",
        manual_parameters=[
            openapi.Parameter('patient_id', openapi.IN_QUERY, description="Patient ID", type=openapi.TYPE_INTEGER)
        ],
        responses={200: "Success"}
    )
    @action(detail=False, methods=['get'])
    def latest(self, request):
        patient_id = request.query_params.get('patient_id')

        if not patient_id:
            return Response(
                {"error": "patient_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get patient
        patient = get_object_or_404(Patient, pk=patient_id)

        # Get latest predictions for this patient (최대 3개의 최신 예측)
        predictions = PatientPredictionResult.objects.filter(
            patient=patient,
            is_active=True
        ).order_by('-created_at')[:3]

        # If no predictions, return mock data for testing
        if not predictions.exists():
            logger.warning(f"No predictions found for patient {patient_id}, returning fallback data")
            return self._get_fallback_data(patient_id)

        # Build multi-modal report
        report_data = self._build_report(patient, predictions)

        return Response(report_data)

    def _build_report(self, patient, predictions):
        """
        Build comprehensive multi-modal report from prediction results.
        Aggregates CT, MRI, and Biomarker model results.
        """
        models_data = {}
        overall_confidences = []

        # Process each prediction
        for pred in predictions:
            model_type = self._classify_model_type(pred.model_name)

            if model_type and model_type not in models_data:
                # Extract probabilities
                probabilities = []
                if isinstance(pred.probabilities, dict):
                    probabilities = [
                        {"label": k, "value": v}
                        for k, v in pred.probabilities.items()
                    ]
                elif isinstance(pred.probabilities, list):
                    probabilities = pred.probabilities

                models_data[model_type] = {
                    "model_name": pred.model_name,
                    "result": pred.prediction_class,
                    "confidence": pred.confidence_score,
                    "details": {
                        "probabilities": probabilities,
                        "xai_available": bool(pred.xai_image_path),
                        "xai_path": pred.xai_image_path if pred.xai_image_path else None,
                        "feature_importance": pred.feature_importance if pred.feature_importance else {},
                        "doctor_feedback": pred.doctor_feedback if pred.doctor_feedback else None,
                        "doctor_note": pred.doctor_note if pred.doctor_note else None,
                        "confirmed_at": pred.confirmed_at.isoformat() if pred.confirmed_at else None
                    }
                }
                overall_confidences.append(pred.confidence_score)

        # Calculate overall score (0-100)
        if overall_confidences:
            overall_score = int(sum(overall_confidences) / len(overall_confidences) * 100)
        else:
            overall_score = 0

        # Determine risk level
        risk_level = self._calculate_risk_level(overall_score, predictions)

        # Generate AI summary
        summary = self._generate_summary(patient, predictions, models_data)

        return {
            "patient_id": patient.id,
            "patient_name": patient.full_name,
            "generated_at": timezone.now().isoformat(),
            "overall_score": overall_score,
            "risk_level": risk_level,
            "summary": summary,
            "models": models_data,
            "total_predictions": len(predictions)
        }

    def _classify_model_type(self, model_name):
        """
        Classify model type based on model name.
        Returns: 'ct', 'mri', 'biomarker', or None
        """
        model_name_lower = model_name.lower()

        if 'ct' in model_name_lower or 'classification' in model_name_lower:
            return 'ct'
        elif 'mri' in model_name_lower or 'segmentation' in model_name_lower:
            return 'mri'
        elif 'biomarker' in model_name_lower or 'marker' in model_name_lower or 'risk' in model_name_lower:
            return 'biomarker'

        return None

    def _calculate_risk_level(self, overall_score, predictions):
        """
        Calculate risk level based on score and prediction classes.
        """
        if overall_score >= 80:
            return "HIGH"
        elif overall_score >= 60:
            return "MODERATE"
        else:
            return "LOW"

    def _generate_summary(self, patient, predictions, models_data):
        """
        Generate AI summary text based on prediction results.
        """
        if not predictions:
            return "예측 결과가 없습니다."

        latest_pred = predictions[0]
        tumor_type = latest_pred.prediction_class
        confidence = latest_pred.confidence_score

        summary_parts = [
            f"환자 {patient.full_name}의 뇌 영상 분석 결과,"
        ]

        # Add model-specific findings
        if 'ct' in models_data:
            ct_result = models_data['ct']['result']
            ct_conf = models_data['ct']['confidence']
            summary_parts.append(
                f"CT 영상에서 {ct_result} 소견이 {ct_conf:.1%} 신뢰도로 확인되었습니다."
            )

        if 'mri' in models_data:
            mri_result = models_data['mri']['result']
            summary_parts.append(f"MRI 분석 결과 {mri_result}가 관찰되었습니다.")

        if 'biomarker' in models_data:
            bio_result = models_data['biomarker']['result']
            summary_parts.append(f"바이오마커 분석 결과 {bio_result}로 분류되었습니다.")

        # Add recommendation
        if confidence >= 0.8:
            summary_parts.append("추가 정밀 검사 및 전문의 상담이 권장됩니다.")
        else:
            summary_parts.append("추가 검사를 통한 확인이 필요합니다.")

        return " ".join(summary_parts)

    def _get_fallback_data(self, patient_id):
        """
        Return fallback mock data when no predictions exist.
        This is for testing and backward compatibility.
        """
        mock_data = {
            "patient_id": patient_id,
            "generated_at": timezone.now().isoformat(),
            "overall_score": 0,
            "risk_level": "UNKNOWN",
            "summary": "아직 AI 분석 결과가 없습니다. 진단을 진행해주세요.",
            "models": {},
            "total_predictions": 0,
            "note": "No prediction data available. This is fallback data."
        }

        return Response(mock_data)

    @swagger_auto_schema(
        operation_description="Get patient risk score history statistics",
        manual_parameters=[
            openapi.Parameter('patient_id', openapi.IN_QUERY, description="Patient ID", type=openapi.TYPE_INTEGER),
            openapi.Parameter('months', openapi.IN_QUERY, description="Number of months to retrieve (default 6)", type=openapi.TYPE_INTEGER)
        ],
        responses={200: "Success"}
    )
    @action(detail=False, methods=['get'])
    def statistics(self, request):
        patient_id = request.query_params.get('patient_id')
        months = int(request.query_params.get('months', 6))

        if not patient_id:
            return Response(
                {"error": "patient_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get patient
        patient = get_object_or_404(Patient, pk=patient_id)

        # Get all predictions ordered by date
        predictions = PatientPredictionResult.objects.filter(
            patient=patient,
            is_active=True
        ).order_by('created_at')

        if not predictions.exists():
            logger.warning(f"No prediction history for patient {patient_id}")
            return Response({
                "patient_id": patient_id,
                "history": [],
                "note": "No prediction history available"
            })

        # Group predictions by month and calculate average score
        from datetime import timedelta
        from collections import defaultdict

        monthly_data = defaultdict(list)

        for pred in predictions:
            month_key = pred.created_at.strftime('%Y-%m')
            monthly_data[month_key].append(pred.confidence_score)

        # Build history data
        statistics_data = []
        for month, scores in sorted(monthly_data.items()):
            avg_score = int(sum(scores) / len(scores) * 100)
            risk_level = self._calculate_risk_level(avg_score, predictions)

            statistics_data.append({
                "date": month,
                "score": avg_score,
                "risk_level": risk_level,
                "prediction_count": len(scores)
            })

        # Limit to requested number of months (most recent)
        statistics_data = statistics_data[-months:]

        return Response({
            "patient_id": patient_id,
            "patient_name": patient.full_name,
            "history": statistics_data,
            "total_months": len(statistics_data)
        })
