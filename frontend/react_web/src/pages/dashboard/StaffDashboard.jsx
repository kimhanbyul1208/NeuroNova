import React, { useState, useEffect } from 'react';
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

const StaffDashboard = () => {
    const { user } = useAuth();
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
            <div style={styles.grid}>
                {/* Patient Queue */}
                <div style={styles.card}>
                    <div style={styles.cardHeader}>
                        <h2 style={styles.cardTitle}>Patient Queue (Today's Encounters)</h2>
                        <button onClick={fetchQueue} style={styles.refreshButton}>Refresh</button>
                    </div>

                    {loading ? (
                        <LoadingSpinner />
                    ) : error ? (
                        <ErrorAlert message={error} />
                    ) : (
                        <table style={styles.table}>
                            <thead>
                                <tr>
                                    <th style={styles.th}>Date/Time</th>
                                    <th style={styles.th}>Patient</th>
                                    <th style={styles.th}>Status</th>
                                    <th style={styles.th}>Facility</th>
                                    <th style={styles.th}>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queue.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ ...styles.td, textAlign: 'center' }}>대기 중인 환자가 없습니다.</td>
                                    </tr>
                                ) : (
                                    queue.map(encounter => (
                                        <tr key={encounter.id} style={styles.tr}>
                                            <td style={styles.td}>
                                                {new Date(encounter.encounter_date).toLocaleString()}
                                            </td>
                                            <td style={styles.td}>
                                                <span style={styles.patientName}>
                                                    {encounter.patient_name || encounter.patient || 'Unknown'}
                                                </span>
                                            </td>
                                            <td style={styles.td}>
                                                <span style={{ ...styles.statusBadge, ...getStatusStyle(encounter.status) }}>
                                                    {encounter.status}
                                                </span>
                                            </td>
                                            <td style={styles.td}>{encounter.facility}</td>
                                            <td style={styles.td}>
                                                <button
                                                    style={styles.actionButton}
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
                <div style={styles.sidePanel}>
                    <div style={styles.taskCard}>
                        <h3 style={styles.taskTitle}>Quick Tasks</h3>
                        <div style={styles.buttonGroup}>
                            <button
                                style={styles.primaryButton}
                                onClick={() => setRegisterModalOpen(true)}
                            >
                                + Register New Patient
                            </button>
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

const styles = {
    grid: {
        display: 'grid',
        gridTemplateColumns: '3fr 1fr',
        gap: '2rem',
    },
    card: {
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        border: '1px solid #e1e1e1',
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
        color: '#2f3542',
        fontWeight: '600',
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
        color: '#747d8c',
        fontWeight: '600',
        fontSize: '0.9rem',
    },
    tr: {
        borderBottom: '1px solid #f5f5f5',
    },
    td: {
        padding: '1rem',
        verticalAlign: 'middle',
        color: '#2f3542',
    },
    patientName: {
        fontWeight: '600',
        color: '#2f3542',
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
        borderRadius: '16px',
        padding: '1.5rem',
        boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
        border: '1px solid #e1e1e1',
    },
    taskTitle: {
        margin: '0 0 1rem 0',
        fontSize: '1.1rem',
        color: '#2f3542',
        fontWeight: '600',
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
