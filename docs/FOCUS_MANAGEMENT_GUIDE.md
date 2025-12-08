# 포커스 관리 전략 가이드

## 개요
이 문서는 React + MUI 환경에서 `aria-hidden` 접근성 오류를 방지하고 올바른 포커스 관리를 위한 전체 전략을 설명합니다.

---

## 문제 상황

### 오류 메시지
```
Blocked aria-hidden on an element because its descendant retained focus.
The focus must not be hidden from assistive technology users.
```

### 발생 원인
1. Modal/Dialog가 닫힌 후에도 내부 버튼에 포커스가 남아있음
2. 페이지 전환 시 이전 페이지 요소가 포커스를 유지
3. MUI Drawer/Backdrop에 `aria-hidden="true"`가 적용된 상태에서 내부 요소 포커스
4. 동적 컴포넌트 언마운트 시 포커스 정리 누락

---

## 해결 전략

### 1. 유틸리티 레벨 (utils/focusManager.js)

**위치:** `src/utils/focusManager.js`

**기능:**
- `hasAriaHiddenAncestor()`: aria-hidden 조상 요소 확인
- `isFocusTrapped()`: 현재 포커스가 aria-hidden 내부에 있는지 확인
- `safeBlur()`: 안전하게 포커스 제거
- `fixAriaHiddenConflict()`: 충돌 자동 수정
- `startFocusMonitoring()`: 개발 모드에서 주기적 감지

**사용 예시:**
```javascript
import { fixAriaHiddenConflict, safeBlur } from '../utils/focusManager';

// 컴포넌트 언마운트 시
useEffect(() => {
  return () => {
    safeBlur();
  };
}, []);

// Modal 닫을 때
const handleClose = () => {
  fixAriaHiddenConflict();
  onClose();
};
```

---

### 2. 훅 레벨 (hooks/useFocusCleanup.js)

**위치:** `src/hooks/useFocusCleanup.js`

#### A. useFocusCleanup
컴포넌트 마운트/언마운트 시 자동으로 포커스 정리

```javascript
import { useFocusCleanup } from '../hooks/useFocusCleanup';

function MyPage() {
  useFocusCleanup(true); // autoFix 활성화

  return <div>...</div>;
}
```

#### B. usePageFocusManager
페이지 레벨에서 포커스 이벤트 감지 및 자동 수정

```javascript
import { usePageFocusManager } from '../hooks/useFocusCleanup';

function MyPage() {
  usePageFocusManager();

  return <div>...</div>;
}
```

---

### 3. 컴포넌트 레벨

#### A. AccessibleModal (components/AccessibleModal.jsx)

기존 MUI Modal을 대체하는 접근성 향상 버전

**변경 전:**
```javascript
import { Modal } from '@mui/material';

<Modal open={open} onClose={onClose}>
  {children}
</Modal>
```

**변경 후:**
```javascript
import { AccessibleModal } from '../components';

<AccessibleModal
  open={open}
  onClose={onClose}
  restoreFocus={true} // 이전 포커스 복원
>
  {children}
</AccessibleModal>
```

#### B. AccessibleDrawer (components/AccessibleDrawer.jsx)

기존 MUI Drawer를 대체하는 접근성 향상 버전

**변경 전:**
```javascript
import { Drawer } from '@mui/material';

<Drawer open={open} onClose={onClose}>
  {children}
</Drawer>
```

**변경 후:**
```javascript
import { AccessibleDrawer } from '../components';

<AccessibleDrawer open={open} onClose={onClose}>
  {children}
</AccessibleDrawer>
```

---

### 4. 레이아웃 레벨 (layouts/DashboardLayout.jsx)

DashboardLayout에 자동 포커스 관리 적용됨:

```javascript
import { useFocusCleanup, usePageFocusManager } from '../hooks/useFocusCleanup';
import { fixAriaHiddenConflict } from '../utils/focusManager';

const DashboardLayout = ({ children, role, title, activePage }) => {
  // 포커스 관리 훅 적용
  useFocusCleanup(true);
  usePageFocusManager();

  // 라우트 변경 시 포커스 정리
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fixAriaHiddenConflict();
    }, 100);
    return () => clearTimeout(timeoutId);
  }, [location.pathname]);

  // ...
};
```

---

## 적용 가이드

### 신규 페이지 작성 시

```javascript
import React from 'react';
import { useFocusCleanup } from '../hooks/useFocusCleanup';

const NewPage = () => {
  // 1. 포커스 정리 훅 추가
  useFocusCleanup(true);

  return (
    <div>
      {/* 페이지 내용 */}
    </div>
  );
};

export default NewPage;
```

### Modal/Dialog 사용 시

