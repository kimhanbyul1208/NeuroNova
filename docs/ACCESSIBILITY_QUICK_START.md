# 접근성 Quick Start 가이드

## 🚀 즉시 적용 방법

### 1. 새 페이지 만들 때

```javascript
import { useFocusCleanup } from '../hooks/useFocusCleanup';

function NewPage() {
  useFocusCleanup(); // 이 한 줄 추가!

  return <div>Your page content</div>;
}
```

### 2. Modal 사용할 때

```javascript
// ❌ 기존 방식
import { Modal } from '@mui/material';
<Modal open={open} onClose={handleClose}>...</Modal>

// ✅ 새로운 방식
import { AccessibleModal } from '../components';
<AccessibleModal open={open} onClose={handleClose}>...</AccessibleModal>
```

### 3. Drawer 사용할 때

```javascript
// ❌ 기존 방식
import { Drawer } from '@mui/material';
<Drawer open={open} onClose={handleClose}>...</Drawer>

// ✅ 새로운 방식
import { AccessibleDrawer } from '../components';
<AccessibleDrawer open={open} onClose={handleClose}>...</AccessibleDrawer>
```

---

## 📋 체크리스트

새 페이지/컴포넌트 작성 시:

- [ ] `useFocusCleanup()` 추가했는가?
- [ ] Modal 대신 `AccessibleModal` 사용하는가?
- [ ] Drawer 대신 `AccessibleDrawer` 사용하는가?

---

## 🐛 오류 발생 시

### 오류: "Blocked aria-hidden on an element..."

**해결책 1:** 페이지에 훅 추가
```javascript
import { useFocusCleanup } from '../hooks/useFocusCleanup';

useFocusCleanup(); // 컴포넌트 최상단
```

**해결책 2:** Modal/Drawer 교체
```javascript
import { AccessibleModal, AccessibleDrawer } from '../components';
```

**해결책 3:** 수동 수정
```javascript
import { fixAriaHiddenConflict } from '../utils/focusManager';

// 문제 발생 지점 이후
setTimeout(() => fixAriaHiddenConflict(), 100);
```

---

## 📚 자세한 가이드

전체 전략과 상세 설명은 [FOCUS_MANAGEMENT_GUIDE.md](./FOCUS_MANAGEMENT_GUIDE.md) 참고

---

## ✅ 이미 적용된 곳

- ✅ DashboardLayout (모든 대시보드 페이지)
- ✅ 포커스 관리 유틸리티
- ✅ 접근성 향상 컴포넌트

---

**빠른 문의:** 오류 발생 시 콘솔에서 `[FocusManager]` 로그 확인
