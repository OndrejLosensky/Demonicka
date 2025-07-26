import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';
import { profileApi } from './api';
import type { User } from '../../types/user';
import { 
  Person as PersonIcon,
  Badge as BadgeIcon,
  Fingerprint as FingerprintIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { PersonalInfoTab } from '../../components/auth/PersonalInfoTab';
import { withPageLoader } from '../../components/hoc/withPageLoader';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
}

const ProfilePageComponent: React.FC = () => {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await profileApi.getProfile();
        setProfileData(data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (!user || isLoading) {
    return null; // withPageLoader will handle loading state
  }

  const displayData = profileData || user;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <Box maxWidth="lg" mx="auto">
        {/* Profile Information */}
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
              {displayData.username[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h4" className="font-bold text-text-primary">
                {displayData.name}
              </Typography>
              <Typography variant="subtitle1" className="text-text-secondary">
                Informace o účtu
              </Typography>
              <Chip 
                label={`ID: ${displayData.id.split('-')[0]}...`} 
                size="small" 
                color="primary" 
                variant="outlined"
                className="mt-2"
              />
            </Box>
          </Box>

          <Divider className="my-4" />

          <Tabs value={tabValue} onChange={handleTabChange} aria-label="profile tabs">
            <Tab label="Základní informace" {...a11yProps(0)} />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <List className="space-y-2">
              <ListItem>
                <ListItemIcon>
                  <PersonIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Uživatelské jméno"
                  secondary={displayData.username}
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
                  primary="Celé jméno"
                  secondary={displayData.name}
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
                  primary="ID uživatele"
                  secondary={displayData.id}
                  primaryTypographyProps={{
                    className: "text-text-secondary font-medium"
                  }}
                  secondaryTypographyProps={{
                    className: "text-text-primary font-mono"
                  }}
                />
              </ListItem>

              <ListItem>
                <ListItemIcon>
                  <CalendarIcon color="primary" />
                </ListItemIcon>
                <ListItemText
                  primary="Účet vytvořen"
                  secondary={format(new Date(displayData.createdAt), 'PPpp', { locale: cs })}
                  primaryTypographyProps={{
                    className: "text-text-secondary font-medium"
                  }}
                  secondaryTypographyProps={{
                    className: "text-text-primary"
                  }}
                />
              </ListItem>
            </List>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <PersonalInfoTab />
          </TabPanel>
        </Paper>
      </Box>
    </motion.div>
  );
};

const ProfilePage = withPageLoader(ProfilePageComponent);
export default ProfilePage; 