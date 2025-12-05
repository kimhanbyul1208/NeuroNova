import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { useTranslation } from 'react-i18next'; // i18n 라이브러리 : 영문 타이틀 한글화 작업에 사용
import { useFocusCleanup, usePageFocusManager } from '../hooks/useFocusCleanup';
import { fixAriaHiddenConflict } from '../utils/focusManager';
import "./DashboardLayout.css";

const DashboardLayout = ({ children, role, title, activePage }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { t } = useTranslation(); // 영문 타이틀 한글화

    // 포커스 관리 훅 적용
    useFocusCleanup(true);
    usePageFocusManager();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // 라우트 변경 시 포커스 정리
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fixAriaHiddenConflict();
        }, 100); // MUI 애니메이션 대기

        return () => clearTimeout(timeoutId);
    }, [location.pathname]);


    // 역할별 사이드바 메뉴 구성
    const getNavItems = () => {
        // NURSE 역할은 staff/dashboard로 매핑
        const dashboardPath = role === 'NURSE' ? '/staff/dashboard' : `/${role.toLowerCase()}/dashboard`;

        const commonItems = [
            { icon: '📊', path: dashboardPath, title: t('Dashboard'), id: 'dashboard' },
        ];

        if (role === 'DOCTOR') {
            return [
                ...commonItems,
                { icon: '👥', path: '/patients', title: t('Patients'), id: 'patients' },
                { icon: '📅', path: '/appointments', title: t('Schedule'), id: 'appointments' },
                { icon: '⚙️', path: '#', title: 'Settings', id: t('settings'), onClick: () => alert('Settings coming soon') },
            ];
        }
        if (role === 'ADMIN') {
            return [
                ...commonItems,
                { icon: '👥', path: '/admin/users', title: t('Users'), id: 'users' },
                { icon: '⚙️', path: '/admin/settings', title: t('Settings'), id: 'settings' },
                // Debug/Role Switcher Links
                { icon: '👨‍⚕️', path: '/doctor/dashboard', title: t('View as Doctor'), id: 'view_doctor' },
                { icon: '👩‍⚕️', path: '/staff/dashboard', title: t('View as Nurse'), id: 'view_nurse' },
                { icon: '🏥', path: '/patient/dashboard', title: t('View as Patient'), id: 'view_patient' },
            ];
        }
        if (role === 'NURSE') { // Staff
            return [
                ...commonItems,
                { icon: '👥', path: '/patients', title: t('Patients'), id: 'patients' },
                { icon: '📝', path: '/forms', title: t('Forms'), id: 'forms' },
                { icon: '🤝', path: '/staff/doctor-patient-relations', title: t('Doctor-Patient Relations'), id: 'doctor-patient-relations' },
            ];
        }
        if (role === 'PATIENT') {
            return [
                ...commonItems,
                { icon: '📅', path: '/appointments', title: t('My Appointments'), id: 'appointments' },
                { icon: '💊', path: '/prescriptions', title: t('My Prescriptions'), id: 'prescriptions' },
            ];
        }

        return commonItems;
    };

    const navItems = getNavItems();

    // 날짜 & 시간 랜더링 코드 
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(new Date()); // 매초 새로운 시간으로 업데이트
        }, 1000);

        return () => clearInterval(timer); // 컴포넌트 언마운트 시 타이머 정리
    }, []);


    // 알림 기능 랜더링 코드 
    const [showNotifications, setShowNotifications] = useState(false);
    const closeDropdown = useRef(null);

    useEffect(() => {
        function handleClickOutside(event) {
            // 알림박스 영역 밖 클릭 시 닫기
            if (closeDropdown.current && !closeDropdown.current.contains(event.target)) {
                setShowNotifications(false);
                // 드롭다운 닫을 때 포커스 정리
                setTimeout(() => fixAriaHiddenConflict(), 50);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // todo : 샘플 알림 데이터 (나중에 API 연동 가능)
    const notifications = [
        { id: 1, text: '📅 오늘 오후 3시 회의' },
        { id: 2, text: '💊 처방전 업데이트' },
        { id: 3, text: '👥 새로운 환자 등록' },
    ];

    // Search functionality
    const [searchQuery, setSearchQuery] = useState('');

    const handleSearch = (e) => {
        if (e.key === 'Enter') {
            console.log('Search query:', searchQuery);
            // Placeholder for search logic
            // You can add a prop like onSearch(searchQuery) to pass this up if needed
            alert(`검색 기능은 아직 구현되지 않았습니다. 입력된 검색어: ${searchQuery}`);
        }
    };

    return (
        <div style={styles.container}>
            {/* Sidebar */}
            <nav style={styles.sidebar}>
                <div style={styles.logoArea}>
                    <div style={styles.logoIcon}>N</div>
                </div>
                <div style={styles.navItems}>
                    {navItems.map((item) => (
                        <div
                            key={item.id}
                            style={{
                                ...styles.navItem,
                                ...(activePage === item.id ? styles.activeNavItem : {})
                            }}
                            onClick={item.onClick || (() => navigate(item.path))}
                            title={item.title}
                        >
                            {item.icon}
                        </div>
                    ))}
                </div>
                <div style={styles.userAvatar} onClick={handleLogout} title="Logout">
                    {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                </div>
            </nav>

            {/* Main Content */}
            <main style={styles.mainContent}>
                {/* Header */}
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.greeting}>
                            {t(title) || (
                                <>
                                    {currentTime.getHours() < 12
                                        ? 'Good Morning'
                                        : currentTime.getHours() < 18
                                            ? 'Good Afternoon'
                                            : 'Good Evening'
                                    },
                                    <span style={styles.nameHighlight}>{user?.last_name || user?.username}</span>
                                </>
                            )}
                        </h1>
                        <p style={styles.dateDisplay}>
                            {currentTime.toLocaleDateString('ko-KR', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                            })}{' '}
                            {currentTime.toLocaleTimeString('ko-KR', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                            })}
                        </p>
                    </div>

                    <div className="headerRight" id="headerRight">
                        <div className="searchBar" id="searchBar">
                            <span className="searchIcon" id="searchIcon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search..."
                                className="searchInput"
                                id="searchInput"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
                            />
                        </div>

                        {/* 알림 버튼 */}
                        <div className="notificationWrapper" id="notificationWrapper" ref={closeDropdown}>
                            <div
                                className="notificationBtn"
                                id="notificationBtn"
                                onClick={() => setShowNotifications(!showNotifications)} // ✅ 토글
                            >
                                🔔<span className="badge" id="badge">{notifications.length}</span>
                            </div>

                            {/* 알림 드롭다운 */}
                            {showNotifications && (
                                <div className="notificationDropdown" id="notificationDropdown">
                                    <h4 className="dropdownTitle" id="dropdownTitle">알림</h4>
                                    <ul className="dropdownList" id="dropdownList">
                                        {notifications.map((n) => (
                                            <li key={n.id} className="dropdownItem" id={`dropdownItem-${n.id}`}>
                                                {n.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <div style={styles.contentArea}>
                    {children}
                </div>
            </main>
        </div>
    );
};

// Light Theme Styles
const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#f5f6fa', // Light background
        color: '#2f3542', // Dark text
        fontFamily: "'Inter', sans-serif",
        position: 'relative',
    },
    sidebar: {
        width: '80px',
        backgroundColor: '#ffffff', // White sidebar
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 0',
        borderRight: '1px solid #e1e1e1',
        boxShadow: '2px 0 10px rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 100,
        flexShrink: 0,
    },
    logoIcon: {
        width: '40px',
        height: '40px',
        borderRadius: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        fontSize: '1.2rem',
        marginBottom: '3rem',
        color: 'white',
    },
    navItems: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        flex: 1,
    },
    navItem: {
        width: '40px',
        height: '40px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        fontSize: '1.2rem',
        color: '#a4b0be',
        transition: 'all 0.2s',
        ':hover': { backgroundColor: '#f1f2f6', color: '#57606f' }
    },
    activeNavItem: {
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        color: '#667eea',
    },
    userAvatar: {
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        backgroundColor: '#764ba2',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 'bold',
        cursor: 'pointer',
        color: 'white',
    },
    mainContent: {
        flex: 1,
        padding: '2rem',
        // marginLeft: '80px', // Removed because sidebar is no longer fixed
        overflowY: 'auto',
        width: 'calc(100% - 80px)', // Ensure content takes remaining width
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: '2.5rem',
    },
    greeting: {
        fontSize: '2rem',
        fontWeight: '700',
        margin: 0,
        color: '#2f3542',
    },
    nameHighlight: {
        fontWeight: '300',
        color: '#57606f',
    },
    dateDisplay: {
        color: '#747d8c',
        margin: '0.5rem 0 0 0',
        fontSize: '0.95rem',
    },
    headerRight: {
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
    },
    searchBar: {
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#ffffff',
        padding: '0.6rem 1rem',
        borderRadius: '12px',
        border: '1px solid #e1e1e1',
        width: '250px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
    },
    searchIcon: {
        marginRight: '0.5rem',
        opacity: 0.5,
        color: '#2f3542',
    },
    searchInput: {
        background: 'none',
        border: 'none',
        color: '#2f3542',
        width: '100%',
        outline: 'none',
        fontSize: '0.9rem',
    },
    notificationBtn: {
        position: 'relative',
        fontSize: '1.2rem',
        cursor: 'pointer',
        padding: '0.5rem',
        backgroundColor: '#ffffff',
        borderRadius: '10px',
        border: '1px solid #e1e1e1',
        boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
    },
    badge: {
        position: 'absolute',
        top: '-2px',
        right: '-2px',
        backgroundColor: '#ff6b6b',
        color: 'white',
        fontSize: '0.7rem',
        padding: '2px 5px',
        borderRadius: '10px',
        fontWeight: 'bold',
    },
    contentArea: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
    }
};

export default DashboardLayout;
