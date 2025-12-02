import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import axiosClient from '../../api/axios';
import { API_ENDPOINTS } from '../../utils/config';
import '../DashboardPage.css';

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
            <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', display: 'grid' }}>
                {/* Upcoming Appointments */}
                <div className="stat-card">
                    <h2 className="card-title" style={{ fontSize: '1.2rem', color: '#2f3542' }}>Upcoming Appointments</h2>
                    {loading ? (
                        <p className="loading-state">Loading...</p>
                    ) : (
                        <div className="schedule-list">
                            {appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'PENDING').length === 0 ? (
                                <p className="empty-state">No upcoming appointments.</p>
                            ) : (
                                appointments.filter(a => a.status === 'SCHEDULED' || a.status === 'PENDING').slice(0, 3).map(apt => (
                                    <div key={apt.id} className="appointment-item" style={{ backgroundColor: '#f8f9fa', borderRadius: '12px', padding: '1rem', border: '1px solid #f1f2f6' }}>
                                        <div className="date-box">
                                            <span className="date-day">{new Date(apt.scheduled_at).getDate()}</span>
                                            <span className="date-month">{new Date(apt.scheduled_at).toLocaleString('default', { month: 'short' })}</span>
                                        </div>
                                        <div className="apt-info">
                                            <h3 className="apt-doctor">{apt.doctor_name || 'Doctor'}</h3>
                                            <p className="apt-dept">{apt.visit_type}</p>
                                            <p className="apt-time">{new Date(apt.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        <span className="status-badge">{apt.status}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="side-panel">
                    <div className="stat-card">
                        <h2 className="card-title" style={{ fontSize: '1.2rem', color: '#2f3542' }}>Quick Actions</h2>
                        <div className="button-group">
                            <button className="action-button" style={{ textAlign: 'left', backgroundColor: 'white' }} onClick={() => navigate('/appointments/new')}>
                                📅 Book Appointment
                            </button>
                            <button className="action-button" style={{ textAlign: 'left', backgroundColor: 'white' }} onClick={() => navigate('/prescriptions')}>
                                💊 My Prescriptions
                            </button>
                            <button className="action-button" style={{ textAlign: 'left', backgroundColor: 'white' }} onClick={() => navigate('/patient/medical-records')}>
                                📄 Medical Records
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientDashboard;
