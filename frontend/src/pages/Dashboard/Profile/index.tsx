// React import not needed in modern React with JSX transform
import { Box, Paper, Typography, List, ListItem, ListItemText, ListItemIcon, Chip, Avatar } from '@mui/material';
import { useAuth } from '../../../contexts/AuthContext';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Person as PersonIcon, Fingerprint as FingerprintIcon, Badge as BadgeIcon } from '@mui/icons-material';

export default function Profile() {
  const { user } = useAuth();
  if (!user) return null;

  return (
    <Box p={3} maxWidth="lg" mx="auto">
      <PageHeader title="Profil" />
      <Paper sx={{ p: 3, borderRadius: 2 }}>
        <Box display="flex" alignItems="center" gap={2} mb={3}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {user.username[0]?.toUpperCase()}
          </Avatar>
          <Box>
            <Typography variant="h5" fontWeight={700}>{user.name}</Typography>
            <Chip label={user.username} size="small" sx={{ mt: 0.5 }} />
          </Box>
        </Box>
        <List>
          <ListItem>
            <ListItemIcon><PersonIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Username" secondary={user.username} />
          </ListItem>
          <ListItem>
            <ListItemIcon><BadgeIcon color="primary" /></ListItemIcon>
            <ListItemText primary="Jméno" secondary={user.name} />
          </ListItem>
          <ListItem>
            <ListItemIcon><FingerprintIcon color="primary" /></ListItemIcon>
            <ListItemText primary="User ID" secondary={user.id} />
          </ListItem>
        </List>
      </Paper>
    </Box>
  );
}