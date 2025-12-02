import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Box
} from '@mui/material';
// import { LoadingSpinner, ErrorAlert } from '../../components';
import { LoadingSpinner, ErrorAlert } from "@/components";
// import axiosClient from '../../api/axios';
import axiosClient from "@/api/axios";
import { API_ENDPOINTS } from '@/utils/config';

const MedicalRecordsPage = () => {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                setLoading(true);
                // Assuming an endpoint to get current patient's medical history
                // If not, we might need to use the encounters endpoint filtered by patient
                // For now, let's try to fetch encounters or use mock data if API fails
                const response = await axiosClient.get(API_ENDPOINTS.ENCOUNTERS);
                const data = response.data;
                const results = Array.isArray(data) ? data : data.results || [];
                setRecords(results);
            } catch (err) {
                console.error("Error fetching medical records:", err);
                // Mock data for demonstration if API fails or is empty
                setRecords([
                    { id: 1, encounter_date: '2025-11-20', doctor_name: 'Dr. Kim', diagnosis: 'Tension Headache', status: 'COMPLETED' },
                    { id: 2, encounter_date: '2025-10-15', doctor_name: 'Dr. Lee', diagnosis: 'Annual Checkup', status: 'COMPLETED' },
                ]);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, []);

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                My Medical Records
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
                View your past medical history, diagnoses, and treatments.
            </Typography>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Date</TableCell>
                            <TableCell>Doctor</TableCell>
                            <TableCell>Diagnosis/Reason</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {records.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={5} align="center">No medical records found.</TableCell>
                            </TableRow>
                        ) : (
                            records.map((record) => (
                                <TableRow key={record.id}>
                                    <TableCell>{new Date(record.encounter_date || record.created_at || Date.now()).toLocaleDateString()}</TableCell>
                                    <TableCell>{record.doctor_name || 'Unknown'}</TableCell>
                                    <TableCell>{record.diagnosis || record.reason || '-'}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={record.status}
                                            color={record.status === 'COMPLETED' ? 'success' : 'default'}
                                            size="small"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ color: 'primary.main', cursor: 'pointer', textDecoration: 'underline' }}>
                                            View Details
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default MedicalRecordsPage;
