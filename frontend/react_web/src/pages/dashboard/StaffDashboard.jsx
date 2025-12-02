import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
    RegisterPatientModal,
    AssignDoctorModal,
    LoadingSpinner,
    ErrorAlert
} from '../../components';
import axiosClient from '../../api/axios';
import { API_ENDPOINTS } from '../../utils/config';
import DashboardLayout from '../../layouts/DashboardLayout';
import '../DashboardPage.css';

const StaffDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [queue, setQueue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal States
    const [registerModalOpen, setRegisterModalOpen] = useState(false);
    const [assignModalOpen, setAssignModalOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState(null);

    useEffect(() => {
        fetchQueue();
    }, []);

    const fetchQueue = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosClient.get(API_ENDPOINTS.ENCOUNTERS);

            // Handle pagination (DRF returns { count, next, previous, results })
            const data = response.data;
            setQueue(Array.isArray(data) ? data : data.results || []);
        } catch (err) {
            console.error("Error fetching queue:", err);
            setError("환자 대기열을 불러오는데 실패했습니다.");
        } finally {
            setLoading(false);
        }
    };

    const handleRegisterSuccess = () => {
        fetchQueue();
    };

    const handleAssignSuccess = () => {
        fetchQueue();
    };

    const openAssignModal = (patient) => {
        setSelectedPatient(patient);
        setAssignModalOpen(true);
    };

    return (
        <DashboardLayout role="NURSE" activePage="dashboard" title="Staff Dashboard">
            <div className="dashboard-grid" style={{ gridTemplateColumns: '3fr 1fr', display: 'grid' }}>
                {/* Patient Queue */}
                <div className="stat-card">
                    <div className="card-header-row">
                        <h2 className="card-title" style={{ fontSize: '1.2rem', color: '#2f3542' }}>Patient Queue (Today's Encounters)</h2>
                        <button onClick={fetchQueue} className="refresh-button">Refresh</button>
                    </div>

                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <ErrorAlert message={error} />
                    ) : (
                        <table className="results-table">
                            <thead>
                                <tr className="table-header-row">
                                    <th className="table-header-cell">Date/Time</th>
                                    <th className="table-header-cell">Patient</th>
                                    <th className="table-header-cell">Status</th>
                                    <th className="table-header-cell">Facility</th>
                                    <th className="table-header-cell">Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queue.length === 0 ? (
                                    <tr className="table-body-row">
                                        <td colSpan="5" className="table-body-cell" style={{ textAlign: 'center' }}>대기 중인 환자가 없습니다.</td>
                                    </tr>
                                ) : (
                                    queue.map(encounter => (
                                        <tr key={encounter.id} className="table-body-row">
                                            <td className="table-body-cell">
                                                {new Date(encounter.encounter_date).toLocaleString()}
                                            </td>
                                            <td className="table-body-cell">
                                                <span className="patient-name" style={{ fontWeight: '600', color: '#2f3542' }}>
                                                    {encounter.patient_name || encounter.patient || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="table-body-cell">
                                                <span className="status-badge" style={getStatusStyle(encounter.status)}>
                                                    {encounter.status}
                                                </span>
                                            </td>
                                            <td className="table-body-cell">{encounter.facility}</td>
                                            <td className="table-body-cell">
                                                <button
                                                    className="assign-button"
                                                    onClick={() => {
                                                        const patientObj = typeof encounter.patient === 'object'
                                                            ? encounter.patient
                                                            : { id: encounter.patient, pid: 'Unknown', last_name: 'Patient', first_name: 'ID: ' + encounter.patient };
                                                        openAssignModal(patientObj);
                                                    }}
                                                >
                                                    Assign Dr.
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Quick Tasks */}
                <div className="side-panel">
                    <div className="stat-card">
                        <h3 className="card-title" style={{ fontSize: '1.1rem', color: '#2f3542', marginBottom: '1rem' }}>Quick Tasks</h3>
                        <div className="button-group">
                            <button
                                className="primary-button"
                                onClick={() => setRegisterModalOpen(true)}
                            >
                                + Register New Patient
                            </button>
                            <button
                                className="secondary-button"
                                onClick={() => navigate('/forms')}
                            >
                                Record Vitals
                            </button>
                            <button
                                className="secondary-button"
                                onClick={() => navigate('/forms')}
                            >
                                Upload Documents
                            </button>
                        </div>
                    </div>

                    <div className="stat-card" style={{ marginTop: '1.5rem' }}>
                        <h3 className="card-title" style={{ fontSize: '1.1rem', color: '#2f3542', marginBottom: '1rem' }}>Notifications</h3>
                        <ul className="noti-list">
                            <li className="noti-item">Dr. Kim requested vitals for PT-2025-003</li>
                            <li className="noti-item">New appointment request from Web</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <RegisterPatientModal
                open={registerModalOpen}
                onClose={() => setRegisterModalOpen(false)}
                onRegisterSuccess={handleRegisterSuccess}
            />

            <AssignDoctorModal
                open={assignModalOpen}
                onClose={() => setAssignModalOpen(false)}
                patient={selectedPatient}
                onAssignSuccess={handleAssignSuccess}
            />
        </DashboardLayout>
    );
};

const getStatusStyle = (status) => {
    switch (status) {
        case 'SCHEDULED': return { backgroundColor: '#fff3e0', color: '#e65100' };
        case 'IN_PROGRESS': return { backgroundColor: '#e3f2fd', color: '#1565c0' };
        case 'COMPLETED': return { backgroundColor: '#e8f5e9', color: '#2e7d32' };
        default: return { backgroundColor: '#f5f5f5', color: '#616161' };
    }
};

export default StaffDashboard;
