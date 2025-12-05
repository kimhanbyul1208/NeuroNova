import React, { useEffect, useRef } from 'react';
import { Modal } from '@mui/material';
import { safeBlur } from '../utils/focusManager';

/**
 * 접근성이 개선된 Modal 래퍼
 * aria-hidden 충돌을 방지하고 포커스를 올바르게 관리합니다.
 */
const AccessibleModal = ({
    open,
    onClose,
    children,
    restoreFocus = true,
    ...props
}) => {
    const previousFocus = useRef(null);

    // Modal 열릴 때 현재 포커스 저장
    useEffect(() => {
        if (open) {
            previousFocus.current = document.activeElement;
        }
    }, [open]);

    const handleClose = (...args) => {
        // Modal 닫기 전 내부 포커스 제거
        safeBlur();

        // onClose 호출
        if (onClose) {
            onClose(...args);
        }

        // 이전 포커스 복원
        if (restoreFocus && previousFocus.current) {
            setTimeout(() => {
                if (previousFocus.current && typeof previousFocus.current.focus === 'function') {
                    try {
                        previousFocus.current.focus();
                    } catch (e) {
                        console.warn('[AccessibleModal] Failed to restore focus:', e);
                    }
                }
            }, 50);
        }
    };

    return (
        <Modal
            open={open}
            onClose={handleClose}
            // aria-hidden 대신 적절한 ARIA 속성 사용
            aria-modal="true"
            // 포커스 트랩 활성화
            disableEnforceFocus={false}
            // Backdrop 클릭 시 포커스 정리
            onBackdropClick={handleClose}
            {...props}
        >
            {children}
        </Modal>
    );
};

export default AccessibleModal;
