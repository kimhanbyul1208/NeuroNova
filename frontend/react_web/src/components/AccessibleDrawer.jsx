import React, { useEffect } from 'react';
import { Drawer } from '@mui/material';
import { safeBlur, fixAriaHiddenConflict } from '../utils/focusManager';

/**
 * 접근성이 개선된 Drawer 래퍼
 * aria-hidden 충돌을 방지하고 포커스를 올바르게 관리합니다.
 */
const AccessibleDrawer = ({
    open,
    onClose,
    children,
    ...props
}) => {
    // Drawer 닫힐 때 포커스 정리
    useEffect(() => {
        if (!open) {
            // Drawer 닫힌 후 포커스 충돌 수정
            const timeoutId = setTimeout(() => {
                fixAriaHiddenConflict();
            }, 300); // MUI 애니메이션 시간

            return () => clearTimeout(timeoutId);
        }
    }, [open]);

    const handleClose = (...args) => {
        // Drawer 내부 포커스 제거
        safeBlur();

        if (onClose) {
            onClose(...args);
        }
    };

    return (
        <Drawer
            open={open}
            onClose={handleClose}
            // 포커스 관리 속성
            disableEnforceFocus={false}
            disableRestoreFocus={false}
            {...props}
        >
            {children}
        </Drawer>
    );
};

export default AccessibleDrawer;
