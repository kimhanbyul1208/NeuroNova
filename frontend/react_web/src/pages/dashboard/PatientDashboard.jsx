import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import axiosClient from '../../api/axios';
import { API_ENDPOINTS } from '../../utils/config';

const PatientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                // Fetch real appointments if API is ready, otherwise mock
                // For now, let's try to fetch or fallback to mock
                const response = await axiosClient.get(API_ENDPOINTS.APPOINTMENTS);
                const data = response.data;
                const results = Array.isArray(data) ? data : data.results || [];
                setAppointments(results);
            } catch (error) {
                console.error("Error fetching appointments:", error);
                // Fallback mock data
                setAppointments([
                    { id: 1, scheduled_at: '2025-12-05T14:00:00', doctor_name: 'Dr. Kim', visit_type: 'Regular Checkup', status: 'SCHEDULED' },
                ]);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    return (
        <DashboardLayout role="PATIENT" activePage="dashboard" title={`Welcome, ${user?.username}`}>
            <div style={styles.grid}>
                {/* Upcoming Appointments */}
                <div style={styles.card}>
                    <h2 style={styles.cardTitle}>Upcoming Appointments</h2>
                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <div style={styles.list}>
                            {appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'PENDING').length === 0 ? (
                                <p style={styles.emptyText}>No upcoming appointments.</p>
                            ) : (
                                appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'PENDING').slice(0, 3).map(apt => (
                                    <div key={apt.id} style={styles.appointmentItem}>
                                        <div style={styles.dateBox}>
                                            <span style={styles.dateDay}>{new Date(apt.scheduled_at).getDate()}</span>
                                            <span style={styles.dateMonth}>{new Date(apt.scheduled_at).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div style={styles.aptInfo}>
                                            <h3 style={styles.aptDoctor}>{apt.doctor_name || 'Doctor'}</h3>
                                            <p style={styles.aptDept}>{apt.visit_type}</p>
                                            <p style={styles.aptTime}>{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
                            <button style={styles.actionButton} onClick={() => navigate('/appointments/new')}>
                                📅 Book Appointment
                            </button>
                            <button style={styles.actionButton} onClick={() => navigate('/prescriptions')}>
                                💊 My Prescriptions
                            </button>
                            <button style={styles.actionButton} onClick={() => alert('Medical Records feature coming soon')}>
                                📄 Medical Records
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
    },
    card: {
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        border: '1px solid #e1e1e1',
    },
    cardTitle: {
        marginTop: 0,
        marginBottom: '1.5rem',
        fontSize: '1.2rem',
        color: '#2f3542',
        fontWeight: '600',
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
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        gap: '1rem',
        border: '1px solid #f1f2f6',
    },
    dateBox: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#4facfe',
        color: 'white',
        padding: '0.5rem',
        borderRadius: '8px',
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
        color: '#2f3542',
    },
    aptDept: {
        margin: 0,
        fontSize: '0.9rem',
        color: '#747d8c',
    },
    aptTime: {
        margin: '0.2rem 0 0 0',
        fontSize: '0.8rem',
        color: '#a4b0be',
    },
    statusBadge: {
        padding: '0.3rem 0.8rem',
        backgroundColor: '#e3f2fd',
        color: '#2196f3',
        borderRadius: '20px',
        fontSize: '0.8rem',
        fontWeight: '600',
    },
    emptyText: {
        color: '#a4b0be',
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
        border: '1px solid #e1e1e1',
        borderRadius: '12px',
        cursor: 'pointer',
        textAlign: 'left',
        fontSize: '1rem',
        color: '#2f3542',
        transition: 'all 0.2s',
        fontWeight: '500',
    },
    sidePanel: {
        display: 'flex',
        flexDirection: 'column',
    }
};

export default PatientDashboard;
