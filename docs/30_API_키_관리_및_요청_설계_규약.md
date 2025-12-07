# API 키 관리 및 요청 설계 규약

## 목차
1. [개요](#개요)
2. [API 키 분류 및 저장](#api-키-분류-및-저장)
3. [프론트엔드 API 요청 설계](#프론트엔드-api-요청-설계)
4. [백엔드 API 키 관리](#백엔드-api-키-관리)
5. [보안 규칙](#보안-규칙)
6. [에러 처리](#에러-처리)
7. [모니터링 및 사용량 추적](#모니터링-및-사용량-추적)
8. [트러블슈팅](#트러블슈팅)

---

## 개요

NeuroNova는 다양한 외부 API를 사용합니다:
- **RCSB PDB API**: 단백질 구조 데이터 (API 키 불필요)
- **AlphaFold API**: 단백질 구조 예측 (API 키 필요할 수 있음)
- **PubChem API**: 약물 정보 (API 키 불필요, 하지만 rate limit 있음)
- **RxNorm/DrugBank**: 약물 데이터베이스 (API 키 필요)
- **Firebase/FCM**: 푸시 알림 (API 키 필요)

### API 키 필요성에 따른 분류

| API 서비스 | API 키 필요 여부 | 요청 위치 | 이유 |
|-----------|---------------|---------|------|
| RCSB PDB | 불필요 | 프론트엔드 | 공개 API, 트래픽 절감 |
| PubChem | 불필요 (권장) | 프론트엔드 | 공개 API, rate limit 관리 시 백엔드 |
| AlphaFold | 필요 (선택) | 백엔드 | API 키 보안 |
| DrugBank | 필요 | 백엔드 | API 키 보안 |
| Firebase FCM | 필요 | 백엔드 | 서버 키 보안 |
| ML 모델 API | 필요 | 백엔드 | 내부 서비스, 인증 필요 |

---

## API 키 분류 및 저장

### 1. 공개 API (API 키 불필요)

**특징:**
- 누구나 호출 가능
- Rate limiting 있을 수 있음
- 프론트엔드에서 직접 호출 가능

**예시:**
```javascript
// React - RCSB PDB API (공개)
const response = await fetch(
  `https://data.rcsb.org/rest/v1/core/entry/${proteinId}`
);
```

**저장 위치:** 없음 (API 키 없음)

---

### 2. 제한적 공개 API (API 키 선택적)

**특징:**
- API 키 없이도 사용 가능하지만 제한적
- API 키 사용 시 rate limit 완화
- 트래픽이 높으면 백엔드 프록시 권장

**예시: PubChem**

#### 프론트엔드 직접 호출 (API 키 없음)
```javascript
// React - PubChem (키 없이)
const response = await fetch(
  `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${drugName}/JSON`
);
// Rate limit: ~5 요청/초
```

#### 백엔드 프록시 (API 키 사용)
```python
# Django - PubChem (키 사용)
import os
import requests

PUBCHEM_API_KEY = os.getenv('PUBCHEM_API_KEY')

def get_drug_info(drug_name):
    headers = {}
    if PUBCHEM_API_KEY:
        headers['X-API-Key'] = PUBCHEM_API_KEY

    response = requests.get(
        f'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{drug_name}/JSON',
        headers=headers
    )
    return response.json()
```

**저장 위치:** `.env` (선택적)
```bash
# backend/django_main/.env
PUBCHEM_API_KEY=your_pubchem_key_here
```

---

### 3. 비공개 API (API 키 필수)

**특징:**
- 반드시 API 키 필요
- 절대 프론트엔드 노출 금지
- 백엔드에서만 호출

**예시: DrugBank API**

```python
# Django - DrugBank API (키 필수)
import os
import requests

DRUGBANK_API_KEY = os.getenv('DRUGBANK_API_KEY')

def get_drug_interactions(drug_id):
    if not DRUGBANK_API_KEY:
        raise ValueError("DRUGBANK_API_KEY not configured")

    headers = {
        'Authorization': f'Bearer {DRUGBANK_API_KEY}',
        'Content-Type': 'application/json'
    }

    response = requests.get(
        f'https://api.drugbank.com/v1/drugs/{drug_id}/interactions',
        headers=headers
    )

    if response.status_code == 401:
        logger.error("DrugBank API authentication failed")
        raise Exception("API authentication failed")

    return response.json()
```

**저장 위치:** `.env` (필수)
```bash
# backend/django_main/.env
DRUGBANK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
```

---

### 4. 내부 서비스 API (인증 토큰 필요)

**특징:**
- NeuroNova 내부 서비스 간 통신
- JWT 토큰 또는 서비스 키 사용
- 프론트엔드는 사용자 인증 토큰 사용

**예시: Django → Flask ML API**

```python
# Django → Flask (내부 서비스)
import os
import requests

ML_API_URL = os.getenv('ML_API_URL', 'http://localhost:5001')
ML_SERVICE_KEY = os.getenv('ML_SERVICE_KEY')

def predict_diagnosis(image_data):
    headers = {
        'X-Service-Key': ML_SERVICE_KEY,  # 서비스 간 인증
        'Content-Type': 'application/json'
    }

    response = requests.post(
        f'{ML_API_URL}/api/predict',
        json={'image': image_data},
        headers=headers,
        timeout=30
    )

    return response.json()
```

**Flask에서 검증:**
```python
# Flask - 서비스 키 검증
import os
from flask import request, jsonify

ML_SERVICE_KEY = os.getenv('ML_SERVICE_KEY')

@app.before_request
def verify_service_key():
    if request.path.startswith('/api/'):
        service_key = request.headers.get('X-Service-Key')

        if not service_key or service_key != ML_SERVICE_KEY:
            return jsonify({'error': 'Unauthorized'}), 401
```

**저장 위치:** `.env` (양쪽 모두)
```bash
# backend/django_main/.env
ML_API_URL=http://localhost:5001
ML_SERVICE_KEY=internal-service-secret-key-xyz

# backend/flask_ml/.env
ML_SERVICE_KEY=internal-service-secret-key-xyz
```

---

## 프론트엔드 API 요청 설계

### 원칙

1. **절대 API 키를 프론트엔드에 하드코딩하지 않음**
2. **공개 API는 직접 호출 (트래픽 절감)**
3. **비공개 API는 백엔드 프록시 경유**
4. **사용자 인증은 JWT 토큰 사용**

---

### 패턴 1: 공개 API 직접 호출 (API 키 불필요)

```javascript
// frontend/react_web/src/services/proteinService.js

class ProteinService {
  /**
   * RCSB PDB API - 공개 API, 키 불필요
   * 프론트엔드에서 직접 호출하여 서버 트래픽 절감
   */
  async getProteinStructure(proteinId) {
    try {
      const response = await fetch(
        `https://data.rcsb.org/rest/v1/core/entry/${proteinId}`,
        {
          method: 'GET',
          headers: {
            'Accept': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error(`RCSB API error: ${response.status}`);
      }

      const data = await response.json();

      // 메타데이터만 Django에 로깅 (API 키 불필요)
      await this.logProteinView(proteinId, data.struct?.title);

      return data;
    } catch (error) {
      console.error('Failed to fetch protein structure:', error);
      throw error;
    }
  }

  /**
   * Django API - 메타데이터 로깅
   * 사용자 인증 토큰 사용
   */
  async logProteinView(proteinId, proteinName) {
    const token = localStorage.getItem('access_token');

    await fetch('/api/emr/protein-view-log/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`  // 사용자 인증
      },
      body: JSON.stringify({
        protein_id: proteinId,
        protein_name: proteinName
      })
    });
  }
}

export default new ProteinService();
```

---

### 패턴 2: 백엔드 프록시 경유 (API 키 필요)

```javascript
// frontend/react_web/src/services/drugService.js

class DrugService {
  /**
   * DrugBank API - 비공개 API, 키 필요
   * 백엔드 프록시를 통해 호출
   */
  async getDrugInteractions(drugId) {
    const token = localStorage.getItem('access_token');

    try {
      const response = await fetch(`/api/drug/interactions/${drugId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,  // 사용자 인증
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 401) {
        // 인증 만료
        throw new Error('Authentication required');
      }

      if (response.status === 503) {
        // 외부 API 장애
        throw new Error('Drug API service unavailable');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Failed to fetch drug interactions:', error);
      throw error;
    }
  }
}

export default new DrugService();
```

**대응하는 Django 뷰:**
```python
# backend/django_main/apps/drug/views.py

import os
import requests
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

DRUGBANK_API_KEY = os.getenv('DRUGBANK_API_KEY')

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_drug_interactions(request, drug_id):
    """
    DrugBank API 프록시
    API 키를 백엔드에서 관리하여 보안 유지
    """
    if not DRUGBANK_API_KEY:
        return Response(
            {'error': 'DrugBank API not configured'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )

    try:
        headers = {
            'Authorization': f'Bearer {DRUGBANK_API_KEY}',
            'Content-Type': 'application/json'
        }

        response = requests.get(
            f'https://api.drugbank.com/v1/drugs/{drug_id}/interactions',
            headers=headers,
            timeout=10
        )

        if response.status_code == 401:
            logger.error("DrugBank API authentication failed")
            return Response(
                {'error': 'External API authentication failed'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        response.raise_for_status()

        # 사용량 로깅
        log_api_usage(
            user=request.user,
            service='drugbank',
            endpoint=f'/drugs/{drug_id}/interactions'
        )

        return Response(response.json())

    except requests.Timeout:
        return Response(
            {'error': 'External API timeout'},
            status=status.HTTP_504_GATEWAY_TIMEOUT
        )
    except requests.RequestException as e:
        logger.error(f"DrugBank API error: {e}")
        return Response(
            {'error': 'Failed to fetch drug data'},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
```

---

### 패턴 3: Rate Limiting이 있는 공개 API (조건부 프록시)

```javascript
// frontend/react_web/src/services/pubchemService.js

class PubChemService {
  constructor() {
    // 환경 설정에 따라 직접 호출 vs 프록시 결정
    this.useProxy = import.meta.env.VITE_USE_PUBCHEM_PROXY === 'true';
  }

  async getCompoundInfo(compoundName) {
    if (this.useProxy) {
      // 백엔드 프록시 사용 (rate limit 완화)
      return this.getViaProxy(compoundName);
    } else {
      // 직접 호출 (트래픽 절감)
      return this.getDirectly(compoundName);
    }
  }

  async getDirectly(compoundName) {
    // Rate limit 관리
    await this.rateLimiter.wait();

    const response = await fetch(
      `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${compoundName}/JSON`
    );

    if (response.status === 429) {
      // Rate limit 초과 - 프록시로 재시도
      console.warn('PubChem rate limit exceeded, switching to proxy');
      return this.getViaProxy(compoundName);
    }

    return response.json();
  }

  async getViaProxy(compoundName) {
    const token = localStorage.getItem('access_token');

    const response = await fetch(`/api/drug/pubchem/${compoundName}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return response.json();
  }
}
```

---

## 백엔드 API 키 관리

### 1. 환경 변수 저장

**절대 코드에 하드코딩하지 않음!**

```bash
# backend/django_main/.env

# === 외부 API 키 ===
DRUGBANK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx
ALPHAFOLD_API_KEY=af-xxxxxxxxxxxxxxxxxxxxxxxx
PUBCHEM_API_KEY=pc-xxxxxxxxxxxxxxxxxxxxxxxx  # 선택적

# === Firebase/FCM ===
FIREBASE_SERVER_KEY=AAAA-xxxxxxxxxxxxxxxxxxxxxxxxxxx
FIREBASE_PROJECT_ID=neuronova-cdss

# === 내부 서비스 키 ===
ML_SERVICE_KEY=internal-ml-service-key-xxxxxxxxxx
ML_API_URL=http://localhost:5001

# === JWT 시크릿 (Django) ===
JWT_SECRET_KEY=super-secret-jwt-key-change-in-production
JWT_ALGORITHM=HS256

# === 암호화 키 (환자 정보) ===
ENCRYPTION_KEY=32-byte-base64-encoded-encryption-key==
```

**주의:**
- `.env` 파일은 `.gitignore`에 반드시 추가
- 프로덕션 환경에서는 환경 변수로 직접 설정
- 개발 환경과 프로덕션 환경 키 분리

---

### 2. Django에서 API 키 로드

```python
# backend/django_main/neuronova/settings.py

import os
from pathlib import Path
from dotenv import load_dotenv

# .env 파일 로드
load_dotenv()

# 외부 API 설정
DRUGBANK_API_KEY = os.getenv('DRUGBANK_API_KEY')
ALPHAFOLD_API_KEY = os.getenv('ALPHAFOLD_API_KEY')
PUBCHEM_API_KEY = os.getenv('PUBCHEM_API_KEY')

# Firebase 설정
FIREBASE_SERVER_KEY = os.getenv('FIREBASE_SERVER_KEY')
FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID')

# 내부 서비스 설정
ML_SERVICE_KEY = os.getenv('ML_SERVICE_KEY')
ML_API_URL = os.getenv('ML_API_URL', 'http://localhost:5001')

# 암호화 설정
ENCRYPTION_KEY = os.getenv('ENCRYPTION_KEY')

# 시작 시 필수 키 검증
def validate_required_keys():
    required = {
        'DRUGBANK_API_KEY': DRUGBANK_API_KEY,
        'FIREBASE_SERVER_KEY': FIREBASE_SERVER_KEY,
        'ML_SERVICE_KEY': ML_SERVICE_KEY,
        'ENCRYPTION_KEY': ENCRYPTION_KEY,
    }

    missing = [key for key, value in required.items() if not value]

    if missing:
        raise ValueError(
            f"Missing required environment variables: {', '.join(missing)}\n"
            f"Please configure them in .env file"
        )

# 프로덕션 환경에서만 검증
if not DEBUG:
    validate_required_keys()
```

---

### 3. API 키 서비스 레이어

```python
# backend/django_main/apps/core/services/external_api.py

import os
import requests
import logging
from typing import Optional, Dict, Any
from django.core.cache import cache

logger = logging.getLogger(__name__)

class ExternalAPIService:
    """외부 API 통합 서비스"""

    def __init__(self):
        self.drugbank_key = os.getenv('DRUGBANK_API_KEY')
        self.alphafold_key = os.getenv('ALPHAFOLD_API_KEY')
        self.pubchem_key = os.getenv('PUBCHEM_API_KEY')

    def call_drugbank(
        self,
        endpoint: str,
        params: Optional[Dict] = None
    ) -> Dict[Any, Any]:
        """
        DrugBank API 호출

        Args:
            endpoint: API 엔드포인트 (예: '/drugs/DB00001')
            params: 쿼리 파라미터

        Returns:
            API 응답 데이터

        Raises:
            ValueError: API 키 미설정
            requests.HTTPError: API 호출 실패
        """
        if not self.drugbank_key:
            raise ValueError("DRUGBANK_API_KEY not configured")

        # 캐시 확인 (1시간)
        cache_key = f'drugbank:{endpoint}:{params}'
        cached = cache.get(cache_key)
        if cached:
            logger.info(f"DrugBank cache hit: {endpoint}")
            return cached

        headers = {
            'Authorization': f'Bearer {self.drugbank_key}',
            'Content-Type': 'application/json'
        }

        url = f'https://api.drugbank.com/v1{endpoint}'

        try:
            response = requests.get(
                url,
                headers=headers,
                params=params,
                timeout=10
            )

            response.raise_for_status()

            data = response.json()

            # 캐시 저장
            cache.set(cache_key, data, 3600)  # 1시간

            logger.info(f"DrugBank API success: {endpoint}")
            return data

        except requests.HTTPError as e:
            if e.response.status_code == 401:
                logger.error("DrugBank API authentication failed")
                raise ValueError("Invalid API key")
            elif e.response.status_code == 429:
                logger.warning("DrugBank API rate limit exceeded")
                raise ValueError("API rate limit exceeded")
            else:
                logger.error(f"DrugBank API error: {e}")
                raise
        except requests.Timeout:
            logger.error(f"DrugBank API timeout: {endpoint}")
            raise ValueError("API timeout")

    def call_pubchem(
        self,
        compound_name: str
    ) -> Dict[Any, Any]:
        """
        PubChem API 호출 (키 선택적)

        Args:
            compound_name: 화합물 이름

        Returns:
            화합물 정보
        """
        # 캐시 확인 (24시간)
        cache_key = f'pubchem:{compound_name}'
        cached = cache.get(cache_key)
        if cached:
            return cached

        headers = {}
        if self.pubchem_key:
            headers['X-API-Key'] = self.pubchem_key

        url = f'https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/{compound_name}/JSON'

        try:
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()

            data = response.json()

            # 캐시 저장 (24시간)
            cache.set(cache_key, data, 86400)

            return data

        except requests.HTTPError as e:
            logger.error(f"PubChem API error: {e}")
            raise

# 싱글톤 인스턴스
external_api = ExternalAPIService()
```

---

### 4. 뷰에서 사용

```python
# backend/django_main/apps/drug/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from apps.core.services.external_api import external_api
from .models import APIUsageLog

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_drug_info(request, drug_id):
    """약물 정보 조회 (DrugBank API 프록시)"""

    try:
        # 외부 API 호출
        data = external_api.call_drugbank(f'/drugs/{drug_id}')

        # 사용량 로깅
        APIUsageLog.objects.create(
            user=request.user,
            service='drugbank',
            endpoint=f'/drugs/{drug_id}',
            status_code=200
        )

        return Response(data)

    except ValueError as e:
        return Response(
            {'error': str(e)},
            status=status.HTTP_503_SERVICE_UNAVAILABLE
        )
    except Exception as e:
        logger.error(f"Drug info error: {e}")
        return Response(
            {'error': 'Failed to fetch drug information'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_compound_info(request, compound_name):
    """화합물 정보 조회 (PubChem API 프록시)"""

    try:
        data = external_api.call_pubchem(compound_name)

        APIUsageLog.objects.create(
            user=request.user,
            service='pubchem',
            endpoint=f'/compound/{compound_name}'
        )

        return Response(data)

    except Exception as e:
        logger.error(f"Compound info error: {e}")
        return Response(
            {'error': 'Failed to fetch compound information'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
```

---

## 보안 규칙

### 1. API 키 노출 금지

**절대 하지 말 것:**
```javascript
// ❌ 잘못된 예 - API 키를 코드에 하드코딩
const API_KEY = 'sk-1234567890abcdef';

fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${API_KEY}`  // 위험!
  }
});
```

```javascript
// ❌ 잘못된 예 - 환경 변수를 프론트엔드에서 사용
const API_KEY = import.meta.env.VITE_API_KEY;  // 위험! 빌드에 포함됨

fetch('https://api.example.com/data', {
  headers: {
    'Authorization': `Bearer ${API_KEY}`
  }
});
```

**올바른 방법:**
```javascript
// ✅ 올바른 예 - 백엔드 프록시 사용
const token = localStorage.getItem('access_token');  // 사용자 인증 토큰

fetch('/api/drug/info/DB00001', {  // 백엔드 프록시
  headers: {
    'Authorization': `Bearer ${token}`  // 사용자 인증만
  }
});
```

---

### 2. .gitignore 설정

```gitignore
# backend/django_main/.gitignore

# 환경 변수 파일
.env
.env.local
.env.production

# API 키 설정 파일
config/secrets.py
config/api_keys.json

# 인증서
*.pem
*.key
*.crt

# 데이터베이스
db.sqlite3
*.db
```

---

### 3. 프로덕션 환경 변수 설정

#### Option 1: 서버 환경 변수 (권장)

```bash
# /etc/environment 또는 systemd 서비스 파일

# Django 서비스
sudo nano /etc/systemd/system/gunicorn_django.service
```

```ini
[Service]
Environment="DRUGBANK_API_KEY=sk-xxxxxxxxxxxxxxxxxxxxxxxx"
Environment="FIREBASE_SERVER_KEY=AAAA-xxxxxxxxxxxxxxxxxxxxxxxxxxx"
Environment="ML_SERVICE_KEY=internal-ml-service-key-xxxxxxxxxx"
Environment="ENCRYPTION_KEY=32-byte-base64-encoded-key=="
```

#### Option 2: Docker Secrets (Docker 사용 시)

```yaml
# docker-compose.yml

version: '3.8'

services:
  django:
    image: neuronova-django:latest
    environment:
      - DRUGBANK_API_KEY=${DRUGBANK_API_KEY}
      - FIREBASE_SERVER_KEY=${FIREBASE_SERVER_KEY}
    secrets:
      - drugbank_api_key
      - firebase_server_key

secrets:
  drugbank_api_key:
    external: true
  firebase_server_key:
    external: true
```

---

### 4. API 키 로테이션

정기적으로 API 키를 교체해야 합니다.

```python
# backend/django_main/apps/core/management/commands/rotate_api_keys.py

from django.core.management.base import BaseCommand
import os

class Command(BaseCommand):
    help = 'Check API key expiration and notify'

    def handle(self, *args, **options):
        # API 키 만료일 확인 로직
        keys_to_check = {
            'DRUGBANK_API_KEY': os.getenv('DRUGBANK_API_KEY'),
            'FIREBASE_SERVER_KEY': os.getenv('FIREBASE_SERVER_KEY'),
        }

        for key_name, key_value in keys_to_check.items():
            if not key_value:
                self.stdout.write(
                    self.style.ERROR(f'{key_name} is not set!')
                )
            else:
                # 키 유효성 테스트
                self.stdout.write(
                    self.style.SUCCESS(f'{key_name} is configured')
                )
```

**Cron 작업:**
```bash
# 매월 1일 API 키 상태 확인
0 0 1 * * cd ~/NeuroNova/backend/django_main && python manage.py rotate_api_keys
```

---

## 에러 처리

### 1. API 키 관련 에러

```python
# backend/django_main/apps/core/exceptions.py

class APIKeyError(Exception):
    """API 키 관련 에러"""
    pass

class APIKeyNotConfiguredError(APIKeyError):
    """API 키 미설정"""
    def __init__(self, service_name):
        self.service_name = service_name
        super().__init__(f"{service_name} API key not configured")

class APIKeyInvalidError(APIKeyError):
    """API 키 유효하지 않음"""
    def __init__(self, service_name):
        self.service_name = service_name
        super().__init__(f"{service_name} API key is invalid")

class APIRateLimitError(APIKeyError):
    """API rate limit 초과"""
    def __init__(self, service_name, retry_after=None):
        self.service_name = service_name
        self.retry_after = retry_after
        msg = f"{service_name} API rate limit exceeded"
        if retry_after:
            msg += f". Retry after {retry_after} seconds"
        super().__init__(msg)
```

---

### 2. 전역 에러 핸들러

```python
# backend/django_main/apps/core/middleware.py

from django.http import JsonResponse
from .exceptions import APIKeyError, APIKeyNotConfiguredError, APIKeyInvalidError, APIRateLimitError
import logging

logger = logging.getLogger(__name__)

class APIErrorMiddleware:
    """API 에러를 일관되게 처리하는 미들웨어"""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)
        return response

    def process_exception(self, request, exception):
        if isinstance(exception, APIKeyNotConfiguredError):
            logger.error(f"API key not configured: {exception.service_name}")
            return JsonResponse({
                'error': 'Service temporarily unavailable',
                'detail': 'External API not configured'
            }, status=503)

        elif isinstance(exception, APIKeyInvalidError):
            logger.error(f"API key invalid: {exception.service_name}")
            return JsonResponse({
                'error': 'Service authentication failed',
                'detail': 'Invalid API credentials'
            }, status=503)

        elif isinstance(exception, APIRateLimitError):
            logger.warning(f"API rate limit: {exception.service_name}")
            return JsonResponse({
                'error': 'Too many requests',
                'detail': 'API rate limit exceeded',
                'retry_after': exception.retry_after
            }, status=429)

        return None
```

**settings.py에 등록:**
```python
MIDDLEWARE = [
    # ...
    'apps.core.middleware.APIErrorMiddleware',
    # ...
]
```

---

### 3. 프론트엔드 에러 처리

```javascript
// frontend/react_web/src/services/apiClient.js

class APIError extends Error {
  constructor(message, status, detail) {
    super(message);
    this.status = status;
    this.detail = detail;
  }
}

async function handleAPIResponse(response) {
  if (response.ok) {
    return response.json();
  }

  const error = await response.json();

  // API 키 관련 에러 (503)
  if (response.status === 503) {
    throw new APIError(
      'Service temporarily unavailable',
      503,
      error.detail
    );
  }

  // Rate limit (429)
  if (response.status === 429) {
    const retryAfter = error.retry_after || 60;
    throw new APIError(
      `Too many requests. Retry after ${retryAfter}s`,
      429,
      error.detail
    );
  }

  // 인증 에러 (401)
  if (response.status === 401) {
    // 토큰 갱신 또는 로그아웃
    throw new APIError('Authentication required', 401, error.detail);
  }

  throw new APIError(error.error || 'Unknown error', response.status, error.detail);
}

export { handleAPIResponse, APIError };
```

**사용 예:**
```javascript
// React 컴포넌트

import { handleAPIResponse, APIError } from './apiClient';

async function fetchDrugInfo(drugId) {
  try {
    const response = await fetch(`/api/drug/info/${drugId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    return await handleAPIResponse(response);

  } catch (error) {
    if (error instanceof APIError) {
      if (error.status === 503) {
        // 서비스 장애 알림
        showNotification('Drug information service is temporarily unavailable');
      } else if (error.status === 429) {
        // Rate limit 알림
        showNotification(error.message);
      }
    }
    throw error;
  }
}
```

---

## 모니터링 및 사용량 추적

### 1. API 사용량 로그 모델

```python
# backend/django_main/apps/core/models.py

from django.db import models
from django.contrib.auth.models import User

class APIUsageLog(models.Model):
    """외부 API 사용량 추적"""

    SERVICE_CHOICES = [
        ('drugbank', 'DrugBank'),
        ('alphafold', 'AlphaFold'),
        ('pubchem', 'PubChem'),
        ('rcsb_pdb', 'RCSB PDB'),
    ]

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='api_usage_logs'
    )
    service = models.CharField(max_length=50, choices=SERVICE_CHOICES)
    endpoint = models.CharField(max_length=500)
    method = models.CharField(max_length=10, default='GET')

    status_code = models.IntegerField(null=True)
    response_time_ms = models.IntegerField(null=True, help_text="응답 시간 (밀리초)")

    cached = models.BooleanField(default=False, help_text="캐시에서 반환됨")
    error_message = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        db_table = 'api_usage_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['service', '-created_at']),
            models.Index(fields=['user', '-created_at']),
        ]

    def __str__(self):
        return f"{self.service} - {self.endpoint} ({self.created_at})"


class APIQuota(models.Model):
    """API 사용량 할당량 관리"""

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    service = models.CharField(max_length=50)

    # 할당량
    daily_limit = models.IntegerField(default=100)
    monthly_limit = models.IntegerField(default=1000)

    # 사용량
    daily_usage = models.IntegerField(default=0)
    monthly_usage = models.IntegerField(default=0)

    # 리셋 시간
    daily_reset_at = models.DateTimeField()
    monthly_reset_at = models.DateTimeField()

    class Meta:
        db_table = 'api_quotas'
        unique_together = ['user', 'service']
```

---

### 2. 사용량 추적 데코레이터

```python
# backend/django_main/apps/core/decorators.py

from functools import wraps
from django.utils import timezone
from .models import APIUsageLog
import time

def track_api_usage(service_name):
    """
    API 사용량을 추적하는 데코레이터

    Usage:
        @track_api_usage('drugbank')
        def call_drugbank_api(...):
            ...
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            start_time = time.time()
            error_msg = ''
            status_code = None

            try:
                result = func(*args, **kwargs)
                status_code = 200
                return result
            except Exception as e:
                error_msg = str(e)
                raise
            finally:
                # 응답 시간 계산
                response_time = int((time.time() - start_time) * 1000)

                # 로그 저장
                APIUsageLog.objects.create(
                    service=service_name,
                    endpoint=func.__name__,
                    status_code=status_code or 500,
                    response_time_ms=response_time,
                    error_message=error_msg
                )

        return wrapper
    return decorator
```

**사용 예:**
```python
# backend/django_main/apps/core/services/external_api.py

from apps.core.decorators import track_api_usage

class ExternalAPIService:

    @track_api_usage('drugbank')
    def call_drugbank(self, endpoint, params=None):
        # API 호출 로직
        ...

    @track_api_usage('pubchem')
    def call_pubchem(self, compound_name):
        # API 호출 로직
        ...
```

---

### 3. 사용량 모니터링 뷰

```python
# backend/django_main/apps/core/views.py

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from django.db.models import Count, Avg, Q
from django.utils import timezone
from datetime import timedelta
from .models import APIUsageLog

@api_view(['GET'])
@permission_classes([IsAdminUser])
def api_usage_stats(request):
    """API 사용량 통계 (관리자 전용)"""

    # 기간 설정 (최근 30일)
    start_date = timezone.now() - timedelta(days=30)

    # 서비스별 사용량
    usage_by_service = APIUsageLog.objects.filter(
        created_at__gte=start_date
    ).values('service').annotate(
        total_requests=Count('id'),
        avg_response_time=Avg('response_time_ms'),
        error_count=Count('id', filter=Q(status_code__gte=400))
    )

    # 일별 사용량
    daily_usage = APIUsageLog.objects.filter(
        created_at__gte=start_date
    ).extra(
        select={'day': 'DATE(created_at)'}
    ).values('day').annotate(
        request_count=Count('id')
    ).order_by('day')

    # 캐시 히트율
    total_requests = APIUsageLog.objects.filter(
        created_at__gte=start_date
    ).count()

    cached_requests = APIUsageLog.objects.filter(
        created_at__gte=start_date,
        cached=True
    ).count()

    cache_hit_rate = (cached_requests / total_requests * 100) if total_requests > 0 else 0

    return Response({
        'period': {
            'start': start_date,
            'end': timezone.now(),
        },
        'usage_by_service': list(usage_by_service),
        'daily_usage': list(daily_usage),
        'cache_hit_rate': f'{cache_hit_rate:.2f}%',
        'total_requests': total_requests
    })
```

---

### 4. 모니터링 대시보드

```python
# backend/django_main/apps/core/admin.py

from django.contrib import admin
from .models import APIUsageLog, APIQuota

@admin.register(APIUsageLog)
class APIUsageLogAdmin(admin.ModelAdmin):
    list_display = [
        'service',
        'endpoint',
        'user',
        'status_code',
        'response_time_ms',
        'cached',
        'created_at'
    ]
    list_filter = [
        'service',
        'status_code',
        'cached',
        'created_at'
    ]
    search_fields = ['endpoint', 'user__username', 'error_message']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'

    def has_add_permission(self, request):
        return False  # 로그는 자동 생성만


@admin.register(APIQuota)
class APIQuotaAdmin(admin.ModelAdmin):
    list_display = [
        'user',
        'service',
        'daily_usage',
        'daily_limit',
        'monthly_usage',
        'monthly_limit',
        'daily_reset_at'
    ]
    list_filter = ['service']
    search_fields = ['user__username']
```

---

## 트러블슈팅

### 1. API 키가 인식되지 않음

**증상:**
```python
ValueError: DRUGBANK_API_KEY not configured
```

**해결:**
```bash
# 1. .env 파일 확인
cat ~/NeuroNova/backend/django_main/.env | grep DRUGBANK_API_KEY

# 2. 환경 변수 로드 확인
cd ~/NeuroNova/backend/django_main
python manage.py shell
>>> import os
>>> os.getenv('DRUGBANK_API_KEY')
# None이면 .env 파일이 로드되지 않은 것

# 3. python-dotenv 설치 확인
pip list | grep dotenv

# 4. settings.py에서 load_dotenv() 호출 확인
```

---

### 2. API 인증 실패 (401)

**증상:**
```
DrugBank API authentication failed
```

**해결:**
```bash
# 1. API 키 유효성 확인 (직접 테스트)
curl -H "Authorization: Bearer YOUR_API_KEY" \
  https://api.drugbank.com/v1/status

# 2. API 키 만료 확인
# DrugBank 대시보드에서 키 상태 확인

# 3. Django 로그 확인
tail -50 /var/log/neuronova/django_error.log | grep "authentication"
```

---

### 3. Rate Limit 초과 (429)

**증상:**
```
API rate limit exceeded
```

**해결:**

**단기 해결:**
```python
# 캐싱 활성화 (이미 구현됨)
# apps/core/services/external_api.py에서 캐시 시간 늘리기

# 1시간 → 24시간
cache.set(cache_key, data, 86400)  # 24시간
```

**장기 해결:**
```python
# Rate limiting 미들웨어 추가
from django.core.cache import cache
from django.http import JsonResponse
import time

class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/drug/'):
            # 사용자별 rate limit (분당 10 요청)
            user_id = request.user.id if request.user.is_authenticated else request.META.get('REMOTE_ADDR')
            cache_key = f'rate_limit:{user_id}'

            requests = cache.get(cache_key, [])
            now = time.time()

            # 1분 이내 요청만 카운트
            requests = [r for r in requests if now - r < 60]

            if len(requests) >= 10:
                return JsonResponse({
                    'error': 'Too many requests',
                    'retry_after': 60 - (now - requests[0])
                }, status=429)

            requests.append(now)
            cache.set(cache_key, requests, 60)

        return self.get_response(request)
```

---

### 4. 프론트엔드에서 CORS 에러

**증상:**
```
Access to fetch at 'https://api.drugbank.com' from origin 'https://neuronova.com'
has been blocked by CORS policy
```

**원인:**
- 프론트엔드에서 직접 외부 API 호출 시도 (비공개 API)

**해결:**
```javascript
// ❌ 잘못된 방법 - 프론트엔드에서 직접 호출
fetch('https://api.drugbank.com/v1/drugs/DB00001')  // CORS 에러!

// ✅ 올바른 방법 - 백엔드 프록시 사용
fetch('/api/drug/info/DB00001')  // 백엔드가 대신 호출
```

---

### 5. Firebase FCM 인증 실패

**증상:**
```
Firebase authentication failed: 401 Unauthorized
```

**해결:**
```bash
# 1. Firebase 프로젝트 설정 확인
# https://console.firebase.google.com/

# 2. 서버 키 재발급
# Firebase Console → 프로젝트 설정 → 클라우드 메시징 → 서버 키

# 3. .env 파일 업데이트
nano ~/NeuroNova/backend/django_main/.env
# FIREBASE_SERVER_KEY=새로운_서버_키

# 4. Django 재시작
sudo systemctl restart gunicorn_django
```

---

## 체크리스트

배포 전 API 키 관리 체크리스트:

### 개발 환경
- [ ] `.env` 파일에 모든 API 키 설정
- [ ] `.gitignore`에 `.env` 추가 확인
- [ ] API 키 유효성 테스트 완료
- [ ] 에러 처리 로직 구현

### 프로덕션 환경
- [ ] 서버 환경 변수로 API 키 설정
- [ ] 프로덕션 API 키와 개발 API 키 분리
- [ ] HTTPS 설정 완료
- [ ] API 사용량 모니터링 활성화
- [ ] Rate limiting 구현
- [ ] 캐싱 전략 적용
- [ ] 로그 수집 활성화

### 보안
- [ ] API 키가 코드에 하드코딩되지 않음
- [ ] 프론트엔드에서 API 키 노출 없음
- [ ] 비공개 API는 백엔드 프록시 사용
- [ ] API 키 로테이션 계획 수립
- [ ] 에러 메시지에 API 키 노출 방지

---

**문서 버전**: 1.0
**최종 수정일**: 2025-12-07
**작성자**: NeuroNova 개발팀
