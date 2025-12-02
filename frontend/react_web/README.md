# NeuroNova Web Frontend

의료진용 React 웹 애플리케이션 - 뇌종양 진단 임상 의사결정 지원 시스템 (CDSS)

## 📋 요구사항

- **Node.js**: >= 18.0.0
- **npm**: >= 9.0.0

### Node.js 버전 확인

```bash
node --version  # v18.0.0 이상이어야 함
npm --version   # v9.0.0 이상이어야 함
```

### Node.js 업데이트

Node.js 18 이상이 필요합니다. 설치되어 있지 않다면:

1. [Node.js 공식 웹사이트](https://nodejs.org/)에서 **LTS 버전 (v18 이상)** 다운로드
2. 설치 완료 후 **시스템 재시작** (PATH 업데이트를 위해)
3. 버전 확인: `node --version` 및 `npm --version`

## 🚀 기술 스택

- **React 19.2.0** - UI 라이브러리
- **Vite 5.0** - 빌드 도구
- **React Router 7.0** - 라우팅
- **Axios** - HTTP 클라이언트
- **Material-UI 5.14** - UI 컴포넌트
- **Recharts** - 차트 라이브러리
- **3Dmol 2.5** - 단백질 3D 뷰어
- **QRCode** - QR 코드 생성

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
```bash
cp .env.example .env
```

`.env` 파일에서 API URL 설정:
```
VITE_API_BASE_URL=http://localhost:8000
```

### 3. 개발 서버 실행
```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

### 4. 프로덕션 빌드
```bash
npm run build
npm run preview
```

## 프로젝트 구조

```
src/
├── api/                # API 클라이언트
│   └── axios.js        # Axios 설정
├── auth/               # 인증 관련
│   └── AuthContext.jsx # Auth Context
├── components/         # 재사용 가능한 컴포넌트
├── pages/              # 페이지 컴포넌트
│   ├── LoginPage.jsx
│   ├── DashboardPage.jsx
│   ├── PatientListPage.jsx
│   └── AboutPage.jsx
├── utils/              # 유틸리티
│   └── config.js       # 설정 파일
├── assets/             # 정적 파일
├── App.jsx             # 메인 App
└── main.jsx            # 엔트리 포인트
```

## 주요 기능

### 대시보드
- 오늘의 예약 현황
- AI 진단 결과 요약
- 환자 통계
- 최근 활동 타임라인

### 환자 관리
- 환자 목록 조회
- 환자 상세 정보
- 진료 기록 (SOAP 차트)
- 활력 징후

### AI 진단
- 뇌종양 분류 결과
- XAI 시각화 (SHAP, Grad-CAM)
- 의사 피드백 (Human-in-the-loop)

### DICOM 뷰어
- Orthanc 통합
- 의료 영상 조회

### 예약 관리
- 예약 일정 확인
- 예약 승인/거부

## API 엔드포인트

설정은 `src/utils/config.js`에서 관리됩니다:

- `/api/v1/users/` - 사용자 관리
- `/api/v1/emr/` - 진료 기록
- `/api/v1/custom/` - 예약, AI 진단, 처방
- `/api/v1/notifications/` - 알림

## 코딩 규칙

- ✅ **Soft-coding**: 모든 설정 값은 `config.js`에서 관리
- ✅ **타입 안정성**: PropTypes 또는 TypeScript 사용 권장
- ✅ **컴포넌트 문서화**: JSDoc 주석 작성
- ✅ **상태 관리**: Context API 사용

## 개발 가이드

### 새 페이지 추가

1. `src/pages/` 에 페이지 컴포넌트 생성
2. `App.jsx`에 라우트 추가
3. 필요시 네비게이션에 링크 추가

### API 호출

```javascript
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

const fetchPatients = async () => {
  const response = await axiosClient.get(API_ENDPOINTS.PATIENTS);
  return response.data;
};
```

### 인증 사용

```javascript
import { useAuth } from '../auth/AuthContext';

const MyComponent = () => {
  const { user, login, logout, isAuthenticated } = useAuth();
  // ...
};
```

## 배포

### Nginx 설정 예시

```nginx
server {
    listen 80;
    server_name neuronova.example.com;

    root /var/www/neuronova/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 문제 해결

### CORS 오류
- Django에서 CORS 설정 확인
- `settings.py`의 `CORS_ALLOWED_ORIGINS` 확인

### 인증 토큰 만료
- 자동으로 refresh token으로 갱신
- 실패 시 로그인 페이지로 리다이렉트

## 라이선스

TBD
