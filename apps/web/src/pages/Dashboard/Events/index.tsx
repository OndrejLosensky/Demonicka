import React, { useMemo, useState, useEffect, useCallback } from 'react';
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
    Add as AddIcon, 
    Person as PersonIcon, 
    FilterAlt as FilterIcon, 
    LocalBar as BeerIcon,
    PageLoader,
} from '@demonicka/ui';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AccessTime as TimeIcon } from '@mui/icons-material';
import type { Event } from '@demonicka/shared-types';
import { eventService } from '../../../services/eventService';
import { format } from 'date-fns';
import { useActiveEvent } from '../../../contexts/ActiveEventContext';
import { EmptyEventState } from '../../../components/EmptyEventState';
import { useNavigate } from 'react-router-dom';
import { tokens } from '../../../theme/tokens';
import { getShadow } from '../../../theme/utils';
import { useAppTheme } from '../../../contexts/ThemeContext';
import { useDashboardHeaderSlots } from '../../../contexts/DashboardChromeContext';
import { notify } from '../../../notifications/notify';

export const Events: React.FC = () => {
    const { mode } = useAppTheme();
    const [events, setEvents] = useState<Event[]>([]);
    const [eventBeerCounts, setEventBeerCounts] = useState<Record<string, Record<string, number>>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [newEvent, setNewEvent] = useState({
        name: '',
        description: '',
        startDate: new Date(),
        endDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Default to tomorrow
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
            await notify.action(
              {
                id: `event:create:${newEvent.name.trim().toLowerCase() || 'new'}`,
                success: 'Událost byla vytvořena',
                error: (err) => {
                  const msg = notify.fromError(err);
                  return msg === 'Něco se pokazilo' ? 'Nepodařilo se vytvořit událost' : msg;
                },
              },
              () =>
                eventService.createEvent({
                  name: newEvent.name,
                  description: newEvent.description,
                  startDate: newEvent.startDate.toISOString(),
                  endDate: newEvent.endDate.toISOString(),
                }),
            );
            setOpen(false);
            await Promise.all([loadEvents(), loadActiveEvent()]);
            setNewEvent({ name: '', description: '', startDate: new Date(), endDate: null });
        } catch (error) {
            console.error('Failed to create event:', error);
        }
    };

    const headerAction = useMemo(
      () => (
        <Box display="flex" gap={2}>
          <Button 
            variant="contained" 
            color="primary"
            onClick={() => setOpen(true)}
            startIcon={<AddIcon />}
            sx={{ px: 3, py: 1, borderRadius: tokens.borderRadius.md }}
          >
            Vytvořit událost
          </Button>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => navigate('/leaderboard')}
            startIcon={<FilterIcon />}
            sx={{ px: 3, py: 1, borderRadius: tokens.borderRadius.md, borderColor: 'divider' }}
          >
            Žebříček
          </Button>
        </Box>
      ),
      [navigate],
    );
    useDashboardHeaderSlots({ action: headerAction });

    if (isLoading) {
        return <PageLoader message="Načítání událostí..." />;
    }

    return (
        <Box sx={{ p: 0 }}>
            {/* Events Grid or Empty State */}
            {events.length > 0 ? (
                <Grid container spacing={3}>
                    {events.map((event) => {
                        const totalEventBeers = Object.values(eventBeerCounts[event.id] || {}).reduce((sum, count) => sum + count, 0);
                        
                        return (
                            <Grid item xs={12} md={6} lg={4} key={event.id}>
                                <Paper 
                                    onClick={() => navigate(`/dashboard/events/${event.id}`)}
                                    sx={{ 
                                        borderRadius: 1,
                                        overflow: 'hidden',
                                        cursor: 'pointer',
                                        position: 'relative',
                                        transition: 'all 0.2s ease-in-out',
                                        boxShadow: '0 2px 4px rgba(0,0,0,0.06)',
                                        border: '1px solid',
                                        borderColor: 'divider',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        bgcolor: 'background.paper',
                                        background: event.isActive 
                                            ? 'linear-gradient(135deg, rgba(255,59,48,0.35) 0%, rgba(255,59,48,0.18) 30%, rgba(255,59,48,0.08) 60%, rgba(255,59,48,0.02) 100%)'
                                            : 'linear-gradient(135deg, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.06) 30%, rgba(0,0,0,0.02) 60%, transparent 100%)',
                                        borderLeft: event.isActive ? '3px solid' : '1px solid',
                                        borderLeftColor: event.isActive ? 'primary.main' : 'divider',
                                        '&:hover': {
                                            transform: 'translateY(-2px)',
                                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                                        },
                                    }}
                                >
                                    {/* Stats badges - top right corner */}
                                    <Box
                                        sx={{
                                            position: 'absolute',
                                            top: 12,
                                            right: 12,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: 0.75,
                                            alignItems: 'flex-end',
                                            zIndex: 1,
                                        }}
                                    >
                                        <Chip
                                            size="small"
                                            label={`${event.users?.length || 0} účastníků`}
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                fontWeight: 500,
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                                color: 'text.primary',
                                                '& .MuiChip-label': {
                                                    px: 1,
                                                },
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            label={`${totalEventBeers} piv`}
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                fontWeight: 500,
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                                color: 'text.primary',
                                                '& .MuiChip-label': {
                                                    px: 1,
                                                },
                                            }}
                                        />
                                        <Chip
                                            size="small"
                                            label={`${event.barrels?.length || 0} sudů`}
                                            sx={{
                                                height: 20,
                                                fontSize: '0.7rem',
                                                fontWeight: 500,
                                                bgcolor: 'rgba(255,255,255,0.9)',
                                                color: 'text.primary',
                                                '& .MuiChip-label': {
                                                    px: 1,
                                                },
                                            }}
                                        />
                                    </Box>

                                    {/* Active indicator - top left */}
                                    {event.isActive && (
                                        <Box
                                            sx={{
                                                position: 'absolute',
                                                top: 12,
                                                left: 12,
                                                width: 6,
                                                height: 6,
                                                borderRadius: '50%',
                                                bgcolor: 'success.main',
                                                zIndex: 1,
                                            }}
                                        />
                                    )}

                                    {/* Content */}
                                    <Box sx={{ p: 3, pt: 4, flex: 1, display: 'flex', flexDirection: 'column' }}>
                                        {/* Title */}
                                        <Typography 
                                            variant="h5" 
                                            sx={{ 
                                                fontWeight: 700, 
                                                mb: 2,
                                                pr: 12,
                                                lineHeight: 1.3,
                                                color: 'text.primary',
                                            }}
                                        >
                                            {event.name}
                                        </Typography>

                                        {/* Dates - minimalistic */}
                                        <Box sx={{ mt: 'auto', display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 500 }}>
                                                {format(new Date(event.startDate), 'dd.MM.yyyy HH:mm')}
                                            </Typography>
                                            {event.endDate && (
                                                <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.85rem', fontWeight: 400, opacity: 0.8 }}>
                                                    {format(new Date(event.endDate), 'dd.MM.yyyy HH:mm')}
                                                </Typography>
                                            )}
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
                            label="Konec"
                            value={newEvent.endDate}
                            onChange={(date) => date && setNewEvent(prev => ({ ...prev, endDate: date }))}
                            minDateTime={newEvent.startDate}
                            required
                        />
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpen(false)}>Zrušit</Button>
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={handleCreateEvent}
                        disabled={!newEvent.name || !newEvent.startDate || !newEvent.endDate}
                    >
                        Vytvořit
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
