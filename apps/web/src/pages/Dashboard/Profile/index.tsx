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
  Switch,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
import { useTranslations } from '../../../contexts/LocaleContext';

const ProfilePageComponent: React.FC = () => {
  const { user } = useAuth();
  const t = useTranslations<Record<string, unknown>>('profile');
  const tabs = (t.tabs as Record<string, string>) || {};
  const basicInfo = (t.basicInfo as Record<string, string>) || {};
  const roles = (t.roles as Record<string, string>) || {};
  const registrationStatus = (t.registrationStatus as Record<string, string>) || {};
  const gender = (t.gender as Record<string, string>) || {};
  const editProfile = (t.editProfile as Record<string, string>) || {};
  const twoFactor = (t.twoFactor as Record<string, string>) || {};
  const googleAccount = (t.googleAccount as Record<string, string>) || {};
  const errors = (t.errors as Record<string, string>) || {};
  const navigate = useNavigate();
  const { userId } = useParams<{ userId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<User | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [editName, setEditName] = useState<string>('');
  const [editGender, setEditGender] = useState<'MALE' | 'FEMALE'>('MALE');
  const [editEmail, setEditEmail] = useState<string>('');
  const [twoFactorCode, setTwoFactorCode] = useState<string>('');
  const [show2FADialog, setShow2FADialog] = useState(false);
  const [is2FALoading, setIs2FALoading] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [isUnlinkingGoogle, setIsUnlinkingGoogle] = useState(false);

  const displayData = profileData || user;

  useEffect(() => {
    if (!displayData) return;
    setEditName(displayData.name ?? '');
    setEditGender(displayData.gender);
    setEditEmail(displayData.email ?? '');
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

  // Handle Google OAuth callback query parameters
  useEffect(() => {
    const success = searchParams.get('success');
    const error = searchParams.get('error');

    if (success === 'google_account_linked') {
      // Refresh profile data to show updated Google account status
      profileApi.getProfile().then(setProfileData).catch(console.error);
      setSearchParams({});
    } else if (error) {
      if (error === 'google_account_already_linked') {
        setSaveError(errors.googleAlreadyLinked ?? 'Tento Google účet je již propojen s jiným účtem');
      } else if (error === 'google_link_failed') {
        setSaveError(errors.googleLinkFailed ?? 'Nepodařilo se propojit Google účet');
      }
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

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
        email: editEmail.trim() || undefined,
      });
      setProfileData(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || (errors.saveFailed ?? 'Nepodařilo se uložit změny profilu.');
      setSaveError(String(msg));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEnable2FA = async () => {
    if (!editEmail.trim()) {
      setSaveError(errors.enable2faNeedEmail ?? 'Pro aktivaci dvoufázového ověření musíte mít nastavenou emailovou adresu');
      return;
    }

    setIs2FALoading(true);
    setTwoFactorError(null);
    try {
      await profileApi.enableTwoFactor();
      setShow2FADialog(true);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || (errors.sendCodeFailed ?? 'Nepodařilo se odeslat ověřovací kód');
      setTwoFactorError(String(msg));
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleVerify2FA = async () => {
    if (!twoFactorCode.trim() || twoFactorCode.length !== 6) {
      setTwoFactorError(errors.invalidCode ?? 'Zadejte 6místný kód');
      return;
    }

    setIs2FALoading(true);
    setTwoFactorError(null);
    try {
      await profileApi.verifyTwoFactorCode(twoFactorCode);
      setShow2FADialog(false);
      setTwoFactorCode('');
      const updated = await profileApi.getProfile();
      setProfileData(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || (errors.verifyFailed ?? 'Neplatný ověřovací kód');
      setTwoFactorError(String(msg));
    } finally {
      setIs2FALoading(false);
    }
  };

  const handleDisable2FA = async () => {
    setIs2FALoading(true);
    setTwoFactorError(null);
    try {
      await profileApi.disableTwoFactor();
      const updated = await profileApi.getProfile();
      setProfileData(updated);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || (errors.disable2faFailed ?? 'Nepodařilo se deaktivovat dvoufázové ověření');
      setTwoFactorError(String(msg));
    } finally {
      setIs2FALoading(false);
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
                  {tabs.basicInfo ?? 'Základní informace'}
                </Typography>
                <Box display="flex" gap={1} mt={1}>
                  <Chip 
                    label={`ID: ${displayData.id.split('-')[0]}...`} 
                    size="small" 
                    color="primary" 
                    variant="outlined"
                  />
                  <Chip
                    label={roles[displayData.role] ?? displayData.role}
                    size="small"
                    color={getRoleColor(displayData.role)}
                  />
                  {displayData.isRegistrationComplete ? (
                    <Chip
                      icon={<CheckCircleIcon />}
                      label={registrationStatus.complete ?? 'Dokončeno'}
                      size="small"
                      color="success"
                    />
                  ) : (
                    <Chip
                      icon={<CancelIcon />}
                      label={registrationStatus.incomplete ?? 'Nedokončeno'}
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
                {(t.myStats as string) ?? 'Moje statistiky'}
              </Button>
              <Tooltip title={(t.refreshTooltip as string) ?? 'Obnovit data'}>
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
                primary={basicInfo.username ?? 'Uživatelské jméno'}
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
                primary={basicInfo.fullName ?? 'Celé jméno'}
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
                primary={basicInfo.gender ?? 'Pohlaví'}
                secondary={
                  <Box display="flex" alignItems="center" gap={1}>
                    <span>{getGenderIcon(displayData.gender)}</span>
                    <span>{gender[displayData.gender] ?? displayData.gender}</span>
                  </Box>
                }
                primaryTypographyProps={{
                  className: "text-text-secondary font-medium"
                }}
                secondaryTypographyProps={{
                  component: 'div',
                  className: "text-text-primary"
                }}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <FingerprintIcon color="primary" />
              </ListItemIcon>
              <ListItemText
                primary={basicInfo.userId ?? 'ID uživatele'}
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
                primary={basicInfo.accountCreated ?? 'Účet vytvořen'}
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
            {editProfile.title ?? 'Upravit profil'}
          </Typography>

          {saveError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setSaveError(null)}>
              {saveError}
            </Alert>
          )}

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 2 }}>
            <TextField
              label={basicInfo.fullName ?? 'Celé jméno'}
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              fullWidth
            />

            <FormControl fullWidth>
              <InputLabel id="gender-label">{basicInfo.gender ?? 'Pohlaví'}</InputLabel>
              <Select
                labelId="gender-label"
                label={basicInfo.gender ?? 'Pohlaví'}
                value={editGender}
                onChange={(e) => setEditGender(e.target.value as 'MALE' | 'FEMALE')}
              >
                <MenuItem value="MALE">{gender.MALE ?? 'Muž'}</MenuItem>
                <MenuItem value="FEMALE">{gender.FEMALE ?? 'Žena'}</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={editProfile.email ?? 'Email'}
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              fullWidth
              helperText={displayData?.isTwoFactorEnabled ? (editProfile.emailHelper2FA ?? 'Email je vyžadován pro dvoufázové ověření') : ''}
            />
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (editProfile.saving ?? 'Ukládám...') : (editProfile.save ?? 'Uložit')}
            </Button>
          </Box>
        </Paper>

        <Paper className="p-6 rounded-xl shadow-lg mb-6">
          <Typography variant="h6" className="font-bold text-text-primary" sx={{ mb: 2 }}>
            {twoFactor.title ?? 'Dvoufázové ověření'}
          </Typography>

          {twoFactorError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTwoFactorError(null)}>
              {twoFactorError}
            </Alert>
          )}

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" className="text-text-primary">
                {displayData?.isTwoFactorEnabled ? (twoFactor.enabled ?? 'Dvoufázové ověření je aktivní') : (twoFactor.disabled ?? 'Dvoufázové ověření je deaktivováno')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {displayData?.isTwoFactorEnabled
                  ? (twoFactor.descriptionEnabled ?? 'Při přihlášení budete potřebovat kód z emailu')
                  : (twoFactor.descriptionDisabled ?? 'Zapněte dvoufázové ověření pro zvýšení bezpečnosti vašeho účtu')}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {displayData?.isTwoFactorEnabled ? (
                <Button
                  variant="outlined"
                  color="error"
                  onClick={handleDisable2FA}
                  disabled={is2FALoading}
                >
                  {is2FALoading ? (twoFactor.deactivating ?? 'Deaktivuji...') : (twoFactor.deactivate ?? 'Deaktivovat')}
                </Button>
              ) : (
                <Button
                  variant="contained"
                  onClick={handleEnable2FA}
                  disabled={is2FALoading || !editEmail.trim()}
                >
                  {is2FALoading ? (twoFactor.activating ?? 'Odesílám...') : (twoFactor.activate ?? 'Aktivovat')}
                </Button>
              )}
            </Box>
          </Box>
        </Paper>

        <Dialog open={show2FADialog} onClose={() => setShow2FADialog(false)}>
          <DialogTitle>{twoFactor.dialogTitle ?? 'Ověření dvoufázového ověření'}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {(twoFactor.dialogMessage ?? 'Zadejte 6místný kód, který jsme vám odeslali na email {{email}}').replace('{{email}}', displayData?.email ?? '')}
            </Typography>
            {twoFactorError && (
              <Alert severity="error" sx={{ mb: 2 }} onClose={() => setTwoFactorError(null)}>
                {twoFactorError}
              </Alert>
            )}
            <TextField
              label={twoFactor.codeLabel ?? 'Ověřovací kód'}
              value={twoFactorCode}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                setTwoFactorCode(value);
              }}
              fullWidth
              inputProps={{ maxLength: 6, pattern: '[0-9]*' }}
              placeholder={twoFactor.codePlaceholder ?? '000000'}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => {
              setShow2FADialog(false);
              setTwoFactorCode('');
              setTwoFactorError(null);
            }}>
              {twoFactor.cancel ?? 'Zrušit'}
            </Button>
            <Button
              onClick={handleVerify2FA}
              variant="contained"
              disabled={is2FALoading || twoFactorCode.length !== 6}
            >
              {is2FALoading ? (twoFactor.verifying ?? 'Ověřuji...') : (twoFactor.verify ?? 'Ověřit')}
            </Button>
          </DialogActions>
        </Dialog>

        <Paper className="p-6 rounded-xl shadow-lg mb-6">
          <Typography variant="h6" className="font-bold text-text-primary" sx={{ mb: 2 }}>
            {googleAccount.title ?? 'Google účet'}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box>
              <Typography variant="body1" className="text-text-primary">
                {(displayData as any)?.googleId
                  ? (googleAccount.linked ?? 'Google účet je propojen')
                  : (googleAccount.notLinked ?? 'Google účet není propojen')}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {(displayData as any)?.googleId
                  ? (googleAccount.descriptionLinked ?? 'Můžete se přihlásit pomocí Google účtu nebo uživatelského jména a hesla')
                  : (googleAccount.descriptionNotLinked ?? 'Propojte svůj Google účet pro jednodušší přihlášení')}
              </Typography>
            </Box>
            <Button
              variant={(displayData as any)?.googleId ? 'outlined' : 'contained'}
              color={(displayData as any)?.googleId ? 'error' : 'primary'}
              onClick={async () => {
                if ((displayData as any)?.googleId) {
                  setIsUnlinkingGoogle(true);
                  try {
                    await profileApi.unlinkGoogleAccount();
                    const data = await profileApi.getProfile();
                    setProfileData(data);
                  } catch (err: any) {
                    setSaveError(
                      err?.response?.data?.message ||
                        err?.message ||
                        (errors.unlinkFailed ?? 'Nepodařilo se odpojit Google účet'),
                    );
                  } finally {
                    setIsUnlinkingGoogle(false);
                  }
                } else {
                  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
                  const apiPrefix = import.meta.env.VITE_API_PREFIX || '/api';
                  window.location.href = `${apiUrl}${apiPrefix}/auth/google/link`;
                }
              }}
              disabled={isUnlinkingGoogle}
            >
              {isUnlinkingGoogle
                ? (googleAccount.unlinking ?? 'Odpojuji...')
                : (displayData as any)?.googleId
                ? (googleAccount.unlink ?? 'Zrušit propojení')
                : (googleAccount.link ?? 'Propojit Google účet')}
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
