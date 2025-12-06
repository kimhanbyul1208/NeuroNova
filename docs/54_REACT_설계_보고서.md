# React 설계 보고서

## 📋 목차
1. [React 설계 철학](#react-설계-철학)
2. [프로젝트 적용 사례](#프로젝트-적용-사례)
3. [설계 고려사항](#설계-고려사항)
4. [컴포넌트 설계 원칙](#컴포넌트-설계-원칙)
5. [상태 관리 전략](#상태-관리-전략)
6. [성능 최적화](#성능-최적화)
7. [접근성 (a11y)](#접근성-a11y)
8. [코드 품질 및 유지보수성](#코드-품질-및-유지보수성)
9. [향후 개선 방향](#향후-개선-방향)

---

## React 설계 철학

### 1. 선언적 (Declarative)
React는 **선언적 프로그래밍 패러다임**을 채택합니다.

```jsx
// ❌ 명령적 방식 (Imperative)
const container = document.getElementById('root');
const button = document.createElement('button');
button.innerText = 'Click me';
button.addEventListener('click', handleClick);
container.appendChild(button);

// ✅ 선언적 방식 (Declarative)
function MyComponent() {
    return <button onClick={handleClick}>Click me</button>;
}
```

**장점:**
- 코드의 의도를 명확하게 표현
- 복잡한 UI 상태 관리 용이
- 예측 가능한 동작

### 2. 컴포넌트 기반 (Component-Based)
UI를 **독립적이고 재사용 가능한 컴포넌트**로 분리합니다.

```jsx
// 단일 책임 원칙 (Single Responsibility Principle)
<AdminUsersPage>
  <RoleFilter />
  <UserSearchBar />
  <UserTable />
  <UserEditDialog />
</AdminUsersPage>
```

### 3. 단방향 데이터 흐름 (Unidirectional Data Flow)
데이터는 **부모에서 자식으로** 한 방향으로만 흐릅니다.

```jsx
// Props Down, Events Up
<UserTable
    users={users}              // 데이터 ↓
    onEdit={handleEdit}        // 이벤트 ↑
    onDelete={handleDelete}    // 이벤트 ↑
/>
```

### 4. Learn Once, Write Anywhere
React의 핵심 개념을 한 번 배우면 **웹, 모바일, 데스크톱** 등 다양한 플랫폼에 적용 가능합니다.

---

## 프로젝트 적용 사례

### AdminUsersPage 리팩토링 사례

#### Before (611줄)
```jsx
const AdminUsersPage = () => {
    // 600줄 이상의 코드
    // - 상태 관리
    // - API 호출
    // - UI 렌더링
    // - 비즈니스 로직
    // 모든 것이 한 파일에...
}
```

#### After (192줄, 68% 감소)
```jsx
const AdminUsersPage = () => {
    // 커스텀 훅으로 로직 분리
    const { users, loading, handleSearch, ... } = useUserManagement();

    return (
        <DashboardLayout>
            <RoleFilter />           {/* 역할 필터 */}
            <UserSearchBar />        {/* 검색 바 */}
            <UserTable />            {/* 테이블 */}
            <UserEditDialog />       {/* 수정 다이얼로그 */}
        </DashboardLayout>
    );
}
```

#### 설계 개선 효과
- **가독성 향상**: 각 컴포넌트의 역할이 명확
- **재사용성**: 다른 페이지에서도 컴포넌트 재사용 가능
- **테스트 용이성**: 각 컴포넌트를 독립적으로 테스트
- **유지보수성**: 버그 수정 및 기능 추가 간편

---

## 설계 고려사항

### 1. 관심사의 분리 (Separation of Concerns)

#### 1.1 상수 분리
```javascript
// utils/userManagementConstants.js
export const USER_ROLES = {
    ADMIN: 'ADMIN',
    DOCTOR: 'DOCTOR',
    NURSE: 'NURSE',
    PATIENT: 'PATIENT'
};

export const ROLE_LABELS = {
    ADMIN: '관리자',
    DOCTOR: '의사',
    NURSE: '간호사',
    PATIENT: '환자'
};
```

**이점:**
- 중앙 집중식 관리
- 수정 시 한 곳만 변경
- 일관성 유지

#### 1.2 비즈니스 로직 분리 (커스텀 훅)
```javascript
// hooks/useUserManagement.js
export const useUserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchUsers = async () => { /* ... */ };
    const updateUser = async (userId, data) => { /* ... */ };

    return { users, loading, fetchUsers, updateUser };
};
```

**이점:**
- UI와 로직 분리
- 재사용 가능
- 테스트 용이

#### 1.3 UI 컴포넌트 분리
```jsx
// components/admin/UserTable.jsx
const UserTable = ({ users, onEdit, onDelete }) => {
    return (
        <Table>
            {users.map(user => (
                <UserRow key={user.id} user={user} />
            ))}
        </Table>
    );
};
```

**이점:**
- 단일 책임 원칙
- 재사용성
- 독립적 개발/테스트

### 2. 컴포넌트 계층 구조

```
src/
├── pages/                      # 페이지 컴포넌트 (라우트)
│   └── admin/
│       └── AdminUsersPage.jsx  # 최상위 컴포넌트
├── components/                 # 재사용 가능한 컴포넌트
│   ├── admin/                  # 도메인별 컴포넌트
│   │   ├── RoleFilter.jsx
│   │   ├── UserSearchBar.jsx
│   │   ├── UserTable.jsx
│   │   ├── UserTableSkeleton.jsx
│   │   ├── UserEditDialog.jsx
│   │   └── UserDeleteDialog.jsx
│   └── common/                 # 공통 컴포넌트
│       ├── LoadingSpinner.jsx
│       └── ErrorAlert.jsx
├── hooks/                      # 커스텀 훅
│   ├── useUserManagement.js
│   └── useFocusCleanup.js
└── utils/                      # 유틸리티 & 상수
    ├── userManagementConstants.js
    └── config.js
```

### 3. Props와 상태 관리

#### 3.1 Props 설계 원칙
```jsx
// ✅ Good: 명확하고 구체적인 Props
<UserTable
    users={users}
    onEdit={handleEdit}
    onDelete={handleDelete}
    onActivate={handleActivate}
    onDeactivate={handleDeactivate}
/>

// ❌ Bad: 불명확한 Props
<UserTable
    data={data}
    onChange={handleChange}
/>
```

#### 3.2 상태 위치 결정
```jsx
// 원칙: 상태는 가능한 한 사용하는 곳에 가깝게

// ✅ 로컬 상태: 한 컴포넌트에서만 사용
const [isOpen, setIsOpen] = useState(false);

// ✅ 끌어올린 상태: 여러 컴포넌트에서 공유
const [users, setUsers] = useState([]);

// ✅ 전역 상태: Context API, Redux 등
const { user, isAuthenticated } = useAuth();
```

---

## 컴포넌트 설계 원칙

### 1. 단일 책임 원칙 (Single Responsibility Principle)

```jsx
// ✅ Good: 각 컴포넌트가 하나의 역할만 수행
function UserSearchBar({ searchTerm, onSearch }) {
    return (
        <Box>
            <TextField value={searchTerm} />
            <Button onClick={onSearch}>검색</Button>
        </Box>
    );
}

function RoleFilter({ selectedRoles, onToggle }) {
    return (
        <FormGroup>
            {roles.map(role => (
                <Checkbox checked={selectedRoles.includes(role)} />
            ))}
        </FormGroup>
    );
}

// ❌ Bad: 하나의 컴포넌트가 너무 많은 역할
function SearchAndFilter() {
    // 검색 + 필터 + 정렬 + ...
    // 600줄의 코드...
}
```

### 2. 컴포지션 (Composition)

```jsx
// 상속보다 컴포지션을 선호
function UserManagementPage() {
    return (
        <DashboardLayout>
            <PageHeader title="사용자 관리" />
            <FilterSection>
                <RoleFilter />
                <UserSearchBar />
            </FilterSection>
            <DataSection>
                <UserTable />
                <Pagination />
            </DataSection>
        </DashboardLayout>
    );
}
```

### 3. Props 타입 검증

```jsx
import PropTypes from 'prop-types';

UserTable.propTypes = {
    users: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string.isRequired,
        email: PropTypes.string,
        is_active: PropTypes.bool.isRequired
    })).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired
};
```

**이점:**
- 런타임 타입 체크
- 개발 중 경고 메시지
- 문서화 효과

### 4. Presentational vs Container 패턴

```jsx
// Presentational Component (UI만 담당)
function UserTableView({ users, onEdit, onDelete }) {
    return (
        <Table>
            {users.map(user => (
                <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                        <IconButton onClick={() => onEdit(user)}>
                            <EditIcon />
                        </IconButton>
                    </TableCell>
                </TableRow>
            ))}
        </Table>
    );
}

// Container Component (로직 담당)
function UserTableContainer() {
    const { users, loading } = useUserManagement();
    const handleEdit = (user) => { /* 비즈니스 로직 */ };

    if (loading) return <Skeleton />;

    return <UserTableView users={users} onEdit={handleEdit} />;
}
```

---

## 상태 관리 전략

### 1. 상태 계층 구조

```
전역 상태 (Context API)
  ↓
  AuthContext - 사용자 인증 정보
  ThemeContext - 테마 설정

페이지 상태 (Custom Hooks)
  ↓
  useUserManagement - 사용자 목록, 검색, 필터

로컬 상태 (useState)
  ↓
  Dialog 열림/닫힘
  Form 입력값
```

### 2. 커스텀 훅 활용

```javascript
// hooks/useUserManagement.js
export const useUserManagement = () => {
    // 상태
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 부수 효과
    useEffect(() => {
        fetchUsers();
    }, [page, filters]);

    // 액션
    const fetchUsers = async () => { /* ... */ };
    const updateUser = async (id, data) => { /* ... */ };
    const deleteUser = async (id) => { /* ... */ };

    // 반환
    return {
        users,
        loading,
        error,
        fetchUsers,
        updateUser,
        deleteUser
    };
};
```

**장점:**
- 로직 재사용
- 테스트 용이
- 관심사 분리

### 3. 상태 초기화 및 정리

```javascript
export const useFocusCleanup = () => {
    useEffect(() => {
        // 컴포넌트 마운트 시
        return () => {
            // 컴포넌트 언마운트 시 정리
            // 메모리 누수 방지
        };
    }, []);
};
```

---

## 성능 최적화

### 1. React.memo - 불필요한 리렌더링 방지

```jsx
// 부모 컴포넌트가 리렌더링되어도
// props가 변경되지 않으면 리렌더링 방지
const UserTableRow = React.memo(({ user, onEdit, onDelete }) => {
    return (
        <TableRow>
            <TableCell>{user.username}</TableCell>
            {/* ... */}
        </TableRow>
    );
});
```

### 2. useCallback - 함수 메모이제이션

```jsx
const UserTable = ({ users }) => {
    // ✅ Good: 함수를 메모이제이션하여 자식 컴포넌트 리렌더링 방지
    const getRoleLabel = useCallback((role) => {
        return ROLE_LABELS[role] || role;
    }, []);

    const getRoleColor = useCallback((role) => {
        return ROLE_COLORS[role] || 'default';
    }, []);

    return (
        <Table>
            {users.map(user => (
                <UserRow
                    key={user.id}
                    user={user}
                    getRoleLabel={getRoleLabel}
                    getRoleColor={getRoleColor}
                />
            ))}
        </Table>
    );
};
```

### 3. useMemo - 계산 비용이 큰 연산 메모이제이션

```jsx
const UserList = ({ users, filters }) => {
    // ✅ Good: 필터링 결과를 메모이제이션
    const filteredUsers = useMemo(() => {
        return users.filter(user => {
            return filters.roles.includes(user.role) &&
                   user.username.includes(filters.search);
        });
    }, [users, filters]);

    return <UserTable users={filteredUsers} />;
};
```

### 4. 코드 분할 (Code Splitting)

```jsx
import React, { lazy, Suspense } from 'react';

// 지연 로딩으로 초기 번들 크기 감소
const AdminUsersPage = lazy(() => import('./pages/admin/AdminUsersPage'));
const UserEditDialog = lazy(() => import('./components/admin/UserEditDialog'));

function App() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <AdminUsersPage />
        </Suspense>
    );
}
```

### 5. 가상 스크롤 (Virtual Scrolling)

```jsx
// 대량의 데이터를 렌더링할 때 성능 최적화
import { FixedSizeList } from 'react-window';

function LargeUserList({ users }) {
    return (
        <FixedSizeList
            height={600}
            itemCount={users.length}
            itemSize={50}
        >
            {({ index, style }) => (
                <div style={style}>
                    <UserRow user={users[index]} />
                </div>
            )}
        </FixedSizeList>
    );
}
```

---

## 접근성 (a11y)

### 1. 시맨틱 HTML과 ARIA 속성

```jsx
// ✅ Good: 시맨틱 요소와 ARIA 속성 사용
<Box
    role="search"
    aria-label="사용자 검색"
>
    <TextField
        aria-label="사용자 검색어 입력"
        aria-describedby="search-help-text"
    />
    <Button aria-label="검색 실행">
        검색
    </Button>
</Box>

<Paper
    role="region"
    aria-label="사용자 권한 필터"
>
    <Typography id="role-filter-label">
        권한 필터
    </Typography>
    <FormGroup aria-labelledby="role-filter-label">
        {/* ... */}
    </FormGroup>
</Paper>
```

### 2. 키보드 네비게이션

```jsx
function UserSearchBar({ onSearch }) {
    const handleKeyDown = (e) => {
        // Enter 키로 검색 실행
        if (e.key === 'Enter') {
            onSearch();
        }
    };

    return (
        <TextField
            onKeyDown={handleKeyDown}
            inputProps={{ tabIndex: 0 }}
        />
    );
}
```

### 3. 포커스 관리

```jsx
function UserEditDialog({ open, onClose }) {
    const firstInputRef = useRef(null);

    useEffect(() => {
        if (open) {
            // 다이얼로그 열릴 때 첫 번째 입력 필드에 포커스
            firstInputRef.current?.focus();
        }
    }, [open]);

    return (
        <Dialog open={open}>
            <TextField ref={firstInputRef} />
        </Dialog>
    );
}
```

### 4. 스크린 리더 지원

```jsx
// 로딩 상태 알림
{loading && (
    <div role="status" aria-live="polite">
        사용자 목록을 불러오는 중입니다...
    </div>
)}

// 에러 알림
{error && (
    <Alert role="alert" aria-live="assertive">
        {error}
    </Alert>
)}
```

---

## 코드 품질 및 유지보수성

### 1. 네이밍 컨벤션

```jsx
// ✅ Good: 명확하고 일관된 네이밍
const UserTable = () => { /* ... */ };
const useUserManagement = () => { /* ... */ };
const handleEditUser = () => { /* ... */ };

// Component: PascalCase
// Hook: use + PascalCase
// Handler: handle + PascalCase
// Boolean: is/has + PascalCase
```

### 2. 파일 구조

```
components/admin/
├── UserTable.jsx           # 컴포넌트
├── UserTableSkeleton.jsx   # 로딩 상태
├── UserEditDialog.jsx      # 관련 컴포넌트
├── index.js                # Export 모듈
└── __tests__/              # 테스트 파일
    └── UserTable.test.jsx
```

### 3. CSS/클래스 관리

```jsx
// ✅ Good: 의미 있는 className으로 스타일링 및 테스트 용이
<Table className="user-table">
    <TableRow className={`user-table-row user-row-${user.id}`}>
        <TableCell className="user-cell-username">
            {user.username}
        </TableCell>
        <TableCell className="user-cell-actions">
            <IconButton className="user-action-edit">
                <EditIcon />
            </IconButton>
        </TableCell>
    </TableRow>
</Table>
```

**이점:**
- CSS 선택자로 스타일 적용 용이
- E2E 테스트에서 요소 찾기 쉬움
- 디버깅 편리

### 4. 주석과 문서화

```jsx
/**
 * 사용자 테이블 컴포넌트
 * 사용자 목록을 테이블 형태로 표시하고 CRUD 작업을 지원합니다.
 *
 * @param {Array} users - 표시할 사용자 목록
 * @param {Function} onEdit - 사용자 수정 핸들러
 * @param {Function} onDelete - 사용자 삭제 핸들러
 * @param {Function} onActivate - 사용자 활성화 핸들러
 * @param {Function} onDeactivate - 사용자 비활성화 핸들러
 */
const UserTable = ({ users, onEdit, onDelete, onActivate, onDeactivate }) => {
    // ...
};
```

### 5. 에러 처리 및 방지 전략

#### 5.1 컴포넌트 레벨 에러 바운더리

```jsx
// 컴포넌트 레벨 에러 바운더리
class ErrorBoundary extends React.Component {
    state = { hasError: false, error: null };

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // 에러 로깅 서비스로 전송 (예: Sentry)
        console.error('Error caught:', error, errorInfo);
        // logErrorToService(error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return <ErrorFallback error={this.state.error} />;
        }
        return this.props.children;
    }
}

// 사용
<ErrorBoundary>
    <AdminUsersPage />
</ErrorBoundary>
```

#### 5.2 API 호출 에러 처리

```jsx
// hooks/useUserManagement.js
const fetchUsers = async () => {
    try {
        setLoading(true);
        setError(null); // 이전 에러 초기화

        const response = await axiosClient.get(API_ENDPOINTS.USERS, { params });
        setUsers(response.data.results);

    } catch (err) {
        console.error('Error fetching users:', err);

        // 구체적인 에러 메시지 처리
        if (err.response?.status === 403) {
            setError('권한이 없습니다. 관리자 계정으로 로그인해주세요.');
        } else if (err.response?.status === 404) {
            setError('사용자를 찾을 수 없습니다.');
        } else if (err.response?.status === 500) {
            setError('서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
        } else if (err.code === 'ECONNABORTED') {
            setError('요청 시간이 초과되었습니다. 네트워크를 확인해주세요.');
        } else {
            setError(err.response?.data?.detail || '사용자 목록을 불러오는데 실패했습니다.');
        }
    } finally {
        setLoading(false);
    }
};
```

#### 5.3 Null/Undefined 방지

```jsx
// ✅ Good: 옵셔널 체이닝과 기본값 사용
const UserTable = ({ users = [] }) => {
    return (
        <Table>
            {users.map(user => (
                <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email || 'N/A'}</TableCell>
                    <TableCell>{user.profile?.department || '-'}</TableCell>
                </TableRow>
            ))}
        </Table>
    );
};

// ❌ Bad: 에러 발생 가능
const UserTable = ({ users }) => {
    return (
        <Table>
            {users.map(user => (  // users가 undefined면 에러!
                <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>{user.email}</TableCell>  // null이면 빈 칸
                    <TableCell>{user.profile.department}</TableCell>  // profile이 null이면 에러!
                </TableRow>
            ))}
        </Table>
    );
};
```

#### 5.4 조건부 렌더링으로 에러 방지

```jsx
// ✅ Good: 데이터 검증 후 렌더링
function UserDetail({ userId }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    if (loading) return <Skeleton />;
    if (error) return <Alert severity="error">{error}</Alert>;
    if (!user) return <Alert severity="info">사용자를 찾을 수 없습니다.</Alert>;

    return (
        <Card>
            <Typography>{user.username}</Typography>
            <Typography>{user.email}</Typography>
        </Card>
    );
}
```

#### 5.5 Input 검증

```jsx
// ✅ Good: 입력값 검증
const UserEditDialog = ({ user, onSave }) => {
    const [formData, setFormData] = useState({
        email: '',
        roles: []
    });
    const [validationErrors, setValidationErrors] = useState({});

    const validateForm = () => {
        const errors = {};

        // 이메일 검증
        if (!formData.email) {
            errors.email = '이메일은 필수입니다.';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = '유효한 이메일 형식이 아닙니다.';
        }

        // 역할 검증
        if (formData.roles.length === 0) {
            errors.roles = '최소 1개 이상의 역할을 선택해주세요.';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = () => {
        if (validateForm()) {
            onSave(user.id, formData);
        }
    };

    return (
        <Dialog open>
            <TextField
                label="이메일"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!validationErrors.email}
                helperText={validationErrors.email}
            />
            <Button onClick={handleSave}>저장</Button>
        </Dialog>
    );
};
```

#### 5.6 비동기 작업 중 컴포넌트 언마운트 방지

```jsx
// ✅ Good: cleanup으로 메모리 누수 방지
function UserList() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let isMounted = true; // 마운트 상태 추적

        const fetchUsers = async () => {
            setLoading(true);
            try {
                const response = await api.getUsers();
                if (isMounted) {  // 마운트된 경우에만 상태 업데이트
                    setUsers(response.data);
                }
            } catch (err) {
                if (isMounted) {
                    setError(err.message);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchUsers();

        return () => {
            isMounted = false; // cleanup: 언마운트 시 플래그 변경
        };
    }, []);

    return <Table data={users} />;
}
```

#### 5.7 Key Prop 누락 방지

```jsx
// ✅ Good: 고유한 key 사용
{users.map(user => (
    <UserRow key={user.id} user={user} />
))}

// ❌ Bad: index를 key로 사용 (재정렬 시 문제)
{users.map((user, index) => (
    <UserRow key={index} user={user} />
))}

// ❌ Bad: key 누락 (Warning 발생)
{users.map(user => (
    <UserRow user={user} />
))}
```

#### 5.8 이벤트 핸들러 바인딩 에러 방지

```jsx
// ✅ Good: 화살표 함수 또는 useCallback 사용
function UserList({ onEdit, onDelete }) {
    const handleEdit = useCallback((user) => {
        onEdit(user);
    }, [onEdit]);

    return (
        <Table>
            {users.map(user => (
                <IconButton onClick={() => handleEdit(user)}>
                    <EditIcon />
                </IconButton>
            ))}
        </Table>
    );
}

// ❌ Bad: 직접 호출 (즉시 실행됨!)
<IconButton onClick={handleEdit(user)}>
    <EditIcon />
</IconButton>
```

#### 5.9 환경 변수 누락 방지

```jsx
// ✅ Good: 환경 변수 검증
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

if (!API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL is not defined. Please check your .env file.');
}

// config.js에서 중앙 관리
export const config = {
    apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
    apiTimeout: parseInt(import.meta.env.VITE_API_TIMEOUT) || 10000,
};
```

#### 5.10 에러 로깅 및 모니터링

```jsx
// utils/errorLogger.js
export const logError = (error, errorInfo) => {
    // 개발 환경: 콘솔 출력
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', error);
        console.error('Error Info:', errorInfo);
    }

    // 프로덕션 환경: 에러 추적 서비스로 전송
    if (process.env.NODE_ENV === 'production') {
        // Sentry.captureException(error, { extra: errorInfo });
    }
};

// ErrorBoundary에서 사용
componentDidCatch(error, errorInfo) {
    logError(error, errorInfo);
}
```

### 6. 로딩 상태 UX

```jsx
// ✅ Good: 스켈레톤 UI로 로딩 상태 표시
{loading ? (
    <UserTableSkeleton rows={rowsPerPage} />
) : (
    <UserTable users={users} />
)}

// ❌ Bad: 단순 로딩 스피너
{loading ? <Spinner /> : <UserTable users={users} />}
```

---

## 향후 개선 방향

### 1. TypeScript 마이그레이션

```typescript
// PropTypes 대신 TypeScript 타입 정의
interface User {
    id: number;
    username: string;
    email: string;
    is_active: boolean;
    roles: UserRole[];
}

interface UserTableProps {
    users: User[];
    onEdit: (user: User) => void;
    onDelete: (user: User) => void;
}

const UserTable: React.FC<UserTableProps> = ({ users, onEdit, onDelete }) => {
    // 타입 안정성 향상
};
```

**이점:**
- 컴파일 타임 타입 체크
- IDE 자동완성 지원
- 리팩토링 안전성

### 2. 테스트 커버리지 확대

```jsx
// Unit Test
describe('UserTable', () => {
    it('renders user list correctly', () => {
        const users = [{ id: 1, username: 'test' }];
        render(<UserTable users={users} />);
        expect(screen.getByText('test')).toBeInTheDocument();
    });

    it('calls onEdit when edit button is clicked', () => {
        const onEdit = jest.fn();
        render(<UserTable users={users} onEdit={onEdit} />);
        fireEvent.click(screen.getByClassName('user-action-edit'));
        expect(onEdit).toHaveBeenCalledWith(users[0]);
    });
});

// Integration Test
describe('AdminUsersPage', () => {
    it('filters users by role', async () => {
        render(<AdminUsersPage />);
        fireEvent.click(screen.getByClassName('role-checkbox-doctor'));
        fireEvent.click(screen.getByClassName('user-search-button'));
        await waitFor(() => {
            expect(screen.getAllByClassName('user-table-row')).toHaveLength(5);
        });
    });
});
```

### 3. 상태 관리 라이브러리 도입

```javascript
// Redux Toolkit, Zustand, Jotai 등 고려
import { create } from 'zustand';

const useUserStore = create((set) => ({
    users: [],
    loading: false,
    fetchUsers: async () => {
        set({ loading: true });
        const users = await api.getUsers();
        set({ users, loading: false });
    }
}));

// 사용
function AdminUsersPage() {
    const { users, loading, fetchUsers } = useUserStore();
    // ...
}
```

### 4. 성능 모니터링

```jsx
import { Profiler } from 'react';

<Profiler id="UserTable" onRender={onRenderCallback}>
    <UserTable users={users} />
</Profiler>

function onRenderCallback(id, phase, actualDuration) {
    console.log(`${id} took ${actualDuration}ms to render`);
}
```

### 5. 국제화 (i18n)

```jsx
import { useTranslation } from 'react-i18next';

function UserTable() {
    const { t } = useTranslation();

    return (
        <Table>
            <TableHead>
                <TableCell>{t('user.username')}</TableCell>
                <TableCell>{t('user.email')}</TableCell>
            </TableHead>
        </Table>
    );
}
```

### 6. Storybook 도입

```jsx
// UserTable.stories.jsx
export default {
    title: 'Admin/UserTable',
    component: UserTable,
};

export const Default = () => (
    <UserTable users={mockUsers} onEdit={() => {}} />
);

export const Loading = () => (
    <UserTableSkeleton rows={5} />
);

export const Empty = () => (
    <UserTable users={[]} />
);
```

---

## 결론

### 핵심 설계 원칙 요약

1. **컴포넌트 분리**: 단일 책임 원칙을 따라 작고 집중된 컴포넌트 작성
2. **관심사 분리**: UI, 로직, 상태, 상수를 명확히 분리
3. **재사용성**: 범용적인 컴포넌트와 도메인 특화 컴포넌트 구분
4. **타입 안정성**: PropTypes로 타입 검증 (향후 TypeScript 전환)
5. **성능 최적화**: memo, useCallback, useMemo 적절히 활용
6. **접근성**: ARIA 속성, 키보드 네비게이션, 스크린 리더 지원
7. **유지보수성**: 명확한 네이밍, 일관된 구조, className으로 테스트 용이

### 프로젝트 적용 성과

- **코드 라인 수**: 611줄 → 192줄 (68% 감소)
- **컴포넌트 수**: 1개 → 6개 (재사용 가능한 모듈화)
- **파일 수**: 1개 → 9개 (관심사별 분리)
- **유지보수성**: 크게 향상 (독립적 수정 가능)
- **테스트 용이성**: 각 컴포넌트 단위 테스트 가능

### 향후 발전 방향

- TypeScript 마이그레이션
- 테스트 커버리지 확대
- Storybook 도입으로 컴포넌트 문서화
- 성능 모니터링 및 최적화
- 국제화(i18n) 지원

---

**작성일**: 2025-12-06
**프로젝트**: NeuroNova CDSS
**버전**: 1.0.0
