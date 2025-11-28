import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Grid,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { LoadingSpinner, ErrorAlert } from '../components';
import axiosClient from '../api/axios';
import { API_ENDPOINTS, API_CONFIG } from '../utils/config';

/**
 * DICOM 뷰어 페이지
 * Orthanc 서버와 통합하여 의료 영상 표시
 */
const DicomViewerPage = () => {
  const { studyId } = useParams();
  const navigate = useNavigate();
  const [studyInfo, setStudyInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Orthanc 서버 URL (환경 변수 또는 config에서 가져와야 함)
  const orthancUrl = API_CONFIG.ORTHANC_URL || 'http://localhost:8042';

  useEffect(() => {
    const fetchStudyInfo = async () => {
      try {
        setLoading(true);
        setError(null);

        // Orthanc API로 Study 정보 가져오기
        const response = await fetch(`${orthancUrl}/studies/${studyId}`, {
          headers: {
            'Authorization': 'Basic ' + btoa('orthanc:orthanc') // 기본 인증 (실제로는 secure storage 사용)
          }
        });

        if (!response.ok) {
          throw new Error('Study를 불러올 수 없습니다.');
        }

        const data = await response.json();
        setStudyInfo(data);
      } catch (err) {
        setError(err.message || 'DICOM 데이터를 불러오는데 실패했습니다.');
        console.error('Error fetching DICOM study:', err);
      } finally {
        setLoading(false);
      }
    };

    if (studyId) {
      fetchStudyInfo();
    }
  }, [studyId, orthancUrl]);

  // Orthanc Web Viewer URL
  const viewerUrl = `${orthancUrl}/app/explorer.html#study?uuid=${studyId}`;

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ marginTop: 4 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ marginBottom: 2 }}
        >
          뒤로 가기
        </Button>
        <ErrorAlert
          message={error}
          title="DICOM 로딩 오류"
          onRetry={() => window.location.reload()}
        />
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ marginTop: 2, marginBottom: 2 }}>
      {/* 헤더 */}
      <Box sx={{ marginBottom: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
        >
          뒤로 가기
        </Button>
        <Typography variant="h5" component="h1">
          DICOM 뷰어
        </Typography>
        <Box sx={{ width: 100 }} /> {/* Spacer for centering */}
      </Box>

      {/* Study 정보 */}
      {studyInfo && (
        <Paper sx={{ padding: 2, marginBottom: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Study ID
              </Typography>
              <Typography variant="body1">{studyInfo.ID || '-'}</Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Patient ID
              </Typography>
              <Typography variant="body1">
                {studyInfo.MainDicomTags?.PatientID || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Study Date
              </Typography>
              <Typography variant="body1">
                {studyInfo.MainDicomTags?.StudyDate || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Typography variant="body2" color="text.secondary">
                Modality
              </Typography>
              <Chip
                label={studyInfo.MainDicomTags?.ModalitiesInStudy || 'Unknown'}
                size="small"
                color="primary"
              />
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">
                Study Description
              </Typography>
              <Typography variant="body1">
                {studyInfo.MainDicomTags?.StudyDescription || '-'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* DICOM Viewer iframe */}
      <Paper sx={{ padding: 0, height: 'calc(100vh - 250px)', overflow: 'hidden' }}>
        <iframe
          src={viewerUrl}
          title="DICOM Viewer"
          width="100%"
          height="100%"
          style={{
            border: 'none',
            display: 'block'
          }}
        />
      </Paper>

      {/* 안내 메시지 */}
      <Box sx={{ marginTop: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          Orthanc Web Viewer를 사용하여 DICOM 영상을 표시합니다.
        </Typography>
        <Typography variant="body2" color="text.secondary">
          더 나은 시각화를 위해 OHIF Viewer 또는 Cornerstone.js 통합을 권장합니다.
        </Typography>
      </Box>
    </Container>
  );
};

export default DicomViewerPage;
