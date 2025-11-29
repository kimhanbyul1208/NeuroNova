import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';

const StaffDashboard = () => {
    const { user, logout } = useAuth();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data
        setTimeout(() => {
            setQueue([
                { id: 1, name: '홍길동', pid: 'PT-2025-001', status: '접수완료', waitTime: '10분' },
                { id: 2, name: '김영희', pid: 'PT-2025-002', status: '바이탈 대기', waitTime: '5분' },
                { id: 3, name: '이철수', pid: 'PT-2025-003', status: '진료 대기', waitTime: '25분' },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Staff Dashboard</h1>
                    <p style={styles.subtitle}>Medical Staff: {user?.username} ({user?.role})</p>
                </div>
                <button onClick={logout} style={styles.logoutButton}>Logout</button>
            </header>

            <div style={styles.grid}>
                {/* Patient Queue */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>Patient Queue</h2>
                        <button style={styles.refreshButton}>Refresh</button>
                    </div>

                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>Patient Name</th>
                                <th style={styles.th}>PID</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Wait Time</th>
                                <th style={styles.th}>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {queue.map(patient => (
                                <tr key={patient.id} style={styles.tr}>
                                    <td style={styles.td}>
                                        <span style={styles.patientName}>{patient.name}</span>
                                    </td>
                                    <td style={styles.td}>{patient.pid}</td>
                                    <td style={styles.td}>
                                        <span style={{ ...styles.statusBadge, ...getStatusStyle(patient.status) }}>
                                            {patient.status}
                                        </span>
                                    </td>
                                    <td style={styles.td}>{patient.waitTime}</td>
                                    <td style={styles.td}>
                                        <button style={styles.actionButton}>Call</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Quick Tasks */}
                <div style={styles.sidePanel}>
                    <div style={styles.taskCard}>
                        <h3 style={styles.taskTitle}>Quick Tasks</h3>
                        <div style={styles.buttonGroup}>
                            <button style={styles.primaryButton}>+ Register New Patient</button>
                            <button style={styles.secondaryButton}>Record Vitals</button>
                            <button style={styles.secondaryButton}>Upload Documents</button>
                        </div>
                    </div>

                    <div style={{ ...styles.taskCard, marginTop: '1.5rem' }}>
                        <h3 style={styles.taskTitle}>Notifications</h3>
                        <ul style={styles.notiList}>
                            <li style={styles.notiItem}>Dr. Kim requested vitals for PT-2025-003</li>
                            <li style={styles.notiItem}>New appointment request from Web</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

const getStatusStyle = (status) => {
    switch (status) {
        case '바이탈 대기': return { backgroundColor: '#fff3e0', color: '#e65100' };
        case '진료 대기': return { backgroundColor: '#e3f2fd', color: '#1565c0' };
        default: return { backgroundColor: '#f5f5f5', color: '#616161' };
    }
};

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        fontFamily: "'Inter', sans-serif",
        color: '#333',
        backgroundColor: '#f4f7f6',
        minHeight: '100vh',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '10px',
        boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
    },
    title: {
        fontSize: '1.6rem',
        fontWeight: '700',
        color: '#00695c',
        margin: 0,
    },
    subtitle: {
        color: '#666',
        margin: '0.5rem 0 0 0',
    },
    logoutButton: {
        padding: '0.6rem 1.2rem',
        backgroundColor: '#ff5252',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '3fr 1fr',
        gap: '2rem',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    cardHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.5rem',
    },
    cardTitle: {
        margin: 0,
        fontSize: '1.2rem',
        color: '#333',
    },
    refreshButton: {
        padding: '0.4rem 0.8rem',
        backgroundColor: 'transparent',
        border: '1px solid #ddd',
        borderRadius: '4px',
        cursor: 'pointer',
        color: '#666',
    },
    table: {
        width: '100%',
        borderCollapse: 'collapse',
    },
    th: {
        textAlign: 'left',
        padding: '1rem',
        borderBottom: '2px solid #eee',
        color: '#666',
        fontWeight: '600',
        fontSize: '0.9rem',
    },
    tr: {
        borderBottom: '1px solid #f5f5f5',
    },
    td: {
        padding: '1rem',
        verticalAlign: 'middle',
    },
    patientName: {
        fontWeight: '600',
        color: '#2c3e50',
    },
    statusBadge: {
        padding: '0.3rem 0.8rem',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
    },
    actionButton: {
        padding: '0.4rem 1rem',
        backgroundColor: '#009688',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '0.9rem',
    },
    sidePanel: {
        display: 'flex',
        flexDirection: 'column',
    },
    taskCard: {
        backgroundColor: 'white',
        borderRadius: '10px',
        padding: '1.5rem',
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
    },
    taskTitle: {
        margin: '0 0 1rem 0',
        fontSize: '1.1rem',
        color: '#455a64',
    },
    buttonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.8rem',
    },
    primaryButton: {
        padding: '0.8rem',
        backgroundColor: '#00796b',
        color: 'white',
        border: 'none',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '0.95rem',
    },
    secondaryButton: {
        padding: '0.8rem',
        backgroundColor: 'white',
        color: '#00796b',
        border: '1px solid #00796b',
        borderRadius: '6px',
        cursor: 'pointer',
        fontWeight: '600',
    },
    notiList: {
        listStyle: 'none',
        padding: 0,
        margin: 0,
    },
    notiItem: {
        padding: '0.8rem',
        backgroundColor: '#fff8e1',
        borderRadius: '6px',
        marginBottom: '0.5rem',
        fontSize: '0.9rem',
        color: '#f57f17',
        borderLeft: '3px solid #ffca28',
    }
};

export default StaffDashboard;
