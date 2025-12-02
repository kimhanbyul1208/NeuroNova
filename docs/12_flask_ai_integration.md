# Flask AI 통합 가이드 (Flask AI Integration Guide)

> **참고**: 이 문서는 Flask AI 추론 엔진의 설계 및 구현을 위한 통합 가이드입니다. 모델 학습 및 배포는 별도로 다룹니다.

## 목차

1. [개요](#1-개요)
2. [API 설계](#2-api-설계)
3. [구현 가이드](#3-구현-가이드)
    - [프로젝트 구조](#31-프로젝트-구조)
    - [환경 설정](#32-환경-설정)
    - [모델 로딩 및 관리](#33-모델-로딩-및-관리)
    - [이미지 전처리 파이프라인](#34-이미지-전처리-파이프라인)
    - [XAI 구현](#35-xai-구현)
    - [API 엔드포인트 구현](#36-api-엔드포인트-구현)
    - [비동기 작업 처리](#37-비동기-작업-처리)
    - [에러 처리 및 로깅](#38-에러-처리-및-로깅)
    - [성능 최적화](#39-성능-최적화)
    - [테스트 전략](#310-테스트-전략)
    - [배포 설정](#311-배포-설정)

---

## 1. 개요

Flask AI 추론 엔진은 NeuroNova CDSS 시스템의 핵심 AI 컴포넌트로, 3가지 주요 AI 모델을 제공합니다:

1.  **CT 기반 뇌종양 분류** (Classification)
2.  **MRI 기반 종양 세분화** (Segmentation)
3.  **바이오마커 기반 예측** (Biomarker Prediction)

각 모델은 **설명 가능한 AI(XAI)** 기능을 포함하여 의료진이 AI 예측을 신뢰할 수 있도록 합니다.

---

## 2. API 설계

### 2.1 개요

#### 2.1.1 목적
NeuroNova AI 추론 엔진은 뇌종양 진단을 위한 3가지 AI 모델을 제공하며, Django Backend와 RESTful API를 통해 통신합니다.

#### 2.1.2 제공 모델

| 모델 ID | 모델명 | 입력 | 출력 | 용도 |
|---------|--------|------|------|------|
| `ct_classification` | 뇌종양 종류 예측 | CT 이미지 | 종양 종류 (Glioma/Meningioma/Pituitary) | Classification |
| `mri_segmentation` | 뇌종양 Segmentation | MRI 이미지 | Segmentation Mask | Image-to-Image |
| `biomarker_prediction` | 바이오마커 기반 예측 | 바이오마커 데이터 | 종양 종류 + 전이 조직 + 전이 정도 | Classification |

#### 2.1.3 XAI (설명 가능 AI)
- **SHAP (SHapley Additive exPlanations)**: Feature importance
- **Grad-CAM (Gradient-weighted Class Activation Mapping)**: 이미지 영역 중요도

### 2.2 시스템 아키텍처

#### 2.2.1 통신 구조

```
[Flutter App]      [React Web]
      ↓                 ↓
              [Nginx]
                 │
                 ├─────────────┐
                 │             │
      [Django (Gunicorn)]  [Flask AI (Gunicorn)]
                 │             │
                 │             ├─────→ [GPU/ML Models]
                 │             │       (ONNX, PyTorch)
                 │             │
                 │             ├─────→ [Celery Queue]
                 │                     (Redis)
                 ↓
          [MySQL + Redis]
```

#### 2.2.2 배포 환경

**개발 환경**:
- Flask: `http://localhost:5000`
- Django: `http://localhost:8000`

**프로덕션 환경**:
- Flask: `http://flask:5000` (Docker 내부)
- Django: `http://django:8000`

### 2.3 기본 구조 API

#### 2.3.1 서버 상태 확인

**엔드포인트**: `GET /health`

**목적**: AI 서버 및 모델 로딩 상태 확인

**요청**:
```http
GET /health HTTP/1.1
Host: flask:5000
```

**응답**:
```json
{
  "status": "healthy",
  "version": "1.0.0",
  "models": {
    "ct_classification": {
      "loaded": true,
      "version": "v2.1.0",
      "last_updated": "2025-11-20T10:30:00Z"
    },
    "mri_segmentation": {
      "loaded": true,
      "version": "v1.5.0",
      "last_updated": "2025-11-15T14:20:00Z"
    },
    "biomarker_prediction": {
      "loaded": true,
      "version": "v1.0.0",
      "last_updated": "2025-11-10T09:00:00Z"
    }
  },
  "gpu_available": true,
  "gpu_devices": ["NVIDIA GeForce RTX 3090"],
  "memory_usage_mb": 2048,
  "uptime_seconds": 86400
}
```

### 2.4 예측 API

#### 2.4.1 CT 기반 뇌종양 분류

**엔드포인트**: `POST /predict/ct_classification`

**목적**: CT 이미지에서 뇌종양 종류 예측

**요청**:
```http
POST /predict/ct_classification HTTP/1.1
Host: flask:5000
Content-Type: multipart/form-data
Authorization: Bearer <jwt_token>

{
  "image": <file>,  // CT DICOM or PNG/JPEG
  "patient_id": "P123456",  // 익명화된 ID
  "request_id": "REQ_20251128_001",
  "xai": true,  // Grad-CAM 요청
  "xai_methods": ["grad_cam"],
  "metadata": {
    "slice_thickness": 2.5,
    "kvp": 120,
    "study_date": "2025-11-28"
  }
}
```

**응답** (성공):
```json
{
  "success": true,
  "request_id": "REQ_20251128_001",
  "model_id": "ct_classification",
  "model_version": "v2.1.0",
  "inference_time_ms": 125,
  "result": {
    "predicted_class": "Glioma",
    "confidence": 0.92,
    "probabilities": {
      "Glioma": 0.92,
      "Meningioma": 0.05,
      "Pituitary": 0.02,
      "No Tumor": 0.01
    }
  },
  "xai": {
    "grad_cam": {
      "heatmap_base64": "data:image/png;base64,iVBORw0KGgo...",
      "overlay_base64": "data:image/png;base64,iVBORw0KGgo...",
      "important_regions": [
        {
          "x": 120,
          "y": 140,
          "width": 50,
          "height": 50,
          "importance": 0.95
        }
      ]
    }
  }
}
```

#### 2.4.2 MRI 기반 뇌종양 Segmentation

**엔드포인트**: `POST /predict/mri_segmentation`

**목적**: MRI 이미지에서 종양 영역 세그멘테이션 (비동기 권장)

**요청**:
```http
POST /predict/mri_segmentation HTTP/1.1
Host: flask:5000
Content-Type: multipart/form-data

{
  "image": <file>,  // MRI DICOM or NIfTI
  "patient_id": "P123456",
  "request_id": "REQ_20251128_002",
  "sequence_type": "T1",
  "xai": true
}
```

**응답** (Task 생성 - 비동기):
```json
{
  "success": true,
  "task_id": "TASK_550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "estimated_time_seconds": 10,
  "status_url": "/predict/task_status/TASK_550e8400-e29b-41d4-a716-446655440000"
}
```

#### 2.4.3 바이오마커 기반 종양 예측

**엔드포인트**: `POST /predict/biomarker_prediction`

**요청**:
```http
POST /predict/biomarker_prediction HTTP/1.1
Content-Type: application/json

{
  "patient_id": "P123456",
  "biomarkers": {
    "age": 55,
    "gender": "M",
    "tumor_markers": { "CEA": 5.2, ... }
  },
  "xai": true
}
```

### 2.5 에러 코드

| 코드 | 의미 | HTTP 상태 |
|------|------|-----------|
| `INVALID_REQUEST` | 잘못된 요청 형식 | 400 |
| `INVALID_IMAGE_FORMAT` | 지원하지 않는 이미지 형식 | 400 |
| `IMAGE_TOO_LARGE` | 이미지 크기 초과 | 413 |
| `MODEL_NOT_LOADED` | 모델 로딩 실패 | 503 |
| `MODEL_INFERENCE_ERROR` | 모델 추론 오류 | 500 |
| `XAI_GENERATION_ERROR` | XAI 생성 실패 | 500 |
| `UNAUTHORIZED` | 인증 실패 | 401 |
| `RATE_LIMIT_EXCEEDED` | 요청 제한 초과 | 429 |
| `INTERNAL_SERVER_ERROR` | 서버 내부 오류 | 500 |

---

## 3. 구현 가이드

### 3.1 프로젝트 구조

```
backend/flask_inference/
├── app/
│   ├── __init__.py              # Flask 앱 팩토리
│   ├── config.py                # 설정 관리
│   ├── models/                  # AI 모델 관리
│   │   ├── __init__.py
│   │   ├── model_loader.py      # 모델 로딩 및 캐싱
│   │   ├── ct_classifier.py     # CT 분류 모델
│   │   ├── mri_segmentor.py     # MRI 분할 모델
│   │   └── biomarker_predictor.py
│   ├── preprocessing/           # 이미지 전처리
│   │   ├── __init__.py
│   │   ├── dicom_processor.py   # DICOM 파일 처리
│   │   ├── image_normalizer.py  # 이미지 정규화
│   │   └── augmentation.py      # 데이터 증강
│   ├── xai/                     # 설명 가능한 AI
│   │   ├── __init__.py
│   │   ├── grad_cam.py          # Grad-CAM 구현
│   │   ├── shap_explainer.py    # SHAP 구현
│   │   └── visualization.py     # XAI 시각화
│   ├── api/                     # API 엔드포인트
│   │   ├── __init__.py
│   │   ├── ct_routes.py         # CT 분류 라우트
│   │   ├── mri_routes.py        # MRI 분할 라우트
│   │   ├── biomarker_routes.py  # 바이오마커 예측 라우트
│   │   └── health_routes.py     # 헬스 체크 엔드포인트
│   ├── tasks/                   # Celery 태스크
│   │   ├── __init__.py
│   │   ├── celery_app.py        # Celery 설정
│   │   └── inference_tasks.py   # 비동기 추론 태스크
│   └── utils/                   # 유틸리티
│       ├── __init__.py
│       ├── validators.py        # 입력 검증
│       ├── security.py          # 인증 및 보안
│       └── metrics.py           # 성능 메트릭
├── models/                      # 저장된 AI 모델 파일
│   ├── ct_classifier/
│   │   ├── model.onnx           # ONNX 모델 파일
│   │   ├── metadata.json        # 모델 메타데이터
│   │   └── preprocessing.json   # 전처리 설정
│   ├── mri_segmentor/
│   │   └── model.pt             # PyTorch 모델
│   └── biomarker_predictor/
│       └── model.pkl            # Scikit-learn 모델
├── tests/
│   ├── test_models.py
│   ├── test_preprocessing.py
│   ├── test_xai.py
│   └── test_api.py
├── requirements.txt
├── Dockerfile
└── wsgi.py
```

### 3.2 환경 설정

#### requirements.txt

```txt
Flask==3.0.0
Flask-CORS==4.0.0
Flask-Limiter==3.5.0
gunicorn==21.2.0
gevent==23.9.1
torch==2.1.0
torchvision==0.16.0
onnxruntime-gpu==1.16.3
pydicom==2.4.4
SimpleITK==2.3.1
nibabel==5.2.0
opencv-python==4.8.1.78
Pillow==10.1.0
shap==0.43.0
celery==5.3.4
redis==5.0.1
prometheus-client==0.19.0
PyJWT==2.8.0
python-dotenv==1.0.0
```

#### config.py

```python
import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class Config:
    """기본 설정"""
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:8000').split(',')

    # 모델 경로
    MODEL_BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
    CT_MODEL_PATH = os.path.join(MODEL_BASE_DIR, 'ct_classifier', 'model.onnx')
    MRI_MODEL_PATH = os.path.join(MODEL_BASE_DIR, 'mri_segmentor', 'model.pt')
    BIOMARKER_MODEL_PATH = os.path.join(MODEL_BASE_DIR, 'biomarker_predictor', 'model.pkl')

    # 추론 설정
    MAX_IMAGE_SIZE_MB = 50
    ALLOWED_EXTENSIONS = {'dcm', 'dicom', 'nii', 'nii.gz', 'png', 'jpg', 'jpeg'}
    BATCH_SIZE = 8
    DEVICE = 'cuda' if os.getenv('USE_GPU', 'true').lower() == 'true' else 'cpu'

    # XAI 설정
    ENABLE_XAI = True
    GRAD_CAM_LAYER = 'layer4'  # ResNet 예시
    SHAP_NUM_SAMPLES = 100

    # Celery (비동기 처리)
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_TIMEZONE = 'Asia/Seoul'

    # 보안
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    MAX_REQUESTS_PER_MINUTE = 100

class DevelopmentConfig(Config):
    """개발 환경 설정"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'

class ProductionConfig(Config):
    """프로덕션 환경 설정"""
    DEBUG = False
    TESTING = False
    LOG_LEVEL = 'WARNING'
    MAX_REQUESTS_PER_MINUTE = 50

config_by_name: Dict[str, Any] = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
```

### 3.3 모델 로딩 및 관리

#### models/model_loader.py

```python
import os
import json
import logging
from typing import Dict, Any, Optional
from functools import lru_cache
import torch
import onnxruntime as ort
import pickle

logger = logging.getLogger(__name__)

class ModelLoader:
    """모델 로딩 및 캐싱 중앙 관리"""

    def __init__(self, config):
        self.config = config
        self.device = config.DEVICE
        self._model_cache: Dict[str, Any] = {}

    @lru_cache(maxsize=3)
    def load_onnx_model(self, model_path: str) -> ort.InferenceSession:
        """ONNX 모델 로드 (최적화 포함)"""
        logger.info(f"Loading ONNX model from {model_path}")
        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] \
                    if self.device == 'cuda' else ['CPUExecutionProvider']
        
        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        session = ort.InferenceSession(model_path, sess_options=sess_options, providers=providers)
        logger.info(f"ONNX model loaded successfully on {providers[0]}")
        return session

    @lru_cache(maxsize=3)
    def load_pytorch_model(self, model_path: str, model_class=None) -> torch.nn.Module:
        """PyTorch 모델 로드"""
        logger.info(f"Loading PyTorch model from {model_path}")
        device = torch.device(self.device)

        if model_class:
            model = model_class()
            model.load_state_dict(torch.load(model_path, map_location=device))
        else:
            model = torch.load(model_path, map_location=device)

        model.to(device)
        model.eval()
        return model

    @lru_cache(maxsize=3)
    def load_sklearn_model(self, model_path: str):
        """Scikit-learn 모델 로드"""
        with open(model_path, 'rb') as f:
            model = pickle.load(f)
        return model

    def warmup_model(self, model, input_shape: tuple):
        """더미 입력으로 모델 웜업"""
        logger.info(f"Warming up model with input shape {input_shape}")
        if isinstance(model, ort.InferenceSession):
            dummy_input = {model.get_inputs()[0].name: torch.randn(input_shape).numpy()}
            for _ in range(3):
                model.run(None, dummy_input)
        elif isinstance(model, torch.nn.Module):
            dummy_input = torch.randn(input_shape).to(self.device)
            with torch.no_grad():
                for _ in range(3):
                    model(dummy_input)

# 전역 모델 로더 인스턴스
_model_loader: Optional[ModelLoader] = None

def get_model_loader(config) -> ModelLoader:
    global _model_loader
    if _model_loader is None:
        _model_loader = ModelLoader(config)
    return _model_loader
```

### 3.4 이미지 전처리 파이프라인

#### preprocessing/dicom_processor.py

```python
import pydicom
import numpy as np
from typing import Tuple

class DICOMProcessor:
    """DICOM 의료 이미지 처리"""

    @staticmethod
    def read_dicom(file_path: str) -> Tuple[np.ndarray, dict]:
        """DICOM 파일 읽기 및 픽셀 데이터 추출"""
        dcm = pydicom.dcmread(file_path)
        pixel_array = dcm.pixel_array.astype(np.float32)
        
        metadata = {
            'patient_id': str(getattr(dcm, 'PatientID', 'Unknown')),
            'modality': str(getattr(dcm, 'Modality', 'Unknown')),
            'slice_thickness': float(getattr(dcm, 'SliceThickness', 1.0)),
            'pixel_spacing': getattr(dcm, 'PixelSpacing', [1.0, 1.0]),
        }
        return pixel_array, metadata

    @staticmethod
    def apply_windowing(pixel_array: np.ndarray, window_center: float, window_width: float) -> np.ndarray:
        """CT 이미지 Windowing 적용 (Brain window: WC=40, WW=80)"""
        lower = window_center - window_width / 2
        upper = window_center + window_width / 2
        windowed = np.clip(pixel_array, lower, upper)
        windowed = (windowed - lower) / (upper - lower) * 255.0
        return windowed.astype(np.uint8)
```

#### preprocessing/image_normalizer.py

```python
import numpy as np
import cv2

class ImageNormalizer:
    """이미지 정규화 및 전처리"""

    @staticmethod
    def normalize_intensity(image: np.ndarray, method: str = 'zscore') -> np.ndarray:
        """이미지 강도 정규화 (zscore, minmax)"""
        if method == 'zscore':
            mean = np.mean(image)
            std = np.std(image)
            normalized = (image - mean) / (std + 1e-8)
        elif method == 'minmax':
            min_val = np.min(image)
            max_val = np.max(image)
            normalized = (image - min_val) / (max_val - min_val + 1e-8)
        return normalized.astype(np.float32)

    @staticmethod
    def resize_image(image: np.ndarray, target_size: Tuple[int, int]) -> np.ndarray:
        """이미지 크기 조정"""
        if image.shape[:2] == target_size:
            return image
        return cv2.resize(image, target_size)
```

### 3.5 XAI 구현

#### xai/grad_cam.py

```python
import numpy as np
import torch
import torch.nn.functional as F
import cv2

class GradCAM:
    """Gradient-weighted Class Activation Mapping"""

    def __init__(self, model, target_layer: str):
        self.model = model
        self.model.eval()
        self.target_layer = self._get_target_layer(target_layer)
        self.gradients = None
        self.activations = None
        
        self.target_layer.register_forward_hook(self._forward_hook)
        self.target_layer.register_backward_hook(self._backward_hook)

    def _get_target_layer(self, layer_name: str):
        for name, module in self.model.named_modules():
            if name == layer_name:
                return module
        raise ValueError(f"Layer {layer_name} not found")

    def _forward_hook(self, module, input, output):
        self.activations = output.detach()

    def _backward_hook(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()

    def generate_cam(self, input_tensor: torch.Tensor, target_class: int = None):
        """Grad-CAM 히트맵 생성"""
        input_tensor = input_tensor.requires_grad_(True)
        output = self.model(input_tensor)

        if target_class is None:
            target_class = output.argmax(dim=1).item()

        confidence = F.softmax(output, dim=1)[0, target_class].item()
        
        self.model.zero_grad()
        output[0, target_class].backward()

        gradients = self.gradients[0]
        activations = self.activations[0]
        weights = torch.mean(gradients, dim=[1, 2])

        cam = torch.zeros(activations.shape[1:], dtype=torch.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]

        cam = F.relu(cam).cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        
        return cam, confidence
```

### 3.6 API 엔드포인트 구현

#### api/ct_routes.py

```python
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import numpy as np
from app.models.model_loader import get_model_loader
from app.models.ct_classifier import CTClassifier
from app.preprocessing.dicom_processor import DICOMProcessor
from app.preprocessing.image_normalizer import ImageNormalizer

ct_bp = Blueprint('ct', __name__, url_prefix='/predict')

@ct_bp.route('/ct_classification', methods=['POST'])
def predict_ct_classification():
    """CT 기반 뇌종양 분류 엔드포인트"""
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'error': 'No image file'}), 400

        file = request.files['image']
        patient_id = request.form.get('patient_id', 'unknown')
        
        # 이미지 로드 및 전처리
        # ... (DICOM 처리 및 정규화 코드)
        
        # 모델 로드 및 예측
        model_loader = get_model_loader(current_app.config)
        ct_model = model_loader.load_onnx_model(current_app.config['CT_MODEL_PATH'])
        classifier = CTClassifier(ct_model, current_app.config)
        
        prediction = classifier.predict(image)
        
        return jsonify({
            'success': True,
            'patient_id': patient_id,
            'result': prediction
        }), 200

    except Exception as e:
        current_app.logger.error(f"Error: {str(e)}")
        return jsonify({'success': False, 'error': str(e)}), 500
```

### 3.7 비동기 작업 처리

#### tasks/celery_app.py

```python
from celery import Celery
from app.config import config_by_name
import os

env = os.getenv('FLASK_ENV', 'development')
config = config_by_name[env]

celery = Celery(
    'neuronova_inference',
    broker=config.CELERY_BROKER_URL,
    backend=config.CELERY_RESULT_BACKEND
)
celery.conf.update(
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    timezone='Asia/Seoul'
)
```

#### tasks/inference_tasks.py

```python
from app.tasks.celery_app import celery
from app.models.model_loader import get_model_loader
from app.models.mri_segmentor import MRISegmentor

@celery.task(bind=True, name='tasks.mri_segmentation')
def async_mri_segmentation(self, image_data_base64: str, patient_id: str, options: dict):
    """비동기 MRI 세그멘테이션 태스크"""
    try:
        self.update_state(state='PROCESSING', meta={'progress': 10})
        
        # 이미지 디코딩 및 전처리
        # ...
        
        # 모델 로드 및 예측
        # ...
        
        return {
            'success': True,
            'patient_id': patient_id,
            'result': result
        }
    except Exception as e:
        self.update_state(state='FAILURE', meta={'error': str(e)})
        raise
```

### 3.8 에러 처리 및 로깅

```python
# app/__init__.py

def create_app(config_name='development'):
    app = Flask(__name__)
    # ...
    
    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"Internal server error: {str(error)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal server error'
        }), 500
        
    return app
```

### 3.9 성능 최적화

1.  **모델 웜업 (Warmup)**: 앱 시작 시 더미 데이터로 모델을 한 번 실행하여 첫 요청 지연 감소.
2.  **Request Batching**: 동시 요청을 모아 GPU 배치 처리 (구현 예시 참조).
3.  **ONNX Runtime**: PyTorch 모델을 ONNX로 변환하여 추론 속도 향상.

### 3.10 테스트 전략

```bash
# 전체 테스트 실행
pytest

# 커버리지 리포트 생성
pytest --cov=app --cov-report=html
```

### 3.11 배포 설정

#### Dockerfile

```dockerfile
FROM python:3.10-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y libgomp1 libglib2.0-0 libsm6 libxext6 libxrender-dev

# 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 코드 복사
COPY app/ ./app/
COPY models/ ./models/
COPY wsgi.py .

# 실행
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--worker-class", "gevent", "wsgi:app"]
```

#### Docker Compose (Production)

```yaml
version: '3.8'
services:
  flask_inference:
    build: .
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - USE_GPU=true
      - CELERY_BROKER_URL=redis://redis:6379/0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    depends_on:
      - redis

  celery_worker:
    build: .
    command: celery -A app.tasks.celery_app worker --loglevel=info
    environment:
      - FLASK_ENV=production
      - USE_GPU=true
      - CELERY_BROKER_URL=redis://redis:6379/0
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    depends_on:
      - redis

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

---

**Flask AI 통합 가이드 완료**
