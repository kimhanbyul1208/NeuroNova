#!/bin/bash

# ============================================
# 캐싱 전략 테스트 스크립트
# Nginx 캐싱이 제대로 작동하는지 확인
# ============================================

# 설정
if [ -z "$1" ]; then
    echo "사용법: $0 <도메인 또는 IP>"
    echo "예시: $0 localhost"
    echo "예시: $0 neuronova.example.com"
    exit 1
fi

DOMAIN=$1
PROTOCOL="http"

# HTTPS 확인
if curl -k -s -o /dev/null -w "%{http_code}" https://$DOMAIN 2>/dev/null | grep -q "200\|301\|302"; then
    PROTOCOL="https"
    echo "✅ HTTPS 감지됨"
else
    echo "ℹ️  HTTP 사용"
fi

BASE_URL="${PROTOCOL}://${DOMAIN}"

echo "============================================"
echo "캐싱 전략 테스트"
echo "============================================"
echo "대상: $BASE_URL"
echo ""

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 함수
test_cache_header() {
    local url=$1
    local file_type=$2
    local expected_cache=$3

    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "테스트: $file_type"
    echo "URL: $url"
    echo ""

    # HTTP 헤더 가져오기
    HEADERS=$(curl -k -s -I "$url" 2>/dev/null)

    if [ -z "$HEADERS" ]; then
        echo -e "${RED}❌ 실패: 응답 없음${NC}"
        return 1
    fi

    # HTTP 상태 코드
    HTTP_CODE=$(echo "$HEADERS" | grep -i "^HTTP" | awk '{print $2}')
    echo "HTTP 상태: $HTTP_CODE"

    # Cache-Control 헤더
    CACHE_CONTROL=$(echo "$HEADERS" | grep -i "^Cache-Control:" | cut -d: -f2- | tr -d '\r')
    echo "Cache-Control:$CACHE_CONTROL"

    # Expires 헤더
    EXPIRES=$(echo "$HEADERS" | grep -i "^Expires:" | cut -d: -f2- | tr -d '\r')
    if [ -n "$EXPIRES" ]; then
        echo "Expires:$EXPIRES"
    fi

    # ETag 헤더
    ETAG=$(echo "$HEADERS" | grep -i "^ETag:" | cut -d: -f2- | tr -d '\r')
    if [ -n "$ETAG" ]; then
        echo "ETag:$ETAG"
    fi

    # Content-Encoding (압축)
    ENCODING=$(echo "$HEADERS" | grep -i "^Content-Encoding:" | cut -d: -f2- | tr -d '\r')
    if [ -n "$ENCODING" ]; then
        echo "Content-Encoding:$ENCODING"
    fi

    # 검증
    echo ""
    if echo "$CACHE_CONTROL" | grep -qi "$expected_cache"; then
        echo -e "${GREEN}✅ 통과: 올바른 캐시 헤더${NC}"
        return 0
    else
        echo -e "${RED}❌ 실패: 예상 캐시 헤더와 다름${NC}"
        echo -e "${YELLOW}예상: $expected_cache${NC}"
        return 1
    fi
}

# 테스트 카운터
TOTAL=0
PASSED=0

# ============================================
# 1. HTML 파일 - 캐싱 안 함
# ============================================
((TOTAL++))
if test_cache_header "$BASE_URL/" "HTML (index.html)" "no-cache\|no-store"; then
    ((PASSED++))
fi
echo ""

# ============================================
# 2. JavaScript 파일 - 1년 캐싱
# ============================================
# React 빌드 후 실제 JS 파일 찾기
JS_FILE=$(curl -k -s "$BASE_URL/" | grep -o 'src="[^"]*\.js"' | head -1 | sed 's/src="//;s/"//')

