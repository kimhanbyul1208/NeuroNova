#!/bin/bash

# ============================================
# 모니터링 시스템 설치 스크립트
# ============================================

echo "============================================"
echo "NeuroNova 모니터링 시스템 설치"
echo "============================================"
echo ""

# Root 권한 확인
if [ "$EUID" -ne 0 ]; then
    echo "❌ 이 스크립트는 root 권한이 필요합니다."
    echo "다음 명령어로 실행하세요: sudo $0"
    exit 1
fi

# 1. 로그 디렉토리 생성
echo "1️⃣  로그 디렉토리 생성 중..."
mkdir -p /var/log/neuronova
chmod 755 /var/log/neuronova
echo "✅ 로그 디렉토리 생성 완료: /var/log/neuronova"

# 2. 헬스 체크 스크립트 복사 및 권한 설정
echo ""
echo "2️⃣  헬스 체크 스크립트 설치 중..."
cp ~/NeuroNova/deploy/monitoring/health_check.sh /usr/local/bin/neuronova-health-check
chmod +x /usr/local/bin/neuronova-health-check
echo "✅ 헬스 체크 스크립트 설치 완료: /usr/local/bin/neuronova-health-check"

# 3. Cron 작업 등록 (5분마다 헬스 체크)
echo ""
echo "3️⃣  자동 헬스 체크 설정 중..."
CRON_JOB="*/5 * * * * /usr/local/bin/neuronova-health-check >> /var/log/neuronova/cron.log 2>&1"

# 기존 cron 작업 제거
crontab -l 2>/dev/null | grep -v "neuronova-health-check" | crontab - 2>/dev/null

# 새 cron 작업 추가
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo "✅ Cron 작업 등록 완료 (5분마다 실행)"

# 4. 로그 로테이션 설정
echo ""
echo "4️⃣  로그 로테이션 설정 중..."
cat > /etc/logrotate.d/neuronova << 'EOF'
/var/log/neuronova/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
    sharedscripts
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

echo "✅ 로그 로테이션 설정 완료 (30일 보관)"

# 5. 수동 실행 테스트
echo ""
echo "5️⃣  헬스 체크 테스트 실행 중..."
/usr/local/bin/neuronova-health-check

# 6. 완료 메시지
echo ""
echo "============================================"
echo "✅ 모니터링 시스템 설치 완료!"
echo "============================================"
echo ""
echo "📊 설정 내용:"
echo "  - 헬스 체크: 5분마다 자동 실행"
echo "  - 로그 위치: /var/log/neuronova/health_check.log"
echo "  - 로그 보관: 30일"
echo ""
echo "🔧 수동 실행 방법:"
echo "  sudo neuronova-health-check"
echo ""
echo "📝 로그 확인 방법:"
echo "  tail -f /var/log/neuronova/health_check.log"
echo ""
echo "⚙️  Cron 작업 확인:"
echo "  crontab -l"
echo ""
