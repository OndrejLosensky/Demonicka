import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { 
  Email as EmailIcon, 
  Person as PersonIcon,
  Badge as BadgeIcon,
  Fingerprint as FingerprintIcon,
  CalendarToday as CalendarIcon,
  Update as UpdateIcon,
  Settings as SettingsIcon,
  Palette as PaletteIcon,
  Notifications as NotificationsIcon,
  Language as LanguageIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import translations from '../../locales/cs/profile.json';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`preferences-tabpanel-${index}`}
      aria-labelledby={`preferences-tab-${index}`}
      className="py-4"
    >
      {value === index && children}
    </div>
  );
}

interface PreferencesState {
  theme: string;
  language: string;
  notifications: {
    email: boolean;
    push: boolean;
    updates: boolean;
  };
  display: {
    compactMode: boolean;
    showAvatars: boolean;
    highContrast: boolean;
  };
}

export default function ProfilePage() {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [preferences, setPreferences] = useState<PreferencesState>({
    theme: 'system',
    language: 'cs',
    notifications: {
      email: true,
      push: true,
      updates: false,
    },
    display: {
      compactMode: false,
      showAvatars: true,
      highContrast: false,
    }
  });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePreferenceChange = (
    category: 'notifications' | 'display',
    setting: string
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [setting]: event.target.checked
      }
    }));
  };

  const handleSelectChange = (setting: string) => (event: SelectChangeEvent<string>) => {
    setPreferences(prev => ({
      ...prev,
      [setting]: event.target.value
    }));
  };

  if (!user) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <Box maxWidth="lg" mx="auto" className="space-y-6">
        <Paper className="p-6 rounded-xl shadow-lg">
          <Box display="flex" alignItems="center" gap={4} mb={4}>
            <Avatar
              sx={{
                width: 100,
                height: 100,
                bgcolor: 'primary.main',
                fontSize: '2.5rem',
              }}
            >
              {user.username[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" className="font-bold text-text-primary">
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="subtitle1" className="text-text-secondary">
                {translations.accountInfo}
              </Typography>
              <Chip 
                label={`ID: ${user.id.split('-')[0]}...`} 
                size="small" 
                color="primary" 
                variant="outlined"
                className="mt-2"
              />
            </Box>
          </Box>

          <Divider className="my-4" />

          <List className="space-y-2">
            <ListItem>
              <ListItemIcon>
                <PersonIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={translations.fields.username}
                secondary={user.username}
                primaryTypographyProps={{
                  className: "text-text-secondary font-medium"
                }}
                secondaryTypographyProps={{
                  className: "text-text-primary font-bold"
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <EmailIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={translations.fields.email}
                secondary={user.email}
                primaryTypographyProps={{
                  className: "text-text-secondary font-medium"
                }}
                secondaryTypographyProps={{
                  className: "text-text-primary font-bold"
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <BadgeIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={translations.fields.fullName}
                secondary={`${user.firstName} ${user.lastName}`}
                primaryTypographyProps={{
                  className: "text-text-secondary font-medium"
                }}
                secondaryTypographyProps={{
                  className: "text-text-primary font-bold"
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <FingerprintIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={translations.fields.userId}
                secondary={user.id}
                primaryTypographyProps={{
                  className: "text-text-secondary font-medium"
                }}
                secondaryTypographyProps={{
                  className: "text-text-primary font-mono"
                }}
              />
            </ListItem>

            <Divider className="my-2" />

            <ListItem>
              <ListItemIcon>
                <CalendarIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={translations.fields.accountCreated}
                secondary={format(new Date(user.createdAt), 'PPpp')}
                primaryTypographyProps={{
                  className: "text-text-secondary font-medium"
                }}
                secondaryTypographyProps={{
                  className: "text-text-primary"
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <UpdateIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={translations.fields.lastUpdated}
                secondary={format(new Date(user.updatedAt), 'PPpp')}
                primaryTypographyProps={{
                  className: "text-text-secondary font-medium"
                }}
                secondaryTypographyProps={{
                  className: "text-text-primary"
                }}
              />
            </ListItem>
          </List>
        </Paper>

        <Paper className="p-6 rounded-xl shadow-lg">
          <Box display="flex" alignItems="center" gap={2} mb={4}>
            <SettingsIcon color="primary" />
            <Typography variant="h5" className="font-bold text-text-primary">
              {translations.preferences.title}
            </Typography>
          </Box>

          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
            className="border-b border-gray-200"
          >
            <Tab 
              icon={<PaletteIcon />} 
              iconPosition="start" 
              label={translations.preferences.tabs.appearance}
            />
            <Tab 
              icon={<NotificationsIcon />} 
              iconPosition="start" 
              label={translations.preferences.tabs.notifications}
            />
            <Tab 
              icon={<LanguageIcon />} 
              iconPosition="start" 
              label={translations.preferences.tabs.language}
            />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <FormGroup className="space-y-4">
              <FormControl fullWidth>
                <InputLabel id="theme-select-label">{translations.preferences.theme.label}</InputLabel>
                <Select
                  labelId="theme-select-label"
                  value={preferences.theme}
                  label={translations.preferences.theme.label}
                  onChange={handleSelectChange('theme')}
                  className="mb-4"
                >
                  <MenuItem value="light">{translations.preferences.theme.light}</MenuItem>
                  <MenuItem value="dark">{translations.preferences.theme.dark}</MenuItem>
                  <MenuItem value="system">{translations.preferences.theme.system}</MenuItem>
                </Select>
              </FormControl>
              
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.display.compactMode}
                    onChange={handlePreferenceChange('display', 'compactMode')}
                  />
                }
                label={translations.preferences.display.compactMode}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.display.showAvatars}
                    onChange={handlePreferenceChange('display', 'showAvatars')}
                  />
                }
                label={translations.preferences.display.showAvatars}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.display.highContrast}
                    onChange={handlePreferenceChange('display', 'highContrast')}
                  />
                }
                label={translations.preferences.display.highContrast}
              />
            </FormGroup>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <FormGroup className="space-y-4">
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.email}
                    onChange={handlePreferenceChange('notifications', 'email')}
                  />
                }
                label={translations.preferences.notifications.email}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.push}
                    onChange={handlePreferenceChange('notifications', 'push')}
                  />
                }
                label={translations.preferences.notifications.push}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.notifications.updates}
                    onChange={handlePreferenceChange('notifications', 'updates')}
                  />
                }
                label={translations.preferences.notifications.updates}
              />
            </FormGroup>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <FormControl fullWidth>
              <InputLabel id="language-select-label">{translations.preferences.language.label}</InputLabel>
              <Select
                labelId="language-select-label"
                value={preferences.language}
                label={translations.preferences.language.label}
                onChange={handleSelectChange('language')}
              >
                <MenuItem value="en">{translations.preferences.language.en}</MenuItem>
                <MenuItem value="cs">{translations.preferences.language.cs}</MenuItem>
                <MenuItem value="sk">{translations.preferences.language.sk}</MenuItem>
              </Select>
            </FormControl>
          </TabPanel>
        </Paper>
      </Box>
    </motion.div>
  );
} 