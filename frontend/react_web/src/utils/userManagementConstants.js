/**
 * User Management Constants
 * 사용자 관리 페이지에서 사용되는 상수들
 */

export const USER_ROLES = {
    ADMIN: 'ADMIN',
    DOCTOR: 'DOCTOR',
    NURSE: 'NURSE',
    PATIENT: 'PATIENT'
};

export const ROLE_LABELS = {
    [USER_ROLES.ADMIN]: '관리자',
    [USER_ROLES.DOCTOR]: '의사',
    [USER_ROLES.NURSE]: '간호사',
    [USER_ROLES.PATIENT]: '환자'
};

export const ROLE_COLORS = {
    [USER_ROLES.ADMIN]: 'error',
    [USER_ROLES.DOCTOR]: 'primary',
    [USER_ROLES.NURSE]: 'secondary',
    [USER_ROLES.PATIENT]: 'default'
};

export const ALL_ROLES = Object.values(USER_ROLES);

export const DEFAULT_PAGINATION = {
    PAGE: 0,
    ROWS_PER_PAGE: 10
};

export const ACTIVE_STATUS = {
    ACTIVE: true,
    INACTIVE: false
};

export const ACTIVE_STATUS_LABELS = {
    [ACTIVE_STATUS.ACTIVE]: '활성',
    [ACTIVE_STATUS.INACTIVE]: '비활성'
};
