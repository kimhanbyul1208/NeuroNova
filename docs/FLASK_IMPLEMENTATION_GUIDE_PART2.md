# Flask AI Inference Engine - Implementation Guide (Part 2)

> Continuation of [FLASK_IMPLEMENTATION_GUIDE.md](FLASK_IMPLEMENTATION_GUIDE.md)

## Table of Contents

6. [API Endpoint Implementation](#api-endpoint-implementation)
7. [Asynchronous Task Processing](#asynchronous-task-processing)
8. [Error Handling & Logging](#error-handling--logging)
9. [Performance Optimization](#performance-optimization)
10. [Testing Strategies](#testing-strategies)
11. [Deployment Configuration](#deployment-configuration)

---

## API Endpoint Implementation

### api/ct_routes.py

```python
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
import numpy as np
import base64
import io
from PIL import Image
import logging

from app.models.model_loader import get_model_loader
from app.models.ct_classifier import CTClassifier
from app.preprocessing.dicom_processor import DICOMProcessor
from app.preprocessing.image_normalizer import ImageNormalizer
from app.xai.grad_cam import GradCAM
from app.utils.validators import validate_file, validate_request_data
from app.utils.security import require_jwt

logger = logging.getLogger(__name__)

ct_bp = Blueprint('ct', __name__, url_prefix='/predict')


@ct_bp.route('/ct_classification', methods=['POST'])
@require_jwt
def predict_ct_classification():
    """
    CT-based tumor classification endpoint

    Request:
        - image: DICOM/PNG/JPG file
        - patient_id: string
        - xai: boolean (default: false)
        - xai_methods: list of strings ['grad_cam']

    Response:
        - success: boolean
        - result: prediction results
        - xai: XAI results (if requested)
    """
    try:
        # Validate request
        if 'image' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No image file provided'
            }), 400

        file = request.files['image']
        patient_id = request.form.get('patient_id', 'unknown')
        enable_xai = request.form.get('xai', 'false').lower() == 'true'
        xai_methods = request.form.getlist('xai_methods') or ['grad_cam']

        # Validate file
        validation_error = validate_file(file, max_size_mb=50)
        if validation_error:
            return jsonify({
                'success': False,
                'error': validation_error
            }), 400

        # Load image
        filename = secure_filename(file.filename)
        logger.info(f"Processing CT image: {filename} for patient {patient_id}")

        if filename.lower().endswith(('.dcm', '.dicom')):
            # DICOM processing
            temp_path = f'/tmp/{filename}'
            file.save(temp_path)
            pixel_array, metadata = DICOMProcessor.read_dicom(temp_path)

            # Apply windowing for brain CT
            image = DICOMProcessor.apply_windowing(pixel_array, 40, 80)
        else:
            # Regular image formats
            img = Image.open(file.stream).convert('L')  # Grayscale
            image = np.array(img)

        # Preprocess
        normalizer = ImageNormalizer()
        image = normalizer.pad_to_square(image)
        image = normalizer.resize_image(image, (224, 224))
        image = normalizer.normalize_intensity(image, method='zscore')

        # Load model and predict
        model_loader = get_model_loader(current_app.config)
        ct_model = model_loader.load_onnx_model(current_app.config['CT_MODEL_PATH'])
        classifier = CTClassifier(ct_model, current_app.config)

        prediction = classifier.predict(image)

        # Prepare response
        response_data = {
            'success': True,
            'patient_id': patient_id,
            'result': prediction,
            'metadata': {
                'model_version': '1.0.0',
                'input_shape': image.shape,
                'processing_time_ms': 0  # Will be calculated by decorator
            }
        }

        # Generate XAI if requested
        if enable_xai and 'grad_cam' in xai_methods:
            try:
                xai_result = generate_gradcam_for_ct(
                    image,
                    prediction['predicted_class_id'],
                    model_loader,
                    current_app.config
                )
                response_data['xai'] = xai_result
            except Exception as e:
                logger.warning(f"XAI generation failed: {str(e)}")
                response_data['xai_error'] = str(e)

        logger.info(f"CT classification completed: {prediction['predicted_class']} "
                   f"(confidence: {prediction['confidence']:.3f})")

        return jsonify(response_data), 200

    except ValueError as e:
        logger.error(f"Validation error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

    except Exception as e:
        logger.error(f"CT classification error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'detail': str(e) if current_app.debug else None
        }), 500


def generate_gradcam_for_ct(image: np.ndarray,
                           target_class: int,
                           model_loader,
                           config) -> dict:
    """Generate Grad-CAM for CT classification"""
    import torch

    # Load PyTorch model for Grad-CAM (ONNX doesn't support gradients)
    pytorch_model = model_loader.load_pytorch_model(
        config['CT_MODEL_PATH'].replace('.onnx', '.pt')
    )

    # Prepare input
    input_tensor = torch.from_numpy(image).unsqueeze(0).to(config['DEVICE'])

    # Generate Grad-CAM
    grad_cam = GradCAM(pytorch_model, target_layer=config['GRAD_CAM_LAYER'])
    heatmap, confidence = grad_cam.generate_cam(input_tensor, target_class)

    # Overlay on original image
    original_uint8 = (image[0] * 255).astype(np.uint8) if image.max() <= 1 else image[0].astype(np.uint8)
    overlayed = grad_cam.overlay_heatmap(heatmap, original_uint8)

    # Find important regions
    regions = grad_cam.find_important_regions(heatmap, threshold=0.7)

    # Encode images to base64
    heatmap_base64 = encode_image_to_base64(heatmap)
    overlay_base64 = encode_image_to_base64(overlayed)

    return {
        'grad_cam': {
            'heatmap_base64': heatmap_base64,
            'overlay_base64': overlay_base64,
            'important_regions': regions[:5],  # Top 5 regions
            'confidence': confidence
        }
    }


def encode_image_to_base64(image: np.ndarray) -> str:
    """Encode numpy array to base64 PNG"""
    if image.dtype != np.uint8:
        image = (image * 255).astype(np.uint8)

    pil_img = Image.fromarray(image)
    buffer = io.BytesIO()
    pil_img.save(buffer, format='PNG')
    img_base64 = base64.b64encode(buffer.getvalue()).decode('utf-8')

    return img_base64
```

### api/biomarker_routes.py

```python
from flask import Blueprint, request, jsonify
import numpy as np
import pandas as pd
import logging

from app.models.model_loader import get_model_loader
from app.xai.shap_explainer import SHAPExplainer
from app.utils.validators import validate_biomarker_data
from app.utils.security import require_jwt

logger = logging.getLogger(__name__)

biomarker_bp = Blueprint('biomarker', __name__, url_prefix='/predict')

# Feature names for biomarker model
BIOMARKER_FEATURES = [
    'age', 'gender', 'tumor_size_mm', 'tumor_location',
    'EGFR_mutation', 'TP53_mutation', 'IDH1_mutation',
    'Ki67_index', 'MGMT_methylation', 'histology_grade',
    'symptom_duration_days', 'prior_surgery', 'prior_radiation'
]


@biomarker_bp.route('/biomarker_prediction', methods=['POST'])
@require_jwt
def predict_biomarker():
    """
    Biomarker-based tumor prediction endpoint

    Request:
        {
            "patient_id": "P123456",
            "biomarkers": {
                "age": 55,
                "gender": "M",
                "tumor_size_mm": 35.5,
                "EGFR_mutation": 1,
                ...
            },
            "xai": true,
            "xai_methods": ["shap"]
        }

    Response:
        {
            "success": true,
            "result": {
                "predicted_tumor_type": "Glioblastoma",
                "predicted_metastasis": true,
                "metastasis_probability": 0.78,
                "probabilities": {...}
            },
            "xai": {
                "shap": {
                    "feature_importance": [...],
                    "top_features": [...]
                }
            }
        }
    """
    try:
        # Parse request
        data = request.get_json()

        if not data:
            return jsonify({
                'success': False,
                'error': 'No JSON data provided'
            }), 400

        patient_id = data.get('patient_id', 'unknown')
        biomarkers = data.get('biomarkers', {})
        enable_xai = data.get('xai', False)
        xai_methods = data.get('xai_methods', ['shap'])

        # Validate biomarker data
        validation_error = validate_biomarker_data(biomarkers, BIOMARKER_FEATURES)
        if validation_error:
            return jsonify({
                'success': False,
                'error': validation_error
            }), 400

        logger.info(f"Processing biomarker prediction for patient {patient_id}")

        # Prepare input features
        feature_values = [biomarkers.get(feat, 0) for feat in BIOMARKER_FEATURES]
        X = np.array(feature_values).reshape(1, -1)

        # Load model
        model_loader = get_model_loader(current_app.config)
        model = model_loader.load_sklearn_model(current_app.config['BIOMARKER_MODEL_PATH'])

        # Predict
        prediction = model.predict(X)[0]
        probabilities = model.predict_proba(X)[0]

        # Get class names (example)
        class_names = ['Glioma', 'Meningioma', 'Pituitary', 'Glioblastoma']
        predicted_class = class_names[prediction]

        # Calculate metastasis probability (example: based on specific classes)
        metastasis_probability = probabilities[3]  # Glioblastoma
        predicted_metastasis = metastasis_probability > 0.5

        result = {
            'predicted_tumor_type': predicted_class,
            'predicted_tumor_type_id': int(prediction),
            'confidence': float(probabilities[prediction]),
            'predicted_metastasis': predicted_metastasis,
            'metastasis_probability': float(metastasis_probability),
            'probabilities': {
                cls: float(prob)
                for cls, prob in zip(class_names, probabilities)
            }
        }

        response_data = {
            'success': True,
            'patient_id': patient_id,
            'result': result,
            'metadata': {
                'model_version': '1.0.0',
                'num_features': len(BIOMARKER_FEATURES)
            }
        }

        # Generate SHAP explanations if requested
        if enable_xai and 'shap' in xai_methods:
            try:
                # Load background data for SHAP
                background_data = load_background_data()  # Implement this
                shap_explainer = SHAPExplainer(model, background_data)

                # Generate explanation
                shap_result = shap_explainer.explain_single(X, BIOMARKER_FEATURES)

                response_data['xai'] = {
                    'shap': {
                        'feature_importance': shap_result['contributions'][:10],
                        'top_positive_features': shap_result['top_positive'],
                        'top_negative_features': shap_result['top_negative'],
                        'baseline_value': shap_result['baseline_value']
                    }
                }

                logger.info(f"SHAP explanation generated. Top feature: "
                           f"{shap_result['contributions'][0]['feature']}")

            except Exception as e:
                logger.warning(f"SHAP generation failed: {str(e)}")
                response_data['xai_error'] = str(e)

        logger.info(f"Biomarker prediction completed: {predicted_class} "
                   f"(confidence: {result['confidence']:.3f})")

        return jsonify(response_data), 200

    except Exception as e:
        logger.error(f"Biomarker prediction error: {str(e)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'detail': str(e) if current_app.debug else None
        }), 500


def load_background_data() -> np.ndarray:
    """Load background data for SHAP baseline"""
    # In production, load from stored file
    # For now, return dummy data
    return np.random.randn(100, len(BIOMARKER_FEATURES))
```

---

## Asynchronous Task Processing

### tasks/celery_app.py

```python
from celery import Celery
from app.config import config_by_name
import os

# Get configuration
env = os.getenv('FLASK_ENV', 'development')
config = config_by_name[env]

# Create Celery instance
celery = Celery(
    'neuronova_inference',
    broker=config.CELERY_BROKER_URL,
    backend=config.CELERY_RESULT_BACKEND
)

# Configure Celery
celery.conf.update(
    task_serializer=config.CELERY_TASK_SERIALIZER,
    result_serializer=config.CELERY_RESULT_SERIALIZER,
    accept_content=config.CELERY_ACCEPT_CONTENT,
    timezone=config.CELERY_TIMEZONE,
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    task_soft_time_limit=240,  # 4 minutes
    worker_prefetch_multiplier=1,  # One task at a time
    worker_max_tasks_per_child=50,  # Restart worker after 50 tasks
)

# Auto-discover tasks
celery.autodiscover_tasks(['app.tasks'])
```

### tasks/inference_tasks.py

```python
from celery import Task
from app.tasks.celery_app import celery
from app.models.model_loader import get_model_loader
from app.models.mri_segmentor import MRISegmentor
from app.preprocessing.image_normalizer import ImageNormalizer
import numpy as np
import base64
import io
import logging

logger = logging.getLogger(__name__)


class InferenceTask(Task):
    """Base task with model loading"""

    _model_loader = None

    @property
    def model_loader(self):
        if self._model_loader is None:
            from app.config import config_by_name
            config = config_by_name['production']
            self._model_loader = get_model_loader(config)
        return self._model_loader


@celery.task(bind=True, base=InferenceTask, name='tasks.mri_segmentation')
def async_mri_segmentation(self, image_data_base64: str, patient_id: str, options: dict):
    """
    Asynchronous MRI segmentation task

    Args:
        image_data_base64: Base64-encoded 3D MRI volume
        patient_id: Patient ID
        options: Additional options (enable_xai, etc.)

    Returns:
        Dict with segmentation results
    """
    try:
        logger.info(f"Starting MRI segmentation for patient {patient_id}")

        # Update task state
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Loading image data',
                'progress': 10
            }
        )

        # Decode image data
        image_bytes = base64.b64decode(image_data_base64)
        volume = np.load(io.BytesIO(image_bytes))  # Assuming numpy format

        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Preprocessing image',
                'progress': 30
            }
        )

        # Preprocess
        normalizer = ImageNormalizer()
        volume_normalized = normalizer.normalize_intensity(volume, method='zscore')

        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Running segmentation model',
                'progress': 50
            }
        )

        # Load model and segment
        from app.config import config_by_name
        config = config_by_name['production']

        mri_model = self.model_loader.load_pytorch_model(config.MRI_MODEL_PATH)
        segmentor = MRISegmentor(mri_model, config)

        result = segmentor.predict(volume_normalized)

        # Update progress
        self.update_state(
            state='PROCESSING',
            meta={
                'status': 'Encoding results',
                'progress': 90
            }
        )

        # Encode segmentation mask to base64
        mask_bytes = io.BytesIO()
        np.save(mask_bytes, result['segmentation_mask'])
        mask_base64 = base64.b64encode(mask_bytes.getvalue()).decode('utf-8')

        # Prepare response
        response = {
            'success': True,
            'patient_id': patient_id,
            'result': {
                'segmentation_mask_base64': mask_base64,
                'segmentation_shape': result['segmentation_shape'],
                'statistics': result['statistics'],
                'tumor_detected': result['tumor_detected']
            },
            'metadata': {
                'model_version': '1.0.0',
                'processing_time_seconds': self.request.time_start
            }
        }

        logger.info(f"MRI segmentation completed for patient {patient_id}")

        return response

    except Exception as e:
        logger.error(f"MRI segmentation task failed: {str(e)}", exc_info=True)

        # Update task state to FAILURE
        self.update_state(
            state='FAILURE',
            meta={
                'error': str(e),
                'patient_id': patient_id
            }
        )

        raise


@celery.task(bind=True, name='tasks.batch_ct_classification')
def batch_ct_classification(self, image_list: list, patient_ids: list):
    """
    Batch CT classification task

    Args:
        image_list: List of base64-encoded images
        patient_ids: List of patient IDs

    Returns:
        List of prediction results
    """
    results = []

    total = len(image_list)

    for idx, (image_data, patient_id) in enumerate(zip(image_list, patient_ids)):
        try:
            # Update progress
            progress = int((idx / total) * 100)
            self.update_state(
                state='PROCESSING',
                meta={
                    'status': f'Processing image {idx + 1}/{total}',
                    'progress': progress
                }
            )

            # Decode and process (simplified)
            image_bytes = base64.b64decode(image_data)
            # ... perform classification ...

            results.append({
                'patient_id': patient_id,
                'success': True,
                'result': {}  # Add actual result
            })

        except Exception as e:
            logger.error(f"Batch processing error for {patient_id}: {str(e)}")
            results.append({
                'patient_id': patient_id,
                'success': False,
                'error': str(e)
            })

    return {
        'success': True,
        'total': total,
        'successful': sum(1 for r in results if r['success']),
        'results': results
    }
```

### Async API endpoint (api/mri_routes.py)

```python
from flask import Blueprint, request, jsonify
from app.tasks.inference_tasks import async_mri_segmentation
import logging

mri_bp = Blueprint('mri', __name__, url_prefix='/predict')
logger = logging.getLogger(__name__)


@mri_bp.route('/mri_segmentation', methods=['POST'])
def predict_mri_segmentation():
    """
    MRI segmentation endpoint (asynchronous)

    Returns task_id for polling
    """
    try:
        # ... validate and prepare data ...

        # Submit async task
        task = async_mri_segmentation.delay(
            image_data_base64=image_data,
            patient_id=patient_id,
            options={'xai': enable_xai}
        )

        return jsonify({
            'success': True,
            'task_id': task.id,
            'status': 'PENDING',
            'message': 'Segmentation task submitted',
            'poll_url': f'/predict/task_status/{task.id}'
        }), 202

    except Exception as e:
        logger.error(f"Task submission error: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@mri_bp.route('/task_status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    """Get status of async task"""
    from app.tasks.celery_app import celery

    task = celery.AsyncResult(task_id)

    if task.state == 'PENDING':
        response = {
            'state': task.state,
            'status': 'Task is waiting to be processed'
        }
    elif task.state == 'PROCESSING':
        response = {
            'state': task.state,
            'status': task.info.get('status', ''),
            'progress': task.info.get('progress', 0)
        }
    elif task.state == 'SUCCESS':
        response = {
            'state': task.state,
            'result': task.result
        }
    elif task.state == 'FAILURE':
        response = {
            'state': task.state,
            'error': str(task.info)
        }
    else:
        response = {
            'state': task.state,
            'status': str(task.info)
        }

    return jsonify(response), 200
```

---

## Error Handling & Logging

### utils/validators.py

```python
import os
from werkzeug.datastructures import FileStorage
from typing import Optional


def validate_file(file: FileStorage, max_size_mb: int = 50) -> Optional[str]:
    """
    Validate uploaded file

    Returns:
        Error message if invalid, None if valid
    """
    if not file:
        return "No file provided"

    if file.filename == '':
        return "Empty filename"

    # Check file extension
    allowed_extensions = {'dcm', 'dicom', 'nii', 'gz', 'png', 'jpg', 'jpeg'}
    ext = file.filename.rsplit('.', 1)[-1].lower()

    if ext not in allowed_extensions:
        return f"Invalid file type. Allowed: {', '.join(allowed_extensions)}"

    # Check file size
    file.seek(0, os.SEEK_END)
    file_size = file.tell()
    file.seek(0)

    max_size_bytes = max_size_mb * 1024 * 1024

    if file_size > max_size_bytes:
        return f"File too large. Maximum size: {max_size_mb}MB"

    if file_size == 0:
        return "Empty file"

    return None


def validate_biomarker_data(biomarkers: dict, required_features: list) -> Optional[str]:
    """Validate biomarker data"""
    missing = []

    for feature in required_features:
        if feature not in biomarkers:
            missing.append(feature)

    if missing:
        return f"Missing required features: {', '.join(missing)}"

    return None
```

### Centralized error handling (app/__init__.py)

```python
from flask import Flask, jsonify
import logging
from logging.handlers import RotatingFileHandler
import os


def create_app(config_name='development'):
    """Flask application factory"""
    app = Flask(__name__)

    # Load configuration
    from app.config import config_by_name
    app.config.from_object(config_by_name[config_name])

    # Setup logging
    setup_logging(app)

    # Register blueprints
    from app.api.ct_routes import ct_bp
    from app.api.mri_routes import mri_bp
    from app.api.biomarker_routes import biomarker_bp
    from app.api.health_routes import health_bp

    app.register_blueprint(ct_bp)
    app.register_blueprint(mri_bp)
    app.register_blueprint(biomarker_bp)
    app.register_blueprint(health_bp)

    # Error handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'success': False,
            'error': 'Bad request',
            'message': str(error)
        }), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'success': False,
            'error': 'Not found',
            'message': 'The requested endpoint does not exist'
        }), 404

    @app.errorhandler(500)
    def internal_error(error):
        app.logger.error(f"Internal server error: {str(error)}", exc_info=True)
        return jsonify({
            'success': False,
            'error': 'Internal server error',
            'message': 'An unexpected error occurred'
        }), 500

    return app


def setup_logging(app):
    """Configure logging"""
    if not app.debug:
        # Create logs directory
        if not os.path.exists('logs'):
            os.mkdir('logs')

        # File handler
        file_handler = RotatingFileHandler(
            'logs/flask_inference.log',
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=10
        )

        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))

        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)

    app.logger.setLevel(logging.INFO)
    app.logger.info('NeuroNova Flask Inference Engine startup')
```

---

## Performance Optimization

### Model warmup on startup

```python
# app/__init__.py

def create_app(config_name='development'):
    app = Flask(__name__)
    # ... configuration ...

    # Warmup models on startup
    with app.app_context():
        warmup_models(app)

    return app


def warmup_models(app):
    """Warmup all models to reduce first-request latency"""
    from app.models.model_loader import get_model_loader
    import torch

    logger = app.logger
    logger.info("Warming up models...")

    try:
        model_loader = get_model_loader(app.config)

        # CT Classifier
        ct_model = model_loader.load_onnx_model(app.config['CT_MODEL_PATH'])
        model_loader.warmup_model(ct_model, (1, 3, 224, 224))
        logger.info("✓ CT classifier warmed up")

        # MRI Segmentor
        mri_model = model_loader.load_pytorch_model(app.config['MRI_MODEL_PATH'])
        model_loader.warmup_model(mri_model, (1, 1, 128, 128, 128))
        logger.info("✓ MRI segmentor warmed up")

        # Biomarker Predictor
        biomarker_model = model_loader.load_sklearn_model(app.config['BIOMARKER_MODEL_PATH'])
        logger.info("✓ Biomarker predictor loaded")

        logger.info("All models warmed up successfully")

    except Exception as e:
        logger.error(f"Model warmup failed: {str(e)}", exc_info=True)
```

### Request batching

```python
# app/utils/batch_processor.py

import threading
import time
from queue import Queue
from typing import List, Callable


class BatchProcessor:
    """Batch multiple requests for efficient GPU utilization"""

    def __init__(self,
                 batch_fn: Callable,
                 max_batch_size: int = 8,
                 timeout_ms: int = 100):
        self.batch_fn = batch_fn
        self.max_batch_size = max_batch_size
        self.timeout_ms = timeout_ms / 1000.0

        self.queue = Queue()
        self.results = {}
        self.lock = threading.Lock()

        # Start processing thread
        self.thread = threading.Thread(target=self._process_loop, daemon=True)
        self.thread.start()

    def process(self, input_data):
        """Submit item for batch processing"""
        request_id = id(input_data)
        result_event = threading.Event()

        with self.lock:
            self.results[request_id] = {'event': result_event, 'result': None}

        self.queue.put((request_id, input_data))

        # Wait for result
        result_event.wait()

        with self.lock:
            result = self.results[request_id]['result']
            del self.results[request_id]

        return result

    def _process_loop(self):
        """Background thread for batch processing"""
        while True:
            batch = []
            request_ids = []

            # Collect batch
            deadline = time.time() + self.timeout_ms

            while len(batch) < self.max_batch_size and time.time() < deadline:
                try:
                    request_id, data = self.queue.get(timeout=0.01)
                    batch.append(data)
                    request_ids.append(request_id)
                except:
                    pass

            if not batch:
                continue

            # Process batch
            try:
                results = self.batch_fn(batch)

                # Distribute results
                with self.lock:
                    for request_id, result in zip(request_ids, results):
                        if request_id in self.results:
                            self.results[request_id]['result'] = result
                            self.results[request_id]['event'].set()

            except Exception as e:
                # Distribute error
                with self.lock:
                    for request_id in request_ids:
                        if request_id in self.results:
                            self.results[request_id]['result'] = {'error': str(e)}
                            self.results[request_id]['event'].set()
```

---

I'll complete the implementation guide with Testing and Deployment sections. Let me know if you'd like me to continue!