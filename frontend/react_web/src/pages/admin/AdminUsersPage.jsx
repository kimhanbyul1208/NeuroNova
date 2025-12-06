import React, { useState } from 'react';
import {
    Typography,
    Box,
    Paper,
    TablePagination,
    Alert
} from '@mui/material';
import DashboardLayout from '../../layouts/DashboardLayout';
import { useAuth } from '../../auth/AuthContext';
import { useFocusCleanup } from '../../hooks/useFocusCleanup';
import { useUserManagement } from '../../hooks/useUserManagement';
import {
    RoleFilter,
    UserSearchBar,
    UserTable,
    UserTableSkeleton,
    UserEditDialog,
    UserDeleteDialog
} from '../../components/admin';

/**
 * 관리자 사용자 관리 페이지
 * 사용자 목록 조회, 검색, 필터링, CRUD 작업 제공
 */
const AdminUsersPage = () => {
    const { user } = useAuth();
    useFocusCleanup();

    // 사용자 관리 커스텀 훅 사용
    const {
        users,
        loading,
        error,
        success,
        page,
        rowsPerPage,
        totalCount,
        searchTerm,
        selectedRoles,
        setSearchTerm,
        setError,
        setSuccess,
        handleSearch,
        handleRoleFilterToggle,
        activateUser,
        deactivateUser,
        updateUser,
        deleteUser,
        handlePageChange,
        handleRowsPerPageChange
    } = useUserManagement();

    // Dialog State
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Edit Dialog Handlers
    const handleEditUser = (userData) => {
        setSelectedUser(userData);
        setOpenEditDialog(true);
    };

    const handleSaveEdit = async (userId, formData) => {
        try {
            await updateUser(userId, formData);
            setOpenEditDialog(false);
            setSelectedUser(null);
        } catch (err) {
            // Error is already handled in the hook
        }
    };

    // Delete Dialog Handlers
    const handleDeleteUser = (userData) => {
        setSelectedUser(userData);
        setOpenDeleteDialog(true);
    };

    const handleConfirmDelete = async (userId) => {
        try {
            await deleteUser(userId);
            setOpenDeleteDialog(false);
            setSelectedUser(null);
        } catch (err) {
            // Error is already handled in the hook
        }
    };

    return (
        <DashboardLayout
            role={user?.role}
            activePage="users"
            title="사용자 관리"
            className="admin-users-page"
        >
            <Paper
                sx={{ p: 3, borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}
                className="admin-users-container"
            >
                {/* 페이지 헤더 */}
                <Box
                    sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
                    className="page-header"
                >
                    <Typography variant="h5" fontWeight={600} className="page-title">
                        전체 사용자 관리
                    </Typography>
                </Box>

                {/* 에러/성공 메시지 */}
                {error && (
                    <Alert
                        severity="error"
                        sx={{ mb: 2 }}
                        onClose={() => setError(null)}
                        className="alert-error"
                    >
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert
                        severity="success"
                        sx={{ mb: 2 }}
                        onClose={() => setSuccess('')}
                        className="alert-success"
                    >
                        {success}
                    </Alert>
                )}

                {/* 역할 필터 */}
                <RoleFilter
                    selectedRoles={selectedRoles}
                    onRoleToggle={handleRoleFilterToggle}
                />

                {/* 검색 바 */}
                <UserSearchBar
                    searchTerm={searchTerm}
                    onSearchTermChange={setSearchTerm}
                    onSearch={handleSearch}
                />

                {/* 사용자 테이블 또는 스켈레톤 */}
                {loading ? (
                    <UserTableSkeleton rows={rowsPerPage} />
                ) : (
                    <UserTable
                        users={users}
                        onEdit={handleEditUser}
                        onDelete={handleDeleteUser}
                        onActivate={activateUser}
                        onDeactivate={deactivateUser}
                    />
                )}

                {/* 페이지네이션 */}
                <TablePagination
                    component="div"
                    count={totalCount}
                    page={page}
                    onPageChange={handlePageChange}
                    rowsPerPage={rowsPerPage}
                    onRowsPerPageChange={handleRowsPerPageChange}
                    labelRowsPerPage="페이지당 행 수:"
                    labelDisplayedRows={({ from, to, count }) => `${from}-${to} / 총 ${count}개`}
                    className="user-table-pagination"
                />
            </Paper>

            {/* 사용자 수정 다이얼로그 */}
            <UserEditDialog
                open={openEditDialog}
                user={selectedUser}
                onClose={() => {
                    setOpenEditDialog(false);
                    setSelectedUser(null);
                }}
                onSave={handleSaveEdit}
            />

            {/* 사용자 삭제 확인 다이얼로그 */}
            <UserDeleteDialog
                open={openDeleteDialog}
                user={selectedUser}
                onClose={() => {
                    setOpenDeleteDialog(false);
                    setSelectedUser(null);
                }}
                onConfirm={handleConfirmDelete}
            />
        </DashboardLayout>
    );
};

export default AdminUsersPage;
