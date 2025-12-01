import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import axiosClient from '../../api/axios';

const AdminDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalDoctors: 0,
        totalPatients: 0,
        activeSessions: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data fetch for now
        setTimeout(() => {
            setStats({
                totalUsers: 15,
                totalDoctors: 5,
                totalPatients: 10,
                activeSessions: 3
            });
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>Admin Dashboard</h1>
                    <p style={styles.subtitle}>Welcome back, {user?.username} ({user?.role})</p>
                </div>
                <button onClick={logout} style={styles.logoutButton}>Logout</button>
            </header>

            <div style={styles.grid}>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Total Users</h3>
                    <p style={styles.cardValue}>{loading ? '...' : stats.totalUsers}</p>
                </div>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Doctors</h3>
                    <p style={styles.cardValue}>{loading ? '...' : stats.totalDoctors}</p>
                </div>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Patients</h3>
                    <p style={styles.cardValue}>{loading ? '...' : stats.totalPatients}</p>
                </div>
                <div style={styles.card}>
                    <h3 style={styles.cardTitle}>Active Sessions</h3>
                    <p style={styles.cardValue}>{loading ? '...' : stats.activeSessions}</p>
                </div>
            </div>

            <div style={styles.section}>
                <h2 style={styles.sectionTitle}>System Management</h2>
                <div style={styles.actionGrid}>
                    <button
                        style={styles.actionButton}
                        onClick={() => navigate('/patients')}
                    >
                        Manage Users
                    </button>
                    <button
                        style={styles.actionButton}
                        onClick={() => alert('System Settings feature coming soon!')}
                    >
                        System Settings
                    </button>
                    <button
                        style={styles.actionButton}
                        onClick={() => alert('Audit Logs feature coming soon!')}
                    >
                        View Audit Logs
                    </button>
                    <button
                        style={styles.actionButton}
                        onClick={() => alert('Database Maintenance feature coming soon!')}
                    >
                        Database Maintenance
                    </button>
                </div>
            </div>

            {/* Debug Views Section */}
            <div style={{ ...styles.section, marginTop: '2rem', borderTop: '4px solid #ff9800' }}>
                <h2 style={styles.sectionTitle}>🛠️ Debug Views (Admin Only)</h2>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                    Access other role-specific dashboards for debugging and support purposes.
                </p>
                <div style={styles.actionGrid}>
                    <button
                        style={styles.debugButton}
                        onClick={() => navigate('/doctor/dashboard')}
                    >
                        👨‍⚕️ View as Doctor
                    </button>
                    <button
                        style={styles.debugButton}
                        onClick={() => navigate('/staff/dashboard')}
                    >
                        👩‍⚕️ View as Nurse
                    </button>
                    <button
                        style={styles.debugButton}
                        onClick={() => navigate('/patient/dashboard')}
                    >
                        🏥 View as Patient
                    </button>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: "'Inter', sans-serif",
        color: '#333',
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '1px solid #eee',
        paddingBottom: '1rem',
    },
    title: {
        fontSize: '1.8rem',
        fontWeight: '700',
        color: '#1a237e',
        margin: 0,
    },
    subtitle: {
        color: '#666',
        margin: '0.5rem 0 0 0',
    },
    logoutButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '600',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1.5rem',
        marginBottom: '3rem',
    },
    card: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
    },
    cardTitle: {
        margin: '0 0 0.5rem 0',
        color: '#555',
        fontSize: '0.9rem',
        textTransform: 'uppercase',
        letterSpacing: '1px',
    },
    cardValue: {
        margin: 0,
        fontSize: '2.5rem',
        fontWeight: '700',
        color: '#1a237e',
    },
    section: {
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        textAlign: 'center',
    },
    sectionTitle: {
        marginTop: 0,
        marginBottom: '1.5rem',
        color: '#333',
    },
    actionGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '1rem',
    },
    actionButton: {
        padding: '1rem',
        backgroundColor: '#f5f5f5',
        border: '1px solid #ddd',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '500',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#e0e0e0',
        }
    },
    debugButton: {
        padding: '1rem',
        backgroundColor: '#fff3e0',
        border: '1px solid #ffb74d',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '1rem',
        fontWeight: '600',
        color: '#e65100',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#ffe0b2',
        }
    }
};

export default AdminDashboard;
