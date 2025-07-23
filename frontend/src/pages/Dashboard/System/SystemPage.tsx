import React, { useState, useEffect } from 'react';
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import { userService } from '../../../services/userService';
import { USER_ROLE } from '../../../types/user';
import { UserStatsComponent } from '../../../components/UserStats';
import { QRCodeCanvas } from 'qrcode.react';
import { Close as CloseIcon, ContentCopy as ContentCopyIcon } from '@mui/icons-material';
import { toast } from 'react-hot-toast';
import { withPageLoader } from '../../../components/hoc/withPageLoader';
import { History } from '../history';
import { useFeatureFlag } from '../../../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../../../types/featureFlags';

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
      id={`system-tabpanel-${index}`}
      aria-labelledby={`system-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `system-tab-${index}`,
    'aria-controls': `system-tabpanel-${index}`,
  };
}

interface User {
  id: string;
  username: string;
  role: string;
  isRegistrationComplete: boolean;
  registerToken?: string;
}

interface TokenDialogProps {
  open: boolean;
  token: string;
  onClose: () => void;
}

const TokenDialog: React.FC<TokenDialogProps> = ({ open, token, onClose }) => {
  const registrationUrl = `${window.location.origin}/complete-registration?token=${token}`;

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    toast.success('Token zkopírován do schránky');
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(registrationUrl);
    toast.success('URL zkopírována do schránky');
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Registrační token
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, py: 2 }}>
          <QRCodeCanvas value={registrationUrl} size={256} level="H" />
          
          <Box sx={{ width: '100%' }}>
            <Typography variant="subtitle1" gutterBottom>Token:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  bgcolor: 'grey.100', 
                  p: 1, 
                  borderRadius: 1, 
                  flex: 1,
                  fontFamily: 'monospace'
                }}
              >
                {token}
              </Typography>
              <IconButton onClick={handleCopyToken} size="small">
                <ContentCopyIcon />
              </IconButton>
            </Box>

            <Typography variant="subtitle1" gutterBottom>Registrační URL:</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography 
                variant="body1" 
                sx={{ 
                  bgcolor: 'grey.100', 
                  p: 1, 
                  borderRadius: 1, 
                  flex: 1,
                  fontFamily: 'monospace',
                  wordBreak: 'break-all'
                }}
              >
                {registrationUrl}
              </Typography>
              <IconButton onClick={handleCopyUrl} size="small">
                <ContentCopyIcon />
              </IconButton>
            </Box>
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Zavřít</Button>
      </DialogActions>
    </Dialog>
  );
};

interface SystemPageBaseProps {
  setIsLoading: (loading: boolean) => void;
}

const SystemPageBase: React.FC<SystemPageBaseProps> = ({ setIsLoading }) => {
  const [value, setValue] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [tokenDialogOpen, setTokenDialogOpen] = useState(false);
  const [currentToken, setCurrentToken] = useState<string>('');
  const isHistoryEnabled = useFeatureFlag(FeatureFlagKey.HISTORY_PAGE);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setIsLoading(true);
      const response = await userService.getAllUsers();
      setUsers(response);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Nepodařilo se načíst uživatele');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    setSelectedUserId(null);
  };

  const handleGenerateToken = async (userId: string) => {
    try {
      setIsLoading(true);
      const response = await userService.generateRegisterToken(userId);
      setCurrentToken(response.token);
      setTokenDialogOpen(true);
      // No need to update users list since the token isn't stored in user state
    } catch (error) {
      console.error('Failed to generate token:', error);
      toast.error('Nepodařilo se vygenerovat token');
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProfile = (userId: string) => {
    setSelectedUserId(userId);
    setValue(1); // Switch to the Profiles tab
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case USER_ROLE.ADMIN:
        return 'error';
      case USER_ROLE.USER:
        return 'success';
      case USER_ROLE.PARTICIPANT:
        return 'primary';
      default:
        return 'default';
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case USER_ROLE.ADMIN:
        return 'Administrátor';
      case USER_ROLE.USER:
        return 'Uživatel';
      case USER_ROLE.PARTICIPANT:
        return 'Účastník';
      default:
        return role;
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={value}
          onChange={handleChange}
          aria-label="system tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="Uživatelé" {...a11yProps(0)} />
          <Tab label="Profily uživatelů" {...a11yProps(1)} />
          {isHistoryEnabled && <Tab label="Historie" {...a11yProps(2)} />}
        </Tabs>

        <TabPanel value={value} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Uživatel</TableCell>
                  <TableCell>Role</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Akce</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>{user.username}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getRoleName(user.role)}
                        color={getRoleColor(user.role)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.isRegistrationComplete ? "Aktivní" : "Neaktivní"}
                        color={user.isRegistrationComplete ? "success" : "warning"}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {!user.isRegistrationComplete && (
                          <Button
                            variant="contained"
                            size="small"
                            onClick={() => handleGenerateToken(user.id)}
                          >
                            Generovat token
                          </Button>
                        )}
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleViewProfile(user.id)}
                        >
                          Zobrazit profil
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        <TabPanel value={value} index={1}>
          {selectedUserId ? (
            <UserStatsComponent userId={selectedUserId} />
          ) : (
            <Typography variant="body1" sx={{ p: 2 }}>
              Vyberte uživatele ze seznamu pro zobrazení jeho profilu.
            </Typography>
          )}
        </TabPanel>

        {isHistoryEnabled && (
          <TabPanel value={value} index={2}>
            <History />
          </TabPanel>
        )}
      </Paper>

      <TokenDialog 
        open={tokenDialogOpen}
        token={currentToken}
        onClose={() => setTokenDialogOpen(false)}
      />
    </Box>
  );
};

const WrappedSystemPage = withPageLoader(SystemPageBase);

export const SystemPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  return (
    <WrappedSystemPage 
      isLoading={isLoading} 
      loadingMessage="Načítám uživatele..." 
      setIsLoading={setIsLoading}
    />
  );
}; 