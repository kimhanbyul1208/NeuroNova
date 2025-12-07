#!/bin/bash

# ============================================
# HTTPS (SSL/TLS) 설정 스크립트
# Let's Encrypt Certbot 사용
# ============================================

echo "============================================"
echo "NeuroNova HTTPS 설정"
echo "============================================"
echo ""

# Root 권한 확인
if [ "$EUID" -ne 0 ]; then
    echo "❌ 이 스크립트는 root 권한이 필요합니다."
    echo "다음 명령어로 실행하세요: sudo $0 <도메인>"
    exit 1
fi

# 도메인 확인
if [ -z "$1" ]; then
    echo "❌ 도메인을 입력하세요."
    echo "사용법: sudo $0 yourdomain.com"
    echo "예시: sudo $0 neuronova.example.com"
    exit 1
fi

DOMAIN=$1
echo "도메인: $DOMAIN"
echo ""

# 1. Certbot 설치 확인
echo "1️⃣  Certbot 설치 확인 중..."
if ! command -v certbot &> /dev/null; then
    echo "Certbot이 설치되어 있지 않습니다. 설치 중..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
    echo "✅ Certbot 설치 완료"
else
    echo "✅ Certbot이 이미 설치되어 있습니다."
fi

# 2. 도메인 DNS 확인
echo ""
echo "2️⃣  도메인 DNS 확인 중..."
echo "⚠️  중요: 도메인이 이 서버의 IP를 가리키고 있어야 합니다."
echo ""
echo "현재 서버 IP:"
curl -s ifconfig.me
echo ""
echo ""
echo "도메인 DNS 레코드:"
dig +short $DOMAIN
echo ""

read -p "도메인 DNS가 올바르게 설정되었습니까? (yes/no): " DNS_CONFIRM

if [ "$DNS_CONFIRM" != "yes" ]; then
    echo "❌ DNS 설정을 먼저 완료하세요."
    echo ""
    echo "DNS 설정 방법:"
    echo "1. 도메인 관리 페이지 접속"
    echo "2. A 레코드 추가:"
    echo "   Type: A"
    echo "   Name: @ (또는 서브도메인)"
    echo "   Value: $(curl -s ifconfig.me)"
    echo "   TTL: 3600"
    echo "3. DNS 전파 대기 (최대 48시간, 보통 10분)"
    exit 1
fi

# 3. Nginx 설정 확인
echo ""
echo "3️⃣  Nginx 설정 확인 중..."
if ! systemctl is-active --quiet nginx; then
    echo "❌ Nginx가 실행되고 있지 않습니다."
    echo "Nginx를 먼저 설치하고 시작하세요."
    exit 1
fi
echo "✅ Nginx 실행 중"

# 4. 포트 80 확인
echo ""
echo "4️⃣  포트 80 확인 중..."
if ! nc -z localhost 80; then
    echo "❌ 포트 80이 열려있지 않습니다."
    echo "Nginx 설정을 확인하세요."
    exit 1
fi
echo "✅ 포트 80 열림"

# 5. 방화벽 확인
echo ""
echo "5️⃣  방화벽 설정 확인 중..."
if command -v ufw &> /dev/null; then
    echo "UFW 방화벽 설정 중..."
    ufw allow 'Nginx Full'
    ufw delete allow 'Nginx HTTP'
    echo "✅ 방화벽 설정 완료"
else
    echo "⚠️  UFW가 설치되어 있지 않습니다. 방화벽을 수동으로 설정하세요."
fi

# 6. SSL 인증서 발급
echo ""
echo "6️⃣  SSL 인증서 발급 중..."
echo "⚠️  Let's Encrypt에서 이메일을 통해 만료 알림을 보냅니다."
echo ""

certbot --nginx -d $DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL 인증서 발급 완료"
else
    echo "❌ SSL 인증서 발급 실패"
    echo ""
    echo "트러블슈팅:"
    echo "1. DNS가 올바르게 설정되었는지 확인"
    echo "2. 포트 80, 443이 외부에서 접근 가능한지 확인"
    echo "3. Nginx 설정 파일의 server_name 확인"
    exit 1
fi

# 7. 자동 갱신 테스트
echo ""
echo "7️⃣  자동 갱신 테스트 중..."
certbot renew --dry-run

if [ $? -eq 0 ]; then
    echo "✅ 자동 갱신 테스트 성공"
else
    echo "⚠️  자동 갱신 테스트 실패. 수동으로 확인이 필요합니다."
fi

# 8. Nginx 설정 검증
echo ""
echo "8️⃣  Nginx 설정 검증 중..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 설정 유효함"
else
    echo "❌ Nginx 설정 오류"
    exit 1
fi

# 9. Nginx 재시작
echo ""
echo "9️⃣  Nginx 재시작 중..."
systemctl reload nginx
echo "✅ Nginx 재시작 완료"

# 10. HTTPS 테스트
echo ""
echo "🔟 HTTPS 연결 테스트 중..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://$DOMAIN)

if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "301" ] || [ "$HTTP_CODE" == "302" ]; then
    echo "✅ HTTPS 연결 성공 (HTTP $HTTP_CODE)"
else
    echo "⚠️  HTTPS 연결 확인 필요 (HTTP $HTTP_CODE)"
fi

# 완료 메시지
echo ""
echo "============================================"
echo "✅ HTTPS 설정 완료!"
echo "============================================"
echo ""
echo "🔒 SSL 인증서 정보:"
certbot certificates
echo ""
echo "📅 인증서 만료일: $(certbot certificates | grep 'Expiry Date' | head -1)"
echo ""
echo "🔄 자동 갱신:"
echo "  Certbot은 인증서를 자동으로 갱신합니다."
echo "  확인: sudo certbot renew --dry-run"
echo ""
echo "🌐 웹사이트 접속:"
echo "  https://$DOMAIN"
echo ""
echo "🔧 설정 파일 위치:"
echo "  Nginx: /etc/nginx/sites-available/neuronova"
echo "  SSL 인증서: /etc/letsencrypt/live/$DOMAIN/"
echo ""
echo "📊 SSL 등급 테스트:"
echo "  https://www.ssllabs.com/ssltest/analyze.html?d=$DOMAIN"
echo ""
