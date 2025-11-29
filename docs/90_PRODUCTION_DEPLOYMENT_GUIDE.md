# NeuroNova 프로덕션 배포 가이드 (초보자용)

**처음 배포하시는 분을 위한 단계별 가이드입니다.**

## 목차
1. [배포 전 준비사항](#1-배포-전-준비사항)
2. [서버 준비](#2-서버-준비)
3. [도메인 및 DNS 설정](#3-도메인-및-dns-설정)
4. [서버 초기 설정](#4-서버-초기-설정)
5. [Docker 설치](#5-docker-설치)
6. [프로젝트 배포](#6-프로젝트-배포)
7. [SSL 인증서 발급](#7-ssl-인증서-발급)
8. [서비스 시작](#8-서비스-시작)
9. [모니터링 및 유지보수](#9-모니터링-및-유지보수)
10. [문제 해결](#10-문제-해결)

---

## 1. 배포 전 준비사항

### 1.1 필요한 것들

#### 인프라
- [ ] **서버**: AWS EC2, Google Cloud, Azure, 또는 VPS (최소 4GB RAM, 2 CPU)
- [ ] **도메인**: 예) neuronova.com (가비아, 호스팅KR, GoDaddy 등에서 구매)
- [ ] **SSL 인증서**: Let's Encrypt (무료, 자동 설정)

#### 계정
- [ ] Firebase 계정 (FCM 푸시 알림용)
- [ ] GitHub 계정 (코드 저장소)
- [ ] 서버 호스팅 계정 (AWS, Google Cloud 등)

#### 로컬 준비
- [ ] Git 설치
- [ ] SSH 클라이언트 (Windows: PuTTY 또는 Git Bash)

### 1.2 예상 비용 (월간)

| 항목 | 서비스 | 비용 |
|------|--------|------|
| 서버 | AWS EC2 t3.medium | ~$30-50 |
| 도메인 | 가비아 .com | ~$15/년 |
| SSL | Let's Encrypt | 무료 |
| Firebase | Free Tier | 무료 (일일 10K 메시지) |
| **합계** | | **~$30-50/월** |

---

## 2. 서버 준비

### 2.1 AWS EC2 인스턴스 생성 (예시)

1. **AWS 콘솔 접속**
   - https://aws.amazon.com/console/ 접속
   - EC2 대시보드로 이동

2. **인스턴스 시작**
   ```
   - AMI: Ubuntu Server 22.04 LTS
   - 인스턴스 타입: t3.medium (4GB RAM, 2 vCPU)
   - 스토리지: 30GB gp3
   - 보안 그룹:
     - SSH (22): 내 IP만
     - HTTP (80): 모든 IP
     - HTTPS (443): 모든 IP
     - MySQL (3306): 내부만
     - Redis (6379): 내부만
   ```

3. **키 페어 생성 및 저장**
   - `neuronova-key.pem` 다운로드
   - Windows: `C:\Users\사용자명\.ssh\neuronova-key.pem`
   - Linux/Mac: `~/.ssh/neuronova-key.pem`
   - 권한 설정:
     ```bash
     chmod 400 ~/.ssh/neuronova-key.pem
     ```

### 2.2 다른 호스팅 서비스

#### Google Cloud (GCP)
- Compute Engine → VM 인스턴스 생성
- Machine Type: e2-medium (4GB RAM)
- OS: Ubuntu 22.04 LTS

#### Azure
- Virtual Machines → 새로 만들기
- Size: Standard B2s (4GB RAM)
- OS: Ubuntu Server 22.04 LTS

#### 국내 VPS (카페24, 가비아 등)
- 4GB RAM 이상 요금제
- Ubuntu 22.04 LTS 설치

---

## 3. 도메인 및 DNS 설정

### 3.1 도메인 구매

**추천 도메인 등록 업체**:
- 가비아 (https://www.gabia.com)
- 호스팅KR (https://www.hosting.kr)
- GoDaddy (https://www.godaddy.com)

**도메인 선택 예시**:
- `neuronova.com` (추천)
- `neuronova.co.kr`
- `neuronova-cdss.com`

### 3.2 DNS 레코드 설정

도메인 관리 페이지에서 DNS 설정:

```
타입   이름              값                      TTL
A      @                 [서버 IP 주소]          3600
A      www               [서버 IP 주소]          3600
CNAME  api               neuronova.com           3600
```

**예시** (서버 IP가 `52.78.123.456`인 경우):
```
A      @                 52.78.123.456           3600
A      www               52.78.123.456           3600
```

### 3.3 DNS 전파 확인

DNS 설정 후 10분~24시간 소요됩니다.

**확인 방법**:
```bash
# Windows
nslookup neuronova.com

# Linux/Mac
dig neuronova.com

# 온라인 도구
https://www.whatsmydns.net
```

---

## 4. 서버 초기 설정

### 4.1 SSH 접속

**Windows (Git Bash)**:
```bash
ssh -i C:/Users/사용자명/.ssh/neuronova-key.pem ubuntu@[서버IP]
```

**Linux/Mac**:
```bash
ssh -i ~/.ssh/neuronova-key.pem ubuntu@[서버IP]
```

### 4.2 시스템 업데이트

```bash
# 패키지 업데이트
sudo apt-get update
sudo apt-get upgrade -y

# 시간대 설정
sudo timedatectl set-timezone Asia/Seoul

# 기본 패키지 설치
sudo apt-get install -y \
    curl \
    wget \
    git \
    vim \
    htop \
    build-essential \
    ca-certificates \
    gnupg \
    lsb-release
```

### 4.3 방화벽 설정 (UFW)

```bash
# UFW 설치 및 활성화
sudo apt-get install -y ufw

# SSH 허용 (중요! 먼저 설정)
sudo ufw allow 22/tcp

# HTTP, HTTPS 허용
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# UFW 활성화
sudo ufw enable

# 상태 확인
sudo ufw status
```

### 4.4 Swap 메모리 설정 (선택사항)

```bash
# 2GB Swap 생성
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 부팅 시 자동 마운트
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# 확인
free -h
```

---

## 5. Docker 설치

### 5.1 Docker Engine 설치

```bash
# Docker GPG 키 추가
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Docker 리포지토리 추가
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Docker 설치
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Docker 버전 확인
docker --version
docker compose version
```

### 5.2 Docker 권한 설정

```bash
# 현재 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# 변경사항 적용 (재로그인 필요)
newgrp docker

# 권한 확인
docker ps
```

### 5.3 Docker Compose 설치 (별도)

```bash
# 최신 버전 다운로드
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 실행 권한 부여
sudo chmod +x /usr/local/bin/docker-compose

# 버전 확인
docker-compose --version
```

---

## 6. 프로젝트 배포

### 6.1 프로젝트 클론

```bash
# 홈 디렉토리에서 작업
cd ~

# Git 클론
git clone https://github.com/your-username/NeuroNova.git
cd NeuroNova
```

### 6.2 환경변수 설정

```bash
# 프로덕션 환경변수 파일 생성
cp .env.production.example .env.production

# 환경변수 편집
nano .env.production
```

**필수 변경 사항**:
```bash
# Django Secret Key 생성
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# .env.production 파일에서 변경:
DJANGO_SECRET_KEY=위에서_생성한_키
ALLOWED_HOSTS=neuronova.com,www.neuronova.com

# 데이터베이스 비밀번호 (강력한 비밀번호 사용)
DB_PASSWORD=your-strong-db-password
DB_ROOT_PASSWORD=your-strong-root-password

# Redis 비밀번호
REDIS_PASSWORD=your-strong-redis-password

# Orthanc 비밀번호
ORTHANC_USERNAME=admin
ORTHANC_PASSWORD=your-strong-orthanc-password

# 도메인
CERTBOT_EMAIL=your-email@example.com
CERTBOT_DOMAIN=neuronova.com

# React API URL
REACT_API_BASE_URL=https://neuronova.com/api/v1
REACT_ORTHANC_URL=https://neuronova.com/orthanc
```

### 6.3 Firebase 설정

```bash
# Firebase 서비스 계정 JSON 파일 업로드
mkdir -p backend/django_main/config
nano backend/django_main/config/firebase-service-account.json

# Firebase Console에서 다운로드한 JSON 내용 붙여넣기
```

### 6.4 Django 프로덕션 Dockerfile 생성

```bash
# Dockerfile.prod 생성
nano backend/django_main/Dockerfile.prod
```

**Dockerfile.prod 내용**:
```dockerfile
FROM python:3.10-slim

WORKDIR /app

# 시스템 의존성 설치
RUN apt-get update && apt-get install -y \
    gcc \
    default-libmysqlclient-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Python 의존성 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

# 프로젝트 파일 복사
COPY . .

# Static 파일 수집
RUN python manage.py collectstatic --noinput

# Gunicorn으로 실행
CMD ["gunicorn", "neuronova.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "4", "--timeout", "120"]
```

### 6.5 React 프로덕션 Dockerfile 생성

```bash
nano frontend/react_web/Dockerfile.prod
```

**Dockerfile.prod 내용**:
```dockerfile
# Build stage
FROM node:18-alpine AS build

WORKDIR /app

# 빌드 인자
ARG VITE_API_BASE_URL
ARG VITE_ORTHANC_URL

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_ORTHANC_URL=${VITE_ORTHANC_URL}

# 의존성 설치
COPY package*.json ./
RUN npm ci

# 소스 복사 및 빌드
COPY . .
RUN npm run build

# Production stage
FROM nginx:1.25-alpine

# Nginx 설정
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

---

## 7. SSL 인증서 발급

### 7.1 Nginx 설정 수정

```bash
# Nginx 설정에서 도메인 변경
nano config/nginx/nginx.conf

# server_name을 실제 도메인으로 변경:
server_name neuronova.com;  # 실제 도메인으로 변경
```

### 7.2 Let's Encrypt 인증서 발급

```bash
# Certbot 스크립트 실행 권한 부여
chmod +x config/nginx/certbot-init.sh

# 스크립트에서 도메인과 이메일 수정
nano config/nginx/certbot-init.sh

# 실행
sudo ./config/nginx/certbot-init.sh
```

**수동 발급 방법** (스크립트가 작동하지 않을 경우):
```bash
# Certbot 설치
sudo apt-get install -y certbot

# 인증서 발급 (80번 포트 사용)
sudo certbot certonly --standalone \
    --preferred-challenges http \
    --email your-email@example.com \
    --agree-tos \
    --no-eff-email \
    -d neuronova.com \
    -d www.neuronova.com

# 인증서 경로 확인
sudo ls -la /etc/letsencrypt/live/neuronova.com/
```

### 7.3 자동 갱신 설정

```bash
# Cron 작업 추가 (매일 새벽 2시 갱신 시도)
sudo crontab -e

# 다음 라인 추가:
0 2 * * * certbot renew --quiet --post-hook "docker-compose -f /home/ubuntu/NeuroNova/docker-compose.prod.yml restart nginx"
```

---

## 8. 서비스 시작

### 8.1 Docker 이미지 빌드

```bash
cd ~/NeuroNova

# 환경변수 로드
set -a
source .env.production
set +a

# Docker Compose로 빌드
docker-compose -f docker-compose.prod.yml build
```

### 8.2 데이터베이스 마이그레이션

```bash
# Django 컨테이너에서 마이그레이션 실행
docker-compose -f docker-compose.prod.yml run --rm django python manage.py migrate

# 슈퍼유저 생성
docker-compose -f docker-compose.prod.yml run --rm django python manage.py createsuperuser
```

### 8.3 서비스 시작

```bash
# 백그라운드에서 모든 서비스 시작
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f

# 특정 서비스 로그만 확인
docker-compose -f docker-compose.prod.yml logs -f django
docker-compose -f docker-compose.prod.yml logs -f nginx
```

### 8.4 서비스 상태 확인

```bash
# 실행 중인 컨테이너 확인
docker ps

# 서비스 상태 확인
docker-compose -f docker-compose.prod.yml ps

# Health check
curl http://localhost/health
```

---

## 9. 모니터링 및 유지보수

### 9.1 로그 확인

```bash
# 실시간 로그 모니터링
docker-compose -f docker-compose.prod.yml logs -f

# 최근 100줄 로그
docker-compose -f docker-compose.prod.yml logs --tail=100

# 특정 서비스 로그
docker-compose -f docker-compose.prod.yml logs django
docker-compose -f docker-compose.prod.yml logs nginx
```

### 9.2 데이터베이스 백업

```bash
# 백업 스크립트 생성
nano ~/backup-db.sh
```

**backup-db.sh 내용**:
```bash
#!/bin/bash

BACKUP_DIR="/home/ubuntu/backups"
DATE=$(date +"%Y%m%d_%H%M%S")
CONTAINER_NAME="neuronova_db"

mkdir -p $BACKUP_DIR

# MySQL 백업
docker exec $CONTAINER_NAME mysqldump -u root -p[DB_ROOT_PASSWORD] neuronova_prod > "$BACKUP_DIR/db_backup_$DATE.sql"

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Backup completed: db_backup_$DATE.sql"
```

```bash
# 실행 권한 부여
chmod +x ~/backup-db.sh

# Cron 작업 추가 (매일 새벽 3시 백업)
crontab -e

# 다음 라인 추가:
0 3 * * * /home/ubuntu/backup-db.sh >> /home/ubuntu/backup.log 2>&1
```

### 9.3 서버 리소스 모니터링

```bash
# 실시간 리소스 사용량
htop

# Docker 컨테이너 리소스 사용량
docker stats

# 디스크 사용량
df -h

# 메모리 사용량
free -h
```

### 9.4 업데이트 배포

```bash
cd ~/NeuroNova

# 최신 코드 받기
git pull origin main

# 환경변수 로드
set -a
source .env.production
set +a

# 서비스 중지
docker-compose -f docker-compose.prod.yml down

# 이미지 재빌드
docker-compose -f docker-compose.prod.yml build

# 마이그레이션 (필요 시)
docker-compose -f docker-compose.prod.yml run --rm django python manage.py migrate

# 서비스 시작
docker-compose -f docker-compose.prod.yml up -d

# 로그 확인
docker-compose -f docker-compose.prod.yml logs -f
```

---

## 10. 문제 해결

### 10.1 일반적인 문제

#### 문제 1: 502 Bad Gateway

**원인**: Django 또는 Flask 서비스가 시작되지 않음

**해결**:
```bash
# Django 로그 확인
docker-compose -f docker-compose.prod.yml logs django

# Django 재시작
docker-compose -f docker-compose.prod.yml restart django
```

#### 문제 2: SSL 인증서 오류

**원인**: DNS가 올바르게 설정되지 않음

**해결**:
```bash
# DNS 확인
nslookup neuronova.com

# DNS 전파 확인
# https://www.whatsmydns.net

# 인증서 재발급
sudo certbot certonly --standalone -d neuronova.com
```

#### 문제 3: 데이터베이스 연결 실패

**원인**: MySQL 컨테이너가 시작되지 않음

**해결**:
```bash
# MySQL 로그 확인
docker-compose -f docker-compose.prod.yml logs db

# MySQL 재시작
docker-compose -f docker-compose.prod.yml restart db

# 연결 테스트
docker exec -it neuronova_db mysql -u neuronova_user -p
```

#### 문제 4: 디스크 공간 부족

**원인**: Docker 이미지 및 볼륨이 너무 많음

**해결**:
```bash
# 사용하지 않는 이미지 삭제
docker image prune -a

# 사용하지 않는 볼륨 삭제
docker volume prune

# 모든 정리
docker system prune -a --volumes
```

### 10.2 유용한 명령어

```bash
# 컨테이너 내부 접속
docker exec -it neuronova_django bash
docker exec -it neuronova_db bash

# Django 관리 명령어 실행
docker-compose -f docker-compose.prod.yml exec django python manage.py [명령어]

# 예: Static 파일 재수집
docker-compose -f docker-compose.prod.yml exec django python manage.py collectstatic --noinput

# 예: Django Shell
docker-compose -f docker-compose.prod.yml exec django python manage.py shell

# 서비스 재시작
docker-compose -f docker-compose.prod.yml restart [서비스명]

# 전체 재시작
docker-compose -f docker-compose.prod.yml restart
```

---

## 11. 보안 체크리스트

### 배포 전 확인사항

- [ ] `.env.production` 파일에 강력한 비밀번호 설정
- [ ] `DJANGO_SECRET_KEY` 변경
- [ ] `DEBUG=False` 설정
- [ ] `ALLOWED_HOSTS`에 실제 도메인만 포함
- [ ] Firebase 설정 파일 `.gitignore`에 추가
- [ ] SSH 포트 변경 (선택사항)
- [ ] Fail2ban 설치 (무차별 대입 공격 방어)
- [ ] 정기 백업 설정
- [ ] HTTPS 강제 리다이렉트 확인

### Fail2ban 설치 (선택사항)

```bash
# Fail2ban 설치
sudo apt-get install -y fail2ban

# SSH 보호 활성화
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

---

## 12. 성능 최적화

### 12.1 Nginx 캐싱

이미 `config/nginx/nginx.conf`에 설정되어 있습니다:
- Static 파일 1년 캐싱
- Gzip 압축 활성화

### 12.2 Django 최적화

```python
# settings.py에 추가

# 정적 파일 압축
STATICFILES_STORAGE = 'django.contrib.staticfiles.storage.ManifestStaticFilesStorage'

# 캐싱
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': f'redis://{REDIS_HOST}:{REDIS_PORT}/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
            'PASSWORD': REDIS_PASSWORD,
        }
    }
}
```

### 12.3 데이터베이스 최적화

```bash
# MySQL 설정 파일 생성
mkdir -p config/mysql
nano config/mysql/my.cnf
```

**my.cnf 내용**:
```ini
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 1G
innodb_log_file_size = 256M
query_cache_size = 64M
query_cache_type = 1
```

---

## 13. 참고 자료

### 공식 문서
- [Docker Documentation](https://docs.docker.com/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt](https://letsencrypt.org/)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)

### 추천 도구
- [Portainer](https://www.portainer.io/) - Docker GUI 관리
- [Grafana](https://grafana.com/) - 모니터링 대시보드
- [Sentry](https://sentry.io/) - 에러 추적

---

## 14. 빠른 참조

### 서비스 관리

```bash
# 시작
docker-compose -f docker-compose.prod.yml up -d

# 중지
docker-compose -f docker-compose.prod.yml down

# 재시작
docker-compose -f docker-compose.prod.yml restart

# 로그
docker-compose -f docker-compose.prod.yml logs -f

# 상태 확인
docker-compose -f docker-compose.prod.yml ps
```

### 긴급 상황

```bash
# 모든 서비스 강제 종료
docker-compose -f docker-compose.prod.yml kill

# 모든 컨테이너 삭제 (데이터는 유지)
docker-compose -f docker-compose.prod.yml down

# 모든 컨테이너 및 볼륨 삭제 (주의!)
docker-compose -f docker-compose.prod.yml down -v
```

---

**작성일**: 2025-11-28
**버전**: 1.0
**작성자**: Claude Code
**문의**: admin@neuronova.com
