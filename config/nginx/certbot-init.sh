#!/bin/bash
# Let's Encrypt SSL 인증서 발급 스크립트

# 변수 설정
DOMAIN="neuronova.example.com"  # 실제 도메인으로 변경
EMAIL="admin@example.com"        # 실제 이메일로 변경

echo "========================================"
echo "Let's Encrypt SSL 인증서 발급"
echo "도메인: $DOMAIN"
echo "이메일: $EMAIL"
echo "========================================"

# Certbot 설치 확인
if ! command -v certbot &> /dev/null; then
    echo "Certbot이 설치되지 않았습니다. 설치 중..."

    # Ubuntu/Debian
    if command -v apt-get &> /dev/null; then
        sudo apt-get update
        sudo apt-get install -y certbot python3-certbot-nginx

    # CentOS/RHEL
    elif command -v yum &> /dev/null; then
        sudo yum install -y certbot python3-certbot-nginx

    # macOS
    elif command -v brew &> /dev/null; then
        brew install certbot

    else
        echo "패키지 매니저를 찾을 수 없습니다. 수동으로 Certbot을 설치해주세요."
        exit 1
    fi
fi

# Certbot 버전 확인
certbot --version

# SSL 인증서 발급 (Standalone 모드)
echo ""
echo "SSL 인증서 발급 시작..."
echo "주의: 도메인 DNS가 이 서버를 가리키고 있어야 합니다."
echo ""

sudo certbot certonly --standalone \
    --preferred-challenges http \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

# 결과 확인
if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "SSL 인증서 발급 완료!"
    echo "========================================"
    echo "인증서 경로:"
    echo "  - 전체 체인: /etc/letsencrypt/live/$DOMAIN/fullchain.pem"
    echo "  - 개인 키: /etc/letsencrypt/live/$DOMAIN/privkey.pem"
    echo ""
    echo "Nginx 설정에서 다음 경로를 사용하세요:"
    echo "  ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;"
    echo "  ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;"
    echo ""
    echo "자동 갱신 설정:"
    echo "  sudo certbot renew --dry-run"
    echo "========================================"
else
    echo ""
    echo "SSL 인증서 발급 실패!"
    echo "다음을 확인하세요:"
    echo "  1. 도메인 DNS가 올바르게 설정되었는지"
    echo "  2. 80번 포트가 열려있는지"
    echo "  3. 방화벽 설정이 올바른지"
    exit 1
fi

# Cron으로 자동 갱신 설정 (매일 새벽 2시)
echo ""
echo "자동 갱신 cron 설정..."
(crontab -l 2>/dev/null; echo "0 2 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

echo "완료! 매일 새벽 2시에 인증서 자동 갱신이 시도됩니다."
