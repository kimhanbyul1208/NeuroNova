"""
Django settings for NeuroNova project.
"""
import os
from pathlib import Path
from typing import List
from decouple import config
from dotenv import load_dotenv
load_dotenv()  # manage.py 있는 위치의 .env 파일 자동 로드


# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# SECURITY WARNING: keep the secret key used in production secret!
def get_required_setting(key: str, default_dev: str = None) -> str:
    """
    Get required environment variable with validation.
    In production (DEBUG=False), the setting must be explicitly set.
    """
    debug_mode = config('DEBUG', default=True, cast=bool)
    value = config(key, default=None)

    if not debug_mode and (value is None or value == default_dev):
        raise ValueError(
            f"Required environment variable '{key}' must be explicitly set in production. "
            f"Please configure it in your .env file."
        )

    return value if value is not None else default_dev

# Get DEBUG first as it's needed for other settings
DEBUG = config('DEBUG', default=True, cast=bool)

# SECRET_KEY: Required in production
SECRET_KEY = get_required_setting(
    'SECRET_KEY',
    default_dev='django-insecure-development-key-change-in-production'
)

ALLOWED_HOSTS: List[str] = config('ALLOWED_HOSTS', default='localhost,127.0.0.1').split(',')

# Project Information
PROJECT_NAME = config('PROJECT_NAME', default='NeuroNova')
PROJECT_VERSION = config('PROJECT_VERSION', default='1.0.0')
API_VERSION = config('API_VERSION', default='v1')

# Medical Staff Registration Settings
# 개발: 의료진 회원가입 허용, 즉시 활성화
# 운영: 의료진 회원가입 차단, 관리자 승인 필요
ALLOW_PRIVILEGED_SIGNUP = config('ALLOW_PRIVILEGED_SIGNUP', default=True, cast=bool)
REQUIRE_PRIVILEGED_APPROVAL = config('REQUIRE_PRIVILEGED_APPROVAL', default=False, cast=bool)

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-party apps
    'rest_framework',
    'rest_framework_simplejwt',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    # Local apps
    'apps.core',
    'apps.users',
    'apps.emr',
    'apps.custom',
    'apps.notifications',
    'apps.ml_proxy',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'corsheaders.middleware.CorsMiddleware',  # CORS should be before CommonMiddleware
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'neuronova.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'neuronova.wsgi.application'

# Database
# https://docs.djangoproject.com/en/5.0/ref/settings/#databases
# DATABASES = {
#     'default': {
#         'ENGINE': config('DB_ENGINE', default='django.db.backends.mysql'),
#         'NAME': config('DB_NAME'),
#         'USER': config('DB_USER'),
#         'PASSWORD': config('DB_PASSWORD'),
#         'HOST': config('DB_HOST'),
#         'PORT': config('DB_PORT', default='3306'),
#         'OPTIONS': {
#             'charset': 'utf8mb4',
#             'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
#         },
#     }
# }

# DATABASES = {
#     'default': {
#         'ENGINE': config('DB_ENGINE', default='django.db.backends.mysql'),
#         'NAME': config('DB_NAME', default='neuronova'),
#         'USER': config('DB_USER', default='root'),
#         'PASSWORD': config('DB_PASSWORD', default='acorn1234'),
#         'HOST': config('DB_HOST', default='host.docker.internal'),
#         'PORT': config('DB_PORT', default='3306'),
#         'OPTIONS': {
#             'charset': 'utf8mb4',
#             'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
#         },
#     }
# }
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('MYSQL_DATABASE'),
        'USER': os.getenv('MYSQL_USER'),
        'PASSWORD': os.getenv('MYSQL_PASSWORD'),
        'HOST': os.getenv('MYSQL_HOST'),  # 기본값: docker-compose의 db 서비스
        'PORT': os.getenv('MYSQL_PORT', '3306'),
        'OPTIONS': {'charset': 'utf8mb4', 'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",},
    }
}



# Cache Configuration (Redis)
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f"redis://{config('REDIS_HOST', default='localhost')}:{config('REDIS_PORT', default='6379')}/{config('REDIS_DB', default='0')}",
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]

