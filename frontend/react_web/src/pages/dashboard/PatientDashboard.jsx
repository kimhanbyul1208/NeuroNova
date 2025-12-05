import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../layouts/DashboardLayout';
import axiosClient from '../../api/axios';
import { API_ENDPOINTS } from '../../utils/config';
import { getAppointmentStatusText, getVisitTypeText, getAppointmentStatusColor } from '../../utils/statusTranslations';
import '../DashboardPage.css';

const PatientDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAppointments = async () => {
            try {
                const response = await axiosClient.get(API_ENDPOINTS.APPOINTMENTS);
                const data = response.data;
                const results = Array.isArray(data) ? data : data.results || [];
                setAppointments(results);
            } catch (error) {
                console.error("Error fetching appointments:", error);
                // If error is due to missing patient profile or permissions, show empty list
                setAppointments([]);
            } finally {
                setLoading(false);
            }
        };
        fetchAppointments();
    }, []);

    return (
        <DashboardLayout role="PATIENT" activePage="dashboard" title={`안녕하세요, ${user?.username}`}>
            <div className="dashboard-grid" style={{ gridTemplateColumns: '2fr 1fr', display: 'grid' }}>
                {/* Upcoming Appointments */}
                <div className="stat-card">
                    <h2 className="card-title" style={{ fontSize: '1.2rem', color: '#2f3542' }}>내 진료 일정</h2>
                    {loading ? (
                        <p className="loading-state">Loading...</p>
                    ) : (
                        <div className="schedule-list">
                            {appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING').length === 0 ? (
                                <p className="empty-state">예약된 진료가 없습니다.</p>
                            ) : (
                                appointments.filter(a => a.status === 'CONFIRMED' || a.status === 'PENDING').slice(0, 5).map(apt => (
                                    <div key={apt.id} className="appointment-item" style={{
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '12px',
                                        padding: '1rem',
                                        marginBottom: '0.75rem',
                                        border: '1px solid #f1f2f6',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '1rem'
                                    }}>
                                        <div className="date-box" style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            minWidth: '60px',
                                            padding: '0.5rem',
                                            backgroundColor: '#fff',
                                            borderRadius: '8px',
                                            border: '2px solid #e1e8ed'
                                        }}>
                                            <span className="date-day" style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1976d2' }}>
                                                {new Date(apt.scheduled_at).getDate()}
                                            </span>
                                            <span className="date-month" style={{ fontSize: '0.875rem', color: '#666' }}>
                                                {new Date(apt.scheduled_at).toLocaleString('ko-KR', { month: 'short' })}
                                            </span>
                                        </div>
                                        <div className="apt-info" style={{ flex: 1 }}>
                                            <h3 className="apt-doctor" style={{ margin: '0 0 0.25rem 0', fontSize: '1rem', fontWeight: '600' }}>
                                                {apt.doctor_name || '담당 의사 배정 대기'}
                                            </h3>
                                            <p className="apt-dept" style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#666' }}>
                                                {getVisitTypeText(apt.visit_type)}
                                            </p>
                                            <p className="apt-time" style={{ margin: '0.25rem 0', fontSize: '0.875rem', color: '#999' }}>
                                                {new Date(apt.scheduled_at).toLocaleString('ko-KR', {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                    hour12: true
                                                })}
                                            </p>
                                        </div>
                                        <span className="status-badge" style={{
                                            padding: '0.5rem 1rem',
                                            borderRadius: '20px',
                                            fontSize: '0.875rem',
                                            fontWeight: '600',
                                            backgroundColor: getAppointmentStatusColor(apt.status) + '20',
                                            color: getAppointmentStatusColor(apt.status),
                                            border: `2px solid ${getAppointmentStatusColor(apt.status)}`
                                        }}>
                                            {getAppointmentStatusText(apt.status)}
                                        </span>
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
                                📅 진료 예약
                            </button>
                            <button className="action-button" style={{ textAlign: 'left', backgroundColor: 'white' }} onClick={() => navigate('/patient/prescriptions')}>
                                💊 내 처방전
                            </button>
                            <button className="action-button" style={{ textAlign: 'left', backgroundColor: 'white' }} onClick={() => navigate('/patient/medical-records')}>
                                📄 진료 내역
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default PatientDashboard;
