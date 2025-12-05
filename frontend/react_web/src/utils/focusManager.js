/**
 * 포커스 관리 유틸리티
 * aria-hidden과 포커스 충돌을 감지하고 수정
 */

/**
 * aria-hidden 속성을 가진 조상 요소 확인
 */
export const hasAriaHiddenAncestor = (element) => {
    if (!element || element === document.body) return false;

    if (element.getAttribute('aria-hidden') === 'true') {
        return true;
    }

    return hasAriaHiddenAncestor(element.parentElement);
};

/**
 * 현재 포커스된 요소가 aria-hidden 내부에 있는지 확인
 */
export const isFocusTrapped = () => {
    const activeElement = document.activeElement;

    if (!activeElement || activeElement === document.body) {
        return false;
    }

    return hasAriaHiddenAncestor(activeElement);
};

/**
 * 안전하게 포커스 제거
 */
export const safeBlur = () => {
    const activeElement = document.activeElement;

    if (activeElement && activeElement !== document.body && typeof activeElement.blur === 'function') {
        console.log('[FocusManager] Blurring element:', activeElement);
        activeElement.blur();
    }
};

/**
 * aria-hidden 충돌 자동 수정
 */
export const fixAriaHiddenConflict = () => {
    if (isFocusTrapped()) {
        console.warn('[FocusManager] Focus trapped in aria-hidden element. Auto-fixing...');
        safeBlur();
        return true;
    }
    return false;
};

/**
 * 주기적으로 포커스 충돌 감지 (개발 모드용)
 */
export const startFocusMonitoring = (interval = 1000) => {
    if (process.env.NODE_ENV !== 'development') return null;

    const intervalId = setInterval(() => {
        if (isFocusTrapped()) {
            console.error('[FocusManager] ⚠️ aria-hidden conflict detected!');
            console.log('Active element:', document.activeElement);
            const hiddenParent = document.activeElement?.closest('[aria-hidden="true"]');
            if (hiddenParent) {
                console.log('Parent with aria-hidden:', hiddenParent);
            }
        }
    }, interval);

    return () => clearInterval(intervalId);
};
