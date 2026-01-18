import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Box,
    Typography,
    Button,
    Avatar,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    LinearProgress,
    Chip,
    Paper,
    FilterAlt as FilterIcon,
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    TrendingUp as TrendingUpIcon,
    LocalBar as BeerIcon,
    Group as GroupIcon,
    Timer as TimeIcon,
    Person as PersonIcon,
    Storage as BarrelIcon,
    MetricCard,
    PageHeader,
    Delete as DeleteIcon,
    IconButton,
    SportsBar as SportsBarIcon,
    TextField,
} from '@demonicka/ui';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { eventService } from '../../../services/eventService';
import { barrelService } from '../../../services/barrelService';
import { userService } from '../../../services/userService';
import { eventBeerPongTeamService } from '../../../services/beerPongService';
import type { Event, User, Barrel, EventBeerPongTeam, CreateTeamDto } from '@demonicka/shared-types';
import { toast } from 'react-hot-toast';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { tokens } from '../../../theme/tokens';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { getShadow } from '../../../theme/utils';
import { useAuth } from '../../../contexts/AuthContext';
import { Permission } from '@demonicka/shared';

export const EventDetail: React.FC = () => {
    usePageTitle('Detail události');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [barrels, setBarrels] = useState<Barrel[]>([]);
    const [eventBeerCounts, setEventBeerCounts] = useState<Record<string, number>>({});
    const [eventTeams, setEventTeams] = useState<EventBeerPongTeam[]>([]);
    const [openUser, setOpenUser] = useState(false);
    const [openBarrel, setOpenBarrel] = useState(false);
    const [openTeam, setOpenTeam] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedBarrel, setSelectedBarrel] = useState('');
    const [deleteTeamId, setDeleteTeamId] = useState<string | null>(null);
    const [deleteEventOpen, setDeleteEventOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [teamForm, setTeamForm] = useState<CreateTeamDto>({
        name: '',
        player1Id: '',
        player2Id: '',
    });
    const { loadActiveEvent } = useActiveEvent();
    const { hasPermission } = useAuth();

    const loadEventData = useCallback(async () => {
        if (!id) return;
        try {
            const data = await eventService.getEvent(id);
            setEvent(data);
        } catch (error) {
            console.error('Failed to load event:', error);
            toast.error('Nepodařilo se načíst událost');
        }
    }, [id]);

    const loadUsers = useCallback(async () => {
        if (!id) return;
        try {
            // Load only event users, not all users
            const data = await eventService.getEventUsers(id);
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
            toast.error('Nepodařilo se načíst účastníky události');
        }
    }, [id]);

    const loadBarrels = useCallback(async () => {
        try {
            const barrels = await barrelService.getAll();
            setBarrels(barrels);
        } catch (error) {
            console.error('Failed to load barrels:', error);
            toast.error('Nepodařilo se načíst sudy');
        }
    }, []);

    const loadEventTeams = useCallback(async () => {
        if (!id) return;
        try {
            const teams = await eventBeerPongTeamService.getByEvent(id);
            setEventTeams(teams);
        } catch (error) {
            console.error('Failed to load event teams:', error);
            // Don't show error - teams might not exist yet
        }
    }, [id]);

    useEffect(() => {
        if (id) {
            loadEventData();
            loadUsers();
            loadBarrels();
            loadEventTeams();
        }
    }, [id, loadEventData, loadUsers, loadBarrels, loadEventTeams]);

    const loadEventBeerCounts = useCallback(async () => {
        if (!id || !users.length) return;
        const counts: Record<string, number> = {};
        await Promise.all(
            users.map(async (user) => {
                try {
                    // Use eventBeerCount from user if available, otherwise fetch it
                    if (user.eventBeerCount !== undefined) {
                        counts[user.id] = user.eventBeerCount;
                    } else {
                        const count = await eventService.getUserEventBeerCount(id, user.id);
                        counts[user.id] = count;
                    }
                } catch (error) {
                    console.error(`Failed to load beer count for user ${user.id}:`, error);
                }
            })
        );
        setEventBeerCounts(counts);
    }, [id, users]);

    useEffect(() => {
        if (id && users.length) {
            loadEventBeerCounts();
        }
    }, [id, users, loadEventBeerCounts]);

    // removed duplicate function definitions after converting to useCallback

    const handleAddUser = async () => {
        try {
            if (id && selectedUser) {
                await eventService.addUser(id, selectedUser);
                await loadEventData();
                setOpenUser(false);
                setSelectedUser('');
            }
        } catch (error) {
            console.error('Failed to add user:', error);
        }
    };

    const handleAddBarrel = async () => {
        try {
            if (id && selectedBarrel) {
                await eventService.addBarrel(id, selectedBarrel);
                await loadEventData();
                setOpenBarrel(false);
                setSelectedBarrel('');
            }
        } catch (error) {
            console.error('Failed to add barrel:', error);
        }
    };

    const handleCreateTeam = async () => {
        if (!id) return;
        try {
            if (!teamForm.name.trim()) {
                toast.error('Název týmu je povinný');
                return;
            }
            if (!teamForm.player1Id || !teamForm.player2Id) {
                toast.error('Oba hráči musí být vybráni');
                return;
            }
            if (teamForm.player1Id === teamForm.player2Id) {
                toast.error('Hráči musí být rozdílní');
                return;
            }
            await eventBeerPongTeamService.create(id, teamForm);
            await loadEventTeams();
            setOpenTeam(false);
            setTeamForm({ name: '', player1Id: '', player2Id: '' });
            toast.success('Tým byl vytvořen');
        } catch (error: any) {
            console.error('Failed to create team:', error);
            toast.error(error.response?.data?.message || 'Nepodařilo se vytvořit tým');
        }
    };

    const handleDeleteTeam = async () => {
        if (!id || !deleteTeamId) return;
        try {
            await eventBeerPongTeamService.delete(id, deleteTeamId);
            await loadEventTeams();
            setDeleteTeamId(null);
            toast.success('Tým byl smazán');
        } catch (error: any) {
            console.error('Failed to delete team:', error);
            toast.error(error.response?.data?.message || 'Nepodařilo se smazat tým');
        }
    };

    const handleDeleteEvent = async () => {
        if (!id) return;
        try {
            setIsDeleting(true);
            await eventService.deleteEvent(id);
            toast.success('Událost byla úspěšně smazána');
            navigate('/events');
        } catch (error: any) {
            console.error('Failed to delete event:', error);
            toast.error(error.response?.data?.message || 'Nepodařilo se smazat událost');
        } finally {
            setIsDeleting(false);
            setDeleteEventOpen(false);
        }
    };

    const handleSetActive = async () => {
        if (!id) return;
        
        try {
            await eventService.setActive(id);
            toast.success('Událost byla úspěšně aktivována');
            await Promise.all([
                loadEventData(),
                loadActiveEvent()
            ]);
        } catch (error) {
            console.error('Failed to set event as active:', error);
            toast.error('Nepodařilo se aktivovat událost');
        }
    };

    const handleDeactivate = async () => {
        if (!id) return;
        
        try {
            await eventService.deactivate(id);
            toast.success('Událost byla úspěšně deaktivována');
            await Promise.all([
                loadEventData(),
                loadActiveEvent()
            ]);
        } catch (error) {
            console.error('Failed to deactivate event:', error);
            toast.error('Nepodařilo se deaktivovat událost');
        }
    };

    const handleEvaluateEvent = async () => {
        if (!id || !event) return;
        
        try {
            // End the event first
            await eventService.endEvent(id);
            
            // Navigate to results page
            navigate(`/events/${id}/results`);
            
            toast.success('Událost byla úspěšně ukončena a vyhodnocena');
            
            // Reload data
            await Promise.all([
                loadEventData(),
                loadActiveEvent()
            ]);
        } catch (error) {
            console.error('Failed to evaluate event:', error);
            toast.error('Nepodařilo se vyhodnotit událost');
        }
    };

    if (!event) {
        return (
            <Container>
                <Box sx={{ width: '100%', mt: 4 }}>
                    <LinearProgress />
                </Box>
            </Container>
        );
    }

    const totalBeers = Object.values(eventBeerCounts).reduce((sum, count) => sum + count, 0);
    const averageBeersPerUser = users.length ? Math.round(totalBeers / users.length) : 0;
    const { mode } = useAppTheme();

    return (
        <Box sx={{ p: 3 }}>
            <PageHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Button
                            startIcon={<ArrowBackIcon />}
                            onClick={() => navigate('/events')}
                            sx={{ 
                                color: 'text.secondary',
                                textTransform: 'none',
                                minWidth: 'auto',
                                px: 1,
                                mr: -1,
                            }}
                        >
                            Zpět
                        </Button>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="h4" sx={{ fontWeight: 800 }}>
                                    {event.name}
                                </Typography>
                                {event.isActive && (
                                    <Chip
                                        label="Aktivní"
                                        size="small"
                                        color="success"
                                        sx={{
                                            fontWeight: 600,
                                            height: 24,
                                        }}
                                    />
                                )}
                            </Box>
                            {event.description && (
                                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                    {event.description}
                                </Typography>
                            )}
                            <Box sx={{ display: 'flex', gap: 3, mt: 1 }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TimeIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {format(new Date(event.startDate), 'PPp', { locale: cs })}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <GroupIcon fontSize="small" sx={{ color: 'text.secondary' }} />
                                    <Typography variant="body2" color="text.secondary">
                                        {users.length || 0} účastníků
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                }
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        {hasPermission([Permission.DELETE_EVENT]) && (
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => setDeleteEventOpen(true)}
                                sx={{
                                    borderRadius: tokens.borderRadius.md,
                                }}
                            >
                                Smazat událost
                            </Button>
                        )}
                        <Button
                            variant={event.isActive ? 'outlined' : 'contained'}
                            color={event.isActive ? 'error' : 'primary'}
                            startIcon={event.isActive ? undefined : <AddIcon />}
                            onClick={event.isActive ? handleDeactivate : handleSetActive}
                            sx={{
                                borderRadius: tokens.borderRadius.md,
                            }}
                        >
                            {event.isActive ? 'Deaktivovat' : 'Aktivovat'}
                        </Button>
                        {event.isActive && (
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={<TrendingUpIcon />}
                                onClick={handleEvaluateEvent}
                                sx={{
                                    borderRadius: tokens.borderRadius.md,
                                }}
                            >
                                Vyhodnotit
                            </Button>
                        )}
                    </Box>
                }
            />

            {/* Content Section */}
            <Box 
                sx={{ 
                    maxWidth: 1200, 
                    mx: 'auto',
                }}
            >
                {/* Stats Cards */}
                <Grid container spacing={3} mb={4}>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Celkem piv" value={totalBeers} icon={<BeerIcon />} color="primary" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Účastníci" value={users.length || 0} icon={<GroupIcon />} color="error" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Průměr na osobu" value={averageBeersPerUser} icon={<TrendingUpIcon />} color="success" />
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <MetricCard title="Sudy" value={event.barrels?.length || 0} icon={<FilterIcon />} color="warning" />
                    </Grid>
                </Grid>

                {/* Rest of the content */}
                <Grid container spacing={3}>
                    {/* Participants Section */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Paper 
                            sx={{ 
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: 'primary.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <GroupIcon sx={{ fontSize: 18, color: 'white' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                Účastníci
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                {users.length || 0} účastníků
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => setOpenUser(true)}
                                        sx={{ borderRadius: 1 }}
                                    >
                                        Přidat
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {users.map((user) => (
                                        <Box
                                            key={user.id}
                                            sx={{
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                transition: tokens.transitions.default,
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    bgcolor: 'primary.main',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <PersonIcon sx={{ fontSize: 20, color: 'white' }} />
                                            </Box>
                                            <Box flex={1} sx={{ minWidth: 0 }}>
                                                <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                                                    {user.username}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <BeerIcon sx={{ fontSize: 16, color: 'error.main' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                        {eventBeerCounts[user.id] ?? user.eventBeerCount ?? 0} piv
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Barrels Section */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Paper 
                            sx={{ 
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: 'warning.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <FilterIcon sx={{ fontSize: 18, color: 'white' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                Sudy
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                {event.barrels?.length || 0} sudů
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => setOpenBarrel(true)}
                                        sx={{ borderRadius: 1 }}
                                    >
                                        Přidat
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {event.barrels?.map((barrel) => (
                                        <Box
                                            key={barrel.id}
                                            sx={{
                                                p: 2,
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                borderRadius: 1,
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 2,
                                                transition: tokens.transitions.default,
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                },
                                            }}
                                        >
                                            <Box
                                                sx={{
                                                    width: 40,
                                                    height: 40,
                                                    borderRadius: '50%',
                                                    bgcolor: 'warning.main',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    flexShrink: 0,
                                                }}
                                            >
                                                <BarrelIcon sx={{ fontSize: 20, color: 'white' }} />
                                            </Box>
                                            <Box flex={1} sx={{ minWidth: 0 }}>
                                                <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                                                    Sud #{barrel.orderNumber}
                                                </Typography>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <BeerIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                        {barrel.size}L
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            {barrel.isActive && (
                                                <Chip 
                                                    label="Aktivní"
                                                    size="small"
                                                    color="success"
                                                    sx={{ flexShrink: 0 }}
                                                />
                                            )}
                                        </Box>
                                    ))}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Beer Pong Teams Section */}
                    <Grid item xs={12} md={6} lg={4}>
                        <Paper 
                            sx={{ 
                                borderRadius: 1,
                                bgcolor: 'background.paper',
                                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                border: '1px solid',
                                borderColor: 'divider',
                                height: '100%',
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Box
                                            sx={{
                                                width: 32,
                                                height: 32,
                                                borderRadius: '50%',
                                                bgcolor: 'success.main',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                            }}
                                        >
                                            <SportsBarIcon sx={{ fontSize: 18, color: 'white' }} />
                                        </Box>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                                                Beer Pong Týmy
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                                {eventTeams.length} týmů v poolu
                                            </Typography>
                                        </Box>
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        size="small"
                                        startIcon={<AddIcon />}
                                        onClick={() => {
                                            setOpenTeam(true);
                                            setTeamForm({ name: '', player1Id: '', player2Id: '' });
                                        }}
                                        sx={{ borderRadius: 1 }}
                                    >
                                        Přidat
                                    </Button>
                                </Box>

                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                                    {eventTeams.length === 0 ? (
                                        <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                                            <Typography variant="body2">
                                                Zatím nejsou vytvořeny žádné týmy. Přidejte tým do event poolu pro použití v turnajích.
                                            </Typography>
                                        </Box>
                                    ) : (
                                        eventTeams.map((team) => (
                                            <Box
                                                key={team.id}
                                                sx={{
                                                    p: 2,
                                                    border: '1px solid',
                                                    borderColor: 'divider',
                                                    borderRadius: 1,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 2,
                                                    transition: tokens.transitions.default,
                                                    '&:hover': {
                                                        bgcolor: 'action.hover',
                                                    },
                                                    position: 'relative',
                                                }}
                                            >
                                                <IconButton
                                                    size="small"
                                                    onClick={() => setDeleteTeamId(team.id)}
                                                    sx={{
                                                        position: 'absolute',
                                                        top: 4,
                                                        right: 4,
                                                        color: 'error.main',
                                                    }}
                                                >
                                                    <DeleteIcon fontSize="small" />
                                                </IconButton>
                                                <Box
                                                    sx={{
                                                        width: 40,
                                                        height: 40,
                                                        borderRadius: '50%',
                                                        bgcolor: 'success.main',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    <SportsBarIcon sx={{ fontSize: 20, color: 'white' }} />
                                                </Box>
                                                <Box flex={1} sx={{ minWidth: 0, pr: 3 }}>
                                                    <Typography fontWeight={700} sx={{ mb: 0.5 }}>
                                                        {team.name}
                                                    </Typography>
                                                    <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>
                                                        {team.player1?.username || team.player1?.name || [team.player1?.firstName, team.player1?.lastName].filter(Boolean).join(' ').trim() || 'N/A'} & {team.player2?.username || team.player2?.name || [team.player2?.firstName, team.player2?.lastName].filter(Boolean).join(' ').trim() || 'N/A'}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        ))
                                    )}
                                </Box>
                            </Box>
                        </Paper>
                    </Grid>
                </Grid>
            </Box>

            {/* Dialogs */}
            <Dialog open={openUser} onClose={() => setOpenUser(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Přidat účastníka</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Vyberte účastníka</InputLabel>
                            <Select
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                                label="Vyberte účastníka"
                            >
                                {users.map(user => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.username}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenUser(false)}>Zrušit</Button>
                    <Button 
                        variant="contained"
                        color="primary"
                        onClick={handleAddUser}
                        disabled={!selectedUser}
                    >
                        Přidat
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openBarrel} onClose={() => setOpenBarrel(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Přidat sud</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2 }}>
                        <FormControl fullWidth>
                            <InputLabel>Vyberte sud</InputLabel>
                            <Select
                                value={selectedBarrel}
                                onChange={(e) => setSelectedBarrel(e.target.value)}
                                label="Vyberte sud"
                            >
                                {barrels
                                    .filter(barrel => !event.barrels?.find(b => b.id === barrel.id))
                                    .map(barrel => (
                                        <MenuItem key={barrel.id} value={barrel.id}>
                                            {`Sud #${barrel.orderNumber} (${barrel.size}L)`}
                                        </MenuItem>
                                    ))
                                }
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenBarrel(false)}>Zrušit</Button>
                    <Button 
                        variant="contained"
                        color="primary"
                        onClick={handleAddBarrel}
                        disabled={!selectedBarrel}
                    >
                        Přidat
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Create Event Team Dialog */}
            <Dialog open={openTeam} onClose={() => setOpenTeam(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Vytvořit tým v event poolu</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Název týmu"
                            fullWidth
                            required
                            value={teamForm.name}
                            onChange={(e) => setTeamForm((prev) => ({ ...prev, name: e.target.value }))}
                        />
                        <FormControl fullWidth required>
                            <InputLabel>Hráč 1</InputLabel>
                            <Select
                                value={teamForm.player1Id}
                                label="Hráč 1"
                                onChange={(e) => setTeamForm((prev) => ({ ...prev, player1Id: e.target.value }))}
                            >
                                {users
                                    .filter(user => user.id !== teamForm.player2Id)
                                    .map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.name || user.firstName || user.username || 'Unknown'}
                                        </MenuItem>
                                    ))
                                }
                                {users.length === 0 && (
                                    <MenuItem disabled>Žádní účastníci v události</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                        <FormControl fullWidth required>
                            <InputLabel>Hráč 2</InputLabel>
                            <Select
                                value={teamForm.player2Id}
                                label="Hráč 2"
                                onChange={(e) => setTeamForm((prev) => ({ ...prev, player2Id: e.target.value }))}
                            >
                                {users
                                    .filter(user => user.id !== teamForm.player1Id)
                                    .map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.name || user.firstName || user.username || 'Unknown'}
                                        </MenuItem>
                                    ))
                                }
                                {users.length === 0 && (
                                    <MenuItem disabled>Žádní účastníci v události</MenuItem>
                                )}
                            </Select>
                        </FormControl>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenTeam(false)}>Zrušit</Button>
                    <Button 
                        variant="contained"
                        color="primary"
                        onClick={handleCreateTeam}
                        disabled={!teamForm.name.trim() || !teamForm.player1Id || !teamForm.player2Id}
                    >
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Team Confirmation Dialog */}
            <Dialog open={!!deleteTeamId} onClose={() => setDeleteTeamId(null)} maxWidth="xs" fullWidth>
                <DialogTitle>Smazat tým</DialogTitle>
                <DialogContent>
                    <Typography>
                        Opravdu chcete smazat tento tým z event poolu? Tato akce je nevratná.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteTeamId(null)}>Zrušit</Button>
                    <Button 
                        variant="contained"
                        color="error"
                        onClick={handleDeleteTeam}
                    >
                        Smazat
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Delete Event Confirmation Dialog */}
            <Dialog open={deleteEventOpen} onClose={() => !isDeleting && setDeleteEventOpen(false)} maxWidth="xs" fullWidth>
                <DialogTitle>Smazat událost</DialogTitle>
                <DialogContent>
                    <Typography>
                        Opravdu chcete smazat událost "{event.name}"? Tato akce je nevratná a smaže všechny související data.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteEventOpen(false)} disabled={isDeleting}>
                        Zrušit
                    </Button>
                    <Button 
                        variant="contained"
                        color="error"
                        onClick={handleDeleteEvent}
                        disabled={isDeleting}
                    >
                        {isDeleting ? 'Maže se...' : 'Smazat'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};