import React, { useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
    Chip,
    Stack,
    IconButton,
    Tooltip
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { ROLE_LABELS, ROLE_COLORS } from '../../utils/userManagementConstants';

/**
 * 사용자 테이블 컴포넌트
 * 사용자 목록을 테이블 형태로 표시
 */
const UserTable = ({ users, onEdit, onDelete, onActivate, onDeactivate }) => {
    const getRoleLabel = useCallback((role) => ROLE_LABELS[role] || role, []);
    const getRoleColor = useCallback((role) => ROLE_COLORS[role] || 'default', []);

    return (
        <TableContainer className="user-table-container">
            <Table className="user-table">
                <TableHead>
                    <TableRow className="user-table-header">
                        <TableCell className="user-table-header-cell"><strong>ID</strong></TableCell>
                        <TableCell className="user-table-header-cell"><strong>사용자명</strong></TableCell>
                        <TableCell className="user-table-header-cell"><strong>이메일</strong></TableCell>
                        <TableCell className="user-table-header-cell"><strong>이름</strong></TableCell>
                        <TableCell className="user-table-header-cell"><strong>직책</strong></TableCell>
                        <TableCell className="user-table-header-cell"><strong>활성 상태</strong></TableCell>
                        <TableCell align="center" className="user-table-header-cell"><strong>관리</strong></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {users.length === 0 ? (
                        <TableRow className="user-table-empty-row">
                            <TableCell colSpan={7} align="center">
                                <Typography color="text.secondary">검색 결과가 없습니다.</Typography>
                            </TableCell>
                        </TableRow>
                    ) : (
                        users.map((user) => (
                            <TableRow
                                key={user.id}
                                hover
                                className={`user-table-row user-row-${user.id}`}
                            >
                                <TableCell className="user-cell-id">{user.id}</TableCell>
                                <TableCell className="user-cell-username">{user.username}</TableCell>
                                <TableCell className="user-cell-email">{user.email}</TableCell>
                                <TableCell className="user-cell-name">
                                    {user.last_name}{user.first_name}
                                </TableCell>
                                <TableCell className="user-cell-roles">
                                    <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                        {user.roles && user.roles.length > 0 ? (
                                            user.roles.map((role, idx) => (
                                                <Chip
                                                    key={idx}
                                                    label={getRoleLabel(role)}
                                                    color={getRoleColor(role)}
                                                    size="small"
                                                    sx={{ mb: 0.5 }}
                                                    className={`user-role-chip role-chip-${role.toLowerCase()}`}
                                                />
                                            ))
                                        ) : (
                                            <Chip
                                                label={getRoleLabel(user.role || user.profile?.role)}
                                                color={getRoleColor(user.role || user.profile?.role)}
                                                size="small"
                                                className="user-role-chip"
                                            />
                                        )}
                                    </Stack>
                                </TableCell>
                                <TableCell className="user-cell-status">
                                    {user.is_active ? (
                                        <Chip
                                            icon={<CheckCircleIcon />}
                                            label="활성"
                                            color="success"
                                            size="small"
                                            className="user-status-chip status-active"
                                        />
                                    ) : (
                                        <Chip
                                            icon={<CancelIcon />}
                                            label="비활성"
                                            color="error"
                                            size="small"
                                            className="user-status-chip status-inactive"
                                        />
                                    )}
                                </TableCell>
                                <TableCell align="center" className="user-cell-actions">
                                    <Stack direction="row" spacing={1} justifyContent="center">
                                        {user.is_active ? (
                                            <Tooltip title="비활성화">
                                                <IconButton
                                                    color="error"
                                                    size="small"
                                                    onClick={() => onDeactivate(user.id)}
                                                    className="user-action-deactivate"
                                                >
                                                    <CancelIcon />
                                                </IconButton>
                                            </Tooltip>
                                        ) : (
                                            <Tooltip title="활성화">
                                                <IconButton
                                                    color="success"
                                                    size="small"
                                                    onClick={() => onActivate(user.id)}
                                                    className="user-action-activate"
                                                >
                                                    <CheckCircleIcon />
                                                </IconButton>
                                            </Tooltip>
                                        )}
                                        <Tooltip title="수정">
                                            <IconButton
                                                color="primary"
                                                size="small"
                                                onClick={() => onEdit(user)}
                                                className="user-action-edit"
                                            >
                                                <EditIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="삭제">
                                            <IconButton
                                                color="error"
                                                size="small"
                                                onClick={() => onDelete(user)}
                                                className="user-action-delete"
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
    );
};

UserTable.propTypes = {
    users: PropTypes.arrayOf(PropTypes.shape({
        id: PropTypes.number.isRequired,
        username: PropTypes.string.isRequired,
        email: PropTypes.string,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        is_active: PropTypes.bool.isRequired,
        role: PropTypes.string,
        roles: PropTypes.arrayOf(PropTypes.string),
        profile: PropTypes.shape({
            role: PropTypes.string
        })
    })).isRequired,
    onEdit: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onActivate: PropTypes.func.isRequired,
    onDeactivate: PropTypes.func.isRequired
};

export default UserTable;
