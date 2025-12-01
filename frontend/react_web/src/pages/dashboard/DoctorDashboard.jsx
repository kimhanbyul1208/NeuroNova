import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const DoctorDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);

        // Mock data fetch
        setTimeout(() => {
            setAppointments([
                { id: 1, time: '09:00', patient: '홍길동', type: '초진', status: '대기중', gender: 'M', age: 45 },
                { id: 2, time: '10:30', patient: '김영희', type: '재진', status: '예약', gender: 'F', age: 32 },
                { id: 3, time: '14:00', patient: '이철수', type: '검사결과', status: '예약', gender: 'M', age: 58 },
                { id: 4, time: '15:30', patient: '박지민', type: '수술상담', status: '예약', gender: 'F', age: 29 },
            ]);
            setLoading(false);
        }, 1000);

        return () => clearInterval(timer);
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div style={styles.container}>
            {/* Sidebar / Navigation (Simplified for Dashboard) */}
            <nav style={styles.sidebar}>
                <div style={styles.logoArea}>
                    <div style={styles.logoIcon}>N</div>
                </div>
                <div style={styles.navItems}>
                    <div
                        style={{ ...styles.navItem, ...styles.activeNavItem }}
                        onClick={() => navigate('/doctor/dashboard')}
                        title="Dashboard"
                    >📊</div>
                    <div
                        style={styles.navItem}
                        onClick={() => navigate('/patients')}
                        title="Patients"
                    >👥</div>
                    <div
                        style={styles.navItem}
                        onClick={() => navigate('/appointments')}
                        title="Schedule"
                    >📅</div>
                    <div
                        style={styles.navItem}
                        onClick={() => alert('Settings coming soon')}
                        title="Settings"
                    >⚙️</div>
                </div>
                <div style={styles.userAvatar} onClick={handleLogout} title="Logout">
                    {user?.first_name?.[0] || 'D'}
                </div>
            </nav>

            {/* Main Content */}
            <main style={styles.mainContent}>
                {/* Header */}
                <header style={styles.header}>
                    <div>
                        <h1 style={styles.greeting}>
                            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'},
                            <span style={styles.nameHighlight}> Dr. {user?.last_name || user?.username}</span>
                        </h1>
                        <p style={styles.dateDisplay}>
                            {currentTime.toLocaleDateString('ko-KR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                    <div style={styles.headerRight}>
                        <div style={styles.searchBar}>
                            <span style={styles.searchIcon}>🔍</span>
                            <input type="text" placeholder="Search patients..." style={styles.searchInput} />
                        </div>
                        <div style={styles.notificationBtn} onClick={() => navigate('/notifications')}>
                            🔔<span style={styles.badge}>3</span>
                        </div>
                    </div>
                </header>

                {/* Dashboard Grid */}
                <div style={styles.dashboardGrid}>
                    {/* Stats Row */}
                    <div style={styles.statsRow}>
                        <StatCard title="Today's Patients" value="12" icon="👨‍⚕️" color="#4facfe" />
                        <StatCard title="Pending Reviews" value="5" icon="📝" color="#ff9a9e" />
                        <StatCard title="AI Analysis" value="8" icon="🧠" color="#a18cd1" />
                        <StatCard title="Surgery" value="1" icon="🏥" color="#43e97b" />
                    </div>

                    {/* Main Section: Schedule & Quick Actions */}
                    <div style={styles.contentRow}>
                        {/* Schedule Card */}
                        <div style={styles.largeCard}>
                            <div style={styles.cardHeader}>
                                <h2 style={styles.cardTitle}>Today's Schedule</h2>
                                <button
                                    style={styles.viewAllBtn}
                                    onClick={() => navigate('/appointments')}
                                >
                                    View All
                                </button>
                            </div>
                            <div style={styles.scheduleList}>
                                {loading ? (
                                    <div style={styles.loading}>Loading schedule...</div>
                                ) : (
                                    appointments.map(apt => (
                                        <div key={apt.id} style={styles.appointmentItem}>
                                            <div style={styles.timeColumn}>
                                                <span style={styles.timeText}>{apt.time}</span>
                                                <div style={styles.timelineLine}></div>
                                            </div>
                                            <div style={styles.appointmentCard}>
                                                <div style={styles.patientInfo}>
                                                    <span style={styles.patientName}>{apt.patient}</span>
                                                    <span style={styles.patientMeta}>{apt.gender}/{apt.age} • {apt.type}</span>
                                                </div>
                                                <span style={{ ...styles.statusTag, ...getStatusStyle(apt.status) }}>
                                                    {apt.status}
                                                </span>
                                                <button style={styles.actionIconBtn}>→</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Right Column */}
                        <div style={styles.rightColumn}>
                            {/* Quick Actions */}
                            <div style={styles.card}>
                                <h2 style={styles.cardTitle}>Quick Actions</h2>
                                <div style={styles.quickActionsGrid}>
                                    <ActionButton
                                        icon="➕"
                                        label="New Patient"
                                        color="#4facfe"
                                        onClick={() => navigate('/patients')}
                                    />
                                    <ActionButton
                                        icon="🧬"
                                        label="AI Analysis"
                                        color="#a18cd1"
                                        onClick={() => navigate('/doctor/cdss')}
                                    />
                                    <ActionButton
                                        icon="💊"
                                        label="Prescribe"
                                        color="#ff9a9e"
                                        onClick={() => navigate('/prescriptions')}
                                    />
                                    <ActionButton
                                        icon="📅"
                                        label="Schedule"
                                        color="#43e97b"
                                        onClick={() => navigate('/appointments')}
                                    />
                                </div>
                            </div>

                            {/* Recent Activity / AI Alerts */}
                            <div style={{ ...styles.card, flex: 1 }}>
                                <h2 style={styles.cardTitle}>AI Alerts</h2>
                                <div style={styles.alertList}>
                                    <AlertItem
                                        message="High probability of Meningioma detected"
                                        patient="홍길동"
                                        time="10m ago"
                                        severity="high"
                                    />
                                    <AlertItem
                                        message="MRI Scan upload complete"
                                        patient="김영희"
                                        time="1h ago"
                                        severity="medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// Sub-components
const StatCard = ({ title, value, icon, color }) => (
    <div style={styles.statCard}>
        <div style={{ ...styles.statIcon, backgroundColor: `${color}20`, color: color }}>{icon}</div>
        <div>
            <div style={styles.statValue}>{value}</div>
            <div style={styles.statTitle}>{title}</div>
        </div>
    </div>
);

const ActionButton = ({ icon, label, color, onClick }) => (
    <button style={styles.quickActionButton} onClick={onClick}>
        <div style={{ ...styles.actionBtnIcon, background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>{icon}</div>
        <span style={styles.actionBtnLabel}>{label}</span>
    </button>
);

const AlertItem = ({ message, patient, time, severity }) => (
    <div style={styles.alertItem}>
        <div style={{ ...styles.alertDot, backgroundColor: severity === 'high' ? '#ff6b6b' : '#feca57' }}></div>
        <div style={styles.alertContent}>
            <div style={styles.alertMessage}>{message}</div>
            <div style={styles.alertMeta}>{patient} • {time}</div>
        </div>
    </div>
);

const getStatusStyle = (status) => {
    switch (status) {
        case '대기중': return { backgroundColor: 'rgba(255, 159, 67, 0.15)', color: '#ff9f43' };
        case '진료중': return { backgroundColor: 'rgba(46, 213, 115, 0.15)', color: '#2ed573' };
        default: return { backgroundColor: 'rgba(84, 160, 255, 0.15)', color: '#54a0ff' };
    }
};

// Styles
const styles = {
    container: {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#121212', // Dark background
        color: '#ffffff',
        fontFamily: "'Inter', sans-serif",
    },
    sidebar: {
        width: '80px',
        backgroundColor: '#1e1e2e',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '2rem 0',
        borderRight: '1px solid rgba(255,255,255,0.05)',
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
        color: '#8395a7',
        transition: 'all 0.2s',
        ':hover': { backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }
    },
    activeNavItem: {
        backgroundColor: 'rgba(102, 126, 234, 0.2)',
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
    },
    mainContent: {
        flex: 1,
        padding: '2rem',
        overflowY: 'auto',
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
        background: 'linear-gradient(to right, #ffffff, #a5b1c2)',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
    },
    nameHighlight: {
        fontWeight: '300',
    },
    dateDisplay: {
        color: '#8395a7',
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
        backgroundColor: '#1e1e2e',
        padding: '0.6rem 1rem',
        borderRadius: '12px',
        border: '1px solid rgba(255,255,255,0.05)',
        width: '250px',
    },
    searchIcon: {
        marginRight: '0.5rem',
        opacity: 0.5,
    },
    searchInput: {
        background: 'none',
        border: 'none',
        color: 'white',
        width: '100%',
        outline: 'none',
        fontSize: '0.9rem',
    },
    notificationBtn: {
        position: 'relative',
        fontSize: '1.2rem',
        cursor: 'pointer',
        padding: '0.5rem',
        backgroundColor: '#1e1e2e',
        borderRadius: '10px',
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
    dashboardGrid: {
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem',
    },
    statsRow: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
    },
    statCard: {
        backgroundColor: '#1e1e2e',
        padding: '1.5rem',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        border: '1px solid rgba(255,255,255,0.05)',
        transition: 'transform 0.2s',
        cursor: 'pointer',
    },
    statIcon: {
        width: '48px',
        height: '48px',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.5rem',
    },
    statValue: {
        fontSize: '1.5rem',
        fontWeight: '700',
        color: 'white',
    },
    statTitle: {
        fontSize: '0.85rem',
        color: '#8395a7',
        marginTop: '0.2rem',
    },
    contentRow: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        minHeight: '400px',
    },
    largeCard: {
        backgroundColor: '#1e1e2e',
        borderRadius: '20px',
        padding: '1.5rem',
        border: '1px solid rgba(255,255,255,0.05)',
        display: 'flex',
        flexDirection: 'column',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
    },
    cardTitle: {
        fontSize: '1.1rem',
        fontWeight: '600',
        margin: 0,
        color: '#f5f6fa',
    },
    viewAllBtn: {
        background: 'none',
        border: 'none',
        color: '#667eea',
        cursor: 'pointer',
        fontSize: '0.9rem',
        fontWeight: '500',
    },
    scheduleList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    appointmentItem: {
        display: 'flex',
        gap: '1rem',
    },
    timeColumn: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '50px',
    },
    timeText: {
        fontSize: '0.9rem',
        fontWeight: '600',
        color: '#a5b1c2',
        marginBottom: '0.5rem',
    },
    timelineLine: {
        width: '2px',
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: '1px',
    },
    appointmentCard: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.03)',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background-color 0.2s',
        cursor: 'pointer',
    },
    patientInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
    },
    patientName: {
        fontWeight: '600',
        fontSize: '1rem',
    },
    patientMeta: {
        fontSize: '0.85rem',
        color: '#8395a7',
    },
    statusTag: {
        padding: '0.3rem 0.8rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
    },
    actionIconBtn: {
        background: 'none',
        border: 'none',
        color: '#8395a7',
        cursor: 'pointer',
        fontSize: '1.2rem',
    },
    rightColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    card: {
        backgroundColor: '#1e1e2e',
        borderRadius: '20px',
        padding: '1.5rem',
        border: '1px solid rgba(255,255,255,0.05)',
    },
    quickActionsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginTop: '1rem',
    },
    quickActionButton: {
        backgroundColor: 'rgba(255,255,255,0.03)',
        border: 'none',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '0.5rem',
        cursor: 'pointer',
        transition: 'all 0.2s',
    },
    actionBtnIcon: {
        width: '36px',
        height: '36px',
        borderRadius: '10px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '1.2rem',
        marginBottom: '0.2rem',
    },
    actionBtnLabel: {
        color: '#dcdde1',
        fontSize: '0.85rem',
        fontWeight: '500',
    },
    alertList: {
        marginTop: '1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    alertItem: {
        display: 'flex',
        gap: '0.8rem',
        alignItems: 'flex-start',
    },
    alertDot: {
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        marginTop: '6px',
    },
    alertContent: {
        flex: 1,
    },
    alertMessage: {
        fontSize: '0.9rem',
        color: '#f5f6fa',
        marginBottom: '0.2rem',
    },
    alertMeta: {
        fontSize: '0.8rem',
        color: '#8395a7',
    },
};

export default DoctorDashboard;