# Internationalization
LANGUAGE_CODE = 'ko-kr'
TIME_ZONE = 'Asia/Seoul'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files (User uploads)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Settings
# 개발: 모든 origin 허용, 운영: 명시적 허용 리스트만
if DEBUG:
    CORS_ORIGIN_ALLOW_ALL = True
else:
    CORS_ORIGIN_ALLOW_ALL = False
    CORS_ALLOWED_ORIGINS = config(
        'CORS_ALLOWED_ORIGINS',
        default='http://localhost:3000,http://localhost:8000'
    ).split(',')

CORS_ALLOW_CREDENTIALS = True

# REST Framework Settings
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_PAGINATION_CLASS': 'apps.core.pagination.StandardResultsSetPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_FILTER_BACKENDS': [
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ],
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT Settings
from datetime import timedelta

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=config('JWT_ACCESS_TOKEN_LIFETIME', default=60, cast=int)),
    'REFRESH_TOKEN_LIFETIME': timedelta(minutes=config('JWT_REFRESH_TOKEN_LIFETIME', default=1440, cast=int)),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': get_required_setting('JWT_SECRET_KEY', default_dev=SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
}

# Validate JWT_SECRET_KEY in production
if not DEBUG:
    jwt_key = config('JWT_SECRET_KEY', default=None)
    if jwt_key is None or jwt_key == SECRET_KEY:
        raise ValueError(
            "JWT_SECRET_KEY must be set separately from SECRET_KEY in production. "
            "Please configure JWT_SECRET_KEY in your .env file."
        )

# API Documentation (drf-spectacular)
SPECTACULAR_SETTINGS = {
    'TITLE': f'{PROJECT_NAME} API',
    'DESCRIPTION': '뇌종양 진단 CDSS API Documentation',
    'VERSION': PROJECT_VERSION,
    'SERVE_INCLUDE_SCHEMA': False,
}

# External Services
# Flask ML 서버는 로컬 전용 (Django에서만 접근)
FLASK_INFERENCE_URL = config('FLASK_INFERENCE_URL', default='http://127.0.0.1:9000')
FLASK_API_KEY = get_required_setting('FLASK_API_KEY', default_dev='development-flask-key')

# Orthanc DICOM Server Settings
ORTHANC_URL = config('ORTHANC_URL', default='http://localhost:8042')
ORTHANC_USERNAME = config('ORTHANC_USERNAME', default='orthanc')
ORTHANC_PASSWORD = get_required_setting('ORTHANC_PASSWORD', default_dev='orthanc')

# Firebase Cloud Messaging (FCM)
FCM_SERVER_KEY = config('FCM_SERVER_KEY', default='')

# Patient Data Retention Policy
PATIENT_DATA_EXPIRATION_DAYS = config('PATIENT_DATA_EXPIRATION_DAYS', default=90, cast=int)

# Logging Configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
        'file': {
            'class': 'logging.FileHandler',
            'filename': BASE_DIR / 'logs' / 'django.log',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'apps': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG' if DEBUG else 'INFO',
            'propagate': False,
        },
    },
}

# Create logs directory if it doesn't exist
LOGS_DIR = BASE_DIR / 'logs'
LOGS_DIR.mkdir(exist_ok=True)

# Firebase Admin SDK 초기화
try:
    import firebase_admin
    from firebase_admin import credentials

    FIREBASE_CREDENTIALS_PATH = BASE_DIR / 'config' / 'firebase-service-account.json'

    if FIREBASE_CREDENTIALS_PATH.exists():
        cred = credentials.Certificate(str(FIREBASE_CREDENTIALS_PATH))
        firebase_admin.initialize_app(cred)
        print("[OK] Firebase Admin SDK initialized")
    else:
        print("[WARNING] Firebase credentials not found at", FIREBASE_CREDENTIALS_PATH)
except Exception as e:
    print(f"[WARNING] Failed to initialize Firebase Admin SDK: {e}")
