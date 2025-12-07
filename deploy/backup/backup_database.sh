#!/bin/bash

# ============================================
# NeuroNova 데이터베이스 백업 스크립트
# MySQL 데이터베이스 자동 백업 및 압축
# ============================================

# 환경 변수 로드
if [ -f ~/NeuroNova/backend/django_main/.env ]; then
    export $(cat ~/NeuroNova/backend/django_main/.env | grep -v '^#' | xargs)
fi

# 설정
BACKUP_DIR="/var/backups/neuronova/database"
RETENTION_DAYS=30  # 백업 보관 기간 (일)
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="neuronova_db_${DATE}.sql"
LOG_FILE="/var/log/neuronova/backup.log"

# 로그 디렉토리 생성
sudo mkdir -p /var/log/neuronova
sudo chown $USER:$USER /var/log/neuronova

# 로그 함수
log_info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] SUCCESS: $1" | tee -a "$LOG_FILE"
}

# 백업 디렉토리 생성
sudo mkdir -p "$BACKUP_DIR"
sudo chown $USER:$USER "$BACKUP_DIR"

log_info "========================================="
log_info "데이터베이스 백업 시작"
log_info "========================================="

# 데이터베이스 설정 확인
DB_NAME=${DB_NAME:-"neuronova"}
DB_USER=${DB_USER:-"root"}
DB_PASSWORD=${DB_PASSWORD:-""}
DB_HOST=${DB_HOST:-"localhost"}

if [ -z "$DB_NAME" ]; then
    log_error "DB_NAME 환경 변수가 설정되지 않았습니다."
    exit 1
fi

log_info "백업 대상: $DB_NAME@$DB_HOST"

# MySQL 백업 수행
log_info "MySQL 덤프 중..."

if [ -n "$DB_PASSWORD" ]; then
    mysqldump -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}" 2>> "$LOG_FILE"
else
    mysqldump -u "$DB_USER" -h "$DB_HOST" "$DB_NAME" > "${BACKUP_DIR}/${BACKUP_FILE}" 2>> "$LOG_FILE"
fi

if [ $? -eq 0 ]; then
    log_success "MySQL 덤프 완료: ${BACKUP_FILE}"
else
    log_error "MySQL 덤프 실패"
    exit 1
fi

# 백업 파일 압축
log_info "백업 파일 압축 중..."
gzip "${BACKUP_DIR}/${BACKUP_FILE}"

if [ $? -eq 0 ]; then
    log_success "압축 완료: ${BACKUP_FILE}.gz"
    BACKUP_FILE="${BACKUP_FILE}.gz"
else
    log_error "압축 실패"
    exit 1
fi

# 백업 파일 크기 확인
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log_info "백업 파일 크기: ${BACKUP_SIZE}"

# 오래된 백업 삭제 (보관 기간 초과)
log_info "오래된 백업 파일 정리 중 (${RETENTION_DAYS}일 이상)..."
find "$BACKUP_DIR" -name "neuronova_db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
DELETED_COUNT=$(find "$BACKUP_DIR" -name "neuronova_db_*.sql.gz" -mtime +${RETENTION_DAYS} | wc -l)

if [ "$DELETED_COUNT" -gt 0 ]; then
    log_info "${DELETED_COUNT}개의 오래된 백업 파일 삭제됨"
else
    log_info "삭제할 오래된 백업 파일 없음"
fi

# 백업 파일 목록
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/neuronova_db_*.sql.gz 2>/dev/null | wc -l)
log_info "현재 백업 파일 수: ${BACKUP_COUNT}개"

# 디스크 사용량 확인
DISK_USAGE=$(df -h "$BACKUP_DIR" | awk 'NR==2 {print $5}')
log_info "백업 디렉토리 디스크 사용량: ${DISK_USAGE}"

log_info "========================================="
log_success "데이터베이스 백업 완료!"
log_info "백업 위치: ${BACKUP_DIR}/${BACKUP_FILE}"
log_info "========================================="

exit 0
