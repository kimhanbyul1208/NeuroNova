import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import axiosClient from '../../api/axios';
import { API_ENDPOINTS } from '../../utils/config';
import '../../DashboardPage.css';

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
            <div className="dashboard-grid">
                {/* Stats Row */}
                <div className="stats-grid">
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
                <div className="content-row">
                    {/* Schedule Card */}
                    <div className="large-card">
                        <div className="card-header">
                            <h2 className="card-title" style={{ fontSize: '1.1rem', color: '#2f3542', margin: 0 }}>Today's Schedule</h2>
                            <button
                                className="view-all-btn"
                                onClick={() => navigate('/appointments')}
                            >
                                View All
                            </button>
                        </div>
                        <div className="schedule-list">
                            {loading ? (
                                <div className="loading-state">Loading schedule...</div>
                            ) : appointments.length === 0 ? (
                                <div className="empty-state">No appointments scheduled for today.</div>
                            ) : (
                                appointments.map(apt => (
                                    <div key={apt.id} className="appointment-item">
                                        <div className="time-column">
                                            <span className="time-text">
                                                {new Date(apt.scheduled_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                            <div className="timeline-line"></div>
                                        </div>
                                        <div className="appointment-card">
                                            <div className="patient-info">
                                                <span className="patient-name">{apt.patient_name || 'Unknown Patient'}</span>
                                                <span className="patient-meta">{apt.reason || 'Regular Checkup'}</span>
                                            </div>
                                            <span className="status-tag" style={getStatusStyle(apt.status)}>
                                                {apt.status}
                                            </span>
                                            <button
                                                className="action-icon-btn"
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
                    <div className="right-column">
                        {/* Quick Actions */}
                        <div className="stat-card">
                            <h2 className="card-title" style={{ fontSize: '1.1rem', color: '#2f3542', margin: 0 }}>Quick Actions</h2>
                            <div className="quick-actions-grid">
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
                        <div className="stat-card" style={{ flex: 1 }}>
                            <h2 className="card-title" style={{ fontSize: '1.1rem', color: '#2f3542', margin: 0 }}>AI Alerts</h2>
                            <div className="alert-list">
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
    <div className="stat-card interactive" onClick={onClick}>
        <div className="stat-icon" style={{ backgroundColor: `${color}20`, color: color }}>{icon}</div>
        <div>
            <div className="stat-value small">{value}</div>
            <div className="stat-title">{title}</div>
        </div>
    </div>
);

const ActionButton = ({ icon, label, color, onClick }) => (
    <button className="quick-action-button" onClick={onClick}>
        <div className="action-btn-icon" style={{ background: `linear-gradient(135deg, ${color}, ${color}dd)` }}>{icon}</div>
        <span className="action-btn-label">{label}</span>
    </button>
);

const AlertItem = ({ message, patient, time, severity }) => (
    <div className="alert-item">
        <div className="alert-dot" style={{ backgroundColor: severity === 'high' ? '#ff6b6b' : '#feca57' }}></div>
        <div className="alert-content">
            <div className="alert-message">{message}</div>
            <div className="alert-meta">{patient} • {time}</div>
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

export default DoctorDashboard;
