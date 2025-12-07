# NeuroNova HTTPS 설정 가이드

## 목차
1. [개요](#개요)
2. [사전 준비](#사전-준비)
3. [Let's Encrypt 설정](#lets-encrypt-설정)
4. [Django HTTPS 설정](#django-https-설정)
5. [보안 강화](#보안-강화)
6. [인증서 관리](#인증서-관리)
7. [트러블슈팅](#트러블슈팅)

---

## 개요

HTTPS는 웹사이트와 사용자 간의 통신을 암호화하여 데이터를 보호합니다. 의료 정보를 다루는 NeuroNova에서는 HTTPS가 필수입니다.

### HTTPS의 중요성
- ✅ **데이터 암호화**: 환자 정보, 로그인 credentials 보호
- ✅ **신뢰성**: 브라우저에 자물쇠 아이콘 표시
- ✅ **SEO**: 검색 엔진 순위 개선
- ✅ **규제 준수**: HIPAA, GDPR 요구사항
- ✅ **필수 기능**: PWA, HTTP/2, 지오로케이션 등

### Let's Encrypt
- 무료 SSL/TLS 인증서
- 자동 갱신
- 90일 유효기간
- 신뢰할 수 있는 인증 기관

---

## 사전 준비

### 1. 도메인 준비

HTTPS를 설정하려면 도메인이 필요합니다.

#### 도메인 구매
- **국내**: 가비아, 후이즈, 카페24
- **국외**: Namecheap, GoDaddy, Google Domains

#### 서브도메인 추천
```
neuronova.your-domain.com
cdss.your-domain.com
hospital.your-domain.com
```

### 2. DNS 설정

도메인을 서버 IP로 연결합니다.

#### DNS A 레코드 추가

1. 도메인 관리 페이지 접속
2. DNS 관리 선택
3. A 레코드 추가:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ (또는 neuronova) | 서버_IP_주소 | 3600 |

**예시:**
```
Type: A
Name: @
Value: 123.456.789.012
TTL: 3600
```

#### 서버 IP 확인
```bash
# 서버에서 실행
curl ifconfig.me
# 출력: 123.456.789.012
```

#### DNS 전파 확인
```bash
# DNS 조회
dig +short your-domain.com
nslookup your-domain.com

# 서버 IP와 일치하는지 확인
```

⚠️ **주의**: DNS 전파는 최대 48시간 소요 (보통 10분~1시간)

### 3. 방화벽 설정

포트 80(HTTP)과 443(HTTPS)을 열어야 합니다.

```bash
# UFW (Ubuntu Firewall)
sudo ufw allow 'Nginx Full'
sudo ufw delete allow 'Nginx HTTP'  # 80만 허용하는 규칙 삭제
sudo ufw status

# 출력:
# 443/tcp    ALLOW    Anywhere
# 80/tcp     ALLOW    Anywhere
```

### 4. Nginx 설정 확인

```bash
# Nginx 실행 확인
sudo systemctl status nginx

# Nginx 설정 테스트
sudo nginx -t
```

---

## Let's Encrypt 설정

### 원클릭 설치 (권장)

```bash
cd ~/NeuroNova/deploy/ssl
sudo bash setup_https.sh your-domain.com
```

**예시:**
```bash
sudo bash setup_https.sh neuronova.example.com
```

스크립트가 자동으로:
1. Certbot 설치
2. DNS 확인
3. SSL 인증서 발급
4. Nginx 설정 자동 수정
5. HTTPS 테스트

### 수동 설정

#### 1. Certbot 설치
```bash
sudo apt-get update
sudo apt-get install -y certbot python3-certbot-nginx
```

#### 2. SSL 인증서 발급
```bash
sudo certbot --nginx -d your-domain.com
```

**인터랙티브 프롬프트:**
```
Saving debug log to /var/log/letsencrypt/letsencrypt.log

Enter email address (used for urgent renewal and security notices):
 your-email@example.com

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Please read the Terms of Service at
https://letsencrypt.org/documents/LE-SA-v1.3-September-21-2022.pdf.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(A)gree/(C)ancel: A

- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Would you be willing to share your email address with the Electronic Frontier
Foundation?
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
(Y)es/(N)o: N

Obtaining a new certificate
Performing the following challenges:
http-01 challenge for your-domain.com
Waiting for verification...
Cleaning up challenges
Deploying Certificate to VirtualHost /etc/nginx/sites-enabled/neuronova

Please choose whether or not to redirect HTTP traffic to HTTPS:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
1: No redirect
2: Redirect - Make all requests redirect to secure HTTPS access.
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
Select: 2

Redirecting all traffic on port 80 to ssl in /etc/nginx/sites-enabled/neuronova

Congratulations! You have successfully enabled https://your-domain.com
```

#### 3. 자동 갱신 테스트
```bash
sudo certbot renew --dry-run
```

출력:
```
Saving debug log to /var/log/letsencrypt/letsencrypt.log
Processing /etc/letsencrypt/renewal/your-domain.com.conf
Cert not due for renewal, but simulating renewal for dry run
Plugins selected: Authenticator nginx, Installer nginx
Simulating renewal of an existing certificate for your-domain.com
Performing the following challenges:
http-01 challenge for your-domain.com
Waiting for verification...
Cleaning up challenges

Congratulations, all simulated renewals succeeded!
```

### 인증서 확인

```bash
# 인증서 정보 확인
sudo certbot certificates

# 출력:
# Certificate Name: your-domain.com
#   Domains: your-domain.com
#   Expiry Date: 2025-03-06 12:34:56+00:00 (VALID: 89 days)
#   Certificate Path: /etc/letsencrypt/live/your-domain.com/fullchain.pem
#   Private Key Path: /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### HTTPS 테스트

```bash
# 브라우저에서 접속
https://your-domain.com

# 또는 curl
curl -I https://your-domain.com

# 출력:
# HTTP/2 200
# server: nginx
# ...
```

---

## Django HTTPS 설정

### settings.py 수정

Django가 HTTPS를 인식하도록 설정합니다.

```python
# backend/django_main/neuronova/settings.py

# HTTPS 설정
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')
SECURE_SSL_REDIRECT = True  # HTTP를 HTTPS로 자동 리다이렉트

# HSTS (HTTP Strict Transport Security)
SECURE_HSTS_SECONDS = 31536000  # 1년
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# 쿠키 보안
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True

# 브라우저 보안 헤더
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
```

### .env 파일 수정

```bash
cd ~/NeuroNova/backend/django_main
nano .env
```

다음 항목 수정:
```bash
# ALLOWED_HOSTS에 도메인 추가
ALLOWED_HOSTS=your-domain.com,www.your-domain.com,localhost,127.0.0.1

# CSRF 설정
CSRF_TRUSTED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

### Django 재시작

```bash
sudo systemctl restart gunicorn_django
sudo systemctl status gunicorn_django
```

---

## 보안 강화

### 1. SSL 등급 확인

SSL Labs로 보안 등급 테스트:

```
https://www.ssllabs.com/ssltest/analyze.html?d=your-domain.com
```

**목표 등급**: A 또는 A+

### 2. 보안 헤더 추가

Nginx 설정에 보안 헤더 추가 (이미 HTTPS 설정에 포함됨):

```nginx
# HSTS (HTTP Strict Transport Security)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;

# Clickjacking 방지
add_header X-Frame-Options "SAMEORIGIN" always;

# MIME 스니핑 방지
add_header X-Content-Type-Options "nosniff" always;

# XSS 필터
add_header X-XSS-Protection "1; mode=block" always;

# Referrer 정책
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
```

### 3. TLS 버전 제한

오래된 TLS 버전 비활성화:

```nginx
# /etc/nginx/nginx.conf 또는 sites-available/neuronova
ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;
```

### 4. OCSP Stapling

인증서 상태 확인 성능 개선:

```nginx
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/letsencrypt/live/your-domain.com/chain.pem;
resolver 8.8.8.8 8.8.4.4 valid=300s;
resolver_timeout 5s;
```

### 5. 보안 헤더 검증

```bash
# Security Headers 확인
curl -I https://your-domain.com | grep -i "strict-transport-security\|x-frame-options\|x-content-type-options"
```

---

## 인증서 관리

### 자동 갱신

Certbot은 인증서를 자동으로 갱신합니다 (90일 유효기간).

#### 갱신 Cron 작업 확인
```bash
# Certbot 타이머 확인
sudo systemctl status certbot.timer

# 수동으로 갱신 (테스트)
sudo certbot renew --dry-run
```

#### 갱신 Cron 작업 추가 (선택사항)
```bash
crontab -e
```

다음 라인 추가:
```cron
# Let's Encrypt 인증서 갱신 (매일 새벽 3시)
0 3 * * * certbot renew --quiet --post-hook "systemctl reload nginx" >> /var/log/letsencrypt/renew.log 2>&1
```

### 수동 갱신

```bash
# 인증서 갱신
sudo certbot renew

# 출력:
# Processing /etc/letsencrypt/renewal/your-domain.com.conf
# Cert not yet due for renewal
#
# The following certificates are not due for renewal yet:
#   /etc/letsencrypt/live/your-domain.com/fullchain.pem expires on 2025-03-06 (skipped)
# No renewals were attempted.
```

### 강제 갱신

```bash
# 만료일 30일 이내인 경우에만 갱신
sudo certbot renew --force-renewal
```

### 인증서 삭제

```bash
# 인증서 삭제 (도메인 변경 시)
sudo certbot delete --cert-name your-domain.com
```

### 여러 도메인 추가

```bash
# 기존 인증서에 도메인 추가
sudo certbot --nginx -d your-domain.com -d www.your-domain.com -d api.your-domain.com
```

---

## 트러블슈팅

### 1. DNS 전파 문제

**증상:**
```
Certbot failed to authenticate some domains
Detail: DNS problem: NXDOMAIN looking up A for your-domain.com
```

**해결:**
```bash
# DNS 조회
dig +short your-domain.com

# 서버 IP와 일치하지 않으면 DNS 설정 재확인
# DNS 전파 대기 (최대 48시간)
```

### 2. 포트 80 차단

**증상:**
```
Failed authorization procedure
The client lacks sufficient authorization
```

**해결:**
```bash
# 포트 80 확인
sudo netstat -tulpn | grep :80

# 방화벽 확인
sudo ufw status

# 포트 80 열기
sudo ufw allow 80/tcp
```

### 3. Nginx 설정 충돌

**증상:**
```
nginx: [emerg] conflicting server name "your-domain.com"
```

**해결:**
```bash
# 중복 설정 확인
sudo nginx -T | grep server_name

# sites-enabled에서 중복 제거
ls -la /etc/nginx/sites-enabled/

# 테스트
sudo nginx -t
```

### 4. 인증서 갱신 실패

**증상:**
```
Attempting to renew cert (your-domain.com) from /etc/letsencrypt/renewal/your-domain.com.conf produced an unexpected error
```

**해결:**
```bash
# 로그 확인
sudo tail -50 /var/log/letsencrypt/letsencrypt.log

# 수동 갱신 시도
sudo certbot renew --force-renewal

# 실패 시 인증서 재발급
sudo certbot delete --cert-name your-domain.com
sudo certbot --nginx -d your-domain.com
```

### 5. Mixed Content 경고

**증상:**
브라우저 콘솔에 "Mixed Content" 경고

**해결:**
```javascript
// React에서 API 호출 시 HTTPS 사용
const API_URL = 'https://your-domain.com/api';

// 또는 상대 경로 사용
const API_URL = '/api';
```

```nginx
# Nginx에서 HTTP를 HTTPS로 강제
return 301 https://$server_name$request_uri;
```

### 6. HSTS 문제

**증상:**
```
NET::ERR_CERT_AUTHORITY_INVALID
```

**해결:**
```bash
# Chrome HSTS 삭제 (로컬 테스트)
chrome://net-internals/#hsts
# Query HSTS/PKP domain: your-domain.com
# Delete domain security policies

# 또는 HSTS 비활성화 (테스트 시만)
# add_header Strict-Transport-Security "max-age=0";
```

### 7. 인증서 체인 오류

**증상:**
```
SSL certificate problem: unable to get local issuer certificate
```

**해결:**
```bash
# 인증서 체인 확인
openssl s_client -connect your-domain.com:443 -showcerts

# Certbot 재발급
sudo certbot --nginx -d your-domain.com --force-renewal
```

---

## HTTP/2 활성화

HTTPS와 함께 HTTP/2를 사용하면 성능이 크게 향상됩니다.

### Nginx HTTP/2 설정

```nginx
# /etc/nginx/sites-available/neuronova
listen 443 ssl http2;
listen [::]:443 ssl http2;
```

### HTTP/2 확인

```bash
# curl로 확인
curl -I --http2 https://your-domain.com | grep HTTP

# 출력: HTTP/2 200
```

---

## 보안 체크리스트

HTTPS 설정 후 다음 항목을 확인하세요:

- [ ] SSL 인증서 유효함 (`certbot certificates`)
- [ ] HTTP → HTTPS 자동 리다이렉트
- [ ] 보안 헤더 설정 (HSTS, X-Frame-Options 등)
- [ ] Django HTTPS 설정 완료
- [ ] 자동 갱신 테스트 성공 (`certbot renew --dry-run`)
- [ ] SSL Labs 등급 A 이상
- [ ] Mixed Content 경고 없음
- [ ] HTTP/2 활성화

---

**문서 버전**: 1.0
**최종 수정일**: 2025-12-06
**작성자**: NeuroNova 개발팀
