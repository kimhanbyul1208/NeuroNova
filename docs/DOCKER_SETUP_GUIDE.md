# Docker 설정 및 실행 가이드

## 📋 목차
1. [Docker 실행 과정에서 발생한 문제](#docker-실행-과정에서-발생한-문제)
2. [문제 해결 과정](#문제-해결-과정)
3. [현재 Docker 구성](#현재-docker-구성)
4. [운영 환경 설정 방법](#운영-환경-설정-방법)
5. [Docker 관리 명령어](#docker-관리-명령어)

---

## Docker 실행 과정에서 발생한 문제

### 1. React 빌드 실패 (npm install 오류)
**문제**:
```
npm error ERESOLVE unable to resolve dependency tree
```

**원인**:
- React 19와 MUI 5.14의 peer dependency 버전 충돌
- package.json에서 React 19를 사용하는데, MUI가 아직 React 19를 공식 지원하지 않음

**해결**:
```dockerfile
# frontend/react_web/Dockerfile
RUN npm install --legacy-peer-deps
```
- `--legacy-peer-deps` 플래그로 peer dependency 경고 무시

---

### 2. Django - MySQL 연결 실패
**문제**:
```
django.db.utils.OperationalError: (2003, "Can't connect to MySQL server on 'db'")
```

**원인**:
- MySQL 컨테이너가 완전히 초기화되기 전에 Django 컨테이너가 먼저 시작
- Django가 DB 연결을 시도했지만 MySQL이 아직 준비되지 않음

**해결**:
```bash
# MySQL 로그 확인 후 Django 재시작
docker logs neuronova-db-1  # MySQL 준비 상태 확인
docker restart neuronova-django-1  # Django 재시작
```

**근본적 해결 방법** (향후 적용 권장):
```yaml
# docker-compose.yml
services:
  db:
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  django:
    depends_on:
      db:
        condition: service_healthy  # MySQL이 완전히 준비될 때까지 대기
```

---

### 3. 마이그레이션 미실행
**문제**:
```
You have 22 unapplied migration(s).
```

**원인**:
- 새로 생성된 MySQL 데이터베이스에 Django 테이블이 없음

**해결**:
```bash
docker exec neuronova-django-1 python manage.py migrate
```

---

## 문제 해결 과정

### 실행 순서

1. **React Dockerfile 수정**
   ```bash
   # frontend/react_web/Dockerfile에 --legacy-peer-deps 추가
   ```

2. **Docker Compose 빌드 및 실행**
   ```bash
   docker-compose up --build django react db redis
   ```

3. **MySQL 준비 대기**
   ```bash
   # MySQL 로그에서 "ready for connections" 확인
   docker logs neuronova-db-1 | grep "ready for connections"
   ```

4. **Django 재시작**
   ```bash
   docker restart neuronova-django-1
   ```

5. **마이그레이션 실행**
   ```bash
   docker exec neuronova-django-1 python manage.py migrate
   ```

6. **정상 작동 확인**
   ```bash
   curl http://localhost:3000  # React
   curl http://localhost:8000/api/schema/  # Django API
   ```

---

## 현재 Docker 구성

### 실행 중인 서비스

| 서비스 | 포트 | 용도 | 비고 |
|--------|------|------|------|
| **django** | 8000 | Django REST API 서버 | 백엔드 API |
| **react** | 3000 | React Web (Nginx) | 프론트엔드 웹 |
| **redis** | 6379 | Redis 캐시/세션 | 필수 |
| **flask** | 5000 | AI 추론 서버 | ML 모델 서빙 |

**제거된 서비스**:
- ~~MySQL (db)~~ → 원격 MySQL 사용 (.env 설정)
- ~~Orthanc~~ → 나중에 별도 서버에 설치 예정

### ✅ 원격 DB 사용 설정 완료

**현재 구성**:
- **MySQL**: 원격 DB 사용 (settings.py에서 .env 파일 참조)
- **Docker Compose**: 로컬 MySQL 제거됨
- **DB 설정**: `backend/django_main/.env` 파일에서 관리

**설정 방법**:
1. `.env` 파일 생성 (아래 참조)
2. 원격 DB 정보 입력
3. Docker Compose 실행

```bash
# backend/django_main/.env
DB_ENGINE=django.db.backends.mysql
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_HOST=your-remote-db-host
DB_PORT=3306
```

**Orthanc 서버**:
- **현재 상태**: Docker Compose에서 제거됨
- **향후 계획**: 별도 서버에 설치 예정 (Django와 같은 서버)
- **코드**: API 클라이언트만 구현되어 있음 ([orthanc_service.py](../backend/django_main/apps/core/services/orthanc_service.py))

---

## 운영 환경 설정 방법

### 1. 현재 docker-compose.yml (이미 정리됨 ✅)

**현재 구성 (원격 DB 사용)**:

```yaml
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

  django:
    build: ./backend/django_main
    command: python manage.py runserver 0.0.0.0:8000
    volumes:
      - ./backend/django_main:/app
    ports:
      - "8000:8000"
    depends_on:
      - redis
    environment:
      # DB 설정은 .env 파일에서 관리 (원격 DB 사용)
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_DB=0
    restart: unless-stopped

  flask:
    build: ./backend/flask_inference
    command: python app.py
    volumes:
      - ./backend/flask_inference:/app
    ports:
      - "5000:5000"
    environment:
      - DJANGO_API_URL=http://django:8000
    restart: unless-stopped

  react:
    build:
      context: ./frontend/react_web
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    depends_on:
      - django
    restart: unless-stopped
```

**운영 환경 추가 설정** (필요 시):

- Gunicorn으로 Django 실행 변경
- Static/Media 볼륨 추가
- Nginx 리버스 프록시 추가

---

### 2. 환경 변수 설정

#### backend/django_main/.env 파일 생성

**⚠️ 중요**: 이 파일은 절대 Git에 커밋하지 마세요!

```env
# Django Settings
SECRET_KEY=your-production-secret-key-here-CHANGE-THIS
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com

# 원격 MySQL 설정 (필수)
DB_ENGINE=django.db.backends.mysql
DB_NAME=your-database-name
DB_USER=your-database-user
DB_PASSWORD=your-database-password
DB_HOST=your-remote-db-host
DB_PORT=3306

# Redis (Docker 내부 Redis 사용)
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Flask AI Server
FLASK_INFERENCE_URL=http://flask:5000
FLASK_API_KEY=your-production-api-key

# Orthanc (나중에 설정)
ORTHANC_URL=http://your-orthanc-server:8042
ORTHANC_USERNAME=orthanc
ORTHANC_PASSWORD=your-orthanc-password

# JWT
JWT_SECRET_KEY=your-jwt-secret-key-CHANGE-THIS
JWT_ACCESS_TOKEN_LIFETIME=60
JWT_REFRESH_TOKEN_LIFETIME=1440

# Firebase (선택사항 - FCM 사용 시)
# Firebase Admin SDK는 firebase-service-account.json 파일 사용
```

**개발 환경 예시** (`backend/django_main/.env`):
```env
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

DB_ENGINE=django.db.backends.mysql
DB_NAME=your-db-name
DB_USER=your-db-user
DB_PASSWORD=your-db-password
DB_HOST=your-remote-db-host
DB_PORT=3306

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0
```

---

### 3. 운영 환경 배포 체크리스트

#### 배포 전 확인사항:

- [ ] `.env` 파일 생성 및 운영 환경 설정
- [ ] `SECRET_KEY` 변경 (절대 공개하지 말 것!)
- [ ] `DEBUG=False` 설정
- [ ] `ALLOWED_HOSTS` 도메인 추가
- [ ] 원격 MySQL DB 연결 확인
- [ ] Firebase Admin SDK 키 (`firebase-service-account.json`) 배치
- [ ] Static 파일 수집: `docker exec django python manage.py collectstatic`
- [ ] 마이그레이션: `docker exec django python manage.py migrate`
- [ ] 슈퍼유저 생성: `docker exec -it django python manage.py createsuperuser`

#### SSL/HTTPS 설정 (필수):

```bash
# Let's Encrypt 인증서 발급 (무료)
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d your-domain.com -d www.your-domain.com
```

---

## Docker 동작 원리

### 1. Multi-stage Build (React)

```dockerfile
# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build  # dist/ 폴더 생성

# Stage 2: Production
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
# 최종 이미지에는 Node.js 없이 Nginx + 빌드 결과물만 포함
```

**장점**:
- 최종 이미지 크기 최소화 (Node.js 포함 X)
- 프로덕션 환경에 불필요한 개발 도구 제거

---

### 2. Docker Compose 네트워크

```
┌─────────────────────────────────────┐
│   Docker Compose Network (neuronova) │
│                                     │
│  ┌────────┐    ┌────────┐          │
│  │ React  │───▶│ Django │          │
│  │ :3000  │    │ :8000  │          │
│  └────────┘    └───┬────┘          │
│                    │                │
│                    ▼                │
│              ┌─────────┐            │
│              │  Redis  │            │
│              │  :6379  │            │
│              └─────────┘            │
│                                     │
│  ┌────────┐                         │
│  │ Flask  │◀────AI 추론 요청        │
│  │ :5000  │                         │
│  └────────┘                         │
└─────────────────────────────────────┘
           │
           ▼
    ┌──────────────┐
    │ 외부 원격 DB  │
    │ 34.61.113.204│
    └──────────────┘
```

**특징**:
- 컨테이너 간 이름으로 통신 가능 (예: `http://django:8000`)
- 외부 포트와 내부 포트 매핑 (예: `3000:80` → 외부 3000, 내부 80)

---

### 3. Volume 마운트

#### 개발 환경 (코드 수정 시 자동 반영):
```yaml
volumes:
  - ./backend/django_main:/app  # 로컬 코드 → 컨테이너 실시간 동기화
```

#### 프로덕션 환경 (데이터 영구 저장):
```yaml
volumes:
  - mysql_data:/var/lib/mysql  # MySQL 데이터 영구 저장
  - static_volume:/app/staticfiles  # Django static 파일
  - media_volume:/app/media  # 업로드 파일
```

---

## Docker 관리 명령어

### 기본 명령어

```bash
# 전체 서비스 시작 (백그라운드)
docker-compose up -d

# 특정 서비스만 시작
docker-compose up -d django react redis

# 빌드 후 시작 (코드 변경 시)
docker-compose up -d --build

# 로그 확인
docker-compose logs -f
docker-compose logs -f django  # 특정 서비스만

# 서비스 중지
docker-compose stop

# 서비스 제거 (볼륨 유지)
docker-compose down

# 서비스 제거 (볼륨 삭제)
docker-compose down -v

# 서비스 재시작
docker-compose restart django
```

---

### Django 관련 명령어

```bash
# 마이그레이션 생성
docker exec neuronova-django-1 python manage.py makemigrations

# 마이그레이션 적용
docker exec neuronova-django-1 python manage.py migrate

# Static 파일 수집
docker exec neuronova-django-1 python manage.py collectstatic --noinput

# Django Shell
docker exec -it neuronova-django-1 python manage.py shell

# 슈퍼유저 생성
docker exec -it neuronova-django-1 python manage.py createsuperuser

# 로그 실시간 확인
docker logs -f neuronova-django-1
```

---

### 디버깅 명령어

```bash
# 실행 중인 컨테이너 확인
docker ps

# 모든 컨테이너 확인 (중지된 것 포함)
docker ps -a

# 컨테이너 내부 접속
docker exec -it neuronova-django-1 bash
docker exec -it neuronova-react-1 sh  # Alpine은 sh

# 컨테이너 리소스 사용량 확인
docker stats

# 컨테이너 상세 정보
docker inspect neuronova-django-1

# 네트워크 확인
docker network ls
docker network inspect neuronova_default

# 볼륨 확인
docker volume ls
docker volume inspect neuronova_mysql_data
```

---

## 트러블슈팅

### 1. 포트 충돌 오류
```bash
Error: Bind for 0.0.0.0:3000 failed: port is already allocated
```

**해결**:
```bash
# 포트 사용 중인 프로세스 확인 (Windows)
netstat -ano | findstr :3000

# 프로세스 종료
taskkill /PID <PID> /F
```

---

### 2. 디스크 공간 부족
```bash
# 사용하지 않는 이미지/컨테이너/볼륨 정리
docker system prune -a --volumes

# 개별 정리
docker container prune  # 중지된 컨테이너
docker image prune -a   # 사용하지 않는 이미지
docker volume prune     # 사용하지 않는 볼륨
```

---

### 3. 빌드 캐시 문제
```bash
# 캐시 없이 완전히 새로 빌드
docker-compose build --no-cache django

# 모든 서비스 재빌드
docker-compose build --no-cache
```

---

### 4. 네트워크 연결 문제
```bash
# 네트워크 재생성
docker-compose down
docker network prune
docker-compose up -d
```

---

## 보안 권장사항

1. **환경 변수 관리**
   - `.env` 파일을 `.gitignore`에 추가
   - 민감한 정보는 절대 Git에 커밋하지 말 것
   - 운영 환경은 별도 `.env.production` 사용

2. **시크릿 관리**
   - Docker Secrets 사용 권장 (Swarm mode)
   - 또는 AWS Secrets Manager, Vault 등 사용

3. **이미지 보안**
   - 공식 이미지 사용 (node:18-alpine, python:3.10-slim)
   - 정기적인 이미지 업데이트
   - 취약점 스캔: `docker scan neuronova-django`

4. **네트워크 격리**
   - 내부 통신만 필요한 서비스는 포트 노출 제거
   - Nginx를 리버스 프록시로 사용하여 Django/Flask 직접 노출 방지

---

## 다음 단계

### 개발 환경
- [x] Docker Compose 실행 성공
- [x] Django + React + Redis 정상 작동
- [ ] 로컬에서 기능 테스트

### 운영 환경 준비
- [ ] `.env` 파일 운영 환경 설정
- [ ] docker-compose.yml 정리 (db, orthanc 제거)
- [ ] Nginx 리버스 프록시 설정
- [ ] SSL 인증서 설정
- [ ] CI/CD 파이프라인 구성 (GitHub Actions)
- [ ] 모니터링 설정 (Prometheus, Grafana)

---

**작성일**: 2025-11-29
**마지막 업데이트**: 2025-11-29
