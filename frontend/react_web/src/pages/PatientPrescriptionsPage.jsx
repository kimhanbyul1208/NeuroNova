import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthContext';
import DashboardLayout from '../layouts/DashboardLayout';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import './DashboardPage.css';

/**
 * Patient Prescriptions Page
 * 환자가 자신의 처방전을 조회하는 페이지
 */
const PatientPrescriptionsPage = () => {
    const { user } = useAuth();
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedPrescription, setSelectedPrescription] = useState(null);

    useEffect(() => {
        fetchPrescriptions();
    }, []);

    const fetchPrescriptions = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosClient.get(API_ENDPOINTS.PRESCRIPTIONS);
            const data = response.data;
            const results = Array.isArray(data) ? data : data.results || [];
            setPrescriptions(results);
        } catch (err) {
            console.error('Error fetching prescriptions:', err);
            setError('처방전 목록을 불러오는데 실패했습니다.');
            setPrescriptions([]);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (prescription) => {
        setSelectedPrescription(prescription);
    };

    const handleCloseDetails = () => {
        setSelectedPrescription(null);
    };

    return (
        <DashboardLayout role="PATIENT" activePage="prescriptions" title="내 처방전">
            <div style={{ padding: '1.5rem' }}>
                {error && (
                    <div style={{
                        padding: '1rem',
                        marginBottom: '1.5rem',
                        backgroundColor: '#fee',
                        border: '1px solid #fcc',
                        borderRadius: '8px',
                        color: '#c33'
                    }}>
                        {error}
                    </div>
                )}

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                        <p>처방전을 불러오는 중...</p>
                    </div>
                ) : prescriptions.length === 0 ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '3rem',
                        backgroundColor: '#f8f9fa',
                        borderRadius: '12px',
                        border: '1px solid #e1e8ed'
                    }}>
                        <p style={{ fontSize: '1.1rem', color: '#666', margin: 0 }}>
                            💊 처방전이 없습니다.
                        </p>
                        <p style={{ fontSize: '0.875rem', color: '#999', marginTop: '0.5rem' }}>
                            진료 후 처방전이 발급되면 여기에 표시됩니다.
                        </p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gap: '1rem' }}>
                        {prescriptions.map((prescription) => (
                            <div
                                key={prescription.id}
                                style={{
                                    backgroundColor: '#fff',
                                    borderRadius: '12px',
                                    padding: '1.5rem',
                                    border: '1px solid #e1e8ed',
                                    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s'
                                }}
                                onClick={() => handleViewDetails(prescription)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            margin: '0 0 0.5rem 0',
                                            fontSize: '1.25rem',
                                            fontWeight: '600',
                                            color: '#2f3542'
                                        }}>
                                            💊 {prescription.medication_name}
                                        </h3>
                                        <div style={{ display: 'grid', gap: '0.5rem', marginTop: '1rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ fontWeight: '600', color: '#666', minWidth: '80px' }}>용량:</span>
                                                <span style={{ color: '#2f3542' }}>{prescription.dosage}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ fontWeight: '600', color: '#666', minWidth: '80px' }}>복용 빈도:</span>
                                                <span style={{ color: '#2f3542' }}>{prescription.frequency}</span>
                                            </div>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <span style={{ fontWeight: '600', color: '#666', minWidth: '80px' }}>복용 기간:</span>
                                                <span style={{ color: '#2f3542' }}>{prescription.duration}</span>
                                            </div>
                                            {prescription.instructions && (
                                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                    <span style={{ fontWeight: '600', color: '#666', minWidth: '80px' }}>복용법:</span>
                                                    <span style={{ color: '#2f3542' }}>{prescription.instructions}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', marginLeft: '1rem' }}>
                                        <div style={{
                                            fontSize: '0.875rem',
                                            color: '#999',
                                            marginBottom: '0.25rem'
                                        }}>
                                            처방일
                                        </div>
                                        <div style={{
                                            fontSize: '1rem',
                                            fontWeight: '600',
                                            color: '#2f3542'
                                        }}>
                                            {new Date(prescription.prescribed_at || prescription.created_at).toLocaleDateString('ko-KR', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Detail Modal */}
                {selectedPrescription && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1000,
                            padding: '1rem'
                        }}
                        onClick={handleCloseDetails}
                    >
                        <div
                            style={{
                                backgroundColor: '#fff',
                                borderRadius: '16px',
                                padding: '2rem',
                                maxWidth: '600px',
                                width: '100%',
                                maxHeight: '80vh',
                                overflow: 'auto',
                                boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <h2 style={{
                                margin: '0 0 1.5rem 0',
                                fontSize: '1.5rem',
                                fontWeight: '600',
                                color: '#2f3542',
                                borderBottom: '2px solid #e1e8ed',
                                paddingBottom: '1rem'
                            }}>
                                처방전 상세 정보
                            </h2>

                            <div style={{ display: 'grid', gap: '1rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                                        약물명
                                    </div>
                                    <div style={{ fontSize: '1.25rem', fontWeight: '600', color: '#2f3542' }}>
                                        {selectedPrescription.medication_name}
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                                            용량
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: '500', color: '#2f3542' }}>
                                            {selectedPrescription.dosage}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                                            복용 경로
                                        </div>
                                        <div style={{ fontSize: '1rem', fontWeight: '500', color: '#2f3542' }}>
                                            {selectedPrescription.route || '경구'}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                                        복용 빈도
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: '500', color: '#2f3542' }}>
                                        {selectedPrescription.frequency}
                                    </div>
                                </div>

                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                                        복용 기간
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: '500', color: '#2f3542' }}>
                                        {selectedPrescription.duration}
                                    </div>
                                </div>

                                {selectedPrescription.instructions && (
                                    <div>
                                        <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                                            복용 지시사항
                                        </div>
                                        <div style={{
                                            fontSize: '1rem',
                                            color: '#2f3542',
                                            backgroundColor: '#f8f9fa',
                                            padding: '1rem',
                                            borderRadius: '8px',
                                            border: '1px solid #e1e8ed'
                                        }}>
                                            {selectedPrescription.instructions}
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <div style={{ fontSize: '0.875rem', color: '#999', marginBottom: '0.25rem' }}>
                                        처방일
                                    </div>
                                    <div style={{ fontSize: '1rem', fontWeight: '500', color: '#2f3542' }}>
                                        {new Date(selectedPrescription.prescribed_at || selectedPrescription.created_at).toLocaleString('ko-KR', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div style={{ marginTop: '2rem', textAlign: 'right' }}>
                                <button
                                    onClick={handleCloseDetails}
                                    style={{
                                        padding: '0.75rem 2rem',
                                        backgroundColor: '#1976d2',
                                        color: '#fff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '1rem',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'background-color 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1565c0'}
                                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1976d2'}
                                >
                                    닫기
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default PatientPrescriptionsPage;
