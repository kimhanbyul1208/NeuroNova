#!/bin/bash

# ============================================
# 백업 시스템 설치 스크립트
# ============================================

echo "============================================"
echo "NeuroNova 백업 시스템 설치"
echo "============================================"
echo ""

# Root 권한 확인
if [ "$EUID" -ne 0 ]; then
    echo "❌ 이 스크립트는 root 권한이 필요합니다."
    echo "다음 명령어로 실행하세요: sudo $0"
    exit 1
fi

# 1. 백업 디렉토리 생성
echo "1️⃣  백업 디렉토리 생성 중..."
mkdir -p /var/backups/neuronova/database
mkdir -p /var/backups/neuronova/media
chmod 755 /var/backups/neuronova
echo "✅ 백업 디렉토리 생성 완료"

# 2. 백업 스크립트 복사 및 권한 설정
echo ""
echo "2️⃣  백업 스크립트 설치 중..."
cp ~/NeuroNova/deploy/backup/backup_database.sh /usr/local/bin/neuronova-backup-db
cp ~/NeuroNova/deploy/backup/backup_media.sh /usr/local/bin/neuronova-backup-media
cp ~/NeuroNova/deploy/backup/restore_database.sh /usr/local/bin/neuronova-restore-db

chmod +x /usr/local/bin/neuronova-backup-db
chmod +x /usr/local/bin/neuronova-backup-media
chmod +x /usr/local/bin/neuronova-restore-db

echo "✅ 백업 스크립트 설치 완료"

# 3. Cron 작업 등록
echo ""
echo "3️⃣  자동 백업 스케줄 설정 중..."

# 기존 cron 작업 제거
crontab -l 2>/dev/null | grep -v "neuronova-backup" | crontab - 2>/dev/null

# 새 cron 작업 추가
# 매일 새벽 2시: 데이터베이스 백업
# 매일 새벽 3시: 미디어 파일 백업
(crontab -l 2>/dev/null; echo "# NeuroNova 자동 백업") | crontab -
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/neuronova-backup-db >> /var/log/neuronova/backup.log 2>&1") | crontab -
(crontab -l 2>/dev/null; echo "0 3 * * * /usr/local/bin/neuronova-backup-media >> /var/log/neuronova/backup.log 2>&1") | crontab -

echo "✅ 자동 백업 스케줄 등록 완료"
echo "   - 데이터베이스: 매일 02:00"
echo "   - 미디어 파일: 매일 03:00"

# 4. 테스트 백업 실행
echo ""
echo "4️⃣  테스트 백업 실행 중..."
echo ""
echo "데이터베이스 백업 테스트:"
/usr/local/bin/neuronova-backup-db

echo ""
echo "미디어 파일 백업 테스트 (미디어 디렉토리가 있는 경우):"
if [ -d ~/NeuroNova/backend/django_main/media ]; then
    /usr/local/bin/neuronova-backup-media
else
    echo "⚠️  미디어 디렉토리가 아직 생성되지 않았습니다."
    echo "   Django 배포 후 미디어 백업이 자동으로 시작됩니다."
fi

# 5. 완료 메시지
echo ""
echo "============================================"
echo "✅ 백업 시스템 설치 완료!"
echo "============================================"
echo ""
echo "📦 백업 위치:"
echo "  - 데이터베이스: /var/backups/neuronova/database/"
echo "  - 미디어 파일: /var/backups/neuronova/media/"
echo ""
echo "⏰ 백업 스케줄:"
echo "  - 데이터베이스: 매일 02:00 (보관 기간: 30일)"
echo "  - 미디어 파일: 매일 03:00 (보관 기간: 90일)"
echo ""
echo "🔧 수동 백업 명령어:"
echo "  sudo neuronova-backup-db"
echo "  sudo neuronova-backup-media"
echo ""
echo "🔄 복원 명령어:"
echo "  sudo neuronova-restore-db <백업파일명>"
echo "  예: sudo neuronova-restore-db neuronova_db_20251206_020000.sql.gz"
echo ""
echo "📝 로그 확인:"
echo "  tail -f /var/log/neuronova/backup.log"
echo ""
echo "📋 백업 파일 목록:"
echo "  ls -lht /var/backups/neuronova/database/"
echo "  ls -lht /var/backups/neuronova/media/"
echo ""
