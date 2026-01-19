import { useMemo, useState, useEffect } from 'react';
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
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
} from '@mui/material';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { ProfilePictureUploadDialog } from '../../../components/ProfilePictureUploadDialog';
import { UserAvatar } from '../../../components/UserAvatar';
import {
  Person as PersonIcon,
  Badge as BadgeIcon,
  Fingerprint as FingerprintIcon,
  CalendarToday as CalendarIcon,
  Refresh as RefreshIcon,
  Wc as GenderIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  TrendingUp as TrendingUpIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { FaBeer } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { useAuth } from '../../../contexts/AuthContext';
import { profileApi } from './api';
import type { User } from '@demonicka/shared-types';
import { withPageLoader } from '../../../components/hoc/withPageLoader';
import translations from '../../../locales/cs/profile.json';

const ProfilePageComponent: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [editName, setEditName] = useState<string>('');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE'>('MALE');

  const displayData = profileData || user;

  useEffect(() => {
    if (!displayData) return;
    setEditName(displayData.name ?? '');
    setEditGender(displayData.gender);
  }, [displayData?.id]); // reset when user changes

  const dashboardUrl = useMemo(() => {
    const u = displayData;
    const username = u?.username;
    if (!username) return '/';
    return `/u/${encodeURIComponent(username)}/dashboard`;
  }, [displayData?.username]);

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

  const handleUploadSuccess = async () => {
    // Refresh profile data after successful upload
    const data = await profileApi.getProfile();
    setProfileData(data);
  };

  if (!user || isLoading) {
    return null; // withPageLoader will handle loading state
  }

  // Ensure canonical route always uses the current user id.
  // (Profile API is /users/me, so we don't support viewing others here.)
  if (userId && userId !== user.id) {
    return <Navigate to={`/u/${encodeURIComponent(user.id)}/profile`} replace />;
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return 'error';
      case 'OPERATOR': return 'warning';
      case 'USER': return 'primary';
      case 'PARTICIPANT': return 'success';
      default: return 'default';
    }
  };

  const getGenderIcon = (gender: string) => {
    return gender === 'MALE' ? '♂' : '♀';
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const trimmedName = editName.trim();
      const updated = await profileApi.updateProfile({
        name: trimmedName.length ? trimmedName : undefined,
        gender: editGender,
      });
      setProfileData(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || 'Nepodařilo se uložit změny profilu.';
      setSaveError(String(msg));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Box>
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
                <IconButton
                  onClick={() => setUploadDialogOpen(true)}
                  sx={{
                    p: 0,
                    '&:hover': {
                      opacity: 0.8,
                    },
                  }}
                >
                  <UserAvatar
                    user={displayData}
                    sx={{
                      width: 100,
                      height: 100,
                      fontSize: '2.5rem',
                      cursor: 'pointer',
                    }}
                  />
                </IconButton>
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
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<TrendingUpIcon />}
                onClick={() => navigate(dashboardUrl)}
              >
                Moje statistiky
              </Button>
              <Tooltip title="Obnovit data">
                <IconButton onClick={handleRefresh} disabled={isRefreshing}>
                  <RefreshIcon className={isRefreshing ? 'animate-spin' : ''} />
                </IconButton>
              </Tooltip>
            </Box>
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

        <Paper className="p-6 rounded-xl shadow-lg mb-6">
          <Typography variant="h6" className="font-bold text-text-primary" sx={{ mb: 2 }}>
            Upravit profil
          </Typography>

          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
              {saveError}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={translations.basicInfo.fullName}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="gender-label">{translations.basicInfo.gender}</InputLabel>
              <Select
                labelId="gender-label"
                label={translations.basicInfo.gender}
                value={editGender}
                onChange={(e) => setEditGender(e.target.value as 'MALE' | 'FEMALE')}
              >
                <MenuItem value="MALE">{translations.gender.MALE}</MenuItem>
                <MenuItem value="FEMALE">{translations.gender.FEMALE}</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? 'Ukládám...' : 'Uložit'}
            </Button>
          </Box>
        </Paper>
      </Box>

      <ProfilePictureUploadDialog
        open={uploadDialogOpen}
        onClose={() => setUploadDialogOpen(false)}
        onSuccess={handleUploadSuccess}
        currentImageUrl={displayData.profilePictureUrl}
        userName={displayData.username}
      />
    </motion.div>
  );
};

const ProfilePage = withPageLoader(ProfilePageComponent);
export default ProfilePage;
