# Docker 환경 설정 및 수정 보고서

이 문서는 NeuroNova 프로젝트의 Docker 환경을 실행하기 위해 수행된 수정 사항과 설정 내용을 정리한 것입니다.

## 1. Flask Inference 서비스 수정

### 문제점
- `requirements.txt` 파일이 누락되어 있었습니다.
- `Dockerfile`에서 의존성 설치 부분이 주석 처리되어 있었습니다.
- `libgl1-mesa-glx` 패키지가 더 이상 지원되지 않아 빌드 오류가 발생했습니다.

### 조치 사항
1. **`requirements.txt` 생성**: `flask` 패키지를 포함하는 요구사항 파일을 생성했습니다.
2. **`Dockerfile` 수정**:
   - `requirements.txt`를 복사하고 `pip install`을 실행하는 코드의 주석을 해제했습니다.
   - 시스템 의존성 패키지를 `libgl1-mesa-glx`에서 `libgl1`으로 변경하여 빌드 오류를 해결했습니다.

## 2. Django Main 서비스 설정

### 문제점
- `settings.py`는 기본적으로 MySQL을 사용하도록 설정되어 있었으나, `docker-compose.yml`은 PostgreSQL 컨테이너(`db`)를 제공하고 있었습니다.
- 이로 인해 Django가 데이터베이스에 연결할 수 없는 오류(`ConnectionRefusedError`)가 발생했습니다.

### 조치 사항
- **`docker-compose.yml` 환경 변수 추가**: Django 서비스(`django`)에 다음 환경 변수를 추가하여 PostgreSQL을 사용하도록 강제 설정했습니다.
  ```yaml
  environment:
    - DB_ENGINE=django.db.backends.postgresql
    - DB_PORT=5432
  ```
  이를 통해 `settings.py`의 `DB_ENGINE` 설정을 덮어쓰고 올바른 데이터베이스에 연결하도록 했습니다.

## 3. MySQL 전환 및 권한 설정 (추가 사항)

### 요청 사항
- PostgreSQL 대신 MySQL을 사용하도록 변경
- 모든 권한 허용

### 조치 사항
1. **`docker-compose.yml` 수정**:
   - `db` 서비스를 `postgres:15`에서 `mysql:8.0`으로 변경했습니다.
   - Django 서비스의 환경 변수를 MySQL에 맞게 수정했습니다 (`DB_ENGINE=django.db.backends.mysql`, `DB_PORT=3306`).
   - 볼륨 이름을 `postgres_data`에서 `mysql_data`로 변경했습니다.

2. **`settings.py` 수정**:
   - `CORS_ORIGIN_ALLOW_ALL = True`를 설정하여 모든 출처에서의 접근을 허용했습니다.
   - `REST_FRAMEWORK`의 `DEFAULT_PERMISSION_CLASSES`를 `AllowAny`로 설정하여 인증 없이 API에 접근할 수 있도록 했습니다.
   - MySQL 연결을 위해 `charset` 및 `init_command` 옵션을 복원했습니다.

3. **마이그레이션**:
   - MySQL 컨테이너가 실행된 후 `python manage.py migrate`를 실행하여 데이터베이스 스키마를 생성했습니다.

## 4. 실행 상태

- `docker-compose up --build` 명령을 통해 모든 서비스(Django, Flask, React, Postgres, Redis, Orthanc)가 성공적으로 빌드되고 컨테이너가 생성되었습니다.
- 현재 모든 컨테이너가 실행 중(`Up`) 상태입니다.

## 4. 실행 방법

다음 명령어로 전체 서비스를 실행할 수 있습니다:

```bash
docker-compose up -d
```
