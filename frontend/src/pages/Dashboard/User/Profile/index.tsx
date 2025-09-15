import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  IconButton,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardHeader,
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
  Update as UpdateIcon,
  Security as SecurityIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAuth } from '../../../../contexts/AuthContext';
import { profileApi } from './api';
import type { User } from '../../../../types/user';
import { withPageLoader } from '../../../../components/hoc/withPageLoader';
import { ProfilePictureUpload } from '../../../../components/ui/ProfilePictureUpload';
import { profilePictureService } from '../../../../services/profilePictureService';
import translations from '../../../../locales/cs/profile.json';
import { usePageTitle } from '../../../../hooks/usePageTitle';

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

    if (user) {
      fetchData();
    }
  }, [user]);

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

  const handleProfilePictureChange = (filename: string | null) => {
    if (profileData) {
      setProfileData({ ...profileData, profilePicture: filename });
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
      <Box maxWidth="xl" mx="auto">
        {/* Profile Header */}
        <Paper className="p-6 rounded-xl shadow-lg mb-6 bg-gradient-to-r from-primary-50 to-secondary-50">
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={4}>
            <Box display="flex" alignItems="center" gap={4}>
              <ProfilePictureUpload
                currentPicture={displayData.profilePicture}
                username={displayData.username}
                onPictureChange={handleProfilePictureChange}
                size={120}
              />
              <Box>
                <Typography variant="h3" className="font-bold text-text-primary mb-2">
                  {displayData.name}
                </Typography>
                <Typography variant="h6" className="text-text-secondary mb-3">
                  @{displayData.username}
                </Typography>
                <Box display="flex" gap={1} flexWrap="wrap">
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
              <IconButton 
                onClick={handleRefresh} 
                disabled={isRefreshing}
                sx={{ 
                  bgcolor: 'background.paper',
                  boxShadow: 2,
                  '&:hover': { bgcolor: 'background.default' }
                }}
              >
                <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />
              </IconButton>
            </Tooltip>
          </Box>
        </Paper>

        {/* Main Content Grid */}
        <Grid container spacing={3}>
          {/* Personal Information Card */}
          <Grid item xs={12} md={6}>
            <Card className="h-full shadow-lg">
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <PersonIcon color="primary" />
                    <Typography variant="h6" className="font-bold">
                      Osobní údaje
                    </Typography>
                  </Box>
                }
                className="bg-gradient-to-r from-blue-50 to-indigo-50"
              />
              <CardContent>
                <List className="space-y-3">
                  <ListItem className="px-0">
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Uživatelské jméno"
                      secondary={displayData.username}
                      primaryTypographyProps={{
                        className: "text-text-secondary font-medium text-sm"
                      }}
                      secondaryTypographyProps={{
                        className: "text-text-primary font-bold"
                      }}
                    />
                  </ListItem>

                  <ListItem className="px-0">
                    <ListItemIcon>
                      <BadgeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Celé jméno"
                      secondary={displayData.name}
                      primaryTypographyProps={{
                        className: "text-text-secondary font-medium text-sm"
                      }}
                      secondaryTypographyProps={{
                        className: "text-text-primary font-bold"
                      }}
                    />
                  </ListItem>

                  {displayData.firstName && (
                    <ListItem className="px-0">
                      <ListItemIcon>
                        <AccountIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Křestní jméno"
                        secondary={displayData.firstName}
                        primaryTypographyProps={{
                          className: "text-text-secondary font-medium text-sm"
                        }}
                        secondaryTypographyProps={{
                          className: "text-text-primary"
                        }}
                      />
                    </ListItem>
                  )}

                  {displayData.lastName && (
                    <ListItem className="px-0">
                      <ListItemIcon>
                        <AccountIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Příjmení"
                        secondary={displayData.lastName}
                        primaryTypographyProps={{
                          className: "text-text-secondary font-medium text-sm"
                        }}
                        secondaryTypographyProps={{
                          className: "text-text-primary"
                        }}
                      />
                    </ListItem>
                  )}

                  <ListItem className="px-0">
                    <ListItemIcon>
                      <GenderIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Pohlaví"
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <span className="text-lg">{getGenderIcon(displayData.gender)}</span>
                          <span>{translations.gender[displayData.gender]}</span>
                        </Box>
                      }
                      primaryTypographyProps={{
                        className: "text-text-secondary font-medium text-sm"
                      }}
                      secondaryTypographyProps={{
                        className: "text-text-primary"
                      }}
                    />
                  </ListItem>

                  <ListItem className="px-0">
                    <ListItemIcon>
                      <FingerprintIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="ID uživatele"
                      secondary={displayData.id}
                      primaryTypographyProps={{
                        className: "text-text-secondary font-medium text-sm"
                      }}
                      secondaryTypographyProps={{
                        className: "text-text-primary font-mono text-xs"
                      }}
                    />
                  </ListItem>

                  <ListItem className="px-0">
                    <ListItemIcon>
                      <PersonIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Profilový obrázek"
                      secondary={
                        displayData.profilePicture ? (
                          <Box display="flex" alignItems="center" gap={1}>
                            <Avatar
                              src={profilePictureService.getProfilePictureUrl(displayData.profilePicture)}
                              sx={{ width: 24, height: 24 }}
                            />
                            <span className="text-sm text-text-secondary">
                              {displayData.profilePicture}
                            </span>
                          </Box>
                        ) : (
                          <span className="text-text-secondary">Žádný obrázek</span>
                        )
                      }
                      primaryTypographyProps={{
                        className: "text-text-secondary font-medium text-sm"
                      }}
                      secondaryTypographyProps={{
                        className: "text-text-primary"
                      }}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Account Information Card */}
          <Grid item xs={12} md={6}>
            <Card className="h-full shadow-lg">
              <CardHeader
                title={
                  <Box display="flex" alignItems="center" gap={1}>
                    <SecurityIcon color="primary" />
                    <Typography variant="h6" className="font-bold">
                      Informace o účtu
                    </Typography>
                  </Box>
                }
                className="bg-gradient-to-r from-green-50 to-emerald-50"
              />
              <CardContent>
                <List className="space-y-3">
                  <ListItem className="px-0">
                    <ListItemIcon>
                      <BadgeIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Role"
                      secondary={translations.roles[displayData.role as keyof typeof translations.roles] || displayData.role}
                      primaryTypographyProps={{
                        className: "text-text-secondary font-medium text-sm"
                      }}
                      secondaryTypographyProps={{
                        className: "text-text-primary font-bold"
                      }}
                    />
                  </ListItem>

                  <ListItem className="px-0">
                    <ListItemIcon>
                      <CheckCircleIcon color={displayData.isRegistrationComplete ? "success" : "warning"} />
                    </ListItemIcon>
                    <ListItemText
                      primary="Stav registrace"
                      secondary={
                        <Chip
                          icon={displayData.isRegistrationComplete ? <CheckCircleIcon /> : <CancelIcon />}
                          label={displayData.isRegistrationComplete ? 
                            translations.registrationStatus.complete : 
                            translations.registrationStatus.incomplete
                          }
                          size="small"
                          color={displayData.isRegistrationComplete ? "success" : "warning"}
                        />
                      }
                      primaryTypographyProps={{
                        className: "text-text-secondary font-medium text-sm"
                      }}
                      secondaryTypographyProps={{
                        className: "text-text-primary"
                      }}
                    />
                  </ListItem>

                  {displayData.registrationToken && (
                    <ListItem className="px-0">
                      <ListItemIcon>
                        <SecurityIcon color="primary" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Registrační token"
                        secondary={displayData.registrationToken}
                        primaryTypographyProps={{
                          className: "text-text-secondary font-medium text-sm"
                        }}
                        secondaryTypographyProps={{
                          className: "text-text-primary font-mono text-xs"
                        }}
                      />
                    </ListItem>
                  )}

                  <ListItem className="px-0">
                    <ListItemIcon>
                      <CalendarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Účet vytvořen"
                      secondary={format(new Date(displayData.createdAt), 'PPpp', { locale: cs })}
                      primaryTypographyProps={{
                        className: "text-text-secondary font-medium text-sm"
                      }}
                      secondaryTypographyProps={{
                        className: "text-text-primary"
                      }}
                    />
                  </ListItem>

                  <ListItem className="px-0">
                    <ListItemIcon>
                      <UpdateIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText
                      primary="Poslední aktualizace"
                      secondary={format(new Date(displayData.updatedAt), 'PPpp', { locale: cs })}
                      primaryTypographyProps={{
                        className: "text-text-secondary font-medium text-sm"
                      }}
                      secondaryTypographyProps={{
                        className: "text-text-primary"
                      }}
                    />
                  </ListItem>

                  {displayData.deletedAt && (
                    <ListItem className="px-0">
                      <ListItemIcon>
                        <CancelIcon color="error" />
                      </ListItemIcon>
                      <ListItemText
                        primary="Datum smazání"
                        secondary={format(new Date(displayData.deletedAt), 'PPpp', { locale: cs })}
                        primaryTypographyProps={{
                          className: "text-text-secondary font-medium text-sm"
                        }}
                        secondaryTypographyProps={{
                          className: "text-error-600 font-bold"
                        }}
                      />
                    </ListItem>
                  )}
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </motion.div>
  );
};

const ProfilePage = withPageLoader(ProfilePageComponent);
export default ProfilePage; 