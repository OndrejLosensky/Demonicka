import React, { useState, useEffect, useCallback } from 'react';
import { 
    Button, 
    Grid, 
    Typography, 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    TextField, 
    DialogActions, 
    Box, 
    Chip, 
    Paper,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import type { Event } from '@demonicka/shared-types';
import { eventService } from '../../../services/eventService';
import { format } from 'date-fns';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { PageLoader } from '../../../components/ui/PageLoader';
import { 
    Add as AddIcon, 
    Person as PersonIcon, 
    FilterAlt as FilterIcon, 
    LocalBar as BeerIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { usePageTitle } from '../../../hooks/usePageTitle';
import { PageHeader } from '../../../components/ui/PageHeader';

export const Events: React.FC = () => {
    usePageTitle('Události');
    const [events, setEvents] = useState<Event[]>([]);
    const [eventBeerCounts, setEventBeerCounts] = useState<Record<string, Record<string, number>>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: null as Date | null,
    });
    const { loadActiveEvent } = useActiveEvent();
    const navigate = useNavigate();

    const loadEvents = useCallback(async () => {
        try {
            setIsLoading(true);
            const data = await eventService.getAllEvents();
            setEvents(data);
        } catch (error) {
            console.error('Failed to load events:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadEvents();
    }, [loadEvents]);

    const loadEventBeerCounts = useCallback(async () => {
        try {
            const counts: Record<string, Record<string, number>> = {};
            await Promise.all(
                events.map(async (event) => {
                    counts[event.id] = {};
                    await Promise.all(
                        event.users.map(async (user) => {
                            const count = await eventService.getUserEventBeerCount(event.id, user.id);
                            counts[event.id][user.id] = count;
                        })
                    );
                })
            );
            setEventBeerCounts(counts);
        } catch (error) {
            console.error('Failed to load event beer counts:', error);
        }
    }, [events]);

    useEffect(() => {
        if (events.length > 0) {
            loadEventBeerCounts();
        }
    }, [events, loadEventBeerCounts]);

    // Definitions moved above to useCallback

    const handleCreateEvent = async () => {
        try {
            await eventService.createEvent({
                name: newEvent.name,
                description: newEvent.description,
                startDate: newEvent.startDate.toISOString(),
                ...(newEvent.endDate && { endDate: newEvent.endDate.toISOString() }),
            });
            setOpen(false);
            await Promise.all([loadEvents(), loadActiveEvent()]);
            setNewEvent({ name: '', description: '', startDate: new Date(), endDate: null });
        } catch (error) {
            console.error('Failed to create event:', error);
        }
    };

    if (isLoading) {
        return <PageLoader message="Načítání událostí..." />;
    }

    return (
        <Box sx={{ p: 4 }}>
            <PageHeader
              title="Události"
              action={
                <Box display="flex" gap={2}>
                  <Button 
                    variant="contained" 
                    color="error"
                    onClick={() => setOpen(true)}
                    startIcon={<AddIcon />}
                    sx={{ px: 3, py: 1, borderRadius: 2, boxShadow: 1 }}
                  >
                    Vytvořit událost
                  </Button>
                  <Button
                    variant="outlined"
                    color="inherit"
                    onClick={() => navigate('/leaderboard')}
                    startIcon={<FilterIcon />}
                    sx={{ px: 3, py: 1, borderRadius: 2, borderColor: 'divider' }}
                  >
                    Žebříček
                  </Button>
                </Box>
              }
            />

            {/* Events Grid or Empty State */}
            {events.length > 0 ? (
                <Grid container spacing={3}>
                    {events.map((event) => {
                        const totalEventBeers = Object.values(eventBeerCounts[event.id] || {}).reduce((sum, count) => sum + count, 0);
                        
                        return (
                            <Grid item xs={12} md={6} lg={4} key={event.id}>
                                <Paper 
                                    elevation={2}
                                    onClick={() => navigate(`/events/${event.id}`)}
                                    sx={{ 
                                        borderRadius: 2,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s ease-in-out',
                                        '&:hover': {
                                            transform: 'translateY(-4px)',
                                        },
                                        bgcolor: 'background.paper',
                                    }}
                                >
                                    {/* Card Header */}
                                    <Box sx={{ p: 3, bgcolor: 'error.main', color: 'white' }}>
                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
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
                                        
                                        {/* Dates */}
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box 
                                                    component="span" 
                                                    sx={{ 
                                                        width: 6, 
                                                        height: 6, 
                                                        borderRadius: '50%', 
                                                        bgcolor: '#22C55E',
                                                    }} 
                                                />
                                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                    {format(new Date(event.startDate), 'dd.MM.yyyy HH:mm')}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Box 
                                                    component="span" 
                                                    sx={{ 
                                                        width: 6, 
                                                        height: 6, 
                                                        borderRadius: '50%', 
                                                        bgcolor: '#EF4444',
                                                    }} 
                                                />
                                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.8)' }}>
                                                    {event.endDate ? format(new Date(event.endDate), 'dd.MM.yyyy HH:mm') : '-'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Box>

                                    {/* Stats */}
                                    <Box sx={{ 
                                        p: 3,
                                        display: 'flex',
                                        gap: 3,
                                    }}>
                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <PersonIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Účastníci
                                                </Typography>
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {event.users?.length || 0}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <BeerIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Piva
                                                </Typography>
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {totalEventBeers}
                                            </Typography>
                                        </Box>

                                        <Box>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                <FilterIcon sx={{ fontSize: 20, color: 'text.secondary' }} />
                                                <Typography variant="body2" color="text.secondary">
                                                    Sudy
                                                </Typography>
                                            </Box>
                                            <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                                                {event.barrels?.length || 0}
                                            </Typography>
                                        </Box>
                                    </Box>
                                </Paper>
                            </Grid>
                        );
                    })}
                </Grid>
            ) : (
                <EmptyEventState />
            )}

            {/* Create Event Dialog */}
            <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Vytvořit novou událost</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <TextField
                            label="Název události"
                            fullWidth
                            value={newEvent.name}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                        />
                        <TextField
                            label="Popis"
                            fullWidth
                            multiline
                            rows={3}
                            value={newEvent.description}
                            onChange={(e) => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                        />
                        <DateTimePicker
                            label="Začátek"
                            value={newEvent.startDate}
                            onChange={(date) => date && setNewEvent(prev => ({ ...prev, startDate: date }))}
                        />
                        <DateTimePicker
                            label="Konec (volitelné)"
                            value={newEvent.endDate}
                            onChange={(date) => setNewEvent(prev => ({ ...prev, endDate: date }))}
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Zrušit</Button>
                    <Button 
                        variant="contained" 
                        color="error" 
                        onClick={handleCreateEvent}
                        disabled={!newEvent.name || !newEvent.startDate}
                    >
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