```javascript
import React, { useState } from 'react';
import { AccessibleModal } from '../components';
import { Button, Box } from '@mui/material';

const MyComponent = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Open Modal</Button>

      <AccessibleModal
        open={open}
        onClose={() => setOpen(false)}
        restoreFocus={true}
      >
        <Box sx={{ p: 4, bgcolor: 'background.paper', borderRadius: 2 }}>
          <h2>Modal Title</h2>
          <Button onClick={() => setOpen(false)}>Close</Button>
        </Box>
      </AccessibleModal>
    </>
  );
};
```

### 기존 Modal 마이그레이션

**Step 1:** Import 변경
```javascript
// 변경 전
import { Modal } from '@mui/material';

// 변경 후
import { AccessibleModal } from '../components';
```

**Step 2:** 컴포넌트 이름 변경
```javascript
// 변경 전
<Modal open={open} onClose={handleClose}>

// 변경 후
<AccessibleModal open={open} onClose={handleClose}>
```

---

## 개발 모드 디버깅

### 포커스 모니터링 활성화

`App.jsx`나 최상위 컴포넌트에서:

```javascript
import { useEffect } from 'react';
import { startFocusMonitoring } from './utils/focusManager';

function App() {
  useEffect(() => {
    // 개발 모드에서만 1초마다 포커스 충돌 감지
    const cleanup = startFocusMonitoring(1000);
    return cleanup;
  }, []);

  return <div>...</div>;
}
```

### 콘솔 로그 확인

정상 작동 시:
```
[FocusManager] Blurring element: <button>...</button>
[Page] Fixed aria-hidden conflict on mount
```

충돌 감지 시:
```
[FocusManager] ⚠️ aria-hidden conflict detected!
Active element: <button>...</button>
Parent with aria-hidden: <div aria-hidden="true">...</div>
```

---

## 체크리스트

### 페이지 작성 시
- [ ] `useFocusCleanup()` 또는 `usePageFocusManager()` 추가
- [ ] Modal/Dialog는 `AccessibleModal` 사용
- [ ] Drawer는 `AccessibleDrawer` 사용
- [ ] useEffect cleanup에서 포커스 정리

### Modal/Dialog 작성 시
- [ ] `AccessibleModal` 컴포넌트 사용
- [ ] `restoreFocus` prop 설정 (기본값 true)
- [ ] onClose 핸들러에서 추가 작업 시 `safeBlur()` 호출

### 컴포넌트 언마운트 시
- [ ] useEffect cleanup에서 `safeBlur()` 호출
- [ ] 동적으로 생성/제거되는 요소 포커스 관리

---

## 추가 권장사항

### 1. 키보드 네비게이션 테스트
Tab 키로 모든 인터랙티브 요소 접근 가능한지 확인

### 2. 스크린 리더 테스트
NVDA, JAWS 등으로 포커스 흐름 확인

### 3. 접근성 자동 테스트
```bash
npm install --save-dev @axe-core/react
```

### 4. Chrome DevTools Accessibility
Elements 탭 > Accessibility 패널에서 ARIA 속성 확인

---

## 문제 발생 시 디버깅

### 1. 콘솔 로그 확인
```javascript
console.log('Active element:', document.activeElement);
console.log('Has aria-hidden parent:', hasAriaHiddenAncestor(document.activeElement));
```

### 2. 수동 수정
```javascript
import { fixAriaHiddenConflict } from '../utils/focusManager';

// 특정 액션 후 즉시 호출
handleSomeAction = () => {
  // ... your code
  setTimeout(() => fixAriaHiddenConflict(), 100);
};
```

### 3. 포커스 복원이 필요 없는 경우
```javascript
<AccessibleModal
  open={open}
  onClose={onClose}
  restoreFocus={false} // 포커스 복원 비활성화
>
  {children}
</AccessibleModal>
```

---

## 참고 자료

- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [MUI Accessibility](https://mui.com/material-ui/guides/accessibility/)
- [MDN: Using the inert attribute](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/inert)
- [WebAIM: Keyboard Accessibility](https://webaim.org/techniques/keyboard/)

---

## 마이그레이션 우선순위

### High Priority (즉시 적용)
1. ✅ `DashboardLayout.jsx` - 완료
2. Modal/Dialog가 있는 모든 페이지
3. 페이지 전환이 빈번한 컴포넌트

### Medium Priority
1. Drawer/Sidebar 컴포넌트
2. 동적으로 생성/제거되는 컴포넌트
3. 복잡한 폼 페이지

### Low Priority
1. 정적 페이지
2. 단순 표시용 컴포넌트
3. 포커스가 거의 없는 페이지

---

## 향후 개선 사항

1. **자동 테스트 추가**
   - Cypress/Playwright로 포커스 흐름 테스트
   - 접근성 자동 검증 스크립트

2. **ESLint 플러그인**
   - aria-hidden 사용 시 경고
   - AccessibleModal/Drawer 사용 권장

3. **타입스크립트 지원**
   - 유틸리티 함수 타입 정의
   - Props 타입 안정성 향상

---

**작성일:** 2025-12-05
**버전:** 1.0.0
**작성자:** Claude Code AI Assistant
