import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
    Container,
    Grid,
    Typography,
    Card,
    Button,
    List,
    ListItem,
    ListItemText,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    Box,
    Chip,
    IconButton,
    Tooltip,
    Paper,
    LinearProgress,
    Stack,
} from '@mui/material';
import {
    Add as AddIcon,
    Delete as DeleteIcon,
    AccessTime as TimeIcon,
    Group as GroupIcon,
    LocalBar as BarIcon,
    CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { FaBeer } from 'react-icons/fa';
import type { Event } from '../types/event';
import type { User } from '../types/user';
import type { Barrel } from '../types/barrel';
import { eventService } from '../services/eventService';
import { userService } from '../services/userService';
import { barrelService } from '../services/barrelService';
import { format } from 'date-fns';
import { useActiveEvent } from '../contexts/ActiveEventContext';
import { useFeatureFlag } from '../hooks/useFeatureFlag';
import { FeatureFlagKey } from '../types/featureFlags';
import translations from '../locales/cs/events.json';

export const EventDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [event, setEvent] = useState<Event | null>(null);
    const [users, setUsers] = useState<User[]>([]);
    const [barrels, setBarrels] = useState<Barrel[]>([]);
    const [openUser, setOpenUser] = useState(false);
    const [openBarrel, setOpenBarrel] = useState(false);
    const [selectedUser, setSelectedUser] = useState('');
    const [selectedBarrel, setSelectedBarrel] = useState('');
    const { loadActiveEvent } = useActiveEvent();
    const showActiveEventFunctionality = useFeatureFlag(FeatureFlagKey.ACTIVE_EVENT_FUNCTIONALITY);

    useEffect(() => {
        if (id) {
            loadEventData();
            loadUsers();
            loadBarrels();
        }
    }, [id]);

    const loadEventData = async () => {
        try {
            if (id) {
                const data = await eventService.getEvent(id);
                setEvent(data);
            }
        } catch (error) {
            console.error('Failed to load event:', error);
        }
    };

    const loadUsers = async () => {
        try {
            const data = await userService.getAllUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        }
    };

    const loadBarrels = async () => {
        try {
            const data = await barrelService.getAllBarrels();
            setBarrels(data);
        } catch (error) {
            console.error('Failed to load barrels:', error);
        }
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

    const handleRemoveUser = async (userId: string) => {
        try {
            if (id) {
                await eventService.removeUser(id, userId);
                await loadEventData();
            }
        } catch (error) {
            console.error('Failed to remove user:', error);
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

    const handleRemoveBarrel = async (barrelId: string) => {
        try {
            if (id) {
                await eventService.removeBarrel(id, barrelId);
                await loadEventData();
            }
        } catch (error) {
            console.error('Failed to remove barrel:', error);
        }
    };

    const handleSetActive = async () => {
        try {
            if (id) {
                await eventService.setActive(id);
                await loadActiveEvent();
                await loadEventData();
            }
        } catch (error) {
            console.error('Failed to set event as active:', error);
        }
    };

    const handleEndEvent = async () => {
        try {
            if (id) {
                await eventService.endEvent(id);
                await loadEventData();
                await loadActiveEvent();
            }
        } catch (error) {
            console.error('Failed to end event:', error);
        }
    };

    if (!event) {
        return (
            <Container>
                <Box sx={{ width: '100%', mt: 4 }}>
                    <LinearProgress />
                    <Typography align="center" sx={{ mt: 2 }}>{translations.loading}</Typography>
                </Box>
            </Container>
        );
    }

    const availableUsers = users.filter(
        user => !event.users?.some(eventUser => eventUser.id === user.id)
    );

    const availableBarrels = barrels.filter(
        barrel => !event.barrels?.some(eventBarrel => eventBarrel.id === barrel.id)
    );

    const totalBeers = event.users?.reduce((sum, user) => sum + (user.beerCount || 0), 0) || 0;
    const totalBarrels = event.barrels?.length || 0;
    const averageBeersPerUser = event.users?.length ? (totalBeers / event.users.length).toFixed(1) : 0;

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* Header Section */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 4, 
                    mb: 4, 
                    background: 'linear-gradient(45deg, #1976d2 30%, #42a5f5 90%)',
                    color: 'white',
                    borderRadius: 3,
                    position: 'relative',
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ position: 'relative', zIndex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                        <Typography variant="h3" fontWeight="bold">{event.name}</Typography>
                        {event.isActive && (
                            <Chip
                                label={translations.status.active}
                                color="success"
                                sx={{ 
                                    fontSize: '1rem',
                                    bgcolor: 'rgba(255, 255, 255, 0.2)',
                                    color: 'white',
                                    '& .MuiChip-label': { px: 2 }
                                }}
                            />
                        )}
                    </Box>
                    {event.description && (
                        <Typography variant="h6" sx={{ mb: 3, opacity: 0.9 }}>
                            {event.description}
                        </Typography>
                    )}
                    <Stack direction="row" spacing={4} sx={{ color: 'white' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <CalendarIcon />
                            <Typography>
                                {format(new Date(event.startDate), 'dd.MM.yyyy HH:mm')}
                            </Typography>
                        </Box>
                        {event.endDate && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TimeIcon />
                                <Typography>
                                    {format(new Date(event.endDate), 'dd.MM.yyyy HH:mm')}
                                </Typography>
                            </Box>
                        )}
                    </Stack>
                </Box>
                {showActiveEventFunctionality && (
                    <Box sx={{ mt: 3, position: 'relative', zIndex: 1 }}>
                        {event.isActive ? (
                            <Button
                                variant="contained"
                                color="error"
                                onClick={handleEndEvent}
                                startIcon={<DeleteIcon />}
                                sx={{ 
                                    bgcolor: 'error.main',
                                    '&:hover': { bgcolor: 'error.dark' }
                                }}
                            >
                                {translations.actions.endEvent}
                            </Button>
                        ) : (
                            <Button
                                variant="contained"
                                onClick={handleSetActive}
                                startIcon={<AddIcon />}
                                sx={{ 
                                    bgcolor: 'success.main',
                                    '&:hover': { bgcolor: 'success.dark' }
                                }}
                            >
                                {translations.actions.setActive}
                            </Button>
                        )}
                    </Box>
                )}
                <Box 
                    sx={{ 
                        position: 'absolute',
                        right: -100,
                        bottom: -100,
                        width: 400,
                        height: 400,
                        borderRadius: '50%',
                        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%)',
                    }}
                />
            </Paper>

            {/* Statistics Section */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <GroupIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {event.users?.length || 0}
                        </Typography>
                        <Typography color="textSecondary">
                            {translations.stats.totalParticipants}
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <FaBeer style={{ fontSize: 35, color: '#1976d2', marginBottom: 16 }} />
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {totalBeers}
                        </Typography>
                        <Typography color="textSecondary">
                            {translations.stats.totalBeers}
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <BarIcon sx={{ fontSize: 40, color: 'primary.main', mb: 2 }} />
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {averageBeersPerUser}
                        </Typography>
                        <Typography color="textSecondary">
                            {translations.stats.averageBeers}
                        </Typography>
                    </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <Card sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                        <FaBeer style={{ fontSize: 35, color: '#1976d2', marginBottom: 16 }} />
                        <Typography variant="h4" fontWeight="bold" gutterBottom>
                            {totalBarrels}
                        </Typography>
                        <Typography color="textSecondary">
                            {translations.stats.totalBarrels}
                        </Typography>
                    </Card>
                </Grid>
            </Grid>

            {/* Main Content */}
            <Grid container spacing={4}>
                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <Box sx={{ p: 3 }}>
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 3,
                                borderBottom: 1,
                                borderColor: 'divider',
                                pb: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <GroupIcon color="primary" />
                                    <Typography variant="h6">{translations.sections.users}</Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    onClick={() => setOpenUser(true)}
                                    startIcon={<AddIcon />}
                                >
                                    {translations.actions.addUser}
                                </Button>
                            </Box>
                            {event.users && event.users.length > 0 ? (
                                <List>
                                    {event.users.map(user => (
                                        <ListItem
                                            key={user.id}
                                            sx={{
                                                borderRadius: 2,
                                                mb: 1,
                                                bgcolor: 'background.default',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                    transform: 'translateX(8px)'
                                                }
                                            }}
                                            secondaryAction={
                                                <Tooltip title={translations.actions.removeUser}>
                                                    <IconButton
                                                        edge="end"
                                                        color="error"
                                                        onClick={() => handleRemoveUser(user.id)}
                                                        sx={{ 
                                                            opacity: 0.6,
                                                            '&:hover': { opacity: 1 }
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                        {user.name}
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                                                        <FaBeer style={{ fontSize: 16, opacity: 0.8 }} />
                                                        <Typography variant="body2" sx={{ opacity: 0.8 }}>
                                                            {user.beerCount} {translations.stats.beers}
                                                        </Typography>
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                    <GroupIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
                                    <Typography>{translations.empty.users}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Card>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Card sx={{ height: '100%' }}>
                        <Box sx={{ p: 3 }}>
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'space-between', 
                                alignItems: 'center', 
                                mb: 3,
                                borderBottom: 1,
                                borderColor: 'divider',
                                pb: 2
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <BarIcon color="primary" />
                                    <Typography variant="h6">{translations.sections.barrels}</Typography>
                                </Box>
                                <Button
                                    variant="contained"
                                    onClick={() => setOpenBarrel(true)}
                                    startIcon={<AddIcon />}
                                >
                                    {translations.actions.addBarrel}
                                </Button>
                            </Box>
                            {event.barrels && event.barrels.length > 0 ? (
                                <List>
                                    {event.barrels.map(barrel => (
                                        <ListItem
                                            key={barrel.id}
                                            sx={{
                                                borderRadius: 2,
                                                mb: 1,
                                                bgcolor: 'background.default',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    bgcolor: 'action.hover',
                                                    transform: 'translateX(8px)'
                                                }
                                            }}
                                            secondaryAction={
                                                <Tooltip title={translations.actions.removeBarrel}>
                                                    <IconButton
                                                        edge="end"
                                                        color="error"
                                                        onClick={() => handleRemoveBarrel(barrel.id)}
                                                        sx={{ 
                                                            opacity: 0.6,
                                                            '&:hover': { opacity: 1 }
                                                        }}
                                                    >
                                                        <DeleteIcon />
                                                    </IconButton>
                                                </Tooltip>
                                            }
                                        >
                                            <ListItemText
                                                primary={
                                                    <Typography variant="subtitle1" fontWeight="medium">
                                                        {barrel.brand} - {barrel.size}l
                                                    </Typography>
                                                }
                                                secondary={
                                                    <Chip
                                                        label={translations.barrelStatus[barrel.status]}
                                                        size="small"
                                                        color={
                                                            barrel.status === 'FULL' ? 'success' :
                                                            barrel.status === 'TAPPED' ? 'warning' : 'error'
                                                        }
                                                        sx={{ mt: 1 }}
                                                    />
                                                }
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                            ) : (
                                <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                                    <BarIcon sx={{ fontSize: 48, opacity: 0.5, mb: 2 }} />
                                    <Typography>{translations.empty.barrels}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Card>
                </Grid>
            </Grid>

            {/* Dialogs */}
            <Dialog open={openUser} onClose={() => setOpenUser(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                    {translations.dialogs.addUser.title}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>{translations.dialogs.addUser.selectLabel}</InputLabel>
                        <Select
                            value={selectedUser}
                            onChange={(e) => setSelectedUser(e.target.value)}
                            label={translations.dialogs.addUser.selectLabel}
                        >
                            {availableUsers.map(user => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.name}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setOpenUser(false)}>
                        {translations.dialogs.common.cancel}
                    </Button>
                    <Button
                        onClick={handleAddUser}
                        variant="contained"
                        disabled={!selectedUser}
                    >
                        {translations.dialogs.common.add}
                    </Button>
                </DialogActions>
            </Dialog>

            <Dialog open={openBarrel} onClose={() => setOpenBarrel(false)} maxWidth="sm" fullWidth>
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                    {translations.dialogs.addBarrel.title}
                </DialogTitle>
                <DialogContent sx={{ mt: 2 }}>
                    <FormControl fullWidth>
                        <InputLabel>{translations.dialogs.addBarrel.selectLabel}</InputLabel>
                        <Select
                            value={selectedBarrel}
                            onChange={(e) => setSelectedBarrel(e.target.value)}
                            label={translations.dialogs.addBarrel.selectLabel}
                        >
                            {availableBarrels.map(barrel => (
                                <MenuItem key={barrel.id} value={barrel.id}>
                                    {`${barrel.size}l - ${barrel.brand}`}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions sx={{ p: 2.5, pt: 0 }}>
                    <Button onClick={() => setOpenBarrel(false)}>
                        {translations.dialogs.common.cancel}
                    </Button>
                    <Button
                        onClick={handleAddBarrel}
                        variant="contained"
                        disabled={!selectedBarrel}
                    >
                        {translations.dialogs.common.add}
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
}; 