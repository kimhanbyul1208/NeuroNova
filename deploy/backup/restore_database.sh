#!/bin/bash

# ============================================
# NeuroNova 데이터베이스 복원 스크립트
# ============================================

# 환경 변수 로드
if [ -f ~/NeuroNova/backend/django_main/.env ]; then
    export $(cat ~/NeuroNova/backend/django_main/.env | grep -v '^#' | xargs)
fi

# 설정
BACKUP_DIR="/var/backups/neuronova/database"
LOG_FILE="/var/log/neuronova/restore.log"

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

log_info "========================================="
log_info "데이터베이스 복원 시작"
log_info "========================================="

# 데이터베이스 설정
DB_NAME=${DB_NAME:-"neuronova"}
DB_USER=${DB_USER:-"root"}
DB_PASSWORD=${DB_PASSWORD:-""}
DB_HOST=${DB_HOST:-"localhost"}

# 사용 가능한 백업 파일 목록 표시
log_info "사용 가능한 백업 파일:"
echo ""
ls -lht "${BACKUP_DIR}"/neuronova_db_*.sql.gz | head -10
echo ""

# 백업 파일 선택
if [ -z "$1" ]; then
    echo "사용법: $0 <백업파일명>"
    echo "예시: $0 neuronova_db_20251206_143000.sql.gz"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# 백업 파일 존재 확인
if [ ! -f "$BACKUP_PATH" ]; then
    log_error "백업 파일을 찾을 수 없습니다: $BACKUP_PATH"
    exit 1
fi

log_info "복원할 백업 파일: $BACKUP_FILE"

# 확인 메시지
echo ""
echo "⚠️  경고: 이 작업은 현재 데이터베이스를 백업 시점으로 되돌립니다."
echo "데이터베이스: $DB_NAME"
echo "백업 파일: $BACKUP_FILE"
echo ""
read -p "계속하시겠습니까? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    log_info "복원 작업이 취소되었습니다."
    exit 0
fi

# 현재 데이터베이스 백업 (안전장치)
SAFETY_BACKUP="neuronova_db_before_restore_$(date +%Y%m%d_%H%M%S).sql.gz"
log_info "현재 데이터베이스 백업 중 (안전장치)..."

if [ -n "$DB_PASSWORD" ]; then
    mysqldump -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_NAME" | gzip > "${BACKUP_DIR}/${SAFETY_BACKUP}"
else
    mysqldump -u "$DB_USER" -h "$DB_HOST" "$DB_NAME" | gzip > "${BACKUP_DIR}/${SAFETY_BACKUP}"
fi

if [ $? -eq 0 ]; then
    log_success "현재 DB 백업 완료: ${SAFETY_BACKUP}"
else
    log_error "현재 DB 백업 실패. 복원 작업을 중단합니다."
    exit 1
fi

# 압축 해제
TEMP_SQL="/tmp/restore_$(date +%Y%m%d_%H%M%S).sql"
log_info "백업 파일 압축 해제 중..."
gunzip -c "$BACKUP_PATH" > "$TEMP_SQL"

if [ $? -eq 0 ]; then
    log_success "압축 해제 완료"
else
    log_error "압축 해제 실패"
    exit 1
fi

# 데이터베이스 복원
log_info "데이터베이스 복원 중..."

if [ -n "$DB_PASSWORD" ]; then
    mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" "$DB_NAME" < "$TEMP_SQL" 2>> "$LOG_FILE"
else
    mysql -u "$DB_USER" -h "$DB_HOST" "$DB_NAME" < "$TEMP_SQL" 2>> "$LOG_FILE"
fi

if [ $? -eq 0 ]; then
    log_success "데이터베이스 복원 완료!"
else
    log_error "데이터베이스 복원 실패"
    log_error "안전 백업으로 롤백하세요: ${SAFETY_BACKUP}"
    rm -f "$TEMP_SQL"
    exit 1
fi

# 임시 파일 삭제
rm -f "$TEMP_SQL"
log_info "임시 파일 삭제 완료"

log_info "========================================="
log_success "데이터베이스 복원 완료!"
log_info "안전 백업 위치: ${BACKUP_DIR}/${SAFETY_BACKUP}"
log_info "========================================="

exit 0
