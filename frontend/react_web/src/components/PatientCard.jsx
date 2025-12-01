import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  Avatar
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import CakeIcon from '@mui/icons-material/Cake';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

/**
 * 환자 카드 컴포넌트
 * @param {Object} props
 * @param {Object} props.patient - 환자 정보 객체
 */
const PatientCard = ({ patient, onDelete }) => {
  const navigate = useNavigate();

  const handleViewDetail = () => {
    navigate(`/patients/${patient.id}`);
  };

  const handleDelete = () => {
    if (window.confirm('정말로 이 환자를 삭제하시겠습니까?')) {
      onDelete(patient.id);
    }
  };

  // 성별 표시
  const genderLabel = patient.gender === 'M' ? '남성' : '여성';
  const genderColor = patient.gender === 'M' ? 'primary' : 'secondary';

  // 생년월일 포맷팅
  const formattedDOB = patient.date_of_birth
    ? format(new Date(patient.date_of_birth), 'yyyy-MM-dd')
    : '-';

  return (
    <Card sx={{ minWidth: 275, marginBottom: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', marginBottom: 2 }}>
          <Avatar sx={{ marginRight: 2, bgcolor: genderColor + '.main' }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" component="div">
              {patient.last_name}{patient.first_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              환자번호: {patient.pid}
            </Typography>
          </Box>
          <Box sx={{ marginLeft: 'auto' }}>
            <Chip
              label={genderLabel}
              color={genderColor}
              size="small"
            />
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CakeIcon fontSize="small" color="action" />
            <Typography variant="body2" color="text.secondary">
              생년월일: {formattedDOB}
            </Typography>
          </Box>

          {patient.phone && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PhoneIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {patient.phone}
              </Typography>
            </Box>
          )}

          {patient.email && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {patient.email}
              </Typography>
            </Box>
          )}

          {patient.insurance_id && (
            <Typography variant="body2" color="text.secondary">
              보험번호: {patient.insurance_id}
            </Typography>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between' }}>
        <Button size="small" onClick={handleViewDetail}>
          상세보기
        </Button>
        {onDelete && (
          <Button size="small" color="error" onClick={handleDelete}>
            삭제
          </Button>
        )}
      </CardActions>
    </Card>
  );
};

export default PatientCard;
