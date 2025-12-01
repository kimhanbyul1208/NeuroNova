import React from 'react';
import {
    Container,
    Typography,
    Paper,
    List,
    ListItem,
    ListItemText,
    ListItemSecondaryAction,
    Switch,
    Divider,
    Box
} from '@mui/material';

const AdminSettingsPage = () => {
    const [settings, setSettings] = React.useState({
        emailNotifications: true,
        maintenanceMode: false,
        allowRegistration: true,
        debugMode: false
    });

    const handleToggle = (setting) => () => {
        setSettings({ ...settings, [setting]: !settings[setting] });
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                System Settings
            </Typography>

            <Paper sx={{ mt: 2 }}>
                <List>
                    <ListItem>
                        <ListItemText
                            primary="Email Notifications"
                            secondary="Enable system-wide email notifications"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.emailNotifications}
                                onChange={handleToggle('emailNotifications')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />

                    <ListItem>
                        <ListItemText
                            primary="Allow New Registrations"
                            secondary="Allow new users to sign up"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.allowRegistration}
                                onChange={handleToggle('allowRegistration')}
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />

                    <ListItem>
                        <ListItemText
                            primary="Maintenance Mode"
                            secondary="Put the system in maintenance mode (Admin only access)"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.maintenanceMode}
                                onChange={handleToggle('maintenanceMode')}
                                color="error"
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                    <Divider />

                    <ListItem>
                        <ListItemText
                            primary="Debug Mode"
                            secondary="Enable detailed logging and debug views"
                        />
                        <ListItemSecondaryAction>
                            <Switch
                                edge="end"
                                checked={settings.debugMode}
                                onChange={handleToggle('debugMode')}
                                color="warning"
                            />
                        </ListItemSecondaryAction>
                    </ListItem>
                </List>
            </Paper>

            <Box sx={{ mt: 2, p: 2, bgcolor: '#fff3e0', borderRadius: 1 }}>
                <Typography variant="body2" color="warning.main">
                    Note: These settings are currently client-side only for demonstration.
                </Typography>
            </Box>
        </Container>
    );
};

export default AdminSettingsPage;
