import { useEffect } from 'react';
import { safeBlur, fixAriaHiddenConflict } from '../utils/focusManager';

/**
 * 페이지 언마운트 시 포커스 자동 정리 훅
 * @param {boolean} autoFix - 자동으로 aria-hidden 충돌 수정 여부
 */
export const useFocusCleanup = (autoFix = true) => {
    useEffect(() => {
        // 마운트 시 충돌 체크 및 수정
        if (autoFix) {
            fixAriaHiddenConflict();
        }

        // 언마운트 시 포커스 정리
        return () => {
            safeBlur();
        };
    }, [autoFix]);
};

/**
 * 페이지 전환 시 포커스 관리
 */
export const usePageFocusManager = () => {
    useEffect(() => {
        // 페이지 진입 시 충돌 수정
        const hasConflict = fixAriaHiddenConflict();

        if (hasConflict) {
            console.log('[Page] Fixed aria-hidden conflict on mount');
        }

        // 페이지 나갈 때 포커스 정리
        return () => {
            safeBlur();
        };
    }, []);

    // 포커스 이벤트 감지
    useEffect(() => {
        const handleFocusIn = (event) => {
            // 포커스가 aria-hidden 요소로 들어가는 것 방지
            if (event.target && event.target.closest && event.target.closest('[aria-hidden="true"]')) {
                console.warn('[FocusManager] Prevented focus on aria-hidden element');
                event.target.blur();
            }
        };

        document.addEventListener('focusin', handleFocusIn, true);

        return () => {
            document.removeEventListener('focusin', handleFocusIn, true);
        };
    }, []);
};
