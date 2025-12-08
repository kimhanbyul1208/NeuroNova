"""
Statistics and Analytics Views for NeuroNova CDSS.
Provides comprehensive statistics for patients, doctors, and system-wide analytics.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from collections import defaultdict
import logging

from apps.emr.models import Patient, Encounter
from apps.custom.models import PatientPredictionResult, Appointment, Doctor

logger = logging.getLogger(__name__)


class StatisticsViewSet(viewsets.ViewSet):
    """
    Comprehensive statistics and analytics API.
    """
    permission_classes = [IsAuthenticated]

    @swagger_auto_schema(
        operation_description="Get overall system statistics dashboard",
        responses={200: "Success"}
    )
    @action(detail=False, methods=['get'])
    def dashboard(self, request):
        """
        Get overall system dashboard statistics.
        """
        # Total counts
        total_patients = Patient.objects.filter(is_active=True).count()
        total_doctors = Doctor.objects.filter(is_active=True).count()
        total_predictions = PatientPredictionResult.objects.filter(is_active=True).count()

        # Appointments statistics
        today = timezone.now().date()
        upcoming_appointments = Appointment.objects.filter(
            scheduled_at__gte=timezone.now(),
            status='PENDING'
        ).count()

        # Recent predictions (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_predictions = PatientPredictionResult.objects.filter(
            created_at__gte=thirty_days_ago,
            is_active=True
        ).count()

        # Prediction class distribution
        prediction_distribution = PatientPredictionResult.objects.filter(
            is_active=True
        ).values('prediction_class').annotate(
            count=Count('id')
        ).order_by('-count')[:5]

        # Average confidence score
        avg_confidence = PatientPredictionResult.objects.filter(
            is_active=True
        ).aggregate(Avg('confidence_score'))['confidence_score__avg'] or 0

        # High-risk patients count
        high_risk_patients = PatientPredictionResult.objects.filter(
            is_active=True,
            confidence_score__gte=0.8
        ).values('patient').distinct().count()

        return Response({
            'total_patients': total_patients,
            'total_doctors': total_doctors,
            'total_predictions': total_predictions,
            'upcoming_appointments': upcoming_appointments,
            'recent_predictions_30d': recent_predictions,
            'high_risk_patients': high_risk_patients,
            'average_confidence': round(avg_confidence, 3),
            'prediction_distribution': list(prediction_distribution),
            'generated_at': timezone.now().isoformat()
        })

    @swagger_auto_schema(
        operation_description="Get patient-specific statistics",
        manual_parameters=[
            openapi.Parameter('patient_id', openapi.IN_QUERY, description="Patient ID", type=openapi.TYPE_INTEGER, required=True)
        ],
        responses={200: "Success"}
    )
    @action(detail=False, methods=['get'])
    def patient_stats(self, request):
        """
        Get comprehensive statistics for a specific patient.
        """
        patient_id = request.query_params.get('patient_id')

        if not patient_id:
            return Response(
                {"error": "patient_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            patient = Patient.objects.get(pk=patient_id, is_active=True)
        except Patient.DoesNotExist:
            return Response(
                {"error": "Patient not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Total predictions
        total_predictions = PatientPredictionResult.objects.filter(
            patient=patient,
            is_active=True
        ).count()

        # Prediction history
        predictions = PatientPredictionResult.objects.filter(
            patient=patient,
            is_active=True
        ).order_by('-created_at')

        # Monthly trend (last 12 months)
        twelve_months_ago = timezone.now() - timedelta(days=365)
        monthly_predictions = predictions.filter(
            created_at__gte=twelve_months_ago
        )

        monthly_data = defaultdict(lambda: {'count': 0, 'avg_confidence': []})
        for pred in monthly_predictions:
            month_key = pred.created_at.strftime('%Y-%m')
            monthly_data[month_key]['count'] += 1
            monthly_data[month_key]['avg_confidence'].append(pred.confidence_score)

        monthly_trend = []
        for month, data in sorted(monthly_data.items()):
            avg_conf = sum(data['avg_confidence']) / len(data['avg_confidence']) if data['avg_confidence'] else 0
            monthly_trend.append({
                'month': month,
                'prediction_count': data['count'],
                'average_confidence': round(avg_conf, 3),
                'risk_score': int(avg_conf * 100)
            })

        # Latest prediction
        latest_prediction = predictions.first()
        latest_result = None
        if latest_prediction:
            latest_result = {
                'prediction_class': latest_prediction.prediction_class,
                'confidence': latest_prediction.confidence_score,
                'date': latest_prediction.created_at.isoformat(),
                'doctor_feedback': latest_prediction.doctor_feedback
            }

        # Prediction class breakdown
        class_breakdown = predictions.values('prediction_class').annotate(
            count=Count('id')
        ).order_by('-count')

        # Appointments summary
        total_appointments = Appointment.objects.filter(
            patient=patient
        ).count()

        upcoming_appointments = Appointment.objects.filter(
            patient=patient,
            scheduled_at__gte=timezone.now()
        ).count()

        return Response({
            'patient_id': patient.id,
            'patient_name': patient.full_name,
            'total_predictions': total_predictions,
            'total_appointments': total_appointments,
            'upcoming_appointments': upcoming_appointments,
            'latest_prediction': latest_result,
            'monthly_trend': monthly_trend,
            'prediction_classes': list(class_breakdown),
            'generated_at': timezone.now().isoformat()
        })

    @swagger_auto_schema(
        operation_description="Get doctor-specific statistics",
        manual_parameters=[
            openapi.Parameter('doctor_id', openapi.IN_QUERY, description="Doctor ID", type=openapi.TYPE_INTEGER, required=True)
        ],
        responses={200: "Success"}
    )
    @action(detail=False, methods=['get'])
    def doctor_stats(self, request):
        """
        Get comprehensive statistics for a specific doctor.
        """
        doctor_id = request.query_params.get('doctor_id')

        if not doctor_id:
            return Response(
                {"error": "doctor_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            doctor = Doctor.objects.get(pk=doctor_id, is_active=True)
        except Doctor.DoesNotExist:
            return Response(
                {"error": "Doctor not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Patients assigned
        total_patients = doctor.doctor_patients.filter(is_active=True).count()

        # Predictions reviewed
        reviewed_predictions = PatientPredictionResult.objects.filter(
            doctor=doctor,
            is_active=True,
            confirmed_at__isnull=False
        ).count()

        pending_reviews = PatientPredictionResult.objects.filter(
            doctor=doctor,
            is_active=True,
            confirmed_at__isnull=True
        ).count()

        # Feedback distribution
        feedback_distribution = PatientPredictionResult.objects.filter(
            doctor=doctor,
            is_active=True,
            doctor_feedback__isnull=False
        ).values('doctor_feedback').annotate(
            count=Count('id')
        )

        # Appointments statistics
        total_appointments = Appointment.objects.filter(
            doctor=doctor
        ).count()

        upcoming_appointments = Appointment.objects.filter(
            doctor=doctor,
            scheduled_at__gte=timezone.now()
        ).count()

        # Recent activity (last 30 days)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        recent_reviews = PatientPredictionResult.objects.filter(
            doctor=doctor,
            confirmed_at__gte=thirty_days_ago
        ).count()

        return Response({
            'doctor_id': doctor.id,
            'doctor_name': doctor.user.get_full_name(),
            'specialty': doctor.specialty,
            'total_patients': total_patients,
            'reviewed_predictions': reviewed_predictions,
            'pending_reviews': pending_reviews,
            'total_appointments': total_appointments,
            'upcoming_appointments': upcoming_appointments,
            'recent_reviews_30d': recent_reviews,
            'feedback_distribution': list(feedback_distribution),
            'generated_at': timezone.now().isoformat()
        })

    @swagger_auto_schema(
        operation_description="Get prediction accuracy and model performance statistics",
        responses={200: "Success"}
    )
    @action(detail=False, methods=['get'])
    def model_performance(self, request):
        """
        Get AI model performance statistics.
        """
        # Total predictions
        total_predictions = PatientPredictionResult.objects.filter(
            is_active=True
        ).count()

        # Predictions with doctor feedback
        reviewed_predictions = PatientPredictionResult.objects.filter(
            is_active=True,
            doctor_feedback__isnull=False
        ).count()

        # Feedback breakdown
        agree_count = PatientPredictionResult.objects.filter(
            doctor_feedback='AGREE',
            is_active=True
        ).count()

        disagree_count = PatientPredictionResult.objects.filter(
            doctor_feedback='DISAGREE',
            is_active=True
        ).count()

        needs_info_count = PatientPredictionResult.objects.filter(
            doctor_feedback='NEEDS_MORE_INFO',
            is_active=True
        ).count()

        # Calculate agreement rate
        agreement_rate = (agree_count / reviewed_predictions * 100) if reviewed_predictions > 0 else 0

        # Average confidence by prediction class
        class_performance = PatientPredictionResult.objects.filter(
            is_active=True
        ).values('prediction_class').annotate(
            avg_confidence=Avg('confidence_score'),
            count=Count('id')
        ).order_by('-count')[:10]

        # High confidence predictions
        high_confidence_count = PatientPredictionResult.objects.filter(
            is_active=True,
            confidence_score__gte=0.8
        ).count()

        # Low confidence predictions
        low_confidence_count = PatientPredictionResult.objects.filter(
            is_active=True,
            confidence_score__lt=0.6
        ).count()

        return Response({
            'total_predictions': total_predictions,
            'reviewed_predictions': reviewed_predictions,
            'pending_review': total_predictions - reviewed_predictions,
            'feedback_summary': {
                'agree': agree_count,
                'disagree': disagree_count,
                'needs_more_info': needs_info_count
            },
            'agreement_rate': round(agreement_rate, 2),
            'confidence_distribution': {
                'high_confidence': high_confidence_count,
                'low_confidence': low_confidence_count
            },
            'class_performance': [
                {
                    'class': item['prediction_class'],
                    'average_confidence': round(item['avg_confidence'], 3),
                    'count': item['count']
                }
                for item in class_performance
            ],
            'generated_at': timezone.now().isoformat()
        })
