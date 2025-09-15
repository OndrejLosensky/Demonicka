import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab,
  Grid,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  LocalDrink as LocalDrinkIcon,
  People as PeopleIcon,
  TrendingUp as TrendingUpIcon,
} from '@mui/icons-material';
import { useToast } from '../../../../../hooks/useToast';
import { usePageTitle } from '../../../../../hooks/usePageTitle';
import type { User } from '../../../../../types/user';
import { userService } from '../../../../../services/userService';

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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const Users: React.FC = () => {
  const { success, error } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [addBeerDialogOpen, setAddBeerDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [beerCount, setBeerCount] = useState(1);
  const [genderFilter, setGenderFilter] = useState<'all' | 'MALE' | 'FEMALE'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  usePageTitle('Uživatelé');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const users = await userService.getAllUsers();
      setUsers(users);
    } catch {
      error('Chyba při načítání uživatelů');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleDeleteUser = async (user: User) => {
    try {
      await userService.deleteUser(user.id);
      setUsers(users.filter(u => u.id !== user.id));
      success('Uživatel byl úspěšně smazán');
    } catch {
      error('Chyba při mazání uživatele');
    }
    setDeleteDialogOpen(false);
    setUserToDelete(null);
  };

  const handleAddBeer = async () => {
    if (!selectedUser) return;
    
    try {
      // Add beer multiple times if beerCount > 1
      for (let i = 0; i < beerCount; i++) {
        await userService.addBeer(selectedUser.id);
      }
      await fetchUsers(); // Refresh the list
      success(`Přidáno ${beerCount} pivo uživateli ${selectedUser.name}`);
    } catch {
      error('Chyba při přidávání piva');
    }
    setAddBeerDialogOpen(false);
    setSelectedUser(null);
    setBeerCount(1);
  };

  const filteredUsers = users.filter(user => {
    const matchesGender = genderFilter === 'all' || user.gender === genderFilter;
    const matchesSearch = user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesGender && matchesSearch;
  });

  const getGenderColor = (gender: string) => {
    switch (gender) {
      case 'MALE': return 'primary';
      case 'FEMALE': return 'secondary';
      default: return 'default';
    }
  };

  const getGenderIcon = (gender: string) => {
    switch (gender) {
      case 'MALE': return '♂';
      case 'FEMALE': return '♀';
      default: return '?';
    }
  };

  const getTotalBeers = () => {
    return users.reduce((total, user) => total + (user.beerCount || 0), 0);
  };

  const getGenderStats = () => {
    const maleCount = users.filter(u => u.gender === 'MALE').length;
    const femaleCount = users.filter(u => u.gender === 'FEMALE').length;
    return { maleCount, femaleCount };
  };

  const genderStats = getGenderStats();

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
          <Tab 
            label="Všichni uživatelé" 
            icon={<PeopleIcon />} 
            iconPosition="start"
          />
          <Tab 
            label="Statistiky" 
            icon={<TrendingUpIcon />} 
            iconPosition="start"
          />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
          <TextField
            label="Hledat uživatele"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="small"
            sx={{ minWidth: 200 }}
          />
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Pohlaví</InputLabel>
            <Select
              value={genderFilter}
              label="Pohlaví"
              onChange={(e) => setGenderFilter(e.target.value as 'all' | 'MALE' | 'FEMALE')}
            >
              <MenuItem value="all">Všechna</MenuItem>
              <MenuItem value="MALE">Muži</MenuItem>
              <MenuItem value="FEMALE">Ženy</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Jméno</TableCell>
                <TableCell>Uživatelské jméno</TableCell>
                <TableCell>Pohlaví</TableCell>
                <TableCell>Počet piv</TableCell>
                <TableCell>Akce</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PersonIcon fontSize="small" />
                      {user.name || user.username}
                    </Box>
                  </TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>
                    <Chip
                      label={`${getGenderIcon(user.gender)} ${user.gender === 'MALE' ? 'Muž' : 'Žena'}`}
                      color={getGenderColor(user.gender)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocalDrinkIcon fontSize="small" />
                      {user.beerCount || 0}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="Přidat pivo">
                        <IconButton
                          size="small"
                          onClick={() => {
                            setSelectedUser(user);
                            setAddBeerDialogOpen(true);
                          }}
                        >
                          <AddIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Smazat uživatele">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredUsers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              Žádní uživatelé nenalezeni
            </Typography>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <PeopleIcon color="primary" />
                  <Typography variant="h6">Celkem uživatelů</Typography>
                </Box>
                <Typography variant="h3" color="primary">
                  {users.length}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <LocalDrinkIcon color="secondary" />
                  <Typography variant="h6">Celkem piv</Typography>
                </Box>
                <Typography variant="h3" color="secondary">
                  {getTotalBeers()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <TrendingUpIcon color="success" />
                  <Typography variant="h6">Průměr na uživatele</Typography>
                </Box>
                <Typography variant="h3" color="success">
                  {users.length > 0 ? (getTotalBeers() / users.length).toFixed(1) : '0'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Rozdělení podle pohlaví</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Chip
                    label={`♂ Muži: ${genderStats.maleCount}`}
                    color="primary"
                    icon={<PersonIcon />}
                  />
                  <Chip
                    label={`♀ Ženy: ${genderStats.femaleCount}`}
                    color="secondary"
                    icon={<PersonIcon />}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Nejaktivnější uživatelé</Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {users
                    .sort((a, b) => (b.beerCount || 0) - (a.beerCount || 0))
                    .slice(0, 3)
                    .map((user, index) => (
                      <Box key={user.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2">
                          {index + 1}. {user.name}
                        </Typography>
                        <Chip
                          label={`${user.beerCount || 0} piv`}
                          size="small"
                          color="secondary"
                        />
                      </Box>
                    ))}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </TabPanel>

      {/* Add Beer Dialog */}
      <Dialog open={addBeerDialogOpen} onClose={() => setAddBeerDialogOpen(false)}>
        <DialogTitle>Přidat pivo uživateli</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Uživatel: <strong>{selectedUser?.name}</strong>
          </Typography>
          <TextField
            label="Počet piv"
            type="number"
            value={beerCount}
            onChange={(e) => setBeerCount(parseInt(e.target.value) || 1)}
            fullWidth
            margin="normal"
            inputProps={{ min: 1, max: 10 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAddBeerDialogOpen(false)}>Zrušit</Button>
          <Button onClick={handleAddBeer} variant="contained">
            Přidat pivo
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
        <DialogTitle>Smazat uživatele</DialogTitle>
        <DialogContent>
          <Typography>
            Opravdu chcete smazat uživatele <strong>{userToDelete?.name}</strong>?
          </Typography>
          <Alert severity="warning" sx={{ mt: 2 }}>
            Tato akce je nevratná!
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)}>Zrušit</Button>
          <Button onClick={() => userToDelete && handleDeleteUser(userToDelete)} color="error" variant="contained">
            Smazat
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;