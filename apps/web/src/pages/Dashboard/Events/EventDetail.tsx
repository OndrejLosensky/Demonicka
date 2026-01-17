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
} from '@demonicka/ui';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { eventService } from '../../../services/eventService';
import { barrelService } from '../../../services/barrelService';
import { userService } from '../../../services/userService';
import type { Event, User, Barrel } from '@demonicka/shared-types';
import { toast } from 'react-hot-toast';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { tokens } from '../../../theme/tokens';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { getShadow } from '../../../theme/utils';

export const EventDetail: React.FC = () => {
    usePageTitle('Detail události');
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [barrels, setBarrels] = useState<Barrel[]>([]);
    const [eventBeerCounts, setEventBeerCounts] = useState<Record<string, number>>({});
    const [openUser, setOpenUser] = useState(false);
    const [openBarrel, setOpenBarrel] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedBarrel, setSelectedBarrel] = useState('');
    const { loadActiveEvent } = useActiveEvent();

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
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
            toast.error('Nepodařilo se načíst uživatele');
        }
    }, []);

    const loadBarrels = useCallback(async () => {
        try {
            const barrels = await barrelService.getAll();
            setBarrels(barrels);
        } catch (error) {
            console.error('Failed to load barrels:', error);
            toast.error('Nepodařilo se načíst sudy');
        }
    }, []);

    useEffect(() => {
        if (id) {
            loadEventData();
            loadUsers();
            loadBarrels();
        }
    }, [id, loadEventData, loadUsers, loadBarrels]);

    const loadEventBeerCounts = useCallback(async () => {
        if (!id || !event?.users) return;
        const counts: Record<string, number> = {};
        await Promise.all(
            event.users.map(async (user) => {
                try {
                    const count = await eventService.getUserEventBeerCount(id, user.id);
                    counts[user.id] = count;
                } catch (error) {
                    console.error(`Failed to load beer count for user ${user.id}:`, error);
                }
            })
        );
        setEventBeerCounts(counts);
    }, [id, event?.users]);

    useEffect(() => {
        if (id && event?.users) {
            loadEventBeerCounts();
        }
    }, [id, event?.users, loadEventBeerCounts]);

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
    const averageBeersPerUser = event.users?.length ? Math.round(totalBeers / event.users.length) : 0;
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
                                        {event.users?.length || 0} účastníků
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Box>
                }
                action={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
                        <MetricCard title="Účastníci" value={event.users?.length || 0} icon={<GroupIcon />} color="error" />
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
                    <Grid item xs={12} md={6}>
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
                                                {event.users?.length || 0} účastníků
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
                                    {event.users?.map((user) => (
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
                                                        {eventBeerCounts[user.id] || 0} piv
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
                    <Grid item xs={12} md={6}>
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
                                {users
                                    .filter(user => !event.users?.find(u => u.id === user.id))
                                    .map(user => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.username}
                                        </MenuItem>
                                    ))
                                }
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
        </Box>
    );
};