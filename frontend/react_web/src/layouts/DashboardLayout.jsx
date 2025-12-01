import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const DashboardLayout = ({ children, role, title, activePage }) => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const currentTime = new Date();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Role-based Navigation Items
    const getNavItems = () => {
        const commonItems = [
            { icon: '📊', path: `/${role.toLowerCase()}/dashboard`, title: 'Dashboard', id: 'dashboard' },
        ];

        if (role === 'DOCTOR') {
            return [
                ...commonItems,
                { icon: '👥', path: '/patients', title: 'Patients', id: 'patients' },
                { icon: '📅', path: '/appointments', title: 'Schedule', id: 'appointments' },
                { icon: '⚙️', path: '#', title: 'Settings', id: 'settings', onClick: () => alert('Settings coming soon') },
            ];
        }
        if (role === 'ADMIN') {
            return [
                ...commonItems,
                { icon: '👥', path: '/admin/users', title: 'Users', id: 'users' },
                { icon: '⚙️', path: '/admin/settings', title: 'Settings', id: 'settings' },
                // Debug/Role Switcher Links
                { icon: '👨‍⚕️', path: '/doctor/dashboard', title: 'View as Doctor', id: 'view_doctor' },
                { icon: '👩‍⚕️', path: '/staff/dashboard', title: 'View as Nurse', id: 'view_nurse' },
                { icon: '🏥', path: '/patient/dashboard', title: 'View as Patient', id: 'view_patient' },
            ];
        }
        if (role === 'NURSE') { // Staff
            return [
                ...commonItems,
                { icon: '👥', path: '/patients', title: 'Patients', id: 'patients' },
                { icon: '📝', path: '/forms', title: 'Forms', id: 'forms' },
            ];
        }
        if (role === 'PATIENT') {
            return [
                ...commonItems,
                { icon: '📅', path: '/appointments', title: 'My Appointments', id: 'appointments' },
                { icon: '💊', path: '/prescriptions', title: 'My Prescriptions', id: 'prescriptions' },
            ];
        }

        return commonItems;
    };

    const navItems = getNavItems();

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
                            {title || (
                                <>
                                    Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'},
                                    <span style={styles.nameHighlight}> {user?.last_name || user?.username}</span>
                                </>
                            )}
                        </h1>
                        <p style={styles.dateDisplay}>
                            {currentTime.toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div style={styles.headerRight}>
                        <div style={styles.searchBar}>
                            <span style={styles.searchIcon}>🔍</span>
                            <input type="text" placeholder="Search..." style={styles.searchInput} />
                        </div>
                        <div style={styles.notificationBtn} onClick={() => navigate('/notifications')}>
                            🔔<span style={styles.badge}>3</span>
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
