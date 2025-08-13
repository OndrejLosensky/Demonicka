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
} from '@mui/material';
import {
    FilterAlt as FilterIcon,
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    TrendingUp as TrendingUpIcon,
    LocalBar as BeerIcon,
    Group as GroupIcon,
    Timer as TimeIcon,
    Person as PersonIcon,
    Storage as BarrelIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { cs } from 'date-fns/locale';
import { eventService } from '../services/eventService';
import { barrelService } from '../services/barrelService';
import { userService } from '../services/userService';
import type { Event } from '../types/event';
import type { User } from '../types/user';
import type { Barrel } from '../types/barrel';
import { toast } from 'react-hot-toast';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { usePageTitle } from '../hooks/usePageTitle';
import { MetricCard } from '../components/ui/MetricCard';

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

    return (
        <Box>
            {/* Hero Section */}
            <Box 
                sx={{ 
                    bgcolor: 'error.main',
                    color: 'white',
                    pt: 8,
                    pb: 20,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ maxWidth: 1200, mx: 'auto', px: 4 }}>
                    {/* Back Button */}
                    <Button
                        startIcon={<ArrowBackIcon />}
                        onClick={() => navigate('/events')}
                        sx={{ 
                            color: 'white',
                            opacity: 0.8,
                            '&:hover': { opacity: 1 },
                            mb: 4,
                            textTransform: 'none',
                            pl: 0,
                        }}
                    >
                        Zpět na události
                    </Button>

                    <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
                        <Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                                <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                                    {event.name}
                                </Typography>
                                {event.isActive && (
                                    <Chip
                                        label="Aktivní"
                                        size="small"
                                        sx={{
                                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            fontWeight: 500,
                                            height: 24,
                                        }}
                                    />
                                )}
                            </Box>

                            {event.description && (
                                <Typography 
                                    variant="subtitle1" 
                                    sx={{ 
                                        opacity: 0.9,
                                        mb: 3,
                                        maxWidth: 800,
                                    }}
                                >
                                    {event.description}
                                </Typography>
                            )}

                            <Box sx={{ display: 'flex', gap: 4, color: 'rgba(255, 255, 255, 0.9)' }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <TimeIcon fontSize="small" />
                                    <Typography>
                                        {format(new Date(event.startDate), 'PPp', { locale: cs })}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <GroupIcon fontSize="small" />
                                    <Typography>
                                        {event.users?.length || 0} účastníků
                                    </Typography>
                                </Box>
                            </Box>
                        </Box>

                        <Button
                            variant="contained"
                            startIcon={event.isActive ? undefined : <AddIcon />}
                            onClick={event.isActive ? handleDeactivate : handleSetActive}
                            sx={{
                                bgcolor: 'background.paper',
                                color: 'error.main',
                                '&:hover': {
                                    bgcolor: 'rgba(255, 255, 255, 0.9)',
                                },
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                position: 'relative',
                                zIndex: 2,
                                minWidth: 'auto',
                                boxShadow: 1,
                                fontWeight: 500,
                            }}
                        >
                            {event.isActive ? 'Deaktivovat událost' : 'Aktivovat událost'}
                        </Button>
                    </Box>
                </Box>

                {/* Background Pattern */}
                <Box
                    sx={{
                        position: 'absolute',
                        right: -100,
                        bottom: -100,
                        width: 600,
                        height: 600,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        left: '10%',
                        top: '20%',
                        width: 300,
                        height: 300,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0) 70%)',
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                />
            </Box>

            {/* Content Section */}
            <Box 
                sx={{ 
                    maxWidth: 1200, 
                    mx: 'auto',
                    px: 4,
                    transform: 'translateY(-100px)',
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
                            elevation={2}
                            sx={{ 
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            Účastníci
                                        </Typography>
                                        <Chip 
                                            label={event.users?.length || 0}
                                            size="small"
                                            sx={{ bgcolor: '#F3F4F6' }}
                                        />
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<AddIcon />}
                                        onClick={() => setOpenUser(true)}
                                    >
                                        Přidat účastníka
                                    </Button>
                                </Box>

                                {event.users?.map((user) => (
                                    <Box
                                        key={user.id}
                                        sx={{
                                            p: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            mb: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                        }}
                                    >
                                        <Avatar sx={{ bgcolor: '#EEF2FF' }}>
                                            <PersonIcon sx={{ color: '#6366F1' }} />
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography fontWeight="bold">
                                                {user.username}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <BeerIcon sx={{ fontSize: '1rem', opacity: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {eventBeerCounts[user.id] || 0} piv
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>

                    {/* Barrels Section */}
                    <Grid item xs={12} md={6}>
                        <Paper 
                            elevation={2}
                            sx={{ 
                                borderRadius: 2,
                                bgcolor: 'background.paper',
                            }}
                        >
                            <Box sx={{ p: 3 }}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                            Sudy
                                        </Typography>
                                        <Chip 
                                            label={event.barrels?.length || 0}
                                            size="small"
                                            sx={{ bgcolor: '#F3F4F6' }}
                                        />
                                    </Box>
                                    <Button
                                        variant="contained"
                                        color="error"
                                        startIcon={<AddIcon />}
                                        onClick={() => setOpenBarrel(true)}
                                    >
                                        Přidat sud
                                    </Button>
                                </Box>

                                {event.barrels?.map((barrel) => (
                                    <Box
                                        key={barrel.id}
                                        sx={{
                                            p: 2,
                                            border: '1px solid',
                                            borderColor: 'divider',
                                            borderRadius: 2,
                                            mb: 2,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 2,
                                        }}
                                    >
                                        <Avatar sx={{ bgcolor: '#FEF3C7' }}>
                                            <BarrelIcon sx={{ color: '#D97706' }} />
                                        </Avatar>
                                        <Box flex={1}>
                                            <Typography fontWeight="bold">
                                                {`Sud #${barrel.orderNumber}`}
                                            </Typography>
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <BeerIcon sx={{ fontSize: '1rem', opacity: 0.5 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    {barrel.size}L
                                                </Typography>
                                            </Box>
                                        </Box>
                                        {barrel.isActive && (
                                            <Chip 
                                                label="Aktivní"
                                                size="small"
                                                color="success"
                                            />
                                        )}
                                    </Box>
                                ))}
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
                        color="error"
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
                        color="error"
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