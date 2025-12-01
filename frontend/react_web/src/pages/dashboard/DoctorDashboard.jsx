import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import axiosClient from '../../api/axios';
import { API_ENDPOINTS } from '../../utils/config';

const DoctorDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const currentTime = new Date();

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                setLoading(true);
                const response = await axiosClient.get(API_ENDPOINTS.APPOINTMENTS);
                const data = response.data;
                // Handle pagination or direct list
                const results = Array.isArray(data) ? data : data.results || [];

                // Filter for today's appointments (optional, but good for dashboard)
                // For now, just showing the latest 5
                setAppointments(results.slice(0, 5));
            } catch (error) {
                console.error("Error fetching appointments:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAppointments();
    }, []);

    const greeting = (
        <>
            Good {currentTime.getHours() < 12 ? 'Morning' : currentTime.getHours() < 18 ? 'Afternoon' : 'Evening'},
            <span style={{ fontWeight: '300', color: '#57606f' }}> Dr. {user?.last_name || user?.username}</span>
        </>
    );

    return (
        <DashboardLayout role="DOCTOR" activePage="dashboard" title={greeting}>
            <div style={styles.dashboardGrid}>
                {/* Stats Row */}
                <div style={styles.statsRow}>
                    <StatCard
                        title="Today's Patients"
                        value={appointments.length}
                        icon="👨‍⚕️"
                        color="#4facfe"
                        onClick={() => navigate('/appointments')}
                    />
                    <StatCard
                        title="Pending Reviews"
                        value="5"
                        icon="📝"
                        color="#ff9a9e"
                        onClick={() => navigate('/doctor/cdss')} // Or a specific pending reviews page
                    />
                    <StatCard
                        title="AI Analysis"
                        value="8"
                        icon="🧠"
                        color="#a18cd1"
                        onClick={() => navigate('/doctor/cdss')}
                    />
                    <StatCard
                        title="Surgery"
                        value="1"
                        icon="🏥"
                        color="#43e97b"
                        onClick={() => navigate('/appointments')}
                    />
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
                            ) : appointments.length === 0 ? (
                                <div style={styles.emptyState}>No appointments scheduled for today.</div>
                            ) : (
                                appointments.map(apt => (
                                    <div key={apt.id} style={styles.appointmentItem}>
                                        <div style={styles.timeColumn}>
                                            <span style={styles.timeText}>
                                                {new Date(apt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <div style={styles.timelineLine}></div>
                                        </div>
                                        <div style={styles.appointmentCard}>
                                            <div style={styles.patientInfo}>
                                                <span style={styles.patientName}>{apt.patient_name || 'Unknown Patient'}</span>
                                                <span style={styles.patientMeta}>{apt.reason || 'Regular Checkup'}</span>
                                            </div>
                                            <span style={{ ...styles.statusTag, ...getStatusStyle(apt.status) }}>
                                                {apt.status}
                                            </span>
                                            <button
                                                style={styles.actionIconBtn}
                                                onClick={() => navigate(`/patients/${apt.patient}`)}
                                            >
                                                →
                                            </button>
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
        </DashboardLayout>
    );
};

// Sub-components
const StatCard = ({ title, value, icon, color, onClick }) => (
    <div style={styles.statCard} onClick={onClick}>
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
        case 'PENDING': return { backgroundColor: 'rgba(255, 159, 67, 0.15)', color: '#ff9f43' };
        case 'CONFIRMED': return { backgroundColor: 'rgba(46, 213, 115, 0.15)', color: '#2ed573' };
        default: return { backgroundColor: 'rgba(84, 160, 255, 0.15)', color: '#54a0ff' };
    }
};

// Styles (Component specific)
const styles = {
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
        backgroundColor: '#ffffff',
        padding: '1.5rem',
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '1rem',
        border: '1px solid #e1e1e1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
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
        color: '#2f3542',
    },
    statTitle: {
        fontSize: '0.85rem',
        color: '#747d8c',
        marginTop: '0.2rem',
    },
    contentRow: {
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '2rem',
        minHeight: '400px',
    },
    largeCard: {
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '1.5rem',
        border: '1px solid #e1e1e1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
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
        color: '#2f3542',
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
        color: '#747d8c',
        marginBottom: '0.5rem',
    },
    timelineLine: {
        width: '2px',
        flex: 1,
        backgroundColor: '#f1f2f6',
        borderRadius: '1px',
    },
    appointmentCard: {
        flex: 1,
        backgroundColor: '#f8f9fa',
        borderRadius: '12px',
        padding: '1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        transition: 'background-color 0.2s',
        cursor: 'pointer',
        border: '1px solid #f1f2f6',
    },
    patientInfo: {
        display: 'flex',
        flexDirection: 'column',
        gap: '0.3rem',
    },
    patientName: {
        fontWeight: '600',
        fontSize: '1rem',
        color: '#2f3542',
    },
    patientMeta: {
        fontSize: '0.85rem',
        color: '#747d8c',
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
        color: '#a4b0be',
        cursor: 'pointer',
        fontSize: '1.2rem',
    },
    rightColumn: {
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
    },
    card: {
        backgroundColor: '#ffffff',
        borderRadius: '20px',
        padding: '1.5rem',
        border: '1px solid #e1e1e1',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
    },
    quickActionsGrid: {
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '1rem',
        marginTop: '1rem',
    },
    quickActionButton: {
        backgroundColor: '#f8f9fa',
        border: '1px solid #f1f2f6',
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
        color: 'white',
    },
    actionBtnLabel: {
        color: '#57606f',
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
        color: '#2f3542',
        marginBottom: '0.2rem',
    },
    alertMeta: {
        fontSize: '0.8rem',
        color: '#747d8c',
    },
    loading: {
        padding: '2rem',
        textAlign: 'center',
        color: '#747d8c',
    },
    emptyState: {
        padding: '2rem',
        textAlign: 'center',
        color: '#747d8c',
        fontStyle: 'italic',
    }
};

export default DoctorDashboard;
