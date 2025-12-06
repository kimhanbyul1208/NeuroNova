#!/bin/bash

# ============================================
# Nginx Brotli 압축 모듈 설치 스크립트
# Ubuntu/Debian 환경용
# ============================================

echo "============================================"
echo "Nginx Brotli 압축 모듈 설치"
echo "============================================"
echo ""

# root 권한 확인
if [ "$EUID" -ne 0 ]; then
    echo "❌ 이 스크립트는 root 권한이 필요합니다."
    echo "다음 명령어로 실행하세요: sudo $0"
    exit 1
fi

# Nginx 설치 확인
if ! command -v nginx &> /dev/null; then
    echo "❌ Nginx가 설치되어 있지 않습니다."
    echo "먼저 Nginx를 설치하세요: sudo apt-get install nginx"
    exit 1
fi

echo "1️⃣  Brotli 모듈 설치 중..."
apt-get update
apt-get install -y libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static

if [ $? -eq 0 ]; then
    echo "✅ Brotli 모듈 설치 완료"
else
    echo "❌ Brotli 모듈 설치 실패"
    exit 1
fi

echo ""
echo "2️⃣  Nginx 설정에 Brotli 추가..."

# Brotli 설정 파일 생성
cat > /etc/nginx/conf.d/brotli.conf << 'EOF'
# Brotli 압축 설정
brotli on;
brotli_comp_level 6;
brotli_static on;
brotli_types
    text/plain
    text/css
    text/xml
    text/javascript
    application/json
    application/javascript
    application/x-javascript
    application/xml
    application/xml+rss
    application/xhtml+xml
    application/x-font-ttf
    application/x-font-opentype
    application/vnd.ms-fontobject
    image/svg+xml
    image/x-icon
    application/vnd.api+json
    application/manifest+json;
brotli_min_length 256;
EOF

if [ $? -eq 0 ]; then
    echo "✅ Brotli 설정 파일 생성 완료: /etc/nginx/conf.d/brotli.conf"
else
    echo "❌ Brotli 설정 파일 생성 실패"
    exit 1
fi

echo ""
echo "3️⃣  Nginx 설정 테스트..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 설정 검증 성공"
else
    echo "❌ Nginx 설정 오류"
    echo "설정 파일을 확인하세요."
    exit 1
fi

echo ""
echo "4️⃣  Nginx 재시작..."
systemctl restart nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx 재시작 완료"
else
    echo "❌ Nginx 재시작 실패"
    exit 1
fi

echo ""
echo "============================================"
echo "✅ Brotli 설치 및 설정 완료!"
echo "============================================"
echo ""
echo "📌 Brotli 압축 확인 방법:"
echo "curl -H 'Accept-Encoding: br' -I https://your-domain.com | grep -i 'content-encoding'"
echo ""
echo "💡 gzip과 brotli가 모두 활성화되어 있으면,"
echo "   브라우저가 지원하는 가장 효율적인 압축 방식을 자동 선택합니다."
echo ""
