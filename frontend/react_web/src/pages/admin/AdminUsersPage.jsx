import React, { useState, useEffect } from 'react';
import {
    Container,
    Typography,
    Box,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Button,
    Chip,
    TextField,
    InputAdornment,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    Tooltip,
    FormGroup,
    FormControlLabel,
    Checkbox,
    FormLabel
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../auth/AuthContext';
import { useFocusCleanup } from '../../hooks/useFocusCleanup';
import axiosClient from '../../api/axios';
import { API_ENDPOINTS } from '../../utils/config';
import { LoadingSpinner, ErrorAlert } from '../../components';

const AdminUsersPage = () => {
    const { user } = useAuth();
    useFocusCleanup();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    // Pagination
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Search
    const [searchTerm, setSearchTerm] = useState('');

    // Edit Dialog
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        is_active: true,
        is_staff: false,
        role: 'PATIENT',
        roles: [] // 복수 권한 저장
    });

    // Delete Confirmation
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosClient.get(API_ENDPOINTS.USERS);
            console.log('Users response:', response.data);
            setUsers(Array.isArray(response.data) ? response.data : response.data.results || []);
        } catch (err) {
            console.error('Error fetching users:', err);
            if (err.response?.status === 403) {
                setError('권한이 없습니다. 관리자 계정으로 로그인해주세요.');
            } else if (err.response?.data?.detail) {
                setError(err.response.data.detail);
            } else {
                setError('사용자 목록을 불러오는데 실패했습니다.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleActivateUser = async (userId) => {
        try {
            await axiosClient.post(`${API_ENDPOINTS.USERS}${userId}/activate/`);
            setSuccess('사용자가 활성화되었습니다.');
            fetchUsers();
        } catch (err) {
            console.error('Error activating user:', err);
            setError('사용자 활성화에 실패했습니다.');
        }
    };

    const handleDeactivateUser = async (userId) => {
        try {
            await axiosClient.post(`${API_ENDPOINTS.USERS}${userId}/deactivate/`);
            setSuccess('사용자가 비활성화되었습니다.');
            fetchUsers();
        } catch (err) {
            console.error('Error deactivating user:', err);
            setError('사용자 비활성화에 실패했습니다.');
        }
    };

    const handleEditUser = (user) => {
        setSelectedUser(user);

        // 사용자의 현재 role을 기반으로 roles 배열 초기화
        const currentRole = user.role || user.profile?.role || 'PATIENT';
        const initialRoles = user.roles || [currentRole];

        setEditFormData({
            username: user.username,
            email: user.email,
            first_name: user.first_name || '',
            last_name: user.last_name || '',
            is_active: user.is_active,
            is_staff: user.is_staff || false,
            role: currentRole,
            roles: initialRoles
        });
        setOpenEditDialog(true);
    };

    const handleRoleCheckboxChange = (role) => {
        setEditFormData(prev => {
            const newRoles = prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role];

            return {
                ...prev,
                roles: newRoles,
                // 주 역할은 선택된 역할 중 첫 번째로 설정
                role: newRoles.length > 0 ? newRoles[0] : 'PATIENT'
            };
        });
    };

    const handleSaveEdit = async () => {
        try {
            await axiosClient.patch(`${API_ENDPOINTS.USERS}${selectedUser.id}/`, editFormData);
            setSuccess('사용자 정보가 수정되었습니다.');
            setOpenEditDialog(false);
            fetchUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            setError('사용자 정보 수정에 실패했습니다.');
        }
    };

    const handleDeleteUser = (user) => {
        setUserToDelete(user);
        setOpenDeleteDialog(true);
    };

    const confirmDeleteUser = async () => {
        try {
            await axiosClient.delete(`${API_ENDPOINTS.USERS}${userToDelete.id}/`);
            setSuccess('사용자가 삭제되었습니다.');
            setOpenDeleteDialog(false);
            setUserToDelete(null);
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('사용자 삭제에 실패했습니다.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const paginatedUsers = filteredUsers.slice(
        page * rowsPerPage,
        page * rowsPerPage + rowsPerPage
    );

    const getRoleLabel = (role) => {
        const roleMap = {
            ADMIN: '관리자',
            DOCTOR: '의사',
            NURSE: '간호사',
            PATIENT: '환자'
        };
        return roleMap[role] || role;
    };

    const getRoleColor = (role) => {
        const colorMap = {
            ADMIN: 'error',
            DOCTOR: 'primary',
            NURSE: 'secondary',
            PATIENT: 'default'
        };
        return colorMap[role] || 'default';
    };

    if (loading) return <LoadingSpinner fullScreen />;

    return (
        <DashboardLayout role={user?.role} activePage="users" title="사용자 관리">
            <Paper sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                    <Typography variant="h5" fontWeight={600}>
                        전체 사용자 관리
                    </Typography>
                </Box>

                {error && (
                    <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
                        {success}
                    </Alert>
                )}

                <TextField
                    fullWidth
                    placeholder="사용자명, 이메일, 이름으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <SearchIcon color="action" />
                            </InputAdornment>
                        ),
                        sx: { borderRadius: '12px' }
                    }}
                    sx={{ mb: 3 }}
                />

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><strong>ID</strong></TableCell>
                                <TableCell><strong>사용자명</strong></TableCell>
                                <TableCell><strong>이메일</strong></TableCell>
                                <TableCell><strong>이름</strong></TableCell>
                                <TableCell><strong>직책</strong></TableCell>
                                <TableCell><strong>활성 상태</strong></TableCell>
                                <TableCell align="center"><strong>관리</strong></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {paginatedUsers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        <Typography color="text.secondary">검색 결과가 없습니다.</Typography>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                paginatedUsers.map((u) => (
                                    <TableRow key={u.id} hover>
                                        <TableCell>{u.id}</TableCell>
                                        <TableCell>{u.username}</TableCell>
                                        <TableCell>{u.email}</TableCell>
                                        <TableCell>{u.last_name}{u.first_name}</TableCell>
                                        <TableCell>
                                            <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                                {u.roles && u.roles.length > 0 ? (
                                                    u.roles.map((role, idx) => (
                                                        <Chip
                                                            key={idx}
                                                            label={getRoleLabel(role)}
                                                            color={getRoleColor(role)}
                                                            size="small"
                                                            sx={{ mb: 0.5 }}
                                                        />
                                                    ))
                                                ) : (
                                                    <Chip
                                                        label={getRoleLabel(u.role || u.profile?.role)}
                                                        color={getRoleColor(u.role || u.profile?.role)}
                                                        size="small"
                                                    />
                                                )}
                                            </Stack>
                                        </TableCell>
                                        <TableCell>
                                            {u.is_active ? (
                                                <Chip
                                                    icon={<CheckCircleIcon />}
                                                    label="활성"
                                                    color="success"
                                                    size="small"
                                                />
                                            ) : (
                                                <Chip
                                                    icon={<CancelIcon />}
                                                    label="비활성"
                                                    color="error"
                                                    size="small"
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            <Stack direction="row" spacing={1} justifyContent="center">
                                                {u.is_active ? (
                                                    <Tooltip title="비활성화">
                                                        <IconButton
                                                            color="error"
                                                            size="small"
                                                            onClick={() => handleDeactivateUser(u.id)}
                                                        >
                                                            <CancelIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                ) : (
                                                    <Tooltip title="활성화">
                                                        <IconButton
                                                            color="success"
                                                            size="small"
                                                            onClick={() => handleActivateUser(u.id)}
                                                        >
                                                            <CheckCircleIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                )}
                                                <Tooltip title="수정">
                                                    <IconButton
                                                        color="primary"
                                                        size="small"
                                                        onClick={() => handleEditUser(u)}
                                                    >
                                                        <EditIcon />
                                                    </IconButton>
                                                </Tooltip>
                                                <Tooltip title="삭제">
                                                    <IconButton
                                                        color="error"
                                                        size="small"
                                                        onClick={() => handleDeleteUser(u)}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            </Stack>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>

                <TablePagination
                    component="div"
                    count={filteredUsers.length}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                    }}
                    labelRowsPerPage="페이지당 행 수:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 총 ${count}개`}
                />
            </Paper>

            {/* Edit User Dialog */}
            <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>사용자 정보 수정</DialogTitle>
                <DialogContent>
                    <Stack spacing={2} sx={{ mt: 2 }}>
                        <TextField
                            label="사용자명"
                            value={editFormData.username}
                            onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
                            fullWidth
                            disabled
                        />
                        <TextField
                            label="이메일"
                            type="email"
                            value={editFormData.email}
                            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="성"
                            value={editFormData.last_name}
                            onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                            fullWidth
                        />
                        <TextField
                            label="이름"
                            value={editFormData.first_name}
                            onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                            fullWidth
                        />
                        <FormControl fullWidth>
                            <InputLabel>활성 상태</InputLabel>
                            <Select
                                value={editFormData.is_active}
                                label="활성 상태"
                                onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.value })}
                            >
                                <MenuItem value={true}>활성</MenuItem>
                                <MenuItem value={false}>비활성</MenuItem>
                            </Select>
                        </FormControl>

                        <FormControl component="fieldset" variant="standard">
                            <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                                권한 설정 (복수 선택 가능)
                            </FormLabel>
                            <FormGroup>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={editFormData.roles.includes('ADMIN')}
                                            onChange={() => handleRoleCheckboxChange('ADMIN')}
                                            color="error"
                                        />
                                    }
                                    label="관리자 (ADMIN)"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={editFormData.roles.includes('DOCTOR')}
                                            onChange={() => handleRoleCheckboxChange('DOCTOR')}
                                            color="primary"
                                        />
                                    }
                                    label="의사 (DOCTOR)"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={editFormData.roles.includes('NURSE')}
                                            onChange={() => handleRoleCheckboxChange('NURSE')}
                                            color="secondary"
                                        />
                                    }
                                    label="간호사 (NURSE)"
                                />
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={editFormData.roles.includes('PATIENT')}
                                            onChange={() => handleRoleCheckboxChange('PATIENT')}
                                            color="default"
                                        />
                                    }
                                    label="환자 (PATIENT)"
                                />
                            </FormGroup>
                            {editFormData.roles.length > 0 && (
                                <Alert severity="info" sx={{ mt: 1 }}>
                                    선택된 권한: {editFormData.roles.map(r => getRoleLabel(r)).join(', ')}
                                </Alert>
                            )}
                            {editFormData.roles.length === 0 && (
                                <Alert severity="warning" sx={{ mt: 1 }}>
                                    최소 1개 이상의 권한을 선택해주세요.
                                </Alert>
                            )}
                        </FormControl>
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenEditDialog(false)}>취소</Button>
                    <Button
                        onClick={handleSaveEdit}
                        variant="contained"
                        color="primary"
                        disabled={editFormData.roles.length === 0}
                    >
                        저장
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
                <DialogTitle>사용자 삭제 확인</DialogTitle>
                <DialogContent>
                    <Typography>
                        정말로 사용자 <strong>{userToDelete?.username}</strong>을(를) 삭제하시겠습니까?
                    </Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        이 작업은 되돌릴 수 없습니다.
                    </Alert>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDeleteDialog(false)}>취소</Button>
                    <Button onClick={confirmDeleteUser} variant="contained" color="error">
                        삭제
                    </Button>
                </DialogActions>
            </Dialog>
        </DashboardLayout>
    );
};

export default AdminUsersPage;
