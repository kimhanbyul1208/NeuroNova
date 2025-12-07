#!/bin/bash

# ============================================
# NeuroNova 수동 배포 스크립트
# ============================================

set -e  # 에러 발생 시 중단

echo "===== NeuroNova 수동 배포 시작 ====="

# ============================================
# 1. 환경 확인
# ============================================

echo "1. 환경 확인 중..."

# 현재 디렉토리 확인
if [ ! -d "/var/www/neuronova" ]; then
    echo "❌ 오류: /var/www/neuronova 디렉토리가 없습니다."
    echo "먼저 git clone을 실행하세요."
    exit 1
fi

cd /var/www/neuronova

# .env 파일 확인
if [ ! -f "backend/django_main/.env" ]; then
    echo "❌ 오류: .env 파일이 없습니다."
    echo "backend/django_main/.env 파일을 업로드하세요."
    exit 1
fi

echo "✅ 환경 확인 완료"

# ============================================
# 2. Python 가상환경 설정
# ============================================

echo "2. Python 가상환경 설정 중..."

cd backend/django_main

# 가상환경이 없으면 생성
if [ ! -d "venv" ]; then
    echo "가상환경 생성 중..."
    python3 -m venv venv
fi

# 가상환경 활성화
source venv/bin/activate

# 패키지 업데이트
pip install --upgrade pip

# 의존성 설치
echo "Django 의존성 설치 중..."
pip install -r requirements.txt

echo "✅ Python 설정 완료"

# ============================================
# 3. 데이터베이스 설정
# ============================================

echo "3. 데이터베이스 설정 중..."

# 마이그레이션
python manage.py makemigrations
python manage.py migrate

echo "✅ 데이터베이스 설정 완료"

# ============================================
# 4. 정적 파일 수집
# ============================================

echo "4. 정적 파일 수집 중..."

python manage.py collectstatic --noinput

echo "✅ 정적 파일 수집 완료"

# ============================================
# 5. React 프론트엔드 빌드
# ============================================

echo "5. React 빌드 중..."

cd ../../frontend/react_web

# Node 모듈 설치
if [ ! -d "node_modules" ]; then
    echo "Node 모듈 설치 중..."
    npm install
fi

# React 빌드
npm run build

echo "✅ React 빌드 완료"

# ============================================
# 6. ML 모델 확인
# ============================================

echo "6. ML 모델 확인 중..."

cd ../../backend/flask_ml

# 모델 디렉토리 생성
mkdir -p models

# 모델 파일 확인
if [ ! -f "models/xray_pneumonia_model.h5" ]; then
    echo "⚠️  경고: ML 모델 파일이 없습니다."
    echo "models/xray_pneumonia_model.h5 파일을 업로드하세요."
else
    echo "✅ ML 모델 확인 완료"
fi

# ============================================
# 7. Pickle 파일 확인
# ============================================

echo "7. Pickle 파일 확인 중..."

cd ../django_main

# Fixtures 디렉토리 생성
mkdir -p fixtures

if [ -f "fixtures/sample_patients.pkl" ]; then
    echo "✅ Pickle 파일 확인 완료"
else
    echo "⚠️  경고: Pickle 파일이 없습니다."
    echo "fixtures/*.pkl 파일을 업로드하세요 (선택사항)."
fi

# ============================================
# 8. 디렉토리 권한 설정
# ============================================

echo "8. 권한 설정 중..."

cd /var/www/neuronova

# 소유자 변경
sudo chown -R ubuntu:ubuntu /var/www/neuronova

# Static/Media 디렉토리 권한
sudo chmod -R 755 backend/django_main/staticfiles
sudo mkdir -p backend/django_main/media
sudo chmod -R 755 backend/django_main/media

# 로그 디렉토리 생성
sudo mkdir -p /var/log/neuronova
sudo chown -R ubuntu:ubuntu /var/log/neuronova

echo "✅ 권한 설정 완료"

# ============================================
# 9. Gunicorn 설정
# ============================================

echo "9. Gunicorn 설정 중..."

# Gunicorn 소켓 파일
sudo cat > /etc/systemd/system/gunicorn_django.socket << 'EOF'
[Unit]
Description=gunicorn socket

[Socket]
ListenStream=/run/gunicorn_django.sock

[Install]
WantedBy=sockets.target
EOF

# Gunicorn 서비스 파일
sudo cat > /etc/systemd/system/gunicorn_django.service << 'EOF'
[Unit]
Description=gunicorn daemon for Django
Requires=gunicorn_django.socket
After=network.target

[Service]
User=ubuntu
Group=ubuntu
WorkingDirectory=/var/www/neuronova/backend/django_main
ExecStart=/var/www/neuronova/backend/django_main/venv/bin/gunicorn \
          --access-logfile /var/log/neuronova/gunicorn_access.log \
          --error-logfile /var/log/neuronova/gunicorn_error.log \
          --workers 5 \
          --bind unix:/run/gunicorn_django.sock \
          neuronova.wsgi:application

[Install]
WantedBy=multi-user.target
EOF

# 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable gunicorn_django.socket
sudo systemctl enable gunicorn_django.service

echo "✅ Gunicorn 설정 완료"

# ============================================
# 10. Nginx 설정
# ============================================

echo "10. Nginx 설정 중..."

# Nginx 설정 파일 복사
sudo cp deploy/nginx/neuronova.conf /etc/nginx/sites-available/neuronova

# 심볼릭 링크 생성
sudo ln -sf /etc/nginx/sites-available/neuronova /etc/nginx/sites-enabled/

# 기본 사이트 비활성화
sudo rm -f /etc/nginx/sites-enabled/default

# Nginx 설정 테스트
sudo nginx -t

echo "✅ Nginx 설정 완료"

# ============================================
# 11. 서비스 시작
# ============================================

echo "11. 서비스 시작 중..."

# Gunicorn 시작
sudo systemctl start gunicorn_django
sudo systemctl status gunicorn_django --no-pager

# Nginx 재시작
sudo systemctl restart nginx
sudo systemctl status nginx --no-pager

echo "✅ 서비스 시작 완료"

# ============================================
# 12. 배포 확인
# ============================================

echo "12. 배포 확인 중..."

# Health check
sleep 3
response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/api/health/)

if [ "$response" = "200" ]; then
    echo "✅ Health check 성공 (200 OK)"
else
    echo "⚠️  경고: Health check 실패 (HTTP $response)"
fi

# ============================================
# 완료
# ============================================

echo ""
echo "====================================="
echo "✅ NeuroNova 배포 완료!"
echo "====================================="
echo ""
echo "다음 단계:"
echo "1. 브라우저에서 http://서버IP 접속"
echo "2. 관리자 계정 생성: cd backend/django_main && source venv/bin/activate && python manage.py createsuperuser"
echo "3. 로그 확인: tail -f /var/log/neuronova/gunicorn_error.log"
echo ""
