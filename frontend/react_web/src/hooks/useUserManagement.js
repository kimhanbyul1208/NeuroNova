import { useState, useEffect } from 'react';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { ALL_ROLES, DEFAULT_PAGINATION } from '../utils/userManagementConstants';

/**
 * 사용자 관리 커스텀 훅
 * 사용자 목록 조회, 검색, 필터링, CRUD 작업을 처리합니다.
 */
export const useUserManagement = () => {
    // Data State
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');

    // Pagination
    const [page, setPage] = useState(DEFAULT_PAGINATION.PAGE);
    const [rowsPerPage, setRowsPerPage] = useState(DEFAULT_PAGINATION.ROWS_PER_PAGE);
    const [totalCount, setTotalCount] = useState(0);

    // Search & Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedRoles, setSelectedRoles] = useState([...ALL_ROLES]);

    // Applied Filters (Trigger for API call)
    const [appliedFilters, setAppliedFilters] = useState({
        search: '',
        roles: [...ALL_ROLES]
    });

    // Fetch users when filters change
    useEffect(() => {
        fetchUsers();
    }, [page, rowsPerPage, appliedFilters]);

    /**
     * 사용자 목록 조회
     */
    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);

            const params = {
                page: page + 1, // API is 1-indexed, MUI is 0-indexed
                page_size: rowsPerPage,
            };

            if (appliedFilters.search) {
                params.search = appliedFilters.search;
            }

            if (appliedFilters.roles.length > 0) {
                params.roles = appliedFilters.roles.join(',');
            }

            const response = await axiosClient.get(API_ENDPOINTS.USERS, { params });

            if (response.data.results) {
                setUsers(response.data.results);
                setTotalCount(response.data.total_count || response.data.count || 0);
            } else if (Array.isArray(response.data)) {
                setUsers(response.data);
                setTotalCount(response.data.length);
            }

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

    /**
     * 검색 및 필터 적용
     */
    const handleSearch = () => {
        setAppliedFilters({
            search: searchTerm,
            roles: selectedRoles
        });
        setPage(0);
    };

    /**
     * 역할 필터 토글
     */
    const handleRoleFilterToggle = (role) => {
        setSelectedRoles(prev => {
            if (prev.includes(role)) {
                return prev.filter(r => r !== role);
            } else {
                return [...prev, role];
            }
        });
    };

    /**
     * 사용자 활성화
     */
    const activateUser = async (userId) => {
        try {
            await axiosClient.post(`${API_ENDPOINTS.USERS}${userId}/activate/`);
            setSuccess('사용자가 활성화되었습니다.');
            fetchUsers();
        } catch (err) {
            console.error('Error activating user:', err);
            setError('사용자 활성화에 실패했습니다.');
        }
    };

    /**
     * 사용자 비활성화
     */
    const deactivateUser = async (userId) => {
        try {
            await axiosClient.post(`${API_ENDPOINTS.USERS}${userId}/deactivate/`);
            setSuccess('사용자가 비활성화되었습니다.');
            fetchUsers();
        } catch (err) {
            console.error('Error deactivating user:', err);
            setError('사용자 비활성화에 실패했습니다.');
        }
    };

    /**
     * 사용자 정보 수정
     */
    const updateUser = async (userId, userData) => {
        try {
            await axiosClient.patch(`${API_ENDPOINTS.USERS}${userId}/`, userData);
            setSuccess('사용자 정보가 수정되었습니다.');
            fetchUsers();
        } catch (err) {
            console.error('Error updating user:', err);
            setError('사용자 정보 수정에 실패했습니다.');
            throw err;
        }
    };

    /**
     * 사용자 삭제
     */
    const deleteUser = async (userId) => {
        try {
            await axiosClient.delete(`${API_ENDPOINTS.USERS}${userId}/`);
            setSuccess('사용자가 삭제되었습니다.');
            fetchUsers();
        } catch (err) {
            console.error('Error deleting user:', err);
            setError('사용자 삭제에 실패했습니다.');
            throw err;
        }
    };

    /**
     * 페이지 변경
     */
    const handlePageChange = (event, newPage) => {
        setPage(newPage);
    };

    /**
     * 페이지당 행 수 변경
     */
    const handleRowsPerPageChange = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    return {
        // State
        users,
        loading,
        error,
        success,
        page,
        rowsPerPage,
        totalCount,
        searchTerm,
        selectedRoles,

        // Actions
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
        handleRowsPerPageChange,
        refreshUsers: fetchUsers
    };
};
