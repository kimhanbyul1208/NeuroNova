import { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Box,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    IconButton,
    Chip,
    Tabs,
    Tab,
    Badge,
} from '@mui/material';
import {
    Notifications as NotificationsIcon,
    Delete as DeleteIcon,
    CheckCircle as CheckCircleIcon,
    Info as InfoIcon,
    Warning as WarningIcon,
    Error as ErrorIcon,
} from '@mui/icons-material';
import axiosClient from '../api/axios';
import { API_ENDPOINTS } from '../utils/config';
import { LoadingSpinner, ErrorAlert } from '../components';

/**
 * Notification Center Page
 * 알림 목록 조회, 읽음 처리, 삭제
 */
const NotificationCenterPage = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [currentTab, setCurrentTab] = useState(0); // 0: All, 1: Unread, 2: Read

    useEffect(() => {
        fetchNotifications();
    }, []);

    const fetchNotifications = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await axiosClient.get(API_ENDPOINTS.NOTIFICATIONS);
            setNotifications(response.data.results || response.data);
        } catch (err) {
            setError(err.response?.data?.message || '알림을 불러오는데 실패했습니다.');
        } finally {
            setLoading(false);
        }
    };

    const handleMarkAsRead = async (id) => {
        try {
            await axiosClient.patch(`${API_ENDPOINTS.NOTIFICATIONS}${id}/`, {
                is_read: true,
            });
            setNotifications(
                notifications.map((notif) =>
                    notif.id === id ? { ...notif, is_read: true } : notif
                )
            );
        } catch (err) {
            setError('알림을 읽음 처리하는데 실패했습니다.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await axiosClient.delete(`${API_ENDPOINTS.NOTIFICATIONS}${id}/`);
            setNotifications(notifications.filter((notif) => notif.id !== id));
        } catch (err) {
            setError('알림 삭제에 실패했습니다.');
        }
    };

    const handleTabChange = (event, newValue) => {
        setCurrentTab(newValue);
    };

    const getFilteredNotifications = () => {
        switch (currentTab) {
            case 1: // Unread
                return notifications.filter((n) => !n.is_read);
            case 2: // Read
                return notifications.filter((n) => n.is_read);
            default: // All
                return notifications;
        }
    };

    const getNotificationIcon = (type) => {
        switch (type) {
            case 'SUCCESS':
                return <CheckCircleIcon color="success" />;
            case 'WARNING':
                return <WarningIcon color="warning" />;
            case 'ERROR':
                return <ErrorIcon color="error" />;
            default:
                return <InfoIcon color="info" />;
        }
    };

    const unreadCount = notifications.filter((n) => !n.is_read).length;

    if (loading) {
        return <LoadingSpinner fullScreen />;
    }

    const filteredNotifications = getFilteredNotifications();

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Box sx={{ mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Badge badgeContent={unreadCount} color="error">
                    <NotificationsIcon fontSize="large" />
                </Badge>
                <Typography variant="h4" component="h1">
                    알림 센터
                </Typography>
            </Box>

            {error && <ErrorAlert message={error} onRetry={fetchNotifications} sx={{ mb: 3 }} />}

            <Paper sx={{ mb: 2 }}>
                <Tabs value={currentTab} onChange={handleTabChange} variant="fullWidth">
                    <Tab label={`전체 (${notifications.length})`} />
                    <Tab label={`읽지 않음 (${unreadCount})`} />
                    <Tab label={`읽음 (${notifications.length - unreadCount})`} />
                </Tabs>
            </Paper>

            <Paper>
                {filteredNotifications.length === 0 ? (
                    <Box sx={{ p: 4, textAlign: 'center' }}>
                        <NotificationsIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="body1" color="text.secondary">
                            {currentTab === 1 ? '읽지 않은 알림이 없습니다.' : '알림이 없습니다.'}
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {filteredNotifications.map((notification, index) => (
                            <ListItem
                                key={notification.id}
                                divider={index < filteredNotifications.length - 1}
                                sx={{
                                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                                    '&:hover': {
                                        bgcolor: 'action.selected',
                                    },
                                }}
                                secondaryAction={
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDelete(notification.id)}
                                        color="error"
                                    >
                                        <DeleteIcon />
                                    </IconButton>
                                }
                            >
                                <ListItemIcon>{getNotificationIcon(notification.type)}</ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography
                                                variant="body1"
                                                sx={{ fontWeight: notification.is_read ? 'normal' : 'bold' }}
                                            >
                                                {notification.title}
                                            </Typography>
                                            {!notification.is_read && (
                                                <Chip label="NEW" size="small" color="primary" />
                                            )}
                                        </Box>
                                    }
                                    secondary={
                                        <Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {notification.message}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                {new Date(notification.created_at).toLocaleString('ko-KR')}
                                            </Typography>
                                            {!notification.is_read && (
                                                <Box sx={{ mt: 1 }}>
                                                    <Chip
                                                        label="읽음으로 표시"
                                                        size="small"
                                                        onClick={() => handleMarkAsRead(notification.id)}
                                                        clickable
                                                    />
                                                </Box>
                                            )}
                                        </Box>
                                    }
                                />
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>
        </Container>
    );
};

export default NotificationCenterPage;
