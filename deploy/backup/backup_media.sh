#!/bin/bash

# ============================================
# NeuroNova 미디어 파일 백업 스크립트
# 업로드된 파일 및 DICOM 이미지 백업
# ============================================

# 설정
SOURCE_DIR=~/NeuroNova/backend/django_main/media
BACKUP_DIR="/var/backups/neuronova/media"
RETENTION_DAYS=90  # 백업 보관 기간 (일)
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="neuronova_media_${DATE}.tar.gz"
LOG_FILE="/var/log/neuronova/backup.log"

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
log_info "미디어 파일 백업 시작"
log_info "========================================="

# 소스 디렉토리 확인
if [ ! -d "$SOURCE_DIR" ]; then
    log_error "소스 디렉토리가 존재하지 않습니다: $SOURCE_DIR"
    exit 1
fi

# 소스 디렉토리 크기 확인
SOURCE_SIZE=$(du -sh "$SOURCE_DIR" | cut -f1)
log_info "백업 대상 크기: ${SOURCE_SIZE}"

# 미디어 파일 수 확인
FILE_COUNT=$(find "$SOURCE_DIR" -type f | wc -l)
log_info "백업 대상 파일 수: ${FILE_COUNT}개"

# tar.gz로 압축 백업
log_info "미디어 파일 압축 중..."
tar -czf "${BACKUP_DIR}/${BACKUP_FILE}" -C "$(dirname $SOURCE_DIR)" "$(basename $SOURCE_DIR)" 2>> "$LOG_FILE"

if [ $? -eq 0 ]; then
    log_success "압축 완료: ${BACKUP_FILE}"
else
    log_error "압축 실패"
    exit 1
fi

# 백업 파일 크기 확인
BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_FILE}" | cut -f1)
log_info "백업 파일 크기: ${BACKUP_SIZE}"

# 압축률 계산
SOURCE_SIZE_BYTES=$(du -sb "$SOURCE_DIR" | cut -f1)
BACKUP_SIZE_BYTES=$(stat -c%s "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null || stat -f%z "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null)
COMPRESSION_RATIO=$(awk "BEGIN {printf \"%.1f\", (1 - $BACKUP_SIZE_BYTES / $SOURCE_SIZE_BYTES) * 100}")
log_info "압축률: ${COMPRESSION_RATIO}%"

# 오래된 백업 삭제 (보관 기간 초과)
log_info "오래된 백업 파일 정리 중 (${RETENTION_DAYS}일 이상)..."
find "$BACKUP_DIR" -name "neuronova_media_*.tar.gz" -mtime +${RETENTION_DAYS} -delete

# 백업 파일 목록
BACKUP_COUNT=$(ls -1 "${BACKUP_DIR}"/neuronova_media_*.tar.gz 2>/dev/null | wc -l)
log_info "현재 백업 파일 수: ${BACKUP_COUNT}개"

log_info "========================================="
log_success "미디어 파일 백업 완료!"
log_info "백업 위치: ${BACKUP_DIR}/${BACKUP_FILE}"
log_info "========================================="

exit 0
