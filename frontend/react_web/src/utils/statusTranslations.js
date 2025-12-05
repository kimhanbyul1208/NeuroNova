/**
 * Status translation utilities
 */

export const APPOINTMENT_STATUS = {
  PENDING: '예약 대기',
  CONFIRMED: '예약 완료',
  CANCELLED: '예약 취소',
  NO_SHOW: '미방문',
  COMPLETED: '진료 완료',
};

export const VISIT_TYPE = {
  FIRST_VISIT: '첫 방문',
  FOLLOW_UP: '재방문',
  CHECK_UP: '검진',
  EMERGENCY: '응급',
};

export const getAppointmentStatusText = (status) => {
  return APPOINTMENT_STATUS[status] || status;
};

export const getVisitTypeText = (visitType) => {
  return VISIT_TYPE[visitType] || visitType;
};

export const getAppointmentStatusColor = (status) => {
  const colors = {
    PENDING: '#ff9800',      // Orange
    CONFIRMED: '#4caf50',    // Green
    CANCELLED: '#f44336',    // Red
    NO_SHOW: '#9e9e9e',      // Gray
    COMPLETED: '#2196f3',    // Blue
  };
  return colors[status] || '#757575';
};
