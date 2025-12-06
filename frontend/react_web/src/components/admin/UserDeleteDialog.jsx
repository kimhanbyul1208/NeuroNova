import React from 'react';
import PropTypes from 'prop-types';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Alert
} from '@mui/material';

/**
 * 사용자 삭제 확인 다이얼로그
 * 사용자 삭제 시 확인 메시지 표시
 */
const UserDeleteDialog = ({ open, user, onClose, onConfirm }) => {
    const handleConfirm = () => {
        onConfirm(user.id);
        onClose();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            className="user-delete-dialog"
        >
            <DialogTitle className="user-delete-dialog-title">사용자 삭제 확인</DialogTitle>
            <DialogContent className="user-delete-dialog-content">
                <Typography>
                    정말로 사용자 <strong className="user-delete-username">{user?.username}</strong>을(를) 삭제하시겠습니까?
                </Typography>
                <Alert severity="warning" sx={{ mt: 2 }} className="user-delete-warning">
                    이 작업은 되돌릴 수 없습니다.
                </Alert>
            </DialogContent>
            <DialogActions className="user-delete-dialog-actions">
                <Button onClick={onClose} className="user-delete-cancel">취소</Button>
                <Button
                    onClick={handleConfirm}
                    variant="contained"
                    color="error"
                    className="user-delete-confirm"
                >
                    삭제
                </Button>
            </DialogActions>
        </Dialog>
    );
};

UserDeleteDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    user: PropTypes.shape({
        id: PropTypes.number,
        username: PropTypes.string
    }),
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired
};

export default UserDeleteDialog;
