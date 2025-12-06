import React from 'react';
import PropTypes from 'prop-types';
import {
    Paper,
    Typography,
    FormGroup,
    FormControlLabel,
    Checkbox,
    Chip
} from '@mui/material';
import { USER_ROLES, ROLE_LABELS, ROLE_COLORS } from '../../utils/userManagementConstants';

/**
 * 역할 필터 컴포넌트
 * 사용자 역할별 필터링을 위한 체크박스 그룹
 */
const RoleFilter = ({ selectedRoles, onRoleToggle }) => {
    const roleList = Object.values(USER_ROLES);

    return (
        <Paper
            sx={{ mb: 3, p: 2, bgcolor: '#f8f9fa' }}
            className="role-filter-container"
            role="region"
            aria-label="사용자 권한 필터"
        >
            <Typography
                variant="subtitle2"
                gutterBottom
                fontWeight={600}
                className="role-filter-title"
                id="role-filter-label"
            >
                권한 필터
            </Typography>
            <FormGroup row aria-labelledby="role-filter-label">
                {roleList.map((role) => (
                    <FormControlLabel
                        key={role}
                        className={`role-filter-item role-filter-${role.toLowerCase()}`}
                        control={
                            <Checkbox
                                checked={selectedRoles.includes(role)}
                                onChange={() => onRoleToggle(role)}
                                size="small"
                                color={ROLE_COLORS[role]}
                                className={`role-checkbox role-checkbox-${role.toLowerCase()}`}
                            />
                        }
                        label={
                            <Chip
                                label={ROLE_LABELS[role]}
                                size="small"
                                color={ROLE_COLORS[role]}
                                variant={selectedRoles.includes(role) ? "filled" : "outlined"}
                                sx={{ minWidth: 60, cursor: 'pointer' }}
                                onClick={() => onRoleToggle(role)}
                                className={`role-chip role-chip-${role.toLowerCase()}`}
                            />
                        }
                        sx={{ mr: 2 }}
                    />
                ))}
            </FormGroup>
        </Paper>
    );
};

RoleFilter.propTypes = {
    selectedRoles: PropTypes.arrayOf(PropTypes.string).isRequired,
    onRoleToggle: PropTypes.func.isRequired
};

export default RoleFilter;
