import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Stack,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    FormControlLabel,
    Checkbox,
    FormGroup,
    FormLabel,
    Alert
} from '@mui/material';
import { USER_ROLES, ROLE_LABELS } from '../../utils/userManagementConstants';

/**
 * 사용자 정보 수정 다이얼로그
 * 사용자 정보 편집 및 권한 관리
 */
const UserEditDialog = ({ open, user, onClose, onSave }) => {
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        is_active: true,
        is_staff: false,
        role: 'PATIENT',
        roles: []
    });

    useEffect(() => {
        if (user) {
            const currentRole = user.role || user.profile?.role || 'PATIENT';
            const initialRoles = user.roles || [currentRole];

            setFormData({
                username: user.username,
                email: user.email,
                first_name: user.first_name || '',
                last_name: user.last_name || '',
                is_active: user.is_active,
                is_staff: user.is_staff || false,
                role: currentRole,
                roles: initialRoles
            });
        }
    }, [user]);

    const handleRoleCheckboxChange = (role) => {
        setFormData(prev => {
            const newRoles = prev.roles.includes(role)
                ? prev.roles.filter(r => r !== role)
                : [...prev.roles, role];

            return {
                ...prev,
                roles: newRoles,
                role: newRoles.length > 0 ? newRoles[0] : 'PATIENT'
            };
        });
    };

    const handleSave = () => {
        onSave(user.id, formData);
        onClose();
    };

    const handleFieldChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            className="user-edit-dialog"
        >
            <DialogTitle className="user-edit-dialog-title">사용자 정보 수정</DialogTitle>
            <DialogContent className="user-edit-dialog-content">
                <Stack spacing={2} sx={{ mt: 2 }}>
                    <TextField
                        label="사용자명"
                        value={formData.username}
                        onChange={(e) => handleFieldChange('username', e.target.value)}
                        fullWidth
                        disabled
                        className="user-edit-field user-edit-username"
                    />
                    <TextField
                        label="이메일"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleFieldChange('email', e.target.value)}
                        fullWidth
                        className="user-edit-field user-edit-email"
                    />
                    <TextField
                        label="성"
                        value={formData.last_name}
                        onChange={(e) => handleFieldChange('last_name', e.target.value)}
                        fullWidth
                        className="user-edit-field user-edit-lastname"
                    />
                    <TextField
                        label="이름"
                        value={formData.first_name}
                        onChange={(e) => handleFieldChange('first_name', e.target.value)}
                        fullWidth
                        className="user-edit-field user-edit-firstname"
                    />
                    <FormControl fullWidth className="user-edit-field user-edit-status">
                        <InputLabel>활성 상태</InputLabel>
                        <Select
                            value={formData.is_active}
                            label="활성 상태"
                            onChange={(e) => handleFieldChange('is_active', e.target.value)}
                        >
                            <MenuItem value={true}>활성</MenuItem>
                            <MenuItem value={false}>비활성</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl component="fieldset" variant="standard" className="user-edit-roles">
                        <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600 }}>
                            권한 설정 (복수 선택 가능)
                        </FormLabel>
                        <FormGroup>
                            {Object.entries(USER_ROLES).map(([key, role]) => (
                                <FormControlLabel
                                    key={role}
                                    className={`user-edit-role-checkbox role-checkbox-${role.toLowerCase()}`}
                                    control={
                                        <Checkbox
                                            checked={formData.roles.includes(role)}
                                            onChange={() => handleRoleCheckboxChange(role)}
                                            color={
                                                role === 'ADMIN' ? 'error' :
                                                role === 'DOCTOR' ? 'primary' :
                                                role === 'NURSE' ? 'secondary' : 'default'
                                            }
                                        />
                                    }
                                    label={`${ROLE_LABELS[role]} (${role})`}
                                />
                            ))}
                        </FormGroup>
                        {formData.roles.length > 0 && (
                            <Alert severity="info" sx={{ mt: 1 }} className="user-edit-roles-info">
                                선택된 권한: {formData.roles.map(r => ROLE_LABELS[r]).join(', ')}
                            </Alert>
                        )}
                        {formData.roles.length === 0 && (
                            <Alert severity="warning" sx={{ mt: 1 }} className="user-edit-roles-warning">
                                최소 1개 이상의 권한을 선택해주세요.
                            </Alert>
                        )}
                    </FormControl>
                </Stack>
            </DialogContent>
            <DialogActions className="user-edit-dialog-actions">
                <Button onClick={onClose} className="user-edit-cancel">취소</Button>
                <Button
                    onClick={handleSave}
                    variant="contained"
                    color="primary"
                    disabled={formData.roles.length === 0}
                    className="user-edit-save"
                >
                    저장
                </Button>
            </DialogActions>
        </Dialog>
    );
};

UserEditDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    user: PropTypes.shape({
        id: PropTypes.number,
        username: PropTypes.string,
        email: PropTypes.string,
        first_name: PropTypes.string,
        last_name: PropTypes.string,
        is_active: PropTypes.bool,
        is_staff: PropTypes.bool,
        role: PropTypes.string,
        roles: PropTypes.arrayOf(PropTypes.string),
        profile: PropTypes.shape({
            role: PropTypes.string
        })
    }),
    onClose: PropTypes.func.isRequired,
    onSave: PropTypes.func.isRequired
};

export default UserEditDialog;
