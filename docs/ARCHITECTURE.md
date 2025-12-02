# NeuroNova 시스템 아키텍처

## 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                         클라이언트                                │
│                  (React Web / Flutter App)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ↓ HTTP/HTTPS
┌─────────────────────────────────────────────────────────────────┐
│                      Nginx (포트 80/443)                         │
│  - React 정적 파일 서빙                                           │
│  - Django API 프록시 (/api/, /admin/, /ml/)                      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
              ↓             ↓             ↓
         / (Static)    /api/, /admin/   /ml/
              │             │             │
              │             ↓             │
              │   ┌──────────────────┐   │
              │   │  Django:8000     │←──┘
              │   │  (Gunicorn)      │
              │   │                  │
              │   │  - DRF API       │
              │   │  - Admin         │
              │   │  - ml_proxy 앱   │────┐
              │   └──────────────────┘    │
              │            │               │ HTTP Request
              ↓            ↓               │ (127.0.0.1:9000)
    React Static Files  MySQL/Redis       │
                                           ↓
                              ┌─────────────────────────┐
                              │  Flask:9000 (로컬 전용)  │
                              │  (Gunicorn)             │
                              │                         │
                              │  - AI 추론 서버          │
                              │  - 127.0.0.1 바인딩     │
                              │  - 외부 접근 불가        │
                              └─────────────────────────┘
```

## 라우팅 규칙

### Nginx 라우팅

| 경로 | 처리 | 설명 |
|------|------|------|
| `/` | Nginx 직접 서빙 | React 빌드 파일 (정적 파일) |
| `/api/*` | Nginx → Django | Django REST API |
| `/admin/*` | Nginx → Django | Django Admin |
| `/ml/*` | Nginx → Django | ML API (Django가 Flask로 프록시) |
| `/static/*` | Nginx 직접 서빙 | Django 정적 파일 (collectstatic) |
| `/media/*` | Nginx 직접 서빙 | 업로드된 미디어 파일 |

### Django 라우팅 (ml_proxy)

| 경로 | Django 처리 | Flask 전달 |
|------|-------------|-----------|
| `POST /ml/v1/predict/` | 요청 검증 → Flask 프록시 | `POST /api/v1/predict` |
| `GET /ml/v1/status/` | Flask 프록시 | `GET /api/v1/status` |
| `GET /ml/v1/model-info/` | Flask 프록시 | `GET /api/v1/model-info` |
| `POST /ml/v1/retrain/` | Flask 프록시 | `POST /api/v1/retrain` |
| `GET /ml/v1/history/` | Django DB 조회 | (프록시 없음) |

## 보안 설계

### 계층별 보안

1. **외부 계층 (Nginx)**
   - Rate limiting으로 DDoS 방어
   - SSL/TLS 암호화 (HTTPS)
   - 정적 파일 캐싱
   - 요청 크기 제한 (100MB)

2. **중간 계층 (Django)**
   - JWT 인증/인가
   - CORS 설정
   - CSRF 보호
   - API 요청 로깅
   - ml_proxy를 통한 Flask 접근 제어

3. **내부 계층 (Flask)**
   - 로컬 전용 (`127.0.0.1:9000`)
   - 외부 직접 접근 불가
   - Django를 통해서만 접근

### 보안 이점

✅ **Flask 외부 노출 차단**: Flask는 로컬 전용으로 동작하여 외부에서 직접 접근 불가
✅ **Django 보안 계층**: Django에서 인증/인가/로깅 등 보안 기능 제공
✅ **감사 추적**: Django ml_proxy가 모든 ML 요청/응답을 DB에 로깅
✅ **Rate Limiting**: Nginx에서 API 호출 속도 제한

## 포트 구성

| 서비스 | 포트 | 바인딩 주소 | 외부 접근 |
|--------|------|------------|----------|
| Nginx | 80, 443 | 0.0.0.0 | ✅ 가능 |
| Django | 8000 | 127.0.0.1 | ❌ 불가 (Nginx 통해서만) |
| Flask | 9000 | 127.0.0.1 | ❌ 불가 (Django 통해서만) |
| MySQL | 3306 | 127.0.0.1 | ❌ 불가 (로컬 전용) |
| Redis | 6379 | 127.0.0.1 | ❌ 불가 (로컬 전용) |

## 요청 흐름 예시

### 1. React 정적 파일 요청

```
Client → Nginx:80 → React Static Files
```

### 2. Django API 요청

```
Client → Nginx:80 → Django:8000 → MySQL/Redis
         (/api/)
```

### 3. ML 추론 요청

```
Client → Nginx:80 → Django:8000 → Flask:127.0.0.1:9000
         (/ml/)      (ml_proxy)      (AI 추론)
                         ↓
                      MySQL (로깅)
```

## 배포 구성 요소

### WSGI 서버 (Gunicorn)

**Django Gunicorn:**
- 워커: 3개
- 바인딩: 127.0.0.1:8000
- 타임아웃: 120초
- 재시작 정책: always

**Flask Gunicorn:**
- 워커: 2개
- 바인딩: 127.0.0.1:9000
- 타임아웃: 300초 (AI 추론 시간 고려)
- 재시작 정책: always

### Systemd 서비스

- `gunicorn_django.service`: Django WSGI 서버
- `gunicorn_flask.service`: Flask WSGI 서버
- `nginx.service`: Nginx 웹 서버

## 데이터 흐름

### ML 추론 요청 처리

1. 클라이언트가 `POST /ml/v1/predict/` 호출
2. Nginx가 요청을 Django로 프록시
3. Django `ml_proxy` 앱이 요청 수신
4. Django가 요청을 검증하고 Flask로 프록시
5. Flask가 AI 모델로 추론 수행
6. Flask가 결과를 Django로 반환
7. Django가 결과를 DB에 로깅 (InferenceLog 모델)
8. Django가 결과를 Nginx로 반환
9. Nginx가 결과를 클라이언트로 전달

### 추론 이력 조회

1. 클라이언트가 `GET /ml/v1/history/` 호출
2. Nginx가 요청을 Django로 프록시
3. Django `ml_proxy` 앱이 DB에서 이력 조회
4. Django가 결과를 JSON으로 반환

## 확장성 고려사항

### 수평 확장 (Horizontal Scaling)

1. **Django**: Gunicorn 워커 수 증가 또는 여러 인스턴스 실행
2. **Flask**: Gunicorn 워커 수 증가 또는 여러 인스턴스 실행
3. **Nginx**: 로드 밸런서로 여러 Django/Flask 인스턴스 분산

### 성능 최적화

1. **캐싱**: Redis를 활용한 API 응답 캐싱
2. **비동기 처리**: Celery를 활용한 백그라운드 작업
3. **DB 최적화**: 인덱스, 쿼리 최적화
4. **정적 파일**: CDN을 통한 정적 파일 서빙

## 모니터링 및 로깅

### 로그 위치

- Nginx: `/var/log/nginx/error.log`, `/var/log/nginx/access.log`
- Django: `journalctl -u gunicorn_django`
- Flask: `journalctl -u gunicorn_flask`
- Django Application: `backend/django_main/logs/django.log`

### 모니터링 지표

- API 응답 시간
- 에러율
- ML 추론 시간
- 시스템 리소스 사용량 (CPU, 메모리, 디스크)

## 참고 문서

- [배포 가이드](./09_배포가이드.md)
- [Flask ML 서버 통합](./12_flask_ai_integration.md)
