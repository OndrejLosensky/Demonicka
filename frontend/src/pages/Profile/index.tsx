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
  IconButton,
  Tooltip,
  Badge,
} from '@mui/material';
import {
  Person as PersonIcon,
  Badge as BadgeIcon,
  Fingerprint as FingerprintIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Wc as GenderIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import { FaBeer } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAuth } from '../../contexts/AuthContext';
import { profileApi } from './api';
import type { User } from '../../types/user';
import { withPageLoader } from '../../components/hoc/withPageLoader';
import translations from '../../locales/cs/profile.json';
import { usePageTitle } from '../../hooks/usePageTitle';

const ProfilePageComponent: React.FC = () => {
  usePageTitle('Profil');
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await profileApi.getProfile();
        setProfileData(data);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const data = await profileApi.getProfile();
      setProfileData(data);
    } catch (error) {
      console.error('Failed to refresh data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  if (!user || isLoading) {
    return null; // withPageLoader will handle loading state
  }

  const displayData = profileData || user;

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'error';
      case 'USER': return 'primary';
      case 'PARTICIPANT': return 'success';
      default: return 'default';
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'MALE' ? '♂' : '♀';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6"
    >
      <Box maxWidth="lg" mx="auto">
        {/* Profile Header */}
        <Paper className="p-6 rounded-xl shadow-lg mb-6">
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
            <Box display="flex" alignItems="center" gap={4}>
              <Badge
                overlap="circular"
                anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                badgeContent={
                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main' }}>
                    <FaBeer style={{ fontSize: '0.8rem' }} />
                  </Avatar>
                }
              >
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
              </Badge>
              <Box>
                <Typography variant="h4" className="font-bold text-text-primary">
                  {displayData.name}
                </Typography>
                <Typography variant="subtitle1" className="text-text-secondary">
                  {translations.tabs.basicInfo}
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip 
                    label={`ID: ${displayData.id.split('-')[0]}...`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip
                    label={translations.roles[displayData.role as keyof typeof translations.roles] || displayData.role}
                    size="small"
                    color={getRoleColor(displayData.role)}
                  />
                  {displayData.isRegistrationComplete ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={translations.registrationStatus.complete}
                      size="small"
                      color="success"
                    />
                  ) : (
                    <Chip
                      icon={<CancelIcon />}
                      label={translations.registrationStatus.incomplete}
                      size="small"
                      color="warning"
                    />
                  )}
                </Box>
              </Box>
            </Box>
            <Tooltip title="Obnovit data">
              <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider className="my-4" />

          <List className="space-y-2">
            <ListItem>
              <ListItemIcon>
                <PersonIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={translations.basicInfo.username}
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
                primary={translations.basicInfo.fullName}
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
                <GenderIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={translations.basicInfo.gender}
                secondary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{getGenderIcon(displayData.gender)}</span>
                    <span>{translations.gender[displayData.gender]}</span>
                  </Box>
                }
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
                <FingerprintIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={translations.basicInfo.userId}
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
                primary={translations.basicInfo.accountCreated}
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
        </Paper>
      </Box>
    </motion.div>
  );
};

const ProfilePage = withPageLoader(ProfilePageComponent);
export default ProfilePage; 