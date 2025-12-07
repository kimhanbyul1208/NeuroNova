#!/bin/bash

# ============================================
# NeuroNova 헬스 체크 스크립트
# 주요 서비스 상태 점검 및 Slack/이메일 알림
# ============================================

# 설정
LOG_FILE="/var/log/neuronova/health_check.log"
ALERT_EMAIL="admin@neuronova.com"  # 알림 받을 이메일
SLACK_WEBHOOK=""  # Slack Webhook URL (선택사항)

# 로그 디렉토리 생성
sudo mkdir -p /var/log/neuronova
sudo chown $USER:$USER /var/log/neuronova

# 현재 시각
NOW=$(date "+%Y-%m-%d %H:%M:%S")

# 로그 함수
log_info() {
    echo "[$NOW] INFO: $1" | tee -a "$LOG_FILE"
}

log_error() {
    echo "[$NOW] ERROR: $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo "[$NOW] SUCCESS: $1" | tee -a "$LOG_FILE"
}

# 알림 전송 함수
send_alert() {
    local message="$1"

    # 이메일 알림 (mailutils 필요)
    if command -v mail &> /dev/null; then
        echo "$message" | mail -s "[NeuroNova] 서비스 알림" "$ALERT_EMAIL"
    fi

    # Slack 알림
    if [ -n "$SLACK_WEBHOOK" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK" &> /dev/null
    fi
}

# 헬스 체크 결과
HEALTH_STATUS="OK"
FAILED_SERVICES=""

log_info "========================================="
log_info "NeuroNova 헬스 체크 시작"
log_info "========================================="

# 1. Nginx 상태 확인
log_info "1. Nginx 상태 확인 중..."
if systemctl is-active --quiet nginx; then
    log_success "Nginx: 정상 실행 중"
else
    log_error "Nginx: 실행 중지됨"
    HEALTH_STATUS="CRITICAL"
    FAILED_SERVICES="$FAILED_SERVICES Nginx"
fi

# 2. Django (Gunicorn) 상태 확인
log_info "2. Django 상태 확인 중..."
if systemctl is-active --quiet gunicorn_django; then
    log_success "Django: 정상 실행 중"

    # Django API 응답 테스트
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8000/api/health/ 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
        log_success "Django API: 응답 정상 (HTTP $HTTP_CODE)"
    else
        log_error "Django API: 응답 실패 (HTTP $HTTP_CODE)"
        HEALTH_STATUS="WARNING"
    fi
else
    log_error "Django: 실행 중지됨"
    HEALTH_STATUS="CRITICAL"
    FAILED_SERVICES="$FAILED_SERVICES Django"
fi

# 3. Flask (ML 서버) 상태 확인
log_info "3. Flask ML 서버 상태 확인 중..."
if systemctl is-active --quiet gunicorn_flask; then
    log_success "Flask: 정상 실행 중"

    # Flask API 응답 테스트
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:9000/health 2>/dev/null || echo "000")
    if [ "$HTTP_CODE" == "200" ] || [ "$HTTP_CODE" == "404" ]; then
        log_success "Flask API: 응답 정상 (HTTP $HTTP_CODE)"
    else
        log_error "Flask API: 응답 실패 (HTTP $HTTP_CODE)"
        HEALTH_STATUS="WARNING"
    fi
else
    log_error "Flask: 실행 중지됨"
    HEALTH_STATUS="CRITICAL"
    FAILED_SERVICES="$FAILED_SERVICES Flask"
fi

# 4. 디스크 사용량 확인
log_info "4. 디스크 사용량 확인 중..."
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    log_success "디스크 사용량: ${DISK_USAGE}% (정상)"
elif [ "$DISK_USAGE" -lt 90 ]; then
    log_error "디스크 사용량: ${DISK_USAGE}% (경고)"
    HEALTH_STATUS="WARNING"
else
    log_error "디스크 사용량: ${DISK_USAGE}% (위험)"
    HEALTH_STATUS="CRITICAL"
    FAILED_SERVICES="$FAILED_SERVICES Disk"
fi

# 5. 메모리 사용량 확인
log_info "5. 메모리 사용량 확인 중..."
MEMORY_USAGE=$(free | awk 'NR==2 {printf "%.0f", $3/$2 * 100}')
if [ "$MEMORY_USAGE" -lt 80 ]; then
    log_success "메모리 사용량: ${MEMORY_USAGE}% (정상)"
elif [ "$MEMORY_USAGE" -lt 90 ]; then
    log_error "메모리 사용량: ${MEMORY_USAGE}% (경고)"
    HEALTH_STATUS="WARNING"
else
    log_error "메모리 사용량: ${MEMORY_USAGE}% (위험)"
    HEALTH_STATUS="CRITICAL"
    FAILED_SERVICES="$FAILED_SERVICES Memory"
fi

# 6. CPU 사용량 확인 (1분 평균)
log_info "6. CPU 로드 확인 중..."
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
CPU_CORES=$(nproc)
CPU_LOAD_INT=$(echo "$CPU_LOAD * 100 / $CPU_CORES" | bc 2>/dev/null || echo "0")

if [ "$CPU_LOAD_INT" -lt 70 ]; then
    log_success "CPU 로드: $CPU_LOAD ($CPU_LOAD_INT% of $CPU_CORES cores)"
elif [ "$CPU_LOAD_INT" -lt 90 ]; then
    log_error "CPU 로드: $CPU_LOAD ($CPU_LOAD_INT% of $CPU_CORES cores) - 경고"
    HEALTH_STATUS="WARNING"
else
    log_error "CPU 로드: $CPU_LOAD ($CPU_LOAD_INT% of $CPU_CORES cores) - 위험"
    HEALTH_STATUS="CRITICAL"
    FAILED_SERVICES="$FAILED_SERVICES CPU"
fi

# 7. 데이터베이스 연결 확인 (선택사항)
log_info "7. 데이터베이스 연결 확인 중..."
# MySQL이 로컬에 설치되어 있는 경우
if command -v mysql &> /dev/null; then
    if mysql -u root -e "SELECT 1" &> /dev/null; then
        log_success "MySQL: 연결 정상"
    else
        log_error "MySQL: 연결 실패"
        HEALTH_STATUS="WARNING"
    fi
else
    log_info "MySQL: 로컬에 설치되지 않음 (원격 DB 사용 중)"
fi

# 최종 결과
log_info "========================================="
log_info "헬스 체크 완료: $HEALTH_STATUS"
if [ -n "$FAILED_SERVICES" ]; then
    log_info "실패한 서비스:$FAILED_SERVICES"
fi
log_info "========================================="

# 알림 전송 (CRITICAL인 경우만)
if [ "$HEALTH_STATUS" == "CRITICAL" ]; then
    ALERT_MSG="[CRITICAL] NeuroNova 서비스 장애 발생!\n실패한 서비스:$FAILED_SERVICES\n시각: $NOW"
    send_alert "$ALERT_MSG"
fi

# 종료 코드 반환
if [ "$HEALTH_STATUS" == "OK" ]; then
    exit 0
elif [ "$HEALTH_STATUS" == "WARNING" ]; then
    exit 1
else
    exit 2
fi
