import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

const PatientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data for now
        setTimeout(() => {
            setAppointments([
                { id: 1, date: '2025-12-05 14:00', doctor: 'Dr. Kim', department: 'Neurosurgery', status: 'SCHEDULED' },
                { id: 2, date: '2025-11-20 10:00', doctor: 'Dr. Lee', department: 'Neurology', status: 'COMPLETED' },
            ]);
            setLoading(false);
        }, 1000);
    }, []);

    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <div>
                    <h1 style={styles.title}>My Health Portal</h1>
                    <p style={styles.subtitle}>Welcome, {user?.username}</p>
                </div>
                <button onClick={logout} style={styles.logoutButton}>Logout</button>
            </header>

            <div style={styles.grid}>
                {/* Upcoming Appointments */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Upcoming Appointments</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div style={styles.list}>
                            {appointments.filter(a => a.status === 'SCHEDULED').length === 0 ? (
                                <p style={styles.emptyText}>No upcoming appointments.</p>
                            ) : (
                                appointments.filter(a => a.status === 'SCHEDULED').map(apt => (
                                    <div key={apt.id} style={styles.appointmentItem}>
                                        <div style={styles.dateBox}>
                                            <span style={styles.dateDay}>{new Date(apt.date).getDate()}</span>
                                            <span style={styles.dateMonth}>{new Date(apt.date).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div style={styles.aptInfo}>
                                            <h3 style={styles.aptDoctor}>{apt.doctor}</h3>
                                            <p style={styles.aptDept}>{apt.department}</p>
                                            <p style={styles.aptTime}>{new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <span style={styles.statusBadge}>{apt.status}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div style={styles.sidePanel}>
                    <div style={styles.card}>
                        <h2 style={styles.cardTitle}>Quick Actions</h2>
                        <div style={styles.buttonGroup}>
                            <button style={styles.actionButton} onClick={() => alert('Feature coming soon')}>
                                📅 Book Appointment
                            </button>
                            <button style={styles.actionButton} onClick={() => alert('Feature coming soon')}>
                                💊 My Prescriptions
                            </button>
                            <button style={styles.actionButton} onClick={() => alert('Feature coming soon')}>
                                📄 Medical Records
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const styles = {
    container: {
        padding: '2rem',
        maxWidth: '1000px',
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
        color: '#2c3e50',
        margin: 0,
    },
    subtitle: {
        color: '#7f8c8d',
        margin: '0.5rem 0 0 0',
    },
    logoutButton: {
        padding: '0.5rem 1rem',
        backgroundColor: '#e74c3c',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontWeight: '600',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
    },
    card: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
        border: '1px solid #f0f0f0',
    },
    cardTitle: {
        marginTop: 0,
        marginBottom: '1.5rem',
        fontSize: '1.2rem',
        color: '#34495e',
    },
    list: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    appointmentItem: {
        display: 'flex',
        alignItems: 'center',
        padding: '1rem',
        backgroundColor: '#f9f9f9',
        borderRadius: '8px',
        gap: '1rem',
    },
    dateBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3498db',
        color: 'white',
        padding: '0.5rem',
        borderRadius: '6px',
        minWidth: '50px',
    },
    dateDay: {
        fontSize: '1.2rem',
        fontWeight: 'bold',
    },
    dateMonth: {
        fontSize: '0.8rem',
        textTransform: 'uppercase',
    },
    aptInfo: {
        flex: 1,
    },
    aptDoctor: {
        margin: '0 0 0.2rem 0',
        fontSize: '1rem',
        color: '#2c3e50',
    },
    aptDept: {
        margin: 0,
        fontSize: '0.9rem',
        color: '#7f8c8d',
    },
    aptTime: {
        margin: '0.2rem 0 0 0',
        fontSize: '0.8rem',
        color: '#95a5a6',
    },
    statusBadge: {
        padding: '0.3rem 0.6rem',
        backgroundColor: '#e8f6f3',
        color: '#1abc9c',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
    },
    emptyText: {
        color: '#95a5a6',
        fontStyle: 'italic',
        textAlign: 'center',
        padding: '2rem',
    },
    buttonGroup: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
    },
    actionButton: {
        padding: '1rem',
        backgroundColor: 'white',
        border: '1px solid #bdc3c7',
        borderRadius: '8px',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '1rem',
        color: '#34495e',
        transition: 'all 0.2s',
        ':hover': {
            backgroundColor: '#ecf0f1',
            borderColor: '#3498db',
        }
    },
    sidePanel: {
        display: 'flex',
        flexDirection: 'column',
    }
};

export default PatientDashboard;
