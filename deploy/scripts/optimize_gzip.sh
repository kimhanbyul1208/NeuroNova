#!/bin/bash

# ============================================
# Nginx gzip 압축 최적화 스크립트
# /etc/nginx/nginx.conf에 gzip 설정 추가
# ============================================

echo "============================================"
echo "Nginx gzip 압축 최적화"
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

echo "1️⃣  gzip 설정 파일 생성 중..."

# gzip 설정 파일 생성
cat > /etc/nginx/conf.d/gzip.conf << 'EOF'
# gzip 압축 설정
gzip on;
gzip_vary on;
gzip_proxied any;
gzip_comp_level 6;
gzip_types
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
    application/rss+xml
    application/atom_xml
    application/vnd.api+json
    application/manifest+json;
gzip_min_length 256;
gzip_disable "msie6";
EOF

if [ $? -eq 0 ]; then
    echo "✅ gzip 설정 파일 생성 완료: /etc/nginx/conf.d/gzip.conf"
else
    echo "❌ gzip 설정 파일 생성 실패"
    exit 1
fi

echo ""
echo "2️⃣  Nginx 설정 테스트..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 설정 검증 성공"
else
    echo "❌ Nginx 설정 오류"
    echo "설정 파일을 확인하세요."
    exit 1
fi

echo ""
echo "3️⃣  Nginx 재시작..."
systemctl restart nginx

if [ $? -eq 0 ]; then
    echo "✅ Nginx 재시작 완료"
else
    echo "❌ Nginx 재시작 실패"
    exit 1
fi

echo ""
echo "============================================"
echo "✅ gzip 최적화 완료!"
echo "============================================"
echo ""
echo "📊 gzip 설정 내용:"
echo "  - 압축 레벨: 6 (균형잡힌 압축률/성능)"
echo "  - 최소 파일 크기: 256 bytes"
echo "  - 압축 대상: HTML, CSS, JS, JSON, XML, 폰트, SVG"
echo ""
echo "📌 gzip 압축 확인 방법:"
echo "curl -H 'Accept-Encoding: gzip' -I https://your-domain.com | grep -i 'content-encoding'"
echo ""
echo "💡 압축 효과:"
echo "  - JavaScript: 약 70-80% 크기 감소"
echo "  - CSS: 약 60-70% 크기 감소"
echo "  - JSON: 약 80-90% 크기 감소"
echo ""
