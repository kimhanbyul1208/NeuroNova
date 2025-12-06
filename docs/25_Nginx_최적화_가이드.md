# Nginx 최적화 완벽 가이드

## 목차
1. [개요](#개요)
2. [최적화 필요성](#최적화-필요성)
3. [gzip 압축 설정](#gzip-압축-설정)
4. [Brotli 압축 설정](#brotli-압축-설정)
5. [캐싱 전략](#캐싱-전략)
6. [이미지 최적화](#이미지-최적화)
7. [기술적 설명](#기술적-설명)
8. [성능 측정 및 검증](#성능-측정-및-검증)

---

## 개요

본 문서는 NeuroNova React 정적 파일을 Nginx로 서빙할 때 트래픽을 최대한 줄이고 성능을 최적화하는 방법을 설명합니다.

### 목표
- React 정적 파일(JS/CSS/폰트) 전송 시 트래픽 70-90% 절감
- gzip 및 Brotli 압축 적용
- 브라우저 캐싱으로 반복 방문 시 로딩 속도 대폭 개선
- 이미지 최적화 (WebP 변환)

### 환경
- **Frontend**: React (빌드 결과물: `dist/` 또는 `build/`)
- **Web Server**: Nginx
- **Backend**: Django (Gunicorn) + Flask (ML 서버)

---

## 최적화 필요성

### 최적화 전후 비교

#### 트래픽 절감 효과
```
┌─────────────────────────────────────────────────────┐
│ 최초 방문 (압축 없음)                                 │
│ HTML: 50KB + JS: 2MB + CSS: 500KB + 이미지: 2MB      │
│ 총 전송량: 약 5MB                                     │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 최초 방문 (gzip 압축)                                 │
│ HTML: 15KB + JS: 500KB + CSS: 150KB + 이미지: 2MB   │
│ 총 전송량: 약 1.5MB (70% 절감)                        │
└─────────────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────────────┐
│ 재방문 (브라우저 캐싱)                                │
│ HTML: 15KB (캐시 안 함) + 나머지는 캐시 사용          │
│ 총 전송량: 약 50KB (97% 절감)                         │
└─────────────────────────────────────────────────────┘
```

#### 로딩 속도 개선
- **최초 방문**: 5초 → 1.5초 (70% 개선)
- **재방문**: 1.5초 → 0.3초 (80% 개선)

### 비용 절감
월 1만 명 방문, 평균 5 페이지뷰 가정:
- 최적화 전: 5MB × 5 × 10,000 = **250GB/월**
- 최적화 후: 50KB × 5 × 10,000 = **2.5GB/월**
- **절감 효과**: 247.5GB/월 (약 99%)

AWS CloudFront 기준 (GB당 $0.085):
- 최적화 전: $21.25/월
- 최적화 후: $0.21/월
- **비용 절감**: $21/월 (약 99%)

---

## gzip 압축 설정

gzip은 가장 널리 지원되는 압축 방식으로, 모든 브라우저가 지원합니다.

### 압축 효과
- **JavaScript**: 70-80% 크기 감소
- **CSS**: 60-70% 크기 감소
- **JSON**: 80-90% 크기 감소
- **HTML**: 60-70% 크기 감소

### 자동 설정 (권장)

```bash
cd ~/NeuroNova/deploy/scripts
sudo bash optimize_gzip.sh
```

### 수동 설정

#### 1. gzip 설정 파일 생성
```bash
sudo nano /etc/nginx/conf.d/gzip.conf
```

#### 2. 다음 내용 추가
```nginx
# gzip 압축 활성화
gzip on;

# Vary 헤더 추가 (프록시 캐시 고려)
gzip_vary on;

# 프록시된 요청도 압축
gzip_proxied any;

# 압축 레벨 (1-9, 6이 균형잡힘)
gzip_comp_level 6;

# 압축 대상 MIME 타입
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

# 최소 압축 파일 크기 (256 bytes 이하는 압축 안 함)
gzip_min_length 256;

# IE6는 gzip 지원 안 함
gzip_disable "msie6";
```

#### 3. Nginx 재시작
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### gzip_comp_level 설명

| 레벨 | 압축률 | CPU 사용량 | 권장 상황 |
|------|--------|-----------|----------|
| 1 | 낮음 | 매우 낮음 | CPU가 병목인 경우 |
| 6 | 중간 | 중간 | **대부분의 경우 (권장)** |
| 9 | 최고 | 매우 높음 | 대역폭이 매우 비싼 경우 |

**권장: 레벨 6**
- 압축률과 CPU 사용량의 균형이 최적
- 레벨 9는 압축률이 5-10% 더 높지만 CPU는 2배 사용

---

## Brotli 압축 설정

Brotli는 Google이 개발한 차세대 압축 알고리즘으로, gzip보다 15-20% 더 압축됩니다.

### Brotli vs gzip

| 항목 | gzip | Brotli |
|------|------|--------|
| 압축률 | 기준 | 15-20% 더 압축 |
| 압축 속도 | 빠름 | 약간 느림 |
| 브라우저 지원 | 100% | 95% (최신 브라우저) |
| 권장 사용 | 모든 환경 | 프로덕션 (gzip 폴백) |

### 자동 설정 (권장)

```bash
cd ~/NeuroNova/deploy/scripts
sudo bash enable_brotli.sh
```

### 수동 설정

#### 1. Brotli 모듈 설치
```bash
sudo apt-get update
sudo apt-get install -y libnginx-mod-http-brotli-filter libnginx-mod-http-brotli-static
```

#### 2. Brotli 설정 파일 생성
```bash
sudo nano /etc/nginx/conf.d/brotli.conf
```

#### 3. 다음 내용 추가
```nginx
# Brotli 압축 활성화
brotli on;

# 압축 레벨 (0-11, 6이 균형잡힘)
brotli_comp_level 6;

# 미리 압축된 .br 파일 사용 (존재하는 경우)
brotli_static on;

# 압축 대상 MIME 타입
brotli_types
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
    application/vnd.api+json
    application/manifest+json;

# 최소 압축 파일 크기
brotli_min_length 256;
```

#### 4. Nginx 재시작
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### Brotli Static 사전 압축 (선택사항)

빌드 시점에 파일을 미리 압축하여 서버 CPU 부하 감소:

```bash
# Node.js에서 빌드 후 압축
npm install -g brotli

# React 빌드 디렉토리에서 압축
cd ~/NeuroNova/frontend/react_web/dist
find . -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' \) -exec brotli {} \;

# 결과: main.js → main.js + main.js.br (둘 다 유지)
```

Nginx는 `.br` 파일이 있으면 실시간 압축 없이 바로 제공 (CPU 절약).

---

## 캐싱 전략

### 캐싱의 원리

#### Cache-Control 헤더
```
Cache-Control: public, max-age=31536000, immutable
```

- **public**: 모든 캐시 (브라우저, CDN)에서 저장 가능
- **max-age=31536000**: 1년 (초 단위)
- **immutable**: 파일이 절대 변경되지 않음 (재검증 불필요)

#### ETag
파일 내용의 해시값. 파일이 변경되지 않았으면 서버가 "304 Not Modified" 응답.

### 파일 타입별 캐싱 전략

최적화 설정 파일(`neuronova_optimized.conf`)의 캐싱 전략:

#### 1. HTML - 캐시 안 함
```nginx
location ~ \.html$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Pragma "no-cache";
    add_header Expires "0";
}
```

**이유**: HTML은 진입점이므로 항상 최신 버전 제공 필요.

#### 2. JS/CSS (해시 포함) - 1년 캐싱
```nginx
location ~* \.(js|mjs|css)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

**이유**: React 빌드 시 파일명에 해시 포함 (예: `main.a1b2c3d4.js`).
파일 내용이 변경되면 해시도 변경되므로 새 파일로 인식.

#### 3. 폰트 - 1년 캐싱
```nginx
location ~* \.(woff|woff2|ttf|otf|eot)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
    access_log off;
}
```

**이유**: 폰트는 거의 변경되지 않으며, CORS 허용 필요.

#### 4. 이미지 - 6개월 캐싱
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|webp|svg)$ {
    expires 6M;
    add_header Cache-Control "public, immutable";
    access_log off;
}
```

**이유**: 이미지는 가끔 변경될 수 있으므로 적당한 기간 설정.

#### 5. DICOM (의료 이미지) - 캐시 안 함
```nginx
location ~* \.(dcm|dicom)$ {
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    expires -1;
}
```

**이유**: 민감한 의료 데이터는 항상 최신 버전 제공.

### Open File Cache (성능 향상)

```nginx
location /static/ {
    # ...
    open_file_cache max=1000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
}
```

- **max=1000**: 최대 1000개 파일 디스크립터 캐싱
- **inactive=20s**: 20초간 접근 없으면 제거
- **valid=30s**: 30초마다 파일 존재 여부 확인
- **min_uses=2**: 20초 내 2번 이상 사용된 파일만 캐싱

**효과**: 디스크 I/O 감소로 서버 응답 속도 개선.

---

## 이미지 최적화

### WebP 변환

WebP는 JPEG/PNG보다 25-35% 작은 차세대 이미지 포맷입니다.

#### 브라우저 지원
- Chrome, Edge, Firefox, Opera: 100% 지원
- Safari: iOS 14+, macOS 11+ 지원
- 전체: 95% 이상 지원

### 자동 변환 (권장)

```bash
# WebP 도구 설치
sudo apt-get install -y webp

# 자동 변환 스크립트 실행
cd ~/NeuroNova/deploy/scripts
bash optimize_images.sh
```

스크립트는 다음을 수행합니다:
1. React `dist/` 폴더의 모든 PNG/JPG 찾기
2. 각 이미지를 WebP로 변환 (품질 85%)
3. 원본 파일 유지 (폴백용)
4. 변환 결과 및 절약 용량 출력

### 수동 변환

```bash
# 단일 파일 변환
cwebp -q 85 input.png -o output.webp

# 디렉토리 일괄 변환
find dist/ -name "*.png" -exec sh -c 'cwebp -q 85 "$1" -o "${1%.png}.webp"' _ {} \;
find dist/ -name "*.jpg" -exec sh -c 'cwebp -q 85 "$1" -o "${1%.jpg}.webp"' _ {} \;
```

### Nginx WebP 자동 서빙

최적화 설정 파일에 포함된 WebP 우선 서빙:

```nginx
location ~* \.(jpg|jpeg|png)$ {
    add_header Vary Accept;
    try_files $uri$webp_suffix $uri =404;
}
```

**동작 방식:**
1. 브라우저가 `Accept: image/webp` 헤더 전송
2. Nginx가 WebP 파일 먼저 찾기 (예: `logo.png` → `logo.webp`)
3. WebP 없으면 원본 제공
4. WebP 미지원 브라우저는 원본 제공

### WebP 품질 레벨

| 품질 | 크기 | 화질 | 권장 |
|------|------|------|------|
| 100 | 원본과 유사 | 무손실 | X (용량이 커짐) |
| 85 | 원본의 50-60% | 육안 차이 거의 없음 | ✅ **권장** |
| 75 | 원본의 40-50% | 약간 손실 | 일반 이미지 |
| 60 | 원본의 30-40% | 손실 감지됨 | 썸네일 |

---

## 기술적 설명

### 1. gzip/Brotli 압축이 왜 필요한가?

#### 텍스트 파일의 특성
JavaScript, CSS, HTML은 **텍스트 기반** 파일로, 반복되는 패턴이 많습니다.

**예시: JavaScript 코드**
```javascript
function calculateTotal(price, quantity) {
    return price * quantity;
}
function calculateDiscount(price, discountRate) {
    return price * discountRate;
}
```

위 코드에서 `function`, `price`, `return` 등이 반복됩니다.

#### 압축 알고리즘
- **gzip/Brotli**: 반복 패턴을 참조로 바꿔 크기 대폭 감소
- **예시**: "function" 3번 반복 → "function" 1번 + 참조 2개

#### 이미지/비디오는 압축 안 됨
- JPG/PNG는 이미 압축된 포맷
- gzip으로 압축해도 크기 거의 동일하거나 오히려 증가
- 따라서 `gzip_types`에 이미지 포맷은 제외

### 2. 브라우저 캐싱 동작 원리

#### 최초 방문
```
클라이언트 → 서버: GET /main.a1b2c3.js
서버 → 클라이언트: 200 OK
                    Cache-Control: max-age=31536000
                    파일 내용 (500KB)
브라우저: 디스크에 저장
```

#### 재방문 (1년 이내)
```
브라우저: 캐시 확인 → 유효기간 내
브라우저: 디스크에서 읽기 (서버 요청 안 함)
```

#### HTML은 왜 캐싱 안 하나?
```
클라이언트 → 서버: GET /index.html
서버 → 클라이언트: 200 OK
                    Cache-Control: no-cache
                    <script src="/main.NEW_HASH.js"></script>
```

HTML을 캐싱하면 새로운 JS/CSS 파일 참조를 못 받아 옛날 버전 사용.

### 3. ETag와 조건부 요청

#### 최초 요청
```
클라이언트 → 서버: GET /logo.png
서버 → 클라이언트: 200 OK
                    ETag: "abc123def456"
                    파일 내용 (100KB)
```

#### 재검증 요청 (캐시 만료 후)
```
클라이언트 → 서버: GET /logo.png
                    If-None-Match: "abc123def456"
서버: 파일 확인 → 변경 없음
서버 → 클라이언트: 304 Not Modified (본문 없음)
브라우저: 캐시에서 읽기
```

**절약 효과**: 100KB 대신 1KB 미만 전송 (헤더만).

### 4. gzip vs Brotli 압축 알고리즘 비교

#### gzip (DEFLATE)
- **개발**: 1992년, Jean-loup Gailly와 Mark Adler
- **알고리즘**: LZ77 + Huffman 코딩
- **사전**: 32KB 슬라이딩 윈도우

#### Brotli
- **개발**: 2013년, Google
- **알고리즘**: LZ77 변형 + Huffman 코딩 + 컨텍스트 모델링
- **사전**: 미리 정의된 사전 (웹 콘텐츠 최적화)
- **특징**: HTML/CSS/JS에서 자주 사용되는 패턴 사전 포함

**압축률 비교 (JavaScript):**
```
원본: 1000KB
gzip -6: 250KB (75% 압축)
Brotli -6: 200KB (80% 압축, gzip 대비 20% 더 압축)
```

### 5. 왜 JPG/PNG는 gzip으로 압축되지 않나?

#### 이미 압축된 포맷
- **JPG**: JPEG 압축 (손실 압축)
- **PNG**: DEFLATE 압축 (무손실 압축)

#### gzip 적용 시
```
원본 PNG: 100KB (이미 DEFLATE로 압축됨)
gzip 압축: 101KB (오히려 증가!)
```

**이유**: PNG는 DEFLATE를 사용하는데, gzip도 DEFLATE 사용.
이미 압축된 데이터를 다시 압축하면 효과 없음.

#### 해결책: WebP 변환
```
원본 PNG: 100KB
WebP 변환: 60KB (40% 절감)
```

---

## 성능 측정 및 검증

### 1. 압축 확인

#### gzip 압축 확인
```bash
curl -H 'Accept-Encoding: gzip' -I http://your-domain.com | grep -i content-encoding
# 출력 예상: content-encoding: gzip
```

#### Brotli 압축 확인
```bash
curl -H 'Accept-Encoding: br' -I http://your-domain.com | grep -i content-encoding
# 출력 예상: content-encoding: br
```

### 2. 압축 효과 측정

#### 압축 전 크기
```bash
curl -H 'Accept-Encoding: identity' http://your-domain.com/assets/main.js -o /dev/null -s -w 'Size: %{size_download} bytes\n'
# 출력 예상: Size: 2000000 bytes (2MB)
```

#### gzip 압축 후 크기
```bash
curl -H 'Accept-Encoding: gzip' http://your-domain.com/assets/main.js -o /dev/null -s -w 'Size: %{size_download} bytes\n'
# 출력 예상: Size: 500000 bytes (500KB, 75% 감소)
```

#### Brotli 압축 후 크기
```bash
curl -H 'Accept-Encoding: br' http://your-domain.com/assets/main.js -o /dev/null -s -w 'Size: %{size_download} bytes\n'
# 출력 예상: Size: 400000 bytes (400KB, 80% 감소)
```

### 3. 캐싱 확인

```bash
# 캐시 헤더 확인
curl -I http://your-domain.com/assets/main.js | grep -i cache-control
# 출력 예상: Cache-Control: public, max-age=31536000, immutable
```

### 4. 브라우저 개발자 도구로 확인

#### Chrome DevTools
1. F12 → Network 탭
2. 페이지 새로고침
3. 파일 클릭 → Headers 탭 확인

**확인 사항:**
- **Content-Encoding**: gzip 또는 br
- **Cache-Control**: 파일 타입별로 적절한 값
- **Size**: 전송 크기 (압축 후) vs 리소스 크기 (압축 전)

#### 예시
```
main.js
Size: 500 KB (전송: 125 KB, 75% 절감)
Cache-Control: public, max-age=31536000, immutable
Content-Encoding: gzip
```

### 5. Google PageSpeed Insights

1. https://pagespeed.web.dev/ 접속
2. 도메인 입력
3. 분석 결과 확인

**최적화 전:**
- Enable text compression: ❌ (점수 감점)
- Serve static assets with an efficient cache policy: ❌

**최적화 후:**
- Enable text compression: ✅
- Serve static assets with an efficient cache policy: ✅
- Performance 점수: 95+ (Green)

### 6. 실제 사용자 경험 측정

#### Lighthouse (Chrome)
```bash
# Lighthouse CI로 측정
npm install -g @lhci/cli
lhci autorun --collect.url=http://your-domain.com
```

**측정 항목:**
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)

**최적화 전후 비교:**
```
최적화 전:
- FCP: 3.5s
- LCP: 5.2s
- Performance: 65

최적화 후:
- FCP: 1.2s (66% 개선)
- LCP: 1.8s (65% 개선)
- Performance: 95
```

---

## 최적화 체크리스트

배포 후 다음 항목을 확인하세요:

- [ ] gzip 압축 활성화 (`content-encoding: gzip` 확인)
- [ ] Brotli 압축 활성화 (선택사항, `content-encoding: br` 확인)
- [ ] HTML은 캐싱 안 함 (`Cache-Control: no-cache` 확인)
- [ ] JS/CSS는 1년 캐싱 (`max-age=31536000` 확인)
- [ ] 이미지 WebP 변환 완료
- [ ] WebP 자동 서빙 동작 확인
- [ ] PageSpeed Insights 점수 90+ 달성
- [ ] 압축 효과 측정 (70%+ 절감 확인)

---

## 트러블슈팅

### 1. gzip/Brotli 압축이 안 됨

**증상:**
```bash
curl -H 'Accept-Encoding: gzip' -I http://your-domain.com
# content-encoding 헤더 없음
```

**원인 및 해결:**

#### 원인 1: 설정 파일 오류
```bash
# Nginx 설정 테스트
sudo nginx -t
# 오류 있으면 수정
```

#### 원인 2: 파일 크기가 너무 작음
```nginx
# gzip_min_length 확인
gzip_min_length 256;  # 256 bytes 이하는 압축 안 함
```

#### 원인 3: MIME 타입 누락
```nginx
# gzip_types에 해당 MIME 타입 추가
gzip_types text/css;  # CSS 파일 압축
```

### 2. 브라우저 캐싱이 안 됨

**증상:**
매 요청마다 서버에서 파일 다운로드 (Network 탭에서 확인)

**원인 및 해결:**

#### 원인 1: HTML을 캐싱하려고 함
```nginx
# HTML은 캐싱하면 안 됨 (의도된 동작)
location ~ \.html$ {
    add_header Cache-Control "no-cache";
}
```

#### 원인 2: Vary 헤더 충돌
```nginx
# gzip_vary on이면 Vary: Accept-Encoding 자동 추가
# 다른 Vary 헤더와 충돌 가능
```

### 3. WebP 이미지가 표시 안 됨

**증상:**
WebP 파일은 있는데 브라우저에서 원본 이미지 사용

**원인 및 해결:**

#### 원인 1: Nginx 설정 누락
```nginx
# 최적화 설정 파일 사용 여부 확인
location ~* \.(jpg|jpeg|png)$ {
    add_header Vary Accept;
    try_files $uri$webp_suffix $uri =404;
}
```

#### 원인 2: 브라우저가 WebP 미지원
- Safari 14 미만: WebP 미지원 (폴백 정상 동작)
- 개발자 도구 → Network → Accept 헤더 확인

### 4. 압축 후에도 파일이 큼

**증상:**
gzip 압축해도 크기가 거의 안 줄어듦

**원인 및 해결:**

#### 원인 1: 이미지/비디오 압축 시도
```
JPG/PNG는 이미 압축된 포맷 → gzip 효과 없음
해결: WebP 변환 사용
```

#### 원인 2: 압축 레벨이 너무 낮음
```nginx
# 압축 레벨 높이기 (CPU 사용량 증가)
gzip_comp_level 9;  # 최고 압축 (CPU 2배 사용)
```

---

## 추가 최적화 팁

### 1. CDN 사용 (선택사항)

압축과 캐싱 외에 CDN(CloudFlare, AWS CloudFront)을 사용하면:
- 전 세계 엣지 서버에서 정적 파일 서빙
- 사용자와 가까운 위치에서 제공 (지연 시간 감소)
- DDoS 보호

### 2. HTTP/2 활성화

```nginx
listen 443 ssl http2;
```

**이점:**
- 멀티플렉싱: 여러 파일 동시 전송
- 헤더 압축: HTTP 헤더도 압축
- 서버 푸시: HTML과 함께 JS/CSS 미리 전송

### 3. 프리로드 힌트

```html
<!-- index.html -->
<link rel="preload" href="/assets/main.js" as="script">
<link rel="preload" href="/assets/main.css" as="style">
```

**이점:**
브라우저가 HTML 파싱 전에 중요한 리소스 미리 다운로드.

---

**문서 버전**: 1.0
**최종 수정일**: 2025-12-06
**작성자**: NeuroNova 개발팀
