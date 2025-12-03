import requests
import logging
import os
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from .models import InferenceLog

logger = logging.getLogger(__name__)

# Flask ML 서버 설정 (환경 변수 사용)
FLASK_ML_SERVER_URL = os.getenv('FLASK_INFERENCE_URL', 'http://127.0.0.1:9000')
FLASK_API_KEY = os.getenv('FLASK_API_KEY', '')


@csrf_exempt
@require_http_methods(["POST"])
def predict_proxy(request):
    """
    Flask ML 서버로 추론 요청을 전달하고 결과를 저장합니다.

    요청 Body 예시:
    {
        "doctor_name": "김의사",
        "patient_name": "홍환자",
        "image_data": [...],
        "clinical_features": {...}
    }
    """
    try:
        import json

        # 요청 데이터 파싱
        try:
            request_data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON format"},
                status=400
            )

        # 필수 필드 확인
        doctor_name = request_data.get('doctor_name')
        patient_name = request_data.get('patient_name')

        if not doctor_name or not patient_name:
            return JsonResponse(
                {"error": "doctor_name and patient_name are required"},
                status=400
            )

        # Flask ML 서버로 요청 전달
        flask_url = f"{FLASK_ML_SERVER_URL}/api/predict"

        # API 키 헤더 준비
        headers = {}
        if FLASK_API_KEY:
            headers['X-API-Key'] = FLASK_API_KEY

        try:
            response = requests.post(
                flask_url,
                json=request_data,
                headers=headers,
                timeout=60
            )
            response.raise_for_status()

            # Flask 응답 데이터
            flask_response_data = response.json()

            # 추론 결과를 DB에 저장
            InferenceLog.objects.create(
                doctor_name=doctor_name,
                patient_name=patient_name,
                input_data=request_data,
                output_data=flask_response_data
            )

            logger.info(
                f"Inference logged: Doctor={doctor_name}, Patient={patient_name}"
            )

            # Flask 응답을 그대로 반환
            return JsonResponse(flask_response_data, status=response.status_code)

        except requests.exceptions.Timeout:
            return JsonResponse(
                {"error": "Flask server timeout"},
                status=504
            )
        except requests.exceptions.ConnectionError:
            return JsonResponse(
                {"error": "Cannot connect to Flask server"},
                status=503
            )
        except requests.exceptions.RequestException as e:
            logger.error(f"Flask request error: {str(e)}")
            return JsonResponse(
                {"error": f"Flask server error: {str(e)}"},
                status=502
            )

    except Exception as e:
        logger.error(f"Predict proxy error: {str(e)}")
        return JsonResponse(
            {"error": f"Internal server error: {str(e)}"},
            status=500
        )


@csrf_exempt
@require_http_methods(["GET"])
def status_proxy(request):
    """
    Flask ML 서버의 상태를 조회합니다. (단순 프록시)
    """
    try:
        flask_url = f"{FLASK_ML_SERVER_URL}/api/health"

        # API 키 헤더 준비
        headers = {}
        if FLASK_API_KEY:
            headers['X-API-Key'] = FLASK_API_KEY

        response = requests.get(flask_url, headers=headers, timeout=10)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        logger.error(f"Status proxy error: {str(e)}")
        return JsonResponse(
            {"error": f"Cannot connect to Flask server: {str(e)}"},
            status=503
        )


@csrf_exempt
@require_http_methods(["GET"])
def model_info_proxy(request):
    """
    Flask ML 서버의 모델 정보를 조회합니다. (단순 프록시)
    """
    try:
        flask_url = f"{FLASK_ML_SERVER_URL}/api/schema"

        # API 키 헤더 준비
        headers = {}
        if FLASK_API_KEY:
            headers['X-API-Key'] = FLASK_API_KEY

        response = requests.get(flask_url, headers=headers, timeout=10)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        logger.error(f"Model info proxy error: {str(e)}")
        return JsonResponse(
            {"error": f"Cannot connect to Flask server: {str(e)}"},
            status=503
        )


@csrf_exempt
@require_http_methods(["POST"])
def retrain_proxy(request):
    """
    Flask ML 서버에 재학습 요청을 전달합니다. (단순 프록시)
    """
    try:
        import json

        try:
            request_data = json.loads(request.body)
        except json.JSONDecodeError:
            request_data = {}

        flask_url = f"{FLASK_ML_SERVER_URL}/api/reload_model"

        # API 키 헤더 준비
        headers = {}
        if FLASK_API_KEY:
            headers['X-API-Key'] = FLASK_API_KEY

        response = requests.post(
            flask_url,
            json=request_data,
            headers=headers,
            timeout=300  # 재학습은 시간이 오래 걸릴 수 있음
        )
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        logger.error(f"Retrain proxy error: {str(e)}")
        return JsonResponse(
            {"error": f"Cannot connect to Flask server: {str(e)}"},
            status=503
        )


@csrf_exempt
@require_http_methods(["GET"])
def history_view(request):
    """
    저장된 추론 이력을 조회합니다.

    Query Parameters:
    - doctor: 의사 이름 (선택)
    - patient: 환자 이름 (선택)

    예시:
    - /ml/v1/history/?doctor=김의사&patient=홍환자  (의사 & 환자 모두 조회)
    - /ml/v1/history/?doctor=김의사  (해당 의사의 모든 기록)
    - /ml/v1/history/?patient=홍환자  (해당 환자의 모든 기록)
    - /ml/v1/history/  (전체 조회)
    """
    try:
        doctor_name = request.GET.get('doctor')
        patient_name = request.GET.get('patient')

        # 기본 쿼리셋
        queryset = InferenceLog.objects.all()

        # 조건에 따른 필터링
        if doctor_name and patient_name:
            # 의사 & 환자 모두 존재
            queryset = queryset.filter(
                doctor_name=doctor_name,
                patient_name=patient_name
            )
        elif doctor_name:
            # 의사만 존재
            queryset = queryset.filter(doctor_name=doctor_name)
        elif patient_name:
            # 환자만 존재
            queryset = queryset.filter(patient_name=patient_name)
        # 파라미터 없음: 전체 조회 (queryset 그대로 사용)

        # 결과를 JSON 형태로 변환
        results = []
        for log in queryset:
            results.append({
                'id': log.id,
                'doctor_name': log.doctor_name,
                'patient_name': log.patient_name,
                'input_data': log.input_data,
                'output_data': log.output_data,
                'created_at': log.created_at.isoformat()
            })

        return JsonResponse({
            'count': len(results),
            'results': results
        }, status=200)

    except Exception as e:
        logger.error(f"History view error: {str(e)}")
        return JsonResponse(
            {"error": f"Internal server error: {str(e)}"},
            status=500
        )


@csrf_exempt
@require_http_methods(["GET"])
def example_data_proxy(request):
    """
    Flask ML 서버의 예시 데이터를 조회합니다. (단순 프록시)
    """
    try:
        flask_url = f"{FLASK_ML_SERVER_URL}/api/example_data"

        # 쿼리 파라미터 전달
        params = request.GET.dict()

        # API 키 헤더 준비
        headers = {}
        if FLASK_API_KEY:
            headers['X-API-Key'] = FLASK_API_KEY

        response = requests.get(flask_url, params=params, headers=headers, timeout=10)
        return JsonResponse(response.json(), status=response.status_code)
    except Exception as e:
        logger.error(f"Example data proxy error: {str(e)}")
        return JsonResponse(
            {"error": f"Cannot connect to Flask server: {str(e)}"},
            status=503
        )
