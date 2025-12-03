import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    Alert,
    CircularProgress,
    FormControl,
    FormLabel,
    RadioGroup,
    FormControlLabel,
    Radio,
} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';

const RegisterPatientModal = ({ open, onClose, onRegisterSuccess }) => {
    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        date_of_birth: '',
        gender: 'M',
        phone: '',
        email: '',
        address: '',
        pid: '',
        insurance_id: '',
        doctor: null,
    });

    const [doctors, setDoctors] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingDoctors, setLoadingDoctors] = useState(false);
    const [error, setError] = useState(null);

    // ⭐ PID 자동 생성
    const generatePID = () =>
        `PT-${new Date().getFullYear()}-${Math.floor(Math.random() * 10000)
            .toString()
            .padStart(4, "0")}`;

    // 🔹 의사 목록 로드
    useEffect(() => {
        if (!open) return;

        const fetchDoctors = async () => {
            setLoadingDoctors(true);
            try {
                const res = await axiosClient.get(API_ENDPOINTS.DOCTORS);
                const list = Array.isArray(res.data)
                    ? res.data
                    : res.data?.results || [];
                setDoctors(list);
            } catch (err) {
                console.error("Failed to load doctors:", err);
                setDoctors([]);
            } finally {
                setLoadingDoctors(false);
            }
        };

        fetchDoctors();
    }, [open]);

    // 🔹 환자 등록 처리
    const handleRegister = async () => {
        setError(null);

        if (!formData.last_name.trim()) return setError("성을 입력해주세요.");
        if (!formData.first_name.trim()) return setError("이름을 입력해주세요.");
        if (!formData.date_of_birth) return setError("생년월일을 입력해주세요.");
        if (!formData.phone.trim()) return setError("전화번호를 입력해주세요.");
        if (!formData.doctor) return setError("담당 의사를 선택해주세요.");

        setLoading(true);

        try {
            let payload = {
                ...formData,
                doctor: formData.doctor?.user_id,  // 🔥 doctor.user_id (User ID)를 백엔드에 전송
            };

            // PID 자동 생성
            if (!payload.pid) payload.pid = generatePID();

            // 중복 PID 자동 재시도
            let attempts = 0;
            const maxAttempts = 3;

            while (attempts < maxAttempts) {
                try {
                    const res = await axiosClient.post(API_ENDPOINTS.PATIENTS, payload);
                    const newPatient = res.data;

                    // 🔥 환자 등록 성공 후 자동으로 Encounter 생성 (진료 예정)
                    try {
                        await axiosClient.post(API_ENDPOINTS.ENCOUNTERS, {
                            patient: newPatient.id,
                            doctor: payload.doctor,
                            encounter_date: new Date().toISOString(),
                            reason: "신규 환자 등록",
                            facility: "외래",
                            status: "SCHEDULED"
                        });
                    } catch (encounterErr) {
                        console.error("Encounter creation failed:", encounterErr);
                        // Encounter 생성 실패해도 환자 등록은 성공이므로 계속 진행
                    }

                    onRegisterSuccess(newPatient);
                    onClose();
                    return;
                } catch (err) {
                    // PID 중복일 때
                    if (err.response?.data?.pid) {
                        attempts += 1;
                        payload.pid = generatePID();
                        continue;
                    }
                    throw err;
                }
            }

            setError("PID 생성 오류가 반복되었습니다. 다시 시도해주세요.");

        } catch (err) {
            console.error("Patient register failed:", err);
            setError("등록 중 오류가 발생했습니다.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>환자 등록</DialogTitle>

            <DialogContent>
                {error && <Alert severity="error">{error}</Alert>}

                <Grid container spacing={2} sx={{ mt: 1 }}>
                    {/* 성 */}
                    <Grid item xs={6}>
                        <TextField
                            label="성"
                            fullWidth
                            value={formData.last_name}
                            onChange={(e) =>
                                setFormData({ ...formData, last_name: e.target.value })
                            }
                        />
                    </Grid>

                    {/* 이름 */}
                    <Grid item xs={6}>
                        <TextField
                            label="이름"
                            fullWidth
                            value={formData.first_name}
                            onChange={(e) =>
                                setFormData({ ...formData, first_name: e.target.value })
                            }
                        />
                    </Grid>

                    {/* 생년월일 */}
                    <Grid item xs={6}>
                        <TextField
                            label="생년월일"
                            type="date"
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                            value={formData.date_of_birth}
                            onChange={(e) =>
                                setFormData({ ...formData, date_of_birth: e.target.value })
                            }
                        />
                    </Grid>

                    {/* 성별 */}
                    <Grid item xs={6}>
                        <FormControl>
                            <FormLabel>성별</FormLabel>
                            <RadioGroup
                                row
                                value={formData.gender}
                                onChange={(e) =>
                                    setFormData({ ...formData, gender: e.target.value })
                                }
                            >
                                <FormControlLabel value="M" control={<Radio />} label="남" />
                                <FormControlLabel value="F" control={<Radio />} label="여" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>

                    {/* 전화 */}
                    <Grid item xs={6}>
                        <TextField
                            label="전화번호"
                            fullWidth
                            value={formData.phone}
                            onChange={(e) =>
                                setFormData({ ...formData, phone: e.target.value })
                            }
                        />
                    </Grid>

                    {/* 이메일 */}
                    <Grid item xs={6}>
                        <TextField
                            label="이메일"
                            fullWidth
                            value={formData.email}
                            onChange={(e) =>
                                setFormData({ ...formData, email: e.target.value })
                            }
                        />
                    </Grid>

                    {/* 주소 */}
                    <Grid item xs={12}>
                        <TextField
                            label="주소"
                            fullWidth
                            multiline
                            value={formData.address}
                            onChange={(e) =>
                                setFormData({ ...formData, address: e.target.value })
                            }
                        />
                    </Grid>

                    {/* PID */}
                    <Grid item xs={6}>
                        <TextField
                            label="PID"
                            fullWidth
                            value={formData.pid}
                            onChange={(e) =>
                                setFormData({ ...formData, pid: e.target.value })
                            }
                            helperText="비워두면 자동 생성됩니다."
                        />
                    </Grid>

                    {/* 보험 ID */}
                    <Grid item xs={6}>
                        <TextField
                            label="보험 번호"
                            fullWidth
                            value={formData.insurance_id}
                            onChange={(e) =>
                                setFormData({ ...formData, insurance_id: e.target.value })
                            }
                        />
                    </Grid>

                    {/* 담당 의사 */}
                    <Grid item xs={12}>
                        <Autocomplete
                            options={doctors}
                            loading={loadingDoctors}
                            getOptionLabel={(option) => {
                                if (option.full_name) {
                                    const parts = option.full_name.split(" ");
                                    if (parts.length === 2) {
                                        return `${parts[1]} ${parts[0]} 의사`;
                                    }
                                    return option.full_name;
                                }
                                return option.username || "의사";
                            }}
                            onChange={(_, value) =>
                                setFormData({ ...formData, doctor: value })
                            }
                            renderInput={(params) => (
                                <TextField
                                    {...params}
                                    label="담당 의사 선택"
                                    InputProps={{
                                        ...params.InputProps,
                                        endAdornment: (
                                            <>
                                                {loadingDoctors && (
                                                    <CircularProgress size={20} />
                                                )}
                                                {params.InputProps.endAdornment}
                                            </>
                                        ),
                                    }}
                                />
                            )}
                        />
                    </Grid>
                </Grid>
            </DialogContent>

            <DialogActions>
                <Button onClick={onClose}>취소</Button>
                <Button onClick={handleRegister} variant="contained">
                    {loading ? <CircularProgress size={22} /> : "등록"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default RegisterPatientModal;
