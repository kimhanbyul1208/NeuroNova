import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import DashboardLayout from '../../layouts/DashboardLayout';
import '../../DashboardPage.css';

const AdminDashboard = () => {
    const { user } = useAuth();
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
        <DashboardLayout role="ADMIN" activePage="dashboard" title="Admin Dashboard">
            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card centered">
                    <h3 className="card-title">Total Users</h3>
                    <p className="stat-value">{loading ? '...' : stats.totalUsers}</p>
                </div>
                <div className="stat-card centered">
                    <h3 className="card-title">Doctors</h3>
                    <p className="stat-value">{loading ? '...' : stats.totalDoctors}</p>
                </div>
                <div className="stat-card centered">
                    <h3 className="card-title">Patients</h3>
                    <p className="stat-value">{loading ? '...' : stats.totalPatients}</p>
                </div>
                <div className="stat-card centered">
                    <h3 className="card-title">Active Sessions</h3>
                    <p className="stat-value">{loading ? '...' : stats.activeSessions}</p>
                </div>
            </div>

            {/* System Management Section */}
            <div className="dashboard-section" style={{ marginTop: '2rem' }}>
                <h2 className="section-title">System Management</h2>
                <div className="action-grid">
                    <button
                        className="action-button"
                        onClick={() => navigate('/admin/users')}
                    >
                        Manage Users
                    </button>
                    <button
                        className="action-button"
                        onClick={() => navigate('/admin/settings')}
                    >
                        System Settings
                    </button>
                    <button
                        className="action-button"
                        onClick={() => navigate('/about')}
                    >
                        About Us
                    </button>
                    <button
                        className="action-button"
                        style={{ backgroundColor: '#ede7f6', borderColor: '#7c4dff', color: '#5e35b1', fontWeight: '600' }}
                        onClick={() => navigate('/about-ai')}
                    >
                        🤖 About AI
                    </button>
                    <button
                        className="action-button"
                        onClick={() => alert('Audit Logs feature coming soon!')}
                    >
                        View Audit Logs
                    </button>
                    <button
                        className="action-button"
                        onClick={() => alert('Database Maintenance feature coming soon!')}
                    >
                        Database Maintenance
                    </button>
                </div>
            </div>

            {/* Debug Views Section */}
            <div className="dashboard-section" style={{ marginTop: '2rem', borderTop: '4px solid #ff9800' }}>
                <h2 className="section-title">🛠️ Debug Views (Admin Only)</h2>
                <p style={{ color: '#666', marginBottom: '1.5rem' }}>
                    Access other role-specific dashboards for debugging and support purposes.
                </p>
                <div className="action-grid">
                    <button
                        className="debug-button"
                        onClick={() => navigate('/doctor/dashboard')}
                    >
                        👨‍⚕️ View as Doctor
                    </button>
                    <button
                        className="debug-button"
                        onClick={() => navigate('/staff/dashboard')}
                    >
                        👩‍⚕️ View as Nurse
                    </button>
                    <button
                        className="debug-button"
                        onClick={() => navigate('/patient/dashboard')}
                    >
                        🏥 View as Patient
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminDashboard;
