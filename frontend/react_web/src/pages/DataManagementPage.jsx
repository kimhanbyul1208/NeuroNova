import React, { useState, useEffect } from 'react';
import DashboardLayout from '../layouts/DashboardLayout';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

const DataManagementPage = () => {
    const [appointments, setAppointments] = useState([]);
    const [patients, setPatients] = useState([]);
    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        patient: '',
        doctor: '',
        scheduled_at: '',
        status: 'PENDING',
        visit_type: 'ROUTINE',
        reason: '',
        notes: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [aptRes, patRes, docRes] = await Promise.all([
                axiosClient.get(API_ENDPOINTS.APPOINTMENTS),
                axiosClient.get('/emr/patients/'),
                axiosClient.get('/custom/doctors/')
            ]);

            setAppointments(Array.isArray(aptRes.data) ? aptRes.data : aptRes.data.results || []);
            setPatients(Array.isArray(patRes.data) ? patRes.data : patRes.data.results || []);
            setDoctors(Array.isArray(docRes.data) ? docRes.data : docRes.data.results || []);
        } catch (error) {
            console.error("Error fetching data:", error);
            alert("Failed to load data");
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleExampleInput = () => {
        if (patients.length === 0 || doctors.length === 0) {
            alert("Need patients and doctors to generate example data");
            return;
        }

        const randomPatient = patients[Math.floor(Math.random() * patients.length)];
        const randomDoctor = doctors[Math.floor(Math.random() * doctors.length)];
        const visitTypes = ['ROUTINE', 'FOLLOWUP', 'EMERGENCY', 'CONSULTATION'];
        const statuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

        // Random date within next 30 days
        const date = new Date();
        date.setDate(date.getDate() + Math.floor(Math.random() * 30));
        date.setHours(9 + Math.floor(Math.random() * 8), 0, 0, 0);

        setFormData({
            patient: randomPatient.id,
            doctor: randomDoctor.id,
            scheduled_at: date.toISOString().slice(0, 16), // Format for datetime-local
            status: statuses[Math.floor(Math.random() * statuses.length)],
            visit_type: visitTypes[Math.floor(Math.random() * visitTypes.length)],
            reason: `Example visit reason #${Math.floor(Math.random() * 1000)}`,
            notes: 'Auto-generated example note'
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingItem) {
                await axiosClient.patch(`${API_ENDPOINTS.APPOINTMENTS}${editingItem.id}/`, formData);
                alert("Appointment updated successfully");
            } else {
                await axiosClient.post(API_ENDPOINTS.APPOINTMENTS, formData);
                alert("Appointment created successfully");
            }
            setShowModal(false);
            setEditingItem(null);
            resetForm();
            fetchData();
        } catch (error) {
            console.error("Error saving data:", error);
            alert("Failed to save data: " + (error.response?.data?.detail || error.message));
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this appointment?")) return;
        try {
            await axiosClient.delete(`${API_ENDPOINTS.APPOINTMENTS}${id}/`);
            alert("Appointment deleted");
            fetchData();
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete");
        }
    };

    const openModal = (item = null) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                patient: item.patient,
                doctor: item.doctor,
                scheduled_at: item.scheduled_at.slice(0, 16),
                status: item.status,
                visit_type: item.visit_type,
                reason: item.reason,
                notes: item.notes || ''
            });
        } else {
            setEditingItem(null);
            resetForm();
        }
        setShowModal(true);
    };

    const resetForm = () => {
        setFormData({
            patient: '',
            doctor: '',
            scheduled_at: '',
            status: 'PENDING',
            visit_type: 'ROUTINE',
            reason: '',
            notes: ''
        });
    };

    return (
        <DashboardLayout role="DOCTOR" activePage="data-management" title="Data Management">
            <div style={styles.container}>
                <div style={styles.header}>
                    <h2>Appointment Management (CRUD)</h2>
                    <button style={styles.addButton} onClick={() => openModal()}>
                        + Add Appointment
                    </button>
                </div>

                {loading ? (
                    <div>Loading...</div>
                ) : (
                    <table style={styles.table}>
                        <thead>
                            <tr>
                                <th style={styles.th}>ID</th>
                                <th style={styles.th}>Patient</th>
                                <th style={styles.th}>Doctor</th>
                                <th style={styles.th}>Date</th>
                                <th style={styles.th}>Status</th>
                                <th style={styles.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {appointments.map(apt => (
                                <tr key={apt.id} style={styles.tr}>
                                    <td style={styles.td}>{apt.id}</td>
                                    <td style={styles.td}>{apt.patient_name || apt.patient}</td>
                                    <td style={styles.td}>{apt.doctor_name || apt.doctor}</td>
                                    <td style={styles.td}>{new Date(apt.scheduled_at).toLocaleString()}</td>
                                    <td style={styles.td}>
                                        <span style={getStatusStyle(apt.status)}>{apt.status}</span>
                                    </td>
                                    <td style={styles.td}>
                                        <button style={styles.editBtn} onClick={() => openModal(apt)}>Edit</button>
                                        <button style={styles.deleteBtn} onClick={() => handleDelete(apt.id)}>Delete</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {showModal && (
                    <div style={styles.modalOverlay}>
                        <div style={styles.modalContent}>
                            <h3>{editingItem ? 'Edit Appointment' : 'New Appointment'}</h3>

                            <button
                                type="button"
                                onClick={handleExampleInput}
                                style={styles.exampleBtn}
                            >
                                🎲 Example Input
                            </button>

                            <form onSubmit={handleSubmit} style={styles.form}>
                                <div style={styles.formGroup}>
                                    <label>Patient</label>
                                    <select name="patient" value={formData.patient} onChange={handleInputChange} required style={styles.input}>
                                        <option value="">Select Patient</option>
                                        {patients.map(p => (
                                            <option key={p.id} value={p.id}>{p.full_name} ({p.pid})</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={styles.formGroup}>
                                    <label>Doctor</label>
                                    <select name="doctor" value={formData.doctor} onChange={handleInputChange} required style={styles.input}>
                                        <option value="">Select Doctor</option>
                                        {doctors.map(d => (
                                            <option key={d.id} value={d.id}>{d.full_name} ({d.specialty})</option>
                                        ))}
                                    </select>
                                </div>

                                <div style={styles.formGroup}>
                                    <label>Date & Time</label>
                                    <input
                                        type="datetime-local"
                                        name="scheduled_at"
                                        value={formData.scheduled_at}
                                        onChange={handleInputChange}
                                        required
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.formGroup}>
                                    <label>Status</label>
                                    <select name="status" value={formData.status} onChange={handleInputChange} style={styles.input}>
                                        <option value="PENDING">Pending</option>
                                        <option value="CONFIRMED">Confirmed</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="CANCELLED">Cancelled</option>
                                    </select>
                                </div>

                                <div style={styles.formGroup}>
                                    <label>Visit Type</label>
                                    <select name="visit_type" value={formData.visit_type} onChange={handleInputChange} style={styles.input}>
                                        <option value="ROUTINE">Routine</option>
                                        <option value="FOLLOWUP">Follow-up</option>
                                        <option value="EMERGENCY">Emergency</option>
                                        <option value="CONSULTATION">Consultation</option>
                                    </select>
                                </div>

                                <div style={styles.formGroup}>
                                    <label>Reason</label>
                                    <input
                                        type="text"
                                        name="reason"
                                        value={formData.reason}
                                        onChange={handleInputChange}
                                        required
                                        style={styles.input}
                                    />
                                </div>

                                <div style={styles.buttonGroup}>
                                    <button type="button" onClick={() => setShowModal(false)} style={styles.cancelBtn}>Cancel</button>
                                    <button type="submit" style={styles.submitBtn}>Save</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

const getStatusStyle = (status) => {
    const base = { padding: '4px 8px', borderRadius: '4px', fontSize: '0.85rem', fontWeight: 'bold' };
    switch (status) {
        case 'PENDING': return { ...base, backgroundColor: '#ffeeba', color: '#856404' };
        case 'CONFIRMED': return { ...base, backgroundColor: '#d4edda', color: '#155724' };
        case 'CANCELLED': return { ...base, backgroundColor: '#f8d7da', color: '#721c24' };
        default: return { ...base, backgroundColor: '#e2e3e5', color: '#383d41' };
    }
};

const styles = {
    container: { padding: '20px', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' },
    addButton: { backgroundColor: '#4CAF50', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', borderBottom: '2px solid #ddd', backgroundColor: '#f8f9fa' },
    td: { padding: '12px', borderBottom: '1px solid #ddd' },
    tr: { '&:hover': { backgroundColor: '#f5f5f5' } },
    editBtn: { marginRight: '8px', padding: '6px 12px', backgroundColor: '#2196F3', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    deleteBtn: { padding: '6px 12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
    modalContent: { backgroundColor: 'white', padding: '30px', borderRadius: '8px', width: '500px', maxWidth: '90%' },
    form: { display: 'flex', flexDirection: 'column', gap: '15px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '5px' },
    input: { padding: '8px', borderRadius: '4px', border: '1px solid #ddd' },
    buttonGroup: { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' },
    submitBtn: { padding: '10px 20px', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    cancelBtn: { padding: '10px 20px', backgroundColor: '#9e9e9e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' },
    exampleBtn: { marginBottom: '15px', padding: '8px 16px', backgroundColor: '#673AB7', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', width: '100%' }
};

export default DataManagementPage;
