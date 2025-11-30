# Flask AI Inference Engine - Implementation Guide (Part 3)

> Continuation of [FLASK_IMPLEMENTATION_GUIDE_PART2.md](FLASK_IMPLEMENTATION_GUIDE_PART2.md)

## Table of Contents

10. [Testing Strategies](#testing-strategies)
11. [Deployment Configuration](#deployment-configuration)
12. [Monitoring & Observability](#monitoring--observability)

---

## Testing Strategies

### tests/conftest.py

```python
import pytest
import numpy as np
from app import create_app
from app.models.model_loader import ModelLoader


@pytest.fixture
def app():
    """Create Flask app for testing"""
    app = create_app('testing')
    return app


@pytest.fixture
def client(app):
    """Flask test client"""
    return app.test_client()


@pytest.fixture
def model_loader(app):
    """Model loader instance"""
    return ModelLoader(app.config)


@pytest.fixture
def dummy_ct_image():
    """Generate dummy CT image"""
    return np.random.rand(224, 224).astype(np.float32)


@pytest.fixture
def dummy_mri_volume():
    """Generate dummy MRI 3D volume"""
    return np.random.rand(128, 128, 128).astype(np.float32)


@pytest.fixture
def dummy_biomarker_data():
    """Generate dummy biomarker data"""
    return {
        'age': 55,
        'gender': 1,  # M=1, F=0
        'tumor_size_mm': 35.5,
        'tumor_location': 2,  # Frontal lobe
        'EGFR_mutation': 1,
        'TP53_mutation': 0,
        'IDH1_mutation': 0,
        'Ki67_index': 25.5,
        'MGMT_methylation': 1,
        'histology_grade': 4,
        'symptom_duration_days': 90,
        'prior_surgery': 0,
        'prior_radiation': 0
    }


@pytest.fixture
def auth_headers():
    """JWT authentication headers"""
    # In production, generate actual JWT
    return {
        'Authorization': 'Bearer test-jwt-token'
    }
```

### tests/test_preprocessing.py

```python
import pytest
import numpy as np
from app.preprocessing.image_normalizer import ImageNormalizer
from app.preprocessing.dicom_processor import DICOMProcessor


class TestImageNormalizer:
    """Test image normalization functions"""

    def test_normalize_zscore(self):
        """Test z-score normalization"""
        normalizer = ImageNormalizer()

        image = np.random.rand(100, 100)
        normalized = normalizer.normalize_intensity(image, method='zscore')

        # Check mean ≈ 0, std ≈ 1
        assert abs(normalized.mean()) < 0.1
        assert abs(normalized.std() - 1.0) < 0.1

    def test_normalize_minmax(self):
        """Test min-max normalization"""
        normalizer = ImageNormalizer()

        image = np.random.rand(100, 100) * 100
        normalized = normalizer.normalize_intensity(image, method='minmax')

        # Check range [0, 1]
        assert normalized.min() >= 0
        assert normalized.max() <= 1

    def test_resize_image(self):
        """Test image resizing"""
        normalizer = ImageNormalizer()

        image = np.random.rand(512, 512)
        resized = normalizer.resize_image(image, (224, 224))

        assert resized.shape == (224, 224)

    def test_pad_to_square(self):
        """Test padding to square"""
        normalizer = ImageNormalizer()

        image = np.random.rand(100, 200)
        padded = normalizer.pad_to_square(image)

        assert padded.shape[0] == padded.shape[1]
        assert padded.shape[0] == 200


class TestDICOMProcessor:
    """Test DICOM processing"""

    def test_apply_windowing(self):
        """Test CT windowing"""
        # Simulate HU values
        pixel_array = np.array([[-100, 0, 40, 100, 300]])

        # Brain window: WC=40, WW=80 → [0, 80] HU
        windowed = DICOMProcessor.apply_windowing(pixel_array, 40, 80)

        assert windowed.dtype == np.uint8
        assert windowed.min() >= 0
        assert windowed.max() <= 255

    def test_hounsfield_normalization(self):
        """Test HU conversion"""
        pixel_array = np.array([[0, 1000, 2000]])

        hu_array = DICOMProcessor.apply_hounsfield_normalization(
            pixel_array,
            intercept=-1024,
            slope=1
        )

        # Check if clipped to [-100, 300]
        assert hu_array.min() >= -100
        assert hu_array.max() <= 300
```

### tests/test_models.py

```python
import pytest
import numpy as np
import torch
from app.models.ct_classifier import CTClassifier
from app.models.mri_segmentor import MRISegmentor


class TestCTClassifier:
    """Test CT classification model"""

    def test_predict_shape(self, model_loader, dummy_ct_image, app):
        """Test prediction output shape"""
        with app.app_context():
            model = model_loader.load_onnx_model(app.config['CT_MODEL_PATH'])
            classifier = CTClassifier(model, app.config)

            result = classifier.predict(dummy_ct_image)

            assert 'predicted_class' in result
            assert 'confidence' in result
            assert 'probabilities' in result
            assert result['confidence'] >= 0 and result['confidence'] <= 1

    def test_predict_class_names(self, model_loader, dummy_ct_image, app):
        """Test that predicted class is valid"""
        with app.app_context():
            model = model_loader.load_onnx_model(app.config['CT_MODEL_PATH'])
            classifier = CTClassifier(model, app.config)

            result = classifier.predict(dummy_ct_image)

            assert result['predicted_class'] in CTClassifier.TUMOR_CLASSES

    def test_probabilities_sum_to_one(self, model_loader, dummy_ct_image, app):
        """Test that probabilities sum to 1"""
        with app.app_context():
            model = model_loader.load_onnx_model(app.config['CT_MODEL_PATH'])
            classifier = CTClassifier(model, app.config)

            result = classifier.predict(dummy_ct_image)
            prob_sum = sum(result['probabilities'].values())

            assert abs(prob_sum - 1.0) < 0.01


class TestMRISegmentor:
    """Test MRI segmentation model"""

    def test_predict_shape(self, model_loader, dummy_mri_volume, app):
        """Test segmentation output shape"""
        with app.app_context():
            model = model_loader.load_pytorch_model(app.config['MRI_MODEL_PATH'])
            segmentor = MRISegmentor(model, app.config)

            result = segmentor.predict(dummy_mri_volume)

            assert 'segmentation_mask' in result
            assert 'statistics' in result
            assert result['segmentation_mask'].shape == dummy_mri_volume.shape

    def test_segmentation_labels(self, model_loader, dummy_mri_volume, app):
        """Test that segmentation uses valid labels"""
        with app.app_context():
            model = model_loader.load_pytorch_model(app.config['MRI_MODEL_PATH'])
            segmentor = MRISegmentor(model, app.config)

            result = segmentor.predict(dummy_mri_volume)
            mask = result['segmentation_mask']
            unique_labels = np.unique(mask)

            for label in unique_labels:
                assert label in MRISegmentor.SEGMENTATION_LABELS.keys()
```

### tests/test_xai.py

```python
import pytest
import numpy as np
import torch
from app.xai.grad_cam import GradCAM
from app.xai.shap_explainer import SHAPExplainer


class TestGradCAM:
    """Test Grad-CAM implementation"""

    def test_generate_cam(self, model_loader, app):
        """Test Grad-CAM heatmap generation"""
        with app.app_context():
            model = model_loader.load_pytorch_model(app.config['CT_MODEL_PATH'])
            grad_cam = GradCAM(model, target_layer='layer4')

            dummy_input = torch.randn(1, 3, 224, 224)
            heatmap, confidence = grad_cam.generate_cam(dummy_input)

            assert heatmap.shape[0] > 0
            assert heatmap.min() >= 0 and heatmap.max() <= 1
            assert confidence >= 0 and confidence <= 1

    def test_overlay_heatmap(self, model_loader, app):
        """Test heatmap overlay on image"""
        with app.app_context():
            model = model_loader.load_pytorch_model(app.config['CT_MODEL_PATH'])
            grad_cam = GradCAM(model, target_layer='layer4')

            heatmap = np.random.rand(224, 224)
            image = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)

            overlayed = grad_cam.overlay_heatmap(heatmap, image)

            assert overlayed.shape == image.shape
            assert overlayed.dtype == np.uint8

    def test_find_important_regions(self, model_loader, app):
        """Test important region detection"""
        with app.app_context():
            model = model_loader.load_pytorch_model(app.config['CT_MODEL_PATH'])
            grad_cam = GradCAM(model, target_layer='layer4')

            # Create synthetic heatmap with 2 hot regions
            heatmap = np.zeros((224, 224))
            heatmap[50:100, 50:100] = 0.9
            heatmap[150:200, 150:200] = 0.8

            regions = grad_cam.find_important_regions(heatmap, threshold=0.7)

            assert len(regions) >= 2
            assert all('x' in r and 'y' in r and 'width' in r for r in regions)


class TestSHAPExplainer:
    """Test SHAP implementation"""

    def test_explain_single(self, dummy_biomarker_data):
        """Test SHAP explanation for single prediction"""
        from sklearn.ensemble import RandomForestClassifier

        # Create dummy model
        X_train = np.random.rand(100, 13)
        y_train = np.random.randint(0, 4, 100)
        model = RandomForestClassifier(n_estimators=10, random_state=42)
        model.fit(X_train, y_train)

        # Create explainer
        explainer = SHAPExplainer(model, X_train)

        # Explain single prediction
        X_test = np.array([list(dummy_biomarker_data.values())])
        feature_names = list(dummy_biomarker_data.keys())

        result = explainer.explain_single(X_test, feature_names)

        assert 'contributions' in result
        assert 'top_positive' in result
        assert 'top_negative' in result
        assert len(result['contributions']) == len(feature_names)
```

### tests/test_api.py

```python
import pytest
import json
import io
from PIL import Image


class TestCTAPI:
    """Test CT classification API"""

    def test_ct_prediction_success(self, client, auth_headers):
        """Test successful CT prediction"""
        # Create dummy image
        img = Image.fromarray((np.random.rand(224, 224) * 255).astype(np.uint8))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        data = {
            'image': (img_bytes, 'test.png'),
            'patient_id': 'P123456',
            'xai': 'false'
        }

        response = client.post(
            '/predict/ct_classification',
            data=data,
            headers=auth_headers,
            content_type='multipart/form-data'
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert result['success'] is True
        assert 'result' in result
        assert 'predicted_class' in result['result']

    def test_ct_prediction_no_image(self, client, auth_headers):
        """Test CT prediction without image"""
        response = client.post(
            '/predict/ct_classification',
            data={},
            headers=auth_headers
        )

        assert response.status_code == 400
        result = json.loads(response.data)
        assert result['success'] is False

    def test_ct_prediction_with_xai(self, client, auth_headers):
        """Test CT prediction with Grad-CAM"""
        img = Image.fromarray((np.random.rand(224, 224) * 255).astype(np.uint8))
        img_bytes = io.BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        data = {
            'image': (img_bytes, 'test.png'),
            'patient_id': 'P123456',
            'xai': 'true',
            'xai_methods': 'grad_cam'
        }

        response = client.post(
            '/predict/ct_classification',
            data=data,
            headers=auth_headers,
            content_type='multipart/form-data'
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert 'xai' in result
        assert 'grad_cam' in result['xai']


class TestBiomarkerAPI:
    """Test biomarker prediction API"""

    def test_biomarker_prediction_success(self, client, dummy_biomarker_data, auth_headers):
        """Test successful biomarker prediction"""
        data = {
            'patient_id': 'P123456',
            'biomarkers': dummy_biomarker_data,
            'xai': False
        }

        response = client.post(
            '/predict/biomarker_prediction',
            data=json.dumps(data),
            headers={**auth_headers, 'Content-Type': 'application/json'}
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert result['success'] is True
        assert 'result' in result
        assert 'predicted_tumor_type' in result['result']

    def test_biomarker_prediction_with_shap(self, client, dummy_biomarker_data, auth_headers):
        """Test biomarker prediction with SHAP"""
        data = {
            'patient_id': 'P123456',
            'biomarkers': dummy_biomarker_data,
            'xai': True,
            'xai_methods': ['shap']
        }

        response = client.post(
            '/predict/biomarker_prediction',
            data=json.dumps(data),
            headers={**auth_headers, 'Content-Type': 'application/json'}
        )

        assert response.status_code == 200
        result = json.loads(response.data)
        assert 'xai' in result
        assert 'shap' in result['xai']
        assert 'feature_importance' in result['xai']['shap']

    def test_biomarker_missing_fields(self, client, auth_headers):
        """Test biomarker prediction with missing fields"""
        data = {
            'patient_id': 'P123456',
            'biomarkers': {'age': 55}  # Missing most fields
        }

        response = client.post(
            '/predict/biomarker_prediction',
            data=json.dumps(data),
            headers={**auth_headers, 'Content-Type': 'application/json'}
        )

        assert response.status_code == 400
        result = json.loads(response.data)
        assert result['success'] is False


class TestAsyncAPI:
    """Test asynchronous endpoints"""

    def test_mri_segmentation_async(self, client, auth_headers):
        """Test async MRI segmentation"""
        # Submit task
        response = client.post(
            '/predict/mri_segmentation',
            data={},  # Simplified
            headers=auth_headers
        )

        assert response.status_code == 202
        result = json.loads(response.data)
        assert 'task_id' in result
        assert result['status'] == 'PENDING'

    def test_task_status(self, client):
        """Test task status endpoint"""
        task_id = 'test-task-id-123'

        response = client.get(f'/predict/task_status/{task_id}')

        assert response.status_code == 200
        result = json.loads(response.data)
        assert 'state' in result
```

### Running tests

```bash
# Install test dependencies
pip install pytest pytest-cov pytest-mock

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_api.py

# Run with verbose output
pytest -v

# Run only unit tests (exclude integration)
pytest -m "not integration"
```

---

## Deployment Configuration

### Dockerfile

```dockerfile
# Multi-stage build for optimized image size

# Stage 1: Build stage
FROM python:3.10-slim AS builder

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

# Stage 2: Runtime stage
FROM python:3.10-slim

WORKDIR /app

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libgomp1 \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Python packages from builder
COPY --from=builder /root/.local /root/.local

# Make sure scripts in .local are usable
ENV PATH=/root/.local/bin:$PATH

# Copy application code
COPY app/ ./app/
COPY models/ ./models/
COPY wsgi.py .

# Create non-root user
RUN useradd -m -u 1000 flask && chown -R flask:flask /app
USER flask

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD python -c "import requests; requests.get('http://localhost:5000/health')"

# Run with gunicorn
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "--workers", "4", "--worker-class", "gevent", "--timeout", "300", "wsgi:app"]
```

### Docker Compose (Production)

```yaml
version: '3.8'

services:
  flask_inference:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: neuronova_flask
    restart: unless-stopped
    ports:
      - "5000:5000"
    environment:
      - FLASK_ENV=production
      - USE_GPU=true
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
      - LOG_LEVEL=INFO
    volumes:
      - ./models:/app/models:ro  # Read-only models
      - ./logs:/app/logs
    depends_on:
      - redis
    networks:
      - neuronova_network
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  celery_worker:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: neuronova_celery
    restart: unless-stopped
    command: celery -A app.tasks.celery_app worker --loglevel=info --concurrency=2
    environment:
      - FLASK_ENV=production
      - USE_GPU=true
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    volumes:
      - ./models:/app/models:ro
      - ./logs:/app/logs
    depends_on:
      - redis
    networks:
      - neuronova_network
    deploy:
      resources:
        limits:
          cpus: '4'
          memory: 8G
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  redis:
    image: redis:7-alpine
    container_name: neuronova_redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - neuronova_network

  flower:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: neuronova_flower
    restart: unless-stopped
    command: celery -A app.tasks.celery_app flower --port=5555
    ports:
      - "5555:5555"
    environment:
      - CELERY_BROKER_URL=redis://redis:6379/0
      - CELERY_RESULT_BACKEND=redis://redis:6379/0
    depends_on:
      - redis
      - celery_worker
    networks:
      - neuronova_network

volumes:
  redis_data:

networks:
  neuronova_network:
    driver: bridge
```

### wsgi.py

```python
"""WSGI entry point for production"""
import os
from app import create_app

# Get environment
env = os.getenv('FLASK_ENV', 'production')

# Create app
app = create_app(env)

if __name__ == '__main__':
    # For development only
    app.run(host='0.0.0.0', port=5000, debug=(env == 'development'))
```

### Nginx configuration (reverse proxy)

```nginx
# /etc/nginx/sites-available/neuronova_flask

upstream flask_inference {
    server localhost:5000;
}

server {
    listen 80;
    server_name ai.neuronova.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ai.neuronova.com;

    # SSL certificates
    ssl_certificate /etc/letsencrypt/live/ai.neuronova.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ai.neuronova.com/privkey.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Max upload size (50MB for medical images)
    client_max_body_size 50M;

    # Timeouts
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
    proxy_read_timeout 300s;

    # Proxy to Flask
    location / {
        proxy_pass http://flask_inference;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Disable buffering for streaming responses
        proxy_buffering off;
    }

    # Health check endpoint (no auth required)
    location /health {
        proxy_pass http://flask_inference;
        access_log off;
    }

    # Rate limiting for prediction endpoints
    location /predict/ {
        limit_req zone=prediction_limit burst=10 nodelay;
        proxy_pass http://flask_inference;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}

# Rate limit zone (100 requests per minute)
limit_req_zone $binary_remote_addr zone=prediction_limit:10m rate=100r/m;
```

---

## Monitoring & Observability

### Health check endpoint

```python
# app/api/health_routes.py

from flask import Blueprint, jsonify
import psutil
import torch
from datetime import datetime

health_bp = Blueprint('health', __name__)


@health_bp.route('/health', methods=['GET'])
def health_check():
    """Basic health check"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200


@health_bp.route('/health/detailed', methods=['GET'])
def detailed_health():
    """Detailed health check with system metrics"""
    cpu_percent = psutil.cpu_percent(interval=1)
    memory = psutil.virtual_memory()
    disk = psutil.disk_usage('/')

    health_data = {
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat(),
        'system': {
            'cpu_percent': cpu_percent,
            'memory_percent': memory.percent,
            'memory_available_gb': memory.available / (1024**3),
            'disk_percent': disk.percent
        }
    }

    # GPU info if available
    if torch.cuda.is_available():
        health_data['gpu'] = {
            'available': True,
            'device_count': torch.cuda.device_count(),
            'current_device': torch.cuda.current_device(),
            'device_name': torch.cuda.get_device_name(0)
        }

    # Check if system is overloaded
    if cpu_percent > 90 or memory.percent > 90:
        health_data['status'] = 'degraded'
        health_data['warning'] = 'System resources are running high'

    return jsonify(health_data), 200


@health_bp.route('/metrics', methods=['GET'])
def prometheus_metrics():
    """Prometheus-compatible metrics endpoint"""
    from prometheus_client import generate_latest, CONTENT_TYPE_LATEST
    from flask import Response

    return Response(generate_latest(), mimetype=CONTENT_TYPE_LATEST)
```

### Prometheus metrics

```python
# app/utils/metrics.py

from prometheus_client import Counter, Histogram, Gauge
import time
from functools import wraps
from flask import request

# Define metrics
REQUEST_COUNT = Counter(
    'flask_request_count',
    'Total request count',
    ['method', 'endpoint', 'status']
)

REQUEST_LATENCY = Histogram(
    'flask_request_latency_seconds',
    'Request latency',
    ['method', 'endpoint']
)

INFERENCE_COUNT = Counter(
    'inference_count',
    'Total inference count',
    ['model', 'status']
)

INFERENCE_LATENCY = Histogram(
    'inference_latency_seconds',
    'Inference latency',
    ['model']
)

GPU_MEMORY_USAGE = Gauge(
    'gpu_memory_usage_bytes',
    'GPU memory usage'
)


def track_request_metrics(f):
    """Decorator to track request metrics"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        start_time = time.time()

        try:
            response = f(*args, **kwargs)
            status = response[1] if isinstance(response, tuple) else 200

            REQUEST_COUNT.labels(
                method=request.method,
                endpoint=request.endpoint,
                status=status
            ).inc()

            return response

        finally:
            REQUEST_LATENCY.labels(
                method=request.method,
                endpoint=request.endpoint
            ).observe(time.time() - start_time)

    return decorated_function


def track_inference_metrics(model_name):
    """Decorator to track inference metrics"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            start_time = time.time()

            try:
                result = f(*args, **kwargs)
                INFERENCE_COUNT.labels(model=model_name, status='success').inc()
                return result

            except Exception as e:
                INFERENCE_COUNT.labels(model=model_name, status='error').inc()
                raise

            finally:
                INFERENCE_LATENCY.labels(model=model_name).observe(
                    time.time() - start_time
                )

        return decorated_function
    return decorator
```

### Deployment script

```bash
#!/bin/bash
# deploy.sh - Flask inference engine deployment script

set -e  # Exit on error

echo "🚀 Deploying NeuroNova Flask Inference Engine..."

# Configuration
COMPOSE_FILE="docker-compose.prod.yml"
SERVICE_NAME="flask_inference"

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Build Docker image
echo "🔨 Building Docker image..."
docker-compose -f $COMPOSE_FILE build $SERVICE_NAME

# Stop old containers
echo "🛑 Stopping old containers..."
docker-compose -f $COMPOSE_FILE stop $SERVICE_NAME celery_worker

# Start new containers
echo "▶️ Starting new containers..."
docker-compose -f $COMPOSE_FILE up -d $SERVICE_NAME celery_worker

# Wait for health check
echo "🏥 Waiting for health check..."
sleep 10

HEALTH_CHECK=$(curl -s http://localhost:5000/health | jq -r '.status')

if [ "$HEALTH_CHECK" == "healthy" ]; then
    echo "✅ Deployment successful!"
    docker-compose -f $COMPOSE_FILE ps
else
    echo "❌ Deployment failed - health check returned: $HEALTH_CHECK"
    echo "Rolling back..."
    docker-compose -f $COMPOSE_FILE down
    exit 1
fi

# Clean up old images
echo "🧹 Cleaning up old images..."
docker image prune -f

echo "🎉 Deployment complete!"
```

---

## Summary

### Key Implementation Points

1. **Model Management**
   - Lazy loading with caching
   - Support for ONNX, PyTorch, scikit-learn
   - Model warmup on startup

2. **Preprocessing**
   - DICOM support with windowing
   - Multiple normalization methods
   - Robust image preprocessing pipeline

3. **XAI Integration**
   - Grad-CAM for CT images
   - SHAP for biomarker predictions
   - Visualization and important region detection

4. **API Design**
   - RESTful endpoints
   - Synchronous and asynchronous processing
   - JWT authentication
   - Comprehensive error handling

5. **Performance**
   - GPU acceleration
   - Request batching
   - Celery for async tasks
   - Connection pooling

6. **Testing**
   - Unit tests for all components
   - Integration tests for APIs
   - >90% code coverage target

7. **Deployment**
   - Docker containerization
   - Docker Compose orchestration
   - Nginx reverse proxy
   - Health checks and monitoring
   - Prometheus metrics

### Next Steps

1. **Model Training**: Train actual AI models for CT, MRI, biomarker
2. **Integration Testing**: Test with Django backend
3. **Load Testing**: Performance testing with k6 or Locust
4. **Security Audit**: Penetration testing
5. **Production Deployment**: Deploy to cloud infrastructure

---

**Related Documentation**:
- [Flask API Design](FLASK_AI_API_DESIGN.md) - API specification
- [Django-Flask Communication](DJANGO_FLASK_COMMUNICATION.md) - Integration patterns
- [Production Deployment Guide](PRODUCTION_DEPLOYMENT_GUIDE.md) - Full system deployment

**Flask Implementation Guide Complete** ✅
