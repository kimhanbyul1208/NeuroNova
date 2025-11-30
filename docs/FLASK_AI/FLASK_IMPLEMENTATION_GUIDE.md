# Flask AI Inference Engine - Implementation Guide

> **Note**: This guide provides implementation patterns and architecture for the Flask AI inference engine. Actual model training and deployment is handled separately.

## Table of Contents

1. [Project Structure](#project-structure)
2. [Environment Setup](#environment-setup)
3. [Model Loading & Management](#model-loading--management)
4. [Image Preprocessing Pipeline](#image-preprocessing-pipeline)
5. [XAI Implementation](#xai-implementation)
6. [API Endpoint Implementation](#api-endpoint-implementation)
7. [Asynchronous Task Processing](#asynchronous-task-processing)
8. [Error Handling & Logging](#error-handling--logging)
9. [Performance Optimization](#performance-optimization)
10. [Testing Strategies](#testing-strategies)
11. [Deployment Configuration](#deployment-configuration)

---

## Project Structure

```
backend/flask_inference/
├── app/
│   ├── __init__.py              # Flask app factory
│   ├── config.py                # Configuration management
│   ├── models/                  # AI model management
│   │   ├── __init__.py
│   │   ├── model_loader.py      # Model loading & caching
│   │   ├── ct_classifier.py     # CT classification model
│   │   ├── mri_segmentor.py     # MRI segmentation model
│   │   └── biomarker_predictor.py
│   ├── preprocessing/           # Image preprocessing
│   │   ├── __init__.py
│   │   ├── dicom_processor.py   # DICOM file processing
│   │   ├── image_normalizer.py  # Image normalization
│   │   └── augmentation.py      # Data augmentation
│   ├── xai/                     # Explainable AI
│   │   ├── __init__.py
│   │   ├── grad_cam.py          # Grad-CAM implementation
│   │   ├── shap_explainer.py    # SHAP implementation
│   │   └── visualization.py     # XAI visualization
│   ├── api/                     # API endpoints
│   │   ├── __init__.py
│   │   ├── ct_routes.py         # CT classification routes
│   │   ├── mri_routes.py        # MRI segmentation routes
│   │   ├── biomarker_routes.py  # Biomarker prediction routes
│   │   └── health_routes.py     # Health check endpoints
│   ├── tasks/                   # Celery tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py        # Celery configuration
│   │   └── inference_tasks.py   # Async inference tasks
│   └── utils/                   # Utilities
│       ├── __init__.py
│       ├── validators.py        # Input validation
│       ├── security.py          # Authentication & security
│       └── metrics.py           # Performance metrics
├── models/                      # Stored AI models
│   ├── ct_classifier/
│   │   ├── model.onnx           # ONNX model file
│   │   ├── metadata.json        # Model metadata
│   │   └── preprocessing.json   # Preprocessing config
│   ├── mri_segmentor/
│   │   └── model.pt             # PyTorch model
│   └── biomarker_predictor/
│       └── model.pkl            # Scikit-learn model
├── tests/
│   ├── test_models.py
│   ├── test_preprocessing.py
│   ├── test_xai.py
│   └── test_api.py
├── requirements.txt
├── Dockerfile
└── wsgi.py
```

---

## Environment Setup

### requirements.txt

```txt
# Flask
Flask==3.0.0
Flask-CORS==4.0.0
Flask-Limiter==3.5.0

# Web Server
gunicorn==21.2.0
gevent==23.9.1

# Deep Learning
torch==2.1.0
torchvision==0.16.0
onnxruntime-gpu==1.16.3  # or onnxruntime for CPU
tensorflow==2.15.0       # if using TF models

# Medical Imaging
pydicom==2.4.4
SimpleITK==2.3.1
nibabel==5.2.0           # for NIfTI files

# Image Processing
opencv-python==4.8.1.78
Pillow==10.1.0
scikit-image==0.22.0

# XAI (Explainable AI)
shap==0.43.0
captum==0.7.0            # PyTorch interpretability
lime==0.2.0.1

# Data Science
numpy==1.24.3
pandas==2.1.4
scikit-learn==1.3.2

# Async Processing
celery==5.3.4
redis==5.0.1

# Monitoring & Logging
prometheus-client==0.19.0
python-json-logger==2.0.7

# Security
PyJWT==2.8.0
python-dotenv==1.0.0

# Validation
pydantic==2.5.3
marshmallow==3.20.1
```

### config.py

```python
import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration"""
    # Flask
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key-change-in-production')
    DEBUG = False
    TESTING = False

    # CORS
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:8000').split(',')

    # Model Paths
    MODEL_BASE_DIR = os.path.join(os.path.dirname(__file__), '..', 'models')
    CT_MODEL_PATH = os.path.join(MODEL_BASE_DIR, 'ct_classifier', 'model.onnx')
    MRI_MODEL_PATH = os.path.join(MODEL_BASE_DIR, 'mri_segmentor', 'model.pt')
    BIOMARKER_MODEL_PATH = os.path.join(MODEL_BASE_DIR, 'biomarker_predictor', 'model.pkl')

    # Inference Settings
    MAX_IMAGE_SIZE_MB = 50
    ALLOWED_EXTENSIONS = {'dcm', 'dicom', 'nii', 'nii.gz', 'png', 'jpg', 'jpeg'}
    BATCH_SIZE = 8
    DEVICE = 'cuda' if os.getenv('USE_GPU', 'true').lower() == 'true' else 'cpu'

    # XAI Settings
    ENABLE_XAI = True
    GRAD_CAM_LAYER = 'layer4'  # ResNet example
    SHAP_NUM_SAMPLES = 100

    # Celery (Async Processing)
    CELERY_BROKER_URL = os.getenv('CELERY_BROKER_URL', 'redis://localhost:6379/0')
    CELERY_RESULT_BACKEND = os.getenv('CELERY_RESULT_BACKEND', 'redis://localhost:6379/0')
    CELERY_TASK_SERIALIZER = 'json'
    CELERY_RESULT_SERIALIZER = 'json'
    CELERY_ACCEPT_CONTENT = ['json']
    CELERY_TIMEZONE = 'Asia/Seoul'

    # Security
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ALGORITHM = 'HS256'
    MAX_REQUESTS_PER_MINUTE = 100

    # Logging
    LOG_LEVEL = os.getenv('LOG_LEVEL', 'INFO')
    LOG_FORMAT = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'

    # Performance
    MODEL_CACHE_SIZE = 3  # Number of models to keep in memory
    PREPROCESSING_WORKERS = 4


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    LOG_LEVEL = 'DEBUG'


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    LOG_LEVEL = 'WARNING'
    MAX_REQUESTS_PER_MINUTE = 50  # Stricter rate limiting


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    DEVICE = 'cpu'  # Always use CPU for testing
    ENABLE_XAI = False  # Disable XAI for faster tests


config_by_name: Dict[str, Any] = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
```

---

## Model Loading & Management

### models/model_loader.py

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
    """Centralized model loading and caching"""

    def __init__(self, config):
        self.config = config
        self.device = config.DEVICE
        self._model_cache: Dict[str, Any] = {}

    @lru_cache(maxsize=3)
    def load_onnx_model(self, model_path: str) -> ort.InferenceSession:
        """Load ONNX model with optimization"""
        logger.info(f"Loading ONNX model from {model_path}")

        providers = ['CUDAExecutionProvider', 'CPUExecutionProvider'] \
                    if self.device == 'cuda' else ['CPUExecutionProvider']

        sess_options = ort.SessionOptions()
        sess_options.graph_optimization_level = ort.GraphOptimizationLevel.ORT_ENABLE_ALL

        session = ort.InferenceSession(
            model_path,
            sess_options=sess_options,
            providers=providers
        )

        logger.info(f"ONNX model loaded successfully on {providers[0]}")
        return session

    @lru_cache(maxsize=3)
    def load_pytorch_model(self, model_path: str, model_class=None) -> torch.nn.Module:
        """Load PyTorch model"""
        logger.info(f"Loading PyTorch model from {model_path}")

        device = torch.device(self.device)

        if model_class:
            # Load model with architecture
            model = model_class()
            model.load_state_dict(torch.load(model_path, map_location=device))
        else:
            # Load entire model
            model = torch.load(model_path, map_location=device)

        model.to(device)
        model.eval()

        logger.info(f"PyTorch model loaded successfully on {device}")
        return model

    @lru_cache(maxsize=3)
    def load_sklearn_model(self, model_path: str):
        """Load scikit-learn model"""
        logger.info(f"Loading scikit-learn model from {model_path}")

        with open(model_path, 'rb') as f:
            model = pickle.load(f)

        logger.info("Scikit-learn model loaded successfully")
        return model

    def load_metadata(self, model_dir: str) -> Dict[str, Any]:
        """Load model metadata"""
        metadata_path = os.path.join(model_dir, 'metadata.json')

        if not os.path.exists(metadata_path):
            logger.warning(f"Metadata not found: {metadata_path}")
            return {}

        with open(metadata_path, 'r') as f:
            return json.load(f)

    def warmup_model(self, model, input_shape: tuple):
        """Warm up model with dummy input"""
        logger.info(f"Warming up model with input shape {input_shape}")

        if isinstance(model, ort.InferenceSession):
            # ONNX warmup
            dummy_input = {model.get_inputs()[0].name:
                          torch.randn(input_shape).numpy()}
            for _ in range(3):
                model.run(None, dummy_input)

        elif isinstance(model, torch.nn.Module):
            # PyTorch warmup
            dummy_input = torch.randn(input_shape).to(self.device)
            with torch.no_grad():
                for _ in range(3):
                    model(dummy_input)

        logger.info("Model warmup completed")


# Global model loader instance
_model_loader: Optional[ModelLoader] = None


def get_model_loader(config) -> ModelLoader:
    """Get or create global model loader"""
    global _model_loader
    if _model_loader is None:
        _model_loader = ModelLoader(config)
    return _model_loader
```

### models/ct_classifier.py

```python
import numpy as np
import torch
from typing import Dict, Tuple
import logging

logger = logging.getLogger(__name__)


class CTClassifier:
    """CT-based tumor classification model"""

    TUMOR_CLASSES = [
        'Glioma',
        'Meningioma',
        'Pituitary_Tumor',
        'No_Tumor'
    ]

    def __init__(self, model, config):
        self.model = model
        self.config = config
        self.input_size = (224, 224)  # Model input size

    def predict(self, image: np.ndarray) -> Dict[str, any]:
        """
        Run inference on CT image

        Args:
            image: Preprocessed CT image (H, W) or (H, W, C)

        Returns:
            Dict with prediction results
        """
        try:
            # Prepare input
            input_tensor = self._prepare_input(image)

            # Run inference
            if hasattr(self.model, 'run'):  # ONNX
                input_name = self.model.get_inputs()[0].name
                outputs = self.model.run(None, {input_name: input_tensor})
                logits = outputs[0]
            else:  # PyTorch
                with torch.no_grad():
                    logits = self.model(torch.from_numpy(input_tensor).to(self.config.DEVICE))
                logits = logits.cpu().numpy()

            # Post-process results
            probabilities = self._softmax(logits[0])
            predicted_idx = np.argmax(probabilities)

            result = {
                'predicted_class': self.TUMOR_CLASSES[predicted_idx],
                'predicted_class_id': int(predicted_idx),
                'confidence': float(probabilities[predicted_idx]),
                'probabilities': {
                    cls: float(prob)
                    for cls, prob in zip(self.TUMOR_CLASSES, probabilities)
                },
                'all_probabilities': probabilities.tolist()
            }

            logger.info(f"CT prediction: {result['predicted_class']} "
                       f"(confidence: {result['confidence']:.3f})")

            return result

        except Exception as e:
            logger.error(f"CT classification error: {str(e)}", exc_info=True)
            raise

    def _prepare_input(self, image: np.ndarray) -> np.ndarray:
        """Prepare image for model input"""
        # Ensure 3D: (1, C, H, W) for ONNX/PyTorch
        if image.ndim == 2:
            image = np.expand_dims(image, axis=0)  # Add channel

        if image.ndim == 3 and image.shape[-1] in [1, 3]:
            image = np.transpose(image, (2, 0, 1))  # HWC -> CHW

        if image.shape[0] == 1:
            image = np.repeat(image, 3, axis=0)  # Grayscale to RGB

        # Add batch dimension
        image = np.expand_dims(image, axis=0).astype(np.float32)

        return image

    @staticmethod
    def _softmax(x: np.ndarray) -> np.ndarray:
        """Compute softmax"""
        exp_x = np.exp(x - np.max(x))
        return exp_x / exp_x.sum()
```

### models/mri_segmentor.py

```python
import numpy as np
import torch
import torch.nn.functional as F
from typing import Dict
import logging

logger = logging.getLogger(__name__)


class MRISegmentor:
    """MRI-based tumor segmentation model (3D U-Net)"""

    SEGMENTATION_LABELS = {
        0: 'Background',
        1: 'Necrotic_Core',
        2: 'Edema',
        3: 'Enhancing_Tumor'
    }

    def __init__(self, model, config):
        self.model = model
        self.config = config
        self.device = torch.device(config.DEVICE)

    def predict(self, volume: np.ndarray) -> Dict[str, any]:
        """
        Run segmentation on 3D MRI volume

        Args:
            volume: 3D MRI volume (D, H, W) or (D, H, W, C)

        Returns:
            Dict with segmentation mask and statistics
        """
        try:
            # Prepare input
            input_tensor = self._prepare_input(volume)

            # Run inference
            with torch.no_grad():
                output = self.model(input_tensor)

                # Get predicted mask
                if isinstance(output, dict):
                    logits = output['out']
                else:
                    logits = output

                # Convert to probabilities and mask
                probs = F.softmax(logits, dim=1)
                mask = torch.argmax(probs, dim=1).squeeze()

            # Convert to numpy
            mask_np = mask.cpu().numpy().astype(np.uint8)
            probs_np = probs.cpu().numpy()

            # Calculate statistics
            stats = self._calculate_statistics(mask_np, volume.shape)

            result = {
                'segmentation_mask': mask_np,  # Will be encoded to base64 in API
                'segmentation_shape': mask_np.shape,
                'probability_maps': probs_np,  # (C, D, H, W)
                'statistics': stats,
                'tumor_detected': stats['total_tumor_volume_mm3'] > 0
            }

            logger.info(f"MRI segmentation: Total tumor volume = "
                       f"{stats['total_tumor_volume_mm3']:.2f} mm³")

            return result

        except Exception as e:
            logger.error(f"MRI segmentation error: {str(e)}", exc_info=True)
            raise

    def _prepare_input(self, volume: np.ndarray) -> torch.Tensor:
        """Prepare 3D volume for model input"""
        # Ensure 4D: (C, D, H, W)
        if volume.ndim == 3:
            volume = np.expand_dims(volume, axis=0)
        elif volume.ndim == 4 and volume.shape[-1] in [1, 3]:
            volume = np.transpose(volume, (3, 0, 1, 2))

        # Add batch dimension: (1, C, D, H, W)
        volume = np.expand_dims(volume, axis=0).astype(np.float32)

        # Convert to tensor
        tensor = torch.from_numpy(volume).to(self.device)

        return tensor

    def _calculate_statistics(self, mask: np.ndarray,
                            original_shape: tuple,
                            voxel_spacing: tuple = (1.0, 1.0, 1.0)) -> Dict:
        """Calculate segmentation statistics"""
        stats = {
            'tumor_classes': {},
            'total_tumor_voxels': 0,
            'total_tumor_volume_mm3': 0.0
        }

        voxel_volume = np.prod(voxel_spacing)  # mm³ per voxel

        for label_id, label_name in self.SEGMENTATION_LABELS.items():
            if label_id == 0:  # Skip background
                continue

            voxel_count = np.sum(mask == label_id)
            volume_mm3 = voxel_count * voxel_volume

            stats['tumor_classes'][label_name] = {
                'voxel_count': int(voxel_count),
                'volume_mm3': float(volume_mm3),
                'percentage': float(voxel_count / mask.size * 100)
            }

            stats['total_tumor_voxels'] += int(voxel_count)
            stats['total_tumor_volume_mm3'] += float(volume_mm3)

        return stats
```

---

## Image Preprocessing Pipeline

### preprocessing/dicom_processor.py

```python
import pydicom
import numpy as np
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class DICOMProcessor:
    """Process DICOM medical images"""

    @staticmethod
    def read_dicom(file_path: str) -> Tuple[np.ndarray, dict]:
        """
        Read DICOM file and extract pixel data

        Returns:
            Tuple of (pixel_array, metadata)
        """
        try:
            dcm = pydicom.dcmread(file_path)

            # Extract pixel array
            pixel_array = dcm.pixel_array.astype(np.float32)

            # Extract metadata
            metadata = {
                'patient_id': str(getattr(dcm, 'PatientID', 'Unknown')),
                'study_date': str(getattr(dcm, 'StudyDate', 'Unknown')),
                'modality': str(getattr(dcm, 'Modality', 'Unknown')),
                'slice_thickness': float(getattr(dcm, 'SliceThickness', 1.0)),
                'pixel_spacing': getattr(dcm, 'PixelSpacing', [1.0, 1.0]),
                'window_center': getattr(dcm, 'WindowCenter', None),
                'window_width': getattr(dcm, 'WindowWidth', None),
                'rows': int(dcm.Rows),
                'columns': int(dcm.Columns),
            }

            logger.info(f"DICOM loaded: {metadata['modality']} - "
                       f"{metadata['rows']}x{metadata['columns']}")

            return pixel_array, metadata

        except Exception as e:
            logger.error(f"DICOM read error: {str(e)}")
            raise ValueError(f"Invalid DICOM file: {str(e)}")

    @staticmethod
    def apply_windowing(pixel_array: np.ndarray,
                       window_center: float,
                       window_width: float) -> np.ndarray:
        """
        Apply window/level adjustment for CT images

        Brain window: WC=40, WW=80
        Bone window: WC=300, WW=1500
        """
        lower = window_center - window_width / 2
        upper = window_center + window_width / 2

        windowed = np.clip(pixel_array, lower, upper)
        windowed = (windowed - lower) / (upper - lower) * 255.0

        return windowed.astype(np.uint8)

    @staticmethod
    def apply_hounsfield_normalization(pixel_array: np.ndarray,
                                      intercept: float = 0.0,
                                      slope: float = 1.0) -> np.ndarray:
        """Convert to Hounsfield Units (HU)"""
        hu_array = pixel_array * slope + intercept

        # Clip to reasonable range for brain CT
        hu_array = np.clip(hu_array, -100, 300)

        return hu_array
```

### preprocessing/image_normalizer.py

```python
import numpy as np
import cv2
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class ImageNormalizer:
    """Image normalization and preprocessing"""

    @staticmethod
    def normalize_intensity(image: np.ndarray,
                          method: str = 'zscore',
                          clip_percentile: Tuple[float, float] = (1, 99)) -> np.ndarray:
        """
        Normalize image intensity

        Methods:
            - 'zscore': Zero mean, unit variance
            - 'minmax': Scale to [0, 1]
            - 'percentile': Clip and scale based on percentiles
        """
        if method == 'zscore':
            mean = np.mean(image)
            std = np.std(image)
            normalized = (image - mean) / (std + 1e-8)

        elif method == 'minmax':
            min_val = np.min(image)
            max_val = np.max(image)
            normalized = (image - min_val) / (max_val - min_val + 1e-8)

        elif method == 'percentile':
            p_low, p_high = np.percentile(image, clip_percentile)
            normalized = np.clip(image, p_low, p_high)
            normalized = (normalized - p_low) / (p_high - p_low + 1e-8)

        else:
            raise ValueError(f"Unknown normalization method: {method}")

        return normalized.astype(np.float32)

    @staticmethod
    def resize_image(image: np.ndarray,
                    target_size: Tuple[int, int],
                    interpolation: int = cv2.INTER_LINEAR) -> np.ndarray:
        """Resize image to target size"""
        if image.shape[:2] == target_size:
            return image

        resized = cv2.resize(image, target_size, interpolation=interpolation)
        return resized

    @staticmethod
    def pad_to_square(image: np.ndarray,
                     pad_value: float = 0.0) -> np.ndarray:
        """Pad image to square shape"""
        h, w = image.shape[:2]
        if h == w:
            return image

        max_dim = max(h, w)
        pad_h = (max_dim - h) // 2
        pad_w = (max_dim - w) // 2

        if image.ndim == 2:
            padded = np.pad(image,
                          ((pad_h, max_dim - h - pad_h),
                           (pad_w, max_dim - w - pad_w)),
                          constant_values=pad_value)
        else:
            padded = np.pad(image,
                          ((pad_h, max_dim - h - pad_h),
                           (pad_w, max_dim - w - pad_w),
                           (0, 0)),
                          constant_values=pad_value)

        return padded

    @staticmethod
    def enhance_contrast(image: np.ndarray,
                        method: str = 'clahe') -> np.ndarray:
        """Enhance image contrast"""
        if method == 'clahe':
            # Contrast Limited Adaptive Histogram Equalization
            image_uint8 = (image * 255).astype(np.uint8) if image.max() <= 1 else image.astype(np.uint8)
            clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
            enhanced = clahe.apply(image_uint8)
            return enhanced.astype(np.float32) / 255.0

        elif method == 'histogram_eq':
            image_uint8 = (image * 255).astype(np.uint8) if image.max() <= 1 else image.astype(np.uint8)
            enhanced = cv2.equalizeHist(image_uint8)
            return enhanced.astype(np.float32) / 255.0

        else:
            raise ValueError(f"Unknown enhancement method: {method}")
```

---

## XAI Implementation

### xai/grad_cam.py

```python
import numpy as np
import torch
import torch.nn.functional as F
import cv2
from typing import Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class GradCAM:
    """Gradient-weighted Class Activation Mapping"""

    def __init__(self, model, target_layer: str):
        """
        Args:
            model: PyTorch model
            target_layer: Name of target layer (e.g., 'layer4' for ResNet)
        """
        self.model = model
        self.model.eval()

        self.target_layer = self._get_target_layer(target_layer)
        self.gradients = None
        self.activations = None

        # Register hooks
        self.target_layer.register_forward_hook(self._forward_hook)
        self.target_layer.register_backward_hook(self._backward_hook)

    def _get_target_layer(self, layer_name: str):
        """Get target layer by name"""
        for name, module in self.model.named_modules():
            if name == layer_name:
                return module
        raise ValueError(f"Layer {layer_name} not found in model")

    def _forward_hook(self, module, input, output):
        """Hook to capture activations"""
        self.activations = output.detach()

    def _backward_hook(self, module, grad_input, grad_output):
        """Hook to capture gradients"""
        self.gradients = grad_output[0].detach()

    def generate_cam(self,
                    input_tensor: torch.Tensor,
                    target_class: Optional[int] = None) -> Tuple[np.ndarray, float]:
        """
        Generate Grad-CAM heatmap

        Args:
            input_tensor: Input image tensor (1, C, H, W)
            target_class: Target class index (if None, use predicted class)

        Returns:
            Tuple of (heatmap, confidence)
        """
        input_tensor = input_tensor.requires_grad_(True)

        # Forward pass
        output = self.model(input_tensor)

        if target_class is None:
            target_class = output.argmax(dim=1).item()

        confidence = F.softmax(output, dim=1)[0, target_class].item()

        # Backward pass
        self.model.zero_grad()
        output[0, target_class].backward()

        # Generate CAM
        gradients = self.gradients[0]  # (C, H, W)
        activations = self.activations[0]  # (C, H, W)

        # Global average pooling of gradients
        weights = torch.mean(gradients, dim=[1, 2])  # (C,)

        # Weighted combination of activation maps
        cam = torch.zeros(activations.shape[1:], dtype=torch.float32)
        for i, w in enumerate(weights):
            cam += w * activations[i]

        # ReLU and normalize
        cam = F.relu(cam)
        cam = cam.cpu().numpy()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)

        logger.info(f"Grad-CAM generated for class {target_class} "
                   f"(confidence: {confidence:.3f})")

        return cam, confidence

    def overlay_heatmap(self,
                       heatmap: np.ndarray,
                       original_image: np.ndarray,
                       alpha: float = 0.4,
                       colormap: int = cv2.COLORMAP_JET) -> np.ndarray:
        """
        Overlay heatmap on original image

        Args:
            heatmap: Grad-CAM heatmap (H, W)
            original_image: Original image (H, W, C) in range [0, 255]
            alpha: Transparency of heatmap
            colormap: OpenCV colormap

        Returns:
            Overlayed image (H, W, C)
        """
        # Resize heatmap to match image size
        heatmap_resized = cv2.resize(heatmap,
                                    (original_image.shape[1], original_image.shape[0]))

        # Convert to uint8
        heatmap_uint8 = (heatmap_resized * 255).astype(np.uint8)

        # Apply colormap
        heatmap_colored = cv2.applyColorMap(heatmap_uint8, colormap)

        # Convert grayscale to RGB if needed
        if original_image.ndim == 2:
            original_image = cv2.cvtColor(original_image, cv2.COLOR_GRAY2RGB)

        # Ensure original image is uint8
        if original_image.dtype != np.uint8:
            original_image = (original_image * 255).astype(np.uint8)

        # Overlay
        overlayed = cv2.addWeighted(original_image, 1 - alpha,
                                   heatmap_colored, alpha, 0)

        return overlayed

    def find_important_regions(self,
                              heatmap: np.ndarray,
                              threshold: float = 0.7) -> list:
        """
        Find important regions in heatmap

        Returns:
            List of bounding boxes [(x, y, w, h), ...]
        """
        # Threshold heatmap
        _, binary = cv2.threshold((heatmap * 255).astype(np.uint8),
                                 int(threshold * 255),
                                 255,
                                 cv2.THRESH_BINARY)

        # Find contours
        contours, _ = cv2.findContours(binary,
                                      cv2.RETR_EXTERNAL,
                                      cv2.CHAIN_APPROX_SIMPLE)

        # Extract bounding boxes
        regions = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            area = w * h
            if area > 100:  # Filter small regions
                regions.append({
                    'x': int(x),
                    'y': int(y),
                    'width': int(w),
                    'height': int(h),
                    'area': int(area),
                    'center': (int(x + w/2), int(y + h/2))
                })

        # Sort by area (largest first)
        regions.sort(key=lambda r: r['area'], reverse=True)

        return regions
```

### xai/shap_explainer.py

```python
import shap
import numpy as np
import pandas as pd
from typing import Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class SHAPExplainer:
    """SHAP (SHapley Additive exPlanations) for biomarker models"""

    def __init__(self, model, background_data: np.ndarray):
        """
        Args:
            model: Trained model (scikit-learn, XGBoost, etc.)
            background_data: Sample data for SHAP baseline (n_samples, n_features)
        """
        self.model = model
        self.background_data = background_data

        # Create SHAP explainer
        try:
            # Try TreeExplainer for tree-based models
            self.explainer = shap.TreeExplainer(model)
            logger.info("Using SHAP TreeExplainer")
        except:
            # Fall back to KernelExplainer
            self.explainer = shap.KernelExplainer(
                model.predict_proba,
                shap.sample(background_data, 100)
            )
            logger.info("Using SHAP KernelExplainer")

    def explain(self,
               data: np.ndarray,
               feature_names: List[str]) -> Dict:
        """
        Generate SHAP explanations

        Args:
            data: Input data (n_samples, n_features)
            feature_names: List of feature names

        Returns:
            Dict with SHAP values and feature importance
        """
        try:
            # Calculate SHAP values
            shap_values = self.explainer.shap_values(data)

            # Handle multi-class output
            if isinstance(shap_values, list):
                # For multi-class, use values for predicted class
                predictions = self.model.predict(data)
                shap_values_selected = np.array([
                    shap_values[pred][i]
                    for i, pred in enumerate(predictions)
                ])
            else:
                shap_values_selected = shap_values

            # Calculate feature importance (mean absolute SHAP value)
            feature_importance = np.abs(shap_values_selected).mean(axis=0)

            # Create feature importance ranking
            importance_df = pd.DataFrame({
                'feature': feature_names,
                'importance': feature_importance
            }).sort_values('importance', ascending=False)

            result = {
                'shap_values': shap_values_selected.tolist(),
                'feature_importance': [
                    {
                        'feature': row['feature'],
                        'importance': float(row['importance']),
                        'rank': idx + 1
                    }
                    for idx, (_, row) in enumerate(importance_df.iterrows())
                ],
                'top_features': importance_df.head(10)['feature'].tolist()
            }

            logger.info(f"SHAP explanation generated for {len(data)} samples")
            logger.info(f"Top 3 features: {result['top_features'][:3]}")

            return result

        except Exception as e:
            logger.error(f"SHAP explanation error: {str(e)}", exc_info=True)
            raise

    def explain_single(self,
                      data: np.ndarray,
                      feature_names: List[str],
                      baseline_value: Optional[float] = None) -> Dict:
        """
        Explain single prediction with detailed feature contributions

        Args:
            data: Single sample (n_features,) or (1, n_features)
            feature_names: List of feature names
            baseline_value: Baseline prediction value

        Returns:
            Dict with detailed explanation
        """
        if data.ndim == 1:
            data = data.reshape(1, -1)

        # Get SHAP values
        shap_values = self.explainer.shap_values(data)

        if isinstance(shap_values, list):
            # Multi-class: use predicted class
            pred_class = self.model.predict(data)[0]
            shap_values_single = shap_values[pred_class][0]
        else:
            shap_values_single = shap_values[0]

        # Get baseline (expected value)
        if baseline_value is None:
            try:
                baseline_value = self.explainer.expected_value
                if isinstance(baseline_value, (list, np.ndarray)):
                    pred_class = self.model.predict(data)[0]
                    baseline_value = baseline_value[pred_class]
            except:
                baseline_value = 0.0

        # Create feature contributions
        contributions = []
        for feature, shap_val, data_val in zip(feature_names, shap_values_single, data[0]):
            contributions.append({
                'feature': feature,
                'value': float(data_val),
                'shap_value': float(shap_val),
                'contribution': 'positive' if shap_val > 0 else 'negative',
                'abs_shap': abs(float(shap_val))
            })

        # Sort by absolute SHAP value
        contributions.sort(key=lambda x: x['abs_shap'], reverse=True)

        result = {
            'baseline_value': float(baseline_value),
            'prediction': float(self.model.predict_proba(data)[0].max()),
            'contributions': contributions,
            'top_positive': [c for c in contributions if c['shap_value'] > 0][:5],
            'top_negative': [c for c in contributions if c['shap_value'] < 0][:5],
        }

        return result
```

I'll continue with the API implementation and remaining sections. Would you like me to proceed?