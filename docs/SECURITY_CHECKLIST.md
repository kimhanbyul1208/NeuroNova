# 보안 체크리스트

## ✅ 완료된 보안 조치

### 1. 민감 정보 제거 ✅
- **settings.py**: 하드코딩된 DB 정보 제거
  - ~~`DB_NAME=daejeon`~~
  - ~~`DB_USER=acorn`~~
  - ~~`DB_PASSWORD=acorn1234`~~
  - ~~`DB_HOST=34.61.113.204`~~
- **변경 후**: 모두 `.env` 파일에서 관리

### 2. .gitignore 설정 ✅
- **파일 위치**: `backend/django_main/.gitignore`
- **포함 항목**:
  ```
  .env
  *.log
  db.sqlite3
  media/
  staticfiles/
  ```

### 3. Docker 구성 정리 ✅
- **제거**: 로컬 MySQL 컨테이너 (원격 DB 사용)
- **제거**: Orthanc 컨테이너 (나중에 별도 설치)
- **유지**: Redis, Django, Flask, React

---

## ⚠️ 배포 전 필수 체크

### 환경 변수 설정
- [ ] `.env` 파일 생성 (`backend/django_main/.env`)
- [ ] `SECRET_KEY` 변경 (기본값 사용 금지!)
- [ ] `DB_PASSWORD` 강력한 비밀번호로 설정
- [ ] `JWT_SECRET_KEY` 변경
- [ ] `DEBUG=False` 설정 (운영 환경)
- [ ] `ALLOWED_HOSTS` 도메인 추가

### Git 보안
- [ ] `.env` 파일이 Git에 추적되지 않는지 확인
  ```bash
  git status  # .env가 나타나면 안 됨
  ```
- [ ] 기존 커밋에 민감 정보 포함 여부 확인
  ```bash
  git log --all --full-history -- "*settings.py"
  ```
- [ ] 만약 이미 커밋된 경우, Git 히스토리 정리 필요

### Firebase 보안
- [ ] `firebase-service-account.json` 파일 권한 확인
- [ ] 이 파일도 `.gitignore`에 포함되어 있는지 확인
  ```bash
  # backend/django_main/.gitignore에 추가
  config/firebase-service-account.json
  ```

---

## 🔒 권장 보안 조치

### 1. 비밀번호 강도
**강력한 비밀번호 생성**:
```python
# Python으로 랜덤 비밀번호 생성
import secrets
print(secrets.token_urlsafe(32))
```

**사용처**:
- `SECRET_KEY`
- `DB_PASSWORD`
- `JWT_SECRET_KEY`
- `FLASK_API_KEY`

### 2. 환경 분리
**개발/운영 환경 분리**:
```bash
# 개발 환경
backend/django_main/.env.development

# 운영 환경
backend/django_main/.env.production
```

**설정 방법**:
```python
# settings.py
from decouple import Config, RepositoryEnv

ENV_FILE = '.env.production' if not DEBUG else '.env.development'
config = Config(RepositoryEnv(ENV_FILE))
```

### 3. 데이터베이스 보안
- **SSL/TLS 연결** 사용:
  ```python
  # settings.py
  DATABASES = {
      'default': {
          'OPTIONS': {
              'ssl': {'ca': '/path/to/ca-cert.pem'}
          }
      }
  }
  ```
- **최소 권한 원칙**: DB 계정에 필요한 권한만 부여
- **정기적인 비밀번호 변경**

### 4. API 보안
- **CORS 설정** 확인 (ALLOWED_HOSTS)
- **JWT 토큰 만료 시간** 적절히 설정
- **Rate Limiting** 구현 (Django REST Framework Throttling)

### 5. HTTPS/SSL
**Let's Encrypt 인증서** (무료):
```bash
# Certbot 사용
docker run -it --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  certbot/certbot certonly --standalone \
  -d your-domain.com
```

**Nginx 설정**:
```nginx
server {
    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
}
```

---

## 🚨 보안 사고 발생 시 대응

### 민감 정보 노출 시
1. **즉시 변경**: 노출된 비밀번호/키 즉시 변경
2. **Git 히스토리 정리** (BFG Repo-Cleaner 사용):
   ```bash
   # BFG 다운로드 후
   java -jar bfg.jar --delete-files settings.py
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```
3. **Force Push** (주의!):
   ```bash
   git push origin --force --all
   ```

### 무단 접근 감지 시
1. DB 비밀번호 즉시 변경
2. 모든 JWT 토큰 무효화
3. 로그 분석 (접근 IP, 시간)
4. 필요 시 서버 일시 중단

---

## 📋 정기 점검 체크리스트

### 월간
- [ ] 의존성 업데이트 (pip, npm)
- [ ] 보안 취약점 스캔
  ```bash
  # Python
  pip install safety
  safety check

  # Docker
  docker scan neuronova-django
  ```

### 분기별
- [ ] 비밀번호 변경 (DB, API 키)
- [ ] 불필요한 계정/권한 정리
- [ ] 로그 분석 (의심스러운 활동)

### 연간
- [ ] SSL 인증서 갱신
- [ ] 보안 정책 검토
- [ ] 전체 시스템 보안 감사

---

## 🔗 참고 자료

### Django 보안
- [Django Security Checklist](https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

### Docker 보안
- [Docker Security Best Practices](https://docs.docker.com/develop/security-best-practices/)
- [CIS Docker Benchmark](https://www.cisecurity.org/benchmark/docker)

### 일반 보안
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)

---

**마지막 업데이트**: 2025-11-29
**담당자**: NeuroNova 개발팀
