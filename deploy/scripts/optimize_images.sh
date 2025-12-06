#!/bin/bash

# ============================================
# 이미지 최적화 스크립트
# React 빌드 결과물의 이미지를 WebP로 변환
# ============================================

echo "NeuroNova 이미지 최적화 시작..."

# 필요한 도구 확인
if ! command -v cwebp &> /dev/null; then
    echo "⚠️  cwebp가 설치되어 있지 않습니다. WebP 변환을 건너뜁니다."
    echo "설치 방법: sudo apt-get install webp"
    exit 1
fi

# React 빌드 디렉토리
BUILD_DIR="../frontend/react_web/dist"

if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ React 빌드 디렉토리를 찾을 수 없습니다: $BUILD_DIR"
    echo "먼저 'npm run build'를 실행하세요."
    exit 1
fi

# 이미지 최적화 카운터
count=0
total_original_size=0
total_optimized_size=0

# PNG 파일 최적화 및 WebP 변환
echo "🔄 PNG 파일 처리 중..."
find "$BUILD_DIR" -type f -name "*.png" | while read file; do
    # 원본 크기
    original_size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)

    # WebP 변환 (품질 85%)
    webp_file="${file%.png}.webp"
    cwebp -q 85 "$file" -o "$webp_file" > /dev/null 2>&1

    if [ -f "$webp_file" ]; then
        webp_size=$(stat -c%s "$webp_file" 2>/dev/null || stat -f%z "$webp_file" 2>/dev/null)
        echo "  ✅ $(basename $file) → $(basename $webp_file)"
        echo "     원본: $(numfmt --to=iec-i --suffix=B $original_size) → 변환: $(numfmt --to=iec-i --suffix=B $webp_size)"
        count=$((count + 1))
        total_original_size=$((total_original_size + original_size))
        total_optimized_size=$((total_optimized_size + webp_size))
    fi
done

# JPG 파일 최적화 및 WebP 변환
echo ""
echo "🔄 JPG 파일 처리 중..."
find "$BUILD_DIR" -type f \( -name "*.jpg" -o -name "*.jpeg" \) | while read file; do
    # 원본 크기
    original_size=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null)

    # WebP 변환 (품질 85%)
    webp_file="${file%.*}.webp"
    cwebp -q 85 "$file" -o "$webp_file" > /dev/null 2>&1

    if [ -f "$webp_file" ]; then
        webp_size=$(stat -c%s "$webp_file" 2>/dev/null || stat -f%z "$webp_file" 2>/dev/null)
        echo "  ✅ $(basename $file) → $(basename $webp_file)"
        echo "     원본: $(numfmt --to=iec-i --suffix=B $original_size) → 변환: $(numfmt --to=iec-i --suffix=B $webp_size)"
        count=$((count + 1))
        total_original_size=$((total_original_size + original_size))
        total_optimized_size=$((total_optimized_size + webp_size))
    fi
done

echo ""
echo "============================================"
echo "이미지 최적화 완료!"
echo "변환된 파일 수: $count"
if [ $count -gt 0 ]; then
    echo "원본 총 크기: $(numfmt --to=iec-i --suffix=B $total_original_size)"
    echo "변환 총 크기: $(numfmt --to=iec-i --suffix=B $total_optimized_size)"
    saved=$((total_original_size - total_optimized_size))
    percentage=$(awk "BEGIN {printf \"%.1f\", ($saved / $total_original_size) * 100}")
    echo "절약된 용량: $(numfmt --to=iec-i --suffix=B $saved) ($percentage%)"
fi
echo "============================================"
echo ""
echo "💡 Nginx 설정에서 WebP 우선 서빙이 활성화되어 있는지 확인하세요."