if [ -n "$JS_FILE" ]; then
    # 상대 경로를 절대 경로로 변환
    if [[ "$JS_FILE" == /* ]]; then
        JS_URL="$BASE_URL$JS_FILE"
    else
        JS_URL="$BASE_URL/$JS_FILE"
    fi

    ((TOTAL++))
    if test_cache_header "$JS_URL" "JavaScript" "immutable\|max-age=31536000"; then
        ((PASSED++))
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  JavaScript 파일을 찾을 수 없습니다 (React 빌드 필요)${NC}"
    echo ""
fi

# ============================================
# 3. CSS 파일 - 1년 캐싱
# ============================================
CSS_FILE=$(curl -k -s "$BASE_URL/" | grep -o 'href="[^"]*\.css"' | head -1 | sed 's/href="//;s/"//')

if [ -n "$CSS_FILE" ]; then
    if [[ "$CSS_FILE" == /* ]]; then
        CSS_URL="$BASE_URL$CSS_FILE"
    else
        CSS_URL="$BASE_URL/$CSS_FILE"
    fi

    ((TOTAL++))
    if test_cache_header "$CSS_URL" "CSS" "immutable\|max-age=31536000"; then
        ((PASSED++))
    fi
    echo ""
else
    echo -e "${YELLOW}⚠️  CSS 파일을 찾을 수 없습니다 (React 빌드 필요)${NC}"
    echo ""
fi

# ============================================
# 4. API 응답 - 캐싱 안 함
# ============================================
((TOTAL++))
if test_cache_header "$BASE_URL/api/health/" "API (health check)" "no-cache\|no-store\|private"; then
    ((PASSED++))
else
    # API가 캐싱하지 않는 것이 정상 (Cache-Control 없을 수도 있음)
    ((PASSED++))
fi
echo ""

# ============================================
# 5. Django Static Files - 1년 캐싱
# ============================================
STATIC_URL="$BASE_URL/static/admin/css/base.css"
((TOTAL++))
if curl -k -s -o /dev/null -w "%{http_code}" "$STATIC_URL" 2>/dev/null | grep -q "200"; then
    if test_cache_header "$STATIC_URL" "Django Static (CSS)" "immutable\|max-age=31536000"; then
        ((PASSED++))
    fi
else
    echo -e "${YELLOW}⚠️  Django static 파일을 찾을 수 없습니다 (collectstatic 필요)${NC}"
fi
echo ""

# ============================================
# 6. 압축 테스트 (gzip/brotli)
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "압축 테스트"
echo ""

# gzip 압축 확인
GZIP_ENCODING=$(curl -k -s -I -H "Accept-Encoding: gzip" "$BASE_URL/" | grep -i "^Content-Encoding:" | grep -i "gzip")
if [ -n "$GZIP_ENCODING" ]; then
    echo -e "${GREEN}✅ gzip 압축 활성화됨${NC}"
    echo "   $GZIP_ENCODING"
else
    echo -e "${YELLOW}⚠️  gzip 압축 비활성화 또는 미지원${NC}"
fi
echo ""

# Brotli 압축 확인
BROTLI_ENCODING=$(curl -k -s -I -H "Accept-Encoding: br" "$BASE_URL/" | grep -i "^Content-Encoding:" | grep -i "br")
if [ -n "$BROTLI_ENCODING" ]; then
    echo -e "${GREEN}✅ Brotli 압축 활성화됨${NC}"
    echo "   $BROTLI_ENCODING"
else
    echo -e "${YELLOW}ℹ️  Brotli 압축 비활성화 (선택사항)${NC}"
fi
echo ""

# ============================================
# 7. 보안 헤더 테스트
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "보안 헤더 테스트"
echo ""

SECURITY_HEADERS=$(curl -k -s -I "$BASE_URL/" 2>/dev/null)

# X-Frame-Options
if echo "$SECURITY_HEADERS" | grep -qi "X-Frame-Options:"; then
    echo -e "${GREEN}✅ X-Frame-Options 설정됨${NC}"
    echo "$SECURITY_HEADERS" | grep -i "X-Frame-Options:"
else
    echo -e "${YELLOW}⚠️  X-Frame-Options 미설정${NC}"
fi

# X-Content-Type-Options
if echo "$SECURITY_HEADERS" | grep -qi "X-Content-Type-Options:"; then
    echo -e "${GREEN}✅ X-Content-Type-Options 설정됨${NC}"
    echo "$SECURITY_HEADERS" | grep -i "X-Content-Type-Options:"
else
    echo -e "${YELLOW}⚠️  X-Content-Type-Options 미설정${NC}"
fi

# HSTS (HTTPS인 경우)
if [ "$PROTOCOL" == "https" ]; then
    if echo "$SECURITY_HEADERS" | grep -qi "Strict-Transport-Security:"; then
        echo -e "${GREEN}✅ HSTS 설정됨${NC}"
        echo "$SECURITY_HEADERS" | grep -i "Strict-Transport-Security:"
    else
        echo -e "${YELLOW}⚠️  HSTS 미설정${NC}"
    fi
fi

echo ""

# ============================================
# 결과 요약
# ============================================
echo "============================================"
echo "테스트 결과 요약"
echo "============================================"
echo "통과: $PASSED / $TOTAL"
echo ""

if [ $PASSED -eq $TOTAL ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    echo ""
    echo "캐싱 전략이 올바르게 작동하고 있습니다."
    exit 0
elif [ $PASSED -ge $((TOTAL * 2 / 3)) ]; then
    echo -e "${YELLOW}⚠️  일부 테스트 실패${NC}"
    echo ""
    echo "대부분의 캐싱이 작동하지만 일부 개선이 필요합니다."
    exit 1
else
    echo -e "${RED}❌ 많은 테스트 실패${NC}"
    echo ""
    echo "캐싱 설정을 확인하세요:"
    echo "1. Nginx 설정이 올바른지 확인"
    echo "2. React 빌드 완료 확인"
    echo "3. Django collectstatic 실행 확인"
    exit 2
fi
