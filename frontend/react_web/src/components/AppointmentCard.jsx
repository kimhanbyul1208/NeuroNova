import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton
} from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { format } from 'date-fns';
import { APPOINTMENT_STATUS } from '../utils/config';

/**
 * 예약 카드 컴포넌트
 * @param {Object} props
 * @param {Object} props.appointment - 예약 정보 객체
 * @param {Function} props.onApprove - 승인 콜백 함수
 * @param {Function} props.onReject - 거부 콜백 함수
 * @param {boolean} props.showActions - 액션 버튼 표시 여부
 */
const AppointmentCard = ({
  appointment,
  onApprove = null,
  onReject = null,
  showActions = false
}) => {
  // 상태별 색상 및 라벨
  const getStatusConfig = (status) => {
    const configs = {
      [APPOINTMENT_STATUS.PENDING]: { color: 'warning', label: '대기' },
      [APPOINTMENT_STATUS.CONFIRMED]: { color: 'success', label: '확정' },
      [APPOINTMENT_STATUS.CANCELLED]: { color: 'error', label: '취소' },
      [APPOINTMENT_STATUS.NO_SHOW]: { color: 'default', label: '미방문' },
      [APPOINTMENT_STATUS.COMPLETED]: { color: 'info', label: '완료' },
    };
    return configs[status] || { color: 'default', label: status };
  };

  const statusConfig = getStatusConfig(appointment.status);

  // 날짜 및 시간 포맷팅
  const scheduledDate = appointment.scheduled_at
    ? format(new Date(appointment.scheduled_at), 'yyyy-MM-dd')
    : '-';
  const scheduledTime = appointment.scheduled_at
    ? format(new Date(appointment.scheduled_at), 'HH:mm')
    : '-';

  // 방문 유형 라벨
  const getVisitTypeLabel = (type) => {
    const labels = {
      'FIRST_VISIT': '초진',
      'FOLLOW_UP': '재진',
      'CHECK_UP': '검진',
    };
    return labels[type] || type;
  };

  return (
    <Card sx={{ minWidth: 275, marginBottom: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <Typography variant="h6" component="div">
            예약 #{appointment.id}
          </Typography>
          <Chip
            label={statusConfig.label}
            color={statusConfig.color}
            size="small"
          />
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EventIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {scheduledDate}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              {scheduledTime} ({appointment.duration_minutes || 30}분)
            </Typography>
          </Box>

          {appointment.patient_name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                환자: {appointment.patient_name}
              </Typography>
            </Box>
          )}

          {appointment.doctor_name && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                담당의: {" "}
                {(() => {
                  const parts = appointment.doctor_name.split(" ");
                  return parts.length === 2 ? `${parts[1]}${parts[0]}` : appointment.doctor_name;
                })()}
              </Typography>
            </Box>
          )}

          {appointment.visit_type && (
            <Chip
              label={getVisitTypeLabel(appointment.visit_type)}
              size="small"
              variant="outlined"
              sx={{ width: 'fit-content' }}
            />
          )}

          {appointment.reason && (
            <Typography variant="body2" color="text.secondary">
              사유: {appointment.reason}
            </Typography>
          )}
        </Box>
      </CardContent>

      {showActions && appointment.status === APPOINTMENT_STATUS.PENDING && (
        <CardActions sx={{ justifyContent: 'flex-end' }}>
          {onReject && (
            <Button
              size="small"
              color="error"
              startIcon={<CancelIcon />}
              onClick={() => onReject(appointment.id)}
            >
              거부
            </Button>
          )}
          {onApprove && (
            <Button
              size="small"
              color="success"
              startIcon={<CheckCircleIcon />}
              onClick={() => onApprove(appointment.id)}
            >
              승인
            </Button>
          )}
        </CardActions>
      )}
    </Card>
  );
};

export default AppointmentCard;
