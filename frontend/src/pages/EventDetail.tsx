import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Container,
    Grid,
    Card,
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
} from '@mui/material';
import {
    Person as PersonIcon,
    FilterAlt as FilterIcon,
    Add as AddIcon,
    ArrowBack as ArrowBackIcon,
    Circle as CircleIcon,
    TrendingUp as TrendingUpIcon,
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

export const EventDetail: React.FC = () => {
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

    useEffect(() => {
        if (id) {
            loadEventData();
            loadUsers();
            loadBarrels();
        }
    }, [id]);

    useEffect(() => {
        if (id && event?.users) {
            loadEventBeerCounts();
        }
    }, [id, event?.users]);

    const loadEventData = async () => {
        if (!id) return;
        try {
            const data = await eventService.getEvent(id);
            setEvent(data);
            await loadEventBeerCounts();
        } catch (error) {
            console.error('Failed to load event:', error);
            toast.error('Nepodařilo se načíst událost');
        }
    };

    const loadUsers = async () => {
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
            toast.error('Nepodařilo se načíst uživatele');
        }
    };

    const loadBarrels = async () => {
        try {
            const barrels = await barrelService.getAll();
            setBarrels(barrels);
        } catch (error) {
            console.error('Failed to load barrels:', error);
            toast.error('Nepodařilo se načíst sudy');
        }
    };

    const loadEventBeerCounts = async () => {
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
    };

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
        <Container maxWidth="xl">
            {/* Back Button */}
            <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate('/events')}
                sx={{ mb: 3, color: 'text.secondary', textTransform: 'none' }}
            >
                Zpět na události
            </Button>

            {/* Header Card */}
            <Card 
                sx={{ 
                    mb: 4,
                    borderRadius: 4,
                    background: 'linear-gradient(135deg, #FF6B6B 0%, #FFF5F5 100%)',
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                <Box sx={{ p: 4, color: 'white', position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ width: 48, height: 48, bgcolor: 'rgba(255, 255, 255, 0.2)' }}>
                                <FilterIcon />
                            </Avatar>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                                {event.name}
                            </Typography>
                        </Box>
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
                        <Box sx={{ flex: 1 }} />
                        <Button
                            variant="contained"
                            startIcon={event.isActive ? undefined : <AddIcon />}
                            onClick={event.isActive ? handleDeactivate : handleSetActive}
                            sx={{
                                bgcolor: event.isActive ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.2)',
                                color: 'white',
                                '&:hover': {
                                    bgcolor: event.isActive ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 255, 255, 0.3)',
                                },
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            {event.isActive ? 'Deaktivovat událost' : 'Aktivovat událost'}
                        </Button>
                    </Box>

                    <Grid container spacing={4}>
                        <Grid item>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                    Začátek
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ 
                                        width: 6, 
                                        height: 6, 
                                        borderRadius: '50%', 
                                        bgcolor: '#4ADE80',
                                        mt: '1px'
                                    }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                        {format(new Date(event.startDate), 'dd.MM.yyyy HH:mm', { locale: cs })}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                    Konec
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box sx={{ 
                                        width: 6, 
                                        height: 6, 
                                        borderRadius: '50%', 
                                        bgcolor: '#F87171',
                                        mt: '1px'
                                    }} />
                                    <Typography variant="h6" sx={{ fontWeight: 500 }}>
                                        {event.endDate ? format(new Date(event.endDate), 'dd.MM.yyyy HH:mm', { locale: cs }) : '-'}
                                    </Typography>
                                </Box>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Card>

            {/* Stats Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                bgcolor: '#EEF2FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <PersonIcon sx={{ color: '#6366F1' }} />
                            </Box>
                            <Typography color="text.secondary">Celkem účastníků</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {event.users?.length || 0}
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                bgcolor: '#FEF3C7',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <CircleIcon sx={{ color: '#F59E0B' }} />
                            </Box>
                            <Typography color="text.secondary">Celkem piv</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {totalBeers}
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                bgcolor: '#ECFDF5',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <TrendingUpIcon sx={{ color: '#10B981' }} />
                            </Box>
                            <Typography color="text.secondary">Průměr piv na osobu</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {averageBeersPerUser}
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, borderRadius: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                            <Box sx={{ 
                                width: 40, 
                                height: 40, 
                                borderRadius: '50%', 
                                bgcolor: '#F3E8FF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <FilterIcon sx={{ color: '#9333EA' }} />
                            </Box>
                            <Typography color="text.secondary">Celkem sudů</Typography>
                        </Box>
                        <Typography variant="h3" sx={{ fontWeight: 'bold' }}>
                            {event.barrels?.length || 0}
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* Lists Section */}
            <Grid container spacing={4}>
                {/* Users List */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3 }}>
                        <Box sx={{ 
                            p: 3, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <PersonIcon sx={{ color: 'text.secondary' }} />
                                <Typography variant="h6">Účastníci</Typography>
                            </Box>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => setOpenUser(true)}
                                sx={{ 
                                    bgcolor: '#F3F4F6',
                                    color: 'text.primary',
                                    '&:hover': {
                                        bgcolor: '#E5E7EB',
                                    },
                                }}
                            >
                                Přidat
                            </Button>
                        </Box>
                        <Box sx={{ p: 2 }}>
                            {event.users?.map((user) => (
                                <Box
                                    key={user.id}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.02)',
                                        },
                                        borderRadius: 2,
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: '#6366F1' }}>
                                        {user.username?.charAt(0).toUpperCase() || '?'}
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            {user.username || 'Neznámý uživatel'}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {eventBeerCounts[user.id] || 0} piv
                                        </Typography>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Card>
                </Grid>

                {/* Barrels List */}
                <Grid item xs={12} md={6}>
                    <Card sx={{ borderRadius: 3 }}>
                        <Box sx={{ 
                            p: 3, 
                            display: 'flex', 
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FilterIcon sx={{ color: 'text.secondary' }} />
                                <Typography variant="h6">Sudy</Typography>
                            </Box>
                            <Button
                                startIcon={<AddIcon />}
                                onClick={() => setOpenBarrel(true)}
                                sx={{ 
                                    bgcolor: '#F3F4F6',
                                    color: 'text.primary',
                                    '&:hover': {
                                        bgcolor: '#E5E7EB',
                                    },
                                }}
                            >
                                Přidat
                            </Button>
                        </Box>
                        <Box sx={{ p: 2 }}>
                            {event.barrels?.map((barrel) => (
                                <Box
                                    key={barrel.id}
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        '&:hover': {
                                            bgcolor: 'rgba(0, 0, 0, 0.02)',
                                        },
                                        borderRadius: 2,
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: '#F3E8FF', color: '#9333EA' }}>
                                        <FilterIcon />
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                                            {`${barrel.size}L Sud #${barrel.orderNumber}`}
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                {barrel.remainingBeers} / {barrel.totalBeers} piv
                                            </Typography>
                                            <Box sx={{ width: '100%', mt: 1 }}>
                                                <LinearProgress 
                                                    variant="determinate" 
                                                    value={(barrel.remainingBeers / barrel.totalBeers) * 100}
                                                    sx={{
                                                        height: 6,
                                                        borderRadius: 3,
                                                        bgcolor: '#F3F4F6',
                                                        '& .MuiLinearProgress-bar': {
                                                            bgcolor: '#10B981',
                                                        }
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    </Box>
                                </Box>
                            ))}
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialogs */}
            <Dialog open={openUser} onClose={() => setOpenUser(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Přidat účastníka</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Vyberte účastníka</InputLabel>
                        <Select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            label="Vyberte účastníka"
                        >
                            {users
                                .filter(user => !event.users?.some(eventUser => eventUser.id === user.id))
                                .map(user => (
                                    <MenuItem key={user.id} value={user.id}>
                                        {user.name || user.username}
                                    </MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenUser(false)}>Zrušit</Button>
                    <Button 
                        variant="contained"
                        onClick={handleAddUser}
                        disabled={!selectedUser}
                    >
                        Přidat
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openBarrel} onClose={() => setOpenBarrel(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Přidat sud</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth sx={{ mt: 2 }}>
                        <InputLabel>Vyberte sud</InputLabel>
                        <Select
                            value={selectedBarrel}
                            onChange={(e) => setSelectedBarrel(e.target.value)}
                            label="Vyberte sud"
                        >
                            {barrels
                                .filter(barrel => !event.barrels?.some(eventBarrel => eventBarrel.id === barrel.id))
                                .map(barrel => (
                                    <MenuItem key={barrel.id} value={barrel.id}>
                                        {`${barrel.size}L Sud #${barrel.orderNumber}`}
                                    </MenuItem>
                                ))
                            }
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2 }}>
                    <Button onClick={() => setOpenBarrel(false)}>Zrušit</Button>
                    <Button 
                        variant="contained"
                        onClick={handleAddBarrel}
                        disabled={!selectedBarrel}
                    >
                        Přidat
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 